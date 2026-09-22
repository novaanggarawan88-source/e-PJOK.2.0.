import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  History,
  User,
  Award,
  BookOpen,
  CheckSquare
} from 'lucide-react';

export type StudentTab =
  | 'home'
  | 'materials'
  | 'learning-tasks'
  | 'tasks'
  | 'quizzes'
  | 'history'
  | 'profile';

interface StudentNavProps {
  currentTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  pendingTaskCount?: number;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  currentTab,
  onSelectTab,
  pendingTaskCount = 0
}) => {
  const tabs: Array<{
    id: StudentTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materi Pembelajaran', shortLabel: 'Materi', icon: BookOpen },
    { id: 'learning-tasks', label: 'Tugas Pembelajaran', shortLabel: 'Tugas', icon: CheckSquare },
    { id: 'tasks', label: 'Tugas Penilaian', shortLabel: 'Penilaian', icon: ClipboardList, badge: pendingTaskCount },
    { id: 'quizzes', label: 'Formatif', shortLabel: 'Formatif', icon: Award },
    { id: 'history', label: 'Riwayat & Masukan', shortLabel: 'Riwayat', icon: History },
    { id: 'profile', label: 'Profil & Panduan', shortLabel: 'Profil', icon: User }
  ];

  return (
    <>
      {/* Top / Desktop Segmented Nav for Student */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 py-2.5 px-4 shadow-xs transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-start gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25 dark:bg-teal-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && t.badge > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-teal-800' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Fixed Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 z-40 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-7 h-16">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all relative cursor-pointer active:scale-95 ${
                  isActive ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {t.badge && t.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold shadow-xs">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[9px] leading-tight truncate max-w-[48px] ${isActive ? 'font-bold' : ''}`}>
                  {t.shortLabel}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-6 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

