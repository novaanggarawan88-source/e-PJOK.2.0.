import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';
import {
  Menu,
  X,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, role } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-xs w-full transition-colors">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-2.5 min-h-[64px] sm:min-h-[76px] gap-2">
          
          {/* Brand / Kop Logo & 3-Line Header (Judul, Sekolah & Slogan, Nama Akun) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-hidden cursor-pointer transition-colors lg:hidden shrink-0"
                aria-label="Buka menu navigasi"
              >
                {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            )}

            <div className="min-w-0">
              <AppLogo
                size="md"
                showText={true}
                extraSubtitle={
                  currentUser ? (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs font-semibold truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Akun:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {currentUser.nama}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        ({role === 'guru' ? 'Guru PJOK' : `Kelas ${currentUser.kelas || 'XI 7'}${currentUser.nomorAbsen ? ` • No. ${currentUser.nomorAbsen}` : ''}`})
                      </span>
                    </div>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Right Section: Theme Toggle (Gelap/Terang) */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>

        </div>
      </div>
    </header>
  );
};


