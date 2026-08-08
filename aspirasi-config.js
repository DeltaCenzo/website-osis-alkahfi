(() => {
  "use strict";

  // =========================================================
  // MASUKKAN URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
  // Harus berakhiran /exec
  // =========================================================

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzQM8KdNCWvhWoyohJa5zfUDT42uxayG-6XVK7f1vU9UA0hRiDF50LItX8927kIvAlXew/exec";


  // =========================================================
  // CEK URL
  // =========================================================

  function getApiUrl() {
    const url = String(APPS_SCRIPT_URL || "").trim();

    if (
      !url ||
      url.includes("GANTI_DENGAN_URL")
    ) {
      throw new Error(
        "URL Google Apps Script belum dimasukkan."
      );
    }

    if (!url.endsWith("/exec")) {
      console.warn(
        "[Aspirasi] URL sebaiknya merupakan Web App URL yang berakhiran /exec."
      );
    }

    return url;
  }


  // =========================================================
  // PESAN KE USER
  // =========================================================

  function tampilkanPesan(pesan, tipe = "info") {
    if (typeof window.showToast === "function") {
      try {
        window.showToast(pesan, tipe);
        return;
      } catch (error) {
        console.warn(
          "[Aspirasi] Toast website gagal digunakan.",
          error
        );
      }
    }

    alert(pesan);
  }


  // =========================================================
  // KIRIM KE GOOGLE APPS SCRIPT
  // =========================================================

  async function kirimKeServer(data) {
    const url = getApiUrl();

    const body = new URLSearchParams();

    body.set(
      "nama",
      data.nama || "Anonim"
    );

    body.set(
      "kelas",
      data.kelas || ""
    );

    body.set(
      "kategori",
      data.kategori || "Umum"
    );

    body.set(
      "aspirasi",
      data.aspirasi || ""
    );


    const response = await fetch(
      url,
      {
        method: "POST",
        body: body
      }
    );


    if (!response.ok) {
      throw new Error(
        "Server aspirasi tidak dapat dihubungi."
      );
    }


    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error(
        "Jawaban dari server tidak valid."
      );
    }


    if (!result.success) {
      throw new Error(
        result.message ||
        "Aspirasi gagal disimpan."
      );
    }


    return result;
  }


  // =========================================================
  // AKTIFKAN FORM ASPIRASI
  // =========================================================

  function aktifkanFormAspirasi() {
    const form =
      document.getElementById(
        "aspirasiForm"
      );


    if (!form) {
      console.warn(
        "[Aspirasi] Form #aspirasiForm tidak ditemukan."
      );

      return;
    }


    /*
      Kita gunakan capture=true.

      Tujuannya supaya sistem penyimpanan
      aspirasi lama di index.html tidak ikut berjalan.

      Jadi aspirasi hanya dikirim ke Google Sheets.
    */

    document.addEventListener(
      "submit",

      async function (event) {
        if (event.target !== form) {
          return;
        }


        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        const namaInput =
          document.getElementById(
            "asp-nama"
          );


        const kelasInput =
          document.getElementById(
            "asp-kelas"
          );


        const kategoriInput =
          document.getElementById(
            "asp-category"
          );


        const aspirasiInput =
          document.getElementById(
            "asp-pesan"
          );


        const errorBox =
          document.getElementById(
            "asp-error"
          );


        const nama =
          namaInput?.value?.trim()
          || "Anonim";


        const kelas =
          kelasInput?.value?.trim()
          || "";


        const kategori =
          kategoriInput?.value
          || "Umum";


        const aspirasi =
          aspirasiInput?.value?.trim()
          || "";


        // =====================================================
        // VALIDASI
        // =====================================================

        if (!aspirasi) {
          if (errorBox) {
            errorBox.style.display =
              "block";

            errorBox.textContent =
              "Mohon isi pesan aspirasi.";
          }


          aspirasiInput?.focus();


          return;
        }


        if (errorBox) {
          errorBox.style.display =
            "none";
        }


        // =====================================================
        // TOMBOL SUBMIT
        // =====================================================

        const tombol =
          form.querySelector(
            'button[type="submit"]'
          );


        const tombolAwal =
          tombol
            ? tombol.innerHTML
            : "";


        try {
          if (tombol) {
            tombol.disabled = true;

            tombol.innerHTML =
              '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
          }


          // ===================================================
          // KIRIM DATA
          // ===================================================

          const result =
            await kirimKeServer({
              nama,
              kelas,
              kategori,
              aspirasi
            });


          console.log(
            "[Aspirasi] Berhasil:",
            result
          );


          tampilkanPesan(
            "Aspirasi berhasil dikirim. Terima kasih sudah menyampaikan aspirasi!",
            "success"
          );


          form.reset();


        } catch (error) {

          console.error(
            "[Aspirasi] Gagal:",
            error
          );


          tampilkanPesan(
            "Aspirasi gagal dikirim.\n\n" +
            error.message,
            "error"
          );


        } finally {

          if (tombol) {
            tombol.disabled = false;

            tombol.innerHTML =
              tombolAwal;
          }

        }
      },

      true
    );


    console.log(
      "[Aspirasi] Sistem Google Sheets siap."
    );
  }


  // =========================================================
  // API SEDERHANA
  // Bisa kita kembangkan nanti untuk dashboard.
  // =========================================================

  window.OSISAspirasiAPI = {
    kirim: kirimKeServer
  };


  // =========================================================
  // JALANKAN
  // =========================================================

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      aktifkanFormAspirasi
    );
  } else {
    aktifkanFormAspirasi();
  }

})();