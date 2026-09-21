import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { IndicatorItem, ScaleDescriptions } from '../../types';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  X,
  SlidersHorizontal,
  Info,
  ArrowLeft,
  Copy
} from 'lucide-react';

const DEFAULT_SCALE: ScaleDescriptions = {
  1: 'Perlu Bimbingan',
  2: 'Mulai Berkembang',
  3: 'Baik',
  4: 'Sangat Baik'
};

interface IndicatorManagementProps {
  onBack?: () => void;
}

export const IndicatorManagement: React.FC<IndicatorManagementProps> = ({ onBack }) => {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<IndicatorItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [judulPenilaian, setJudulPenilaian] = useState('Teknik Passing Bola Basket');
  const [materi, setMateri] = useState('Passing Bola Basket');
  const [indikatorText, setIndikatorText] = useState('');
  const [urutan, setUrutan] = useState(1);
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  
  // Custom scale descriptions (1-4)
  const [scaleDesc, setScaleDesc] = useState<ScaleDescriptions>(DEFAULT_SCALE);

  const loadData = async () => {
    const list = await DatabaseService.getIndicators();
    setIndicators(list);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingIndicator(null);
    setJudulPenilaian('Teknik Passing Bola Basket');
    setMateri('Passing Bola Basket');
    setIndikatorText('');
    setUrutan(indicators.length + 1);
    setStatus('aktif');
    setScaleDesc(DEFAULT_SCALE);
    setIsModalOpen(true);
  };

  const openEditModal = (ind: IndicatorItem) => {
    setEditingIndicator(ind);
    setJudulPenilaian(ind.judulPenilaian);
    setMateri(ind.materi);
    setIndikatorText(ind.indikator);
    setUrutan(ind.urutan);
    setStatus(ind.status);
    setScaleDesc(ind.skala || DEFAULT_SCALE);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indikatorText.trim()) return;

    const item: IndicatorItem = {
      id: editingIndicator ? editingIndicator.id : `ind-${Date.now()}`,
      judulPenilaian: judulPenilaian.trim(),
      materi: materi.trim(),
      indikator: indikatorText.trim(),
      urutan: Number(urutan),
      status,
      createdBy: 'guru-1',
      createdAt: editingIndicator?.createdAt || new Date().toISOString(),
      skala: scaleDesc
    };

    await DatabaseService.saveIndicator(item);
    setIsModalOpen(false);
    showNotice(editingIndicator ? 'Indikator berhasil diperbarui' : 'Indikator baru berhasil dibuat');
  };

  const handleDuplicateIndicator = async (ind: IndicatorItem) => {
    const newInd: IndicatorItem = {
      ...ind,
      id: `ind-${Date.now()}`,
      indikator: `${ind.indikator} (Salinan)`,
      urutan: indicators.length + 1,
      createdAt: new Date().toISOString()
    };
    await DatabaseService.saveIndicator(newInd);
    showNotice(`Indikator berhasil disalin / diduplikat!`);
  };

  const handleCopyText = (ind: IndicatorItem) => {
    const textToCopy = `[Indikator PJOK: ${ind.materi}]\n${ind.indikator}\nRubrik:\n1. ${ind.skala?.[1] || '-'}\n2. ${ind.skala?.[2] || '-'}\n3. ${ind.skala?.[3] || '-'}\n4. ${ind.skala?.[4] || '-'}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      showNotice('Teks indikator & rubrik berhasil disalin ke clipboard');
    } else {
      showNotice('Teks siap disalin');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus indikator: "${name}"?`)) {
      await DatabaseService.deleteIndicator(id);
      showNotice('Indikator berhasil dihapus');
    }
  };

  const handleToggleStatus = async (ind: IndicatorItem) => {
    const newStatus = ind.status === 'aktif' ? 'nonaktif' : 'aktif';
    await DatabaseService.saveIndicator({ ...ind, status: newStatus });
    showNotice(`Status indikator diubah menjadi ${newStatus}`);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= indicators.length) return;

    const current = indicators[index];
    const swapWith = indicators[targetIdx];

    const currentOrder = current.urutan;
    const swapOrder = swapWith.urutan;

    await Promise.all([
      DatabaseService.saveIndicator({ ...current, urutan: swapOrder }),
      DatabaseService.saveIndicator({ ...swapWith, urutan: currentOrder })
    ]);
    showNotice('Urutan indikator diperbarui');
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Tugas Penilaian</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-1.5 ml-0 sm:ml-2">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Kewenangan Penuh Guru</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Indikator Penilaian Gerak
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Rumusan rubrik penilaian gerak jasmani (skala 1–4) yang akan dinilai oleh siswa
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Indikator Baru</span>
        </button>
      </div>

      {/* Info notice about student permission */}
      <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/70 flex items-start gap-3 text-xs sm:text-sm text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Keamanan & Integritas Penilaian</p>
          <p className="text-xs text-blue-800 mt-0.5">
            Indikator penilaian hanya dapat diatur dan diubah oleh Guru PJOK. Siswa tidak memiliki akses untuk mengubah rubrik maupun bobot penilaian.
          </p>
        </div>
      </div>

      {/* Indicator List */}
      <div className="space-y-3">
        {indicators.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-sm">
            Belum ada indikator yang dibuat. Klik tombol &ldquo;Buat Indikator Baru&rdquo; untuk memulai.
          </div>
        ) : (
          indicators.map((ind, index) => (
            <div
              key={ind.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                {/* Order badge with up/down arrows */}
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                    {ind.urutan}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Geser ke atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === indicators.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      Materi: {ind.materi}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(ind)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                        ind.status === 'aktif'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {ind.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {ind.indikator}
                  </h3>

                  {/* Rubric descriptions preview */}
                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-rose-600 block mb-0.5">[1] Perlu Bimbingan</span>
                      <span className="text-slate-600 text-[10px] line-clamp-2">
                        {ind.skala?.[1] || 'Perlu bimbingan guru/teman'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-amber-600 block mb-0.5">[2] Mulai Berkembang</span>
                      <span className="text-slate-600 text-[10px] line-clamp-2">
                        {ind.skala?.[2] || 'Mulai berkembang'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-blue-600 block mb-0.5">[3] Baik</span>
                      <span className="text-slate-600 text-[10px] line-clamp-2">
                        {ind.skala?.[3] || 'Gerakan sudah baik'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-indigo-600 block mb-0.5">[4] Sangat Baik</span>
                      <span className="text-slate-600 text-[10px] line-clamp-2">
                        {ind.skala?.[4] || 'Sangat baik dan sempurna'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleDuplicateIndicator(ind)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Duplikat / Salin Indikator ini ke daftar"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
                <button
                  onClick={() => openEditModal(ind)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(ind.id, ind.indikator)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Indikator"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Indicator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                {editingIndicator ? 'Edit Indikator Penilaian' : 'Buat Indikator Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Judul Penilaian *
                  </label>
                  <input
                    type="text"
                    value={judulPenilaian}
                    onChange={(e) => setJudulPenilaian(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Materi Pembelajaran *
                  </label>
                  <input
                    type="text"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pernyataan Indikator Gerak *
                </label>
                <textarea
                  value={indikatorText}
                  onChange={(e) => setIndikatorText(e.target.value)}
                  placeholder="Contoh: Posisi kedua tangan memegang bola di depan dada dengan jari terbuka"
                  required
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Urutan Indikator
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={urutan}
                    onChange={(e) => setUrutan(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                  >
                    <option value="aktif">Aktif Digunakan</option>
                    <option value="nonaktif">Nonaktif / Arsip</option>
                  </select>
                </div>
              </div>

              {/* Rubric scale descriptions (1-4) as per Section 9 */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Deskripsi Skala Penilaian (1 - 4)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Keterangan ini akan muncul saat siswa menekan angka 1–4 pada instrumen penilaian.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-0.5">
                      Skala [1] - Perlu Bimbingan
                    </label>
                    <input
                      type="text"
                      value={scaleDesc[1]}
                      onChange={(e) => setScaleDesc({ ...scaleDesc, 1: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 mb-0.5">
                      Skala [2] - Mulai Berkembang
                    </label>
                    <input
                      type="text"
                      value={scaleDesc[2]}
                      onChange={(e) => setScaleDesc({ ...scaleDesc, 2: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-700 mb-0.5">
                      Skala [3] - Baik
                    </label>
                    <input
                      type="text"
                      value={scaleDesc[3]}
                      onChange={(e) => setScaleDesc({ ...scaleDesc, 3: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-700 mb-0.5">
                      Skala [4] - Sangat Baik
                    </label>
                    <input
                      type="text"
                      value={scaleDesc[4]}
                      onChange={(e) => setScaleDesc({ ...scaleDesc, 4: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingIndicator ? 'Simpan Perubahan' : 'Buat Indikator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
