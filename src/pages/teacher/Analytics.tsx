import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { IndicatorItem, AssessmentRecord, UserProfile, ClassItem, AssessmentTask } from '../../types';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  School,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);

  const loadData = async () => {
    const [ind, a, u, c, t] = await Promise.all([
      DatabaseService.getIndicators(),
      DatabaseService.getAssessments(),
      DatabaseService.getUsers(),
      DatabaseService.getClasses(),
      DatabaseService.getTasks()
    ]);
    setIndicators(ind);
    setAssessments(a);
    setStudents(u.filter((x) => x.role === 'murid' && x.status === 'aktif'));
    setClasses(c);
    setTasks(t);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  // 1. Calculate indicator stats
  const indicatorStats = indicators.map((ind) => {
    let totalScore = 0;
    let count = 0;
    let scoreCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

    assessments.forEach((record) => {
      const match = record.scores.find((s) => s.indicatorId === ind.id);
      if (match && match.score) {
        totalScore += match.score;
        count++;
        if (match.score in scoreCounts) {
          scoreCounts[match.score as 1 | 2 | 3 | 4]++;
        }
      }
    });

    const average = count > 0 ? Number((totalScore / count).toFixed(2)) : 0;
    const lowScorePercentage = count > 0 ? Math.round(((scoreCounts[1] + scoreCounts[2]) / count) * 100) : 0;
    const masteryPercentage = count > 0 ? Math.round(((scoreCounts[3] + scoreCounts[4]) / count) * 100) : 0;

    return {
      indicator: ind,
      average,
      count,
      lowScorePercentage,
      masteryPercentage,
      scoreCounts
    };
  });

  // Sort: Lowest score (needs remedial) & Highest score (mastered)
  const lowestScoringIndicators = [...indicatorStats]
    .filter((x) => x.count > 0)
    .sort((a, b) => a.average - b.average);

  const highestScoringIndicators = [...indicatorStats]
    .filter((x) => x.count > 0)
    .sort((a, b) => b.average - a.average);

  // 2. Class averages
  const classAverages = classes.map((c) => {
    const classAssessments = assessments.filter((a) => a.assessorClass === c.nama);
    const avg =
      classAssessments.length > 0
        ? Number(
            (
              classAssessments.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
              classAssessments.length
            ).toFixed(2)
          )
        : 0;

    const final100 = avg > 0 ? Math.round((avg / 4) * 100) : 0;

    return {
      className: c.nama,
      averageScore: avg,
      final100,
      totalAssessments: classAssessments.length
    };
  });

  // 3. Students not yet evaluated (Murid yang belum dinilai)
  const studentsNotEvaluated = students.filter((s) => {
    const hasBeenEvaluated = assessments.some(
      (a) => a.targetUserId === s.uid || a.targetName.toLowerCase() === s.nama.toLowerCase()
    );
    return !hasBeenEvaluated;
  });

  // 4. Students who haven't evaluated others yet (Murid yang belum menilai teman)
  const studentsNotAssessedOthers = students.filter((s) => {
    const hasAssessed = assessments.some(
      (a) => a.assessorUserId === s.uid || a.assessorName.toLowerCase() === s.nama.toLowerCase()
    );
    return !hasAssessed;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
          Analisis Capaian Pembelajaran PJOK
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Analisis diagnostik untuk mengidentifikasi materi yang membutuhkan remedial, penguatan, atau tindak lanjut
        </p>
      </div>

      {/* Top Recommendations / Remedial Insight Card */}
      {lowestScoringIndicators.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-amber-950 font-heading">
              Rekomendasi Tindak Lanjut Guru (Perlu Remedial / Drill Gerak)
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Berdasarkan hasil asesmen antar teman, indikator{' '}
              <strong className="underline decoration-amber-400">
                &ldquo;{lowestScoringIndicators[0].indicator.indikator}&rdquo;
              </strong>{' '}
              memperoleh rata-rata terendah ({lowestScoringIndicators[0].average} / 4.00) dengan{' '}
              {lowestScoringIndicators[0].lowScorePercentage}% siswa masih dalam kategori Perlu Bimbingan / Mulai Berkembang.
              Disarankan melakukan latihan penguatan pada fase gerak tersebut di pertemuan berikutnya.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Lowest vs Mastered Indicators (Section 23 #1 & #2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Indikator Skor Rendah (Perlu Bimbingan) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-heading">
                Indikator Skor Terendah (Perlu Remedial)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Prioritas Evaluasi
            </span>
          </div>

          <div className="space-y-4">
            {lowestScoringIndicators.slice(0, 3).map((item) => (
              <div key={item.indicator.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 line-clamp-1 max-w-[240px]">
                    {item.indicator.indikator}
                  </span>
                  <span className="font-extrabold text-rose-700 font-heading">
                    {item.average} / 4.00
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.average / 4) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.lowScorePercentage}% siswa perlu bimbingan</span>
                  <span>{item.count} total penilaian</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Indikator Yang Dikuasai Mayoritas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-heading">
                Indikator Dikuasai Mayoritas Murid
              </h3>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Sangat Baik
            </span>
          </div>

          <div className="space-y-4">
            {highestScoringIndicators.slice(0, 3).map((item) => (
              <div key={item.indicator.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 line-clamp-1 max-w-[240px]">
                    {item.indicator.indikator}
                  </span>
                  <span className="font-extrabold text-blue-700 font-heading">
                    {item.average} / 4.00
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.average / 4) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.masteryPercentage}% siswa telah menguasai</span>
                  <span>{item.count} total penilaian</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Grafik Rata-Rata Per Kelas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-heading">
                Perbandingan Rata-Rata Capaian Per Rombel (Kelas)
              </h3>
              <p className="text-xs text-slate-400">
                Membandingkan nilai akhir rata-rata kelas pada skala 100
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {classAverages.map((cls) => (
            <div key={cls.className} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Kelas {cls.className}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">{cls.totalAssessments} Penilaian</span>
                  <span className="font-extrabold text-indigo-700 font-heading text-sm">
                    {cls.final100} / 100 ({cls.averageScore} / 4.0)
                  </span>
                </div>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(8, cls.final100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 & 5: Murid Belum Dinilai & Belum Menilai (Section 23 #4 & #5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Belum Dinilai */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-sm font-heading">
                Murid yang Belum Dinilai Teman
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
              {studentsNotEvaluated.length} Siswa
            </span>
          </div>

          {studentsNotEvaluated.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Semua siswa aktif sudah dinilai oleh teman sebayanya!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {studentsNotEvaluated.map((s) => (
                <div key={s.uid} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{s.nama}</p>
                    <p className="text-[11px] text-slate-400">
                      Kelas: {s.kelas} | Absen: {s.nomorAbsen || '-'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-semibold text-[10px]">
                    Belum Dinilai
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Belum Menilai Teman */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm font-heading">
                Murid yang Belum Menilai Teman
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {studentsNotAssessedOthers.length} Siswa
            </span>
          </div>

          {studentsNotAssessedOthers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Semua siswa aktif sudah menuntaskan kewajiban menilai teman!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {studentsNotAssessedOthers.map((s) => (
                <div key={s.uid} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{s.nama}</p>
                    <p className="text-[11px] text-slate-400">
                      Kelas: {s.kelas} | Absen: {s.nomorAbsen || '-'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-semibold text-[10px]">
                    Belum Mengirim
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
