import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { QuizItem, ClassItem, QuizSubmission } from '../../types';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check,
  Search,
  Clock,
  Key,
  Users,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const QuizManagement: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedQuizForSubs, setSelectedQuizForSubs] = useState<QuizItem | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [judul, setJudul] = useState('');
  const [materi, setMateri] = useState('');
  const [kelas, setKelas] = useState('Semua Kelas');
  const [linkUrl, setLinkUrl] = useState('');
  const [status, setStatus] = useState<'buka' | 'kunci'>('kunci');
  const [kodeKunci, setKodeKunci] = useState('');
  const [durasiMenit, setDurasiMenit] = useState<number>(30);
  const [batasWaktu, setBatasWaktu] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    const [qList, cList, sList] = await Promise.all([
      DatabaseService.getQuizzes(),
      DatabaseService.getClasses(),
      DatabaseService.getQuizSubmissions()
    ]);
    setQuizzes(qList);
    setClasses(cList);
    setSubmissions(sList);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingQuiz(null);
    setJudul('');
    setMateri('');
    setKelas('Semua Kelas');
    setLinkUrl('');
    setStatus('kunci');
    setKodeKunci('');
    setDurasiMenit(30);
    setBatasWaktu('');
    setInstruksi('Kerjakan soal kuis dengan teliti dan jujur selama jam pengerjaan dibuka.');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (quiz: QuizItem) => {
    setEditingQuiz(quiz);
    setJudul(quiz.judul);
    setMateri(quiz.materi);
    setKelas(quiz.kelas);
    setLinkUrl(quiz.linkUrl);
    setStatus(quiz.status);
    setKodeKunci(quiz.kodeKunci || '');
    setDurasiMenit(quiz.durasiMenit || 30);
    setBatasWaktu(quiz.batasWaktu || '');
    setInstruksi(quiz.instruksi || '');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (quiz: QuizItem) => {
    const nextStatus = quiz.status === 'buka' ? 'kunci' : 'buka';
    await DatabaseService.toggleQuizStatus(quiz.id, nextStatus);
    showNotification(
      nextStatus === 'buka'
        ? `Kuis "${quiz.judul}" berhasil DIBUKA! Murid sekarang bisa mengakses link kuis.`
        : `Kuis "${quiz.judul}" berhasil DIKUNCI! Murid tidak dapat lagi membuka kuis.`
    );
    loadData();
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !linkUrl.trim()) {
      alert('Mohon lengkapi judul kuis dan tautan (link) kuis!');
      return;
    }

    // Pembersihan cerdas URL kuis (mendukung Google Apps Script, Google Form, embed iframe code, dsb.)
    let cleanUrl = linkUrl.trim();

    // 1. Jika guru tidak sengaja menempelkan cuplikan embed <iframe src="...">
    const iframeMatch = cleanUrl.match(/src=["'](https?:\/\/[^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      cleanUrl = iframeMatch[1];
    } else {
      // Hilangkan tanda kutip atau kurung sudut jika ada
      cleanUrl = cleanUrl.replace(/^["'`<]+|["'`>]+$/g, '').trim();
    }

    // 2. Pastikan diawali https:// atau http://
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // 3. Deteksi tautan Google Apps Script berakhiran /dev
    if (cleanUrl.includes('script.google.com') && cleanUrl.endsWith('/dev')) {
      const wantReplace = confirm(
        'Perhatian Tautan Google Apps Script:\nTautan Anda berakhiran "/dev" (mode pengembangan guru), sehingga murid tidak akan bisa membukanya.\n\nApakah Anda ingin otomatis mengubahnya menjadi "/exec" (versi publik Web App untuk murid)?'
      );
      if (wantReplace) {
        cleanUrl = cleanUrl.replace(/\/dev$/, '/exec');
      }
    }

    setIsSaving(true);
    try {
      const quizData: QuizItem = {
        id: editingQuiz ? editingQuiz.id : `quiz-${Date.now()}`,
        judul: judul.trim(),
        materi: materi.trim() || 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
        kelas,
        linkUrl: cleanUrl,
        status,
        kodeKunci: kodeKunci.trim() ? kodeKunci.trim().toUpperCase() : undefined,
        durasiMenit: Number(durasiMenit) || 30,
        batasWaktu: batasWaktu.trim() || undefined,
        instruksi: instruksi.trim(),
        createdAt: editingQuiz ? editingQuiz.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DatabaseService.saveQuiz(quizData);
      setIsModalOpen(false);
      showNotification(
        editingQuiz
          ? 'Perubahan kuis berhasil disimpan!'
          : 'Link kuis baru berhasil dibuat dan disimpan!'
      );
      loadData();
    } catch (err: any) {
      console.error('Gagal menyimpan kuis:', err);
      alert('Terjadi kesalahan saat menyimpan kuis: ' + (err.message || 'Silakan coba lagi.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kuis "${title}"?`)) {
      await DatabaseService.deleteQuiz(id);
      showNotification('Kuis berhasil dihapus.');
      loadData();
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesClass =
      filterClass === 'all' || q.kelas === 'Semua Kelas' || q.kelas === filterClass;
    const matchesSearch =
      q.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const openQuizSubmissions = (quiz: QuizItem) => {
    setSelectedQuizForSubs(quiz);
    setIsSubmissionsModalOpen(true);
  };

  const totalActive = quizzes.filter((q) => q.status === 'buka').length;
  const totalLocked = quizzes.filter((q) => q.status === 'kunci').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-teal-600 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                <HelpCircle className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  Manajemen Quis PJOK
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Kelola dan bagikan evaluasi kuis PJOK untuk siswa secara terstruktur dan terpadu.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Quis</span>
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Kuis Terdaftar
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-heading mt-1">
              {quizzes.length} <span className="text-xs font-normal text-slate-500">Kuis</span>
            </p>
          </div>

          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Status Kuis Terbuka (Murid Bisa Akses)
              </p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-heading mt-1">
              {totalActive} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-500">Aktif</span>
            </p>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/60">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Status Kuis Terkunci (Murid Tertahan)
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-heading mt-1">
              {totalLocked} <span className="text-xs font-normal text-amber-600 dark:text-amber-500">Terkunci</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul kuis, materi, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nama}>
                Kelas {c.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quiz List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Belum Ada Kuis
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || filterClass !== 'all'
              ? 'Tidak ditemukan kuis dengan kata kunci atau filter kelas tersebut.'
              : 'Klik tombol "+ Tambah Link Kuis" di atas untuk memasukkan link Google Form, Quizizz, atau instrumen kuis lainnya.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredQuizzes.map((quiz) => {
            const isUnlocked = quiz.status === 'buka';
            const quizSubs = submissions.filter((s) => s.quizId === quiz.id);

            return (
              <div
                key={quiz.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-emerald-300 dark:border-emerald-800 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Status Bar & Target Class */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                          isUnlocked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isUnlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>DIBUKA (Murid Bisa Menjawab)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>DIKUNCI (Murid Tertahan)</span>
                          </>
                        )}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {quiz.kelas}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(quiz)}
                        title="Edit Kuis"
                        className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id, quiz.judul)}
                        title="Hapus Kuis"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading tracking-tight">
                      {quiz.judul}
                    </h3>
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                      Materi: {quiz.materi}
                    </p>
                  </div>

                  {/* Instructions */}
                  {quiz.instruksi && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {quiz.instruksi}
                    </p>
                  )}

                  {/* Link Preview Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tautan / Link Soal Kuis Guru:
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate select-all">
                        {quiz.linkUrl}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(quiz.linkUrl, quiz.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                          title="Salin Link"
                        >
                          {copiedId === quiz.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={quiz.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 transition-all"
                          title="Buka Link di Tab Baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Meta info: PIN, Duration, Submissions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-500" /> Kunci/PIN
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                        {quiz.kodeKunci || 'Tanpa PIN'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> Durasi
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 mt-0.5">
                        {quiz.durasiMenit ? `${quiz.durasiMenit} Menit` : 'Fleksibel'}
                      </strong>
                    </div>

                    <div
                      onClick={() => openQuizSubmissions(quiz)}
                      className="p-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/50 dark:border-teal-800/50 flex flex-col col-span-2 sm:col-span-1 cursor-pointer hover:bg-teal-100/80 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 uppercase font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" /> Respon Siswa
                      </span>
                      <strong className="text-teal-900 dark:text-teal-200 mt-0.5">
                        {quizSubs.length} Siswa Selesai
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Big 1-Click Lock/Unlock Action Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Kendali Waktu Guru:
                  </div>

                  <button
                    onClick={() => handleToggleStatus(quiz)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                      isUnlocked
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>KUNCI KUIS SEKARANG</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>BUKA KUIS SEKARANG</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Kuis */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                  {editingQuiz ? 'Edit Quis' : 'Tambah Quis Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              {/* Judul Kuis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kuis Teori & Pemahaman Bola Basket Bab 2"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Materi & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Materi Pokok
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Permainan Bola Besar"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Sasaran Kelas
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama}>
                        Kelas {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link Kuis (URL) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Link / Tautan Kuis Guru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: https://script.google.com/macros/s/.../exec atau Google Form"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Mendukung Google Apps Script Web App, Google Form, Quizizz, Wordwall, CBT sekolah, Kahoot, atau link soal lainnya.
                </p>

                {/* Info khusus bila memasukkan Apps Script */}
                {linkUrl.includes('script.google.com') && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>💡 Tips Google Apps Script untuk Guru:</span>
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-800 dark:text-blue-300">
                      <li>Gunakan tautan Web App yang berakhiran <strong>/exec</strong> (bukan /dev).</li>
                      <li>Di menu Deploy Apps Script, pastikan <em>Who has access</em> disetel ke <strong>"Anyone" (Siapa saja)</strong> agar murid bisa mengakses kuis.</li>
                      <li>Jika script menghasilkan HTML, pastikan menyertakan <code>.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)</code> agar bisa muncul langsung di layar aplikasi murid.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Kunci Akses & Status Kuis (Fitur Utama dari Permintaan Pengguna) */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-teal-600" />
                      Status Kunci & Waktu Guru
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Tentukan apakah murid bisa langsung membuka link atau harus menunggu instruksi guru.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setStatus('kunci')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        status === 'kunci'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Lock className="w-3 h-3" /> Dikunci
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('buka')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        status === 'buka'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Unlock className="w-3 h-3" /> Dibuka
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Kunci / PIN Kuis (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: PJOK123"
                      value={kodeKunci}
                      onChange={(e) => setKodeKunci(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Jika diisi, murid diminta memasukkan PIN ini untuk membuka kuis.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Estimasi Durasi (Menit)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durasiMenit}
                      onChange={(e) => setDurasiMenit(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sebagai pedoman waktu pengerjaan di kelas.
                    </span>
                  </div>
                </div>
              </div>

              {/* Instruksi Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Petunjuk / Instruksi untuk Siswa
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan dari guru untuk murid saat mengerjakan kuis..."
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Tombol Simpan */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingQuiz ? 'Simpan Perubahan' : 'Simpan & Pasang Kuis'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Daftar Siswa yang Mengerjakan Kuis */}
      {isSubmissionsModalOpen && selectedQuizForSubs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                  Siswa yang Menyelesaikan Kuis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedQuizForSubs.judul}
                </p>
              </div>
              <button
                onClick={() => setIsSubmissionsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {submissions.filter((s) => s.quizId === selectedQuizForSubs.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada siswa yang menandai selesai untuk kuis ini.
                </div>
              ) : (
                submissions
                  .filter((s) => s.quizId === selectedQuizForSubs.id)
                  .map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {sub.studentName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kelas {sub.studentClass} {sub.studentNoAbsen ? `• Absen ${sub.studentNoAbsen}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setIsSubmissionsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
