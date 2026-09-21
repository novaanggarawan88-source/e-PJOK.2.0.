import { UserProfile, ClassItem, IndicatorItem, AssessmentTask, AssessmentRecord, AppConfig } from '../types';

export const INITIAL_APP_CONFIG: AppConfig = {
  id: 'app_config',
  appName: 'e-PJOK',
  schoolName: 'SMK / SMA PJOK',
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
    uid: 'murid-1',
    nama: 'Andi Pratama',
    email: 'andi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    kelas: 'XI 7',
    nomorAbsen: '01',
    nis: '1001',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-2',
    nama: 'Budi Santoso',
    email: 'budi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    kelas: 'XI 7',
    nomorAbsen: '02',
    nis: '1002',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-3',
    nama: 'Citra Lestari',
    email: 'citra@pjok.sch.id',
    password: '123456',
    role: 'murid',
    kelas: 'XI 7',
    nomorAbsen: '03',
    nis: '1003',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-4',
    nama: 'Dewi Anggraini',
    email: 'dewi@pjok.sch.id',
    password: '123456',
    role: 'murid',
    kelas: 'XI 7',
    nomorAbsen: '04',
    nis: '1004',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-5',
    nama: 'Eka Saputra',
    email: 'eka@pjok.sch.id',
    password: '123456',
    role: 'murid',
    kelas: 'XI 7',
    nomorAbsen: '05',
    nis: '1005',
    status: 'aktif',
    fotoProfil: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
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

export const INITIAL_TASKS: AssessmentTask[] = [
  {
    id: 'task-1',
    nama: 'Penilaian Antar Teman Passing Bola Basket',
    materi: 'Passing Bola Basket',
    kelas: 'XI 7',
    tanggalMulai: '2026-09-15',
    batasWaktu: '2026-09-30',
    instruksi: 'Amati gerakan passing bola basket (chest pass) teman dengan teliti. Berikan penilaian objektif berdasarkan 5 indikator teknis yang telah ditentukan. Berikan masukan yang santun, jelas, dan membangun untuk kemajuan temanmu.',
    indikatorIds: ['ind-1', 'ind-2', 'ind-3', 'ind-4', 'ind-5'],
    jumlahTemanDinilai: 2,
    bolehUploadVideo: true,
    bolehUploadFoto: true,
    wajibBukti: false,
    izinkanEdit: true,
    status: 'aktif',
    createdAt: '2026-09-15T08:30:00.000Z'
  }
];

export const INITIAL_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: 'asm-1',
    taskId: 'task-1',
    taskTitle: 'Penilaian Antar Teman Passing Bola Basket',
    materi: 'Passing Bola Basket',
    assessorId: 'murid-1',
    assessorName: 'Andi Pratama',
    assessorClass: 'XI 7',
    targetId: 'murid-2',
    targetName: 'Budi Santoso',
    targetClass: 'XI 7',
    evidenceType: 'foto',
    evidenceUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
    evidencePath: '/assessment-evidence/task-1/murid-1/budi_chestpass.jpg',
    scores: [
      { indicatorId: 'ind-1', indicator: 'Sikap awal', score: 4 },
      { indicatorId: 'ind-2', indicator: 'Posisi tangan', score: 3 },
      { indicatorId: 'ind-3', indicator: 'Dorongan bola', score: 3 },
      { indicatorId: 'ind-4', indicator: 'Arah pandangan', score: 4 },
      { indicatorId: 'ind-5', indicator: 'Gerakan lanjutan', score: 3 }
    ],
    feedback: 'Gerakan Budi sudah mantap dan operannya sampai tepat di dada. Catatan sedikit: pergelangan tangan saat follow through dorongannya bisa lebih ditekuk agar laju bola lebih cepat.',
    totalScore: 17,
    averageScore: 3.4,
    finalScore100: 85,
    status: 'submitted',
    createdAt: '2026-09-18T09:15:00.000Z',
    updatedAt: '2026-09-18T09:15:00.000Z'
  },
  {
    id: 'asm-2',
    taskId: 'task-1',
    taskTitle: 'Penilaian Antar Teman Passing Bola Basket',
    materi: 'Passing Bola Basket',
    assessorId: 'murid-3',
    assessorName: 'Citra Lestari',
    assessorClass: 'XI 7',
    targetId: 'murid-2',
    targetName: 'Budi Santoso',
    targetClass: 'XI 7',
    evidenceType: 'foto',
    evidenceUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=600&auto=format&fit=crop&q=80',
    evidencePath: '/assessment-evidence/task-1/murid-3/budi_form.jpg',
    scores: [
      { indicatorId: 'ind-1', indicator: 'Sikap awal', score: 4 },
      { indicatorId: 'ind-2', indicator: 'Posisi tangan', score: 4 },
      { indicatorId: 'ind-3', indicator: 'Dorongan bola', score: 4 },
      { indicatorId: 'ind-4', indicator: 'Arah pandangan', score: 3 },
      { indicatorId: 'ind-5', indicator: 'Gerakan lanjutan', score: 4 }
    ],
    feedback: 'Bagus sekali passingnya kencang dan lurus! Tinggal lebih percaya diri pandangannya tidak melirik ke samping sebelum mengoper.',
    totalScore: 19,
    averageScore: 3.8,
    finalScore100: 95,
    status: 'submitted',
    createdAt: '2026-09-19T10:45:00.000Z',
    updatedAt: '2026-09-19T10:45:00.000Z'
  },
  {
    id: 'asm-3',
    taskId: 'task-1',
    taskTitle: 'Penilaian Antar Teman Passing Bola Basket',
    materi: 'Passing Bola Basket',
    assessorId: 'murid-2',
    assessorName: 'Budi Santoso',
    assessorClass: 'XI 7',
    targetId: 'murid-1',
    targetName: 'Andi Pratama',
    targetClass: 'XI 7',
    evidenceType: 'none',
    evidenceUrl: '',
    evidencePath: '',
    scores: [
      { indicatorId: 'ind-1', indicator: 'Sikap awal', score: 3 },
      { indicatorId: 'ind-2', indicator: 'Posisi tangan', score: 3 },
      { indicatorId: 'ind-3', indicator: 'Dorongan bola', score: 4 },
      { indicatorId: 'ind-4', indicator: 'Arah pandangan', score: 4 },
      { indicatorId: 'ind-5', indicator: 'Gerakan lanjutan', score: 3 }
    ],
    feedback: 'Tenaga dorongan Andi sangat baik. Posisi lutut saat sikap awal bisa lebih ditekuk sedikit agar tolakan dari kaki lebih maksimal.',
    totalScore: 17,
    averageScore: 3.4,
    finalScore100: 85,
    status: 'submitted',
    createdAt: '2026-09-20T11:20:00.000Z',
    updatedAt: '2026-09-20T11:20:00.000Z'
  }
];

