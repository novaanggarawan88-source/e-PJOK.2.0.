import React, { useState } from 'react';
import { Sidebar, TeacherMenu } from '../components/Sidebar';
import { TeacherDashboard } from './teacher/TeacherDashboard';
import { StudentManagement } from './teacher/StudentManagement';
import { ClassManagement } from './teacher/ClassManagement';
import { IndicatorManagement } from './teacher/IndicatorManagement';
import { TaskManagement } from './teacher/TaskManagement';
import { AssessmentResults } from './teacher/AssessmentResults';
import { RecapScores } from './teacher/RecapScores';
import { Analytics } from './teacher/Analytics';
import { SettingsPage } from './teacher/SettingsPage';
import { QuizManagement } from './teacher/QuizManagement';
import { MaterialManagement } from './teacher/MaterialManagement';
import { LearningTaskManagement } from './teacher/LearningTaskManagement';
import { AssessmentRecord } from '../types';

interface TeacherViewProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  isSidebarOpen,
  onCloseSidebar
}) => {
  const [currentMenu, setCurrentMenu] = useState<TeacherMenu>('dashboard');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AssessmentRecord | null>(null);

  const handleOpenDetail = (record: AssessmentRecord) => {
    setSelectedRecordForDetail(record);
    setCurrentMenu('results');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] flex">
      {/* Teacher Sidebar (Locked & Fixed on Left) */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => {
          setCurrentMenu(menu);
          setSelectedRecordForDetail(null);
        }}
        isOpen={isSidebarOpen}
        onClose={onCloseSidebar}
      />

      {/* Spacer so main content is not hidden behind the fixed sidebar on desktop */}
      <div className="hidden lg:block w-64 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
        {currentMenu === 'dashboard' && (
          <TeacherDashboard
            onNavigate={setCurrentMenu}
            onOpenAssessmentDetail={handleOpenDetail}
          />
        )}
        {currentMenu === 'students' && <StudentManagement />}
        {currentMenu === 'classes' && <ClassManagement />}
        {currentMenu === 'indicators' && (
          <IndicatorManagement onBack={() => setCurrentMenu('tasks')} />
        )}
        {currentMenu === 'tasks' && (
          <TaskManagement onNavigateIndicators={() => setCurrentMenu('indicators')} />
        )}
        {currentMenu === 'materials' && <MaterialManagement />}
        {currentMenu === 'learning-tasks' && <LearningTaskManagement />}
        {currentMenu === 'quizzes' && <QuizManagement />}
        {currentMenu === 'results' && (
          <AssessmentResults
            initialSelectedRecord={selectedRecordForDetail}
            onClearInitialSelected={() => setSelectedRecordForDetail(null)}
          />
        )}
        {currentMenu === 'recap' && <RecapScores />}
        {currentMenu === 'analytics' && <Analytics />}
        {currentMenu === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
};
