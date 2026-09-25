import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { DatabaseService, initRealtimeCloudSync } from '../services/db';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (identity: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginStudentWithNIS: (nisOrName: string, pass?: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (uid: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setCurrentUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_SESSION_KEY = 'pjok_active_session_uid';

/**
 * Logika pengecekan peran 'guru' vs 'murid' yang merujuk ke koleksi 'pengguna' di Firestore.
 * Mengambil data dokumen pengguna dari Firestore ('pengguna/{uid}'), menentukan hak akses,
 * dan mengembalikan profil pengguna terverifikasi.
 */
async function checkRoleFromFirestorePengguna(
  fbUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<UserProfile> {
  // 1. Cek langsung dokumen berdasarkan UID di koleksi 'pengguna' Firestore
  if (db && isFirebaseConfigured()) {
    try {
      const penggunaDocRef = doc(db, 'pengguna', fbUser.uid);
      const penggunaSnap = await getDoc(penggunaDocRef);

      if (penggunaSnap.exists()) {
        const data = penggunaSnap.data() as UserProfile;
        // Pengecekan eksplisit nilai role: 'guru' vs 'murid'
        const role: UserRole = data.role === 'guru' ? 'guru' : 'murid';
        return {
          ...data,
          uid: fbUser.uid,
          role
        };
      }

      // 2. Jika dokumen dengan UID belum ada, cari berdasarkan email di koleksi 'pengguna'
      if (fbUser.email) {
        const cleanEmail = fbUser.email.toLowerCase().trim();
        const qEmail = query(collection(db, 'pengguna'), where('email', '==', cleanEmail));
        const emailSnap = await getDocs(qEmail);

        if (!emailSnap.empty) {
          const docData = emailSnap.docs[0].data() as UserProfile;
          const role: UserRole = docData.role === 'guru' ? 'guru' : 'murid';
          const syncedProfile: UserProfile = {
            ...docData,
            uid: fbUser.uid,
            role
          };
          // Sinkronkan ke dokumen UID pengguna
          await setDoc(doc(db, 'pengguna', fbUser.uid), syncedProfile, { merge: true });
          return syncedProfile;
        }
      }
    } catch (err) {
      console.warn('Pengecekan koleksi pengguna di Firestore menghasilkan catatan:', err);
    }
  }

  // 3. Fallback: periksa pengguna terdaftar lokal / seed users
  const localUsers = await DatabaseService.getUsers();
  const matchedUser = localUsers.find(
    (u) =>
      u.uid === fbUser.uid ||
      (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
  );

  if (matchedUser) {
    const role: UserRole = matchedUser.role === 'guru' ? 'guru' : 'murid';
    const profile: UserProfile = {
      ...matchedUser,
      uid: fbUser.uid,
      role
    };
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'pengguna', fbUser.uid), profile, { merge: true });
      } catch (e) {
        console.warn('Gagal menyimpan profil ke Firestore pengguna:', e);
      }
    }
    return profile;
  }

  // 4. Jika akun baru (misal login Google pertama kali), tentukan peran otomatis
  const isTeacher =
    fbUser.email?.toLowerCase() === 'agusaryadevaudayana19@gmail.com' ||
    fbUser.email?.toLowerCase() === 'novaanggarawan88@gmail.com' ||
    fbUser.email?.toLowerCase().includes('anggarawan') ||
    fbUser.email?.toLowerCase().includes('guru') ||
    Boolean(fbUser.email?.toLowerCase().endsWith('.sch.id') && !fbUser.email?.toLowerCase().includes('siswa'));

  const determinedRole: UserRole = isTeacher ? 'guru' : 'murid';
  const newProfile: UserProfile = {
    uid: fbUser.uid,
    nama: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Pengguna PJOK'),
    email: fbUser.email || '',
    role: determinedRole,
    status: 'aktif',
    fotoProfil: fbUser.photoURL || '',
    createdAt: new Date().toISOString()
  };

  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'pengguna', fbUser.uid), newProfile, { merge: true });
    } catch (e) {
      console.warn('Gagal membuat dokumen baru di koleksi pengguna:', e);
    }
  }

  return newProfile;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Pasang sinkronisasi realtime hanya jika pengguna sudah berhasil masuk (menghemat kuota pembacaan Firestore)
  useEffect(() => {
    if (currentUser) {
      initRealtimeCloudSync();
    }
  }, [currentUser]);

  // Inisialisasi status sesi pengguna
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setLoading(true);

      // Jika Firebase Auth tersedia, pasang listener status autentikasi
      if (isFirebaseConfigured() && auth) {
        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (!isMounted) return;

          if (firebaseUser) {
            try {
              // Verifikasi peran 'guru' vs 'murid' dari koleksi 'pengguna' di Firestore
              const profile = await checkRoleFromFirestorePengguna(firebaseUser);
              if (profile.status === 'nonaktif') {
                if (auth) {
                  await signOut(auth);
                }
                setCurrentUser(null);
                localStorage.removeItem(LS_SESSION_KEY);
              } else {
                setCurrentUser(profile);
                localStorage.setItem(LS_SESSION_KEY, profile.uid);
              }
            } catch (error) {
              console.error('Gagal mengecek peran pengguna:', error);
              setCurrentUser(null);
            }
          } else {
            // Jika tidak ada login Firebase Auth aktif, periksa sesi lokal (misal siswa dengan NIS)
            await checkLocalSession();
          }
          if (isMounted) setLoading(false);
        });
      } else {
        await checkLocalSession();
        if (isMounted) setLoading(false);
      }
    };

    const checkLocalSession = async () => {
      const savedUid = localStorage.getItem(LS_SESSION_KEY);
      if (savedUid) {
        // Cek pengguna dari Firestore pengguna atau database service
        const user = await DatabaseService.getUser(savedUid);
        if (user && user.status !== 'nonaktif') {
          setCurrentUser(user);
          return;
        }
      }
      // Jangan paksa login otomatis agar halaman LoginPage muncul secara semestinya
      setCurrentUser(null);
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login dengan Akun Google menggunakan Firebase Authentication (Popup)
   * Dilanjutkan dengan pengecekan peran 'guru' vs 'murid' di koleksi 'pengguna' Firestore
   */
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    if (!isFirebaseConfigured() || !auth) {
      return {
        success: false,
        message: 'Konfigurasi Firebase Authentication belum lengkap atau tidak tersedia.'
      };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Pengecekan peran merujuk ke koleksi 'pengguna' di Firestore
      const profile = await checkRoleFromFirestorePengguna(fbUser);

      if (profile.status === 'nonaktif') {
        if (auth) {
          await signOut(auth);
        }
        return {
          success: false,
          message: 'Akun Anda berstatus nonaktif. Silakan hubungi Guru PJOK.'
        };
      }

      setCurrentUser(profile);
      localStorage.setItem(LS_SESSION_KEY, profile.uid);
      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Jendela login Google ditutup sebelum proses selesai.' };
      }
      if (error?.code === 'auth/cancelled-popup-request') {
        return { success: false, message: 'Permintaan login dibatalkan.' };
      }
      return {
        success: false,
        message: error?.message || 'Gagal masuk dengan Google. Silakan coba lagi.'
      };
    }
  };

  /**
   * Login dengan Email & Password menggunakan Firebase Authentication
   * Dilanjutkan dengan pengecekan peran di koleksi 'pengguna' Firestore
   */
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured() && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUser = userCred.user;

        // Pengecekan peran di koleksi 'pengguna' Firestore
        const profile = await checkRoleFromFirestorePengguna(fbUser);

        if (profile.status === 'nonaktif') {
          if (auth) {
            await signOut(auth);
          }
          return {
            success: false,
            message: 'Akun Anda berstatus nonaktif. Silakan hubungi Guru PJOK.'
          };
        }

        setCurrentUser(profile);
        localStorage.setItem(LS_SESSION_KEY, profile.uid);
        return { success: true };
      } catch (err: any) {
        console.warn('Firebase Email Sign-In notice:', err?.code, err?.message);

        // Jika error terkait user belum terdaftar di Firebase Auth Email Provider,
        // periksa langsung ke Firestore koleksi 'pengguna' (misal akun guru seed)
        if (
          err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/wrong-password' ||
          err?.code === 'auth/operation-not-allowed'
        ) {
          const fallbackRes = await checkDirectFirestorePengguna(cleanEmail, pass);
          if (fallbackRes.success) return fallbackRes;

          let msg = 'Email atau kata sandi tidak cocok.';
          if (err?.code === 'auth/operation-not-allowed') {
            msg = 'Penyedia Email/Password belum aktif di Firebase Console. Gunakan tombol "Masuk dengan Google" atau periksa kredensial Anda.';
          }
          return { success: false, message: msg };
        }

        return {
          success: false,
          message: err?.message || 'Gagal masuk dengan email & kata sandi.'
        };
      }
    }

    // Fallback jika Firebase belum siap
    return checkDirectFirestorePengguna(cleanEmail, pass);
  };

  /**
   * Login khusus Murid menggunakan NIS atau Nama
   * Memeriksa koleksi 'pengguna' di Firestore dan memastikan role = 'murid'
   */
  const loginStudentWithNIS = async (
    nisOrName: string,
    pass: string = '123456'
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanIdentity = nisOrName.trim().toLowerCase();
    if (!cleanIdentity) {
      return { success: false, message: 'Masukkan NIS atau nama siswa.' };
    }

    // Cari di koleksi 'pengguna' Firestore
    if (db && isFirebaseConfigured()) {
      try {
        // Cek query berdasarkan NIS
        const qNis = query(collection(db, 'pengguna'), where('nis', '==', cleanIdentity));
        const nisSnap = await getDocs(qNis);

        let studentData: UserProfile | null = null;
        if (!nisSnap.empty) {
          studentData = nisSnap.docs[0].data() as UserProfile;
        } else {
          // Cari semua pengguna di koleksi 'pengguna' untuk mencocokkan nama
          const allPengguna = await getDocs(collection(db, 'pengguna'));
          const foundDoc = allPengguna.docs.find((d) => {
            const data = d.data() as UserProfile;
            return (
              (data.nis && data.nis.toLowerCase() === cleanIdentity) ||
              data.nama.toLowerCase() === cleanIdentity ||
              data.email.toLowerCase() === cleanIdentity
            );
          });
          if (foundDoc) {
            studentData = foundDoc.data() as UserProfile;
          }
        }

        if (studentData) {
          // Validasi peran 'murid'
          if (studentData.role !== 'murid') {
            return {
              success: false,
              message: 'Akun ini terdaftar sebagai Guru. Silakan masuk melalui tab Guru.'
            };
          }

          if (studentData.status === 'nonaktif') {
            return {
              success: false,
              message: 'Akun Anda berstatus nonaktif. Silakan hubungi Guru PJOK.'
            };
          }

          // Cek password jika ada password yang ditentukan
          if (studentData.password && pass && studentData.password !== pass) {
            return { success: false, message: 'Kata sandi siswa tidak cocok (standar: 123456).' };
          }

          setCurrentUser(studentData);
          localStorage.setItem(LS_SESSION_KEY, studentData.uid);
          return { success: true };
        }
      } catch (err) {
        console.warn('Pencarian siswa di Firestore pengguna error:', err);
      }
    }

    // Fallback pencarian database lokal
    const all = await DatabaseService.getUsers();
    const match = all.find(
      (u) =>
        u.role === 'murid' &&
        (u.nis?.toLowerCase() === cleanIdentity ||
          u.nama.toLowerCase() === cleanIdentity ||
          u.email.toLowerCase() === cleanIdentity)
    );

    if (match) {
      if (match.status === 'nonaktif') {
        return { success: false, message: 'Akun Anda berstatus nonaktif.' };
      }
      if (match.password && pass && match.password !== pass) {
        return { success: false, message: 'Kata sandi siswa salah (standar: 123456).' };
      }
      setCurrentUser(match);
      localStorage.setItem(LS_SESSION_KEY, match.uid);
      return { success: true };
    }

    return {
      success: false,
      message: `Siswa dengan NIS/nama "${nisOrName}" tidak ditemukan di daftar pengguna.`
    };
  };

  /**
   * Helper pencarian langsung di Firestore koleksi 'pengguna' berdasarkan email/NIS/nama
   */
  const checkDirectFirestorePengguna = async (
    identity: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const allUsers = await DatabaseService.getUsers();
      const match = allUsers.find(
        (u) =>
          u.email.toLowerCase() === identity ||
          u.nama.toLowerCase() === identity ||
          (u.nis && u.nis.toLowerCase() === identity)
      );

      if (match) {
        if (match.status === 'nonaktif') {
          return {
            success: false,
            message: 'Akun Anda berstatus nonaktif. Silakan hubungi Guru PJOK.'
          };
        }
        if (match.password && pass && match.password !== pass) {
          return {
            success: false,
            message: 'Kata sandi tidak sesuai.'
          };
        }
        setCurrentUser(match);
        localStorage.setItem(LS_SESSION_KEY, match.uid);
        return { success: true };
      }

      return {
        success: false,
        message: 'Pengguna tidak ditemukan di koleksi pengguna. Periksa kembali email atau NIS Anda.'
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Terjadi kendala saat memvalidasi akun.' };
    }
  };

  /**
   * Fungsi login umum yang menerima identifier (username / email / NIS / nama) dan password.
   * Mendukung akun Guru dan Murid secara langsung dari satu formulir.
   */
  const login = async (identity: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const clean = identity.trim();
    if (!clean) {
      return { success: false, message: 'Silakan masukkan username atau NIS.' };
    }
    const cleanLower = clean.toLowerCase();
    const cleanNoSpace = cleanLower.replace(/[\s\-_.]/g, '');

    // Ambil daftar pengguna lengkap dari Cloud Firestore (pengguna & users) serta cache lokal
    const allUsers = await DatabaseService.getUsers();

    const isMatch = (u: UserProfile): boolean => {
      if (!u) return false;
      const uNamaLower = (u.nama || '').toLowerCase().trim();
      const uNamaNoSpace = uNamaLower.replace(/[\s\-_.]/g, '');
      const firstWord = uNamaLower.split(' ')[0] || '';
      const email = (u.email || '').toLowerCase().trim();
      const emailPrefix = email ? email.split('@')[0] : '';
      const emailPrefixNoSpace = emailPrefix.replace(/[\s\-_.]/g, '');
      const nis = (u.nis || '').toLowerCase().trim();
      const nisNoSpace = nis.replace(/[\s\-_.]/g, '');
      const nip = (u.nip || '').toLowerCase().trim();
      const uid = (u.uid || '').toLowerCase().trim();

      // Cocokkan Guru
      const isNovaMatch =
        (cleanLower === 'novaanggarawan' || cleanLower === 'novaanggarawan88' || cleanLower === 'nova') &&
        (email.includes('novaanggarawan') || uNamaLower.includes('nova') || uNamaLower.includes('anggarawan'));
      const isGuruMatch = cleanLower === 'guru' && u.role === 'guru';

      if (isNovaMatch || isGuruMatch) return true;

      // Cocokkan NIS
      if (nis && (nis === cleanLower || nisNoSpace === cleanNoSpace)) return true;

      // Cocokkan Email atau Username sebelum @
      if (email && (email === cleanLower || emailPrefix === cleanLower || emailPrefixNoSpace === cleanNoSpace)) return true;

      // Cocokkan Nama Lengkap (dengan atau tanpa spasi: contoh "komangsukriyanti" cocok dengan "Komang Sukriyanti")
      if (uNamaLower && (uNamaLower === cleanLower || uNamaNoSpace === cleanNoSpace)) return true;

      // Cocokkan Nama Depan jika unik
      if (firstWord && firstWord.length >= 3 && firstWord === cleanLower) return true;

      // Cocokkan NIP atau UID
      if ((nip && nip === cleanLower) || (uid && uid === cleanLower)) return true;

      return false;
    };

    const matchedUser = allUsers.find(isMatch);

    if (matchedUser) {
      if (matchedUser.status === 'nonaktif') {
        return { success: false, message: 'Akun Anda berstatus nonaktif. Silakan hubungi Guru PJOK.' };
      }

      // Jika akun guru dan Firebase Auth tersedia dengan email, coba autentikasi
      if (matchedUser.role === 'guru' && matchedUser.email && auth && isFirebaseConfigured()) {
        try {
          const cred = await signInWithEmailAndPassword(auth, matchedUser.email, pass);
          if (cred.user) {
            const verified = await checkRoleFromFirestorePengguna(cred.user);
            setCurrentUser(verified);
            localStorage.setItem(LS_SESSION_KEY, verified.uid);
            return { success: true };
          }
        } catch {
          // Lanjut ke pengecekan sandi profil jika email belum terdaftar di Firebase Auth
        }
      }

      // Validasi kata sandi profil
      const expectedPass = matchedUser.password || (matchedUser.role === 'guru' ? 'guru123' : '123456');
      const inputPass = pass || (matchedUser.role === 'murid' ? '123456' : '');
      if (expectedPass && inputPass !== expectedPass) {
        return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali (Standar siswa: 123456).' };
      }

      setCurrentUser(matchedUser);
      localStorage.setItem(LS_SESSION_KEY, matchedUser.uid);
      return { success: true };
    }

    // Jika input berupa email lengkap dan Firebase Auth aktif
    if (clean.includes('@') && auth && isFirebaseConfigured()) {
      const emailRes = await loginWithEmail(clean, pass);
      if (emailRes.success) return emailRes;
    }

    return {
      success: false,
      message: `Pengguna dengan username/NIS "${identity}" tidak ditemukan. Pastikan NIS atau nama sudah didaftarkan oleh Guru PJOK.`
    };
  };

  /**
   * Login cepat (Persona Switcher) dengan membaca profil dari koleksi 'pengguna' di Firestore
   */
  const quickLogin = async (uid: string): Promise<boolean> => {
    try {
      // Baca langsung dari Firestore koleksi 'pengguna'
      let user: UserProfile | null = null;
      if (db && isFirebaseConfigured()) {
        const snap = await getDoc(doc(db, 'pengguna', uid));
        if (snap.exists()) {
          user = snap.data() as UserProfile;
        }
      }
      if (!user) {
        user = await DatabaseService.getUser(uid);
      }

      if (user && user.status !== 'nonaktif') {
        const role: UserRole = user.role === 'guru' ? 'guru' : 'murid';
        const finalUser = { ...user, role };
        setCurrentUser(finalUser);
        localStorage.setItem(LS_SESSION_KEY, user.uid);
        return true;
      }
    } catch (e) {
      console.warn('Gagal quickLogin:', e);
    }
    return false;
  };

  /**
   * Logout dari sesi aplikasi dan Firebase Authentication
   */
  const logout = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase SignOut error:', e);
      }
    }
    localStorage.removeItem(LS_SESSION_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        role: currentUser?.role || null,
        loading,
        login,
        loginWithGoogle,
        loginWithEmail,
        loginStudentWithNIS,
        quickLogin,
        logout,
        setCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

