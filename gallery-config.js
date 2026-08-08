(() => {
  const DEFAULT = {
    appsScriptUrl:
      "https://script.google.com/macros/s/AKfycbw8_oB5_4rZ0we9g54qRj975U_wCUSyTTWKnwF4oKZDGpbaoug92UsxZWibuouL_2Zc/exec",
  };

  // Pastikan selalu ada config
  window.OSIS_GALLERY_CONFIG = DEFAULT;

  // Kalau di masa depan kamu mau injeksi dari endpoint lain,
  // ini contoh pola agar tidak error kalau gagal.
  // Untuk sekarang, tetap sesuai kode lama (DEFAULT).
})();