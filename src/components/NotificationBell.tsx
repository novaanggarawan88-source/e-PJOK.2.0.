import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService, subscribeToDataChanges } from '../services/db';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Award,
  MessageCircle,
  Info,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';

interface NotificationBellProps {
  onNavigateTab?: (target: string) => void;
}

/**
 * Memutar nada notifikasi halus (gentle chime) menggunakan Web Audio API tanpa butuh file eksternal
 */
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Suara nada dua tingkatan (ding-dong ramah)
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(587.33, 0, 0.18); // D5
    playTone(880.00, 0.12, 0.35); // A5
  } catch {}
};

function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffSeconds = Math.floor((now - then) / 1000);

    if (diffSeconds < 60) return 'Baru saja';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'Baru saja';
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  const prevCountRef = useRef<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!currentUser) return;
    const list = await DatabaseService.getNotifications(currentUser.uid, currentUser.kelas);
    setNotifications(list);

    // Deteksi jika ada notifikasi unread baru yang masuk saat aplikasi aktif
    const unreadList = list.filter((n) => !n.read);
    if (unreadList.length > prevCountRef.current && prevCountRef.current !== 0) {
      const newest = unreadList[0];
      if (newest) {
        setLatestToast(newest);
        playNotificationSound();
        setTimeout(() => setLatestToast(null), 4500);
      }
    }
    prevCountRef.current = unreadList.length;
  };

  useEffect(() => {
    loadNotifications();
    const unsub = subscribeToDataChanges(loadNotifications);
    return () => unsub();
  }, [currentUser]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredList = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAsRead = async (notif: AppNotification) => {
    if (!notif.read) {
      await DatabaseService.markNotificationAsRead(notif.id);
    }
    if (notif.linkTarget && onNavigateTab) {
      onNavigateTab(notif.linkTarget);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await DatabaseService.markAllNotificationsAsRead(currentUser.uid, currentUser.kelas);
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await DatabaseService.deleteNotification(id);
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'tugas_baru':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
        );
      case 'umpan_balik':
      case 'nilai_baru':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toast Alert Pop-up saat ada notifikasi baru */}
      {latestToast && (
        <div className="fixed top-18 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 animate-ping"></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{latestToast.title}</p>
            <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">{latestToast.message}</p>
          </div>
          <button
            onClick={() => setLatestToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-hidden transition-colors cursor-pointer"
        aria-label="Pemberitahuan Notifikasi"
        title="Pemberitahuan & Alert"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
                Pemberitahuan
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredList.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada pemberitahuan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Alert tugas baru dari guru atau penilaian teman akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${
                    !notif.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {getNotifIcon(notif.type)}

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.senderName && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400">
                        Dari: {notif.senderName}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 self-center">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotif(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-opacity cursor-pointer"
                      title="Hapus pemberitahuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
