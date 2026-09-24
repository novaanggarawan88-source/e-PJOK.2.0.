export type UserRole = 'guru' | 'murid';

export interface UserProfile {
  uid: string;
  nama: string;
  email: string;
  username?: string;
  password?: string;
  nip?: string;
  role: UserRole;
  kelas?: string;
  nomorAbsen?: string;
  nis?: string;
  fotoProfil?: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
  updatedAt?: string;
}

export interface AppConfig {
  id?: string;
  appName: string;
  schoolName: string;
  motto: string;
  logoUrl?: string;
  logoIconPreset?: 'activity' | 'trophy' | 'medal' | 'flame' | 'basketball';
  updatedAt?: string;
}

export interface ClassItem {
  id: string;
  nama: string; // e.g. "XI 7", "X 1"
  tingkat: string; // "X", "XI", "XII"
  jurusan?: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
}

export interface ScaleDescriptions {
  1: string; // Default: "Perlu Bimbingan"
  2: string; // Default: "Mulai Berkembang"
  3: string; // Default: "Baik"
  4: string; // Default: "Sangat Baik"
}

export interface IndicatorItem {
  id: string;
  judulPenilaian: string;
  materi: string;
  indikator: string;
  urutan: number;
  status: 'aktif' | 'nonaktif';
  createdBy?: string;
  createdAt: string;
  skala?: ScaleDescriptions;
}

export interface AssessmentTask {
  id: string;
  nama: string; // "Penilaian Antar Teman Passing Bola Basket"
  materi: string; // "Passing Bola Basket"
  kelas: string; // "XI 7" or comma separated/primary label
  targetKelas?: string[]; // Multiple assigned classes, e.g. ["X 1", "X 2"]
  tanggalMulai: string;
  batasWaktu: string;
  instruksi: string;
  indikatorIds: string[];
  jumlahTemanDinilai: number;
  bolehUploadVideo: boolean;
  bolehUploadFoto: boolean;
  wajibBukti: boolean;
  izinkanEdit: boolean;
  status: 'aktif' | 'draft' | 'selesai';
  createdAt: string;
}

export function isTaskAssignedToClass(task: AssessmentTask, studentClass?: string): boolean {
  if (!studentClass) return true;
  const sClass = studentClass.trim().toLowerCase();
  
  if (task.targetKelas && Array.isArray(task.targetKelas) && task.targetKelas.length > 0) {
    return task.targetKelas.some((k) => {
      const lower = k.trim().toLowerCase();
      return lower === sClass || lower === 'semua kelas' || lower === 'all';
    });
  }

  if (!task.kelas) return false;
  const parts = task.kelas.split(/[,;/]+/).map((p) => p.trim().toLowerCase());
  return parts.some((p) => p === sClass || p === 'semua kelas' || p === 'all');
}

export interface IndicatorScore {
  indicatorId: string;
  indicator: string;
  score: number; // 1 - 4
}

