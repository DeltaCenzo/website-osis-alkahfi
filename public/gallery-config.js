(() => {
  const DEFAULT = {
    appsScriptUrl:
      "https://script.google.com/macros/s/AKfycbzQM8KdNCWvhWoyohJa5zfUDT42uxayG-6XVK7f1vU9UA0hRiDF50LItX8927kIvAlXew/exec",
  };

  // Pastikan selalu ada config
  window.OSIS_GALLERY_CONFIG = DEFAULT;

  // Kalau di masa depan kamu mau injeksi dari endpoint lain,
  // ini contoh pola agar tidak error kalau gagal.
  // Untuk sekarang, tetap sesuai kode lama (DEFAULT).
})();