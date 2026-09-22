import React, { useState, useEffect, useRef } from 'react';
import { MediaStore } from '../lib/mediaStore';
import {
  Video,
  Image as ImageIcon,
  Play,
  AlertCircle,
  RefreshCw,
  Upload,
  Film,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';

interface EvidenceViewerProps {
  evidenceUrl?: string | null;
  thumbnailUrl?: string | null;
  evidenceType?: 'video' | 'foto' | 'none' | string;
  className?: string;
  autoPlay?: boolean;
  onUpdateEvidence?: (newUrl: string, newThumbnail?: string | null) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceUrl,
  thumbnailUrl,
  evidenceType = 'video',
  className = 'w-full max-h-72 object-contain',
  autoPlay = false,
  onUpdateEvidence
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);
  const [videoCodecError, setVideoCodecError] = useState(false);
  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDriveOrYouTube = MediaStore.isExternalVideoLink(evidenceUrl) || MediaStore.isExternalVideoLink(resolvedUrl);

  const loadMedia = async () => {
    setHasError(false);
    setVideoCodecError(false);

    if (!evidenceUrl) {
      setResolvedUrl(thumbnailUrl || null);
      return;
    }

    // Jika tautan YouTube / Drive langsung
    if (MediaStore.isExternalVideoLink(evidenceUrl)) {
      setResolvedUrl(evidenceUrl);
      return;
    }

    setLoading(true);
    setDownloadProgress(0);

    try {
      const url = await MediaStore.getMediaUrl(evidenceUrl, (pct) => {
        setDownloadProgress(pct);
      });

      if (url) {
        setResolvedUrl(url);
        setHasError(false);
      } else {
        setResolvedUrl(thumbnailUrl || null);
        if (evidenceUrl.startsWith('idb://')) {
          setHasError(true);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat media:', err);
      setResolvedUrl(thumbnailUrl || null);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [evidenceUrl, thumbnailUrl]);

  useEffect(() => {
    if (isPlaying && videoRef.current && !videoCodecError) {
      videoRef.current.play().catch((e) => {
        console.warn('Auto-play or playback warning:', e);
      });
    }
  }, [isPlaying, resolvedUrl, videoCodecError]);

  // Handle penggantian / unggah video ulang jika video lama hilang
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateEvidence) return;

    setIsUploadingReplacement(true);
    try {
      const mediaId = `media_replace_${Date.now()}`;
      await MediaStore.saveMedia(mediaId, file);
      const thumb = await MediaStore.generateVideoThumbnail(file);
      await MediaStore.uploadToFirestoreChunks(mediaId, file);

      const newIdbUrl = `idb://${mediaId}`;
      onUpdateEvidence(newIdbUrl, thumb);
      setResolvedUrl(URL.createObjectURL(file));
      setHasError(false);
      setVideoCodecError(false);
      setIsPlaying(true);
    } catch (err) {
      console.error('Gagal mengunggah video pengganti:', err);
    } finally {
      setIsUploadingReplacement(false);
    }
  };

  if (!evidenceUrl && !thumbnailUrl) {
    return (
      <div className="w-full py-6 flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
        <Film className="w-8 h-8 mb-1 opacity-50" />
        <p className="text-xs font-medium">Tidak ada lampiran bukti gerakan</p>
      </div>
    );
  }

  const isVideo =
    evidenceType === 'video' ||
    (!evidenceType && (evidenceUrl?.endsWith('.mp4') || evidenceUrl?.includes('video') || isDriveOrYouTube));

  // TAMPILAN VIDEO
  if (isVideo) {
    // 1. Jika pengguna adalah tautan Google Drive atau YouTube
    if (isDriveOrYouTube) {
      const embedUrl = MediaStore.formatExternalVideoEmbedUrl(evidenceUrl || resolvedUrl);
      const rawUrl = evidenceUrl || resolvedUrl || '';
      return (
        <div className="space-y-2 w-full">
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Bukti Video Gerakan"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-xs">
                Tautan video eksternal
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tautan Cloud Video</span>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-[11px] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka di Google Drive / Tab Baru</span>
            </a>
          </div>
        </div>
      );
    }

    // 2. Jika sedang proses unduh/ekstraksi chunks video dari cloud
    if (loading) {
      return (
        <div className="relative w-full aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-100">Memuat Rekaman Video...</p>
          <p className="text-xs text-slate-400 mt-1">Mengunduh dari Cloud Database ({downloadProgress}%)</p>
          <div className="w-48 bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(8, downloadProgress)}%` }}
            />
          </div>
        </div>
      );
    }

    // 3. Jika browser tidak mendukung pemutaran langsung (misal video iPhone HEVC/MOV di Chrome Windows)
    if (videoCodecError && resolvedUrl) {
      return (
        <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col items-center justify-center text-center border border-slate-800">
          {thumbnailUrl ? (
            <div className="relative w-full max-h-48 rounded-xl overflow-hidden mb-3 border border-slate-800">
              <img
                src={thumbnailUrl}
                alt="Cuplikan Gerakan"
                className="w-full h-full object-cover opacity-75"
              />
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Cuplikan Foto Tetap Tersimpan
              </div>
            </div>
          ) : (
            <Video className="w-10 h-10 text-teal-400 mb-2 opacity-80" />
          )}

          <h5 className="text-xs sm:text-sm font-bold text-slate-100">Video Berhasil Dimuat dari Cloud</h5>
          <p className="text-[11px] text-slate-400 max-w-md mt-1 mb-3.5 leading-relaxed">
            Format rekaman dari ponsel siswa (HEVC / QuickTime .MOV) memerlukan pemutar media eksternal agar dapat diputar di browser ini. Anda dapat langsung membuka atau mengunduhnya:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Video di Tab Baru</span>
            </a>

            <a
              href={resolvedUrl}
              download="bukti-gerakan-siswa.mp4"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Unduh File Video</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setVideoCodecError(false);
                setIsPlaying(true);
              }}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Coba Putar Ulang
            </button>
          </div>
        </div>
      );
    }

    // 4. Jika video siap dan sedang diputar (atau autoplay aktif)
    if (resolvedUrl && !hasError && (isPlaying || autoPlay)) {
      return (
        <div className="space-y-2 w-full">
          <div className="relative w-full bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center">
            <video
              key={resolvedUrl}
              ref={videoRef}
              src={resolvedUrl}
              controls
              playsInline
              autoPlay
              preload="metadata"
              onError={() => {
                console.warn('Video failed to render in HTML5 video tag, activating external player options');
                setVideoCodecError(true);
              }}
              className={className}
            >
              Browser Anda tidak mendukung pemutaran langsung format video ini.
            </video>
          </div>

          {/* Player controls toolbar: Buka Tab Baru & Unduh */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Video className="w-3 h-3 text-teal-500" />
              <span>Rekaman Gerakan Siswa</span>
            </span>
            <div className="flex items-center gap-2">
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Buka video di tab baru untuk tampilan penuh"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Tab Baru</span>
              </a>
              <a
                href={resolvedUrl}
                download="rekaman-gerakan.mp4"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
                title="Simpan file video ke laptop atau HP"
              >
                <Download className="w-3 h-3" />
                <span>Unduh</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    // 5. Jika terjadi kendala pemutaran video lama (video tidak tersimpan di cloud atau sesi kedaluwarsa)
    if (hasError && !resolvedUrl) {
      return (
        <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden p-4 flex flex-col items-center justify-center text-center">
          {thumbnailUrl ? (
            <div className="relative w-full max-h-56 rounded-xl overflow-hidden mb-3 border border-slate-800">
              <img
                src={thumbnailUrl}
                alt="Cuplikan Gerakan"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Cuplikan Gerakan Tersedia
              </div>
            </div>
          ) : (
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
          )}

          <h5 className="text-xs font-bold text-slate-200">Video Rekaman Asli Belum Tersimpan di Cloud</h5>
          <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-3">
            Video ini dikirim saat perangkat dalam keadaan offline atau sebelum sinkronisasi cloud selesai. Cuplikan foto gerakan di atas tetap tersimpan aman.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={loadMedia}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Muat Ulang
            </button>

            {onUpdateEvidence && (
              <label className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                {isUploadingReplacement ? 'Mengunggah...' : 'Unggah Video Baru'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploadingReplacement}
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    // 6. Tampilan awal Thumbnail dengan tombol Play besar
    return (
      <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden group">
        <img
          src={thumbnailUrl || resolvedUrl || ''}
          alt="Cuplikan Video Gerakan"
          className={className}
        />
        <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(true);
              if (!resolvedUrl && evidenceUrl) {
                loadMedia();
              }
            }}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl transition-transform transform hover:scale-110 cursor-pointer"
            title="Putar Video Gerakan"
          >
            <Play className="w-7 h-7 ml-0.5 fill-current" />
          </button>
          <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            Putar Video Bukti Gerakan
          </span>
        </div>
      </div>
    );
  }

  // TAMPILAN FOTO
  return (
    <div className="w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
      <img
        src={resolvedUrl || thumbnailUrl || ''}
        alt="Bukti Foto Gerakan"
        referrerPolicy="no-referrer"
        className={className}
      />
    </div>
  );
};

