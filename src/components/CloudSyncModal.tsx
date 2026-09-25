import React, { useState } from 'react';
import { DatabaseService } from '../services/db';
import {
  X,
  RefreshCw,
  Download,
  Upload,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  ShieldCheck,
  FileJson
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await DatabaseService.syncAllLocalDataToCloud();
      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        onDataChanged?.();
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal sinkronisasi: ' + (e?.message || 'Terjadi kendala jaringan.')
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const jsonStr = DatabaseService.exportAllDataAsJSON();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cadangan_epjok_lengkap_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMsg({
        type: 'success',
        text: 'Berkas cadangan .json berhasil diunduh ke perangkat Anda!'
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mengunduh: ' + (e?.message || 'Terjadi kesalahan.')
      });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const res = DatabaseService.importAllDataFromJSON(text);
        if (res.success) {
          setStatusMsg({ type: 'success', text: res.message });
          onDataChanged?.();
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Sinkronisasi Data (Laptop ↔ HP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Solusi jika data di HP belum sesuai dengan di Laptop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Kenapa data di HP belum muncul sama dengan di Laptop?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800/90 dark:text-amber-300/90">
              Saat kuota harian cloud Firestore gratis sempat penuh, data yang Anda buat di laptop <strong>diamankan ke memori browser laptop</strong> agar tidak hilang. Karena berada di laptop, perangkat HP perlu disinkronkan kembali.
            </p>
          </div>

          {/* Feedback Status Alert */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Option 1: File Backup & Transfer (Fastest & Guaranteed) */}
          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  Cara 1: Salin Berkas Cadangan (Pasti Berhasil & 1 Detik)
                </span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Bebas Kuota Cloud
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Unduh berkas cadangan dari Laptop, lalu kirim ke WhatsApp Anda dan pasang di HP. 100% data 300 siswa, kelas, tugas, dan nilai langsung berpindah utuh.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Laptop className="w-4 h-4" />
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Cadangan (.json)</span>
              </button>

              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer shadow-xs">
                <Smartphone className="w-4 h-4" />
                <Upload className="w-3.5 h-3.5" />
                <span>Pasang di HP (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Option 2: Cloud Sync (If quota has reset) */}
          <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-extrabold text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  Cara 2: Sinkronkan ke Firebase Cloud
                </span>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Otomatis Antar Perangkat
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Jika kuota gratis Firebase telah direset oleh Google (pukul 07.00 WIB setiap hari), klik tombol di bawah dari Laptop untuk mengunggah semua data ke Cloud. Setelah itu HP akan otomatis terbarui.
            </p>

            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sedang Mengunggah ke Cloud...' : 'Sinkronkan Data Laptop ke Cloud Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Data 300 siswa & nilai tetap aman</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
