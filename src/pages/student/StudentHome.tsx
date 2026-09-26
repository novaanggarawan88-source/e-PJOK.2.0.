import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { AssessmentTask, AssessmentRecord, QuizItem, MaterialItem, isTaskAssignedToClass } from '../../types';
import { StudentTab } from '../../components/StudentNav';
import {
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  Calendar,
  HeartHandshake,
  Unlock,
  Lock,
  BookOpen,
  CheckSquare,
  Bell,
  BellRing,
  AlertCircle,
  Filter,
  ChevronRight
} from 'lucide-react';

interface StudentHomeProps {
  onNavigateTab: (tab: StudentTab) => void;
  onStartAssessment: (task: AssessmentTask) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  onNavigateTab,
  onStartAssessment
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [myAssessmentsGiven, setMyAssessmentsGiven] = useState<AssessmentRecord[]>([]);
  const [myAssessmentsReceived, setMyAssessmentsReceived] = useState<AssessmentRecord[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const loadData = async () => {
    if (!user) return;
    const [allTasks, allAssessments, allQuizzes, allMaterials] = await Promise.all([
      DatabaseService.getTasks(),
      DatabaseService.getAssessments(),
      DatabaseService.getQuizzesForClass(user.kelas || 'Semua Kelas'),
      DatabaseService.getMaterialsForClass(user.kelas || 'Semua Kelas')
    ]);

    // Tasks for user's class (supports multiple classes per task)
    const userClass = user.kelas || 'XI 7';
    const relevantTasks = allTasks.filter(
      (t) => t.status === 'aktif' && isTaskAssignedToClass(t, userClass)
    );
    setTasks(relevantTasks);
    setQuizzes(allQuizzes);
    setMaterials(allMaterials);

    // Given by me
    const given = allAssessments.filter(
      (a) => a.assessorUserId === user.uid || a.assessorName.toLowerCase() === user.nama.toLowerCase()
    );
    setMyAssessmentsGiven(given);

    // Received by me
    const received = allAssessments.filter(
      (a) => a.targetUserId === user.uid || a.targetName.toLowerCase() === user.nama.toLowerCase()
    );
    setMyAssessmentsReceived(received);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Compute pending peer assessments
  const pendingTasks = useMemo(() => {
    return tasks
      .map((t) => {
        const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === t.id).length;
        const requiredCount = t.jumlahTemanDinilai || 2;
        const remainingNeeded = Math.max(0, requiredCount - evaluatedCount);
        const isCompleted = evaluatedCount >= requiredCount;
        return {
          task: t,
          evaluatedCount,
          requiredCount,
          remainingNeeded,
          isCompleted
        };
      })
      .filter((item) => !item.isCompleted);
  }, [tasks, myAssessmentsGiven]);

  const completedTasks = useMemo(() => {
    return tasks
      .map((t) => {
        const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === t.id).length;
        const requiredCount = t.jumlahTemanDinilai || 2;
        return {
          task: t,
          evaluatedCount,
          requiredCount,
          isCompleted: evaluatedCount >= requiredCount
        };
      })
      .filter((item) => item.isCompleted);
  }, [tasks, myAssessmentsGiven]);

  const totalRemainingNeeded = useMemo(() => {
    return pendingTasks.reduce((sum, item) => sum + item.remainingNeeded, 0);
  }, [pendingTasks]);

