import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import {
  MaterialItem,
  ClassItem,
  MaterialProgress,
  MaterialLinkItem,
  MaterialColumnItem
} from '../../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Check,
  Search,
  Clock,
  Key,
  Users,
  AlertCircle,
  X,
  CheckCircle2,
  Filter,
  Eye,
  Video,
  FileText,
  Presentation,
  Globe,
  ArrowLeft,
  ExternalLink,
  Code,
  Layers,
  PlusCircle,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export const isGoogleAppsScriptUrl = (rawUrl: string): boolean => {
  if (!rawUrl) return false;
  return rawUrl.includes('script.google.com') || rawUrl.includes('script.googleusercontent.com');
};

export const formatEmbedUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  const url = rawUrl.trim();

  // YouTube watch/short link to embed
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
  }

  // Google Drive preview (supports /file/d/ID/..., ?id=ID, open?id=ID)
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    if (url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
  }

  // Google Docs / Slides
  if (url.includes('docs.google.com/presentation') && !url.includes('/embed')) {
    return url.replace(/\/pub|\/edit.*$/, '/embed');
  }

  // Google Apps Script Web App links - if ending in /exec, can be embedded directly
  return url;
};

const CATEGORIES = [
  'Google Apps Script / Web App',
  'Video Pembelajaran',
  'Slide / PPT',
  'Modul / PDF',
  'Artikel / Web'
] as const;

const COMMON_PJOK_TOPICS = [
  'Permainan Bola Besar (Bola Voli)',
  'Permainan Bola Besar (Sepak Bola)',
  'Permainan Bola Besar (Bola Basket)',
  'Permainan Bola Kecil (Bulu Tangkis)',
  'Permainan Bola Kecil (Tenis Meja / Kasti)',
  'Atletik (Lari, Lompat, Lempar)',
  'Kebugaran Jasmani & Pengukuran Denyut Nadi',
  'Senam Lantai & Ketangkasan',
  'Aktivitas Gerak Berirama (Senam Ritmik)',
  'Aktivitas Air / Renang & Keselamatan Diri',
  'Pendidikan Kesehatan & Pola Hidup Sehat'
];

