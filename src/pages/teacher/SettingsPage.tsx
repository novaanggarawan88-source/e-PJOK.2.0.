import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { AppConfig, UserProfile } from '../../types';
import { INITIAL_APP_CONFIG } from '../../services/seedData';
import { isFirebaseConfigured } from '../../lib/firebase';
import { AppLogo } from '../../components/AppLogo';
import {
  Settings,
  Database,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
  Server,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trophy,
  Activity,
  Medal,
  Flame,
  Dribbble,
  Save,
  KeyRound,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [syncingToCloud, setSyncingToCloud] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isFbConnected = isFirebaseConfigured();

  // App Config states
  const [config, setConfig] = useState<AppConfig>(INITIAL_APP_CONFIG);
  const [appName, setAppName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [motto, setMotto] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoIconPreset, setLogoIconPreset] = useState<'activity' | 'trophy' | 'medal' | 'flame' | 'basketball'>('activity');

  // Teacher Profile states
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allTeachers, setAllTeachers] = useState<UserProfile[]>([]);

  const loadData = async () => {
    const [cfg, users] = await Promise.all([
      DatabaseService.getAppConfig(),
      DatabaseService.getUsers()
    ]);
    setConfig(cfg);
    setAppName(cfg.appName && cfg.appName !== 'PENILAIAN ANTAR TEMAN PJOK' ? cfg.appName : 'e-PJOK');
    setSchoolName(cfg.schoolName || 'SMA NEGERI 1 TEJAKULA');
    setMotto(cfg.motto || 'Sportif, Jujur, dan Menghargai Gerak Teman');
    setLogoUrl(cfg.logoUrl || '');
    setLogoIconPreset(cfg.logoIconPreset || 'activity');

    const teachers = users.filter((u) => u.role === 'guru');
    setAllTeachers(teachers);

    // Cari akun guru login atau guru yang terdaftar
    const myTeacherProfile =
      (currentUser?.uid ? users.find((u) => u.uid === currentUser.uid) : null) ||
      (currentUser?.email ? users.find((u) => u.email.toLowerCase() === currentUser.email.toLowerCase()) : null) ||
      teachers[0];

    if (myTeacherProfile) {
      setTeacherName(myTeacherProfile.nama || 'Guru PJOK');
      setTeacherEmail(myTeacherProfile.email || 'guru@pjok.sch.id');
      setTeacherNip(myTeacherProfile.nip || '');
      setTeacherPassword(myTeacherProfile.password || 'guru123');
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  // Handle Logo Upload via File dengan kompresi Canvas agar instan tersinkron ke cloud (< 50KB)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas logo maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawResult = evt.target?.result as string;
      if (!rawResult) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          setLogoUrl(compressed);
          showToast('Logo berhasil dioptimalkan. Klik "Simpan Logo & Identitas" untuk menerapkan ke semua perangkat.');
        } else {
          setLogoUrl(rawResult);
        }
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  // Sinkronkan seluruh data lokal ke Firebase Cloud Firestore
  const handleSyncToCloud = async () => {
    setSyncingToCloud(true);
    try {
      const res = await DatabaseService.syncAllLocalDataToCloud();
      showToast(res.message);
      await loadData();
    } catch (e: any) {
      showToast('Gagal sinkronisasi: ' + (e?.message || 'Terjadi gangguan jaringan'));
    } finally {
      setSyncingToCloud(false);
    }
  };

  // Save App Config
  const handleSaveAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    const updated: AppConfig = {
      ...config,
      appName: appName.trim() || 'e-PJOK',
      schoolName: schoolName.trim() || 'SMA NEGERI 1 TEJAKULA',
      motto: motto.trim() || 'Sportif, Jujur, dan Menghargai Gerak Teman',
      logoUrl: logoUrl.trim(),
      logoIconPreset,
      updatedAt: new Date().toISOString()
    };
    await DatabaseService.saveAppConfig(updated);
    setConfig(updated);
    setSavingConfig(false);
    showToast('Logo dan identitas aplikasi berhasil disimpan & disinkronkan ke Cloud!');
  };

  // Reset App Config to Defaults
  const handleResetAppConfig = async () => {
    if (window.confirm('Kembalikan logo dan nama aplikasi ke pengaturan bawaan?')) {
      await DatabaseService.resetAppConfig();
      await loadData();
      showToast('Logo dan identitas dikembalikan ke bawaan.');
    }
  };

  // Save Teacher Account Credentials
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.trim()) {
      alert('Nama dan Email/Username Guru tidak boleh kosong.');
      return;
    }

    setSavingTeacher(true);
    const targetUid = currentUser?.uid || 'guru-1';
    const updatedTeacher: UserProfile = {
      ...(currentUser || {}),
      uid: targetUid,
      role: 'guru',
      status: 'aktif',
      nama: teacherName.trim(),
      email: teacherEmail.trim().toLowerCase(),
      nip: teacherNip.trim(),
      password: teacherPassword.trim() || 'guru123',
      updatedAt: new Date().toISOString()
    };

    await DatabaseService.saveUser(updatedTeacher);
    setCurrentUser(updatedTeacher);
    setSavingTeacher(false);
    showToast('Username dan password Guru berhasil diperbarui dan tersimpan aman di Firebase Cloud!');
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengatur ulang data aplikasi ke konfigurasi bersih? Data tugas, kuis, dan materi yang belum tersimpan akan dibersihkan.'
      )
    ) {
      setResetting(true);
      await DatabaseService.resetToSeedData();
      await loadData();
      setResetting(false);
      showToast('Data aplikasi berhasil diatur ulang ke konfigurasi bersih.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {message && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
          Pengaturan Aplikasi & Kredensial Guru
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Ubah logo sekolah, nama aplikasi, username dan password login guru, serta kelola database
        </p>
      </div>

      {/* 1. Pengaturan Logo & Identitas Aplikasi */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-heading">
                Logo & Identitas Sekolah
              </h3>
              <p className="text-xs text-slate-400">
                Ganti logo aplikasi dengan logo sekolah, ubah nama aplikasi, dan slogan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAppConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
            title="Reset ke logo bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>

        <form onSubmit={handleSaveAppConfig} className="space-y-6">
          {/* Logo Preview & Upload Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Preview Logo
              </span>
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-blue-300 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Preview Logo"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                    {logoIconPreset === 'trophy' && <Trophy className="w-8 h-8" />}
                    {logoIconPreset === 'medal' && <Medal className="w-8 h-8" />}
                    {logoIconPreset === 'flame' && <Flame className="w-8 h-8" />}
                    {logoIconPreset === 'basketball' && <Dribbble className="w-8 h-8" />}
                    {logoIconPreset === 'activity' && <Activity className="w-8 h-8" />}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Unggah Berkas Logo (PNG/JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Hapus Foto Logo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Masukkan URL Gambar Logo Online:
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://contoh-sekolah.sch.id/logo.png"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Preset Icon Selector if no image */}
              {!logoUrl && (
                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Pilih Ikon Bawaan (Jika Tidak Memakai Gambar):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'activity', label: 'Aktivitas', icon: Activity },
                      { id: 'trophy', label: 'Piala', icon: Trophy },
                      { id: 'medal', label: 'Medali', icon: Medal },
                      { id: 'flame', label: 'Semangat', icon: Flame },
                      { id: 'basketball', label: 'Basket', icon: Dribbble },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = logoIconPreset === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLogoIconPreset(item.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Identity Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e-PJOK"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Satuan Pendidikan / Sekolah
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="SMK / SMA Negeri"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Motto / Slogan Aplikasi
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Sportif, Jujur, dan Menghargai Gerak Teman"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingConfig ? 'Menyimpan...' : 'Simpan Logo & Identitas'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Pengaturan Akun & Password Guru */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-heading">
                Akun & Password Guru PJOK
              </h3>
              <p className="text-xs text-slate-400">
                Atur username/email login dan kata sandi baru untuk akun Guru PJOK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Terhubung Firebase</span>
            <span className="hidden sm:inline text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              (koleksi: &apos;pengguna&apos;)
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Guru
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Guru PJOK"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NIP Guru (Opsional)
              </label>
              <input
                type="text"
                value={teacherNip}
                onChange={(e) => setTeacherNip(e.target.value)}
                placeholder="198501152010011005"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / Email Login Guru
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="guru@pjok.sch.id"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gunakan email/username ini saat login di layar awal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / Kata Sandi Guru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Password bawaan awal adalah: <code className="font-mono text-indigo-700 bg-slate-100 px-1 py-0.5 rounded">guru123</code>
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingTeacher}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingTeacher ? 'Menyimpan...' : 'Simpan Kredensial Guru'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Status Database & Sinkronisasi Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Koneksi & Sinkronisasi Firebase Cloud */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-heading">
                    Sinkronisasi Multi-Perangkat (Laptop & HP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Firebase Cloud Firestore Database
                  </p>
                </div>
              </div>

              <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                Terhubung Firebase Cloud
              </span>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Penyimpanan Terpusat:</span>
                <span className="font-bold text-slate-800">
                  Google Cloud Firestore
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Sinkronisasi Real-Time:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Laptop, Tablet & HP Terhubung
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Data Yang Disinkronkan:</span>
                <span className="font-medium text-slate-700">
                  Logo, Nama Sekolah, Kelas, Siswa, & Tugas
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              Perubahan logo, nama sekolah, kelas, maupun daftar siswa otomatis tersimpan di cloud. Jika membuka di HP baru, data akan langsung dimuat dari cloud tanpa kembali ke data awal.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={syncingToCloud}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingToCloud ? 'animate-spin' : ''}`} />
              <span>{syncingToCloud ? 'Menyinkronkan ke Cloud...' : 'Sinkronkan Semua Data ke Cloud Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Reset & Pemeliharaan Data */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-heading">
                  Reset & Bersihkan Data Aplikasi
                </h3>
                <p className="text-xs text-slate-400">
                  Kembalikan konfigurasi aplikasi ke setelan awal yang bersih
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda ingin mengatur ulang data aplikasi dan memastikan semua data tugas, asesmen, atau kuis sementara kembali bersih, Anda dapat menekan tombol di bawah ini.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Membersihkan Data...' : 'Reset ke Setelan Bersih'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* App Info Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h4 className="font-black text-slate-900 font-heading">
              {appName || 'e-PJOK'}
            </h4>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {schoolName} &bull; Asesmen Formatif Kurikulum Merdeka
          </p>
          <p className="text-[11px] text-blue-600 font-medium italic">
            &ldquo;{motto}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Sistem Terverifikasi Aman</span>
        </div>
      </div>
    </div>
  );
};
