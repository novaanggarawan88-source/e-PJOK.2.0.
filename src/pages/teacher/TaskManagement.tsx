import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { AssessmentTask, ClassItem, IndicatorItem } from '../../types';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  Video,
  Camera,
  X,
  Clock,
  Settings,
  HelpCircle,
  CheckSquare,
  Copy
} from 'lucide-react';

interface TaskManagementProps {
  onNavigateIndicators?: () => void;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ onNavigateIndicators }) => {
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AssessmentTask | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form Fields (Section 10 & 29)
  const [nama, setNama] = useState('');
  const [materi, setMateri] = useState('');
  const [kelas, setKelas] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [batasWaktu, setBatasWaktu] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [jumlahTemanDinilai, setJumlahTemanDinilai] = useState(2);
  const [bolehUploadVideo, setBolehUploadVideo] = useState(true);
  const [bolehUploadFoto, setBolehUploadFoto] = useState(true);
  const [wajibBukti, setWajibBukti] = useState(false);
  const [izinkanEdit, setIzinkanEdit] = useState(true);
  const [status, setStatus] = useState<'aktif' | 'draft' | 'selesai'>('aktif');

  const loadData = async () => {
    const [t, c, ind] = await Promise.all([
      DatabaseService.getTasks(),
      DatabaseService.getClasses(),
      DatabaseService.getIndicators()
    ]);
    setTasks(t);
    setClasses(c);
    setIndicators(ind);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingTask(null);
    setNama('Penilaian Antar Teman Passing Bola Basket');
    setMateri('Passing Bola Basket');
    setKelas(classes[0]?.nama || 'XI 7');
    
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    
    setTanggalMulai(today);
    setBatasWaktu(twoWeeksLater);
    setInstruksi(
      'Amati gerakan teman dengan teliti. Berikan penilaian berdasarkan indikator yang telah ditentukan. Berikan masukan yang sopan, objektif, dan membangun.'
    );
    setSelectedIndicators(indicators.map((i) => i.id));
    setJumlahTemanDinilai(2);
    setBolehUploadVideo(true);
    setBolehUploadFoto(true);
    setWajibBukti(false);
    setIzinkanEdit(true);
    setStatus('aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (t: AssessmentTask) => {
    setEditingTask(t);
    setNama(t.nama);
    setMateri(t.materi);
    setKelas(t.kelas);
    setTanggalMulai(t.tanggalMulai);
    setBatasWaktu(t.batasWaktu);
    setInstruksi(t.instruksi);
    setSelectedIndicators(t.indikatorIds || []);
    setJumlahTemanDinilai(t.jumlahTemanDinilai || 1);
    setBolehUploadVideo(t.bolehUploadVideo);
    setBolehUploadFoto(t.bolehUploadFoto);
    setWajibBukti(t.wajibBukti);
    setIzinkanEdit(t.izinkanEdit);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  const handleToggleIndicator = (id: string) => {
    if (selectedIndicators.includes(id)) {
      setSelectedIndicators(selectedIndicators.filter((x) => x !== id));
    } else {
      setSelectedIndicators([...selectedIndicators, id]);
    }
  };

  const handleSelectAllIndicators = () => {
    if (selectedIndicators.length === indicators.length) {
      setSelectedIndicators([]);
    } else {
      setSelectedIndicators(indicators.map((i) => i.id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !materi.trim() || !kelas.trim()) {
      alert('Mohon lengkapi Nama Tugas, Materi, dan Kelas.');
      return;
    }

    if (selectedIndicators.length === 0) {
      alert('Pilih minimal 1 indikator penilaian untuk tugas ini.');
      return;
    }

    const taskData: AssessmentTask = {
      id: editingTask ? editingTask.id : `task-${Date.now()}`,
      nama: nama.trim(),
      materi: materi.trim(),
      kelas,
      tanggalMulai,
      batasWaktu,
      instruksi: instruksi.trim(),
      indikatorIds: selectedIndicators,
      jumlahTemanDinilai: Number(jumlahTemanDinilai),
      bolehUploadVideo,
      bolehUploadFoto,
      wajibBukti,
      izinkanEdit,
      status,
      createdAt: editingTask?.createdAt || new Date().toISOString()
    };

    await DatabaseService.saveTask(taskData);
    setIsModalOpen(false);
    showNotice(editingTask ? 'Tugas penilaian berhasil diperbarui' : 'Tugas penilaian berhasil dibuat dan ditugaskan');
  };

  const handleDuplicateTask = async (task: AssessmentTask) => {
    const newTask: AssessmentTask = {
      ...task,
      id: `task-${Date.now()}`,
      nama: `${task.nama} (Salinan)`,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    await DatabaseService.saveTask(newTask);
    showNotice(`Tugas "${task.nama}" berhasil disalin sebagai Draft! Silakan sesuaikan kelas / batas waktu jika diperlukan.`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus tugas penilaian "${name}"?`)) {
      await DatabaseService.deleteTask(id);
      showNotice('Tugas penilaian dihapus');
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Tugas Penilaian Antar Teman
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Atur instrumen tugas gerak yang akan dikerjakan oleh siswa di masing-masing rombel
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {onNavigateIndicators && (
            <button
              onClick={onNavigateIndicators}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-2xs"
              title="Kelola Bank Indikator Penilaian Gerak"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Bank Indikator</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-sm">
            Belum ada tugas penilaian. Buat tugas baru untuk mulai asesmen siswa.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-900">
                    Kelas {task.kelas}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                    Materi: {task.materi}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      task.status === 'aktif'
                        ? 'bg-blue-50 text-blue-700'
                        : task.status === 'draft'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.status === 'aktif' ? 'Aktif' : task.status === 'draft' ? 'Draft' : 'Selesai'}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
                  {task.nama}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-700">Instruksi Guru: </span>
                  {task.instruksi}
                </p>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Batas Waktu: <strong className="text-slate-700">{task.batasWaktu}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Menilai: <strong className="text-slate-700">{task.jumlahTemanDinilai} Teman</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    {task.indikatorIds.length} Indikator Digunakan
                  </span>
                  <span className="flex items-center gap-1.5">
                    {task.bolehUploadVideo && (
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    )}
                    {task.bolehUploadFoto && (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        <Camera className="w-3 h-3" /> Foto
                      </span>
                    )}
                    {task.izinkanEdit && (
                      <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                        Izinkan Edit
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <button
                  onClick={() => handleDuplicateTask(task)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Duplikat tugas ini beserta indikatornya untuk kelas atau pertemuan lain"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Tugas</span>
                </button>
                <button
                  onClick={() => openEditModal(task)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Tugas</span>
                </button>
                <button
                  onClick={() => handleDelete(task.id, task.nama)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Tugas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                {editingTask ? 'Edit Tugas Penilaian' : 'Buat Tugas Penilaian Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Tugas Penilaian *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Penilaian Antar Teman Passing Bola Basket"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Materi PJOK *
                  </label>
                  <input
                    type="text"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    placeholder="Contoh: Passing Bola Basket"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ditugaskan ke Kelas *
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama}>
                        Kelas {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Waktu Penilaian
                  </label>
                  <input
                    type="date"
                    value={batasWaktu}
                    onChange={(e) => setBatasWaktu(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instruksi Penilaian bagi Siswa *
                </label>
                <textarea
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                  placeholder="Amati gerakan teman dengan teliti. Berikan penilaian berdasarkan indikator..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Indicator Picker (Section 10) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pilih Indikator Penilaian ({selectedIndicators.length}/{indicators.length})
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Pilih indikator gerak yang wajib dinilai oleh siswa
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllIndicators}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {selectedIndicators.length === indicators.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {indicators.map((ind) => {
                    const isChecked = selectedIndicators.includes(ind.id);
                    return (
                      <label
                        key={ind.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white border border-blue-400 text-slate-900 shadow-2xs'
                            : 'hover:bg-white/60 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleIndicator(ind.id)}
                          className="mt-0.5 rounded-md text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800">{ind.indikator}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({ind.materi})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Configuration and Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jumlah Teman yang Wajib Dinilai
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={jumlahTemanDinilai}
                    onChange={(e) => setJumlahTemanDinilai(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Misal: 2 orang teman per siswa</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Tugas</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'aktif' | 'draft' | 'selesai')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="aktif">Aktif (Dapat Dikerjakan Siswa)</option>
                    <option value="draft">Draft (Disembunyikan)</option>
                    <option value="selesai">Selesai (Ditutup)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bolehUploadVideo}
                    onChange={(e) => setBolehUploadVideo(e.target.checked)}
                    className="rounded-md text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">
                    Bolehkan siswa mengunggah <strong>Video</strong> bukti gerakan
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bolehUploadFoto}
                    onChange={(e) => setBolehUploadFoto(e.target.checked)}
                    className="rounded-md text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">
                    Bolehkan siswa mengunggah <strong>Foto</strong> bukti gerakan
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wajibBukti}
                    onChange={(e) => setWajibBukti(e.target.checked)}
                    className="rounded-md text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">
                    Wajib unggah bukti sebelum mengirim penilaian
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={izinkanEdit}
                    onChange={(e) => setIzinkanEdit(e.target.checked)}
                    className="rounded-md text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">
                    Izinkan siswa mengedit penilaian sebelum batas waktu (Fitur Izinkan Edit)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Terbitkan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
