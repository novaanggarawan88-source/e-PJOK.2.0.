import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  School,
  FileSpreadsheet,
  Award,
  BarChart3,
  Settings,
  LogOut,
  X,
  ClipboardList,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export type TeacherMenu =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'indicators'
  | 'tasks'
  | 'materials'
  | 'quizzes'
  | 'results'
  | 'recap'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentMenu: TeacherMenu;
  onSelectMenu: (menu: TeacherMenu) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuGroup {
  title: string;
  items: {
    id: TeacherMenu;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onClose
}) => {
  const { logout } = useAuth();

  const menuGroups: MenuGroup[] = [
    {
      title: 'MENU UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'DATA',
      items: [
        { id: 'students', label: 'Data Murid', icon: Users },
        { id: 'classes', label: 'Data Kelas', icon: School }
      ]
    },
    {
      title: 'PEMBELAJARAN & NILAI',
      items: [
        { id: 'materials', label: 'Materi Pembelajaran', icon: BookOpen },
        { id: 'tasks', label: 'Tugas Penilaian', icon: ClipboardList },
        { id: 'quizzes', label: 'Quis PJOK', icon: HelpCircle }
      ]
    },
    {
      title: 'REKAPAN',
      items: [
        { id: 'results', label: 'Hasil Penilaian', icon: Award },
        { id: 'recap', label: 'Rekap Nilai', icon: FileSpreadsheet },
        { id: 'analytics', label: 'Analisis & Grafik', icon: BarChart3 },
        { id: 'settings', label: 'Pengaturan & DB', icon: Settings }
      ]
    }
  ];

  const handleItemClick = (id: TeacherMenu) => {
    onSelectMenu(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
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
        id="teacher-sidebar"
        className={`fixed top-0 lg:top-[64px] sm:lg:top-[76px] bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile header with close button */}
          <div className="shrink-0 flex items-center justify-between p-3.5 pb-3 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="font-extrabold text-sm text-slate-800 dark:text-white font-heading">
              MENU UTAMA
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categorized Navigation Groups - Area menu yang scroll jika layar pendek */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 dark:bg-emerald-600'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {groupIdx < menuGroups.length - 1 && (
                  <div className="pt-2 border-b border-slate-100 dark:border-slate-800/60" />
                )}
              </div>
            ))}
          </div>

          {/* Bottom Section: Tombol Keluar Terkunci Paling Bawah (Tepat di bagian bawah sidebar) */}
          <div className="shrink-0 p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
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

