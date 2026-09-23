import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { UserProfile, LearningTaskItem, LearningTaskSubmission } from '../../types';
import { EvidenceViewer } from '../../components/EvidenceViewer';
import { MediaStore } from '../../lib/mediaStore';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  Paperclip,
  X,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Award,
  Lock
} from 'lucide-react';

interface StudentLearningTasksProps {
  user: UserProfile;
}

export const StudentLearningTasks: React.FC<StudentLearningTasksProps> = ({ user }) => {
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);
  const [submissions, setSubmissions] = useState<LearningTaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Modal pengumpulan
  const [selectedTask, setSelectedTask] = useState<LearningTaskItem | null>(null);
  const [catatanJawaban, setCatatanJawaban] = useState('');
  const [linkLampiran, setLinkLampiran] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentClass = user.kelas || 'Semua Kelas';
      // Hanya ambil tugas yang status = 'aktif' untuk murid
      const [allTasks, mySubs] = await Promise.all([
        DatabaseService.getLearningTasks(studentClass, true),
        DatabaseService.getLearningSubmissions(undefined, user.uid)
      ]);
      setTasks(allTasks);
      setSubmissions(mySubs);
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
  }, [user.uid, user.kelas]);

  // Cari submission untuk task tertentu
  const getSubmissionForTask = (taskId: string) => {
    return submissions.find((s) => s.taskId === taskId);
  };

  const handleOpenModal = (task: LearningTaskItem) => {
    setSelectedTask(task);
    setPasteWarning(false);
    const existing = getSubmissionForTask(task.id);
    if (existing) {
      setCatatanJawaban(existing.catatanJawaban || '');
      setLinkLampiran(existing.linkLampiran || '');
    } else {
      setCatatanJawaban('');
      setLinkLampiran('');
    }
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const isLangsung = selectedTask.tipePengumpulan === 'langsung';
    const isUpload = selectedTask.tipePengumpulan === 'upload';

    if (isLangsung && !catatanJawaban.trim()) {
      alert('Tugas ini wajib diisi secara langsung. Harap ketik jawaban Anda pada kolom yang disediakan!');
      return;
    }

    if (isUpload && !linkLampiran.trim()) {
      alert('Tugas ini memerlukan tautan dokumen/berkas tugas. Harap masukkan tautan tugas Anda!');
      return;
    }

    if (!catatanJawaban.trim() && !linkLampiran.trim()) {
      alert('Harap isi jawaban langsung atau sertakan tautan berkas tugas Anda.');
      return;
    }

    setSubmitting(true);
    try {
      const existing = getSubmissionForTask(selectedTask.id);
      const submission: LearningTaskSubmission = {
        id: existing?.id || `sub_${selectedTask.id}_${user.uid}_${Date.now()}`,
        taskId: selectedTask.id,
        taskJudul: selectedTask.judul,
        studentId: user.uid,
        studentName: user.nama,
        studentClass: user.kelas || 'XI 7',
        studentNoAbsen: user.nomorAbsen,
        catatanJawaban: catatanJawaban.trim(),
        linkLampiran: linkLampiran.trim() || undefined,
        submittedAt: new Date().toISOString(),
        status: existing?.status || 'terkirim',
        nilai: existing?.nilai,
        catatanGuru: existing?.catatanGuru
      };

      await DatabaseService.saveLearningSubmission(submission);
      setSubmitSuccess(true);
      await loadData();
      setTimeout(() => {
        setSelectedTask(null);
        setSubmitSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Gagal mengirimkan tugas:', err);
      alert('Terjadi kendala saat mengirimkan tugas. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const isSubmitted = !!getSubmissionForTask(t.id);
    if (activeFilter === 'pending') return !isSubmitted;
    if (activeFilter === 'submitted') return isSubmitted;
    return true;
  });

  const totalSubmitted = tasks.filter((t) => !!getSubmissionForTask(t.id)).length;
  const totalPending = tasks.length - totalSubmitted;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-blue-100">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Fitur Pembelajaran Mandiri</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Tugas Pembelajaran
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Selesaikan lembar kerja analisis gerak, portofolio latihan mandiri, dan tugas teori praktik PJOK Anda. Ketik jawaban langsung pada sistem atau unggah dokumen penugasan.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 relative z-10 pt-2 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 text-center sm:text-left">
            <span className="text-[11px] sm:text-xs text-blue-100 block font-medium">Total Tugas</span>
            <span className="text-xl sm:text-2xl font-black font-heading mt-0.5 block">{tasks.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 text-center sm:text-left">
            <span className="text-[11px] sm:text-xs text-emerald-200 block font-medium">Terkirim</span>
            <span className="text-xl sm:text-2xl font-black font-heading text-emerald-300 mt-0.5 block">
              {totalSubmitted}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 text-center sm:text-left">
            <span className="text-[11px] sm:text-xs text-amber-200 block font-medium">Belum Kumpul</span>
            <span className="text-xl sm:text-2xl font-black font-heading text-amber-300 mt-0.5 block">
              {totalPending}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Tugas ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perlu Dikerjakan ({totalPending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('submitted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'submitted'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai Dikumpulkan ({totalSubmitted})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Memuat tugas pembelajaran...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {activeFilter === 'pending'
              ? 'Hebat! Semua tugas pembelajaran sudah Anda kumpulkan'
              : 'Belum ada tugas pembelajaran aktif saat ini'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Pantau terus penugasan dari guru PJOK Anda untuk memperdalam materi dan teknik gerak olahraga.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredTasks.map((task) => {
            const submission = getSubmissionForTask(task.id);
            const isSubmitted = !!submission;
            const isGraded = submission?.status === 'dinilai';
            const isLangsung = task.tipePengumpulan === 'langsung';

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">
                      {task.materi}
                    </span>

                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Nilai: {submission.nilai} / 100</span>
                      </span>
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Terkumpul (Menunggu Dinilai)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Belum Dikumpulkan
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                      {task.judul}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {task.deskripsi || 'Selesaikan tugas mandiri ini sesuai petunjuk dari guru PJOK.'}
                    </p>
                  </div>

                  {/* Submission Method & Anti Copy-Paste Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {isLangsung ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                        <FileText className="w-3 h-3" />
                        <span>Diisi Langsung</span>
                      </span>
                    ) : task.tipePengumpulan === 'upload' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                        <Paperclip className="w-3 h-3" />
                        <span>Unggah Dokumen/Link</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        <FileCheck className="w-3 h-3" />
                        <span>Langsung / Berkas</span>
                      </span>
                    )}

                    {task.disableCopyPaste !== false && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                        <ShieldCheck className="w-3 h-3 text-rose-600" />
                        <span>Anti Salin-Tempel</span>
                      </span>
                    )}
                  </div>

                  {/* Teacher Feedback if Graded */}
                  {isGraded && submission.catatanGuru && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
                      <p className="font-bold text-emerald-800 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Catatan & Masukan Guru:
                      </p>
                      <p className="text-emerald-900 leading-relaxed italic">
                        "{submission.catatanGuru}"
                      </p>
                    </div>
                  )}

                  {/* Deadline info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Batas: {new Date(task.batasWaktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>
                    {task.lampiranUrl && (
                      <a
                        href={task.lampiranUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Dokumen Guru</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(task)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSubmitted
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span>Lihat / Perbarui Pengumpulan</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kumpulkan Tugas Ini</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Kumpulkan Tugas */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Pengumpulan Tugas Pembelajaran
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
                  {selectedTask.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">
                  Tugas Berhasil Terkirim!
                </h4>
                <p className="text-xs text-slate-400">
                  Data pengumpulan tersimpan di database dan siap diperiksa oleh Guru PJOK.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Panduan Instruksi */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-800">Petunjuk & Soal Tugas:</p>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.deskripsi}
                  </p>
                  {selectedTask.instruksi && selectedTask.instruksi.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      {selectedTask.instruksi.map((ins, i) => (
                        <p key={i} className="text-slate-700 font-medium">
                          {ins}
                        </p>
                      ))}
                    </div>
                  )}
                  {selectedTask.lampiranUrl && (
                    <div className="pt-2 space-y-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          {selectedTask.lampiranNama || 'Lampiran Materi / Video Pembelajaran Guru:'}
                        </span>
                        <a
                          href={selectedTask.lampiranUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Tab Baru</span>
                        </a>
                      </div>
                      {(MediaStore.isExternalVideoLink(selectedTask.lampiranUrl) ||
                        selectedTask.lampiranUrl.endsWith('.mp4') ||
                        selectedTask.lampiranUrl.includes('video')) ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 p-1">
                          <EvidenceViewer
                            evidenceUrl={selectedTask.lampiranUrl}
                            evidenceType="video"
                            autoPlay={false}
                          />
                        </div>
                      ) : (
                        <a
                          href={selectedTask.lampiranUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Berkas Guru: {selectedTask.lampiranNama || 'Dokumen Tugas'}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* ANTI COPY-PASTE NOTICE BANNER */}
                {selectedTask.disableCopyPaste !== false && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-extrabold text-rose-900">
                        Mode Jawaban Langsung (Anti Salin-Tempel Aktif)
                      </p>
                      <p className="text-rose-700 text-[11px] leading-relaxed mt-0.5">
                        Guru mewajibkan Anda untuk <strong>mengetik jawaban sendiri secara langsung</strong> pada kolom di bawah. Fitur Copy-Paste (salin-tempel teks) dinonaktifkan demi orisinalitas pengerjaan tugas.
                      </p>
                    </div>
                  </div>
                )}

                {/* WARNING IF STUDENT TRIES TO PASTE */}
                {pasteWarning && (
                  <div className="p-3 rounded-2xl bg-amber-500 text-white flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 shadow-md">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>⚠️ Salin-Tempel (Copy-Paste) dinonaktifkan untuk tugas ini. Harap ketik jawaban Anda secara langsung!</span>
                  </div>
                )}

                {/* Catatan / Jawaban Langsung */}
                {(selectedTask.tipePengumpulan === 'langsung' ||
                  selectedTask.tipePengumpulan === 'keduanya' ||
                  !selectedTask.tipePengumpulan) && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">
                        Jawaban Teks / Analisis Mandiri *
                      </label>
                      {selectedTask.disableCopyPaste !== false && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Anti Copy-Paste
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={catatanJawaban}
                      onChange={(e) => setCatatanJawaban(e.target.value)}
                      onPaste={(e) => {
                        if (selectedTask.disableCopyPaste !== false) {
                          e.preventDefault();
                          setPasteWarning(true);
                          setTimeout(() => setPasteWarning(false), 4500);
                        }
                      }}
                      onCopy={(e) => {
                        if (selectedTask.disableCopyPaste !== false) {
                          e.preventDefault();
                        }
                      }}
                      onCut={(e) => {
                        if (selectedTask.disableCopyPaste !== false) {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => {
                        if (selectedTask.disableCopyPaste !== false) {
                          e.preventDefault();
                          setPasteWarning(true);
                          setTimeout(() => setPasteWarning(false), 4500);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (selectedTask.disableCopyPaste !== false) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Ketikkan analisis gerak, jawaban soal, atau penjelasan Anda di sini..."
                      className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
                      required={selectedTask.tipePengumpulan === 'langsung'}
                    />
                  </div>
                )}

                {/* Link Lampiran (Google Drive / Docs) */}
                {(selectedTask.tipePengumpulan === 'upload' ||
                  selectedTask.tipePengumpulan === 'keduanya') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Tautan Dokumen / File Pendukung (Google Drive / Docs / Video)
                      {selectedTask.tipePengumpulan === 'upload' && ' *'}
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={linkLampiran}
                        onChange={(e) => setLinkLampiran(e.target.value)}
                        placeholder="Contoh: https://drive.google.com/file/... atau tautan Canva / YouTube"
                        required={selectedTask.tipePengumpulan === 'upload'}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    {linkLampiran.trim() && (
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Pratinjau Tautan Lampiran Tugas:
                        </span>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 p-1">
                          <EvidenceViewer
                            evidenceUrl={linkLampiran.trim()}
                            evidenceType={MediaStore.isExternalVideoLink(linkLampiran) ? 'video' : undefined}
                            autoPlay={false}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      💡 Pastikan akses tautan Google Drive / Docs diatur ke "Siapa saja dengan tautan dapat melihat" agar guru dapat memeriksa tugas Anda.
                    </p>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Mengirimkan...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Tugas Pembelajaran</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
