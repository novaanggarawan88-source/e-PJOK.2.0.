/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { TeacherView } from './pages/TeacherView';
import { StudentView } from './pages/StudentView';
import { AppLogo } from './components/AppLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DatabaseService } from './services/db';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Jalankan reset otomatis jika pertama kali atau diminta reset penuh
    const resetDone = localStorage.getItem('pjok_database_full_reset_done_v1');
    if (!resetDone) {
      DatabaseService.resetAllDatabase()
        .then(() => {
          localStorage.setItem('pjok_database_full_reset_done_v1', 'true');
        })
        .catch(() => {});
    } else {
      DatabaseService.purgeDummyAccounts().catch(() => {});
      DatabaseService.purgeDummyClasses().catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="mb-4">
          <AppLogo size="xl" showText={false} />
        </div>
        <p className="font-extrabold text-slate-800 dark:text-white text-xl font-heading tracking-tight">
          e-PJOK
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Memuat aplikasi pembelajaran & penilaian...</p>
      </div>
    );
  }

  // If unauthenticated, show Login Page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Top Navbar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Role-Based View */}
      {user.role === 'guru' ? (
        <TeacherView
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      ) : (
        <StudentView
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Terjadi Kendala pada Aplikasi">
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

