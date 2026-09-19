const DEFAULT_DEADLINE = '17 September 2026';

function competition({
  slug,
  emoji,
  name,
  shortName = name,
  level,
  category,
  internalOnly = false,
  status = 'OPEN',
  peserta = 'Individual',
  memberCount = 1,
  theme,
  description,
  requirements = [],
  quota = null,
  deadline = DEFAULT_DEADLINE,
  allowedGrades = null,
  technicalGuide = null,
}) {
  const scopeRequirement = internalOnly
    ? 'Lomba internal: peserta wajib merupakan siswa aktif Al-Kahfi Islamic School (AIS).'
    : 'Peserta merupakan siswa aktif pada jenjang yang sesuai dengan kategori lomba.';

  return {
    slug,
    emoji,
    name,
    shortName,
    level,
    category,
    internalOnly,
    status,
    peserta,
    registration: { type: memberCount > 1 ? 'team' : 'individual', memberCount },
    theme,
    description,
    quota,
    deadline,
    allowedGrades,
    technicalGuide,
    requirements: [scopeRequirement, ...requirements],
  };
}

export const aisFairCompetitions = [
  // TK
  competition({
    slug: 'tk-mewarnai-a', emoji: '🎨', name: 'Mewarnai TK A', level: 'TK', category: 'Seni & Kreativitas',
    theme: 'Menunggu tema AIS FAIR',
    allowedGrades: ['TK A'],
    description: 'Lomba mewarnai pola gambar untuk peserta Kelompok A. Perlombaan dirancang untuk menilai harmoni warna, kecermatan motorik, kerapihan, dan kebersihan hasil karya.',
    requirements: [
      'Peserta lomba berusia 4–6 tahun atau merupakan perwakilan sekolah di Kelompok A.',
      'Peserta memakai busana muslim bebas atau seragam olahraga sekolah.',
      'Peserta wajib mengikuti alur pendaftaran yang telah ditentukan panitia.',
      'Peserta wajib membawa crayon sendiri (Faber Casteel dan Titi), tisu, serta meja lipat atau papan sebagai alas mewarnai.',
      'Tidak diperkenankan menambahkan spray atau glitter pada hasil karya.',
      'Tidak diperkenankan meminjam alat mewarnai dari peserta lain.',
      'Peserta tidak diperkenankan menerima bantuan saat lomba berlangsung.',
      'Guru pendamping/orang tua tidak diperkenankan memasuki area lomba.',
      'Semua karya hasil lomba menjadi milik panitia.',
      'Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.',
    ],
    technicalGuide: {
      venue: 'Mesjid Al Kahfi',
      time: '09.00–10.30 WIB',
      timeNote: 'Waktu masih menunggu arahan/konfirmasi dengan lomba lain yang menggunakan tempat yang sama.',
      pic: ['Ustadzah Susilawati, S.Pd., Gr.', 'Ustadzah Ramadhania, S.Pd., Gr.'],
      technique: [
        'Peserta wajib hadir 30 menit sebelum lomba untuk melakukan registrasi ulang.',
        'Peserta memasuki tempat perlombaan setelah dipersilahkan oleh dewan juri.',
        'Peserta yang terlambat datang, kedapatan berbuat curang, atau melanggar peraturan pada saat perlombaan akan otomatis didiskualifikasi.',
        'Pola gambar mewarnai berukuran A4 disediakan oleh panitia.',
        'Waktu mewarnai adalah 90 menit.',
        'Skor penilaian menggunakan rentang 10–100.',
      ],
      assessment: [
        { label: 'Harmoni / Komposisi Warna', weight: '30%' },
        { label: 'Motorik / Kecermatan / Ketelitian', weight: '40%' },
        { label: 'Kerapihan / Kebersihan', weight: '30%' },
      ],
    },
  }),
  competition({
    slug: 'tk-mewarnai-b', emoji: '🖍️', name: 'Mewarnai TK B', level: 'TK', category: 'Seni & Kreativitas',
    theme: 'Menunggu tema AIS FAIR',
    allowedGrades: ['TK B'],
    description: 'Lomba mewarnai pola gambar untuk peserta Kelompok B. Perlombaan dirancang untuk menilai harmoni warna, kecermatan motorik, kerapihan, dan kebersihan hasil karya.',
    requirements: [
      'Peserta lomba berusia 4–6 tahun atau merupakan perwakilan sekolah di Kelompok B.',
      'Peserta memakai busana muslim bebas atau seragam olahraga sekolah.',
      'Peserta wajib mengikuti alur pendaftaran yang telah ditentukan panitia.',
      'Peserta wajib membawa crayon sendiri (Faber Casteel dan Titi), tisu, serta meja lipat atau papan sebagai alas mewarnai.',
      'Tidak diperkenankan menambahkan spray atau glitter pada hasil karya.',
      'Tidak diperkenankan meminjam alat mewarnai dari peserta lain.',
      'Peserta tidak diperkenankan menerima bantuan saat lomba berlangsung.',
      'Guru pendamping/orang tua tidak diperkenankan memasuki area lomba.',
      'Semua karya hasil lomba menjadi milik panitia.',
      'Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.',
    ],
    technicalGuide: {
      venue: 'Mesjid Al Kahfi',
      time: '09.00–10.30 WIB',
      timeNote: 'Waktu masih menunggu arahan/konfirmasi dengan lomba lain yang menggunakan tempat yang sama.',
      pic: ['Ustadzah Susilawati, S.Pd., Gr.', 'Ustadzah Ramadhania, S.Pd., Gr.'],
      technique: [
        'Peserta wajib hadir 30 menit sebelum lomba untuk melakukan registrasi ulang.',
        'Peserta memasuki tempat perlombaan setelah dipersilahkan oleh dewan juri.',
        'Peserta yang terlambat datang, kedapatan berbuat curang, atau melanggar peraturan pada saat perlombaan akan otomatis didiskualifikasi.',
        'Pola gambar mewarnai berukuran A4 disediakan oleh panitia.',
        'Waktu mewarnai adalah 90 menit.',
        'Skor penilaian menggunakan rentang 10–100.',
      ],
      assessment: [
        { label: 'Harmoni / Komposisi Warna', weight: '30%' },
        { label: 'Motorik / Kecermatan / Ketelitian', weight: '40%' },
        { label: 'Kerapihan / Kebersihan', weight: '30%' },
      ],
    },
  }),

  // SD
  competition({
    slug: 'sd-olimpiade-tka', emoji: '🧠', name: 'Lomba Olimpiade TKA', shortName: 'Olimpiade TKA', level: 'SD', category: 'Akademik',
    description: 'Kompetisi akademik untuk menguji kemampuan berpikir kritis, analitis, dan penguasaan materi TKA peserta SD/sederajat.',
    requirements: ['Peserta mengikuti seluruh aturan teknis dan jadwal yang ditentukan panitia.'],
  }),
  competition({
    slug: 'sd-cerdas-cermat-islami', emoji: '📚', name: "Cerdas Cermat Islami (PAI, SKI, Al-Qur'an, dan Wawasan Keislaman)", shortName: 'Cerdas Cermat Islami', level: 'SD', category: 'Keislaman',
    description: "Kompetisi cerdas cermat seputar PAI, SKI, Al-Qur'an, dan wawasan keislaman untuk siswa SD/sederajat.",
    requirements: ['Materi lomba mencakup PAI, SKI, Al-Qur\'an, dan wawasan keislaman.'],
  }),
  competition({
    slug: 'sd-dai-cilik', emoji: '🎙️', name: 'Dai Cilik', shortName: 'Dai Cilik', level: 'SD', category: 'Keislaman & Public Speaking',
    description: 'Lomba ceramah singkat dengan tema akhlak dan kehidupan sehari-hari untuk melatih keberanian, penyampaian pesan, dan adab peserta.',
    requirements: ['Ceramah singkat bertema akhlak dan kehidupan sehari-hari.', 'Durasi penampilan mengikuti ketentuan panitia.'],
  }),
  competition({
    slug: 'sd-tahfidz', emoji: '📖', name: 'Lomba Tahfidz (Sambung Ayat/Hafalan)', shortName: 'Tahfidz', level: 'SD', category: "Al-Qur'an",
    description: "Lomba tahfidz SD dengan format sambung ayat dan/atau hafalan sesuai ketentuan panitia.",
    requirements: ['Peserta menyiapkan hafalan sesuai kategori yang ditetapkan panitia.'],
  }),
  competition({
    slug: 'sd-arabic-speech', emoji: '🎤', name: 'Arabic Speech', level: 'SD', category: 'Bahasa Arab',
    description: 'Lomba pidato bahasa Arab untuk mengasah kefasihan, keberanian, dan kemampuan komunikasi peserta SD.',
    requirements: ['Materi pidato menggunakan bahasa Arab yang sopan dan edukatif.', 'Durasi mengikuti ketentuan panitia.'],
  }),
  competition({
    slug: 'sd-one-minute-speaking', emoji: '⏱️', name: 'One Minute Speaking', level: 'SD', category: 'Bahasa Inggris',
    description: 'Lomba berbicara singkat untuk melatih kemampuan menyampaikan ide dengan jelas dan percaya diri dalam waktu satu menit.',
    requirements: ['Peserta menyampaikan materi sesuai topik dan durasi yang ditentukan panitia.'],
  }),
  competition({
    slug: 'sd-ranking-1', emoji: '🏆', name: 'Ranking 1', level: 'SD', category: 'Akademik', internalOnly: true,
    description: 'Kompetisi internal AIS dengan format Ranking 1 untuk menguji wawasan, ketelitian, dan kecepatan menjawab peserta SD.',
    requirements: ['Peserta mengikuti sistem eliminasi dan aturan jawaban dari panitia.'],
  }),
  competition({
    slug: 'sd-olahraga', emoji: '🏃', name: 'Olahraga (Tarik Tambang, Estafet, Rintang Al-Kahfi Warrior)', shortName: 'Olahraga', level: 'SD', category: 'Olahraga', internalOnly: true,
    description: 'Rangkaian lomba olahraga internal AIS yang meliputi tarik tambang, estafet, dan Rintang Al-Kahfi Warrior.',
    requirements: ['Peserta wajib menggunakan perlengkapan olahraga yang sesuai.', 'Pembagian tim dan teknis pertandingan mengikuti arahan panitia.'],
  }),
  competition({
    slug: 'sd-puzzle', emoji: '🧩', name: 'Puzzle', level: 'SD', category: 'Kreativitas & Logika', internalOnly: true,
    description: 'Lomba puzzle internal AIS untuk melatih ketelitian, logika, strategi, dan kecepatan menyelesaikan tantangan.',
    requirements: ['Peserta menyelesaikan puzzle sesuai format dan waktu yang ditentukan panitia.'],
  }),

  // SMP
  competition({
    slug: 'smp-dawah-youth-competition', emoji: '🕌', name: "Da'wah Youth Competition", level: 'SMP', category: 'Keislaman & Dakwah', internalOnly: true,
    description: 'Kompetisi dakwah pemuda internal AIS untuk mengasah kemampuan menyampaikan pesan keislaman secara komunikatif dan relevan.',
    requirements: ['Materi dakwah harus sopan, edukatif, dan sesuai ketentuan tema panitia.'],
  }),
  competition({
    slug: 'smp-badminton-akhwat', emoji: '🏸', name: 'Badminton Akhwat', level: 'SMP', category: 'Olahraga',
    quota: 32,
    description: 'Kompetisi badminton putri untuk siswa SMP/sederajat yang menekankan teknik, kebugaran, dan sportivitas.',
    requirements: ['Membawa perlengkapan pertandingan sesuai ketentuan panitia.', 'Peserta hadir minimal 30 menit sebelum pertandingan dimulai.'],
  }),
  competition({
    slug: 'smp-badminton-ikhwan', emoji: '🏸', name: 'Badminton Ikhwan', level: 'SMP', category: 'Olahraga',
    quota: 32,
    description: 'Kompetisi badminton putra untuk siswa SMP/sederajat yang menekankan teknik, kelincahan, dan sportivitas.',
    requirements: ['Membawa perlengkapan pertandingan sesuai ketentuan panitia.', 'Peserta hadir minimal 30 menit sebelum pertandingan dimulai.'],
  }),
  competition({
    slug: 'smp-story-telling', emoji: '📖', name: 'Story Telling English (Kisah Nabi/Sahabat)', shortName: 'Story Telling English', level: 'SMP', category: 'Bahasa Inggris & Keislaman',
    quota: 35,
    description: 'Kompetisi story telling berbahasa Inggris bertema kisah nabi dan sahabat untuk mengasah kemampuan bercerita, ekspresi, dan pemahaman nilai teladan Islam.',
    requirements: ['Cerita harus berkaitan dengan kisah nabi atau sahabat.', 'Durasi penampilan mengikuti aturan panitia.'],
  }),
  competition({
    slug: 'smp-tennis-meja-ikhwan', emoji: '🏓', name: 'Tennis Meja Ikhwan', level: 'SMP', category: 'Olahraga',
    quota: 24,
    description: 'Kompetisi tenis meja putra untuk siswa SMP/sederajat yang menekankan refleks, kontrol permainan, dan sportivitas.',
    requirements: ['Membawa perlengkapan pertandingan sesuai ketentuan panitia.', 'Peserta hadir minimal 30 menit sebelum pertandingan dimulai.'],
  }),
  competition({
    slug: 'smp-olimpiade-tka', emoji: '🧠', name: 'Lomba Olimpiade TKA', shortName: 'Olimpiade TKA', level: 'SMP', category: 'Akademik',
    quota: 60,
    description: 'Ajang kompetisi akademik untuk menguji kemampuan berpikir kritis, analitis, dan penguasaan materi peserta SMP/sederajat.',
    requirements: ['Peserta hadir sesuai jadwal yang ditentukan panitia.', 'Peralatan tulis dasar disiapkan peserta jika diperlukan.'],
  }),
  competition({
    slug: 'smp-tahfidz', emoji: '📖', name: 'Lomba Tahfidz (Sambung Ayat)', shortName: 'Tahfidz', level: 'SMP', category: "Al-Qur'an",
    quota: 50,
    description: "Lomba tahfidz dengan format sambung ayat untuk meningkatkan kecintaan peserta terhadap Al-Qur'an dan menunjukkan kualitas hafalan.",
    requirements: ['Peserta menyiapkan hafalan sesuai kategori yang ditetapkan panitia.'],
  }),

  // SMA
  competition({
    slug: 'sma-cerdas-cermat', emoji: '🧠', name: 'Cerdas Cermat', level: 'SMA', category: 'Akademik', internalOnly: true,
    description: 'Kompetisi cerdas cermat internal AIS untuk siswa SMA yang menguji wawasan, ketepatan, dan kecepatan menjawab.',
    requirements: ['Peserta mengikuti format soal dan aturan pertandingan yang ditentukan panitia.'],
  }),
  competition({
    slug: 'sma-canvas-painting', emoji: '🎨', name: 'Canvas Painting', level: 'SMA', category: 'Seni & Kreativitas', internalOnly: true,
    description: 'Lomba melukis di atas kanvas khusus internal AIS untuk mengembangkan kreativitas, teknik visual, dan ekspresi peserta.',
    requirements: ['Tema dan perlengkapan yang diperbolehkan mengikuti ketentuan panitia.'],
  }),
  competition({
    slug: 'sma-science-project', emoji: '🔬', name: 'Science Project Competition', level: 'SMA', category: 'Sains & Inovasi', internalOnly: true,
    description: 'Kompetisi proyek sains internal AIS yang mendorong kreativitas, penelitian sederhana, pemecahan masalah, dan kemampuan presentasi.',
    requirements: ['Proyek harus aman, orisinal, dan mengikuti tema serta ketentuan teknis panitia.'],
  }),
  competition({
    slug: 'sma-badminton-ikhwan', emoji: '🏸', name: 'Badminton Ikhwan', level: 'SMA', category: 'Olahraga',
    quota: 32,
    description: 'Kompetisi badminton putra untuk siswa SMA/sederajat yang menekankan teknik, sportivitas, dan mental bertanding.',
    requirements: ['Membawa perlengkapan pertandingan sesuai ketentuan panitia.', 'Peserta hadir minimal 30 menit sebelum pertandingan dimulai.'],
  }),
  competition({
    slug: 'sma-badminton-akhwat', emoji: '🏸', name: 'Badminton Akhwat', level: 'SMA', category: 'Olahraga',
    quota: 32,
    description: 'Kompetisi badminton putri untuk siswa SMA/sederajat dengan suasana kompetitif, sehat, dan menjunjung sportivitas.',
    requirements: ['Membawa perlengkapan pertandingan sesuai ketentuan panitia.', 'Peserta hadir minimal 30 menit sebelum pertandingan dimulai.'],
  }),
  competition({
    slug: 'sma-speech-bahasa-arab', emoji: '🎤', name: 'Speech Bahasa Arab', shortName: 'Speech Bahasa Arab', level: 'SMA', category: 'Bahasa Arab',
    quota: 40,
    description: 'Lomba pidato bahasa Arab untuk mengasah keberanian, kefasihan, serta kemampuan komunikasi peserta di depan publik.',
    requirements: ['Materi pidato menggunakan bahasa Arab yang sopan dan edukatif.', 'Durasi penampilan mengikuti ketentuan panitia.'],
  }),
  competition({
    slug: 'sma-english-presentation', emoji: '🌎', name: 'Presentation English', shortName: 'English Presentation', level: 'SMA', category: 'Bahasa Inggris', peserta: 'Tim (3 orang)', memberCount: 3, theme: 'Small Byte, Big Impact',
    quota: 36,
    description: 'Kompetisi presentasi berbahasa Inggris dengan tema “Small Byte, Big Impact” untuk menampilkan ide kreatif dan kemampuan presentasi peserta.',
    requirements: ['Materi presentasi harus sesuai tema “Small Byte, Big Impact”.', 'Peserta menyiapkan file presentasi sesuai format yang ditentukan panitia.'],
  }),
];

export function getCompetitionBySlug(slug) {
  return aisFairCompetitions.find((item) => item.slug === slug) || null;
}

export const schoolsByNpsn = {
  '11000111': { schoolName: 'SMP Al-Kahfi Islamic School', city: 'Batam', province: 'Kepulauan Riau' },
  '11000112': { schoolName: 'SMA Al-Kahfi Islamic School', city: 'Batam', province: 'Kepulauan Riau' },
  '69728123': { schoolName: 'SMP Negeri 1 Batam', city: 'Batam', province: 'Kepulauan Riau' },
  '11022334': { schoolName: 'SMA Negeri 3 Batam', city: 'Batam', province: 'Kepulauan Riau' },
};