  // Filtered tasks based on active filter tab
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'pending') {
      return tasks.filter((t) => {
        const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === t.id).length;
        const requiredCount = t.jumlahTemanDinilai || 2;
        return evaluatedCount < requiredCount;
      });
    }
    if (taskFilter === 'completed') {
      return tasks.filter((t) => {
        const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === t.id).length;
        const requiredCount = t.jumlahTemanDinilai || 2;
        return evaluatedCount >= requiredCount;
      });
    }
    return tasks;
  }, [tasks, taskFilter, myAssessmentsGiven]);

  // Average score received by this student
  const avgReceived =
    myAssessmentsReceived.length > 0
      ? (
          myAssessmentsReceived.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
          myAssessmentsReceived.length
        ).toFixed(2)
      : null;

  const score100Received = avgReceived ? Math.round((Number(avgReceived) / 4) * 100) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-tr from-indigo-700 via-blue-600 to-sky-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-indigo-600/15 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Asesmen Formatif PJOK</span>
            </div>

            {/* Notification Badge on Welcome Banner */}
            {pendingTasks.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-sm animate-pulse">
                <Bell className="w-3.5 h-3.5" />
                <span>{pendingTasks.length} Tugas Perlu Dinilai</span>
              </span>
            ) : tasks.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-sm backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Semua Tugas Tuntas</span>
              </span>
            ) : null}
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight leading-tight">
            Halo, {user?.nama}! 👋
          </h2>

          <p className="mt-1 text-xs sm:text-base text-blue-100">
            Siswa Kelas <strong className="text-white underline decoration-sky-300">{user?.kelas || 'XI 7'}</strong> (No. Absen {user?.nomorAbsen || '01'})
          </p>

          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 italic leading-relaxed">
            &ldquo;Belajar menilai, belajar memperbaiki gerak bersama teman secara sportif dan objektif.&rdquo;
          </p>

          <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 sm:gap-2.5">
            <button
              onClick={() => onNavigateTab('materials')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold backdrop-blur-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Materi</span>
            </button>
            <button
              onClick={() => onNavigateTab('learning-tasks')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-white" />
              <span>Tugas Pembelajaran</span>
            </button>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="relative px-4 py-2.5 rounded-xl bg-white text-indigo-900 text-xs sm:text-sm font-bold shadow-md hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <span>Tugas Penilaian</span>
              {pendingTasks.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
              )}
            </button>
            <button
              onClick={() => onNavigateTab('quizzes')}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Formatif {quizzes.filter((q) => q.status === 'buka').length > 0 ? `(${quizzes.filter((q) => q.status === 'buka').length} Buka)` : ''}</span>
            </button>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* SISTEM NOTIFIKASI PENGINGAT TUGAS PENILAIAN BELUM SELESAI     */}
      {/* ============================================================== */}
      {pendingTasks.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-orange-500/10 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-orange-950/20 border-2 border-amber-300/90 dark:border-amber-700/80 shadow-sm transition-all space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 animate-pulse">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    {pendingTasks.length} Tugas Belum Selesai
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Pengingat Penilaian Antar Teman
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Kamu masih memiliki <strong>{pendingTasks.length} tugas</strong> dengan total <strong>{totalRemainingNeeded} teman</strong> yang belum kamu nilai. Yuk selesaikan sebelum batas waktu!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const firstPending = pendingTasks[0];
                if (firstPending) onStartAssessment(firstPending.task);
                else onNavigateTab('tasks');
              }}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Mulai Menilai Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mini Pending Task Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {pendingTasks.map(({ task, evaluatedCount, requiredCount, remainingNeeded }) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2.5 shadow-2xs hover:border-amber-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                      Kurang {remainingNeeded} Teman
                    </span>
                    <span className="text-[10px] text-slate-400">Batas: {task.batasWaktu}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1" title={task.nama}>
                    {task.nama}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Progres: {evaluatedCount} dari {requiredCount} teman dinilai
                  </p>
                </div>

                <button
                  onClick={() => onStartAssessment(task)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Nilai</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : tasks.length > 0 ? (
        /* Banner Apresiasi Semua Tugas Selesai */
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  Semua Penilaian Teman Telah Selesai!
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                  100% Tuntas
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Hebat! Kamu telah menyelesaikan seluruh kewajiban penilaian antar teman untuk tugas aktif saat ini.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
          >
            Lihat Riwayat
          </button>
        </div>
      ) : null}

      {/* Materials Highlight Banner if materials exist */}
      {materials.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-r from-blue-500/10 via-teal-500/10 to-emerald-500/5 border border-blue-200/80 dark:border-blue-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
                  Materi Pembelajaran PJOK
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  {materials.length} Materi Tersedia
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Video panduan, slide materi, dan modul gerak dapat dipelajari langsung di aplikasi.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('materials')}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buka Materi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quiz Highlight Banner if quizzes exist */}
      {quizzes.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-200/80 dark:border-teal-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
                  Formatif PJOK
                </h4>
                {quizzes.filter((q) => q.status === 'buka').length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                    <Unlock className="w-2.5 h-2.5" /> Ujian Formatif Dibuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Lock className="w-2.5 h-2.5" /> Menunggu Waktu Guru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Tersedia {quizzes.length} asesmen formatif untuk menguji pemahaman materi PJOK Anda.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('quizzes')}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buka Formatif</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards (Including Pending Badge Card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Tugas Perlu Dinilai (Badge Card) */}
        <div
          onClick={() => {
            if (pendingTasks.length > 0) setTaskFilter('pending');
            else setTaskFilter('all');
          }}
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            pendingTasks.length > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Perlu Dinilai
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                pendingTasks.length > 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {pendingTasks.length > 0 ? 'Belum Tuntas' : 'Tuntas'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-heading ${
                pendingTasks.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {pendingTasks.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tugas</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {pendingTasks.length > 0
              ? `${totalRemainingNeeded} teman belum dinilai`
              : 'Semua tugas telah tuntas'}
          </span>
        </div>

        {/* Card 2: Telah Menilai */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Telah Menilai
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-heading">
              {myAssessmentsGiven.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Teman</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ulasan terkirim</span>
        </div>

        {/* Card 3: Dinilai Teman */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Dinilai Teman
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-heading">
              {myAssessmentsReceived.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kali</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ulasan diterima</span>
        </div>

        {/* Card 4: Rata-Rata Capaian */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Rata-Rata Capaian
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-heading">
              {avgReceived || '—'}
            </span>
            {avgReceived && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                / 4 ({score100Received} / 100)
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Skor formatif</span>
        </div>
      </div>

      {/* Active Tasks List with Filter Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-heading">
              Tugas Penilaian Aktif
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih tugas gerak yang ditugaskan guru untuk mengamati dan menilai gerakan temanmu
            </p>
          </div>

          {/* Filter Tabs for Tasks */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-center shrink-0">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                taskFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({tasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                taskFilter === 'pending'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <span>Perlu Dinilai</span>
              {pendingTasks.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  taskFilter === 'pending' ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'
                }`}>
                  {pendingTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                taskFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Tuntas ({completedTasks.length})
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
            {taskFilter === 'pending'
              ? '🎉 Selamat! Tidak ada tugas penilaian teman yang tertunda.'
              : taskFilter === 'completed'
              ? 'Belum ada tugas yang selesai dinilai.'
              : 'Saat ini belum ada tugas penilaian aktif untuk kelasmu.'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === task.id).length;
            const requiredCount = task.jumlahTemanDinilai || 2;
            const isCompleted = evaluatedCount >= requiredCount;
            const remaining = Math.max(0, requiredCount - evaluatedCount);

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-xs ${
                  isCompleted
                    ? 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-300'
                    : 'border-amber-300 dark:border-amber-700/80 hover:border-rose-400 dark:hover:border-rose-500'
                }`}
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300">
                      Kelas {task.kelas}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {task.materi}
                    </span>

                    {/* Prominent Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : evaluatedCount === 0
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Selesai ({evaluatedCount}/{requiredCount} Teman)</span>
                        </>
                      ) : evaluatedCount === 0 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Belum Mulai (0/{requiredCount} Teman)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Belum Selesai ({evaluatedCount}/{requiredCount} Teman - Kurang {remaining})</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading">
                    {task.nama}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    <strong className="text-slate-700 dark:text-slate-200">Instruksi: </strong>
                    {task.instruksi}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Batas: <strong className="text-slate-700 dark:text-slate-200">{task.batasWaktu}</strong>
                    </span>
                    <span>•</span>
                    <span>{task.indikatorIds.length} Indikator Gerak</span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 shrink-0">
                  <button
                    onClick={() => onStartAssessment(task)}
                    className={`w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    }`}
                  >
                    <span>{isCompleted ? 'Nilai Teman Lain' : 'Mulai Menilai'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ethics & Peer Assessment Guide Card */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-r from-blue-50/80 to-indigo-50/50 dark:from-slate-800/60 dark:to-slate-900 border border-blue-200/70 dark:border-slate-800 shadow-xs flex items-start gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
            Etika Penilaian Antar Teman PJOK
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            1. Amati gerakan teman dengan teliti sesuai <strong>rubrik kriteria guru</strong> secara jujur dan objektif.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            2. Berikan masukan yang <strong>santun, sportif, dan memotivasi</strong> agar teman sekelas berkembang bersama.
          </p>
        </div>
      </div>
    </div>
  );
};
