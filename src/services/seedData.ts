import { UserProfile, ClassItem, IndicatorItem, AssessmentTask, AssessmentRecord, AppConfig } from '../types';

export const INITIAL_APP_CONFIG: AppConfig = {
  id: 'app_config',
  appName: 'e-PJOK',
  schoolName: 'SMA NEGERI 1 TEJAKULA',
  motto: 'Sportif, Jujur, dan Menghargai Gerak Teman',
  logoIconPreset: 'activity',
  logoUrl: '',
  updatedAt: new Date().toISOString()
};

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'class-xi-7', nama: 'XI 7', tingkat: 'XI', jurusan: 'MIPA', status: 'aktif' },
  { id: 'class-xi-1', nama: 'XI 1', tingkat: 'XI', jurusan: 'MIPA', status: 'aktif' },
  { id: 'class-xi-2', nama: 'XI 2', tingkat: 'XI', jurusan: 'IPS', status: 'aktif' },
  { id: 'class-x-1', nama: 'X 1', tingkat: 'X', jurusan: 'Umum', status: 'aktif' },
  { id: 'class-xii-1', nama: 'XII 1', tingkat: 'XII', jurusan: 'MIPA', status: 'aktif' },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'guru-nova',
    nama: 'Nova Anggarawan (Guru PJOK)',
    email: 'novaanggarawan88@gmail.com',
    password: 'guru123',
    role: 'guru',
    nip: '198501152010011005',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'guru-1',
    nama: 'Guru PJOK',
    email: 'guru@pjok.sch.id',
    password: 'guru123',
    role: 'guru',
    nip: '198501152010011005',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'guru-2',
    nama: 'Guru PJOK (ianggarawan51)',
    email: 'ianggarawan51@guru.smk.belajar.id',
    password: 'guru123',
    role: 'guru',
    nip: '198805202014021003',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-1001',
    nama: 'Andi Pratama',
    nis: '1001',
    kelas: 'XI 7',
    nomorAbsen: '01',
    email: 'andi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-1002',
    nama: 'Budi Santoso',
    nis: '1002',
    kelas: 'XI 7',
    nomorAbsen: '02',
    email: 'budi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-1003',
    nama: 'Citra Lestari',
    nis: '1003',
    kelas: 'XI 7',
    nomorAbsen: '03',
    email: 'citra@pjok.sch.id',
    password: '123456',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-1004',
    nama: 'Dewi Anggraini',
    nis: '1004',
    kelas: 'XI 7',
    nomorAbsen: '04',
    email: 'dewi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-1005',
    nama: 'Eko Prasetyo',
    nis: '1005',
    kelas: 'XI 7',
    nomorAbsen: '05',
    email: 'eko@pjok.sch.id',
    password: '123456',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  }
];

export const INITIAL_INDICATORS: IndicatorItem[] = [
  {
    id: 'ind-1',
    judulPenilaian: 'Teknik Passing Bola Basket',
    materi: 'Passing Bola Basket',
    indikator: '1. Sikap awal (posisi tubuh siap, seimbang, dan lutut sedikit ditekuk)',
    urutan: 1,
    status: 'aktif',
    createdAt: '2026-09-10T08:00:00.000Z',
    skala: {
      1: 'Perlu Bimbingan (Kaki kaku, tubuh tegak tanpa persiapan)',
      2: 'Mulai Berkembang (Lutut ditekuk namun keseimbangan kurang stabil)',
      3: 'Baik (Sikap tubuh seimbang, kaki selebar bahu)',
      4: 'Sangat Baik (Sikap sempurna, rileks, siap menerima & memantul)'
    }
  },
  {
    id: 'ind-2',
    judulPenilaian: 'Teknik Passing Bola Basket',
    materi: 'Passing Bola Basket',
    indikator: '2. Posisi kedua tangan memegang bola di depan dada dengan jari terbuka',
    urutan: 2,
    status: 'aktif',
    createdAt: '2026-09-10T08:00:00.000Z',
    skala: {
      1: 'Perlu Bimbingan (Pegang bola tidak pas, jari merapat)',
      2: 'Mulai Berkembang (Pegang bola di depan dada tapi siku melebar)',
      3: 'Baik (Kedua tangan memegang bola tepat di depan dada)',
      4: 'Sangat Baik (Pegang mantap, jari merekah, siku dekat badan)'
    }
  },
  {
    id: 'ind-3',
    judulPenilaian: 'Teknik Passing Bola Basket',
    materi: 'Passing Bola Basket',
    indikator: '3. Gerakan mendorong bola lurus ke depan dengan meluruskan siku',
    urutan: 3,
    status: 'aktif',
    createdAt: '2026-09-10T08:00:00.000Z',
    skala: {
      1: 'Perlu Bimbingan (Dorongan lemah atau bola melambung tinggi)',
      2: 'Mulai Berkembang (Dorongan cukup namun arah bola kurang datar)',
      3: 'Baik (Dorongan kuat dan terarah lurus ke dada kawan)',
      4: 'Sangat Baik (Dorongan cepat, bertenaga, pergelangan tangan lentur)'
    }
  },
  {
    id: 'ind-4',
    judulPenilaian: 'Teknik Passing Bola Basket',
    materi: 'Passing Bola Basket',
    indikator: '4. Arah pandangan fokus tertuju ke dada teman target operan',
    urutan: 4,
    status: 'aktif',
    createdAt: '2026-09-10T08:00:00.000Z',
    skala: {
      1: 'Perlu Bimbingan (Pandangan melihat lantai atau bola)',
      2: 'Mulai Berkembang (Melihat target namun sering teralihkan)',
      3: 'Baik (Fokus melihat target operan dengan jelas)',
      4: 'Sangat Baik (Kontak mata mantap dan membaca posisi teman sasaran)'
    }
  },
  {
    id: 'ind-5',
    judulPenilaian: 'Teknik Passing Bola Basket',
    materi: 'Passing Bola Basket',
    indikator: '5. Gerakan lanjutan (follow through) kedua telapak tangan menghadap keluar',
    urutan: 5,
    status: 'aktif',
    createdAt: '2026-09-10T08:00:00.000Z',
    skala: {
      1: 'Perlu Bimbingan (Tidak ada follow through setelah lepas bola)',
      2: 'Mulai Berkembang (Tangan terlurus tapi telapak belum memutar)',
      3: 'Baik (Kedua lengan lurus, telapak tangan menghadap keluar)',
      4: 'Sangat Baik (Lengan rileks lurus sempurna, ibu jari menghadap ke bawah)'
    }
  }
];

export const INITIAL_TASKS: AssessmentTask[] = [];

export const INITIAL_ASSESSMENTS: AssessmentRecord[] = [];

export const INITIAL_QUIZZES: any[] = [];

export const INITIAL_MATERIALS: any[] = [];

export const INITIAL_LEARNING_TASKS: any[] = [];



