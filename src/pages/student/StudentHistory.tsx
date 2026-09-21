import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { AssessmentRecord, AssessmentTask } from '../../types';
import { EvidenceViewer } from '../../components/EvidenceViewer';
import {
  History,
  Award,
  Send,
  Inbox,
  Calendar,
  Image,
  Video,
  Edit3,
  Eye,
  X,
  MessageSquareQuote,
  Star
} from 'lucide-react';

interface StudentHistoryProps {
  onEditAssessment?: (record: AssessmentRecord, task: AssessmentTask) => void;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ onEditAssessment }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'given' | 'received'>('received');
  const [assessmentsGiven, setAssessmentsGiven] = useState<AssessmentRecord[]>([]);
  const [assessmentsReceived, setAssessmentsReceived] = useState<AssessmentRecord[]>([]);
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [allRecords, allTasks] = await Promise.all([
      DatabaseService.getAssessments(),
      DatabaseService.getTasks()
    ]);

    setTasks(allTasks);

    // Given by this user
    const given = allRecords.filter(
      (r) =>
        r.assessorUserId === user.uid ||
        r.assessorName.toLowerCase() === user.nama.toLowerCase()
    );
    setAssessmentsGiven(given);

    // Received by this user
    const received = allRecords.filter(
      (r) =>
        r.targetUserId === user.uid ||
        r.targetName.toLowerCase() === user.nama.toLowerCase()
    );
    setAssessmentsReceived(received);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Overall average received
  const avgReceived =
    assessmentsReceived.length > 0
      ? (
          assessmentsReceived.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
          assessmentsReceived.length
        ).toFixed(2)
      : '0.00';

  const score100Received = Math.round((Number(avgReceived) / 4) * 100);

  const handleUpdateEvidence = async (newUrl: string, newThumbnail?: string | null) => {
    if (!selectedRecord) return;
    const updated = {
      ...selectedRecord,
      evidenceUrl: newUrl,
      thumbnailUrl: newThumbnail || selectedRecord.thumbnailUrl,
      updatedAt: new Date().toISOString()
    };
    await DatabaseService.saveAssessment(updated);
    setSelectedRecord(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
          Riwayat Penilaian & Umpan Balik
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Pantau hasil evaluasi performa gerak yang kamu terima dan arsip penilaian yang telah kamu berikan
        </p>
      </div>

      {/* Received Average Badge Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Capaian Nilai Akhir yang Kamu Terima
            </h3>
            <p className="text-xs text-slate-400">
              Berdasarkan {assessmentsReceived.length} penilaian dari teman sekelasmu
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 self-end sm:self-center">
          <span className="text-2xl sm:text-3xl font-black text-blue-600 font-heading">
            {avgReceived}
          </span>
          <span className="text-xs font-semibold text-slate-400">/ 4.00</span>
          <span className="ml-2 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold">
            Konversi: {score100Received} / 100
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Diterima ({assessmentsReceived.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('given')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'given'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Diberikan ({assessmentsGiven.length})</span>
        </button>
      </div>

      {/* Tab Content: Penilaian yang Saya Terima */}
      {activeTab === 'received' && (
        <div className="space-y-3 sm:space-y-4">
          {assessmentsReceived.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-slate-200 text-slate-400 text-sm">
              Belum ada penilaian yang masuk dari teman sekelasmu.
            </div>
          ) : (
            assessmentsReceived.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                      {item.assessorName.charAt(0)}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Dinilai oleh: <span className="text-blue-700">{item.assessorName}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.taskTitle || 'Praktik PJOK'} &bull;{' '}
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl">
                      Skor: {item.averageScore} / 4 ({item.finalScore100})
                    </span>
                    <button
                      onClick={() => setSelectedRecord(item)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Box */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 italic">
                  <span className="font-bold text-slate-900 not-italic block mb-0.5 text-xs">
                    Masukan dari Teman:
                  </span>
                  &ldquo;{item.feedback}&rdquo;
                </div>

                {/* Evidence chip */}
                {item.evidenceUrl && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {item.evidenceType === 'video' ? (
                      <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        <Video className="w-3 h-3" /> Ada lampiran rekaman video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        <Image className="w-3 h-3" /> Ada lampiran foto bukti
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Penilaian yang Saya Berikan */}
      {activeTab === 'given' && (
        <div className="space-y-3 sm:space-y-4">
          {assessmentsGiven.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-slate-200 text-slate-400 text-sm">
              Kamu belum memberikan penilaian kepada teman sekelas.
            </div>
          ) : (
            assessmentsGiven.map((item) => {
              const taskRef = tasks.find((t) => t.id === item.taskId);
              const canEdit = taskRef ? taskRef.izinkanEdit && taskRef.status === 'aktif' : false;

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                        {item.targetName.charAt(0)}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Menilai teman: <span className="text-blue-700">{item.targetName}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.taskTitle || 'Praktik PJOK'} &bull;{' '}
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                        Skor Diberikan: {item.averageScore} / 4
                      </span>

                      {canEdit && onEditAssessment && taskRef && (
                        <button
                          onClick={() => onEditAssessment(item, taskRef)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic">
                    &ldquo;{item.feedback}&rdquo;
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Rincian Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base font-heading">
                Detail Penilaian Antar Teman
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">PENILAI</span>
                  <strong className="text-slate-800">{selectedRecord.assessorName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">YANG DINILAI</span>
                  <strong className="text-blue-700">{selectedRecord.targetName}</strong>
                </div>
              </div>

              {/* Indicator scores */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Skor Per Indikator Gerak:
                </h4>
                <div className="space-y-2">
                  {selectedRecord.scores.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-800 font-medium">{s.indicator}</span>
                      <span className="font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                        {s.score} / 4
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Masukan:
                </h4>
                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs text-amber-950 italic">
                  &ldquo;{selectedRecord.feedback}&rdquo;
                </div>
              </div>

              {/* Evidence */}
              {(selectedRecord.evidenceUrl || selectedRecord.thumbnailUrl) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Lampiran Bukti Gerakan ({selectedRecord.evidenceType?.toUpperCase() || 'VIDEO'}):
                    </h4>
                    {selectedRecord.videoFileSize && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {selectedRecord.videoFileSize}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 max-h-60 flex items-center justify-center">
                    <EvidenceViewer
                      evidenceUrl={selectedRecord.evidenceUrl}
                      thumbnailUrl={selectedRecord.thumbnailUrl}
                      evidenceType={selectedRecord.evidenceType}
                      className="w-full max-h-60 object-contain"
                      onUpdateEvidence={handleUpdateEvidence}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
