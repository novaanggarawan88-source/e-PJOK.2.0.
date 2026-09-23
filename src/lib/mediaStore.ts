/**
 * IndexedDB & Cloud Firestore Media Storage for PJOK Assessment Evidence
 *
 * Mengizinkan penyimpanan video & foto bukti gerakan PJOK secara sinkron
 * antar laptop guru dan HP murid melalui Firestore chunks dan IndexedDB local cache.
 */

import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const DB_NAME = 'pjok_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType = 'video/mp4'): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const MediaStore = {
  /**
   * Menyimpan file/blob secara instan ke IndexedDB lokal
   */
  async saveMedia(id: string, file: Blob | File): Promise<string> {
    try {
      const cleanId = id.replace(/^idb:\/\//, '');
      const database = await openDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(file, cleanId);

        req.onsuccess = () => resolve(`idb://${cleanId}`);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Gagal menyimpan ke IndexedDB, menggunakan ObjectURL fallback:', e);
      return URL.createObjectURL(file);
    }
  },

  /**
   * Mengambil Blob dari IndexedDB lokal
   */
  async getBlobFromIndexedDB(id: string): Promise<Blob | null> {
    try {
      const cleanId = id.replace(/^idb:\/\//, '');
      const database = await openDB();
      return new Promise((resolve) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cleanId);

        req.onsuccess = () => {
          const result = req.result;
          if (result instanceof Blob) {
            resolve(result);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('Gagal membaca IndexedDB:', e);
      return null;
    }
  },

  /**
   * Menghapus media dari IndexedDB dan potongan Firestore
   */
  async deleteMedia(id: string): Promise<void> {
    const cleanId = id.replace(/^idb:\/\//, '');
    try {
      const database = await openDB();
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(cleanId);
    } catch {}

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'evidence_chunks', cleanId));
      } catch {}
    }
  },

  /**
   * Mengunggah potongan (chunks) video ke Firestore agar tersinkronisasi
   * ke laptop guru & HP siswa lain secara cloud.
   * Menggunakan pengunggahan batch concurrent agar selesai dalam hitungan detik.
   */
  async uploadToFirestoreChunks(
    mediaId: string,
    file: Blob | File,
    onProgress?: (percent: number) => void
  ): Promise<boolean> {
    if (!isFirebaseConfigured() || !db) return false;
    const firestore = db;
    try {
      const cleanId = mediaId.replace(/^idb:\/\//, '');
      const CHUNK_SIZE = 450 * 1024; // 450 KB per pecahan
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const mimeType = file.type || 'video/mp4';

      let completedChunks = 0;
      const CONCURRENCY = 4; // 4 parallel uploads to avoid socket exhaustion

      // Prepare chunks array
      const chunkIndexes = Array.from({ length: totalChunks }, (_, i) => i);

      // Worker function to upload chunks in concurrent pool
      const uploadWorker = async () => {
        while (chunkIndexes.length > 0) {
          const i = chunkIndexes.shift();
          if (i === undefined) break;

          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const slice = file.slice(start, end, mimeType);
          const base64Data = await blobToBase64(slice);

          await setDoc(doc(firestore, 'media_chunks', `${cleanId}_${i}`), {
            mediaId: cleanId,
            chunkIndex: i,
            totalChunks,
            mimeType,
            data: base64Data,
            size: slice.size,
            createdAt: new Date().toISOString()
          });

          completedChunks++;
          onProgress?.(Math.round((completedChunks / totalChunks) * 100));
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, totalChunks) }, () => uploadWorker());
      await Promise.all(workers);

      return true;
    } catch (err) {
      console.warn('Firestore video chunk upload error:', err);
      return false;
    }
  },

  /**
   * Mengambil file/blob dari IndexedDB lokal ATAU Cloud Firestore chunks
   * dan mengembalikan Object URL siap diputar di tag <video>.
   * Menggunakan unduhan paralel (concurrent batch) agar video terbuka instan.
   */
  async getMediaUrl(
    id: string,
    onDownloadProgress?: (percent: number) => void
  ): Promise<string | null> {
    if (!id) return null;

    // Jika sudah URL langsung (http, https, data:video, data:image)
    if (
      id.startsWith('http://') ||
      id.startsWith('https://') ||
      id.startsWith('data:video') ||
      id.startsWith('data:image') ||
      id.startsWith('blob:')
    ) {
      return id;
    }

    const blob = await this.getMediaBlob(id, onDownloadProgress);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  },

  /**
   * Mengambil file Blob langsung (untuk unduh, player, atau createObjectURL)
   */
  async getMediaBlob(
    id: string,
    onDownloadProgress?: (percent: number) => void
  ): Promise<Blob | null> {
    if (!id) return null;

    const cleanId = id.replace(/^idb:\/\//, '');

    // 1. Cek IndexedDB perangkat ini dulu
    try {
      const localBlob = await this.getBlobFromIndexedDB(cleanId);
      if (localBlob && localBlob.size > 0) {
        onDownloadProgress?.(100);
        return localBlob;
      }
    } catch (err) {
      console.warn('IndexedDB check failed:', err);
    }

    // 2. Ambil pecahan video dari Firestore Cloud dengan batch paralel
    if (isFirebaseConfigured() && db) {
      const firestore = db;
      try {
        const firstDocRef = doc(firestore, 'media_chunks', `${cleanId}_0`);
        const firstSnap = await getDoc(firstDocRef);
        if (firstSnap.exists()) {
          const firstData = firstSnap.data();
          const totalChunks = Number(firstData.totalChunks) || 1;
          const mimeType = firstData.mimeType || 'video/mp4';

          const chunkBlobs: (Blob | null)[] = new Array(totalChunks).fill(null);
          chunkBlobs[0] = base64ToBlob(firstData.data, mimeType);

          let loadedCount = 1;
          onDownloadProgress?.(Math.round((loadedCount / totalChunks) * 100));

          if (totalChunks > 1) {
            // Batch parallel fetch
            const remainingIndexes = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1);
            const BATCH_SIZE = 6;

            for (let i = 0; i < remainingIndexes.length; i += BATCH_SIZE) {
              const currentBatch = remainingIndexes.slice(i, i + BATCH_SIZE);
              await Promise.all(
                currentBatch.map(async (chunkIdx) => {
                  try {
                    const chunkDoc = await getDoc(doc(firestore, 'media_chunks', `${cleanId}_${chunkIdx}`));
                    if (chunkDoc.exists()) {
                      chunkBlobs[chunkIdx] = base64ToBlob(chunkDoc.data().data, mimeType);
                    }
                  } catch (e) {
                    console.warn(`Chunk ${chunkIdx} fetch error:`, e);
                  } finally {
                    loadedCount++;
                    onDownloadProgress?.(Math.round((loadedCount / totalChunks) * 100));
                  }
                })
              );
            }
          }

          // Cek apakah semua chunk berhasil dimuat
          const validChunks = chunkBlobs.filter((b): b is Blob => b !== null);
          if (validChunks.length === totalChunks) {
            const fullBlob = new Blob(validChunks, { type: mimeType });
            // Cache ke IndexedDB lokal perangkat ini agar klik berikutnya langsung terbuka 0 ms
            await this.saveMedia(cleanId, fullBlob);
            return fullBlob;
          } else if (validChunks.length > 0 && validChunks.length >= Math.floor(totalChunks * 0.9)) {
            // Toleransi jika hanya 1 chunk kecil terakhir bermasalah
            const partialBlob = new Blob(validChunks, { type: mimeType });
            return partialBlob;
          }
        }
      } catch (err) {
        console.warn('Gagal memuat video chunks dari Firestore:', err);
      }
    }

    return null;
  },

  /**
   * Cek apakah URL merupakan tautan video eksternal (Google Drive / YouTube)
   */
  isExternalVideoLink(url?: string | null): boolean {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('youtube.com') || url.includes('youtu.be');
  },

  /**
   * Format tautan embed video Drive atau YouTube agar bisa diputar langsung di iframe
   */
  formatExternalVideoEmbedUrl(url?: string | null): string | null {
    if (!url) return null;
    const clean = url.trim();
    if (clean.includes('drive.google.com')) {
      const match =
        clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        clean.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      if (clean.includes('/view')) {
        return clean.replace('/view', '/preview');
      }
      return clean;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
      }
      return url;
    }
    return null;
  },

  /**
   * Mengekstrak cuplikan (thumbnail) frame video dalam ukuran kecil (~15-25 KB)
   * agar dapat langsung disimpan ke Firestore & dilihat guru/siswa secara instan
   */
  async generateVideoThumbnail(file: File | Blob): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;

        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1, Math.max(0.2, video.duration * 0.1));
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxW = 480;
            const scale = Math.min(1, maxW / (video.videoWidth || 480));
            canvas.width = Math.round((video.videoWidth || 480) * scale);
            canvas.height = Math.round((video.videoHeight || 270) * scale);

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.6);
              URL.revokeObjectURL(objectUrl);
              resolve(thumbUrl);
              return;
            }
          } catch (err) {
            console.warn('Thumbnail generation error:', err);
          }
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }, 3000);
      } catch {
        resolve(null);
      }
    });
  },

  /**
   * Mengompresi foto bukti gerakan jika diunggah dalam ukuran besar
   */
  async compressImage(file: File, maxWidth = 1000, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          resolve(e.target?.result as string);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
};
