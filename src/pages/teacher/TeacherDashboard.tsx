import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { UserProfile, ClassItem, AssessmentTask, AssessmentRecord } from '../../types';
import { TeacherMenu } from '../../components/Sidebar';
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
  ShieldCheck
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (menu: TeacherMenu) => void;
  onOpenAssessmentDetail?: (record: AssessmentRecord) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigate,
  onOpenAssessmentDetail
}) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);

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

  // Calculate stats
  const activeStudentsCount = students.filter((s) => s.status === 'aktif').length;
  const classesCount = classes.length;
  const activeTasksCount = tasks.filter((t) => t.status === 'aktif').length;
  const totalSubmissions = assessments.length;

  // Expected assessments: total students in task class * required evaluations per student
  const expectedSubmissions = tasks.reduce((sum, task) => {
    const classStudents = students.filter(
      (s) => s.kelas?.toLowerCase() === task.kelas.toLowerCase() && s.status === 'aktif'
    ).length;
    return sum + classStudents * (task.jumlahTemanDinilai || 1);
  }, 0);

  const pendingAssessmentsCount = Math.max(0, expectedSubmissions - totalSubmissions);

  // Calculate overall average score
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
      {/* Firebase Auth & Firestore Status (Tampil di Akun Guru) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Firebase Auth & Firestore</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                koleksi: &apos;pengguna&apos;
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sinkronisasi basis data cloud aktif untuk akun Guru PJOK & penilaian formatif antar teman
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Akun Guru Terverifikasi
          </span>
        </div>
      </div>

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

      {/* 5 Core Statistics Cards (Section 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Jumlah Murid */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Murid
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading">
              {activeStudentsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Siswa Aktif</span>
          </div>
        </div>

        {/* Card 2: Jumlah Kelas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Kelas
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading">
              {classesCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Rombel</span>
          </div>
        </div>

        {/* Card 3: Jumlah Tugas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tugas Penilaian
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading">
              {activeTasksCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Aktif</span>
          </div>
        </div>

        {/* Card 4: Penilaian Masuk */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Penilaian Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading">
              {totalSubmissions}
            </span>
            <span className="text-xs font-semibold text-blue-600">Terkumpul</span>
          </div>
        </div>

        {/* Card 5: Belum Selesai */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Belum Selesai
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 font-heading">
              {pendingAssessmentsCount}
            </span>
            <span className="text-xs font-semibold text-rose-500">Estimasi</span>
          </div>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rata-Rata Capaian Skor Kelas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm font-heading">
                Rata-Rata Capaian Penilaian
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
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
                  <p className="text-2xl font-black text-slate-800">{overall100} / 100</p>
                </div>
                <div className="text-xs text-slate-500">
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors mt-2 cursor-pointer"
          >
            <span>Buka Analisis Indikator Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tugas Penilaian Aktif Terkini */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm font-heading">
                Tugas Penilaian Aktif
              </h3>
              <p className="text-xs text-slate-400">
                Tugas yang sedang dikerjakan oleh siswa di kelas
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Semua Tugas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 2).map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900">
                      Kelas {t.kelas}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{t.materi}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t.nama}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs shrink-0 cursor-pointer"
                >
                  Lihat Hasil Masuk
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assessment Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base font-heading">
              Penilaian Antar Teman Terbaru
            </h3>
            <p className="text-xs text-slate-400">
              Umpan balik dan skor yang baru saja dikirim oleh siswa
            </p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua ({assessments.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Belum ada penilaian yang masuk. Siswa dapat login untuk mulai menilai.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.slice(0, 5).map((asm) => (
              <div
                key={asm.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      <span className="font-bold text-slate-800">{asm.assessorName}</span>{' '}
                      menilai{' '}
                      <span className="font-bold text-blue-700">{asm.targetName}</span>{' '}
                      ({asm.assessorClass})
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-1 italic mt-0.5">
                      &ldquo;{asm.feedback}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      Skor: {asm.averageScore} / 4
                    </div>
                    <div className="text-[11px] font-semibold text-blue-600">
                      Nilai: {asm.finalScore100}
                    </div>
                  </div>
                  {onOpenAssessmentDetail && (
                    <button
                      onClick={() => onOpenAssessmentDetail(asm)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
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
    </div>
  );
};
