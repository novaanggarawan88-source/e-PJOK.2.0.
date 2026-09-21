import React from 'react';
import { Home, ClipboardCheck, History, User, HelpCircle, BookOpen } from 'lucide-react';

export type StudentTab = 'home' | 'tasks' | 'materials' | 'quizzes' | 'history' | 'profile';

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
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'tasks', label: 'Tugas', icon: ClipboardCheck, badge: pendingTaskCount },
    { id: 'materials', label: 'Materi PJOK', icon: BookOpen },
    { id: 'quizzes', label: 'Quis PJOK', icon: HelpCircle },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <>
      {/* Top / Desktop Segmented Nav for Student */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 py-2.5 px-4 shadow-xs transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-start gap-2 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25 dark:bg-teal-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && t.badge > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full ${
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

      {/* Mobile Bottom Fixed Bar for easy thumb navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 z-40 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-6 h-16">
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
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  {t.badge && t.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] leading-tight truncate max-w-[52px] ${isActive ? 'font-bold' : ''}`}>
                  {t.id === 'materials' ? 'Materi' : t.id === 'quizzes' ? 'Kuis' : t.label}
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
