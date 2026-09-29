import {
  UserProfile,
  ClassItem,
  IndicatorItem,
  AssessmentTask,
  AssessmentRecord,
  AppConfig,
  QuizItem,
  QuizSubmission,
  MaterialItem,
  MaterialProgress,
  LearningTaskItem,
  LearningTaskSubmission,
  AppNotification
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_INDICATORS,
  INITIAL_TASKS,
  INITIAL_ASSESSMENTS,
  INITIAL_APP_CONFIG,
  INITIAL_QUIZZES,
  INITIAL_MATERIALS,
  INITIAL_LEARNING_TASKS
} from './seedData';
import { db, storage, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { MediaStore } from '../lib/mediaStore';

// Local storage keys for hybrid/offline mode
const LS_USERS = 'pjok_data_users';
const LS_CLASSES = 'pjok_data_classes';
const LS_INDICATORS = 'pjok_data_indicators';
const LS_TASKS = 'pjok_data_tasks';
const LS_ASSESSMENTS = 'pjok_data_assessments';
const LS_APP_CONFIG = 'pjok_data_app_config';
const LS_QUIZZES = 'pjok_data_quizzes';
const LS_QUIZ_SUBMISSIONS = 'pjok_data_quiz_submissions';
const LS_MATERIALS = 'pjok_data_materials';
const LS_MATERIAL_PROGRESS = 'pjok_data_material_progress';
const LS_LEARNING_TASKS = 'pjok_data_learning_tasks';
const LS_LEARNING_SUBMISSIONS = 'pjok_data_learning_submissions';
const LS_NOTIFICATIONS = 'pjok_data_notifications';

// Event listener subscribers for reactive updates across the app
type ListenerCallback = () => void;
const listeners: Set<ListenerCallback> = new Set();

export const subscribeToDataChanges = (callback: ListenerCallback): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

let notifyTimeout: any = null;
const notifySubscribers = () => {
  if (notifyTimeout) return;
  notifyTimeout = setTimeout(() => {
    notifyTimeout = null;
    listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Listener callback error', e);
      }
    });
  }, 30);
};

export const getStored = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(defaultData));
      }
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key}, falling back to default`, err);
    return defaultData;
  }
};

export const setStored = <T>(key: string, data: T[], notify: boolean = true) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
    if (notify) {
      notifySubscribers();
    }
  } catch (err) {
    console.error(`Error saving ${key}`, err);
  }
};

const LS_DELETED_CLASSES = 'pjok_deleted_classes';
const LS_DELETED_USERS = 'pjok_deleted_users';

export const getDeletedClasses = (): Set<string> => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_DELETED_CLASSES) : null;
    const defaults = ['class-x-1', 'class-xii-1', 'x 1', 'xii 1'];
    if (!raw) return new Set(defaults);
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? [...defaults, ...arr.map((x: string) => String(x).toLowerCase().trim())] : defaults);
  } catch {
    return new Set(['class-x-1', 'class-xii-1', 'x 1', 'xii 1']);
  }
};

export const addDeletedClass = (idOrName: string) => {
  try {
    const current = getDeletedClasses();
    current.add(idOrName.toLowerCase().trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_DELETED_CLASSES, JSON.stringify(Array.from(current)));
    }
  } catch {}
};

export const getDeletedUsers = (): Set<string> => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_DELETED_USERS) : null;
    const defaults = ['1001', '1002', '1003', '1004', '1005'];
    if (!raw) return new Set(defaults);
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? [...defaults, ...arr.map((x: string) => String(x).toLowerCase().trim())] : defaults);
  } catch {
    return new Set(['1001', '1002', '1003', '1004', '1005']);
  }
};

export const addDeletedUser = (idOrNis: string) => {
  try {
    const current = getDeletedUsers();
    current.add(idOrNis.toLowerCase().trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_DELETED_USERS, JSON.stringify(Array.from(current)));
    }
  } catch {}
};

export const isClassDeleted = (c: Partial<ClassItem> | null | undefined): boolean => {
  if (!c || typeof c !== 'object') return false;
  const dummyClassIds = ['class-x-1', 'class-xii-1'];
  const dummyClassNames = ['x 1', 'xii 1'];
  const cid = c.id ? String(c.id).toLowerCase().trim() : '';
  const cnama = c.nama ? String(c.nama).toLowerCase().trim() : '';
  if (cid && dummyClassIds.includes(cid)) return true;
  if (cnama && dummyClassNames.includes(cnama)) return true;
  const deletedSet = getDeletedClasses();
  if (cid && deletedSet.has(cid)) return true;
  if (cnama && deletedSet.has(cnama)) return true;
  return false;
};

export const isDummyAccount = (u: Partial<UserProfile> | null | undefined): boolean => {
  if (!u || typeof u !== 'object') return false;
  const dummyNis = ['1001', '1002', '1003', '1004', '1005'];
  const dummyEmails = [
    'andi@pjok.sch.id',
    'budi@pjok.sch.id',
    'citra@pjok.sch.id',
    'dewi@pjok.sch.id',
    'eko@pjok.sch.id'
  ];
  const dummyNames = [
    'andi pratama',
    'budi santoso',
    'citra lestari',
    'dewi anggraini',
    'eko prasetyo'
  ];
  const cleanNis = u.nis ? String(u.nis).trim() : '';
  const cleanEmail = u.email ? String(u.email).toLowerCase().trim() : '';
  const cleanNama = u.nama ? String(u.nama).toLowerCase().trim() : '';
  const cleanUid = u.uid ? String(u.uid).toLowerCase().trim() : '';

  if (cleanNis && dummyNis.includes(cleanNis)) return true;
  if (cleanEmail && dummyEmails.includes(cleanEmail)) return true;
  if (cleanNama && dummyNames.includes(cleanNama)) return true;
  if (cleanUid && dummyNis.some((n) => cleanUid.includes(n))) return true;

  const deletedSet = getDeletedUsers();
  if (cleanUid && deletedSet.has(cleanUid)) return true;
  if (cleanNis && deletedSet.has(cleanNis.toLowerCase())) return true;
  return false;
};

/**
 * Deduplikasi akun murid & guru secara ketat berbasis NIS, email, dan nama
 * Menghilangkan semua akun ganda/duplikat dan menyatukannya menjadi 1 akun mutakhir.
 */
export const deduplicateUsers = (users: UserProfile[]): UserProfile[] => {
  if (!Array.isArray(users)) return [];
  const map = new Map<string, UserProfile>();
  const nisMap = new Map<string, string>(); // nis -> uid
  const emailMap = new Map<string, string>(); // email -> uid
  const nameClassMap = new Map<string, string>(); // name+class -> uid

  for (const rawU of users) {
    if (!rawU || typeof rawU !== 'object' || isDummyAccount(rawU)) continue;

    const uid = rawU.uid ? String(rawU.uid).trim() : `murid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const u: UserProfile = {
      ...rawU,
      uid,
      nama: rawU.nama ? String(rawU.nama).trim() : 'Murid PJOK',
      email: rawU.email ? String(rawU.email).trim() : `${uid}@pjok.sch.id`,
      role: rawU.role === 'guru' ? 'guru' : 'murid',
      status: rawU.status === 'nonaktif' ? 'nonaktif' : 'aktif',
      password: rawU.password || (rawU.role === 'guru' ? 'guru123' : 'murid123'),
      kelas: rawU.kelas ? String(rawU.kelas).trim() : 'XI 1',
      nis: rawU.nis ? String(rawU.nis).trim() : '',
      nomorAbsen: rawU.nomorAbsen ? String(rawU.nomorAbsen).trim() : ''
    };

    const cleanNis = u.nis ? u.nis.toLowerCase() : '';
    const cleanEmail = u.email ? u.email.toLowerCase() : '';
    const cleanNameClass = (u.nama ? u.nama.toLowerCase() : '') + ':::' + (u.kelas ? u.kelas.toLowerCase() : '');

    let existingUid: string | undefined;
    if (cleanNis && nisMap.has(cleanNis)) {
      existingUid = nisMap.get(cleanNis);
    } else if (cleanEmail && emailMap.has(cleanEmail)) {
      existingUid = emailMap.get(cleanEmail);
    } else if (u.role === 'murid' && cleanNameClass && nameClassMap.has(cleanNameClass)) {
      existingUid = nameClassMap.get(cleanNameClass);
    } else if (map.has(u.uid)) {
      existingUid = u.uid;
    }

    if (existingUid && map.has(existingUid)) {
      const existing = map.get(existingUid)!;
      const merged: UserProfile = {
        ...existing,
        ...u,
        uid: existing.uid,
        nama: u.nama || existing.nama || 'Murid PJOK',
        email: u.email || existing.email || `${existing.uid}@pjok.sch.id`,
        password:
          (u.password && u.password !== '123456' ? u.password : existing.password) ||
          u.password ||
          'murid123',
        status: existing.status === 'aktif' || u.status === 'aktif' ? 'aktif' : 'nonaktif',
        updatedAt: u.updatedAt || existing.updatedAt || new Date().toISOString()
      };
      map.set(existingUid, merged);
    } else {
      map.set(u.uid, u);
      if (cleanNis) nisMap.set(cleanNis, u.uid);
      if (cleanEmail) emailMap.set(cleanEmail, u.uid);
      if (cleanNameClass) nameClassMap.set(cleanNameClass, u.uid);
    }
  }

  return Array.from(map.values());
};

