import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import {
  UserProfile,
  ClassItem,
  AssessmentTask,
  AssessmentRecord,
  isTaskAssignedToClass
} from '../../types';
import { TeacherMenu } from '../../components/Sidebar';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  Users,
  School,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  FileSpreadsheet,
  Award,
  Calendar,
  Flame,
  ShieldCheck,
  FileText,
  RefreshCw,
  Sparkles,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Filter,
  Copy,
  Check,
  Search,
  X,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (menu: TeacherMenu) => void;
  onOpenAssessmentDetail?: (record: AssessmentRecord) => void;
}

interface PendingStudentItem {
  student: UserProfile;
  task: AssessmentTask;
  completedCount: number;
  requiredCount: number;
  status: 'belum' | 'sebagian';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigate,
  onOpenAssessmentDetail
}) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Quick stats interactive filters & modal states
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [searchPending, setSearchPending] = useState('');
  const [pendingFilterTab, setPendingFilterTab] = useState<'all' | 'belum' | 'sebagian'>('all');
  const [selectedTaskModalFilter, setSelectedTaskModalFilter] = useState('Semua');
  const [copiedReminder, setCopiedReminder] = useState(false);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      const res = await DatabaseService.syncAllLocalDataToCloud();
      showToast(res.message);
      await loadData();
    } catch (e: any) {
      showToast('Gagal sinkron: ' + (e?.message || 'Gangguan jaringan'));
    } finally {
      setSyncing(false);
    }
  };

  const loadData = async () => {
    const [u, c, t, a] = await Promise.all([
      DatabaseService.getUsers(),
      DatabaseService.getClasses(),
      DatabaseService.getTasks(),
      DatabaseService.getAssessments()
    ]);
    setStudents(u.filter((x) => x.role === 'murid'));
    setClasses(c);
    setTasks(t);
    setAssessments(a);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(loadData);
    return () => unsubscribe();
  }, []);

  // List of available class names
  const availableClassNames = useMemo(() => {
    const fromClasses = classes.map((c) => c.nama.trim());
    const fromStudents = students.map((s) => s.kelas?.trim() || '').filter(Boolean);
    const set = new Set([...fromClasses, ...fromStudents]);
    return Array.from(set).sort();
  }, [classes, students]);

  // Active tasks (either all or filtered by selectedClass)
  const activeTasksAll = useMemo(() => tasks.filter((t) => t.status === 'aktif'), [tasks]);
  const activeTasksFiltered = useMemo(() => {
    if (selectedClass === 'Semua') return activeTasksAll;
    return activeTasksAll.filter((t) => isTaskAssignedToClass(t, selectedClass));
  }, [activeTasksAll, selectedClass]);

  // Relevant students for selectedClass
  const targetStudents = useMemo(() => {
    const activeMurid = students.filter((s) => s.status === 'aktif');
    if (selectedClass === 'Semua') return activeMurid;
    return activeMurid.filter(
      (s) => s.kelas?.trim().toLowerCase() === selectedClass.trim().toLowerCase()
    );
  }, [students, selectedClass]);

  // Relevant assessments for selectedClass
  const relevantAssessments = useMemo(() => {
    if (selectedClass === 'Semua') return assessments;
    return assessments.filter(
      (a) =>
        a.targetClass?.trim().toLowerCase() === selectedClass.trim().toLowerCase() ||
        a.assessorClass?.trim().toLowerCase() === selectedClass.trim().toLowerCase()
    );
  }, [assessments, selectedClass]);

  // Class average calculations
  const classAvg4 = useMemo(() => {
    if (relevantAssessments.length === 0) return '0.00';
    const sum = relevantAssessments.reduce((acc, curr) => acc + (curr.averageScore || 0), 0);
    return (sum / relevantAssessments.length).toFixed(2);
  }, [relevantAssessments]);

  const classAvg100 = useMemo(() => {
    if (relevantAssessments.length === 0) return 0;
    const sum = relevantAssessments.reduce((acc, curr) => acc + (curr.finalScore100 || 0), 0);
    return Math.round(sum / relevantAssessments.length);
  }, [relevantAssessments]);

  // Predicate label
  const predicate = useMemo(() => {
    const avgNum = Number(classAvg4);
    if (classAvg100 >= 88 || avgNum >= 3.5) {
      return {
        label: 'Sangat Baik',
        grade: 'A',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
      };
    }
    if (classAvg100 >= 75 || avgNum >= 3.0) {
      return {
        label: 'Baik',
        grade: 'B',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
      };
    }
    if (classAvg100 >= 60 || avgNum >= 2.5) {
      return {
        label: 'Cukup',
        grade: 'C',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
      };
    }
    return {
      label: 'Perlu Bimbingan',
      grade: 'D',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
    };
  }, [classAvg100, classAvg4]);

  // Compute pending evaluators list
  const pendingStudentItems = useMemo(() => {
    const list: PendingStudentItem[] = [];

    activeTasksFiltered.forEach((task) => {
      // Find students in this task's assigned class
      const enrolled = students.filter(
        (s) =>
          s.status === 'aktif' &&
          isTaskAssignedToClass(task, s.kelas) &&
          (selectedClass === 'Semua' ||
            s.kelas?.trim().toLowerCase() === selectedClass.trim().toLowerCase())
      );

      const required = task.jumlahTemanDinilai || 1;

      enrolled.forEach((student) => {
        // Count submitted assessments by this student for this task
        const submitted = assessments.filter(
          (a) =>
            a.taskId === task.id &&
            ((a.assessorId && a.assessorId === student.uid) ||
              (a.assessorUserId && a.assessorUserId === student.uid) ||
              (student.nis && (a as any).assessorNis === student.nis) ||
              (a.assessorName &&
                a.assessorName.trim().toLowerCase() === student.nama.trim().toLowerCase()))
        ).length;

        if (submitted < required) {
          list.push({
            student,
            task,
            completedCount: submitted,
            requiredCount: required,
            status: submitted === 0 ? 'belum' : 'sebagian'
          });
        }
      });
    });

    return list;
  }, [activeTasksFiltered, students, selectedClass, assessments]);

  // Unique pending students count
  const uniquePendingStudentIds = useMemo(() => {
    return new Set(pendingStudentItems.map((p) => p.student.uid));
  }, [pendingStudentItems]);

  const pendingStudentsCount = uniquePendingStudentIds.size;
  const belumSamaSekaliCount = pendingStudentItems.filter((p) => p.status === 'belum').length;
  const sebagianCount = pendingStudentItems.filter((p) => p.status === 'sebagian').length;

  // Total students expected to assess across active tasks
  const totalExpectedStudents = useMemo(() => {
    return new Set(
      students
        .filter(
          (s) =>
            s.status === 'aktif' &&
            activeTasksFiltered.some((t) => isTaskAssignedToClass(t, s.kelas)) &&
            (selectedClass === 'Semua' ||
              s.kelas?.trim().toLowerCase() === selectedClass.trim().toLowerCase())
        )
        .map((s) => s.uid)
    ).size;
  }, [students, activeTasksFiltered, selectedClass]);

  const completedStudentsCount = Math.max(0, totalExpectedStudents - pendingStudentsCount);
  const completionPercentage =
    totalExpectedStudents > 0
      ? Math.round((completedStudentsCount / totalExpectedStudents) * 100)
      : 100;

  // Filtered pending list for Modal display
  const displayPendingList = useMemo(() => {
    return pendingStudentItems.filter((item) => {
      // Filter by task
      if (selectedTaskModalFilter !== 'Semua' && item.task.id !== selectedTaskModalFilter) {
        return false;
      }
      // Filter by status tab
      if (pendingFilterTab === 'belum' && item.status !== 'belum') return false;
      if (pendingFilterTab === 'sebagian' && item.status !== 'sebagian') return false;
      // Filter by search name or NIS
      if (searchPending.trim()) {
        const query = searchPending.toLowerCase();
        const matchName = item.student.nama.toLowerCase().includes(query);
        const matchNis = item.student.nis?.toLowerCase().includes(query);
        const matchAbsen = item.student.nomorAbsen?.toLowerCase().includes(query);
        if (!matchName && !matchNis && !matchAbsen) return false;
      }
      return true;
    });
  }, [pendingStudentItems, selectedTaskModalFilter, pendingFilterTab, searchPending]);

  // Copy WhatsApp Reminder Message
  const handleCopyReminder = () => {
    if (displayPendingList.length === 0) {
      showToast('Tidak ada siswa yang belum menilai untuk filter ini!');
      return;
    }

    const classLabel = selectedClass === 'Semua' ? 'Seluruh Kelas' : `Kelas ${selectedClass}`;
    const nowStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let text = `📢 *PENGINGAT PENILAIAN ANTAR TEMAN (PJOK)*\n`;
    text += `📅 ${nowStr}\n`;
    text += `🏫 ${classLabel}\n\n`;
    text += `Halo anak-anak, berikut daftar siswa yang *BELUM MENYELESAIKAN* penilaian antar teman untuk tugas aktif:\n\n`;

    displayPendingList.forEach((item, idx) => {
      const statusText =
        item.completedCount === 0
          ? `Belum menilai (0/${item.requiredCount})`
          : `Baru menilai ${item.completedCount}/${item.requiredCount}`;
      const absenStr = item.student.nomorAbsen ? `No. ${item.student.nomorAbsen}, ` : '';
      text += `${idx + 1}. *${item.student.nama}* (${absenStr}NIS: ${item.student.nis || '-'}, Kelas: ${item.student.kelas || '-'}) - ${statusText} [Tugas: ${item.task.nama}]\n`;
    });

    text += `\n⚠️ *Mohon segera login ke aplikasi dan selesaikan penilaian sebelum batas waktu berakhir.* Terima kasih! Semangat berolahraga! 🏃‍♂️💪`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedReminder(true);
          showToast('Teks pengingat WhatsApp berhasil disalin ke clipboard!');
          setTimeout(() => setCopiedReminder(false), 3000);
        })
        .catch(() => {
          showToast('Gagal menyalin otomatis. Silakan salin manual.');
        });
    } else {
      showToast('Fitur salin otomatis tidak didukung di peramban ini.');
    }
  };

  // Per-class statistics comparison
  const perClassStats = useMemo(() => {
    return classes.map((c) => {
      const classMurid = students.filter(
        (s) =>
          s.role === 'murid' &&
          s.kelas?.trim().toLowerCase() === c.nama.trim().toLowerCase() &&
          s.status === 'aktif'
      );
      const classTasks = tasks.filter(
        (t) => t.status === 'aktif' && isTaskAssignedToClass(t, c.nama)
      );
      const classAssessments = assessments.filter(
        (a) =>
          a.targetClass?.trim().toLowerCase() === c.nama.trim().toLowerCase() ||
          a.assessorClass?.trim().toLowerCase() === c.nama.trim().toLowerCase()
      );

      const avg100 =
        classAssessments.length > 0
          ? Math.round(
              classAssessments.reduce((sum, item) => sum + (item.finalScore100 || 0), 0) /
                classAssessments.length
            )
          : 0;

      const avg4 =
        classAssessments.length > 0
          ? (
              classAssessments.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
              classAssessments.length
            ).toFixed(2)
          : '0.00';

      // count pending students in this class
      let classPendingCount = 0;
      classTasks.forEach((t) => {
        const req = t.jumlahTemanDinilai || 1;
        classMurid.forEach((m) => {
          const done = assessments.filter(
            (a) =>
              a.taskId === t.id &&
              ((a.assessorId && a.assessorId === m.uid) ||
                (a.assessorUserId && a.assessorUserId === m.uid) ||
                (m.nis && (a as any).assessorNis === m.nis) ||
                (a.assessorName && a.assessorName.trim().toLowerCase() === m.nama.trim().toLowerCase()))
          ).length;
          if (done < req) {
            classPendingCount++;
          }
        });
      });

      return {
        kelasNama: c.nama,
        tingkat: c.tingkat,
        totalMurid: classMurid.length,
        activeTasksCount: classTasks.length,
        avg100,
        avg4,
        totalPenilaian: classAssessments.length,
        pendingMuridCount: classPendingCount
      };
    });
  }, [classes, students, tasks, assessments]);

  // Overall statistics for standard cards
  const activeStudentsCount = students.filter((s) => s.status === 'aktif').length;
  const classesCount = classes.length;
  const activeTasksCount = activeTasksAll.length;
  const totalSubmissions = assessments.length;

  const expectedSubmissions = tasks.reduce((sum, task) => {
    const classStudents = students.filter(
      (s) => s.kelas?.toLowerCase() === task.kelas.toLowerCase() && s.status === 'aktif'
    ).length;
    return sum + classStudents * (task.jumlahTemanDinilai || 1);
  }, 0);

  const pendingAssessmentsCount = Math.max(0, expectedSubmissions - totalSubmissions);

  const overallAvg =
    assessments.length > 0
      ? (
          assessments.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
          assessments.length
        ).toFixed(2)
      : '0.00';

  const overall100 =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, item) => sum + (item.finalScore100 || 0), 0) /
            assessments.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Firebase Auth & Firestore Status / Mode Mandiri Bebas Kuota */}
      {isFirebaseConfigured() ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                  Terhubung Firebase Cloud
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-300 dark:border-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Firestore & Auth Aktif
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Basis data cloud terpusat: Akun Guru, Murid, Kelas, Tugas & Penilaian tersinkronisasi aman multi-perangkat (Laptop & HP).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Akun Guru Terverifikasi Cloud
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white dark:from-blue-950/40 dark:via-sky-950/20 dark:to-slate-900 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-blue-950 dark:text-blue-200">
                  Mode Mandiri (Bebas Kuota 100%)
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-blue-800 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full text-[10px] border border-blue-300 dark:border-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Bebas Kuota Aktif
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Firebase dinonaktifkan sementara. Anda dapat merombak desain, kelas, dan tugas dengan leluasa tanpa batasan kuota cloud.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Penyimpanan Lokal Aktif
            </span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-700/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-blue-100 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard Penilaian Formatif PJOK</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Selamat Datang, Bapak/Ibu Guru
          </h2>
          <p className="mt-1 text-sm sm:text-base text-blue-50 max-w-2xl">
            Pantau aktivitas penilaian antar teman (peer assessment), kelola indikator gerak jasmani, dan evaluasi capaian belajar siswa secara real-time.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('learning-tasks')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 text-white text-xs sm:text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
            >
              <FileText className="w-4 h-4" />
              <span>Tugas Pembelajaran</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 text-xs sm:text-sm font-bold shadow-md hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Buat Tugas Penilaian</span>
            </button>
            <button
              onClick={() => onNavigate('recap')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 text-white text-xs sm:text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Lihat Rekap Nilai</span>
            </button>
          </div>
        </div>

        {/* Decorative background blob */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* RINGKASAN STATISTIK CEPAT (Quick Stats Summary Section)       */}
      {/* ============================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        {/* Section Header with Class Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                  Ringkasan Statistik Cepat
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  Real-time
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pantau progres tugas aktif, ketuntasan penilaian siswa, dan capaian rata-rata nilai kelas.
              </p>
            </div>
          </div>

          {/* Interactive Class Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            <button
              onClick={() => setSelectedClass('Semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedClass === 'Semua'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua Kelas
            </button>
            {availableClassNames.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Core Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Jumlah Tugas Aktif */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Jumlah Tugas Aktif
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {selectedClass === 'Semua' ? 'Seluruh Kelas' : `Kelas ${selectedClass}`}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  {activeTasksFiltered.length}
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Tugas Berjalan
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {activeTasksFiltered.length === 0
                  ? 'Belum ada tugas penilaian yang berstatus aktif.'
                  : `${activeTasksFiltered.length} dari ${tasks.length} total tugas sedang dibuka untuk diisi murid.`}
              </p>

              {/* Active Tasks Snippet */}
              {activeTasksFiltered.length > 0 && (
                <div className="mt-3.5 space-y-1.5 border-t border-emerald-100 dark:border-emerald-900/40 pt-3">
                  {activeTasksFiltered.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                    >
                      <span className="font-semibold truncate max-w-[170px] sm:max-w-[200px]" title={t.nama}>
                        {t.nama}
                      </span>
                      <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {t.kelas}
                      </span>
                    </div>
                  ))}
                  {activeTasksFiltered.length > 2 && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold text-center">
                      +{activeTasksFiltered.length - 2} tugas aktif lainnya
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                <span>Kelola Semua Tugas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
                title="Buat Tugas Baru"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Jumlah Siswa yang Belum Menilai */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-amber-950/10 border border-rose-200/80 dark:border-rose-900/50 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <Clock className="w-3.5 h-3.5" />
                  Siswa Belum Menilai
                </span>
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                  {totalExpectedStudents} Siswa Terdaftar
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 font-heading tracking-tight">
                  {pendingStudentsCount}
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Siswa Tertunda
                </span>
              </div>

              {/* Status details */}
              <div className="mt-2.5 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {belumSamaSekaliCount} Belum Mulai
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {sebagianCount} Sebagian
                </span>
              </div>

              {/* Progress Bar of Completion */}
              <div className="mt-3.5 space-y-1.5 border-t border-rose-100 dark:border-rose-900/40 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Ketuntasan Penilaian
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {completionPercentage}% Selesai
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-900/40">
              <button
                onClick={() => setIsPendingModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 hover:bg-rose-200/80 dark:hover:bg-rose-900/60 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Lihat Nama Siswa & Salin WA</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Rata-Rata Nilai Kelas */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/10 border border-blue-200/80 dark:border-blue-900/50 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Award className="w-3.5 h-3.5" />
                  Rata-Rata Nilai Kelas
                </span>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  {relevantAssessments.length} Penilaian
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-400 font-heading tracking-tight">
                  {classAvg100}
                </span>
                <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">
                  / 100
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300 ml-1">
                  (Skala 4: {classAvg4})
                </span>
              </div>

              {/* Predicate Badge */}
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${predicate.badgeClass}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Predikat: {predicate.label} ({predicate.grade})
                </span>
              </div>

              <div className="mt-3.5 space-y-1 border-t border-blue-100 dark:border-blue-900/40 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Data Masuk:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {relevantAssessments.length} ulasan siswa
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Siswa Terlibat:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {targetStudents.length} siswa aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <button
                onClick={() => onNavigate('recap')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:underline cursor-pointer"
              >
                <span>Buka Rekap Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 cursor-pointer"
              >
                Analisis Indikator
              </button>
            </div>
          </div>
        </div>

        {/* Per-Class Quick Comparison Grid (Visible if more than 1 class registered) */}
        {classes.length > 0 && selectedClass === 'Semua' && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Perbandingan Rata-Rata Nilai Antar Rombel Kelas
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                Klik kartu kelas untuk melihat detailnya
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {perClassStats.map((item) => (
                <button
                  key={item.kelasNama}
                  onClick={() => setSelectedClass(item.kelasNama)}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Kelas {item.kelasNama}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      {item.totalMurid} siswa
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-heading">
                      {item.avg100}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">/ 100</span>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Skor 4: {item.avg4}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className={item.pendingMuridCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                      {item.pendingMuridCount > 0 ? `${item.pendingMuridCount} belum nilai` : '100% tuntas'}
                    </span>
                    <span className="text-slate-400">
                      {item.totalPenilaian} nilai
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 5 Core Statistics Cards (Section 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Jumlah Murid */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Murid
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading">
              {activeStudentsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Siswa Aktif</span>
          </div>
        </div>

        {/* Card 2: Jumlah Kelas */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Kelas
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading">
              {classesCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Rombel</span>
          </div>
        </div>

        {/* Card 3: Jumlah Tugas */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tugas Penilaian
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading">
              {activeTasksCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Aktif</span>
          </div>
        </div>

        {/* Card 4: Penilaian Masuk */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Penilaian Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading">
              {totalSubmissions}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Terkumpul</span>
          </div>
        </div>

        {/* Card 5: Belum Selesai */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimasi Antrian
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-heading">
              {pendingAssessmentsCount}
            </span>
            <span className="text-xs font-semibold text-rose-500">Ulasan</span>
          </div>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rata-Rata Capaian Skor Keseluruhan */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading">
                Rata-Rata Capaian Keseluruhan
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Skala 4 & 100
              </span>
            </div>

            <div className="flex items-center gap-6 my-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-600/20">
                <span className="text-3xl font-black font-heading leading-none">
                  {overallAvg}
                </span>
                <span className="text-[11px] font-semibold opacity-90 mt-1">
                  Skala 4.00
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    Konversi Skala 100
                  </span>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{overall100} / 100</p>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {Number(overallAvg) >= 3.5
                    ? 'Predikat: Sangat Baik (A)'
                    : Number(overallAvg) >= 3.0
                    ? 'Predikat: Baik (B)'
                    : Number(overallAvg) >= 2.5
                    ? 'Predikat: Cukup (C)'
                    : 'Predikat: Perlu Bimbingan (D)'}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('analytics')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors mt-2 cursor-pointer"
          >
            <span>Buka Analisis Indikator Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tugas Penilaian Aktif Terkini */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading">
                Tugas Penilaian Aktif
              </h3>
              <p className="text-xs text-slate-400">
                Tugas yang sedang dikerjakan oleh siswa di kelas
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Semua Tugas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 2).map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300">
                      Kelas {t.kelas}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.materi}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.nama}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Batas: {t.batasWaktu}
                    </span>
                    <span>•</span>
                    <span>{t.indikatorIds.length} Indikator Gerak</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('results')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs shrink-0 cursor-pointer"
                >
                  Lihat Hasil Masuk
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assessment Feed */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-heading">
              Penilaian Antar Teman Terbaru
            </h3>
            <p className="text-xs text-slate-400">
              Umpan balik dan skor yang baru saja dikirim oleh siswa
            </p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua ({assessments.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Belum ada penilaian yang masuk. Siswa dapat login untuk mulai menilai.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assessments.slice(0, 5).map((asm) => (
              <div
                key={asm.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{asm.assessorName}</span>{' '}
                      menilai{' '}
                      <span className="font-bold text-blue-700 dark:text-blue-400">{asm.targetName}</span>{' '}
                      ({asm.assessorClass})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-0.5">
                      &ldquo;{asm.feedback}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Skor: {asm.averageScore} / 4
                    </div>
                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Nilai: {asm.finalScore100}
                    </div>
                  </div>
                  {onOpenAssessmentDetail && (
                    <button
                      onClick={() => onOpenAssessmentDetail(asm)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: DAFTAR SISWA BELUM MENILAI                             */}
      {/* ============================================================== */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                    Daftar Siswa Belum Selesai Menilai
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filter: {selectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${selectedClass}`} •{' '}
                    <span className="font-bold text-rose-600">{pendingStudentItems.length} tagihan penilaian</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPendingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa, NIS, atau nomor absen..."
                    value={searchPending}
                    onChange={(e) => setSearchPending(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  {searchPending && (
                    <button
                      onClick={() => setSearchPending('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Status Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    onClick={() => setPendingFilterTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      pendingFilterTab === 'all'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({pendingStudentItems.length})
                  </button>
                  <button
                    onClick={() => setPendingFilterTab('belum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      pendingFilterTab === 'belum'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Belum Sama Sekali ({belumSamaSekaliCount})
                  </button>
                  <button
                    onClick={() => setPendingFilterTab('sebagian')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      pendingFilterTab === 'sebagian'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Sebagian ({sebagianCount})
                  </button>
                </div>
              </div>

              {/* Task Selector Filter (if multiple active tasks exist) */}
              {activeTasksFiltered.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">Tugas:</span>
                  <button
                    onClick={() => setSelectedTaskModalFilter('Semua')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedTaskModalFilter === 'Semua'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Semua Tugas Aktif
                  </button>
                  {activeTasksFiltered.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTaskModalFilter(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors truncate max-w-[200px] cursor-pointer ${
                        selectedTaskModalFilter === t.id
                          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={t.nama}
                    >
                      {t.nama}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Body / Table of Pending Students */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2">
              {displayPendingList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Semua Murid Telah Menilai!
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Tidak ditemukan siswa yang belum menyelesaikan penilaian sesuai kriteria filter yang Anda pilih.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {displayPendingList.map((item, idx) => (
                    <div
                      key={`${item.student.uid}-${item.task.id}`}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.student.nomorAbsen || idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              {item.student.nama}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Kelas {item.student.kelas || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span>NIS: {item.student.nis || '-'}</span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">
                              Tugas: {item.task.nama}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.status === 'belum'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {item.status === 'belum' ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Belum Menilai (0/{item.requiredCount})
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                Menilai {item.completedCount}/{item.requiredCount} Teman
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer / WhatsApp Reminder Action */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Menampilkan <b>{displayPendingList.length}</b> siswa yang belum menyelesaikan penilaian.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCopyReminder}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  {copiedReminder ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Format Pengingat WA</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsPendingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
