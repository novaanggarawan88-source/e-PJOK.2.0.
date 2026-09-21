import React, { useState, useEffect, useRef } from 'react';
import { MediaStore } from '../lib/mediaStore';
import { Video, Image as ImageIcon, Play, AlertCircle, RefreshCw, Upload, Film } from 'lucide-react';

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
  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDriveOrYouTube = MediaStore.isExternalVideoLink(evidenceUrl) || MediaStore.isExternalVideoLink(resolvedUrl);

  const loadMedia = async () => {
    setHasError(false);

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
        // Jika tidak ditemukan di lokal dan bukan URL, tandai butuh pengecekan
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
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.warn('Auto-play blocked or failed:', e);
      });
    }
  }, [isPlaying, resolvedUrl]);

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
      if (embedUrl) {
        return (
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
            <iframe
              src={embedUrl}
              title="Bukti Video Gerakan"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // 2. Jika sedang proses unduh/ekstraksi chunks video dari cloud
    if (loading) {
      return (
        <div className="relative w-full aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-100">Memuat Video Gerakan Siswa...</p>
          <p className="text-xs text-slate-400 mt-1">Mengunduh rekaman dari Cloud Database ({downloadProgress}%)</p>
          <div className="w-48 bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, downloadProgress)}%` }}
            />
          </div>
        </div>
      );
    }

    // 3. Jika video siap dan sedang diputar (atau autoplay aktif)
    if (resolvedUrl && !hasError && (isPlaying || autoPlay)) {
      return (
        <div className="relative w-full bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center">
          <video
            key={resolvedUrl}
            ref={videoRef}
            src={resolvedUrl}
            controls
            playsInline
            autoPlay
            preload="auto"
            onError={() => {
              console.warn('Video failed to render in HTML5 video tag');
              setHasError(true);
            }}
            className={className}
          >
            <source src={resolvedUrl} type="video/mp4" />
            <source src={resolvedUrl} type="video/webm" />
            <source src={resolvedUrl} type="video/quicktime" />
            Browser Anda tidak mendukung pemutaran langsung format video ini.
          </video>
        </div>
      );
    }

    // 4. Jika terjadi kendala pemutaran video lama (video tidak tersimpan di cloud atau sesi kedaluwarsa)
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
            Video ini dikirim sebelum sinkronisasi cloud diaktifkan, atau berada di penyimpanan lokal pengirim. Cuplikan foto gerakan di atas tetap tersimpan aman.
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

    // 5. Tampilan awal Thumbnail dengan tombol Play besar
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
