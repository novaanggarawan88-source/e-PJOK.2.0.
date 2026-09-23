import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { UserProfile, AssessmentTask, AssessmentRecord, ClassItem } from '../../types';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Search,
  CheckCircle,
  Eye,
  Award,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface StudentRecapRow {
  student: UserProfile;
  assessorCount: number;
  averageScore4: number;
  finalScore100: number;
  predicate: string;
  gradeLetter: string;
  status: 'Lengkap' | 'Belum Lengkap' | 'Belum Dinilai';
  feedbacks: string[];
}

export type RecapSortKey =
  | 'nama'
  | 'nis'
  | 'kelas'
  | 'nomorAbsen'
  | 'assessorCount'
  | 'averageScore4'
  | 'finalScore100'
  | 'predicate'
  | 'status';

export const RecapScores: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedTaskId, setSelectedTaskId] = useState('Semua');
  const [searchName, setSearchName] = useState('');

  // Sorting
  const [sortKey, setSortKey] = useState<RecapSortKey>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: RecapSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      if (key === 'averageScore4' || key === 'finalScore100' || key === 'assessorCount') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
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
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  // Compute Recap Data per student
  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const targetAssessorCount = activeTask?.jumlahTemanDinilai || 2;

  const recapData: StudentRecapRow[] = students
    .filter((s) => {
      const matchClass = selectedClass === 'Semua' || s.kelas === selectedClass;
      const matchName = !searchName || s.nama.toLowerCase().includes(searchName.toLowerCase());
      return matchClass && matchName;
    })
    .map((s) => {
      // Find all assessments where this student was evaluated (targetUserId === s.uid or targetName === s.nama)
      const received = assessments.filter((a) => {
        const isThisStudent = a.targetUserId === s.uid || a.targetName.toLowerCase() === s.nama.toLowerCase();
        const isThisTask = selectedTaskId === 'Semua' || a.taskId === selectedTaskId;
        return isThisStudent && isThisTask;
      });

      const assessorCount = received.length;

      let averageScore4 = 0;
      let finalScore100 = 0;
      let predicate = 'Belum Ada Nilai';
      let gradeLetter = '-';

      if (assessorCount > 0) {
        const sumScores = received.reduce((acc, curr) => acc + (curr.averageScore || 0), 0);
        averageScore4 = Number((sumScores / assessorCount).toFixed(2));
        finalScore100 = Math.round((averageScore4 / 4) * 100);

        // Predicate formula (Section 22)
        if (averageScore4 >= 3.5) {
          predicate = 'Sangat Baik';
          gradeLetter = 'A';
        } else if (averageScore4 >= 3.0) {
          predicate = 'Baik';
          gradeLetter = 'B';
        } else if (averageScore4 >= 2.5) {
          predicate = 'Cukup';
          gradeLetter = 'C';
        } else {
          predicate = 'Perlu Bimbingan';
          gradeLetter = 'D';
        }
      }

      let status: 'Lengkap' | 'Belum Lengkap' | 'Belum Dinilai' = 'Belum Dinilai';
      if (assessorCount >= targetAssessorCount) {
        status = 'Lengkap';
      } else if (assessorCount > 0) {
        status = 'Belum Lengkap';
      }

      return {
        student: s,
        assessorCount,
        averageScore4,
        finalScore100,
        predicate,
        gradeLetter,
        status,
        feedbacks: received.map((r) => r.feedback).filter(Boolean)
      };
    });

  const sortedRecapData = [...recapData].sort((a, b) => {
    let comparison = 0;
    if (sortKey === 'nama') {
      comparison = a.student.nama.localeCompare(b.student.nama, 'id', { sensitivity: 'base' });
    } else if (sortKey === 'nis') {
      comparison = (a.student.nis || '').localeCompare(b.student.nis || '', 'id', { numeric: true });
    } else if (sortKey === 'kelas') {
      comparison = (a.student.kelas || '').localeCompare(b.student.kelas || '', 'id', { numeric: true });
    } else if (sortKey === 'nomorAbsen') {
      const numA = parseInt(a.student.nomorAbsen || '0', 10);
      const numB = parseInt(b.student.nomorAbsen || '0', 10);
      comparison = numA - numB;
    } else if (sortKey === 'assessorCount') {
      comparison = a.assessorCount - b.assessorCount;
    } else if (sortKey === 'averageScore4') {
      comparison = a.averageScore4 - b.averageScore4;
    } else if (sortKey === 'finalScore100') {
      comparison = a.finalScore100 - b.finalScore100;
    } else if (sortKey === 'predicate') {
      comparison = a.predicate.localeCompare(b.predicate, 'id');
    } else if (sortKey === 'status') {
      comparison = a.status.localeCompare(b.status, 'id');
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'NO,NIS,NAMA MURID,KELAS,NO ABSEN,JUMLAH PENILAI,RATA-RATA SKOR (1-4),NILAI AKHIR (100),PREDIKAT,HURUF,STATUS\n';
    sortedRecapData.forEach((row, i) => {
      csv += `"${i + 1}","${row.student.nis || ''}","${row.student.nama}","${row.student.kelas || ''}","${row.student.nomorAbsen || ''}","${row.assessorCount}","${row.averageScore4}","${row.finalScore100}","${row.predicate}","${row.gradeLetter}","${row.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_PJOK_${selectedClass}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Printable Header - hidden on screen, visible when printing */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">REKAPITULASI PENILAIAN ANTAR TEMAN (PEER ASSESSMENT)</h1>
        <h2 className="text-base font-semibold">MATA PELAJARAN PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)</h2>
        <p className="text-xs">
          Kelas: {selectedClass} | Tugas: {activeTask ? activeTask.nama : 'Semua Tugas'} | Dicetak: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* Screen Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Rekap Nilai Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kompilasi nilai akhir peer assessment, konversi skala 100, dan predikat capaian belajar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Section 22) */}
      <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Kelas</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden focus:border-blue-500"
          >
            <option value="Semua">Semua Kelas ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nama}>
                Kelas {c.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Tugas Penilaian</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 truncate"
          >
            <option value="Semua">Semua Tugas ({tasks.length})</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama} ({t.kelas})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Cari Murid</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Ketik nama siswa..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Urutkan / Sort</label>
          <select
            value={`${sortKey}_${sortDirection}`}
            onChange={(e) => {
              const parts = e.target.value.split('_');
              const k = parts[0] as RecapSortKey;
              const d = parts[1] as 'asc' | 'desc';
              setSortKey(k);
              setSortDirection(d);
            }}
            className="w-full px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold focus:outline-hidden focus:border-blue-500"
          >
            <option value="nama_asc">Nama Murid (A - Z)</option>
            <option value="nama_desc">Nama Murid (Z - A)</option>
            <option value="finalScore100_desc">Nilai Akhir (Tertinggi)</option>
            <option value="finalScore100_asc">Nilai Akhir (Terendah)</option>
            <option value="averageScore4_desc">Skor 1-4 (Tertinggi)</option>
            <option value="averageScore4_asc">Skor 1-4 (Terendah)</option>
            <option value="kelas_asc">Kelas (A - Z)</option>
            <option value="nomorAbsen_asc">Nomor Absen (1 - 40)</option>
            <option value="nis_asc">NIS (Terkecil - Terbesar)</option>
            <option value="assessorCount_desc">Jumlah Penilai (Terbanyak)</option>
            <option value="status_asc">Status (Lengkap Dulu)</option>
          </select>
        </div>
      </div>

      {/* Predicate Reference Legend */}
      <div className="print:hidden bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">Kriteria Predikat:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <strong>3.50 – 4.00</strong> : Sangat Baik (A)
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <strong>3.00 – 3.49</strong> : Baik (B)
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <strong>2.50 – 2.99</strong> : Cukup (C)
          </span>
          <span className="inline-flex items-center gap-1 text-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <strong>&lt; 2.50</strong> : Perlu Bimbingan (D)
          </span>
        </div>
      </div>

      {/* Recap Table (Section 22) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none print:bg-gray-100 print:text-black">
                <th className="py-3.5 px-3 w-10 text-center">NO</th>

                {/* Kop NIS */}
                <th
                  onClick={() => handleSort('nis')}
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan NIS"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortKey === 'nis' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      NIS
                    </span>
                    {sortKey === 'nis' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Nama Murid */}
                <th
                  onClick={() => handleSort('nama')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan nama murid"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortKey === 'nama' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      NAMA MURID
                    </span>
                    {sortKey === 'nama' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Kelas */}
                <th
                  onClick={() => handleSort('kelas')}
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan kelas"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortKey === 'kelas' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      KELAS
                    </span>
                    {sortKey === 'kelas' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Penilai */}
                <th
                  onClick={() => handleSort('assessorCount')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan jumlah penilai"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={sortKey === 'assessorCount' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      PENILAI
                    </span>
                    {sortKey === 'assessorCount' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Skor 1-4 */}
                <th
                  onClick={() => handleSort('averageScore4')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan skor 1-4"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={sortKey === 'averageScore4' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      SKOR (1-4)
                    </span>
                    {sortKey === 'averageScore4' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Nilai 100 */}
                <th
                  onClick={() => handleSort('finalScore100')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan nilai akhir (100)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={sortKey === 'finalScore100' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      NILAI (100)
                    </span>
                    {sortKey === 'finalScore100' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Predikat */}
                <th
                  onClick={() => handleSort('predicate')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan predikat"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={sortKey === 'predicate' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      PREDIKAT
                    </span>
                    {sortKey === 'predicate' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>

                {/* Kop Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group print:cursor-default"
                  title="Klik untuk mengurutkan berdasarkan status"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={sortKey === 'status' ? 'text-blue-700 font-extrabold' : 'group-hover:text-slate-800'}>
                      STATUS
                    </span>
                    {sortKey === 'status' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 shrink-0 print:hidden" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm print:divide-black">
              {sortedRecapData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa untuk rekap ini.
                  </td>
                </tr>
              ) : (
                sortedRecapData.map((row, idx) => (
                  <tr key={row.student.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {row.student.nis || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.student.nama}
                      {row.student.nomorAbsen && (
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          (Absen {row.student.nomorAbsen})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        {row.student.kelas}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                      {row.assessorCount} Teman
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-extrabold text-slate-900 font-heading text-sm">
                        {row.assessorCount > 0 ? row.averageScore4.toFixed(2) : '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center font-black px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 text-xs font-heading">
                        {row.assessorCount > 0 ? row.finalScore100 : '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {row.assessorCount > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            row.gradeLetter === 'A'
                              ? 'bg-blue-100 text-blue-900'
                              : row.gradeLetter === 'B'
                              ? 'bg-indigo-50 text-indigo-800'
                              : row.gradeLetter === 'C'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          <strong>{row.gradeLetter}</strong> - {row.predicate}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          row.status === 'Lengkap'
                            ? 'bg-blue-100 text-blue-800'
                            : row.status === 'Belum Lengkap'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
