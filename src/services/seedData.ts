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
  },
  // ================= KELAS XI 1 (31 Murid) =================
  {
    uid: 'murid-xi1-7504',
    nama: 'Gede Aditya Peratama',
    nis: '7504',
    kelas: 'XI 1',
    nomorAbsen: '1',
    email: 'gedeadityaperatama@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7474',
    nama: 'Gede Eric Surya Purnama',
    nis: '7474',
    kelas: 'XI 1',
    nomorAbsen: '2',
    email: 'gedeericsuryapurnama@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7440',
    nama: 'Gede Reynard Dharma Mahardika',
    nis: '7440',
    kelas: 'XI 1',
    nomorAbsen: '3',
    email: 'gedereynarddharmamahardika@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7478',
    nama: 'I Gede Mukiadi',
    nis: '7478',
    kelas: 'XI 1',
    nomorAbsen: '4',
    email: 'igedemukiadi@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7612',
    nama: 'I Komang Nova Andriana',
    nis: '7612',
    kelas: 'XI 1',
    nomorAbsen: '5',
    email: 'ikomangnovaandriana@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7480',
    nama: 'Ida Ayu Putu Savira Maharani',
    nis: '7480',
    kelas: 'XI 1',
    nomorAbsen: '6',
    email: 'idaayuputusaviramaharani@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7679',
    nama: 'Kadek Dito Mahendra',
    nis: '7679',
    kelas: 'XI 1',
    nomorAbsen: '7',
    email: 'kadekditomahendra@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7483',
    nama: 'Kadek Wilma Adhya Kusuma',
    nis: '7483',
    kelas: 'XI 1',
    nomorAbsen: '8',
    email: 'kadekwilmaadhyakusuma@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7447',
    nama: 'Kenzie Ramdhan Tjhang',
    nis: '7447',
    kelas: 'XI 1',
    nomorAbsen: '9',
    email: 'kenzieramdhantjhang@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7484',
    nama: 'Ketut Cetra Neo Budiartha',
    nis: '7484',
    kelas: 'XI 1',
    nomorAbsen: '10',
    email: 'ketutcetraneobudiartha@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7450',
    nama: 'Komang Ayu Mahadewi',
    nis: '7450',
    kelas: 'XI 1',
    nomorAbsen: '11',
    email: 'komangayumahadewi@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7451',
    nama: 'Komang Bintang Gayatri',
    nis: '7451',
    kelas: 'XI 1',
    nomorAbsen: '12',
    email: 'komangbintanggayatri@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7721',
    nama: 'Komang Ceriya Ningsih',
    nis: '7721',
    kelas: 'XI 1',
    nomorAbsen: '13',
    email: 'komangceriyaningsih@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7453',
    nama: 'Komang Dhini Pradnyamita Kesuma',
    nis: '7453',
    kelas: 'XI 1',
    nomorAbsen: '14',
    email: 'komangdhinipradnyamitakesuma@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7454',
    nama: 'Komang Dian Widyasari',
    nis: '7454',
    kelas: 'XI 1',
    nomorAbsen: '15',
    email: 'komangdianwidyasari@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7725',
    nama: 'Luh Tina Cahyani',
    nis: '7725',
    kelas: 'XI 1',
    nomorAbsen: '16',
    email: 'luhtinacahyani@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7630',
    nama: 'Made Dwi Astuti Damayanti',
    nis: '7630',
    kelas: 'XI 1',
    nomorAbsen: '17',
    email: 'madedwiastutidamayanti@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7696',
    nama: 'Made Gustini',
    nis: '7696',
    kelas: 'XI 1',
    nomorAbsen: '18',
    email: 'madegustini@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7731',
    nama: 'Made Suyasa',
    nis: '7731',
    kelas: 'XI 1',
    nomorAbsen: '19',
    email: 'madesuyasa@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7697',
    nama: 'Nadine Azzahra Gauri Jendra',
    nis: '7697',
    kelas: 'XI 1',
    nomorAbsen: '20',
    email: 'nadineazzahragaurijendra@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7526',
    nama: 'Ni Ketut Kirani Savitri',
    nis: '7526',
    kelas: 'XI 1',
    nomorAbsen: '21',
    email: 'niketutkiranisavitri@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7665',
    nama: 'Ni Komang Nova Ayu Purwani',
    nis: '7665',
    kelas: 'XI 1',
    nomorAbsen: '22',
    email: 'nikomangnovaayupurwani@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7496',
    nama: 'Ni Made Asha Caitanya',
    nis: '7496',
    kelas: 'XI 1',
    nomorAbsen: '23',
    email: 'nimadeashacaitanya@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7497',
    nama: 'Ni Made Avara Cetasa',
    nis: '7497',
    kelas: 'XI 1',
    nomorAbsen: '24',
    email: 'nimadeavaracetasa@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7700',
    nama: 'Ni Putu Bulan Mulia Febriana',
    nis: '7700',
    kelas: 'XI 1',
    nomorAbsen: '25',
    email: 'niputubulanmuliafebriana@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7468',
    nama: 'Nyoman Ayu Brinda Vitare',
    nis: '7468',
    kelas: 'XI 1',
    nomorAbsen: '26',
    email: 'nyomanayubrindavitare@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7499',
    nama: 'Putu Audya Sinthya Dewi',
    nis: '7499',
    kelas: 'XI 1',
    nomorAbsen: '27',
    email: 'putuaudyasinthyadewi@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7565',
    nama: 'Putu Dinda Cintya Dewi',
    nis: '7565',
    kelas: 'XI 1',
    nomorAbsen: '28',
    email: 'putudindacintyadewi@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7501',
    nama: 'Putu Egalita Grazina Bendesa Mas',
    nis: '7501',
    kelas: 'XI 1',
    nomorAbsen: '29',
    email: 'putuegalitagrazinabendesamas@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7734',
    nama: 'Putu Sinta',
    nis: '7734',
    kelas: 'XI 1',
    nomorAbsen: '30',
    email: 'putusinta@pjok.sch.id',
    password: 'murid123',
    role: 'murid',
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    uid: 'murid-xi1-7503',
    nama: 'Tyo Ferdiansyah',
    nis: '7503',
    kelas: 'XI 1',
    nomorAbsen: '31',
    email: 'tyoferdiansyah@pjok.sch.id',
    password: 'murid123',
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



