/* =========================================================
   PRESTASI SEKOLAH — KONFIGURASI
   Edit array prestasiData di bawah untuk menambah/mengubah
   prestasi yang ditampilkan di halaman utama.
   ========================================================= */

var prestasiData = [
    {
        year: "2026",
        category: "Akademik",
        title: "Juara 1 Lomba Debat Bahasa Inggris",
        description: "Tim debat SMA Al-Kahfi meraih Juara 1 pada lomba debat tingkat Kota Batam.",
        icon: "fa-solid fa-trophy",
        color: "#f59e0b"
    },
    {
        year: "2026",
        category: "Non-Akademik",
        title: "Juara 2 Turnamen Futsal Pelajar",
        description: "Tim futsal sekolah berhasil melaju hingga final dan meraih Juara 2.",
        icon: "fa-solid fa-futbol",
        color: "#10b981"
    },
    {
        year: "2025",
        category: "Seni",
        title: "Finalis Festival Band Pelajar",
        description: "Band sekolah menjadi finalis dalam festival band antar SMA se-Kepulauan Riau.",
        icon: "fa-solid fa-music",
        color: "#8b5cf6"
    },
    {
        year: "2025",
        category: "Keagamaan",
        title: "Juara 3 Tilawatil Qur'an",
        description: "Siswi SMA Al-Kahfi meraih Juara 3 Tilawatil Qur'an tingkat kabupaten.",
        icon: "fa-solid fa-book-quran",
        color: "#2563eb"
    },
    {
        year: "2025",
        category: "Organisasi",
        title: "OSIS Teraktif Tingkat Kota",
        description: "Penghargaan OSIS teraktif atas program kerja dan kegiatan yang konsisten.",
        icon: "fa-solid fa-award",
        color: "#ef4444"
    },
    {
        year: "2024",
        category: "Akademik",
        title: "Medali Perak Olimpiade Matematika",
        description: "Meraih medali perak pada olimpiade matematika tingkat provinsi.",
        icon: "fa-solid fa-calculator",
        color: "#06b6d4"
    }
];

/* =========================================================
   RENDER PRESTASI
   ========================================================= */
function renderPublicPrestasi() {
    var container = document.getElementById('prestasiGrid');
    if (!container || !Array.isArray(prestasiData) || !prestasiData.length) return;

    var html = prestasiData.map(function(item, index) {
        var icon = item.icon || 'fa-solid fa-award';
        var color = item.color || 'var(--primary)';
        var delay = (index % 3) * 80;
        return `
            <article class="prestasi-card" data-aos="fade-up" data-aos-delay="${delay}">
                <span class="prestasi-year">${item.year}</span>
                <span class="prestasi-icon" style="--prestasi-color:${color}">
                    <i class="${icon}" aria-hidden="true"></i>
                </span>
                <span class="prestasi-category" style="--prestasi-color:${color}">${item.category}</span>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </article>`;
    }).join('');

    container.innerHTML = html;
}

// Inisialisasi saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPublicPrestasi);
} else {
    renderPublicPrestasi();
}