export const INITIAL_QUIZZES: any[] = [
  {
    id: 'quiz-basket-1',
    judul: 'Kuis Teori & Pemahaman Teknik Bola Basket',
    materi: 'Permainan Bola Besar (Bola Basket)',
    kelas: 'Semua Kelas',
    linkUrl: 'https://forms.gle/demo-pjok-basket-2026',
    status: 'kunci', // Default status terkunci oleh guru
    kodeKunci: 'PJOK123',
    durasiMenit: 30,
    instruksi: 'Kerjakan soal kuis pemahaman teknik dasar bola basket (Chest Pass, Bounce Pass, Overhead Pass, Pivot, dan Lay-up) saat jam pelajaran guru dimulai.',
    createdBy: 'Guru PJOK',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_MATERIALS: any[] = [
  {
    id: 'mat-appscript-1',
    judul: 'Media Interaktif PJOK & Simulasi Gerak (Apps Script)',
    materi: 'Analisis Gerak dan Kebugaran',
    kategori: 'Google Apps Script / Web App',
    kelas: 'Semua Kelas',
    linkUrl: 'https://script.google.com/macros/s/AKfycbxExampleWebAppPJOK/exec',
    status: 'buka',
    kodeKunci: '',
    durasiEstimasi: 20,
    deskripsi: 'Web App interaktif Google Apps Script berisi kalkulator kebugaran, simulasi taktik lapangan, dan lembar kerja digital PJOK.',
    instruksi: 'Buka dan jalankan Web App Google Apps Script ini langsung di aplikasi. Anda juga dapat membuka materi tambahan pada tab yang tersedia.',
    linkTambahan: [
      {
        id: 'link-sub-1',
        judul: 'Spreadsheet Database Gerak PJOK',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpjok-demo-sheet/pubhtml'
      }
    ],
    kolomMateriTambahan: [
      {
        id: 'col-sub-1',
        judulKolom: 'Langkah Percobaan & Pengamatan',
        isi: '1. Masukkan data tinggi dan berat badan pada kalkulator Web App.\n2. Catat zona denyut nadi target untuk latihan aerobik.\n3. Diskusikan hasil dengan teman saat sesi evaluasi gerak.'
      },
      {
        id: 'col-sub-2',
        judulKolom: 'Ketentuan Penilaian Gerak',
        isi: 'Setiap siswa wajib mencoba minimal 2 simulasi teknik sebelum menuju lapangan untuk penilaian antar teman.'
      }
    ],
    createdBy: 'Guru PJOK',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-voli-1',
    judul: 'Video Panduan & Analisis Gerak Passing Bola Voli',
    materi: 'Permainan Bola Besar (Bola Voli)',
    kategori: 'Video Pembelajaran',
    kelas: 'Semua Kelas',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'buka',
    kodeKunci: '',
    durasiEstimasi: 15,
    deskripsi: 'Penjelasan detail mengenai posisi kuda-kuda, perkenaan bola pada lengan bawah, ayunan lengan, serta koordinasi lutut saat melakukan passing bawah dan atas.',
    instruksi: 'Tonton video dengan cermat sebelum mempraktikkan gerakan bersama teman saat sesi penilaian antar teman.',
    createdBy: 'Guru PJOK',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-basket-1',
    judul: 'Modul Teknik Dasar Dribble & Passing Bola Basket',
    materi: 'Permainan Bola Besar (Bola Basket)',
    kategori: 'Slide / PPT',
    kelas: 'Semua Kelas',
    linkUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vTpjok-demo-basket/embed',
    status: 'buka',
    kodeKunci: '',
    durasiEstimasi: 20,
    deskripsi: 'Slide interaktif mengenai chest pass, bounce pass, overhead pass, dan cara melakukan pivot yang benar tanpa melanggar traveling.',
    instruksi: 'Pelajari slide materi ini sebagai bekal menjawab kuis dan menjadi penilai yang objektif untuk teman sekelas.',
    createdBy: 'Guru PJOK',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-kebugaran-1',
    judul: 'Konsep Latihan Daya Tahan & Pengukuran Denyut Nadi',
    materi: 'Kebugaran Jasmani',
    kategori: 'Modul / PDF',
    kelas: 'Semua Kelas',
    linkUrl: 'https://drive.google.com/file/d/demo-kebugaran-pjok/preview',
    status: 'kunci',
    kodeKunci: 'FIT2026',
    durasiEstimasi: 25,
    deskripsi: 'Rumus menghitung denyut nadi maksimal (MHR), zona latihan aerobik, dan prinsip FITT untuk meningkatkan daya tahan kardiorespirasi.',
    instruksi: 'Gunakan PIN dari Guru PJOK saat sesi pembelajaran teori kebugaran di kelas berlangsung.',
    createdBy: 'Guru PJOK',
    createdAt: new Date().toISOString()
  }
];

