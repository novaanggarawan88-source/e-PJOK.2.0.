import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { LearningTaskItem, LearningTaskSubmission, ClassItem } from '../../types';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Award,
  ExternalLink,
  ShieldCheck,
  Calendar,
  X,
  Lock,
  Unlock,
  Users,
  Eye,
  Send,
  AlertTriangle,
  FileCheck,
  Paperclip
} from 'lucide-react';

export const LearningTaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);
  const [submissions, setSubmissions] = useState<LearningTaskSubmission[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | 'aktif' | 'draf'>('Semua');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LearningTaskItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    judul: string;
    materi: string;
    kelas: string;
    deskripsi: string;
    instruksiText: string;
    batasWaktu: string;
    status: 'aktif' | 'draf';
    tipePengumpulan: 'langsung' | 'upload' | 'keduanya';
    disableCopyPaste: boolean;
    lampiranUrl: string;
    lampiranNama: string;
  }>({
    judul: '',
    materi: '',
    kelas: 'Semua Kelas',
    deskripsi: '',
    instruksiText: '',
    batasWaktu: '',
    status: 'aktif',
    tipePengumpulan: 'langsung',
    disableCopyPaste: true,
    lampiranUrl: '',
    lampiranNama: ''
  });

  // Submission Review Modal
  const [reviewTask, setReviewTask] = useState<LearningTaskItem | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<LearningTaskSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number | ''>('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Notification
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, allSubs, allCls] = await Promise.all([
        DatabaseService.getLearningTasks(),
        DatabaseService.getLearningSubmissions(),
        DatabaseService.getClasses()
      ]);
      setTasks(allTasks);
      setSubmissions(allSubs);
      setClasses(allCls);
    } catch (err) {
      console.error('Gagal memuat tugas pembelajaran:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClass === 'Semua' || t.kelas === 'Semua Kelas' || t.kelas === selectedClass;

    const matchesStatus =
      selectedStatus === 'Semua' || t.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      judul: '',
      materi: '',
      kelas: 'Semua Kelas',
      deskripsi: '',
      instruksiText: '',
      batasWaktu: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: 'aktif',
      tipePengumpulan: 'langsung',
      disableCopyPaste: true,
      lampiranUrl: '',
      lampiranNama: ''
    });
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: LearningTaskItem) => {
    setEditingTask(task);
    setFormData({
      judul: task.judul,
      materi: task.materi,
      kelas: task.kelas,
      deskripsi: task.deskripsi,
      instruksiText: (task.instruksi || []).join('\n'),
      batasWaktu: task.batasWaktu ? new Date(task.batasWaktu).toISOString().slice(0, 16) : '',
      status: task.status === 'draf' ? 'draf' : 'aktif',
      tipePengumpulan: (task.tipePengumpulan as any) || 'langsung',
      disableCopyPaste: task.disableCopyPaste !== false,
      lampiranUrl: task.lampiranUrl || '',
      lampiranNama: task.lampiranNama || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.materi.trim()) {
      alert('Judul tugas dan topik materi wajib diisi!');
      return;
    }

    const instruksi = formData.instruksiText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const taskItem: LearningTaskItem = {
      id: editingTask ? editingTask.id : `task_learn_${Date.now()}`,
      judul: formData.judul.trim(),
      materi: formData.materi.trim(),
      kelas: formData.kelas,
      deskripsi: formData.deskripsi.trim(),
      instruksi,
      batasWaktu: formData.batasWaktu || new Date().toISOString(),
      status: formData.status,
      tipePengumpulan: formData.tipePengumpulan,
      disableCopyPaste: formData.disableCopyPaste,
      lampiranUrl: formData.lampiranUrl.trim() || undefined,
      lampiranNama: formData.lampiranNama.trim() || undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await DatabaseService.saveLearningTask(taskItem);
    setIsTaskModalOpen(false);
    showToast(
      editingTask
        ? 'Tugas pembelajaran berhasil diperbarui!'
        : `Tugas pembelajaran baru berhasil disimpan sebagai ${formData.status === 'aktif' ? 'Aktif' : 'Draf'}!`
    );
    loadData();
  };

  const handleToggleStatus = async (task: LearningTaskItem) => {
    const newStatus: 'aktif' | 'draf' = task.status === 'aktif' ? 'draf' : 'aktif';
    const updated: LearningTaskItem = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    await DatabaseService.saveLearningTask(updated);
    showToast(
      newStatus === 'aktif'
        ? `Tugas "${task.judul}" diaktifkan (dapat dilihat oleh murid)!`
        : `Tugas "${task.judul}" dipindahkan ke Draf (disembunyikan dari murid)!`
    );
    loadData();
  };

  const handleDeleteTask = async (task: LearningTaskItem) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus tugas "${task.judul}"? Semua pengumpulan murid untuk tugas ini juga akan terhapus.`
      )
    ) {
      await DatabaseService.deleteLearningTask(task.id);
      showToast(`Tugas "${task.judul}" berhasil dihapus.`);
      loadData();
    }
  };

  // Submissions Modal handlers
  const openSubmissionsModal = (task: LearningTaskItem) => {
    setReviewTask(task);
    setSelectedSubmission(null);
  };

  const openGrading = (sub: LearningTaskSubmission) => {
    setSelectedSubmission(sub);
    setGradingScore(sub.nilai !== undefined ? sub.nilai : '');
    setGradingFeedback(sub.catatanGuru || '');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    if (gradingScore === '' || Number(gradingScore) < 0 || Number(gradingScore) > 100) {
      alert('Harap masukkan nilai yang valid antara 0 - 100!');
      return;
    }

    setIsSavingGrade(true);
    try {
      const updatedSub: LearningTaskSubmission = {
        ...selectedSubmission,
        nilai: Number(gradingScore),
        catatanGuru: gradingFeedback.trim(),
        status: 'dinilai'
      };
      await DatabaseService.saveLearningSubmission(updatedSub);
      showToast(`Nilai untuk ${selectedSubmission.studentName} berhasil disimpan!`);
      setSelectedSubmission(updatedSub);
      await loadData();
    } catch (e) {
      console.error('Gagal menyimpan nilai:', e);
      alert('Terjadi kesalahan saat menyimpan nilai.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Get submissions for review task
  const currentTaskSubmissions = reviewTask
    ? submissions.filter((s) => s.taskId === reviewTask.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-linear-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-blue-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-blue-100">
              <FileText className="w-3.5 h-3.5" />
              <span>Modul Pembelajaran Mandiri PJOK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tugas Pembelajaran
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Kelola tugas mandiri murid dengan metode <strong>Diisi Langsung (Anti Salin/Tempel)</strong> atau <strong>Unggah Dokumen</strong>. Atur status tugas sebagai <strong>Aktif</strong> atau <strong>Draf</strong> sesuai rencana pembelajaran.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm shadow-lg shadow-black/10 transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Tugas Baru</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4">
            <p className="text-xs text-blue-200 font-semibold">Total Tugas</p>
            <p className="text-xl sm:text-2xl font-black mt-1">{tasks.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4">
            <p className="text-xs text-emerald-200 font-semibold">Tugas Aktif (Terbit)</p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-emerald-300">
              {tasks.filter((t) => t.status === 'aktif').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4">
            <p className="text-xs text-amber-200 font-semibold">Tugas Draf</p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-amber-300">
              {tasks.filter((t) => t.status === 'draf').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4">
            <p className="text-xs text-blue-200 font-semibold">Total Pengumpulan</p>
            <p className="text-xl sm:text-2xl font-black mt-1">{submissions.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, topik bab, atau instruksi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="aktif">Aktif (Terbit)</option>
              <option value="draf">Draf (Belum Terbit)</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              <option value="Semua Kelas">Target: Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.nama}>
                  Kelas {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Memuat data tugas pembelajaran...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Belum Ada Tugas Pembelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Buat tugas pembelajaran pertama Anda. Anda dapat menentukan apakah siswa mengetik langsung dengan proteksi anti copy-paste atau mengunggah berkas, serta mengatur status sebagai aktif atau draf.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            const gradedCount = taskSubs.filter((s) => s.status === 'dinilai').length;
            const isAktif = task.status === 'aktif';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isAktif
                    ? 'border-slate-200/90'
                    : 'border-amber-200/80 bg-linear-to-b from-amber-50/20 to-white'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 truncate max-w-[150px]">
                      {task.materi}
                    </span>

                    {/* Status Badge & 1-Click Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                      }`}
                      title={isAktif ? 'Klik untuk ubah menjadi Draf' : 'Klik untuk mengaktifkan tugas'}
                    >
                      {isAktif ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Aktif (Terbit)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Draf (Tersimpan)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
                      {task.judul}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {task.deskripsi || 'Tidak ada deskripsi singkat.'}
                    </p>
                  </div>

                  {/* Submission Type & Copy Paste Protection */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      {task.tipePengumpulan === 'langsung' ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                          <FileText className="w-3 h-3" />
                          <span>Diisi Langsung</span>
                        </span>
                      ) : task.tipePengumpulan === 'upload' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                          <Paperclip className="w-3 h-3" />
                          <span>Unggah Berkas/Link</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <FileCheck className="w-3 h-3" />
                          <span>Langsung / Berkas</span>
                        </span>
                      )}

                      {task.disableCopyPaste !== false && (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Anti Copy-Paste</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="font-medium">Target: {task.kelas}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(task.batasWaktu).toLocaleDateString('id-ID')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Submissions count button */}
                  <button
                    type="button"
                    onClick={() => openSubmissionsModal(task)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>
                      {taskSubs.length} Pengumpulan{' '}
                      {taskSubs.length > 0 && `(${gradedCount} Dinilai)`}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Tugas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Hapus Tugas"
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

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {editingTask ? 'Edit Tugas Pembelajaran' : 'Tambah Tugas Pembelajaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi judul, topik materi, metode pengerjaan, dan status tugas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Judul & Topik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Judul Tugas *</label>
                  <input
                    type="text"
                    required
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    placeholder="Contoh: Analisis Taktik Penyerangan Bola Basket"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Topik / Bab PJOK *</label>
                  <input
                    type="text"
                    required
                    value={formData.materi}
                    onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                    placeholder="Contoh: Bola Basket, Senam Lantai, Kebugaran"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Target Kelas & Batas Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Target Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Semua Kelas">Semua Kelas (Umum)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama}>
                        Kelas {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Batas Waktu Pengumpulan</label>
                  <input
                    type="datetime-local"
                    value={formData.batasWaktu}
                    onChange={(e) => setFormData({ ...formData, batasWaktu: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* STATUS TUGAS (Aktif vs Draf) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Status Penerbitan Tugas *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.status === 'aktif'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taskStatus"
                      checked={formData.status === 'aktif'}
                      onChange={() => setFormData({ ...formData, status: 'aktif' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold">Aktif (Terbit)</p>
                      <p className="text-[11px] text-slate-500">
                        Langsung tampil di akun siswa untuk dikerjakan
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.status === 'draf'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taskStatus"
                      checked={formData.status === 'draf'}
                      onChange={() => setFormData({ ...formData, status: 'draf' })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-bold">Draf (Tersimpan)</p>
                      <p className="text-[11px] text-slate-500">
                        Disimpan dulu, belum bisa dilihat oleh siswa
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* METODE PENGERJAAN & ANTI COPY-PASTE */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Metode Pengumpulan / Pengerjaan Tugas *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.tipePengumpulan === 'langsung'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipePengumpulan"
                      checked={formData.tipePengumpulan === 'langsung'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          tipePengumpulan: 'langsung',
                          disableCopyPaste: true
                        })
                      }
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold">Diisi Langsung</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Siswa mengetik esai / jawaban langsung di aplikasi
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.tipePengumpulan === 'upload'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipePengumpulan"
                      checked={formData.tipePengumpulan === 'upload'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          tipePengumpulan: 'upload'
                        })
                      }
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold">Unggah Berkas/Link</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Siswa mengirim tautan Google Drive atau file tugas
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.tipePengumpulan === 'keduanya'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipePengumpulan"
                      checked={formData.tipePengumpulan === 'keduanya'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          tipePengumpulan: 'keduanya'
                        })
                      }
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold">Kombinasi (Keduanya)</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Bisa ketik langsung dan/atau menyertakan tautan berkas
                      </p>
                    </div>
                  </label>
                </div>

                {/* Anti Copy-Paste Checkbox */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disableCopyPaste}
                      onChange={(e) =>
                        setFormData({ ...formData, disableCopyPaste: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Matikan Fitur Salin-Tempel (Anti Copy-Paste)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Mencegah siswa melakukan paste / copy jawaban dari web lain)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Deskripsi & Instruksi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Deskripsi / Pengantar Tugas</label>
                <textarea
                  rows={2}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Penjelasan singkat mengenai materi tugas ini..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Pertanyaan / Instruksi Tugas (1 baris per poin soal)
                </label>
                <textarea
                  rows={4}
                  value={formData.instruksiText}
                  onChange={(e) => setFormData({ ...formData, instruksiText: e.target.value })}
                  placeholder="1. Jelaskan pola penyerangan fast break dalam bola basket!&#10;2. Bagaimana posisi pemain pivot saat menerima umpan di area bersyarat?&#10;3. Buatlah analisis kelebihan pertahanan man-to-man defense!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
              </div>

              {/* Tautan LKPD / Lampiran Dokumen Guru (Opsional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tautan Dokumen / LKPD Guru (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formData.lampiranUrl}
                    onChange={(e) => setFormData({ ...formData, lampiranUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Tautan Dokumen</label>
                  <input
                    type="text"
                    value={formData.lampiranNama}
                    onChange={(e) => setFormData({ ...formData, lampiranNama: e.target.value })}
                    placeholder="Contoh: LKPD Bola Basket Bab 1.pdf"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Review Modal */}
      {reviewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
                  {reviewTask.materi}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">
                  Pengumpulan: {reviewTask.judul}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {reviewTask.kelas} • Total {currentTaskSubmissions.length} siswa telah mengumpulkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewTask(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout: Submissions list & Grading panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* List of submissions */}
              <div className="md:col-span-5 border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[450px]">
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Daftar Siswa ({currentTaskSubmissions.length})</span>
                  <span className="text-[11px] text-slate-400">
                    {currentTaskSubmissions.filter((s) => s.status === 'dinilai').length} Selesai Dinilai
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {currentTaskSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Belum ada siswa yang mengumpulkan tugas ini.
                    </div>
                  ) : (
                    currentTaskSubmissions.map((sub) => {
                      const isSelected = selectedSubmission?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => openGrading(sub)}
                          className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 text-blue-900'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{sub.studentName}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {sub.studentClass} • No {sub.studentNoAbsen || '-'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {sub.status === 'dinilai' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Nilai: {sub.nilai}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Belum Dinilai
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Grading and Answer Detail Panel */}
              <div className="md:col-span-7 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-[450px] overflow-y-auto">
                {selectedSubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {selectedSubmission.studentName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Kelas {selectedSubmission.studentClass} • Dikirim pada{' '}
                          {new Date(selectedSubmission.submittedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      {selectedSubmission.status === 'dinilai' && (
                        <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Nilai Saat Ini</p>
                          <p className="text-lg font-black text-emerald-700 leading-none">{selectedSubmission.nilai}</p>
                        </div>
                      )}
                    </div>

                    {/* Jawaban Siswa */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Isi Jawaban Siswa (Ketik Langsung):
                      </label>
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs sm:text-sm text-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                        {selectedSubmission.catatanJawaban || (
                          <span className="text-slate-400 italic">Tidak ada catatan teks langsung.</span>
                        )}
                      </div>
                    </div>

                    {/* Tautan Berkas / Lampiran jika ada */}
                    {selectedSubmission.linkLampiran && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Tautan Dokumen / Berkas Tugas:
                        </label>
                        <a
                          href={selectedSubmission.linkLampiran}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[280px]">
                            {selectedSubmission.linkLampiran}
                          </span>
                        </a>
                      </div>
                    )}

                    {/* Form Penilaian */}
                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3 pt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-bold text-slate-800">Nilai (0 - 100)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={gradingScore}
                            onChange={(e) =>
                              setGradingScore(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            placeholder="Contoh: 85"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold text-slate-800">
                            Catatan & Masukan Guru (Opsional)
                          </label>
                          <input
                            type="text"
                            value={gradingFeedback}
                            onChange={(e) => setGradingFeedback(e.target.value)}
                            placeholder="Catatan perbaikan atau apresiasi..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveGrade}
                          disabled={isSavingGrade}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{isSavingGrade ? 'Menyimpan...' : 'Simpan Nilai'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Eye className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-semibold">Pilih salah satu siswa di sebelah kiri untuk melihat jawaban dan memberikan nilai.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
