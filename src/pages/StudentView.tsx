import React, { useState, useEffect } from 'react';
import { StudentTab } from '../components/StudentNav';
import { StudentSidebar } from '../components/StudentSidebar';
import { StudentHome } from './student/StudentHome';
import { StudentAssessmentForm } from './student/StudentAssessmentForm';
import { StudentHistory } from './student/StudentHistory';
import { StudentProfile } from './student/StudentProfile';
import { StudentQuiz } from './student/StudentQuiz';
import { StudentMaterials } from './student/StudentMaterials';
import { StudentLearningTasks } from './student/StudentLearningTasks';
import { AssessmentTask, AssessmentRecord, isTaskAssignedToClass } from '../types';
import { DatabaseService, subscribeToDataChanges } from '../services/db';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  History,
  User,
  Award,
  BookOpen,
  CheckSquare
} from 'lucide-react';

interface StudentViewProps {
  isSidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  isSidebarOpen = false,
  onCloseSidebar = () => {}
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<StudentTab>('home');
  const [activeTaskForForm, setActiveTaskForForm] = useState<AssessmentTask | null>(null);
  const [editingRecord, setEditingRecord] = useState<AssessmentRecord | null>(null);

  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [myAssessments, setMyAssessments] = useState<AssessmentRecord[]>([]);

  const loadData = async () => {
    if (!user) return;
    const [allTasks, allAssessments] = await Promise.all([
      DatabaseService.getTasks(),
      DatabaseService.getAssessments()
    ]);

    const userClass = user.kelas || 'XI 7';
    const relevantTasks = allTasks.filter(
      (t) => t.status === 'aktif' && isTaskAssignedToClass(t, userClass)
    );
    setTasks(relevantTasks);

    const mine = allAssessments.filter(
      (a) =>
        a.assessorUserId === user.uid ||
        a.assessorName.toLowerCase() === user.nama.toLowerCase()
    );
    setMyAssessments(mine);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Calculate pending tasks count
  const pendingCount = tasks.reduce((acc, t) => {
    const doneCount = myAssessments.filter((a) => a.taskId === t.id).length;
    const req = t.jumlahTemanDinilai || 2;
    return doneCount < req ? acc + 1 : acc;
  }, 0);

  const handleStartAssessment = (task: AssessmentTask, recordToEdit?: AssessmentRecord) => {
    setActiveTaskForForm(task);
    setEditingRecord(recordToEdit || null);
  };

  const handleFormBack = () => {
    setActiveTaskForForm(null);
    setEditingRecord(null);
  };

  const handleFormSuccess = () => {
    setActiveTaskForForm(null);
    setEditingRecord(null);
    setCurrentTab('home');
  };

  // If student is currently filling out an assessment form
  if (activeTaskForForm) {
    return (
      <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] flex">
        <StudentSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setActiveTaskForForm(null);
            setEditingRecord(null);
            setCurrentTab(tab);
          }}
          isOpen={isSidebarOpen}
          onClose={onCloseSidebar}
          pendingTaskCount={pendingCount}
        />
        {/* Spacer for desktop fixed sidebar */}
        <div className="hidden lg:block w-64 shrink-0" aria-hidden="true" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full min-w-0">
          <StudentAssessmentForm
            task={activeTaskForForm}
            existingRecord={editingRecord}
            onBack={handleFormBack}
            onSuccess={handleFormSuccess}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] flex relative">
      {/* Student Sidebar for Desktop & Mobile Slide-in (Locked & Fixed on Left) */}
      <StudentSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={onCloseSidebar}
        pendingTaskCount={pendingCount}
      />

      {/* Spacer for desktop fixed sidebar */}
      <div className="hidden lg:block w-64 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-24 lg:pb-8">
          {currentTab === 'home' && (
            <StudentHome
              onNavigateTab={setCurrentTab}
              onStartAssessment={(task) => handleStartAssessment(task)}
            />
          )}

          {currentTab === 'tasks' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
                  Daftar Tugas Penilaian Kelas {user?.kelas || 'XI 7'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Pilih tugas penilaian gerak di bawah ini untuk menilai teman sekelasmu
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {tasks.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                    Belum ada tugas aktif untuk kelasmu saat ini.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const evaluatedCount = myAssessments.filter((a) => a.taskId === task.id).length;
                    const reqCount = task.jumlahTemanDinilai || 2;
                    const isDone = evaluatedCount >= reqCount;

                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300">
                              Kelas {task.kelas}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Materi: {task.materi}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                                isDone ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {isDone
                                ? `Selesai (${evaluatedCount}/${reqCount} Teman)`
                                : `Belum Selesai (${evaluatedCount}/${reqCount} Teman)`}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading">
                            {task.nama}
                          </h3>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
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

                        <button
                          onClick={() => handleStartAssessment(task)}
                          className="w-full md:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all self-stretch md:self-center shrink-0 cursor-pointer"
                        >
                          <span>{isDone ? 'Nilai Teman Lain' : 'Mulai Menilai'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentTab === 'materials' && <StudentMaterials />}

          {currentTab === 'learning-tasks' && user && <StudentLearningTasks user={user} />}

          {currentTab === 'quizzes' && <StudentQuiz />}

          {currentTab === 'history' && (
            <StudentHistory
              onEditAssessment={(record, task) => handleStartAssessment(task, record)}
            />
          )}

          {currentTab === 'profile' && <StudentProfile />}
        </main>
      </div>

      {/* Sleek Native-App Like Mobile Bottom Dock for Students */}
      <nav
        aria-label="Navigasi Bawah Siswa"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-1 py-1.5 shadow-lg grid grid-cols-7"
      >
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-4.5 h-4.5 ${currentTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('materials')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'materials'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-4.5 h-4.5 ${currentTab === 'materials' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Materi</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('learning-tasks')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'learning-tasks'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className={`w-4.5 h-4.5 ${currentTab === 'learning-tasks' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Tugas</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('tasks')}
          className={`relative flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'tasks'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ClipboardList className={`w-4.5 h-4.5 ${currentTab === 'tasks' ? 'stroke-[2.5]' : ''}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black px-1 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Penilaian</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('quizzes')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'quizzes'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className={`w-4.5 h-4.5 ${currentTab === 'quizzes' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Formatif</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'history'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className={`w-4.5 h-4.5 ${currentTab === 'history' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Riwayat</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'profile'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className={`w-4.5 h-4.5 ${currentTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px] mt-0.5 truncate max-w-[40px]">Profil</span>
        </button>
      </nav>
    </div>
  );
};
