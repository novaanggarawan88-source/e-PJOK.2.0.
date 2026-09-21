import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { AssessmentRecord, ClassItem, AssessmentTask } from '../../types';
import { EvidenceViewer } from '../../components/EvidenceViewer';
import {
  Award,
  Search,
  Filter,
  Eye,
  Calendar,
  Image,
  Video,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';

interface AssessmentResultsProps {
  initialSelectedRecord?: AssessmentRecord | null;
  onClearInitialSelected?: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  initialSelectedRecord,
  onClearInitialSelected
}) => {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);

  // Filters (Section 21)
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedTask, setSelectedTask] = useState('Semua');
  const [searchAssessor, setSearchAssessor] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Selected for Modal Detail (Section 21)
  const [detailRecord, setDetailRecord] = useState<AssessmentRecord | null>(null);

  const loadData = async () => {
    const [a, c, t] = await Promise.all([
      DatabaseService.getAssessments(),
      DatabaseService.getClasses(),
      DatabaseService.getTasks()
    ]);
    setAssessments(a);
    setClasses(c);
    setTasks(t);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSelectedRecord) {
      setDetailRecord(initialSelectedRecord);
      if (onClearInitialSelected) onClearInitialSelected();
    }
  }, [initialSelectedRecord]);

  const handleUpdateEvidence = async (newUrl: string, newThumbnail?: string | null) => {
    if (!detailRecord) return;
    const updated = {
      ...detailRecord,
      evidenceUrl: newUrl,
      thumbnailUrl: newThumbnail || detailRecord.thumbnailUrl,
      updatedAt: new Date().toISOString()
    };
    await DatabaseService.saveAssessment(updated);
    setDetailRecord(updated);
    setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // Filter evaluation
  const filteredAssessments = assessments.filter((a) => {
    const matchClass = selectedClass === 'Semua' || a.assessorClass === selectedClass;
    const matchTask = selectedTask === 'Semua' || a.taskId === selectedTask;
    const matchAssessor =
      !searchAssessor || a.assessorName.toLowerCase().includes(searchAssessor.toLowerCase());
    const matchTarget =
      !searchTarget || a.targetName.toLowerCase().includes(searchTarget.toLowerCase());
    const matchDate = !searchDate || (a.createdAt && a.createdAt.startsWith(searchDate));

    return matchClass && matchTask && matchAssessor && matchTarget && matchDate;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Hasil Penilaian Antar Teman
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar seluruh asesmen yang telah diselesaikan oleh siswa beserta rincian indikator & bukti
          </p>
        </div>
      </div>

      {/* Filter Toolbar (Section 21) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filter & Pencarian Hasil</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Filter Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Semua">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.nama}>
                  Kelas {c.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tugas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tugas</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 truncate"
            >
              <option value="Semua">Semua Tugas</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Search Penilai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Penilai</label>
            <input
              type="text"
              value={searchAssessor}
              onChange={(e) => setSearchAssessor(e.target.value)}
              placeholder="Cari nama penilai..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Search Yang Dinilai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Yang Dinilai</label>
            <input
              type="text"
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              placeholder="Cari yang dinilai..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Filter Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table (Section 21) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                <th className="py-3.5 px-4">PENILAI</th>
                <th className="py-3.5 px-4">YANG DINILAI</th>
                <th className="py-3.5 px-4">KELAS</th>
                <th className="py-3.5 px-4">TUGAS</th>
                <th className="py-3.5 px-4 text-center">RATA-RATA</th>
                <th className="py-3.5 px-4">TANGGAL</th>
                <th className="py-3.5 px-4 text-center">BUKTI</th>
                <th className="py-3.5 px-4 text-center">DETAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada penilaian yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {a.assessorName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-800">
                      {a.targetName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {a.assessorClass}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600">
                      {a.taskTitle || 'Passing Bola Basket'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-extrabold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-heading">
                        {a.averageScore} / 4
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.evidenceType === 'video' ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          <Video className="w-3.5 h-3.5" /> Video
                        </span>
                      ) : a.evidenceType === 'foto' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          <Image className="w-3.5 h-3.5" /> Foto
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDetailRecord(a)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (Section 21) */}
      {detailRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                    Rincian Penilaian Antar Teman
                  </h3>
                  <p className="text-xs text-slate-400">
                    {detailRecord.taskTitle || 'Penilaian Gerak PJOK'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Data Penilai & Yang Dinilai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    DATA PENILAI
                  </span>
                  <p className="text-base font-extrabold text-slate-800">
                    {detailRecord.assessorName}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Kelas: {detailRecord.assessorClass}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    DATA YANG DINILAI
                  </span>
                  <p className="text-base font-extrabold text-blue-900">
                    {detailRecord.targetName}
                  </p>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">
                    Kelas: {detailRecord.targetClass || detailRecord.assessorClass}
                  </p>
                </div>
              </div>

              {/* Bukti Foto / Video (Section 21) */}
              {(detailRecord.evidenceUrl || detailRecord.thumbnailUrl) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      BUKTI GERAKAN YANG DINILAI ({detailRecord.evidenceType?.toUpperCase() || 'VIDEO'})
                    </h4>
                    {detailRecord.videoFileSize && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        Ukuran: {detailRecord.videoFileSize}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center max-h-72">
                    <EvidenceViewer
                      evidenceUrl={detailRecord.evidenceUrl}
                      thumbnailUrl={detailRecord.thumbnailUrl}
                      evidenceType={detailRecord.evidenceType}
                      className="w-full max-h-72 object-contain"
                      onUpdateEvidence={handleUpdateEvidence}
                    />
                  </div>
                </div>
              )}

              {/* Hasil Indikator (Section 21) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    HASIL SKOR PER INDIKATOR
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      Rata-Rata:{' '}
                      <strong className="text-blue-700 font-heading text-sm">
                        {detailRecord.averageScore} / 4
                      </strong>
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Nilai 100: {detailRecord.finalScore100}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {detailRecord.scores.map((s, idx) => (
                    <div
                      key={s.indicatorId || idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-slate-800">
                        {s.indicator || `Indikator ${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-slate-500">
                          {s.score === 4
                            ? 'Sangat Baik'
                            : s.score === 3
                            ? 'Baik'
                            : s.score === 2
                            ? 'Mulai Berkembang'
                            : 'Perlu Bimbingan'}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-white ${
                            s.score === 4
                              ? 'bg-blue-600'
                              : s.score === 3
                              ? 'bg-indigo-600'
                              : s.score === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        >
                          {s.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolom Masukan / Feedback (Section 21) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  MASUKAN / KEKURANGAN DARI TEMAN
                </h4>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-amber-950 text-xs sm:text-sm italic leading-relaxed">
                  &ldquo;{detailRecord.feedback}&rdquo;
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailRecord(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
