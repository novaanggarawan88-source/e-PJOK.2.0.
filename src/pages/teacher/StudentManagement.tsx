import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseService, subscribeToDataChanges, isDummyAccount } from '../../services/db';
import { UserProfile, ClassItem } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet,
  Download,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Info
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Form inputs
  const [nama, setNama] = useState('');
  const [nis, setNis] = useState('');
  const [kelas, setKelas] = useState('');
  const [nomorAbsen, setNomorAbsen] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  const loadData = async () => {
    await DatabaseService.purgeDummyAccounts();
    const [u, c] = await Promise.all([
      DatabaseService.getUsers(),
      DatabaseService.getClasses()
    ]);
    setStudents(u.filter((x) => x.role === 'murid' && !isDummyAccount(x)));
    setClasses(c);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setNama('');
    setNis('');
    setKelas(classes[0]?.nama || 'XI 1');
    setNomorAbsen('');
    setEmail('');
    setPassword('murid123');
    setStatus('aktif');
    setIsFormOpen(true);
  };

  const openEditModal = (student: UserProfile) => {
    setEditingStudent(student);
    setNama(student.nama);
    setNis(student.nis || '');
    setKelas(student.kelas || classes[0]?.nama || 'XI 1');
    setNomorAbsen(student.nomorAbsen || '');
    setEmail(student.email);
    setPassword(student.password || 'murid123');
    setStatus(student.status);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const studentToSave: UserProfile = {
      uid: editingStudent ? editingStudent.uid : `murid-${Date.now()}`,
      nama: nama.trim(),
      email: email.trim() || `${nama.toLowerCase().replace(/\s+/g, '')}@pjok.sch.id`,
      password: password.trim() || '123456',
      role: 'murid',
      kelas,
      nomorAbsen: nomorAbsen.trim(),
      nis: nis.trim(),
      status,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await DatabaseService.saveUser(studentToSave);
    setIsFormOpen(false);
    showNotice(editingStudent ? 'Data dan kredensial murid berhasil diperbarui' : 'Murid baru berhasil ditambahkan');
  };

  const handleDelete = async (uid: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data murid: ${name}?`)) {
      await DatabaseService.deleteUser(uid);
      setSelectedUids((prev) => prev.filter((id) => id !== uid));
      showNotice('Data murid berhasil dihapus');
    }
  };

  const toggleSelect = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAll = () => {
    if (filteredStudents.length === 0) return;
    const allFilteredSelected = filteredStudents.every((s) => selectedUids.includes(s.uid));
    if (allFilteredSelected) {
      const filteredUidSet = new Set(filteredStudents.map((s) => s.uid));
      setSelectedUids((prev) => prev.filter((id) => !filteredUidSet.has(id)));
    } else {
      const newSelected = new Set(selectedUids);
      filteredStudents.forEach((s) => newSelected.add(s.uid));
      setSelectedUids(Array.from(newSelected));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUids.length === 0) return;
    const count = selectedUids.length;
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus ${count} data murid yang dipilih? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      setIsDeletingBulk(true);
      await DatabaseService.deleteUsers(selectedUids);
      setSelectedUids([]);
      setIsDeletingBulk(false);
      showNotice(`${count} data murid berhasil dihapus sekaligus.`);
    }
  };

  const handleToggleStatus = async (student: UserProfile) => {
    const updatedStatus = student.status === 'aktif' ? 'nonaktif' : 'aktif';
    await DatabaseService.saveUser({ ...student, status: updatedStatus });
    showNotice(`Status murid diubah menjadi ${updatedStatus}`);
  };

  const togglePasswordVisibility = (uid: string) => {
    setShowPasswords((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  const CSV_TEMPLATE_CONTENT =
    'Nama, NIS, Kelas, No Absen, Username, Password\n' +
    'Gede Aditya Peratama, 7504, XI 1, 1, gedeadityaperatama, murid123\n' +
    'Gede Eric Surya Purnama, 7474, XI 1, 2, gedeericsuryapurnama, murid123\n' +
    'Gede Reynard Dharma Mahardika, 7440, XI 1, 3, gedereynarddharmamahardika, murid123\n' +
    'I Gede Mukiadi, 7478, XI 1, 4, igedemukiadi, murid123\n' +
    'I Komang Nova Andriana, 7612, XI 1, 5, ikomangnovaandriana, murid123\n';

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'format_data_murid_perkelas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Format CSV data murid berhasil diunduh');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE_CONTENT);
    showNotice('Format template CSV disalin ke clipboard');
  };

  const handleCopyHeaderOnly = () => {
    navigator.clipboard.writeText('Nama, NIS, Kelas, No Absen, Username, Password');
    showNotice('Header format disalin: Nama, NIS, Kelas, No Absen, Username, Password');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvText(text);
        showNotice('Berkas CSV berhasil dimuat');
      }
    };
    reader.readAsText(file);
  };

  // Hitung jumlah baris murid yang terdeteksi valid dari teks yang ditempel
  const detectedStudentsCount = useMemo(() => {
    if (!csvText.trim()) return 0;
    const lines = csvText.trim().split(/\r?\n/);
    let count = 0;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      let delimiter = ',';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';') && !line.includes(',')) delimiter = ';';
      let parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0) continue;
      if (/^\d+$/.test(parts[0]) && parts.length >= 4) parts.shift();
      if (parts.length >= 2) {
        let namaVal = parts[0].replace(/^\d+[\.\-\)]\s*/, '').trim();
        const lower = namaVal.toLowerCase();
        if (
          lower === 'nama' ||
          lower === 'nama murid' ||
          lower === 'nama siswa' ||
          lower.includes('nama lengkap')
        ) {
          continue;
        }
        if (namaVal) count++;
      }
    }
    return count;
  }, [csvText]);

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split(/\r?\n/);
    let importedCount = 0;

    const [currentClasses, currentStudents] = await Promise.all([
      DatabaseService.getClasses(),
      DatabaseService.getUsers()
    ]);
    const existingClassesMap = new Map(currentClasses.map((c) => [c.nama.toLowerCase(), c]));

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Detect separator: Tab (copy-paste from Excel/Sheets), Semicolon (;), or Comma (,)
      let delimiter = ',';
      if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(';') && !line.includes(',')) {
        delimiter = ';';
      }

      let parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0) continue;

      // Remove leading numbering if present in column 1 (e.g. "1. Budi Santoso" -> "Budi Santoso", or "1" as separate number column)
      if (/^\d+$/.test(parts[0]) && parts.length >= 4) {
        // First column was just a row number like 1, 2, 3
        parts.shift();
      }

      if (parts.length >= 2) {
        let [namaVal, nisVal, kelasVal, noAbsenVal, emailVal, passVal] = parts;
        if (!namaVal) continue;

        // Clean leading numbering like "1. Andi" -> "Andi"
        namaVal = namaVal.replace(/^\d+[\.\-\)]\s*/, '').trim();

        // Skip header line
        const lowerName = namaVal.toLowerCase();
        if (
          lowerName === 'nama' ||
          lowerName === 'nama murid' ||
          lowerName === 'nama siswa' ||
          lowerName.includes('nama lengkap')
        ) {
          continue;
        }

        const cleanNis = (nisVal || '').trim();
        const cleanKelas = (kelasVal || 'XI 1').trim();
        const cleanAbsen = (noAbsenVal || '').trim();
        const cleanUsername = (emailVal || '').trim();
        const cleanEmail = cleanUsername
          ? cleanUsername.includes('@')
            ? cleanUsername
            : `${cleanUsername}@pjok.sch.id`
          : `${namaVal.toLowerCase().replace(/[^a-z0-9]/g, '') || cleanNis || 'siswa'}@pjok.sch.id`;
        const cleanPass = (passVal || '').trim() || 'murid123';

        // Auto-register kelas jika belum ada di database
        if (cleanKelas && !existingClassesMap.has(cleanKelas.toLowerCase())) {
          const newClass: ClassItem = {
            id: `class-${cleanKelas.toLowerCase().replace(/\s+/g, '-')}`,
            nama: cleanKelas,
            tingkat: cleanKelas.split(' ')[0] || 'XI',
            jurusan: 'Umum',
            status: 'aktif',
            createdAt: new Date().toISOString()
          };
          await DatabaseService.saveClass(newClass);
          existingClassesMap.set(cleanKelas.toLowerCase(), newClass);
        }

        // Cek apakah siswa sudah terdaftar (berdasarkan NIS atau nama sama) untuk update, hindari duplikasi
        const existingStudent = currentStudents.find(
          (s) =>
            s.role === 'murid' &&
            ((cleanNis && s.nis === cleanNis) ||
              s.nama.toLowerCase() === namaVal.toLowerCase() ||
              (cleanEmail && s.email.toLowerCase() === cleanEmail.toLowerCase()))
        );

        const newStudent: UserProfile = {
          uid: existingStudent
            ? existingStudent.uid
            : `murid-import-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          nama: namaVal,
          nis: cleanNis,
          kelas: cleanKelas,
          nomorAbsen: cleanAbsen,
          email: cleanEmail,
          password: cleanPass,
          role: 'murid',
          status: 'aktif',
          createdAt: existingStudent?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await DatabaseService.saveUser(newStudent);
        importedCount++;
      }
    }

    await loadData();
    setIsImportOpen(false);
    setCsvText('');
    showNotice(`Berhasil memproses & menyimpan ${importedCount} data murid beserta username & password!`);
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter & search
  const filteredStudents = students.filter((s) => {
    const matchQuery =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.kelas && s.kelas.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchClass = selectedClass === 'Semua' || s.kelas === selectedClass;
    return matchQuery && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification */}
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
            Data & Kredensial Murid
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola identitas, username/email, password, dan status siswa peserta asesmen PJOK
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Lihat format CSV data murid"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Format CSV</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Murid</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, username, atau kelas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
          >
            <option value="Semua">Semua Kelas ({students.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nama}>
                Kelas {c.nama}
              </option>
            ))}
          </select>

          {/* Quick Bulk Select Button */}
          {filteredStudents.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filteredStudents.length > 0 && filteredStudents.every((s) => selectedUids.includes(s.uid))
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedUids.includes(s.uid))}
                readOnly
                className="w-3.5 h-3.5 rounded border-slate-300 pointer-events-none"
              />
              <span>
                {filteredStudents.length > 0 && filteredStudents.every((s) => selectedUids.includes(s.uid))
                  ? 'Batal Centang Semua'
                  : `Centang Semua (${filteredStudents.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedUids.length > 0 && (
        <div className="sticky top-20 z-20 bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl shadow-blue-900/25 border border-blue-500/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-blue-700 font-extrabold text-sm shadow-xs shrink-0">
              {selectedUids.length}
            </span>
            <div>
              <p className="text-sm font-extrabold">
                {selectedUids.length} murid dicentang untuk dihapus
              </p>
              <p className="text-xs text-blue-200">
                Dari total {filteredStudents.length} murid yang ditampilkan ({selectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${selectedClass}`})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedUids([])}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Batal Centang
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeletingBulk ? 'Menghapus...' : `Hapus ${selectedUids.length} Murid Terpilih`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card View (Easy tapping on phones/tablets) */}
      <div className="block lg:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            Tidak ditemukan data murid yang sesuai.
          </div>
        ) : (
          filteredStudents.map((s, idx) => {
            const isSelected = selectedUids.includes(s.uid);
            return (
              <div
                key={s.uid}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center p-1.5 cursor-pointer rounded-lg hover:bg-blue-100/50">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(s.uid)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        aria-label={`Pilih murid ${s.nama}`}
                      />
                    </label>
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {s.nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{s.nama}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Absen {s.nomorAbsen || '-'} • NIS: {s.nis || '-'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                    {s.kelas || '-'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="font-mono text-[11px] truncate max-w-[180px]">
                    {s.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.uid, s.nama)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-3 w-12 text-center">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua murid yang tampil"
                    checked={
                      filteredStudents.length > 0 &&
                      filteredStudents.every((s) => selectedUids.includes(s.uid))
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                <th className="py-3.5 px-4">NAMA MURID</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">KELAS</th>
                <th className="py-3.5 px-4 text-center">ABSEN</th>
                <th className="py-3.5 px-4">USERNAME / EMAIL</th>
                <th className="py-3.5 px-4">PASSWORD</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data murid yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const isSelected = selectedUids.includes(s.uid);
                  return (
                    <tr
                      key={s.uid}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${s.nama}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(s.uid)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {s.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.nama}</p>
                          <p className="text-[11px] text-slate-400 sm:hidden">NIS: {s.nis || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {s.nis || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {s.kelas || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {s.nomorAbsen || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs truncate max-w-[170px]">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {showPasswords[s.uid] ? (s.password || '123456') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(s.uid)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title={showPasswords[s.uid] ? 'Sembunyikan password' : 'Lihat password'}
                        >
                          {showPasswords[s.uid] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          s.status === 'aktif'
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Klik untuk ubah status"
                      >
                        {s.status === 'aktif' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Murid & Kredensial"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.uid, s.nama)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Murid"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                {editingStudent ? 'Edit Data & Password Murid' : 'Tambah Murid Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Murid *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Gede Dirga Jaya Kusuma"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIS (Nomor Induk Siswa)
                  </label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 7706"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor Absen
                  </label>
                  <input
                    type="text"
                    value={nomorAbsen}
                    onChange={(e) => setNomorAbsen(e.target.value)}
                    placeholder="Contoh: 01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas *
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email / Username Murid (Digunakan untuk Login)
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: gededirgajayakusuma (atau otomatis dibuat jika kosong)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password Login Murid *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: 123456"
                    required
                    className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setPassword('123456')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Reset: 123456
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Murid dapat login dengan memasukkan NIS / Email ini dan password yang ditentukan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Murid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Format CSV Info Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                  Format Teks / CSV Data Murid Per Kelas
                </h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Bapak/Ibu dapat mengetik atau menyalin data murid per kelas langsung dari Excel, Google Sheets, Catatan HP, atau WhatsApp dengan susunan 6 kolom berikut:
              </p>

              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="font-mono text-xs font-bold text-blue-900 truncate">
                  Nama, NIS, Kelas, No Absen, Username, Password
                </div>
                <button
                  type="button"
                  onClick={handleCopyHeaderOnly}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                  title="Salin judul kolom"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin Header</span>
                </button>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1.5">Contoh Format Baris Data (Kelas XI 1):</p>
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                  {CSV_TEMPLATE_CONTENT}
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-slate-700">
                <p className="font-bold text-slate-900">Penjelasan Setiap Kolom (Dipisahkan Tanda Koma):</p>
                <ul className="space-y-1.5 pl-1 text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">1. Nama:</span>
                    <span>Nama lengkap siswa (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">Gede Aditya Peratama</code>)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">2. NIS:</span>
                    <span>Nomor Induk Siswa (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">7504</code>) — Siswa bisa masuk menggunakan nomor ini</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">3. Kelas:</span>
                    <span>Nama rombel (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">XI 1</code> atau <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">XI 7</code>)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">4. No Absen:</span>
                    <span>Nomor urut presensi siswa (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">1</code>)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">5. Username:</span>
                    <span>Username akun siswa (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">gedeadityaperatama</code>) — Siswa juga bisa masuk menggunakan username ini</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">6. Password:</span>
                    <span>Kata sandi masuk siswa (Contoh: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">murid123</code> atau <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">123456</code>)</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin Contoh Lengkap</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File .CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import / Paste Direct Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg font-heading leading-tight">
                    Import / Tempel Data Murid
                  </h3>
                  <p className="text-xs text-slate-500">Salin & tempel teks langsung per kelas atau unggah berkas</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-blue-950">Urutan Kolom:</p>
                  <code className="text-[11px] text-blue-700 font-mono">
                    Nama, NIS, Kelas, No Absen, Username, Password
                  </code>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyHeaderOnly}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Salin Header
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unggah Berkas .CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
                        `Gede Aditya Peratama, 7504, XI 1, 1, gedeadityaperatama, murid123\n` +
                        `Gede Eric Surya Purnama, 7474, XI 1, 2, gedeericsuryapurnama, murid123\n` +
                        `Gede Reynard Dharma Mahardika, 7440, XI 1, 3, gedereynarddharmamahardika, murid123`
                      );
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    + Muat Contoh XI 1
                  </button>
                  {csvText && (
                    <button
                      type="button"
                      onClick={() => setCsvText('')}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Area Ketik / Tempel (Paste) Teks Murid:
                  </label>
                  {detectedStudentsCount > 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {detectedStudentsCount} data murid terdeteksi
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      Satu baris untuk setiap murid
                    </span>
                  )}
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Ketik atau tempel langsung di sini (bisa per kelas):\nNama, NIS, Kelas, No Absen, Username, Password\n\nContoh:\nGede Aditya Peratama, 7504, XI 1, 1, gedeadityaperatama, murid123\nGede Eric Surya Purnama, 7474, XI 1, 2, gedeericsuryapurnama, murid123`}
                  rows={8}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Tips:</strong> Jika kelas belum terdaftar, sistem akan otomatis membuatkan kelas baru. Jika siswa sudah ada (berdasarkan NIS/Nama), data mereka akan diperbarui tanpa membuat duplikat.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!csvText.trim() || detectedStudentsCount === 0}
                  onClick={handleImportCsv}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Proses Import ({detectedStudentsCount} Murid)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
