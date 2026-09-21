import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { QuizItem, QuizSubmission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  Lock,
  Unlock,
  Clock,
  Key,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Send
} from 'lucide-react';

export const StudentQuiz: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [activeQuizToTake, setActiveQuizToTake] = useState<QuizItem | null>(null);

  // PIN unlock state per quiz
  const [pinInputs, setPinInputs] = useState<{ [quizId: string]: string }>({});
  const [pinError, setPinError] = useState<{ [quizId: string]: string }>({});
  const [unlockedByPin, setUnlockedByPin] = useState<{ [quizId: string]: boolean }>({});

  const [hasMarkedDone, setHasMarkedDone] = useState(false);
  const [timeLeftMinutes, setTimeLeftMinutes] = useState<number | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [allQuizzes, allSubs] = await Promise.all([
      DatabaseService.getQuizzesForClass(user.kelas || 'Semua Kelas'),
      DatabaseService.getQuizSubmissions()
    ]);
    setQuizzes(allQuizzes);
    setSubmissions(allSubs);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Handle countdown timer when quiz is actively taken
  useEffect(() => {
    if (!activeQuizToTake || !activeQuizToTake.durasiMenit) {
      setTimeLeftMinutes(null);
      return;
    }

    setTimeLeftMinutes(activeQuizToTake.durasiMenit * 60);

    const timer = setInterval(() => {
      setTimeLeftMinutes((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuizToTake]);

  const handleUnlockWithPin = (quiz: QuizItem) => {
    const entered = (pinInputs[quiz.id] || '').trim().toUpperCase();
    const correctPin = (quiz.kodeKunci || '').trim().toUpperCase();

    if (!entered) {
      setPinError({ ...pinError, [quiz.id]: 'Masukkan PIN kunci terlebih dahulu!' });
      return;
    }

    if (entered === correctPin) {
      setUnlockedByPin({ ...unlockedByPin, [quiz.id]: true });
      setPinError({ ...pinError, [quiz.id]: '' });
    } else {
      setPinError({ ...pinError, [quiz.id]: 'Kunci / PIN salah! Tanyakan pada Guru PJOK di kelas.' });
    }
  };

  const handleOpenQuiz = (quiz: QuizItem) => {
    setActiveQuizToTake(quiz);
    setHasMarkedDone(false);
  };

  const handleCloseQuizViewer = () => {
    setActiveQuizToTake(null);
  };

  const handleMarkAsDone = async () => {
    if (!user || !activeQuizToTake) return;

    const subData: QuizSubmission = {
      id: `qsub-${activeQuizToTake.id}-${user.uid}`,
      quizId: activeQuizToTake.id,
      studentId: user.uid,
      studentName: user.nama,
      studentClass: user.kelas || 'XI 7',
      studentNoAbsen: user.nomorAbsen,
      submittedAt: new Date().toISOString(),
      status: 'selesai'
    };

    await DatabaseService.saveQuizSubmission(subData);
    setHasMarkedDone(true);
    await loadData();
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If in active quiz viewer mode
  if (activeQuizToTake) {
    const isDone = submissions.some(
      (s) => s.quizId === activeQuizToTake.id && s.studentId === user?.uid
    ) || hasMarkedDone;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-white">
        {/* Top Floating Control Bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseQuizViewer}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[220px] sm:max-w-md font-heading">
                {activeQuizToTake.judul}
              </h2>
              <p className="text-[11px] text-teal-400">
                Materi: {activeQuizToTake.materi} • {user?.nama} ({user?.kelas})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown timer */}
            {timeLeftMinutes !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  timeLeftMinutes < 300
                    ? 'bg-rose-900/80 text-rose-300 border border-rose-700 animate-pulse'
                    : 'bg-slate-800 text-teal-300 border border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftMinutes)}</span>
              </div>
            )}

            {/* Mark as Done Button */}
            <button
              onClick={handleMarkAsDone}
              disabled={isDone}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                isDone
                  ? 'bg-emerald-700 text-white cursor-default'
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDone ? 'Sudah Ditandai Selesai' : 'Tandai Selesai'}</span>
            </button>
          </div>
        </header>

        {/* Embedded Quiz Frame / In-App Direct Display */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          <iframe
            src={activeQuizToTake.linkUrl}
            title={activeQuizToTake.judul}
            className="w-full flex-1 border-0 bg-white"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
            <HelpCircle className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
              Kuis & Ujian PJOK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Akses link kuis dari Guru PJOK. Kuis yang dikunci oleh guru hanya dapat dibuka saat jam kuis dimulai di kelas.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Items List */}
      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Belum Ada Kuis Tersedia
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Guru PJOK belum membagikan link kuis untuk kelas Anda ({user?.kelas || 'XI 7'}). Silakan tunggu instruksi guru di kelas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {quizzes.map((quiz) => {
            const isUnlockedByTeacher = quiz.status === 'buka';
            const isUnlockedLocally = unlockedByPin[quiz.id] === true;
            const canAccess = isUnlockedByTeacher || isUnlockedLocally;

            const mySubmission = submissions.find(
              (s) => s.quizId === quiz.id && s.studentId === user?.uid
            );
            const isDone = !!mySubmission;

            return (
              <div
                key={quiz.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isDone
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : canAccess
                    ? 'border-teal-400 dark:border-teal-700 shadow-sm shadow-teal-500/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-95'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sudah Dikerjakan</span>
                        </span>
                      ) : canAccess ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Kuis Dibuka Guru</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Kuis Dikunci oleh Guru</span>
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {quiz.kelas}
                      </span>
                    </div>

                    {quiz.durasiMenit && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {quiz.durasiMenit} Menit
                      </span>
                    )}
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

                  {/* Instruction */}
                  {quiz.instruksi && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <strong>Petunjuk Guru:</strong> {quiz.instruksi}
                    </p>
                  )}

                  {/* Lock State Banner or Unlock Form */}
                  {!canAccess && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Kuis Masih Dikunci oleh Guru
                          </h4>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            Kuis belum diaktifkan guru atau sudah ditutup. Anda hanya bisa mengerjakan kuis saat jam pengerjaan dibuka oleh Guru PJOK.
                          </p>
                        </div>
                      </div>

                      {/* If teacher set a PIN key */}
                      {quiz.kodeKunci && (
                        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                          <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                            Punya Kunci / PIN dari Guru PJOK?
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Ketik Kunci / PIN..."
                              value={pinInputs[quiz.id] || ''}
                              onChange={(e) =>
                                setPinInputs({ ...pinInputs, [quiz.id]: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleUnlockWithPin(quiz)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              Buka PIN
                            </button>
                          </div>
                          {pinError[quiz.id] && (
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                              {pinError[quiz.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800">
                  {canAccess ? (
                    <button
                      onClick={() => handleOpenQuiz(quiz)}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{isDone ? 'Buka Kembali Kuis' : 'Buka & Kerjakan Kuis'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Kuis Masih Terkunci</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