export const MaterialManagement: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [progressList, setProgressList] = useState<MaterialProgress[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedMaterialForPreview, setSelectedMaterialForPreview] = useState<MaterialItem | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedMaterialForProgress, setSelectedMaterialForProgress] = useState<MaterialItem | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [judul, setJudul] = useState('');
  const [materi, setMateri] = useState('');
  const [kategori, setKategori] = useState<string>('Google Apps Script / Web App');
  const [kelas, setKelas] = useState('Semua Kelas');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTambahan, setLinkTambahan] = useState<MaterialLinkItem[]>([]);
  const [kolomMateriTambahan, setKolomMateriTambahan] = useState<MaterialColumnItem[]>([]);
  const [status, setStatus] = useState<'aktif' | 'draf'>('aktif');
  const [kodeKunci, setKodeKunci] = useState('');
  const [durasiEstimasi, setDurasiEstimasi] = useState<number>(15);
  const [deskripsi, setDeskripsi] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Preview tab & link state
  const [previewActiveUrl, setPreviewActiveUrl] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'frame' | 'columns'>('frame');

  // Quick Topic input toggle
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);
  const [customTopicName, setCustomTopicName] = useState('');

  const loadData = async () => {
    const [mList, cList, pList] = await Promise.all([
      DatabaseService.getMaterials(),
      DatabaseService.getClasses(),
      DatabaseService.getMaterialProgress()
    ]);
    setMaterials(mList);
    setClasses(cList);
    setProgressList(pList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setJudul('');
    setMateri('');
    setKategori('Google Apps Script / Web App');
    setKelas('Semua Kelas');
    setLinkUrl('');
    setLinkTambahan([]);
    setKolomMateriTambahan([]);
    setStatus('aktif');
    setKodeKunci('');
    setDurasiEstimasi(15);
    setDeskripsi('');
    setInstruksi('Buka dan pelajari materi/AppScript berikut dengan seksama sebagai persiapan sebelum penilaian praktik.');
    setShowCustomTopicInput(false);
    setCustomTopicName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MaterialItem) => {
    setEditingMaterial(item);
    setJudul(item.judul);
    setMateri(item.materi);
    setKategori(item.kategori || 'Google Apps Script / Web App');
    setKelas(item.kelas);
    setLinkUrl(item.linkUrl);
    setLinkTambahan(item.linkTambahan ? [...item.linkTambahan] : []);
    setKolomMateriTambahan(item.kolomMateriTambahan ? [...item.kolomMateriTambahan] : []);
    setStatus(item.status === 'draf' || item.status === 'kunci' ? 'draf' : 'aktif');
    setKodeKunci(item.kodeKunci || '');
    setDurasiEstimasi(item.durasiEstimasi || 15);
    setDeskripsi(item.deskripsi || '');
    setInstruksi(item.instruksi || '');
    setShowCustomTopicInput(false);
    setCustomTopicName('');
    setIsModalOpen(true);
  };

  // Handlers for Link Tambahan
  const handleAddLinkRow = () => {
    setLinkTambahan((prev) => [
      ...prev,
      {
        id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        judul: `AppScript / Link ${prev.length + 2}`,
        url: ''
      }
    ]);
  };

  const handleUpdateLinkRow = (id: string, field: 'judul' | 'url', val: string) => {
    setLinkTambahan((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveLinkRow = (id: string) => {
    setLinkTambahan((prev) => prev.filter((item) => item.id !== id));
  };

  // Handlers for Kolom Materi Tambahan
  const handleAddColumnRow = () => {
    setKolomMateriTambahan((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        judulKolom: `Kolom Materi ${prev.length + 1}`,
        isi: ''
      }
    ]);
  };

  const handleUpdateColumnRow = (id: string, field: 'judulKolom' | 'isi', val: string) => {
    setKolomMateriTambahan((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveColumnRow = (id: string) => {
    setKolomMateriTambahan((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul materi wajib diisi!');
      return;
    }
    if (!linkUrl.trim()) {
      alert('Tautan link materi wajib diisi!');
      return;
    }

    let cleanUrl = linkUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Sanitize linkTambahan
    const validLinkTambahan: MaterialLinkItem[] = linkTambahan
      .filter((lt) => lt.url && lt.url.trim().length > 0)
      .map((lt) => {
        let clean = lt.url.trim();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = 'https://' + clean;
        }
        return {
          id: lt.id,
          judul: lt.judul.trim() || 'Tautan Materi',
          url: clean
        };
      });

    // Sanitize kolomMateriTambahan
    const validKolomTambahan: MaterialColumnItem[] = kolomMateriTambahan
      .filter((km) => (km.judulKolom && km.judulKolom.trim()) || (km.isi && km.isi.trim()))
      .map((km) => ({
        id: km.id,
        judulKolom: km.judulKolom.trim() || 'Catatan Materi',
        isi: km.isi.trim()
      }));

    setIsSaving(true);
    try {
      const materialData: MaterialItem = {
        id: editingMaterial ? editingMaterial.id : `mat-${Date.now()}`,
        judul: judul.trim(),
        materi: materi.trim() || 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
        kategori,
        kelas,
        linkUrl: cleanUrl,
        linkTambahan: validLinkTambahan.length > 0 ? validLinkTambahan : undefined,
        kolomMateriTambahan: validKolomTambahan.length > 0 ? validKolomTambahan : undefined,
        status,
        kodeKunci: undefined,
        durasiEstimasi: Number(durasiEstimasi) || 15,
        deskripsi: deskripsi.trim(),
        instruksi: instruksi.trim(),
        createdAt: editingMaterial ? editingMaterial.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DatabaseService.saveMaterial(materialData);
      setIsModalOpen(false);
      showNotification(
        editingMaterial
          ? 'Perubahan materi pembelajaran berhasil disimpan!'
          : status === 'aktif'
          ? 'Materi baru berhasil diterbitkan untuk murid!'
          : 'Materi baru disimpan sebagai draf guru!'
      );
      loadData();
    } catch (err: any) {
      console.error('Gagal menyimpan materi:', err);
      alert('Terjadi kesalahan saat menyimpan materi: ' + (err.message || 'Silakan coba lagi.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: MaterialItem) => {
    const isCurrentActive = item.status === 'aktif' || item.status === 'buka' || !item.status;
    const newStatus: 'aktif' | 'draf' = isCurrentActive ? 'draf' : 'aktif';
    await DatabaseService.toggleMaterialStatus(item.id, newStatus);
    showNotification(
      newStatus === 'aktif'
        ? `Materi "${item.judul}" berhasil diaktifkan (dapat diakses murid).`
        : `Materi "${item.judul}" diubah menjadi Draf (disimpan guru).`
    );
    loadData();
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus materi "${title}"?`)) {
      await DatabaseService.deleteMaterial(id);
      showNotification('Materi berhasil dihapus.');
      loadData();
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenPreview = (item: MaterialItem) => {
    setSelectedMaterialForPreview(item);
    setPreviewActiveUrl(item.linkUrl);
    setPreviewTab('frame');
    setIsPreviewModalOpen(true);
  };

  const handleOpenProgress = (item: MaterialItem) => {
    setSelectedMaterialForProgress(item);
    setIsProgressModalOpen(true);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Google Apps Script / Web App':
        return <Code className="w-4 h-4 text-teal-500" />;
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

  const filteredMaterials = materials.filter((m) => {
    const matchesClass =
      filterClass === 'all' || m.kelas === 'Semua Kelas' || m.kelas === filterClass;
    const matchesCategory =
      filterCategory === 'all' || m.kategori === filterCategory;
    const matchesSearch =
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.deskripsi && m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesCategory && matchesSearch;
  });

  const totalActive = materials.filter((m) => m.status === 'aktif' || m.status === 'buka' || !m.status).length;
  const totalDraft = materials.filter((m) => m.status === 'draf' || m.status === 'kunci').length;
  const totalVideos = materials.filter((m) => m.kategori === 'Video Pembelajaran').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-teal-600 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                <BookOpen className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  Materi Pembelajaran PJOK
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Bagikan link materi (Video YouTube, Slide Canva/PPT, Dokumen Drive/PDF, Website). Murid dapat belajar langsung di dalam aplikasi.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Materi PJOK</span>
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Materi</span>
            <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">
              {materials.length}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Materi Aktif (Bisa Diakses)</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {totalActive}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Materi Draf (Disimpan Guru)</span>
            <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-200 mt-1">
              {totalDraft}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/40">
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Video Pembelajaran</span>
            <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
              {totalVideos}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul materi, bab, kelas..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Kategori:</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-300 dark:text-slate-700">|</span>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">Semua Kelas</option>
            <option value="Semua Kelas">Target: Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nama}>
                Kelas {c.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Material Cards List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Belum Ada Materi Pembelajaran
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || filterClass !== 'all' || filterCategory !== 'all'
              ? 'Tidak ditemukan materi yang cocok dengan pencarian atau filter Anda.'
              : 'Klik tombol "+ Tambah Materi PJOK" untuk mulai memasukkan video, slide, atau modul belajar.'}
          </p>
          {(searchQuery || filterClass !== 'all' || filterCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterClass('all');
                setFilterCategory('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredMaterials.map((item) => {
            const completedStudents = progressList.filter((p) => p.materialId === item.id);
            const isItemActive = item.status === 'aktif' || item.status === 'buka' || !item.status;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all hover:border-teal-500/40"
              >
                <div>
                  {/* Top Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {getCategoryIcon(item.kategori)}
                        <span>{item.kategori || 'Materi'}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                        {item.kelas}
                      </span>
                    </div>

                    {/* Status badge & toggle Aktif / Draf */}
                    <button
                      onClick={() => handleToggleStatus(item)}
                      title={
                        isItemActive
                          ? 'Klik untuk mengubah status menjadi Draf (disembunyikan dari murid)'
                          : 'Klik untuk mengaktifkan materi (murid bisa langsung belajar)'
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                        isItemActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {isItemActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Status: Aktif</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Status: Draf</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                    {item.materi}
                  </p>

                  {/* Description & Instruction */}
                  {item.deskripsi && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      {item.deskripsi}
                    </p>
                  )}

                  {item.instruksi && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Arahan Guru: </span>
                        <span>{item.instruksi}</span>
                      </div>
                    </div>
                  )}

                  {/* Material Link display, Multi-Links, and Additional Columns */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {/* Primary Link */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        Tautan Utama:
                      </span>
                      <div className="flex items-center gap-1.5 max-w-[70%]">
                        {isGoogleAppsScriptUrl(item.linkUrl) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                            Apps Script
                          </span>
                        )}
                        <span className="truncate text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {item.linkUrl}
                        </span>
                        <button
                          onClick={() => handleCopyLink(item.linkUrl, item.id)}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal-600 cursor-pointer"
                          title="Salin Link"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Additional Links list if any */}
                    {item.linkTambahan && item.linkTambahan.length > 0 && (
                      <div className="bg-teal-50/50 dark:bg-teal-950/30 rounded-xl p-2.5 border border-teal-100 dark:border-teal-900/50 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-teal-800 dark:text-teal-300">
                          <span className="flex items-center gap-1">
                            <Code className="w-3.5 h-3.5" />
                            {item.linkTambahan.length} Kolom Link Tambahan:
                          </span>
                        </div>
                        <div className="space-y-1">
                          {item.linkTambahan.map((lt, idx) => (
                            <div key={lt.id || idx} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">
                              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[40%]">
                                {lt.judul || `Link #${idx + 2}`}
                              </span>
                              <div className="flex items-center gap-1">
                                {isGoogleAppsScriptUrl(lt.url) && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 font-bold">
                                    AppScript
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                                  {lt.url}
                                </span>
                                <button
                                  onClick={() => handleCopyLink(lt.url, `${item.id}-link-${idx}`)}
                                  className="p-0.5 text-slate-400 hover:text-teal-600"
                                  title="Salin Link"
                                >
                                  {copiedId === `${item.id}-link-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <a
                                  href={lt.url.startsWith('http') ? lt.url : `https://${lt.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 text-slate-400 hover:text-teal-600"
                                  title="Buka Link"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Content Columns list if any */}
                    {item.kolomMateriTambahan && item.kolomMateriTambahan.length > 0 && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-2.5 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-300">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {item.kolomMateriTambahan.length} Kolom Materi Tambahan:
                          </span>
                        </div>
                        <div className="space-y-1">
                          {item.kolomMateriTambahan.map((col, idx) => (
                            <div key={col.id || idx} className="text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                              <p className="font-bold text-blue-900 dark:text-blue-300">
                                {col.judulKolom}
                              </p>
                              <p className="text-slate-600 dark:text-slate-300 text-[10.5px] line-clamp-2 mt-0.5 whitespace-pre-line">
                                {col.isi}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Estimasi Belajar:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.durasiEstimasi || 15} Menit
                      </span>
                    </div>

                    {item.kodeKunci && (
                      <div className="flex items-center justify-between text-xs bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                        <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                          <Key className="w-3.5 h-3.5" />
                          PIN Akses Murid:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-900 dark:text-amber-200 tracking-wider">
                            {item.kodeKunci}
                          </span>
                          <button
                            onClick={() => handleCopyLink(item.kodeKunci || '', `${item.id}-pin`)}
                            className="p-1 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 cursor-pointer"
                            title="Salin PIN"
                          >
                            {copiedId === `${item.id}-pin` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPreview(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pratinjau</span>
                    </button>

                    <button
                      onClick={() => handleOpenProgress(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{completedStudents.length} Siswa Selesai</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Materi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(item.id, item.judul)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hapus Materi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Materi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                  {editingMaterial ? 'Edit Materi Pembelajaran' : 'Tambah Materi Pembelajaran Baru'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Materi Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Video Panduan Teknik Passing Bawah Bola Voli"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Topik & Format Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Topik / Cabang Olahraga PJOK
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomTopicInput(!showCustomTopicInput)}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>{showCustomTopicInput ? 'Pilih Topik' : '+ Topik Baru'}</span>
                    </button>
                  </div>

                  {showCustomTopicInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTopicName}
                        onChange={(e) => setCustomTopicName(e.target.value)}
                        placeholder="Ketik topik materi baru..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customTopicName.trim()) {
                            setMateri(customTopicName.trim());
                            setShowCustomTopicInput(false);
                            setCustomTopicName('');
                          }
                        }}
                        className="px-3 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shrink-0 cursor-pointer hover:bg-teal-700"
                      >
                        Pilih
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        list="pjok-topics-list"
                        value={materi}
                        onChange={(e) => setMateri(e.target.value)}
                        placeholder="Pilih atau ketik topik PJOK..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                      />
                      <datalist id="pjok-topics-list">
                        {COMMON_PJOK_TOPICS.map((topik) => (
                          <option key={topik} value={topik} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format / Kategori Materi
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Kelas
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama}>
                        Kelas {c.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Waktu Belajar (Menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durasiEstimasi}
                    onChange={(e) => setDurasiEstimasi(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* Tautan Link Utama */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tautan Link Utama (Google Apps Script / YouTube / Drive / Web) <span className="text-rose-500">*</span>
                  </label>
                  {isGoogleAppsScriptUrl(linkUrl) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800">
                      <Code className="w-3 h-3" />
                      Apps Script Terdeteksi
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={linkUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLinkUrl(val);
                    if (isGoogleAppsScriptUrl(val) && kategori !== 'Google Apps Script / Web App') {
                      setKategori('Google Apps Script / Web App');
                    }
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec atau link video/modul"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-xs"
                />

                {isGoogleAppsScriptUrl(linkUrl) && linkUrl.includes('/edit') && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Perhatian: URL berakhiran <b>/edit</b> adalah editor skrip. Pastikan gunakan link Web App hasil Deploy berakhiran <b>/exec</b> agar bisa dibuka siswa.</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Mendukung penuh link <b>Google Apps Script Web App</b> (/exec), YouTube, Google Drive/Slides, Canva, dan Web Interaktif.
                </p>
              </div>

              {/* SECTION: TOMBOL TAMBAH KOLOM LINK */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Kolom Link & Tautan Tambahan (Multi-Link / Apps Script)</span>
                    </h4>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300">
                      Tambahkan kolom link tambahan jika materi memiliki beberapa AppScript, form soal, atau rujukan lain.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLinkRow}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Tambah Kolom Link</span>
                  </button>
                </div>

                {linkTambahan.length > 0 ? (
                  <div className="space-y-2.5 pt-2">
                    {linkTambahan.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-teal-800/80 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                            Kolom Link #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLinkRow(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
                            title="Hapus Kolom Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <input
                              type="text"
                              value={item.judul}
                              onChange={(e) => handleUpdateLinkRow(item.id, 'judul', e.target.value)}
                              placeholder="Nama Link (Contoh: AppScript Latihan)"
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleUpdateLinkRow(item.id, 'url', e.target.value)}
                              placeholder="https://script.google.com/macros/s/.../exec"
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            {item.url && (
                              <a
                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 hover:bg-teal-200 transition-colors shrink-0"
                                title="Buka Link di Tab Baru untuk Test"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {isGoogleAppsScriptUrl(item.url) && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Format Google Apps Script Web App Terkonfirmasi
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 italic pt-1">
                    Belum ada kolom link tambahan. Klik tombol <b>+ Tambah Kolom Link</b> di atas jika materi membutuhkan lebih dari 1 link.
                  </p>
                )}
              </div>

              {/* SECTION: TOMBOL TAMBAH KOLOM MATERI */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Kolom Materi & Catatan Pembelajaran Tambahan</span>
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Tambahkan kolom materi khusus seperti ringkasan teknik, langkah gerak, instruksi tugas, atau rubrik.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColumnRow}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Tambah Kolom Materi</span>
                  </button>
                </div>

                {kolomMateriTambahan.length > 0 ? (
                  <div className="space-y-2.5 pt-2">
                    {kolomMateriTambahan.map((col, idx) => (
                      <div
                        key={col.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/60 dark:border-blue-800/80 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
                            Kolom Materi #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColumnRow(col.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
                            title="Hapus Kolom Materi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={col.judulKolom}
                            onChange={(e) => handleUpdateColumnRow(col.id, 'judulKolom', e.target.value)}
                            placeholder="Judul Kolom (Contoh: Rangkuman Gerak / Instruksi Khusus)"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            value={col.isi}
                            onChange={(e) => handleUpdateColumnRow(col.id, 'isi', e.target.value)}
                            placeholder="Tuliskan isi uraian materi, langkah-langkah gerak, atau panduan belajar..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-400/80 italic pt-1">
                    Belum ada kolom materi tambahan. Klik tombol <b>+ Tambah Kolom Materi</b> jika ingin menambahkan teks panduan khusus.
                  </p>
                )}
              </div>

              {/* Pengaturan Status: Aktif / Draf */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      Pengaturan Status Materi
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih <strong>Aktif</strong> agar langsung tampil di akun murid, atau <strong>Draf</strong> jika masih ingin disimpan terlebih dahulu (tanpa perlu PIN).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatus('aktif')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                        status === 'aktif'
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktif (Terbit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('draf')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                        status === 'draf'
                          ? 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-500/20 dark:bg-slate-600'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      <span>Draf (Simpan Saja)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat Materi
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Ringkasan poin-poin materi yang akan dipelajari siswa..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Arahan / Instruksi Belajar Guru
                </label>
                <textarea
                  rows={2}
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                  placeholder="Contoh: Buka link AppScript, kerjakan latihan gerak dan catat hasilnya di buku catatan..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingMaterial ? 'Simpan Perubahan' : 'Terbitkan Materi'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Materi In-App untuk Guru */}
      {isPreviewModalOpen && selectedMaterialForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex flex-col">
          <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-white shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tutup Pratinjau</span>
              </button>
              <div>
                <h3 className="text-sm font-black truncate max-w-xs sm:max-w-md">
                  {selectedMaterialForPreview.judul}
                </h3>
                <span className="text-[11px] text-teal-400 font-medium">
                  {selectedMaterialForPreview.materi} • {selectedMaterialForPreview.kategori}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {previewTab === 'frame' && previewActiveUrl && (
                <a
                  href={previewActiveUrl.startsWith('http') ? previewActiveUrl : `https://${previewActiveUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Baru</span>
                </a>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-900/80 text-teal-300 border border-teal-700">
                Pratinjau Guru
              </span>
            </div>
          </header>

          {/* Tab Selector if multiple links or extra columns exist */}
          {(selectedMaterialForPreview.linkTambahan?.length || selectedMaterialForPreview.kolomMateriTambahan?.length) ? (
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
                Pilih Tampilan:
              </span>
              <button
                onClick={() => {
                  setPreviewTab('frame');
                  setPreviewActiveUrl(selectedMaterialForPreview.linkUrl);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  previewTab === 'frame' && previewActiveUrl === selectedMaterialForPreview.linkUrl
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tautan Utama {isGoogleAppsScriptUrl(selectedMaterialForPreview.linkUrl) ? '(AppScript)' : ''}
              </button>

              {selectedMaterialForPreview.linkTambahan?.map((lt, idx) => (
                <button
                  key={lt.id || idx}
                  onClick={() => {
                    setPreviewTab('frame');
                    setPreviewActiveUrl(lt.url);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    previewTab === 'frame' && previewActiveUrl === lt.url
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lt.judul || `Link #${idx + 2}`} {isGoogleAppsScriptUrl(lt.url) ? '(AppScript)' : ''}
                </button>
              ))}

              {selectedMaterialForPreview.kolomMateriTambahan && selectedMaterialForPreview.kolomMateriTambahan.length > 0 && (
                <button
                  onClick={() => setPreviewTab('columns')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    previewTab === 'columns'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Kolom Materi ({selectedMaterialForPreview.kolomMateriTambahan.length})
                </button>
              )}
            </div>
          ) : null}

          <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
            {previewTab === 'frame' ? (
              <>
                {isGoogleAppsScriptUrl(previewActiveUrl || selectedMaterialForPreview.linkUrl) && (
                  <div className="bg-teal-950/80 border-b border-teal-800/80 px-4 py-2 flex items-center justify-between text-xs text-teal-300">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-teal-400" />
                      Google Apps Script Web App aktif dimuat di frame e-PJOK.
                    </span>
                    <a
                      href={previewActiveUrl || selectedMaterialForPreview.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-200 underline font-bold hover:text-white"
                    >
                      Buka jendela baru ↗
                    </a>
                  </div>
                )}
                <iframe
                  src={formatEmbedUrl(previewActiveUrl || selectedMaterialForPreview.linkUrl)}
                  title={selectedMaterialForPreview.judul}
                  className="w-full flex-1 border-0 bg-white"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                />
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4 text-white">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
                    Kolom Materi & Panduan Pembelajaran PJOK
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Berikut adalah isi kolom-kolom materi tambahan yang telah Anda masukkan untuk materi ini:
                  </p>
                </div>

                {selectedMaterialForPreview.kolomMateriTambahan?.map((col, idx) => (
                  <div key={col.id || idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        {col.judulKolom}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                        Kolom #{idx + 1}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line pt-2">
                      {col.isi || '(Tidak ada isi materi)'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Daftar Siswa yang Telah Menyelesaikan Belajar Materi */}
      {isProgressModalOpen && selectedMaterialForProgress && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Progres Pembelajaran Murid
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedMaterialForProgress.judul}
                </h2>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {progressList.filter((p) => p.materialId === selectedMaterialForProgress.id).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Belum ada murid yang menandai selesai
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ketika murid membuka materi dan menekan "Tandai Selesai Dipelajari", nama mereka akan otomatis tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {progressList
                    .filter((p) => p.materialId === selectedMaterialForProgress.id)
                    .map((item, index) => (
                      <div key={item.id || index} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-[11px]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {item.studentName}
                            </p>
                            <span className="text-slate-400 text-[11px]">
                              Kelas {item.studentClass}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai Belajar
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {new Date(item.completedAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