export interface AssessmentRecord {
  id: string;
  taskId: string;
  taskTitle?: string;
  materi?: string;
  assessorId: string;
  assessorUserId?: string; // alias
  assessorName: string;
  assessorClass: string;
  targetId: string;
  targetUserId?: string; // alias
  targetName: string;
  targetClass: string;
  evidenceType: 'video' | 'foto' | 'none';
  evidenceUrl?: string | null;
  thumbnailUrl?: string | null;
  evidencePath?: string;
  videoFileSize?: string;
  videoDuration?: number;
  scores: IndicatorScore[];
  feedback: string;
  totalScore?: number;
  averageScore: number;
  finalScore100: number;
  status?: 'submitted' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentSummaryRow {
  studentId: string;
  nama: string;
  nis: string;
  kelas: string;
  noAbsen: string;
  jumlahPenilaianDiterima: number;
  jumlahPenilaianDiberikan: number;
  averageScore: number; // Skala 1 - 4
  finalScore100: number; // Skala 0 - 100
  statusPengerjaan: 'selesai' | 'sebagian' | 'belum';
}

export interface IndicatorAnalytics {
  indicatorId: string;
  indicator: string;
  rataRata: number;
  jumlahPenilai: number;
  distribusi: { [key: number]: number };
}

export interface QuizItem {
  id: string;
  judul: string;
  materi: string;
  kelas: string; // "Semua Kelas" or specific e.g. "XI 7"
  linkUrl: string; // URL ke kuis (Google Form, Quizizz, Wordwall, CBT, dll)
  status: 'buka' | 'kunci'; // status kunci akses: 'buka' (aktif) | 'kunci' (terkunci oleh guru)
  kodeKunci?: string; // PIN atau Kunci akses kuis (opsional, jika guru ingin membagikan di kelas)
  tanggalMulai?: string; // Tanggal & waktu mulai kuis
  batasWaktu?: string; // Batas waktu selesai kuis
  durasiMenit?: number; // Durasi pengerjaan dalam menit
  instruksi?: string; // Petunjuk guru
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentNoAbsen?: string;
  submittedAt: string;
  status: 'selesai';
}

export interface MaterialLinkItem {
  id: string;
  judul: string; // Label tautan, misal: "AppScript Latihan", "Formulir Refleksi", "Modul PDF"
  url: string; // Tautan URL lengkap
}

export interface MaterialColumnItem {
  id: string;
  judulKolom: string; // Nama kolom, misal: "Petunjuk Gerak", "Rangkuman Teknik", "Tugas Mandiri"
  isi: string; // Konten penjelasan materi
}

export interface MaterialItem {
  id: string;
  judul: string;
  materi: string; // Topik/bab PJOK, misal: "Permainan Bola Besar (Bola Voli)", "Kebugaran Jasmani"
  kategori: string; // "Google Apps Script / Web App", "Video Pembelajaran", "Slide / PPT", "Modul / PDF", "Artikel / Web"
  kelas: string; // "Semua Kelas" or specific e.g. "XI 7"
  linkUrl: string; // URL link utama (YouTube embed, Google Apps Script, Google Drive, Canva, Web, PDF)
  linkTambahan?: MaterialLinkItem[]; // Daftar kolom tautan link tambahan (bisa banyak AppScript / web)
  kolomMateriTambahan?: MaterialColumnItem[]; // Daftar kolom konten materi tambahan dinamis
  status: 'buka' | 'kunci'; // 'buka' = bisa langsung dipelajari, 'kunci' = butuh PIN
  kodeKunci?: string; // PIN kunci akses materi opsional
  deskripsi?: string; // Ringkasan singkat materi
  instruksi?: string; // Arahan belajar dari guru PJOK
  durasiEstimasi?: number; // Estimasi waktu belajar dalam menit (misal 15-30 menit)
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MaterialProgress {
  id: string;
  materialId: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  completedAt: string;
}

export interface AnswerItem {
  soalIndex: number;
  pertanyaan: string;
  jawaban: string;
}

export interface LearningTaskItem {
  id: string;
  judul: string;
  materi: string; // Topik bab, misal "Permainan Bola Besar (Bola Basket)", "Kebugaran Jasmani"
  kelas: string; // Ringkasan kelas target (misal: "XI 7, XI 8" atau "Semua Kelas")
  targetClasses?: string[]; // Daftar kelas yang dipilih guru (bisa lebih dari 1 kelas)
  deskripsi: string;
  instruksi: string[];
  daftarSoal?: string[]; // Butir-butir soal yang dibuat oleh guru untuk dijawab langsung oleh murid
  batasWaktu: string;
  status: 'aktif' | 'draf' | 'selesai';
  lampiranUrl?: string; // Tautan LKPD / Google Drive / Modul Guru
  lampiranNama?: string;
  tipePengumpulan: 'langsung' | 'upload' | 'keduanya' | 'teks_dan_link' | 'file_foto_video' | 'semua';
  disableCopyPaste?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LearningTaskSubmission {
  id: string;
  taskId: string;
  taskJudul?: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentNoAbsen?: string;
  catatanJawaban: string; // Jawaban umum atau ringkasan
  jawabanSoal?: AnswerItem[]; // Jawaban terstruktur per butir soal
  linkLampiran?: string;
  fileBuktiUrl?: string;
  fileBuktiNama?: string;
  submittedAt: string;
  status: 'terkirim' | 'dinilai';
  nilai?: number;
  catatanGuru?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // recipient student/user UID or 'all' or 'class:XI 7'
  title: string;
  message: string;
  type: 'tugas_baru' | 'umpan_balik' | 'nilai_baru' | 'info';
  linkTarget?: string; // e.g. 'tasks', 'history', 'learning_tasks', 'quizzes'
  referenceId?: string; // taskId or assessmentId
  read: boolean;
  senderName?: string;
  createdAt: string;
}

