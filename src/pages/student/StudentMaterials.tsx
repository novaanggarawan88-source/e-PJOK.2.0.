import React, { useState, useEffect } from 'react';
import { MaterialItem, MaterialProgress } from '../../types';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { formatEmbedUrl, isGoogleAppsScriptUrl } from '../teacher/MaterialManagement';
import {
  BookOpen,
  Lock,
  Unlock,
  Key,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  Video,
  Presentation,
  FileText,
  Globe,
  Sparkles,
  ExternalLink,
  Code,
  Layers,
  Link as LinkIcon
} from 'lucide-react';

export const StudentMaterials: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [myProgress, setMyProgress] = useState<MaterialProgress[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<MaterialItem | null>(null);
  const [activeViewUrl, setActiveViewUrl] = useState<string>('');
  const [studentTab, setStudentTab] = useState<'frame' | 'columns'>('frame');

  // PIN unlock state per material
  const [pinInputs, setPinInputs] = useState<{ [materialId: string]: string }>({});
  const [pinError, setPinError] = useState<{ [materialId: string]: string }>({});
  const [unlockedByPin, setUnlockedByPin] = useState<{ [materialId: string]: boolean }>({});

  const [hasMarkedDone, setHasMarkedDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Study timer state
  const [secondsStudied, setSecondsStudied] = useState<number>(0);

  const loadData = async () => {
    if (!user) return;
    const userClass = user.kelas || 'XI 7';
    const [mList, pList] = await Promise.all([
      DatabaseService.getMaterialsForClass(userClass),
      DatabaseService.getMaterialProgress()
    ]);

    setMaterials(mList);
    const mine = pList.filter((p) => p.studentId === user.uid);
    setMyProgress(mine);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Timer effect when material viewer is open
  useEffect(() => {
    if (!activeMaterial) {
      setSecondsStudied(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsStudied((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMaterial]);

  const handleUnlockWithPin = (item: MaterialItem) => {
    const entered = (pinInputs[item.id] || '').trim().toUpperCase();
    const correctPin = (item.kodeKunci || '').trim().toUpperCase();

    if (!entered) {
      setPinError({ ...pinError, [item.id]: 'Masukkan PIN kunci terlebih dahulu!' });
      return;
    }

    if (entered === correctPin) {
      setUnlockedByPin({ ...unlockedByPin, [item.id]: true });
      setPinError({ ...pinError, [item.id]: '' });
    } else {
      setPinError({ ...pinError, [item.id]: 'PIN salah! Tanyakan pada Guru PJOK di kelas.' });
    }
  };

  const handleOpenMaterial = (item: MaterialItem) => {
    setActiveMaterial(item);
    setActiveViewUrl(item.linkUrl);
    setStudentTab('frame');
    setHasMarkedDone(false);
  };

  const handleCloseMaterial = () => {
    setActiveMaterial(null);
  };

  const handleMarkAsDone = async () => {
    if (!user || !activeMaterial) return;

    const progressData: MaterialProgress = {
      id: `mprog-${activeMaterial.id}-${user.uid}`,
      materialId: activeMaterial.id,
      studentId: user.uid,
      studentName: user.nama,
      studentClass: user.kelas || 'XI 7',
      completedAt: new Date().toISOString()
    };

    await DatabaseService.markMaterialCompleted(progressData);
    setHasMarkedDone(true);
    await loadData();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Google Apps Script / Web App':
        return <Code className="w-4 h-4 text-teal-400" />;
      case 'Video Pembelajaran':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'Slide / PPT':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'Modul / PDF':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-teal-500" />;
    }
  };

  // If in active material viewer mode
  if (activeMaterial) {
    const isDone = myProgress.some((p) => p.materialId === activeMaterial.id) || hasMarkedDone;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-white">
        {/* Top Control Bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseMaterial}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <div className="max-w-[200px] sm:max-w-md md:max-w-xl truncate">
              <h3 className="text-sm font-black truncate leading-tight">
                {activeMaterial.judul}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-teal-400">
                <span>{activeMaterial.materi}</span>
                <span>•</span>
                <span className="text-slate-400">{activeMaterial.kategori}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Open in new tab button */}
            {studentTab === 'frame' && activeViewUrl && (
              <a
                href={activeViewUrl.startsWith('http') ? activeViewUrl : `https://${activeViewUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                title="Buka link di tab baru browser"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tab Baru</span>
              </a>
            )}

            {/* Study timer */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-teal-300">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{formatTime(secondsStudied)}</span>
            </div>

            {/* Mark as Done Button */}
            <button
              onClick={handleMarkAsDone}
              disabled={isDone}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                isDone
                  ? 'bg-emerald-700 text-white cursor-default'
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDone ? 'Sudah Dipelajari' : 'Tandai Selesai Dipelajari'}</span>
            </button>
          </div>
        </header>

        {/* Tab Selector if multiple links or extra columns exist */}
        {(activeMaterial.linkTambahan?.length || activeMaterial.kolomMateriTambahan?.length) ? (
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
              Pilihan Materi:
            </span>
            <button
              onClick={() => {
                setStudentTab('frame');
                setActiveViewUrl(activeMaterial.linkUrl);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                studentTab === 'frame' && activeViewUrl === activeMaterial.linkUrl
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tautan Utama {isGoogleAppsScriptUrl(activeMaterial.linkUrl) ? '(AppScript)' : ''}
            </button>

            {activeMaterial.linkTambahan?.map((lt, idx) => (
              <button
                key={lt.id || idx}
                onClick={() => {
                  setStudentTab('frame');
                  setActiveViewUrl(lt.url);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  studentTab === 'frame' && activeViewUrl === lt.url
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lt.judul || `Link #${idx + 2}`} {isGoogleAppsScriptUrl(lt.url) ? '(AppScript)' : ''}
              </button>
            ))}

            {activeMaterial.kolomMateriTambahan && activeMaterial.kolomMateriTambahan.length > 0 && (
              <button
                onClick={() => setStudentTab('columns')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  studentTab === 'columns'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Kolom Materi ({activeMaterial.kolomMateriTambahan.length})
              </button>
            )}
          </div>
        ) : null}

        {/* Embedded Material Frame or Column Content */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          {studentTab === 'frame' ? (
            <>
              {isGoogleAppsScriptUrl(activeViewUrl || activeMaterial.linkUrl) ? (
                <div className="bg-teal-950/80 border-b border-teal-800/80 px-4 py-2 flex items-center justify-between text-xs text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-teal-400" />
                    Google Apps Script dimuat langsung di e-PJOK.
                  </span>
                  <a
                    href={activeViewUrl || activeMaterial.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-200 underline font-bold hover:text-white"
                  >
                    Buka layar penuh ↗
                  </a>
                </div>
              ) : (
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <span className="text-[11px] text-slate-400">
                    💡 Jika video/materi tidak muncul atau Google meminta izin, buka langsung di tab baru:
                  </span>
                  <a
                    href={activeViewUrl || activeMaterial.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Buka Materi di Tab Baru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              <iframe
                src={formatEmbedUrl(activeViewUrl || activeMaterial.linkUrl)}
                title={activeMaterial.judul}
                className="w-full flex-1 border-0 bg-white"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4 text-white">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
                  Panduan & Uraian Materi dari Guru PJOK
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Pelajari dan ikuti instruksi pada kolom-kolom materi di bawah ini:
                </p>
              </div>

              {activeMaterial.kolomMateriTambahan?.map((col, idx) => (
                <div key={col.id || idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      {col.judulKolom}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                      Bagian #{idx + 1}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line pt-2 font-normal">
                    {col.isi || '(Belum ada catatan materi)'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const filtered = materials.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.kategori === selectedCategory;
    const matchesSearch =
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.deskripsi && m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                Materi Pembelajaran PJOK
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Pelajari video, slide, atau modul gerak langsung di aplikasi sebelum melakukan praktik dan penilaian antar teman.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300 shrink-0">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>{myProgress.length} dari {materials.length} Selesai</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi pembelajaran..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['all', 'Google Apps Script / Web App', 'Video Pembelajaran', 'Slide / PPT', 'Modul / PDF'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat === 'Google Apps Script / Web App' ? 'Apps Script' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Belum Ada Materi Tersedia
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Guru PJOK belum membagikan link materi untuk kelas Anda ({user?.kelas || 'XI 7'}). Silakan pantau materi saat jam pelajaran berlangsung.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filtered.map((item) => {
            const isUnlockedByTeacher = item.status === 'buka';
            const isUnlockedLocally = unlockedByPin[item.id] === true;
            const canAccess = isUnlockedByTeacher || isUnlockedLocally;
            const isDone = myProgress.some((p) => p.materialId === item.id);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-all hover:border-teal-500/40"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {getCategoryIcon(item.kategori)}
                        <span>{item.kategori || 'Materi'}</span>
                      </span>

                      {isGoogleAppsScriptUrl(item.linkUrl) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                          <Code className="w-3 h-3" />
                          Apps Script
                        </span>
                      )}

                      {item.linkTambahan && item.linkTambahan.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                          +{item.linkTambahan.length} Link Lain
                        </span>
                      )}

                      {item.kolomMateriTambahan && item.kolomMateriTambahan.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                          +{item.kolomMateriTambahan.length} Kolom Materi
                        </span>
                      )}
                    </div>

                    {/* Progress Badge */}
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sudah Dipelajari
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Belum Selesai
                      </span>
                    )}
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {item.materi}
                  </p>

                  {/* Description */}
                  {item.deskripsi && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-3 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}

                  {/* Instructions */}
                  {item.instruksi && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Petunjuk Guru: </span>
                      <span>{item.instruksi}</span>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      Estimasi: {item.durasiEstimasi || 15} Menit
                    </span>
                    <span>•</span>
                    <span className="font-medium">
                      Kelas: {item.kelas}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {canAccess ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOpenMaterial(item)}
                        className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Buka & Pelajari Materi</span>
                      </button>
                      <p className="text-[11px] text-center text-slate-400">
                        Materi akan dibuka langsung di dalam aplikasi.
                      </p>
                    </div>
                  ) : (
                    /* Locked View with PIN input */
                    <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Materi Terkunci oleh Guru PJOK
                        </span>
                        <span className="text-[10px] font-normal text-amber-700/80 dark:text-amber-400">
                          Butuh PIN Kelas
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                          <input
                            type="text"
                            value={pinInputs[item.id] || ''}
                            onChange={(e) =>
                              setPinInputs({ ...pinInputs, [item.id]: e.target.value })
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlockWithPin(item)}
                            placeholder="Masukkan PIN materi..."
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <button
                          onClick={() => handleUnlockWithPin(item)}
                          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Buka
                        </button>
                      </div>

                      {pinError[item.id] && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                          {pinError[item.id]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