let realtimeListenersInitialized = false;

/**
 * Memasang pendengar real-time Firestore (onSnapshot)
 * agar semua perubahan data (pengaturan, logo, kelas, siswa, tugas, penilaian)
 * langsung sinkron detik itu juga antar Laptop dan HP tanpa perlu refresh.
 */
export const initRealtimeCloudSync = () => {
  if (realtimeListenersInitialized || !isFirebaseConfigured() || !db) return;
  realtimeListenersInitialized = true;

  try {
    const handleSyncNotice = (name: string, err: any) => {
      // Ketika jaringan transien atau client beralih ke cache offline, Firebase beroperasi normal
      if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.code === 'failed-precondition') {
        return;
      }
      console.warn(`Realtime ${name} sync notice:`, err);
    };

    // 1. Settings / App Config & Logo
    onSnapshot(
      doc(db, 'settings', 'app_config'),
      (snap) => {
        if (snap.exists()) {
          const cloudConfig = { ...INITIAL_APP_CONFIG, ...(snap.data() as AppConfig) };
          try {
            localStorage.setItem(LS_APP_CONFIG, JSON.stringify(cloudConfig));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('app_config', err)
    );

    // 2. Classes (Kelas) - Safe merge preserving local edits
    onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const cloudClasses = snap.docs
          .map((d) => ({ ...(d.data() as ClassItem), id: d.id }))
          .filter((c) => !isClassDeleted(c));
        const local = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES).filter((c) => !isClassDeleted(c));
        const map = new Map<string, ClassItem>();
        cloudClasses.forEach((c) => map.set(c.id, c));
        local.forEach((lc) => {
          if (isClassDeleted(lc)) return;
          const cc = map.get(lc.id);
          if (cc) {
            const localT = (lc as any).updatedAt || lc.createdAt || '1970-01-01';
            const cloudT = (cc as any).updatedAt || cc.createdAt || '1970-01-01';
            if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
              map.set(lc.id, lc);
            }
          }
        });
        const merged = Array.from(map.values()).filter((c) => !isClassDeleted(c));
        try {
          localStorage.setItem(LS_CLASSES, JSON.stringify(merged));
        } catch {}
        notifySubscribers();
      },
      (err) => handleSyncNotice('classes', err)
    );

    // 3. Assessment Tasks (Tugas Penilaian) - Safe merge
    onSnapshot(
      collection(db, 'tasks'),
      (snap) => {
        if (!snap.empty) {
          const cloudTasks = snap.docs.map((d) => d.data() as AssessmentTask);
          const local = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
          const map = new Map<string, AssessmentTask>();
          cloudTasks.forEach((t) => map.set(t.id, t));
          local.forEach((lt) => {
            const ct = map.get(lt.id);
            if (!ct) {
              map.set(lt.id, lt);
            } else {
              const localT = (lt as any).updatedAt || lt.createdAt || '1970-01-01';
              const cloudT = (ct as any).updatedAt || ct.createdAt || '1970-01-01';
              if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
                map.set(lt.id, lt);
              }
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LS_TASKS, JSON.stringify(merged));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('tasks', err)
    );

    // 4. Rubric Indicators (Indikator Penilaian)
    onSnapshot(
      collection(db, 'indicators'),
      (snap) => {
        if (!snap.empty) {
          const cloudIndicators = snap.docs
            .map((d) => d.data() as IndicatorItem)
            .sort((a, b) => a.urutan - b.urutan);
          try {
            localStorage.setItem(LS_INDICATORS, JSON.stringify(cloudIndicators));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('indicators', err)
    );

    // 5. Users (Koleksi Pengguna / Guru & Murid)
    onSnapshot(
      collection(db, 'pengguna'),
      (snap) => {
        const cloudUsers = snap.docs
          .map((d) => ({ ...(d.data() as UserProfile), uid: d.id }))
          .filter((u) => u && !isDummyAccount(u));
        const local = getStored<UserProfile>(LS_USERS, INITIAL_USERS).filter((u) => u && !isDummyAccount(u));
        const map = new Map<string, UserProfile>();
        cloudUsers.forEach((u) => {
          if (u && u.uid) map.set(u.uid, u);
        });
        local.forEach((lu) => {
          if (!lu || !lu.uid || isDummyAccount(lu)) return;
          const cu = map.get(lu.uid);
          if (!cu) {
            map.set(lu.uid, lu);
          } else {
            const localT = lu.updatedAt || lu.createdAt || '1970-01-01';
            const cloudT = cu.updatedAt || cu.createdAt || '1970-01-01';
            if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
              map.set(lu.uid, lu);
            }
          }
        });
        const merged = deduplicateUsers(Array.from(map.values()));
        try {
          localStorage.setItem(LS_USERS, JSON.stringify(merged));
        } catch {}
        notifySubscribers();
      },
      (err) => handleSyncNotice('pengguna', err)
    );

    // 6. Assessments (Hasil Penilaian Antar Teman) - Safe merge preserving local submissions
    onSnapshot(
      collection(db, 'assessments'),
      (snap) => {
        if (!snap.empty) {
          const cloudAssessments = snap.docs.map((d) => d.data() as AssessmentRecord);
          const local = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
          const map = new Map<string, AssessmentRecord>();
          cloudAssessments.forEach((a) => map.set(a.id, a));
          local.forEach((la) => {
            const ca = map.get(la.id);
            if (!ca) {
              map.set(la.id, la);
            } else {
              const localT = la.updatedAt || la.createdAt || '1970-01-01';
              const cloudT = ca.updatedAt || ca.createdAt || '1970-01-01';
              if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
                map.set(la.id, la);
              }
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(merged));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('assessments', err)
    );

    // 7. Quizzes (Kuis Link & Kunci Guru PJOK)
    onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        if (!snap.empty) {
          const cloudQuizzes = snap.docs.map((d) => d.data() as QuizItem);
          try {
            localStorage.setItem(LS_QUIZZES, JSON.stringify(cloudQuizzes));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('quizzes', err)
    );

    // 8. Quiz Submissions (Pengerjaan Kuis Siswa)
    onSnapshot(
      collection(db, 'quiz_submissions'),
      (snap) => {
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as QuizSubmission);
          try {
            localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify(cloudSubs));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('quiz_submissions', err)
    );

    // 9. Materials (Materi Pembelajaran PJOK)
    onSnapshot(
      collection(db, 'materials'),
      (snap) => {
        if (!snap.empty) {
          const cloudMaterials = snap.docs.map((d) => d.data() as MaterialItem);
          try {
            localStorage.setItem(LS_MATERIALS, JSON.stringify(cloudMaterials));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('materials', err)
    );

    // 10. Material Progress (Progres Belajar Siswa)
    onSnapshot(
      collection(db, 'material_progress'),
      (snap) => {
        if (!snap.empty) {
          const cloudProgress = snap.docs.map((d) => d.data() as MaterialProgress);
          try {
            localStorage.setItem(LS_MATERIAL_PROGRESS, JSON.stringify(cloudProgress));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('material_progress', err)
    );

    // 11. Notifications (Pemberitahuan Tugas Baru & Feedback Nilai)
    onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        if (!snap.empty) {
          const cloudNotifs = snap.docs.map((d) => d.data() as AppNotification);
          const local = getStored<AppNotification>(LS_NOTIFICATIONS, []);
          const map = new Map<string, AppNotification>();
          cloudNotifs.forEach((n) => map.set(n.id, n));
          local.forEach((ln) => {
            if (!map.has(ln.id)) {
              map.set(ln.id, ln);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(merged));
          } catch {}
          notifySubscribers();
        }
      },
      (err) => handleSyncNotice('notifications', err)
    );
  } catch (err) {
    console.warn('Gagal memasang realtime listener Firestore:', err);
  }
};

// Helper to initialize local storage with initial seed data if not present
const DUMMY_CLEARED_KEY = 'pjok_dummy_cleared_prod_v4';

export const purgeDummyData = async () => {
  // Safe no-op: pastikan tugas, nilai, dan akun siswa tidak terhapus
  return;
};

if (typeof window !== 'undefined' && !localStorage.getItem(DUMMY_CLEARED_KEY)) {
  localStorage.setItem(DUMMY_CLEARED_KEY, 'true');
}

export const DatabaseService = {
  // --- SYNCHRONOUS CACHE READERS (0ms instant UI, no blank delay) ---
  getCachedUsers(): UserProfile[] {
    const raw = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    return deduplicateUsers(raw);
  },

  getCachedClasses(): ClassItem[] {
    const raw = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    return raw.filter((c) => !isClassDeleted(c));
  },

  getCachedTasks(): AssessmentTask[] {
    return getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
  },

  getCachedAssessments(): AssessmentRecord[] {
    return getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
  },

  getCachedIndicators(): IndicatorItem[] {
    return getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
  },

  getCachedQuizzes(): any[] {
    return getStored<any>(LS_QUIZZES, INITIAL_QUIZZES);
  },

  getCachedMaterials(): MaterialItem[] {
    return getStored<MaterialItem>(LS_MATERIALS, INITIAL_MATERIALS);
  },

  getCachedLearningTasks(): any[] {
    return getStored<any>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
  },

  // --- USERS / PENGGUNA ---
  async purgeDummyAccounts(): Promise<void> {
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    const cleaned = deduplicateUsers(all);
    setStored(LS_USERS, cleaned, false);
  },

  async getUsers(): Promise<UserProfile[]> {
    const rawLocal = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    let cleanLocal = deduplicateUsers(rawLocal);

    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'pengguna'));
        if (!snap.empty) {
          const cloudUsers: UserProfile[] = [];
          for (const d of snap.docs) {
            const u = d.data() as UserProfile;
            if (!u || isDummyAccount(u) || isDummyAccount({ uid: d.id })) {
              continue;
            }
            cloudUsers.push({ ...u, uid: u.uid || d.id });
          }

          const map = new Map<string, UserProfile>();
          cloudUsers.forEach((u) => map.set(u.uid, u));
          cleanLocal.forEach((lu) => {
            if (!lu || isDummyAccount(lu)) return;
            const cu = map.get(lu.uid);
            if (!cu) {
              map.set(lu.uid, lu);
            } else {
              const localT = lu.updatedAt || lu.createdAt || '1970-01-01';
              const cloudT = cu.updatedAt || cu.createdAt || '1970-01-01';
              if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
                map.set(lu.uid, lu);
              }
            }
          });

          cleanLocal = deduplicateUsers(Array.from(map.values()));
        } else {
          // Cloud pengguna kosong, bantu inisialisasi awal ke Firestore
          setTimeout(async () => {
            try {
              if (isFirebaseConfigured() && db) {
                for (const u of cleanLocal.slice(0, 40)) {
                  await setDoc(doc(db, 'pengguna', u.uid), u, { merge: true }).catch(() => {});
                }
              }
            } catch {}
          }, 100);
        }
      } catch (err) {
        console.warn('Firestore getUsers fallback to local:', err);
      }
    }

    // Pastikan INITIAL_USERS yang belum dihapus ada dengan O(1) set lookup
    const userMap = new Map<string, UserProfile>();
    cleanLocal.forEach((u) => userMap.set(u.uid, u));
    const existingNisSet = new Set(
      cleanLocal.map((u) => (u.nis ? String(u.nis).trim().toLowerCase() : '')).filter(Boolean)
    );

    for (const initU of INITIAL_USERS) {
      if (isDummyAccount(initU)) continue;
      const cleanNis = initU.nis ? String(initU.nis).trim().toLowerCase() : '';
      const existsByNis = cleanNis && existingNisSet.has(cleanNis);
      const existsByUid = userMap.has(initU.uid);
      if (!existsByUid && !existsByNis) {
        cleanLocal.push(initU);
        userMap.set(initU.uid, initU);
        if (cleanNis) existingNisSet.add(cleanNis);
      }
    }

    const finalUsers = deduplicateUsers(cleanLocal);
    setStored(LS_USERS, finalUsers, false);
    return finalUsers;
  },

  async getUser(uid: string): Promise<UserProfile | null> {
    const all = await this.getUsers();
    return all.find((u) => u.uid === uid) || null;
  },

  async saveUser(user: UserProfile): Promise<void> {
    const userWithTime: UserProfile = {
      ...user,
      nama: user.nama ? String(user.nama).trim() : 'Murid PJOK',
      role: user.role === 'guru' ? 'guru' : 'murid',
      status: user.status === 'nonaktif' ? 'nonaktif' : 'aktif',
      kelas: user.kelas ? String(user.kelas).trim() : 'XI 1',
      updatedAt: new Date().toISOString()
    };
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    const cleanUserNis = user.nis ? String(user.nis).trim().toLowerCase() : '';
    const idx = all.findIndex(
      (u) =>
        u.uid === user.uid ||
        (cleanUserNis && u.nis && String(u.nis).trim().toLowerCase() === cleanUserNis)
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...userWithTime };
    } else {
      all.push(userWithTime);
    }
    const cleanAll = deduplicateUsers(all);
    setStored(LS_USERS, cleanAll);
    notifySubscribers();

    // Sinkronkan ke cloud Firestore koleksi 'pengguna'
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'pengguna', userWithTime.uid), userWithTime, { merge: true });
      } catch (err) {
        console.warn('Firestore saveUser error (tersimpan secara lokal):', err);
      }
    }
  },

  async deleteUser(uid: string): Promise<void> {
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    const target = all.find((u) => u.uid === uid);
    addDeletedUser(uid);
    if (target?.nis) addDeletedUser(target.nis);

    const filtered = all.filter((u) => u.uid !== uid && !isDummyAccount(u));
    setStored(LS_USERS, deduplicateUsers(filtered));
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'pengguna', uid));
      } catch (err) {
        console.warn('Firestore deleteUser error:', err);
      }
    }
  },

  async deleteUsers(uids: string[]): Promise<void> {
    if (!uids || uids.length === 0) return;
    const uidSet = new Set(uids);
    const all = getStored<UserProfile>(LS_USERS, INITIAL_USERS);
    for (const uid of uids) {
      addDeletedUser(uid);
      const target = all.find((u) => u.uid === uid);
      if (target?.nis) addDeletedUser(target.nis);
    }

    const filtered = all.filter((u) => !uidSet.has(u.uid) && !isDummyAccount(u));
    setStored(LS_USERS, deduplicateUsers(filtered));
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await Promise.all(uids.map((id) => deleteDoc(doc(db, 'pengguna', id)).catch(() => {})));
      } catch (err) {
        console.warn('Firestore deleteUsers error:', err);
      }
    }
  },

  // --- CLASSES ---
  async purgeDummyClasses(): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'classes')).catch(() => null);
        if (snap) {
          const promises: Promise<any>[] = [];
          for (const d of snap.docs) {
            const data = d.data() as ClassItem;
            if (isClassDeleted(data) || isClassDeleted({ id: d.id })) {
              promises.push(deleteDoc(doc(db, 'classes', d.id)).catch(() => {}));
            }
          }
          await Promise.all(promises);
        }
      } catch (e) {
        console.warn('purgeDummyClasses error:', e);
      }
    }
    const all = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const filtered = all.filter((c) => !isClassDeleted(c));
    setStored(LS_CLASSES, filtered, false);
  },

  async getClasses(): Promise<ClassItem[]> {
    const rawLocal = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const localClasses = rawLocal.filter((c) => !isClassDeleted(c));

    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          const cloudClasses: ClassItem[] = [];
          for (const d of snap.docs) {
            const c = d.data() as ClassItem;
            if (isClassDeleted(c) || isClassDeleted({ id: d.id })) {
              deleteDoc(doc(db, 'classes', d.id)).catch(() => {});
              continue;
            }
            cloudClasses.push({ ...c, id: c.id || d.id });
          }

          const map = new Map<string, ClassItem>();
          cloudClasses.forEach((c) => map.set(c.id, c));
          localClasses.forEach((lc) => {
            if (isClassDeleted(lc)) return;
            const cc = map.get(lc.id);
            if (!cc) {
              map.set(lc.id, lc);
            } else {
              const localT = (lc as any).updatedAt || lc.createdAt || '1970-01-01';
              const cloudT = (cc as any).updatedAt || cc.createdAt || '1970-01-01';
              if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
                map.set(lc.id, lc);
              }
            }
          });

          // Pastikan INITIAL_CLASSES (XI 1 s/d XI 9) terdaftar jika belum pernah dihapus
          for (const ic of INITIAL_CLASSES) {
            if (isClassDeleted(ic)) continue;
            const exists = Array.from(map.values()).some(
              (c) => c.id === ic.id || c.nama.toLowerCase() === ic.nama.toLowerCase()
            );
            if (!exists) {
              map.set(ic.id, ic);
            }
          }

          const merged = Array.from(map.values()).filter((c) => !isClassDeleted(c));
          try {
            localStorage.setItem(LS_CLASSES, JSON.stringify(merged));
          } catch {}
          return merged;
        }
      } catch (err) {
        console.warn('Firestore getClasses failed, using local:', err);
      }
    }

    // Local fallback: pastikan INITIAL_CLASSES yang belum dihapus ada
    const mapLocal = new Map<string, ClassItem>();
    localClasses.forEach((c) => {
      if (!isClassDeleted(c)) mapLocal.set(c.id, c);
    });

    for (const ic of INITIAL_CLASSES) {
      if (isClassDeleted(ic)) continue;
      const exists = Array.from(mapLocal.values()).some(
        (c) => c.id === ic.id || c.nama.toLowerCase() === ic.nama.toLowerCase()
      );
      if (!exists) {
        mapLocal.set(ic.id, ic);
      }
    }

    const cleaned = Array.from(mapLocal.values()).filter((c) => !isClassDeleted(c));
    setStored(LS_CLASSES, cleaned, false);
    return cleaned;
  },

  async saveClass(item: ClassItem): Promise<void> {
    const itemWithTime: ClassItem = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    // 1. Simpan ke local storage terlebih dahulu agar perubahan instan & tidak terpengaruh kuota
    const all = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const idx = all.findIndex((c) => c.id === itemWithTime.id);
    if (idx >= 0) {
      all[idx] = itemWithTime;
    } else {
      all.push(itemWithTime);
    }
    setStored(LS_CLASSES, all);
    notifySubscribers();

    // 2. Sinkronkan ke cloud Firestore secara non-blocking
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'classes', itemWithTime.id), itemWithTime, { merge: true });
      } catch (err) {
        console.warn('Firestore saveClass error (tersimpan lokal):', err);
      }
    }
  },

  async deleteClass(id: string): Promise<void> {
    const all = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
    const target = all.find((c) => c.id === id);
    addDeletedClass(id);
    if (target?.nama) {
      addDeletedClass(target.nama);
    }

    const filtered = all.filter((c) => c.id !== id && !isClassDeleted(c));
    setStored(LS_CLASSES, filtered);
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'classes', id));
      } catch (err) {
        console.warn('Firestore deleteClass error:', err);
      }
    }
  },

  // --- INDICATORS ---
  async getIndicators(): Promise<IndicatorItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'indicators'));
        if (!snap.empty) {
          const cloudIndicators = snap.docs
            .map((d) => d.data() as IndicatorItem)
            .sort((a, b) => a.urutan - b.urutan);
          try {
            localStorage.setItem(LS_INDICATORS, JSON.stringify(cloudIndicators));
          } catch {}
          return cloudIndicators;
        }

        // Jika Firestore kosong, seed data indikator ke cloud
        const localIndicators = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
        for (const ind of localIndicators) {
          await setDoc(doc(db, 'indicators', ind.id), ind, { merge: true });
        }
        return localIndicators.sort((a, b) => a.urutan - b.urutan);
      } catch (err) {
        console.warn('Firestore getIndicators failed:', err);
      }
    }
    const list = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    return list.sort((a, b) => a.urutan - b.urutan);
  },

  async saveIndicator(item: IndicatorItem): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'indicators', item.id), item, { merge: true });
      } catch (err) {
        console.warn('Firestore saveIndicator error:', err);
      }
    }
    const all = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    const idx = all.findIndex((ind) => ind.id === item.id);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    setStored(LS_INDICATORS, all);
  },

  async deleteIndicator(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'indicators', id));
      } catch (err) {
        console.warn('Firestore deleteIndicator error:', err);
      }
    }
    const all = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
    const filtered = all.filter((ind) => ind.id !== id);
    setStored(LS_INDICATORS, filtered);
  },

  // --- TASKS ---
  async getTasks(): Promise<AssessmentTask[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'tasks'));
        if (!snap.empty) {
          const cloudTasks = snap.docs.map((d) => d.data() as AssessmentTask);
          try {
            localStorage.setItem(LS_TASKS, JSON.stringify(cloudTasks));
          } catch {}
          return cloudTasks;
        }

        // Jika Firestore kosong, seed data tugas ke cloud
        const localTasks = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
        for (const t of localTasks) {
          await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
        }
        return localTasks;
      } catch (err) {
        console.warn('Firestore getTasks failed:', err);
      }
    }
    return getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
  },

  async getTask(id: string): Promise<AssessmentTask | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  },

  async getTasksForClass(kelas: string): Promise<AssessmentTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter(
      (t) =>
        t.status === 'aktif' &&
        (t.kelas.toLowerCase() === kelas.toLowerCase() || t.kelas === 'Semua')
    );
  },

  async saveTask(task: AssessmentTask): Promise<void> {
    const taskWithTime: AssessmentTask = {
      ...task,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    const all = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
    const idx = all.findIndex((t) => t.id === taskWithTime.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = taskWithTime;
    } else {
      all.push(taskWithTime);
    }
    setStored(LS_TASKS, all);
    notifySubscribers();

    // Buat notifikasi otomatis ke siswa saat guru memposting tugas baru
    if (isNew && taskWithTime.status === 'aktif') {
      try {
        const targetClasses =
          taskWithTime.targetKelas && taskWithTime.targetKelas.length > 0
            ? taskWithTime.targetKelas
            : taskWithTime.kelas
            ? taskWithTime.kelas.split(/[,;/]+/).map((k) => k.trim()).filter(Boolean)
            : ['Semua'];

        for (const cls of targetClasses) {
          const notif: AppNotification = {
            id: `notif-task-${taskWithTime.id}-${cls.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`,
            userId: cls === 'Semua' || cls === 'Semua Kelas' ? 'all' : `class:${cls}`,
            title: 'Tugas Penilaian Baru Diposting!',
            message: `Guru PJOK memposting tugas "${taskWithTime.nama}" untuk materi ${taskWithTime.materi}. Segera pelajari dan lakukan penilaian gerak teman!`,
            type: 'tugas_baru',
            linkTarget: 'tasks',
            referenceId: taskWithTime.id,
            read: false,
            senderName: 'Guru PJOK',
            createdAt: new Date().toISOString()
          };
          await this.saveNotification(notif);
        }
      } catch (e) {
        console.warn('Gagal membuat notifikasi tugas baru:', e);
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'tasks', taskWithTime.id), taskWithTime, { merge: true });
      } catch (err) {
        console.warn('Firestore saveTask error (tersimpan lokal):', err);
      }
    }
  },

  async deleteTask(id: string): Promise<void> {
    const all = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
    const filtered = all.filter((t) => t.id !== id);
    setStored(LS_TASKS, filtered);
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        console.warn('Firestore deleteTask error:', err);
      }
    }
  },

  // --- ASSESSMENTS ---
  async getAssessments(): Promise<AssessmentRecord[]> {
    const localAssessments = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'assessments'));
        if (!snap.empty) {
          const cloudAssessments = snap.docs.map((d) => d.data() as AssessmentRecord);
          // Gabungkan cloud dan lokal: penilaian lokal yang belum sinkron atau lebih baru TIDAK AKAN HILANG
          const map = new Map<string, AssessmentRecord>();
          cloudAssessments.forEach((a) => map.set(a.id, a));
          localAssessments.forEach((la) => {
            const ca = map.get(la.id);
            if (!ca) {
              map.set(la.id, la);
            } else {
              const localT = la.updatedAt || la.createdAt || '1970-01-01';
              const cloudT = ca.updatedAt || ca.createdAt || '1970-01-01';
              if (new Date(localT).getTime() > new Date(cloudT).getTime()) {
                map.set(la.id, la);
              }
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(merged));
          } catch {}
          return merged;
        }
      } catch (err) {
        console.warn('Firestore getAssessments failed, using local assessments:', err);
      }
    }
    return localAssessments;
  },

  async getAssessmentsByAssessor(assessorId: string): Promise<AssessmentRecord[]> {
    const all = await this.getAssessments();
    return all.filter((a) => a.assessorId === assessorId || a.assessorUserId === assessorId);
  },

  async getAssessmentsForTarget(targetId: string): Promise<AssessmentRecord[]> {
    const all = await this.getAssessments();
    return all.filter((a) => a.targetId === targetId || a.targetUserId === targetId);
  },

  async checkExistingAssessment(
    taskId: string,
    assessorId: string,
    targetId: string
  ): Promise<AssessmentRecord | null> {
    const all = await this.getAssessments();
    return (
      all.find(
        (a) =>
          a.taskId === taskId &&
          (a.assessorId === assessorId || a.assessorUserId === assessorId) &&
          (a.targetId === targetId || a.targetUserId === targetId)
      ) || null
    );
  },

  async saveAssessment(record: AssessmentRecord): Promise<void> {
    const recordToSave: AssessmentRecord = {
      ...record,
      updatedAt: new Date().toISOString()
    };
    if (
      recordToSave.evidenceUrl &&
      recordToSave.evidenceUrl.startsWith('data:video') &&
      recordToSave.evidenceUrl.length > 50000
    ) {
      recordToSave.evidenceUrl = `idb://${record.id}`;
    }

    // 1. Simpan ke local storage terlebih dahulu agar nilai TIDAK PERNAH HILANG
    const all = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    const idx = all.findIndex((a) => a.id === recordToSave.id);
    if (idx >= 0) {
      all[idx] = recordToSave;
    } else {
      all.push(recordToSave);
    }
    setStored(LS_ASSESSMENTS, all);
    notifySubscribers();

    // 2. Buat notifikasi alert untuk murid target yang dinilai
    try {
      const targetUserId = recordToSave.targetId || recordToSave.targetUserId || '';
      if (targetUserId) {
        const notif: AppNotification = {
          id: `notif-feedback-${recordToSave.id}-${Date.now()}`,
          userId: targetUserId,
          title: 'Hasil Penilaian Baru Masuk!',
          message: `${recordToSave.assessorName} telah menilai gerak Anda pada "${recordToSave.taskTitle || 'Tugas PJOK'}" dengan nilai ${recordToSave.finalScore100 || Math.round(recordToSave.averageScore * 25)}. Umpan balik: "${recordToSave.feedback || 'Gerakan sudah baik!'}"`,
          type: 'umpan_balik',
          linkTarget: 'history',
          referenceId: recordToSave.id,
          read: false,
          senderName: recordToSave.assessorName,
          createdAt: new Date().toISOString()
        };
        await this.saveNotification(notif);
      }
    } catch (e) {
      console.warn('Gagal membuat notifikasi feedback penilaian:', e);
    }

    // 3. Sinkronkan ke Firestore secara non-blocking
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'assessments', recordToSave.id), recordToSave, { merge: true });
      } catch (err) {
        console.warn('Firestore saveAssessment error (tersimpan lokal):', err);
      }
    }
  },

  async deleteAssessment(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'assessments', id));
      } catch (err) {
        console.warn('Firestore deleteAssessment error:', err);
      }
    }
    const all = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    const target = all.find((a) => a.id === id);
    if (target && target.evidenceUrl && target.evidenceUrl.startsWith('idb://')) {
      const mediaId = target.evidenceUrl.replace('idb://', '');
      try {
        await MediaStore.deleteMedia(mediaId);
      } catch {}
    }
    const filtered = all.filter((a) => a.id !== id);
    setStored(LS_ASSESSMENTS, filtered);
    notifySubscribers();
  },

  async deleteAssessments(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    if (isFirebaseConfigured() && db) {
      const firestore = db;
      try {
        await Promise.all(ids.map((id) => deleteDoc(doc(firestore, 'assessments', id))));
      } catch (err) {
        console.warn('Firestore deleteAssessments error:', err);
      }
    }
    const idSet = new Set(ids);
    const all = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
    for (const a of all) {
      if (idSet.has(a.id) && a.evidenceUrl && a.evidenceUrl.startsWith('idb://')) {
        const mediaId = a.evidenceUrl.replace('idb://', '');
        try {
          await MediaStore.deleteMedia(mediaId);
        } catch {}
      }
    }
    const filtered = all.filter((a) => !idSet.has(a.id));
    setStored(LS_ASSESSMENTS, filtered);
    notifySubscribers();
  },

  // --- EVIDENCE UPLOAD (IndexedDB + Firestore Chunks + Firebase Storage + Ultra-Fast Thumbnail) ---
  async uploadEvidence(
    file: File,
    taskId: string,
    assessorId: string,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; path: string; thumbnailUrl?: string | null }> {
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `assessment-evidence/${taskId}/${assessorId}/${safeFileName}`;

    // 1. Simpan segera ke IndexedDB lokal dalam waktu < 50ms tanpa blocking
    const mediaId = `media_${taskId}_${assessorId}_${Date.now()}`;
    const idbUrl = await MediaStore.saveMedia(mediaId, file);

    // 2. Buat thumbnail ringkas (~15KB) secara instan agar guru & siswa langsung bisa melihat bukti gerakan
    let thumbnailUrl: string | null = null;
    if (file.type.startsWith('video/')) {
      try {
        thumbnailUrl = await MediaStore.generateVideoThumbnail(file);
      } catch (e) {
        console.warn('Gagal membuat thumbnail video:', e);
      }
    } else if (file.type.startsWith('image/')) {
      try {
        thumbnailUrl = await MediaStore.compressImage(file, 480, 0.65);
      } catch {}
    }

    // 3. Unggah ke Firestore Chunks agar video dapat diputar oleh Guru & Siswa di semua perangkat (Cloud Sync)
    try {
      await MediaStore.uploadToFirestoreChunks(mediaId, file, (pct) => {
        onProgress?.(Math.round(pct * 0.85));
      });
    } catch (err) {
      console.warn('Upload cloud chunks warning:', err);
    }

    // 4. Jika Firebase Storage aktif, coba juga upload ke Storage
    if (isFirebaseConfigured() && storage) {
      try {
        const fileRef = storageRef(storage, storagePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        const uploadPromise = new Promise<{ url: string; path: string }>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0) {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress?.(percent);
              }
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadUrl, path: storagePath });
            }
          );
        });

        const timeoutPromise = new Promise<{ url: string; path: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Storage timeout, menggunakan cloud chunks')), 6000)
        );

        const res = await Promise.race([uploadPromise, timeoutPromise]);
        return { ...res, thumbnailUrl };
      } catch (err) {
        console.warn('Firebase storage upload skipped/failed, cloud chunks will be used:', err);
      }
    }

    onProgress?.(100);
    return {
      url: idbUrl,
      path: storagePath,
      thumbnailUrl
    };
  },

  async uploadMedia(
    file: File,
    path?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; path: string; thumbnailUrl?: string | null }> {
    return this.uploadEvidence(file, path || 'assessments', 'upload', onProgress);
  },

  // --- APP CONFIG & LOGO (Sinkron Multi-Device HP & Laptop) ---
  async getAppConfig(): Promise<AppConfig> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'app_config'));
        if (snap.exists()) {
          const cloudConfig = { ...INITIAL_APP_CONFIG, ...(snap.data() as AppConfig) };
          if (!cloudConfig.appName || cloudConfig.appName === 'PENILAIAN ANTAR TEMAN PJOK') {
            cloudConfig.appName = 'e-PJOK';
          }
          try {
            localStorage.setItem(LS_APP_CONFIG, JSON.stringify(cloudConfig));
          } catch {}
          return cloudConfig;
        } else {
          // Jika di Firestore belum ada, periksa apakah di penyimpanan lokal ada kustomisasi untuk diunggah ke cloud
          const stored = localStorage.getItem(LS_APP_CONFIG);
          const configToUpload = stored
            ? { ...INITIAL_APP_CONFIG, ...JSON.parse(stored) }
            : INITIAL_APP_CONFIG;
          if (!configToUpload.appName || configToUpload.appName === 'PENILAIAN ANTAR TEMAN PJOK') {
            configToUpload.appName = 'e-PJOK';
          }
          try {
            await setDoc(doc(db, 'settings', 'app_config'), configToUpload, { merge: true });
          } catch (e) {
            console.warn('Gagal mengunggah konfigurasi awal ke Firestore:', e);
          }
          return configToUpload;
        }
      } catch (err) {
        console.warn('Firestore getAppConfig error, using local:', err);
      }
    }
    const stored = localStorage.getItem(LS_APP_CONFIG);
    if (stored) {
      try {
        const parsed = { ...INITIAL_APP_CONFIG, ...JSON.parse(stored) };
        if (!parsed.appName || parsed.appName === 'PENILAIAN ANTAR TEMAN PJOK') {
          parsed.appName = 'e-PJOK';
        }
        return parsed;
      } catch {
        return INITIAL_APP_CONFIG;
      }
    }
    return INITIAL_APP_CONFIG;
  },

  async saveAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.getAppConfig();
    const updated: AppConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'settings', 'app_config'), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore saveAppConfig error:', err);
      }
    }

    try {
      localStorage.setItem(LS_APP_CONFIG, JSON.stringify(updated));
      notifySubscribers();
    } catch (err) {
      console.error('Error saving app config to local storage', err);
    }
    return updated;
  },

  async resetAppConfig(): Promise<AppConfig> {
    return this.saveAppConfig(INITIAL_APP_CONFIG);
  },

  // --- QUIZZES (Kuis PJOK Link & Kunci Guru-Murid) ---
  async getQuizzes(): Promise<QuizItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        if (!snap.empty) {
          const cloudQuizzes = snap.docs.map((d) => d.data() as QuizItem);
          try {
            localStorage.setItem(LS_QUIZZES, JSON.stringify(cloudQuizzes));
          } catch {}
          return cloudQuizzes;
        }
      } catch (err) {
        console.warn('Firestore getQuizzes error, using local fallback:', err);
      }
    }
    return getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
  },

  async getQuizzesForClass(kelas: string): Promise<QuizItem[]> {
    const quizzes = await this.getQuizzes();
    const cleanClass = (kelas || '').trim().toLowerCase();
    return quizzes.filter(
      (q) =>
        q.kelas === 'Semua Kelas' ||
        q.kelas === 'Semua' ||
        q.kelas.trim().toLowerCase() === cleanClass
    );
  },

  async getQuiz(id: string): Promise<QuizItem | null> {
    const quizzes = await this.getQuizzes();
    return quizzes.find((q) => q.id === id) || null;
  },

  async saveQuiz(quiz: QuizItem): Promise<void> {
    const cleanQuiz: any = {};
    for (const [key, value] of Object.entries(quiz)) {
      if (value !== undefined) {
        cleanQuiz[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'quizzes', quiz.id), cleanQuiz, { merge: true });
      } catch (err) {
        console.warn('Firestore saveQuiz error:', err);
      }
    }
    const all = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
    const idx = all.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      all[idx] = cleanQuiz;
    } else {
      all.unshift(cleanQuiz);
    }
    setStored(LS_QUIZZES, all);
    notifySubscribers();
  },

  async toggleQuizStatus(id: string, status: 'buka' | 'kunci'): Promise<void> {
    const quiz = await this.getQuiz(id);
    if (!quiz) return;
    const updated: QuizItem = {
      ...quiz,
      status,
      updatedAt: new Date().toISOString()
    };
    await this.saveQuiz(updated);
  },

  async deleteQuiz(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
      } catch (err) {
        console.warn('Firestore deleteQuiz error:', err);
      }
    }
    const all = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
    const filtered = all.filter((q) => q.id !== id);
    setStored(LS_QUIZZES, filtered);
    notifySubscribers();
  },

  // --- QUIZ SUBMISSIONS (Tracking pengerjaan murid) ---
  async getQuizSubmissions(quizId?: string): Promise<QuizSubmission[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'quiz_submissions'));
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as QuizSubmission);
          try {
            localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify(cloudSubs));
          } catch {}
          if (quizId) return cloudSubs.filter((s) => s.quizId === quizId);
          return cloudSubs;
        }
      } catch (err) {
        console.warn('Firestore getQuizSubmissions error, using local:', err);
      }
    }
    const all = getStored<QuizSubmission>(LS_QUIZ_SUBMISSIONS, []);
    if (quizId) return all.filter((s) => s.quizId === quizId);
    return all;
  },

  async saveQuizSubmission(submission: QuizSubmission): Promise<void> {
    const cleanSub: any = {};
    for (const [key, value] of Object.entries(submission)) {
      if (value !== undefined) {
        cleanSub[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'quiz_submissions', submission.id), cleanSub, { merge: true });
      } catch (err) {
        console.warn('Firestore saveQuizSubmission error:', err);
      }
    }
    const all = getStored<QuizSubmission>(LS_QUIZ_SUBMISSIONS, []);
    const idx = all.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      all[idx] = cleanSub;
    } else {
      all.unshift(cleanSub);
    }
    setStored(LS_QUIZ_SUBMISSIONS, all);
    notifySubscribers();
  },

  // --- MATERIALS (Materi Pembelajaran PJOK) ---
  async getMaterials(): Promise<MaterialItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'materials'));
        if (!snap.empty) {
          const cloudMaterials = snap.docs.map((d) => d.data() as MaterialItem);
          try {
            localStorage.setItem(LS_MATERIALS, JSON.stringify(cloudMaterials));
          } catch {}
          return cloudMaterials;
        }
      } catch (err) {
        console.warn('Firestore getMaterials error, using local fallback:', err);
      }
    }
    return getStored<MaterialItem>(LS_MATERIALS, INITIAL_MATERIALS);
  },

  async getMaterialsForClass(kelas: string): Promise<MaterialItem[]> {
    const list = await this.getMaterials();
    const cleanClass = (kelas || '').trim().toLowerCase();
    return list.filter(
      (m) =>
        (m.status === 'aktif' || m.status === 'buka' || !m.status) &&
        (m.kelas === 'Semua Kelas' ||
          m.kelas === 'Semua' ||
          m.kelas.trim().toLowerCase() === cleanClass)
    );
  },

  async getMaterial(id: string): Promise<MaterialItem | null> {
    const list = await this.getMaterials();
    return list.find((m) => m.id === id) || null;
  },

  async saveMaterial(material: MaterialItem): Promise<void> {
    const cleanMat: any = {};
    for (const [key, value] of Object.entries(material)) {
      if (value !== undefined) {
        cleanMat[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'materials', material.id), cleanMat, { merge: true });
      } catch (err) {
        console.warn('Firestore saveMaterial error:', err);
      }
    }
    const all = getStored<MaterialItem>(LS_MATERIALS, INITIAL_MATERIALS);
    const idx = all.findIndex((m) => m.id === material.id);
    if (idx >= 0) {
      all[idx] = cleanMat;
    } else {
      all.unshift(cleanMat);
    }
    setStored(LS_MATERIALS, all);
    notifySubscribers();
  },

  async toggleMaterialStatus(id: string, status: 'aktif' | 'draf' | 'buka' | 'kunci'): Promise<void> {
    const material = await this.getMaterial(id);
    if (!material) return;
    const updated: MaterialItem = {
      ...material,
      status,
      updatedAt: new Date().toISOString()
    };
    await this.saveMaterial(updated);
  },

  async deleteMaterial(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'materials', id));
      } catch (err) {
        console.warn('Firestore deleteMaterial error:', err);
      }
    }
    const all = getStored<MaterialItem>(LS_MATERIALS, INITIAL_MATERIALS);
    const filtered = all.filter((m) => m.id !== id);
    setStored(LS_MATERIALS, filtered);
    notifySubscribers();
  },

  // --- MATERIAL PROGRESS (Tracking progres belajar murid) ---
  async getMaterialProgress(materialId?: string): Promise<MaterialProgress[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'material_progress'));
        if (!snap.empty) {
          const cloudProgress = snap.docs.map((d) => d.data() as MaterialProgress);
          try {
            localStorage.setItem(LS_MATERIAL_PROGRESS, JSON.stringify(cloudProgress));
          } catch {}
          if (materialId) return cloudProgress.filter((p) => p.materialId === materialId);
          return cloudProgress;
        }
      } catch (err) {
        console.warn('Firestore getMaterialProgress error, using local:', err);
      }
    }
    const all = getStored<MaterialProgress>(LS_MATERIAL_PROGRESS, []);
    if (materialId) return all.filter((p) => p.materialId === materialId);
    return all;
  },

  async markMaterialCompleted(progress: MaterialProgress): Promise<void> {
    const cleanProgress: any = {};
    for (const [key, value] of Object.entries(progress)) {
      if (value !== undefined) {
        cleanProgress[key] = value;
      }
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'material_progress', progress.id), cleanProgress, { merge: true });
      } catch (err) {
        console.warn('Firestore markMaterialCompleted error:', err);
      }
    }
    const all = getStored<MaterialProgress>(LS_MATERIAL_PROGRESS, []);
    const idx = all.findIndex((p) => p.id === progress.id);
    if (idx >= 0) {
      all[idx] = cleanProgress;
    } else {
      all.unshift(cleanProgress);
    }
    setStored(LS_MATERIAL_PROGRESS, all);
    notifySubscribers();
  },

  // --- TUGAS PEMBELAJARAN (Learning Tasks) ---
  async getLearningTasks(kelas?: string, onlyActive: boolean = false): Promise<LearningTaskItem[]> {
    let result: LearningTaskItem[] = [];
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'learning_tasks'));
        if (!snap.empty) {
          const cloudTasks = snap.docs.map((d) => d.data() as LearningTaskItem);
          try {
            localStorage.setItem(LS_LEARNING_TASKS, JSON.stringify(cloudTasks));
          } catch {}
          result = cloudTasks;
        }
      } catch (err) {
        console.warn('Firestore getLearningTasks error, fallback to local storage:', err);
      }
    }
    if (result.length === 0) {
      result = getStored<LearningTaskItem>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
    }
    let filtered = result;
    if (kelas && kelas !== 'Semua Kelas') {
      filtered = filtered.filter((t) => {
        if (!t.kelas || t.kelas === 'Semua Kelas') return true;
        if (t.targetClasses && Array.isArray(t.targetClasses)) {
          if (t.targetClasses.includes('Semua Kelas') || t.targetClasses.includes(kelas)) {
            return true;
          }
        }
        const splitted = t.kelas.split(',').map((s) => s.trim());
        return splitted.includes('Semua Kelas') || splitted.includes(kelas);
      });
    }
    if (onlyActive) {
      filtered = filtered.filter((t) => t.status === 'aktif');
    }
    return filtered;
  },

  async getLearningTask(id: string): Promise<LearningTaskItem | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'learning_tasks', id));
        if (snap.exists()) {
          return snap.data() as LearningTaskItem;
        }
      } catch (err) {
        console.warn('Firestore getLearningTask error:', err);
      }
    }
    const all = getStored<LearningTaskItem>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
    return all.find((t) => t.id === id) || null;
  },

  async saveLearningTask(task: LearningTaskItem): Promise<void> {
    const cleanTask = JSON.parse(JSON.stringify(task));
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'learning_tasks', task.id), cleanTask, { merge: true });
      } catch (err) {
        console.warn('Firestore saveLearningTask error:', err);
      }
    }
    const all = getStored<LearningTaskItem>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      all[idx] = cleanTask;
    } else {
      all.unshift(cleanTask);
    }
    setStored(LS_LEARNING_TASKS, all);
    notifySubscribers();
  },

  async deleteLearningTask(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'learning_tasks', id));
      } catch (err) {
        console.warn('Firestore deleteLearningTask error:', err);
      }
    }
    const all = getStored<LearningTaskItem>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
    const filtered = all.filter((t) => t.id !== id);
    setStored(LS_LEARNING_TASKS, filtered);
    notifySubscribers();
  },

  // --- PENGUMPULAN TUGAS PEMBELAJARAN (Learning Submissions) ---
  async getLearningSubmissions(taskId?: string, studentId?: string): Promise<LearningTaskSubmission[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'learning_submissions'));
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as LearningTaskSubmission);
          try {
            localStorage.setItem(LS_LEARNING_SUBMISSIONS, JSON.stringify(cloudSubs));
          } catch {}
          let result = cloudSubs;
          if (taskId) result = result.filter((s) => s.taskId === taskId);
          if (studentId) result = result.filter((s) => s.studentId === studentId);
          return result;
        }
      } catch (err) {
        console.warn('Firestore getLearningSubmissions error:', err);
      }
    }
    let local = getStored<LearningTaskSubmission>(LS_LEARNING_SUBMISSIONS, []);
    if (taskId) local = local.filter((s) => s.taskId === taskId);
    if (studentId) local = local.filter((s) => s.studentId === studentId);
    return local;
  },

  async saveLearningSubmission(submission: LearningTaskSubmission): Promise<void> {
    const cleanSub = JSON.parse(JSON.stringify(submission));
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'learning_submissions', submission.id), cleanSub, { merge: true });
      } catch (err) {
        console.warn('Firestore saveLearningSubmission error:', err);
      }
    }
    const all = getStored<LearningTaskSubmission>(LS_LEARNING_SUBMISSIONS, []);
    const idx = all.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      all[idx] = cleanSub;
    } else {
      all.unshift(cleanSub);
    }
    setStored(LS_LEARNING_SUBMISSIONS, all);
    notifySubscribers();
  },

  async deleteLearningSubmission(id: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'learning_submissions', id));
      } catch (err) {
        console.warn('Firestore deleteLearningSubmission error:', err);
      }
    }
    const all = getStored<LearningTaskSubmission>(LS_LEARNING_SUBMISSIONS, []);
    const filtered = all.filter((s) => s.id !== id);
    setStored(LS_LEARNING_SUBMISSIONS, filtered);
    notifySubscribers();
  },

  async resetToSeedData(): Promise<{ success: boolean; message: string }> {
    return await this.resetAllDatabase();
  },

  /**
   * Mengunggah seluruh data lokal (pengaturan, kelas, indikator, tugas, pengguna, kuis)
   * ke Firestore agar tersinkronisasi 100% antar laptop dan HP.
   */
  async syncAllLocalDataToCloud(): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        message: 'Koneksi Firebase Cloud belum aktif di perangkat ini.'
      };
    }

    const firestore = db;
    let successCount = 0;
    let failCount = 0;

    const safeSet = async (pathRef: any, data: any) => {
      try {
        await setDoc(pathRef, data, { merge: true });
        successCount++;
      } catch (e: any) {
        failCount++;
        console.warn('Sync item notice:', e);
      }
    };

    // Helper untuk menjalankan batch write secara paralel dalam kelompok kecil (chunks)
    const runInChunks = async <T>(items: T[], fn: (item: T) => Promise<void>, chunkSize = 20) => {
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(fn));
      }
    };

    try {
      // 1. Sinkronkan Pengaturan Aplikasi & Logo
      const currentConfig = await this.getAppConfig();
      await safeSet(doc(firestore, 'settings', 'app_config'), currentConfig);

      // 2. Sinkronkan Pengguna / Murid & Guru secara paralel cepat
      const localUsers = getStored<UserProfile>(LS_USERS, []);
      await runInChunks(localUsers, async (u) => {
        const uWithTime: UserProfile = {
          ...u,
          updatedAt: u.updatedAt || u.createdAt || new Date().toISOString()
        };
        await safeSet(doc(firestore, 'pengguna', u.uid), uWithTime);
      });

      // 3. Sinkronkan Kelas
      const localClasses = getStored<ClassItem>(LS_CLASSES, INITIAL_CLASSES);
      await runInChunks(localClasses, async (c) => {
        await safeSet(doc(firestore, 'classes', c.id), c);
      });

      // 4. Sinkronkan Indikator
      const localIndicators = getStored<IndicatorItem>(LS_INDICATORS, INITIAL_INDICATORS);
      await runInChunks(localIndicators, async (ind) => {
        await safeSet(doc(firestore, 'indicators', ind.id), ind);
      });

      // 5. Sinkronkan Tugas Penilaian
      const localTasks = getStored<AssessmentTask>(LS_TASKS, INITIAL_TASKS);
      await runInChunks(localTasks, async (t) => {
        await safeSet(doc(firestore, 'tasks', t.id), t);
      });

      // 6. Sinkronkan Penilaian Murid
      const localAssessments = getStored<AssessmentRecord>(LS_ASSESSMENTS, INITIAL_ASSESSMENTS);
      await runInChunks(localAssessments, async (a) => {
        await safeSet(doc(firestore, 'assessments', a.id), a);
      });

      // 7. Sinkronkan Kuis
      const localQuizzes = getStored<QuizItem>(LS_QUIZZES, INITIAL_QUIZZES);
      await runInChunks(localQuizzes, async (q) => {
        await safeSet(doc(firestore, 'quizzes', q.id), q);
      });

      // 8. Sinkronkan Materi Pembelajaran
      const localMaterials = getStored<MaterialItem>(LS_MATERIALS, INITIAL_MATERIALS);
      await runInChunks(localMaterials, async (m) => {
        await safeSet(doc(firestore, 'materials', m.id), m);
      });

      // 9. Sinkronkan Tugas Pembelajaran
      const localLearningTasks = getStored<LearningTaskItem>(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS);
      await runInChunks(localLearningTasks, async (lt) => {
        await safeSet(doc(firestore, 'learning_tasks', lt.id), lt);
      });

      // 10. Sinkronkan Notifikasi
      const localNotifs = getStored<AppNotification>(LS_NOTIFICATIONS, []);
      await runInChunks(localNotifs, async (n) => {
        await safeSet(doc(firestore, 'notifications', n.id), n);
      });

      notifySubscribers();

      if (failCount > 0 && successCount === 0) {
        return {
          success: false,
          message: 'Penyimpanan cloud Firebase saat ini sedang mencapai limit kuota harian. Silakan tunggu reset kuota (pukul 07.00 WIB) atau ekspor data cadangan (.json) langsung ke HP.'
        };
      }

      return {
        success: true,
        message: `Berhasil menyinkronkan ${successCount} data ke Firebase Cloud! Sekarang buka di HP atau Laptop lain sudah 100% sama.`
      };
    } catch (error: any) {
      console.error('Error saat sinkronisasi ke cloud:', error);
      return {
        success: false,
        message: error?.message || 'Gagal menyinkronkan data ke cloud.'
      };
    }
  },

  /**
   * Ekspor seluruh basis data aplikasi ke satu berkas JSON cadangan mandiri
   */
  exportAllDataAsJSON(): string {
    let cfg = INITIAL_APP_CONFIG;
    try {
      const raw = localStorage.getItem(LS_APP_CONFIG);
      if (raw) cfg = JSON.parse(raw);
    } catch {}

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: cfg,
      users: getStored(LS_USERS, INITIAL_USERS),
      classes: getStored(LS_CLASSES, INITIAL_CLASSES),
      indicators: getStored(LS_INDICATORS, INITIAL_INDICATORS),
      tasks: getStored(LS_TASKS, INITIAL_TASKS),
      assessments: getStored(LS_ASSESSMENTS, INITIAL_ASSESSMENTS),
      quizzes: getStored(LS_QUIZZES, INITIAL_QUIZZES),
      quizSubmissions: getStored(LS_QUIZ_SUBMISSIONS, []),
      materials: getStored(LS_MATERIALS, INITIAL_MATERIALS),
      materialProgress: getStored(LS_MATERIAL_PROGRESS, []),
      learningTasks: getStored(LS_LEARNING_TASKS, INITIAL_LEARNING_TASKS),
      learningSubmissions: getStored(LS_LEARNING_SUBMISSIONS, []),
      notifications: getStored(LS_NOTIFICATIONS, [])
    };
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Pulihkan / Impor seluruh basis data dari berkas JSON cadangan (misal dikirim dari laptop ke HP)
   */
  importAllDataFromJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data) throw new Error('Berkas JSON tidak valid');

      if (data.config) localStorage.setItem(LS_APP_CONFIG, JSON.stringify(data.config));
      if (data.users) localStorage.setItem(LS_USERS, JSON.stringify(data.users));
      if (data.classes) localStorage.setItem(LS_CLASSES, JSON.stringify(data.classes));
      if (data.indicators) localStorage.setItem(LS_INDICATORS, JSON.stringify(data.indicators));
      if (data.tasks) localStorage.setItem(LS_TASKS, JSON.stringify(data.tasks));
      if (data.assessments) localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(data.assessments));
      if (data.quizzes) localStorage.setItem(LS_QUIZZES, JSON.stringify(data.quizzes));
      if (data.quizSubmissions) localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify(data.quizSubmissions));
      if (data.materials) localStorage.setItem(LS_MATERIALS, JSON.stringify(data.materials));
      if (data.materialProgress) localStorage.setItem(LS_MATERIAL_PROGRESS, JSON.stringify(data.materialProgress));
      if (data.learningTasks) localStorage.setItem(LS_LEARNING_TASKS, JSON.stringify(data.learningTasks));
      if (data.learningSubmissions) localStorage.setItem(LS_LEARNING_SUBMISSIONS, JSON.stringify(data.learningSubmissions));
      if (data.notifications) localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(data.notifications));

      notifySubscribers();
      return {
        success: true,
        message: 'Data aplikasi berhasil dipulihkan 100%! Semua data kelas, siswa, tugas, dan nilai telah terpasang.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Gagal memulihkan berkas: ' + (e?.message || 'Format JSON tidak valid.')
      };
    }
  },

  async seedPenggunaToFirestoreIfEmpty(): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    try {
      const snapPengguna = await getDocs(collection(db, 'pengguna')).catch(() => null);
      // HANYA seed pengguna jika koleksi pengguna di Firestore benar-benar KOSONG!
      // Jika sudah ada data akun guru atau murid, JANGAN pernah timpa lagi agar data username tidak berubah!
      if (!snapPengguna || snapPengguna.empty) {
        for (const user of INITIAL_USERS) {
          const userWithTime: UserProfile = {
            ...user,
            updatedAt: user.createdAt || new Date().toISOString()
          };
          await Promise.all([
            setDoc(doc(db, 'pengguna', user.uid), userWithTime, { merge: true }),
            setDoc(doc(db, 'users', user.uid), userWithTime, { merge: true })
          ]);
        }
      }
      // Pastikan app_config juga ada di Firestore
      const snapConfig = await getDoc(doc(db, 'settings', 'app_config'));
      if (!snapConfig.exists()) {
        const stored = localStorage.getItem(LS_APP_CONFIG);
        const cfg = stored ? JSON.parse(stored) : INITIAL_APP_CONFIG;
        await setDoc(doc(db, 'settings', 'app_config'), cfg, { merge: true });
      }
      // Pastikan initial kuis ada di Firestore jika kosong
      const snapQuiz = await getDocs(collection(db, 'quizzes'));
      if (snapQuiz.empty) {
        for (const q of INITIAL_QUIZZES) {
          await setDoc(doc(db, 'quizzes', q.id), q, { merge: true });
        }
      }
      // Pastikan initial materi pembelajaran ada di Firestore jika kosong
      const snapMaterials = await getDocs(collection(db, 'materials'));
      if (snapMaterials.empty) {
        for (const m of INITIAL_MATERIALS) {
          await setDoc(doc(db, 'materials', m.id), m, { merge: true });
        }
      }
      // Pastikan initial tugas pembelajaran ada di Firestore jika kosong
      const snapLT = await getDocs(collection(db, 'learning_tasks'));
      if (snapLT.empty) {
        for (const lt of INITIAL_LEARNING_TASKS) {
          await setDoc(doc(db, 'learning_tasks', lt.id), lt, { merge: true });
        }
      }
    } catch (e) {
      console.warn('seedPenggunaToFirestore notice:', e);
    }
  },

  /**
   * Reset total seluruh basis data aplikasi (Lokal & Cloud Firebase) ke konfigurasi bawaan bersih SMA Negeri 1 Tejakula
   */
  async resetAllDatabase(): Promise<{ success: boolean; message: string }> {
    // 1. Bersihkan semua kunci local storage
    localStorage.removeItem(LS_DELETED_CLASSES);
    localStorage.removeItem(LS_DELETED_USERS);
    localStorage.removeItem(LS_USERS);
    localStorage.removeItem(LS_CLASSES);
    localStorage.removeItem(LS_INDICATORS);
    localStorage.removeItem(LS_TASKS);
    localStorage.removeItem(LS_ASSESSMENTS);
    localStorage.removeItem(LS_APP_CONFIG);
    localStorage.removeItem(LS_QUIZZES);
    localStorage.removeItem(LS_QUIZ_SUBMISSIONS);
    localStorage.removeItem(LS_MATERIALS);
    localStorage.removeItem(LS_MATERIAL_PROGRESS);
    localStorage.removeItem(LS_LEARNING_TASKS);
    localStorage.removeItem(LS_LEARNING_SUBMISSIONS);
    localStorage.removeItem(LS_NOTIFICATIONS);

    // 2. Tanam data bawaan bersih
    localStorage.setItem(LS_USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(LS_CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(LS_INDICATORS, JSON.stringify(INITIAL_INDICATORS));
    localStorage.setItem(LS_TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
    localStorage.setItem(LS_APP_CONFIG, JSON.stringify(INITIAL_APP_CONFIG));
    localStorage.setItem(LS_QUIZZES, JSON.stringify(INITIAL_QUIZZES));
    localStorage.setItem(LS_QUIZ_SUBMISSIONS, JSON.stringify([]));
    localStorage.setItem(LS_MATERIALS, JSON.stringify(INITIAL_MATERIALS));
    localStorage.setItem(LS_MATERIAL_PROGRESS, JSON.stringify([]));
    localStorage.setItem(LS_LEARNING_TASKS, JSON.stringify(INITIAL_LEARNING_TASKS));
    localStorage.setItem(LS_LEARNING_SUBMISSIONS, JSON.stringify([]));
    localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify([]));

    // 3. Sinkronkan dan reset Firebase Firestore jika terhubung
    let cloudSynced = false;
    if (isFirebaseConfigured() && db) {
      try {
        const firestore = db;

        // Simpan kelas bawaan XI 1 s/d XI 9 ke Firestore
        for (const cl of INITIAL_CLASSES) {
          await setDoc(doc(firestore, 'classes', cl.id), cl, { merge: true }).catch(() => {});
        }
        deleteDoc(doc(firestore, 'classes', 'class-x-1')).catch(() => {});
        deleteDoc(doc(firestore, 'classes', 'class-xii-1')).catch(() => {});

        // Simpan pengguna bawaan (Guru dan seluruh murid XI 1 s/d XI 9)
        for (const u of INITIAL_USERS) {
          const uData = {
            ...u,
            updatedAt: new Date().toISOString()
          };
          await Promise.all([
            setDoc(doc(firestore, 'pengguna', u.uid), uData, { merge: true }).catch(() => {}),
            setDoc(doc(firestore, 'users', u.uid), uData, { merge: true }).catch(() => {})
          ]);
        }

        // Simpan indikator, tugas, asesmen, pengaturan, kuis, materi
        for (const ind of INITIAL_INDICATORS) {
          await setDoc(doc(firestore, 'indicators', ind.id), ind, { merge: true }).catch(() => {});
        }
        for (const t of INITIAL_TASKS) {
          await setDoc(doc(firestore, 'tasks', t.id), t, { merge: true }).catch(() => {});
        }
        for (const a of INITIAL_ASSESSMENTS) {
          await setDoc(doc(firestore, 'assessments', a.id), a, { merge: true }).catch(() => {});
        }
        await setDoc(doc(firestore, 'settings', 'app_config'), INITIAL_APP_CONFIG, { merge: true }).catch(() => {});
        for (const q of INITIAL_QUIZZES) {
          await setDoc(doc(firestore, 'quizzes', q.id), q, { merge: true }).catch(() => {});
        }
        for (const m of INITIAL_MATERIALS) {
          await setDoc(doc(firestore, 'materials', m.id), m, { merge: true }).catch(() => {});
        }
        for (const lt of INITIAL_LEARNING_TASKS) {
          await setDoc(doc(firestore, 'learning_tasks', lt.id), lt, { merge: true }).catch(() => {});
        }
        cloudSynced = true;
      } catch (err) {
        console.warn('Reset Firestore warning:', err);
      }
    }

    notifySubscribers();
    return {
      success: true,
      message: cloudSynced
        ? 'Seluruh database lokal & Cloud Firebase berhasil di-reset ulang ke data bersih (Kelas XI 1 - XI 9 dan murid SMA N 1 Tejakula).'
        : 'Seluruh database lokal berhasil di-reset ulang ke data bersih (Kelas XI 1 - XI 9 dan murid SMA N 1 Tejakula).'
    };
  },

  // Reset database back to default seed data
  resetToDefaults() {
    this.resetAllDatabase().catch((e) => console.warn('resetAllDatabase notice:', e));
  },

  // --- NOTIFICATIONS SYSTEM ---
  async getNotifications(userId?: string, userClass?: string): Promise<AppNotification[]> {
    const all = getStored<AppNotification>(LS_NOTIFICATIONS, []);
    if (!userId) return all;

    const cleanUid = userId.toLowerCase().trim();
    const cleanClass = userClass ? userClass.toLowerCase().trim() : '';

    return all.filter((n) => {
      const target = (n.userId || '').toLowerCase().trim();
      if (target === 'all' || target === cleanUid) return true;
      if (cleanClass && (target === `class:${cleanClass}` || target === cleanClass)) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveNotification(notif: AppNotification): Promise<void> {
    const all = getStored<AppNotification>(LS_NOTIFICATIONS, []);
    const idx = all.findIndex((n) => n.id === notif.id);
    if (idx >= 0) {
      all[idx] = notif;
    } else {
      all.unshift(notif);
    }
    setStored(LS_NOTIFICATIONS, all);
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
      } catch (err) {
        console.warn('Firestore saveNotification error (tersimpan lokal):', err);
      }
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const all = getStored<AppNotification>(LS_NOTIFICATIONS, []);
    const target = all.find((n) => n.id === id);
    if (target) {
      target.read = true;
      setStored(LS_NOTIFICATIONS, all);
      notifySubscribers();

      if (isFirebaseConfigured() && db) {
        try {
          await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
        } catch {}
      }
    }
  },

  async markAllNotificationsAsRead(userId?: string, userClass?: string): Promise<void> {
    const all = getStored<AppNotification>(LS_NOTIFICATIONS, []);
    const cleanUid = userId ? userId.toLowerCase().trim() : '';
    const cleanClass = userClass ? userClass.toLowerCase().trim() : '';

    const updated = all.map((n) => {
      const target = (n.userId || '').toLowerCase().trim();
      const isMine =
        !userId ||
        target === 'all' ||
        target === cleanUid ||
        (cleanClass && (target === `class:${cleanClass}` || target === cleanClass));
      if (isMine) {
        return { ...n, read: true };
      }
      return n;
    });

    setStored(LS_NOTIFICATIONS, updated);
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      for (const n of updated) {
        if (n.read) {
          setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true }).catch(() => {});
        }
      }
    }
  },

  async deleteNotification(id: string): Promise<void> {
    const all = getStored<AppNotification>(LS_NOTIFICATIONS, []);
    const filtered = all.filter((n) => n.id !== id);
    setStored(LS_NOTIFICATIONS, filtered);
    notifySubscribers();

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch {}
    }
  }
};
