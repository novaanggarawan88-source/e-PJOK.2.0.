import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentTab } from './StudentNav';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  ClipboardList,
  History,
  User,
  LogOut,
  X,
  HeartHandshake,
  GraduationCap,
  Award,
  BookOpen,
  CheckSquare
} from 'lucide-react';

interface StudentSidebarProps {
  currentTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingTaskCount?: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingTaskCount = 0
}) => {
  const { user, logout } = useAuth();

  const menuGroups: Array<{
    groupTitle: string;
    items: Array<{
      id: StudentTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      description: string;
    }>;
  }> = [
    {
      groupTitle: 'MENU UTAMA',
      items: [
        {
          id: 'home',
          label: 'Dashboard',
          icon: LayoutDashboard,
          description: 'Ringkasan & status'
        }
      ]
    },
    {
      groupTitle: 'PEMBELAJARAN',
      items: [
        {
          id: 'materials',
          label: 'Materi Pembelajaran',
          icon: BookOpen,
          description: 'Modul & video materi'
        },
        {
          id: 'learning-tasks',
          label: 'Tugas Pembelajaran',
          icon: CheckSquare,
          description: 'Tugas mandiri & LKPD'
        },
        {
          id: 'tasks',
          label: 'Tugas Penilaian',
          icon: ClipboardList,
          badge: pendingTaskCount,
          description: 'Praktik antar teman'
        },
        {
          id: 'quizzes',
          label: 'Formatif',
          icon: Award,
          description: 'Asesmen kuis & tes'
        }
      ]
    },
    {
      groupTitle: 'PENGATURAN',
      items: [
        {
          id: 'history',
          label: 'Riwayat & Masukan',
          icon: History,
          description: 'Nilai & umpan balik'
        },
        {
          id: 'profile',
          label: 'Profil & Panduan',
          icon: User,
          description: 'Data diri & etika'
        }
      ]
    }
  ];

  const handleItemClick = (id: StudentTab) => {
    onSelectTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah kamu yakin ingin keluar dari akun?')) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Terkunci (Fixed) di sisi kiri, tidak bergeser naik turun */}
      <aside
        id="student-sidebar"
        className={`fixed top-0 lg:top-[64px] sm:lg:top-[76px] bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile header with close button */}
          <div className="shrink-0 flex items-center justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="font-extrabold text-sm text-slate-800 dark:text-white font-heading">
              MENU SISWA PJOK
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu - Scrollable area with 3 separated groups */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="flex items-center justify-between px-3 pt-1 pb-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-heading">
                    {group.groupTitle}
                  </p>
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 dark:bg-teal-600 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                            }`}
                          />
                          <div className="text-left">
                            <span className="block leading-tight">{item.label}</span>
                            <span
                              className={`text-[10px] font-normal ${
                                isActive ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {item.description}
                            </span>
                          </div>
                        </div>

                        {item.badge !== undefined && item.badge > 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              isActive
                                ? 'bg-white text-teal-800'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {groupIdx < menuGroups.length - 1 && (
                  <div className="pt-2">
                    <div className="h-px bg-slate-100 dark:bg-slate-800/80" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Section: Info Etika & AKUN & KELUAR TERKUNCI PALING BAWAH */}
          <div className="shrink-0 p-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 mt-auto">
            {/* Student Profile Info Card at Bottom */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {user?.nama ? user.nama.charAt(0) : 'S'}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {user?.nama || 'Siswa PJOK'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                    <GraduationCap className="w-3 h-3 shrink-0" />
                    <span>Kelas {user?.kelas || 'XI 7'}</span>
                    {user?.nomorAbsen && <span>• No. {user.nomorAbsen}</span>}
                  </div>
                </div>
              </div>

              <ThemeToggle className="shrink-0" />
            </div>

            {/* Tombol Keluar Akun Siswa di Paling Bawah */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
