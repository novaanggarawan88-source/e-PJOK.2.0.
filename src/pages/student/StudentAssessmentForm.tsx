import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/db';
import { MediaStore } from '../../lib/mediaStore';
import { EvidenceViewer } from '../../components/EvidenceViewer';
import {
  AssessmentTask,
  IndicatorItem,
  UserProfile,
  AssessmentRecord,
  IndicatorScore
} from '../../types';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Video,
  Camera,
  UploadCloud,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface StudentAssessmentFormProps {
  task: AssessmentTask;
  existingRecord?: AssessmentRecord | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const StudentAssessmentForm: React.FC<StudentAssessmentFormProps> = ({
  task,
  existingRecord,
  onBack,
  onSuccess
}) => {
  const { user } = useAuth();
  const [classmates, setClassmates] = useState<UserProfile[]>([]);
  const [taskIndicators, setTaskIndicators] = useState<IndicatorItem[]>([]);
  const [existingAssessments, setExistingAssessments] = useState<AssessmentRecord[]>([]);

  // Form states
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    existingRecord?.targetUserId || ''
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string>(existingRecord?.feedback || '');
  
  // Media upload states
  const [evidenceType, setEvidenceType] = useState<'none' | 'foto' | 'video'>(
    existingRecord?.evidenceType || 'none'
  );
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(
    existingRecord?.evidenceUrl || null
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    existingRecord?.thumbnailUrl || null
  );
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; sizeMB: string } | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [allUsers, allIndicators, allRecords] = await Promise.all([
        DatabaseService.getUsers(),
        DatabaseService.getIndicators(),
        DatabaseService.getAssessments()
      ]);

      // Filter classmates in same class, excluding current user
      const targetRombel = (user?.kelas || task.kelas).toLowerCase();
      const peers = allUsers.filter(
        (u) =>
          u.role === 'murid' &&
          u.status === 'aktif' &&
          u.kelas?.toLowerCase() === targetRombel &&
          u.uid !== user?.uid &&
          u.nama.toLowerCase() !== user?.nama.toLowerCase()
      );
      setClassmates(peers);

      // Filter indicators for this task
      const indList = allIndicators.filter(
        (i) => task.indikatorIds.includes(i.id) && i.status === 'aktif'
      );
      // Sort by urutan
      indList.sort((a, b) => a.urutan - b.urutan);
      setTaskIndicators(indList);

      // Existing records by this student for this task
      const myTaskRecords = allRecords.filter(
        (r) =>
          r.taskId === task.id &&
          (r.assessorUserId === user?.uid || r.assessorName === user?.nama)
      );
      setExistingAssessments(myTaskRecords);

      // Pre-fill initial scores if editing
      if (existingRecord && existingRecord.scores) {
        const initialMap: Record<string, number> = {};
        existingRecord.scores.forEach((s) => {
          initialMap[s.indicatorId] = s.score;
        });
        setScores(initialMap);
      }
    };

    fetchData();
  }, [task, user, existingRecord]);

  // Already evaluated peer IDs
  const alreadyEvaluatedIds = existingAssessments
    .filter((r) => !existingRecord || r.id !== existingRecord.id)
    .map((r) => r.targetUserId);

  // Score selection helper
  const handleSelectScore = (indicatorId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [indicatorId]: value
    }));
  };

  // Compute live average
  const scoredKeys = Object.keys(scores);
  const currentTotal = scoredKeys.reduce((sum, key) => sum + scores[key], 0);
  const liveAverage =
    scoredKeys.length > 0 ? (currentTotal / scoredKeys.length).toFixed(2) : '0.00';
  const live100 =
    scoredKeys.length > 0 ? Math.round((Number(liveAverage) / 4) * 100) : 0;

  // File upload handler - Dioptimalkan untuk video 1 menit (hingga 150MB)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batas aman ukuran file hingga 150MB untuk video PJOK resolusi tinggi dari smartphone
    if (file.size > 150 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (maksimal 150MB). Disarankan merekam video gerakan 15 - 45 detik.');
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileInfo({
      name: file.name,
      sizeMB: `${sizeInMB} MB`
    });
    setMediaFile(file);

    const isVideo = file.type.startsWith('video/');
    setEvidenceType(isVideo ? 'video' : 'foto');

    // Generate local preview URL instan
    const previewUrl = URL.createObjectURL(file);
    setEvidenceUrl(previewUrl);

    // Buat thumbnail gerakan otomatis secara cepat (< 1 detik)
    if (isVideo) {
      try {
        const thumb = await MediaStore.generateVideoThumbnail(file);
        if (thumb) {
          setThumbnailPreview(thumb);
        }
      } catch (err) {
        console.warn('Gagal membuat thumbnail video:', err);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setEvidenceUrl(null);
    setThumbnailPreview(null);
    setFileInfo(null);
    setEvidenceType('none');
    setUploadProgress(0);
    setVideoLinkInput('');
  };

  const handleApplyVideoLink = () => {
    if (!videoLinkInput.trim()) return;
    const clean = videoLinkInput.trim();
    setEvidenceUrl(clean);
    setEvidenceType('video');
    setMediaFile(null);
    setThumbnailPreview(null);
    setFileInfo({
      name: clean.includes('drive.google.com') ? 'Video Google Drive' : 'Tautan Video Cloud',
      sizeMB: 'Cloud URL'
    });
  };

  // Submit assessment - Super Cepat (< 1 detik)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Target selected
    if (!selectedTargetId) {
      setErrorMessage('Silakan pilih teman yang akan dinilai.');
      return;
    }

    // Validation 2: Check all indicators scored
    for (const ind of taskIndicators) {
      if (!scores[ind.id]) {
        setErrorMessage(`Mohon berikan skor untuk indikator: "${ind.indikator}"`);
        return;
      }
    }

    // Validation 3: Feedback required
    if (!feedback.trim()) {
      setErrorMessage('Mohon tuliskan masukan atau catatan perbaikan untuk temanmu.');
      return;
    }

    // Validation 4: Evidence required if configured by teacher
    if (task.wajibBukti && (!evidenceUrl || evidenceType === 'none')) {
      setErrorMessage('Tugas ini mewajibkan unggah bukti (foto atau video) gerakan teman.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      const targetUser = classmates.find((c) => c.uid === selectedTargetId);
      const targetName = targetUser?.nama || 'Teman Sekelas';
      const targetClass = targetUser?.kelas || task.kelas;

      // Handle file upload secara cepat dengan progress callback dan IndexedDB fallback
      let uploadedUrl = evidenceUrl;
      let finalThumbnail = thumbnailPreview;

      if (mediaFile) {
        setUploading(true);
        setUploadProgress(20);
        const uploadResult = await DatabaseService.uploadMedia(
          mediaFile,
          `assessments/${task.id}/${user?.uid}_${selectedTargetId}_${Date.now()}`,
          (percent) => setUploadProgress(percent)
        );
        uploadedUrl = uploadResult.url;
        if (uploadResult.thumbnailUrl) {
          finalThumbnail = uploadResult.thumbnailUrl;
        }
        setUploading(false);
      }

      // Prepare score items
      const scoreItems: IndicatorScore[] = taskIndicators.map((ind) => ({
        indicatorId: ind.id,
        indicator: ind.indikator,
        score: scores[ind.id] || 3
      }));

      const avg = Number((currentTotal / taskIndicators.length).toFixed(2));
      const final100 = Math.round((avg / 4) * 100);

      const record: AssessmentRecord = {
        id: existingRecord ? existingRecord.id : `asm-${Date.now()}`,
        taskId: task.id,
        taskTitle: task.nama,
        assessorId: user?.uid || '',
        assessorUserId: user?.uid || '',
        assessorName: user?.nama || 'Murid Penilai',
        assessorClass: user?.kelas || task.kelas,
        targetId: selectedTargetId,
        targetUserId: selectedTargetId,
        targetName,
        targetClass,
        scores: scoreItems,
        averageScore: avg,
        finalScore100: final100,
        feedback: feedback.trim(),
        evidenceUrl: uploadedUrl,
        thumbnailUrl: finalThumbnail,
        videoFileSize: fileInfo?.sizeMB,
        evidenceType: evidenceType,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simpan penilaian ke database secara instan
      await DatabaseService.saveAssessment(record);
      setSubmitting(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitting(false);
      setUploading(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menyimpan penilaian.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda Tugas</span>
      </button>

      {/* Task Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
            Kelas {user?.kelas || task.kelas}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Materi: {task.materi}
          </span>
          {task.wajibBukti && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300">
              Wajib Unggah Bukti
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-heading">
          {task.nama}
        </h2>

        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
          <p className="font-bold mb-1 text-emerald-900 dark:text-emerald-300">Instruksi Guru PJOK:</p>
          <p className="leading-relaxed">{task.instruksi}</p>
        </div>
      </div>

      {/* Main Assessment Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Step 1: Choose Peer (Dropdown) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <label className="block text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 font-heading">
                Pilih Teman yang Akan Dinilai *
              </label>
              <p className="text-xs text-slate-400">
                Pilih salah satu teman sekelas yang gerakannya sedang kamu amati
              </p>
            </div>
          </div>

          <select
            value={selectedTargetId}
            disabled={!!existingRecord}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="">-- Pilih Teman Sekelas ({user?.kelas || task.kelas}) --</option>
            {classmates.map((c) => {
              const alreadyDone = alreadyEvaluatedIds.includes(c.uid);
              return (
                <option
                  key={c.uid}
                  value={c.uid}
                  disabled={alreadyDone}
                  className={alreadyDone ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}
                >
                  {c.nama} {c.nomorAbsen ? `(No Absen ${c.nomorAbsen})` : ''}
                  {alreadyDone ? ' — [Sudah Anda Nilai]' : ''}
                </option>
              );
            })}
          </select>

          {selectedTargetId && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Kamu sedang menilai:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {classmates.find((c) => c.uid === selectedTargetId)?.nama}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Movement Indicators & Big Touch-Friendly Buttons */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 font-heading">
                  Indikator Gerak & Penilaian Skala (1 - 4) *
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih angka 1 sampai 4 untuk setiap indikator gerak
                </p>
              </div>
            </div>

            {/* Live Average Tracker */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rata-Rata
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                {liveAverage} <span className="text-xs text-slate-400">/ 4</span>
              </span>
            </div>
          </div>

          {/* Indicator Item Cards */}
          <div className="space-y-3 sm:space-y-4">
            {taskIndicators.map((ind, idx) => {
              const currentVal = scores[ind.id];
              const desc =
                ind.skala?.[currentVal as 1 | 2 | 3 | 4] ||
                (currentVal === 4
                  ? 'Sangat Baik'
                  : currentVal === 3
                  ? 'Baik'
                  : currentVal === 2
                  ? 'Mulai Berkembang'
                  : currentVal === 1
                  ? 'Perlu Bimbingan'
                  : null);

              return (
                <div
                  key={ind.id}
                  className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 space-y-3"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {ind.indikator}
                      </p>
                      <p className="text-[11px] text-slate-400">Materi: {ind.materi}</p>
                    </div>
                  </div>

                  {/* 4 Big Touch-Friendly Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                    {[1, 2, 3, 4].map((num) => {
                      const isSelected = currentVal === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSelectScore(ind.id, num)}
                          className={`py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg flex flex-col items-center justify-center transition-all cursor-pointer min-h-[48px] ${
                            isSelected
                              ? num === 4
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102 ring-2 ring-emerald-600 ring-offset-2'
                                : num === 3
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-102 ring-2 ring-teal-600 ring-offset-2'
                                : num === 2
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-102 ring-2 ring-amber-500 ring-offset-2'
                                : 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-102 ring-2 ring-rose-500 ring-offset-2'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{num}</span>
                          <span
                            className={`text-[9px] sm:text-[10px] font-bold ${
                              isSelected ? 'text-white/90' : 'text-slate-400'
                            }`}
                          >
                            {num === 4 ? 'Sgt Baik' : num === 3 ? 'Baik' : num === 2 ? 'Berkembang' : 'Bimbingan'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Description Feedback */}
                  {desc && (
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 animate-in fade-in">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Keterangan:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{desc}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Masukan / Feedback */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <label className="block text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 font-heading">
                Masukan / Catatan Perbaikan untuk Teman *
              </label>
              <p className="text-xs text-slate-400">
                Berikan masukan yang sopan, jelas, dan membangun
              </p>
            </div>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            required
            placeholder="Contoh: Gerakan tanganmu saat mendorong bola sudah kuat dan lurus ke depan, namun posisi awal lutut sebaiknya ditekuk sedikit lebih rendah agar dorongan lebih stabil."
            className="w-full p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
          />

          <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Tips: Sebutkan 1 hal yang sudah bagus dan 1 hal yang perlu diperbaiki.</span>
          </div>
        </div>

        {/* Step 4: Video / Photo Upload (Ultra Cepat) */}
        {(task.bolehUploadVideo || task.bolehUploadFoto) && (
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 font-heading">
                    Unggah Bukti Gerakan ({task.wajibBukti ? 'Wajib' : 'Opsional'})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Foto atau video rekaman aktivitas gerakan teman saat praktik PJOK
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {task.bolehUploadVideo && (
                  <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Video
                  </span>
                )}
                {task.bolehUploadFoto && (
                  <span className="p-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Foto
                  </span>
                )}
              </div>
            </div>

            {/* Mode Switcher: Unggah File / Tautan Link */}
            {!evidenceUrl && (
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pilih File HP/Laptop
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('link')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    uploadMode === 'link'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tautan Google Drive / Video
                </button>
              </div>
            )}

            {/* Upload Area / Preview */}
            {!evidenceUrl ? (
              uploadMode === 'file' ? (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500">
                    <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    Pilih video rekaman gerakan teman (disarankan 10–20 detik) atau foto dari HP / Laptop
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
                    Format MP4, WEBM, MOV (Disarankan maks 25MB agar instan dimuat guru). Jika video berukuran besar, gunakan opsi tab <strong>Tautan Google Drive</strong>.
                  </p>
                  <div className="mt-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] font-semibold">
                    ⚡ Sinkronisasi Cloud: Rekaman otomatis tersimpan untuk penilaian Guru & Siswa
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempelkan Tautan Video (Google Drive / YouTube / Direct MP4)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Contoh: https://drive.google.com/file/d/.../view atau link YouTube"
                        value={videoLinkInput}
                        onChange={(e) => setVideoLinkInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVideoLink}
                        disabled={!videoLinkInput.trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Gunakan Link
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 Jika video tersimpan di Google Drive, pastikan izin berbagi disetel ke <em>"Siapa saja yang memiliki tautan dapat melihat"</em>.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center relative p-1">
                  <div className="w-full">
                    <EvidenceViewer
                      evidenceUrl={evidenceUrl}
                      thumbnailUrl={thumbnailPreview}
                      evidenceType={evidenceType}
                      autoPlay={false}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer z-10 shadow-md"
                    title="Hapus Bukti"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Bukti {evidenceType === 'video' ? 'Video' : 'Foto'} siap disimpan
                    </span>
                    {fileInfo && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px]">
                        {fileInfo.sizeMB}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    Ganti File
                  </button>
                </div>

                {/* PJOK Pro Tip */}
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <span>
                    <strong>Tips Praktik PJOK:</strong> Cukup rekam 15 - 30 detik pada gerakan inti (misal: awalan lari, tolakan kaki, dan pendaratan) agar penilaian tersimpan lebih cepat dan hemat kuota.
                  </span>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-1.5 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Mengunggah Bukti Gerakan...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full min-h-[48px] py-3.5 sm:py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <span>Mengunggah Video ({uploadProgress}%)...</span>
            ) : submitting ? (
              <span>Menyimpan Penilaian Instan...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>KIRIM PENILAIAN SEKARANG</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 font-heading">
              Penilaian Berhasil Dikirim!
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Penilaian, masukan, dan bukti gerakan telah tersimpan secara instan. Guru PJOK dapat langsung memantau hasil pengamatanmu.
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              Rata-rata skor yang kamu berikan: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{liveAverage} / 4</strong> (Nilai: {live100})
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={onSuccess}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Kembali ke Beranda Tugas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
