(() => {
  "use strict";

  /* =========================================================
     KONFIGURASI
     Ganti HANYA URL di bawah ini.
  ========================================================= */

  const CONFIG = {

    appsScriptUrl:
      "https://script.google.com/macros/s/AKfycbzQM8KdNCWvhWoyohJa5zfUDT42uxayG-6XVK7f1vU9UA0hRiDF50LItX8927kIvAlXew/exec",

    requestTimeoutMs:
      25000,

    sessionStorageKey:
      "osis_aspirasi_admin_session_v2"

  };


  /* =========================================================
     STATE / DATA SEMENTARA WEBSITE
  ========================================================= */

  const state = {

    token: "",

    items: [],

    loaded: false,

    loading: false

  };


  /* =========================================================
     CEK URL GOOGLE APPS SCRIPT
  ========================================================= */

  function getApiUrl() {

    const url =
      String(
        CONFIG.appsScriptUrl || ""
      ).trim();


    if (
      !url ||
      url.includes(
        "GANTI_DENGAN_URL"
      )
    ) {

      throw new Error(
        "URL Google Apps Script belum dimasukkan di aspirasi-config.js."
      );

    }


    if (
      !url.endsWith("/exec")
    ) {

      console.warn(
        "[Aspirasi] URL Web App sebaiknya berakhiran /exec."
      );

    }


    return url;

  }


  /* =========================================================
     SESSION TOKEN ADMIN
  ========================================================= */

  function saveToken(token) {

    state.token =
      String(
        token || ""
      );


    try {

      if (
        state.token
      ) {

        sessionStorage.setItem(
          CONFIG.sessionStorageKey,
          state.token
        );

      }

      else {

        sessionStorage.removeItem(
          CONFIG.sessionStorageKey
        );

      }

    }

    catch (error) {

      console.warn(
        "[Aspirasi] sessionStorage tidak tersedia.",
        error
      );

    }

  }


  function loadToken() {

    try {

      state.token =
        sessionStorage.getItem(
          CONFIG.sessionStorageKey
        ) || "";

    }

    catch (error) {

      state.token = "";

    }

  }


  function clearAdminSession() {

    saveToken("");

    state.items = [];

    state.loaded = false;

  }


  /* =========================================================
     NOTIFIKASI WEBSITE
  ========================================================= */

  function showToast(
    message,
    type = "info"
  ) {

    if (
      typeof window.showAppToast ===
      "function"
    ) {

      try {

        window.showAppToast(
          message,
          type
        );

        return;

      }

      catch (error) {

        console.warn(
          error
        );

      }

    }


    if (
      typeof window.showToast ===
      "function"
    ) {

      try {

        window.showToast(
          message,
          type
        );

        return;

      }

      catch (error) {

        console.warn(
          error
        );

      }

    }


    alert(message);

  }


  /* =========================================================
     PESAN KECIL DI DASHBOARD
  ========================================================= */

  function setInline(
    id,
    message,
    type = ""
  ) {

    if (
      typeof window.setInlineMessage ===
      "function"
    ) {

      window.setInlineMessage(
        id,
        message,
        type
      );

      return;

    }


    const element =
      document.getElementById(id);


    if (!element) {

      return;

    }


    element.textContent =
      message;


    element.className =
      "inline-message" +
      (
        type
          ? " " + type
          : ""
      );

  }


  /* =========================================================
     NORMALISASI DATA DARI GOOGLE SHEETS
  ========================================================= */

  function normalizeItem(item) {

    const allowedStatus = [

      "unread",

      "processing",

      "done"

    ];


    const allowedPriority = [

      "high",

      "normal",

      "low"

    ];


    return {

      id:
        String(
          item?.id || ""
        ),

      timestamp:
        String(
          item?.timestamp || ""
        ),

      name:
        String(
          item?.name ||
          "Anonim"
        ),

      kelas:
        String(
          item?.kelas ||
          "-"
        ),

      category:
        String(
          item?.category ||
          "Lainnya"
        ),

      message:
        String(
          item?.message ||
          ""
        ),

      status:
        allowedStatus.includes(
          item?.status
        )
          ? item.status
          : "unread",

      priority:
        allowedPriority.includes(
          item?.priority
        )
          ? item.priority
          : "normal",

      internalNote:
        String(
          item?.internalNote ||
          ""
        )

    };

  }


  /* =========================================================
     REFRESH TAMPILAN DASHBOARD
  ========================================================= */

  function syncUiFromCache() {

    if (
      typeof window.renderAspirasiList ===
      "function"
    ) {

      window.renderAspirasiList();

    }


    if (
      typeof window.updateAspirasiCounters ===
      "function"
    ) {

      window.updateAspirasiCounters();

    }


    if (
      typeof window.updateQuickActionsV13 ===
      "function"
    ) {

      window.updateQuickActionsV13();

    }

  }


  /* =========================================================
     COUNTER ASPIRASI PUBLIK
  ========================================================= */

  function setPublicCounter(total) {

    const count =
      Math.max(
        0,
        Number(total) || 0
      );


    const counter =
      document.querySelector(
        "#aspirasiCounter .stat-number"
      );


    if (
      counter
    ) {

      counter.dataset.target =
        String(count);

      counter.textContent =
        String(count);

    }

  }


  /* =========================================================
     REQUEST KE GOOGLE APPS SCRIPT
  ========================================================= */

  async function requestApi(payload) {

    const controller =
      new AbortController();


    const timer =
      setTimeout(
        () =>
          controller.abort(),

        CONFIG.requestTimeoutMs
      );


    try {

      const body =
        new URLSearchParams();


      Object.entries(
        payload || {}
      ).forEach(
        ([key, value]) => {

          body.set(

            key,

            value == null
              ? ""
              : String(value)

          );

        }
      );


      const response =
        await fetch(

          getApiUrl(),

          {

            method:
              "POST",

            body,

            signal:
              controller.signal,

            redirect:
              "follow",

            credentials:
              "omit"

          }

        );


      if (
        !response.ok
      ) {

        throw new Error(
          "Server aspirasi merespons HTTP " +
          response.status +
          "."
        );

      }


      let result;


      try {

        result =
          await response.json();

      }

      catch (error) {

        throw new Error(
          "Jawaban dari Google Apps Script bukan JSON yang valid."
        );

      }


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(

          result?.message ||

          "Permintaan ke server aspirasi gagal."

        );

      }


      return result;

    }

    catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        throw new Error(
          "Server aspirasi terlalu lama merespons. Coba lagi."
        );

      }


      throw error;

    }

    finally {

      clearTimeout(
        timer
      );

    }

  }


  /* =========================================================
     API
  ========================================================= */

  const api = {


    // ---------------------------------------------------------
    // KIRIM ASPIRASI
    // ---------------------------------------------------------

    submit(data) {

      return requestApi({

        action:
          "submit",

        nama:
          data.nama ||
          "Anonim",

        kelas:
          data.kelas ||
          "-",

        kategori:
          data.kategori ||
          "Saran Umum",

        aspirasi:
          data.aspirasi ||
          ""

      });

    },


    // ---------------------------------------------------------
    // HITUNG JUMLAH ASPIRASI
    // ---------------------------------------------------------

    count() {

      return requestApi({

        action:
          "count"

      });

    },


    // ---------------------------------------------------------
    // LOGIN ADMIN
    // ---------------------------------------------------------

    login(password) {

      return requestApi({

        action:
          "login",

        password

      });

    },


    // ---------------------------------------------------------
    // AMBIL SEMUA ASPIRASI
    // ---------------------------------------------------------

    list(
      token = state.token
    ) {

      return requestApi({

        action:
          "list",

        token

      });

    },


    // ---------------------------------------------------------
    // UPDATE ASPIRASI
    // ---------------------------------------------------------

    update(
      data,
      token = state.token
    ) {

      return requestApi({

        action:
          "update",

        token,

        id:
          data.id,

        category:
          data.category,

        priority:
          data.priority,

        status:
          data.status,

        internalNote:
          data.internalNote ||
          ""

      });

    },


    // ---------------------------------------------------------
    // HAPUS SATU
    // ---------------------------------------------------------

    delete(
      id,
      token = state.token
    ) {

      return requestApi({

        action:
          "delete",

        token,

        id

      });

    },


    // ---------------------------------------------------------
    // HAPUS SEMUA
    // ---------------------------------------------------------

    clear(
      token = state.token
    ) {

      return requestApi({

        action:
          "clear",

        token

      });

    },


    // ---------------------------------------------------------
    // GANTI PASSWORD
    // ---------------------------------------------------------

    changePassword(
      newPassword,
      token = state.token
    ) {

      return requestApi({

        action:
          "changePassword",

        token,

        newPassword

      });

    }

  };


  /* =========================================================
     GANTI DATABASE LOCALSTORAGE LAMA
     DENGAN CACHE GOOGLE SHEETS
  ========================================================= */

  window.getAspirasiList =
    function () {

      return state.items;

    };


  /* =========================================================
     AMBIL ASPIRASI DARI GOOGLE SHEETS
  ========================================================= */

  async function refreshAspirasiFromServer() {

    if (
      !state.token
    ) {

      throw new Error(
        "Sesi admin belum tersedia. Silakan login kembali."
      );

    }


    if (
      state.loading
    ) {

      return;

    }


    state.loading = true;


    try {

      const result =
        await api.list();


      state.items =
        Array.isArray(
          result.data
        )

          ? result.data.map(
              normalizeItem
            )

          : [];


      state.loaded = true;


      syncUiFromCache();


      return state.items;

    }

    catch (error) {

      if (
        /sesi admin|kedaluwarsa|token/i.test(
          error.message || ""
        )
      ) {

        clearAdminSession();

      }


      throw error;

    }

    finally {

      state.loading = false;

    }

  }


  /* =========================================================
     FORM ASPIRASI PUBLIK
  ========================================================= */

  function installPublicFormBridge() {

    const form =
      document.getElementById(
        "aspirasiForm"
      );


    if (
      !form
    ) {

      console.warn(
        "[Aspirasi] aspirasiForm tidak ditemukan."
      );

      return;

    }


    document.addEventListener(

      "submit",

      async function (
        event
      ) {

        if (
          event.target !== form
        ) {

          return;

        }


        /*
         * Ini penting.
         *
         * Handler aspirasi lama di index.html
         * masih mencoba menyimpan ke localStorage.
         *
         * Kita hentikan handler tersebut di sini.
         */

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        const nama =

          document
            .getElementById(
              "asp-nama"
            )
            ?.value
            ?.trim()

          || "Anonim";


        const kelas =

          document
            .getElementById(
              "asp-kelas"
            )
            ?.value
            ?.trim()

          || "-";


        const kategori =

          document
            .getElementById(
              "asp-category"
            )
            ?.value

          || "Saran Umum";


        const aspirasiInput =
          document.getElementById(
            "asp-pesan"
          );


        const aspirasi =

          aspirasiInput
            ?.value
            ?.trim()

          || "";


        const errorBox =
          document.getElementById(
            "asp-error"
          );


        const button =
          form.querySelector(
            'button[type="submit"]'
          );


        const oldHtml =
          button?.innerHTML ||
          "";


        // -----------------------------------------------------
        // VALIDASI
        // -----------------------------------------------------

        if (
          !aspirasi
        ) {

          if (
            errorBox
          ) {

            errorBox.style.display =
              "block";


            errorBox.textContent =
              "Mohon isi pesan aspirasi.";

          }


          aspirasiInput?.focus();


          return;

        }


        if (
          errorBox
        ) {

          errorBox.style.display =
            "none";

        }


        try {

          // ---------------------------------------------------
          // LOADING BUTTON
          // ---------------------------------------------------

          if (
            button
          ) {

            button.disabled =
              true;


            button.style.opacity =
              "0.7";


            button.innerHTML =
              '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

          }


          // ---------------------------------------------------
          // KIRIM KE GOOGLE SHEETS
          // ---------------------------------------------------

          await api.submit({

            nama,

            kelas,

            kategori,

            aspirasi

          });


          // ---------------------------------------------------
          // RESET FORM
          // ---------------------------------------------------

          form.reset();


          // ---------------------------------------------------
          // MODAL SUKSES WEBSITE
          // ---------------------------------------------------

          const successModal =
            document.getElementById(
              "aspSuccessModal"
            );


          if (
            successModal
          ) {

            successModal.style.display =
              "flex";

          }


          showToast(

            "Aspirasi berhasil dikirim.",

            "success"

          );


          // ---------------------------------------------------
          // UPDATE JUMLAH ASPIRASI
          // ---------------------------------------------------

          try {

            const countResult =
              await api.count();


            setPublicCounter(
              countResult.total
            );

          }

          catch (error) {

            console.warn(
              "[Aspirasi] Counter gagal diperbarui.",
              error
            );

          }

        }

        catch (error) {

          console.error(

            "[Aspirasi] Gagal mengirim:",

            error

          );


          if (
            errorBox
          ) {

            errorBox.style.display =
              "block";


            errorBox.textContent =
              "Gagal mengirim aspirasi: " +
              error.message;

          }


          showToast(

            "Aspirasi gagal dikirim. " +
            error.message,

            "error"

          );

        }

        finally {

          if (
            button
          ) {

            button.disabled =
              false;


            button.style.opacity =
              "1";


            button.innerHTML =
              oldHtml;

          }

        }

      },

      true
    );

  }


  /* =========================================================
     LOGIN DASHBOARD MELALUI BACKEND
  ========================================================= */

  async function loginDashboardRemote() {

    const passwordInput =
      document.getElementById(
        "passwordInput"
      );


    const button =
      document.getElementById(
        "loginSubmitBtn"
      );


    const errorMsg =
      document.getElementById(
        "errorMsg"
      );


    const modal =
      document.getElementById(
        "loginModal"
      );


    const osisArea =
      document.getElementById(
        "osis-area"
      );


    const password =

      passwordInput
        ?.value
        ?.trim()

      || "";


    /*
     * Tetap memakai mekanisme lockout
     * frontend website Anda.
     */

    if (

      typeof window.isLoginLocked ===
      "function"

      &&

      window.isLoginLocked()

    ) {

      if (

        typeof window.startLoginLockoutCountdown ===
        "function"

      ) {

        window.startLoginLockoutCountdown();

      }


      return;

    }


    // ---------------------------------------------------------
    // PASSWORD KOSONG
    // ---------------------------------------------------------

    if (
      !password
    ) {

      if (
        errorMsg
      ) {

        errorMsg.textContent =
          "Masukkan password terlebih dahulu.";


        errorMsg.style.display =
          "block";

      }


      passwordInput?.focus();


      return;

    }


    try {

      // -------------------------------------------------------
      // LOADING
      // -------------------------------------------------------

      if (
        button
      ) {

        button.disabled =
          true;


        button.style.opacity =
          "0.7";


        button.textContent =
          "Memverifikasi...";

      }


      if (
        errorMsg
      ) {

        errorMsg.style.display =
          "none";

      }


      // -------------------------------------------------------
      // LOGIN KE APPS SCRIPT
      // -------------------------------------------------------

      const loginResult =
        await api.login(
          password
        );


      /*
       * Apps Script memberikan token session.
       *
       * Password tidak disimpan di browser.
       */

      saveToken(
        loginResult.token
      );


      // -------------------------------------------------------
      // AMBIL ASPIRASI GOOGLE SHEETS
      // -------------------------------------------------------

      if (
        button
      ) {

        button.textContent =
          "Memuat Aspirasi...";

      }


      await refreshAspirasiFromServer();


      // -------------------------------------------------------
      // RESET LOGIN GUARD
      // -------------------------------------------------------

      if (

        typeof window.resetLoginGuard ===
        "function"

      ) {

        window.resetLoginGuard();

      }


      // -------------------------------------------------------
      // TUTUP MODAL
      // -------------------------------------------------------

      if (
        modal
      ) {

        modal.style.display =
          "none";

      }


      if (
        passwordInput
      ) {

        passwordInput.value =
          "";


        passwordInput.style.borderColor =
          "";

      }


      // -------------------------------------------------------
      // BUKA DASHBOARD
      // -------------------------------------------------------

      if (
        osisArea
      ) {

        osisArea.style.display =
          "block";

      }


      window.location.hash =
        "osis-area";


      setTimeout(

        () => {

          window.AOS
            ?.refresh
            ?.();

        },

        300
      );


      showToast(

        "Dashboard terhubung ke Google Sheets.",

        "success"

      );

    }

    catch (error) {

      console.error(

        "[Aspirasi] Login gagal:",

        error

      );


      /*
       * Kalau password salah,
       * tetap gunakan sistem batas percobaan lama.
       */

      if (

        /password salah/i.test(
          error.message || ""
        )

      ) {

        if (

          typeof window.registerFailedLoginAttempt ===
          "function"

        ) {

          window.registerFailedLoginAttempt();

        }


        if (
          passwordInput
        ) {

          passwordInput.value =
            "";


          passwordInput.style.borderColor =
            "#ef4444";

        }

      }


      if (
        errorMsg
      ) {

        errorMsg.textContent =

          error.message ||

          "Login gagal.";


        errorMsg.style.display =
          "block";

      }


      passwordInput?.focus();

    }

    finally {

      const locked =

        typeof window.isLoginLocked ===
        "function"

        &&

        window.isLoginLocked();


      if (
        button &&
        !locked
      ) {

        button.disabled =
          false;


        button.style.opacity =
          "1";


        button.textContent =
          "Masuk Dashboard";

      }

    }

  }


  /* =========================================================
     PASANG LOGIN BRIDGE
  ========================================================= */

  function installLoginBridge() {

    /*
     * Mengganti fungsi login lama.
     */

    window.verifikasiPassword =
      loginDashboardRemote;


    const loginButton =
      document.getElementById(
        "loginSubmitBtn"
      );


    /*
     * Capture digunakan supaya onclick lama
     * tidak memverifikasi password localStorage.
     */

    loginButton?.addEventListener(

      "click",

      function (
        event
      ) {

        event.preventDefault();

        event.stopImmediatePropagation();

        loginDashboardRemote();

      },

      true

    );


    const passwordInput =
      document.getElementById(
        "passwordInput"
      );


    /*
     * Login dengan tombol ENTER.
     */

    passwordInput?.addEventListener(

      "keyup",

      function (
        event
      ) {

        if (
          event.key !==
          "Enter"
        ) {

          return;

        }


        event.preventDefault();

        event.stopImmediatePropagation();


        loginDashboardRemote();

      },

      true

    );

  }


  /* =========================================================
     SIMPAN DETAIL ASPIRASI
     STATUS / PRIORITAS / CATATAN
  ========================================================= */

  async function saveDetailRemote() {

    const button =
      document.getElementById(
        "saveAspDetailBtn"
      );


    const id =

      document
        .getElementById(
          "asp-detail-id"
        )
        ?.value

      || "";


    if (
      !id
    ) {

      return;

    }


    const payload = {

      id,

      category:

        document
          .getElementById(
            "asp-detail-category"
          )
          ?.value

        || "Lainnya",


      priority:

        document
          .getElementById(
            "asp-detail-priority"
          )
          ?.value

        || "normal",


      status:

        document
          .getElementById(
            "asp-detail-status"
          )
          ?.value

        || "unread",


      internalNote:

        document
          .getElementById(
            "asp-detail-note"
          )
          ?.value
          ?.trim()

        || ""

    };


    try {

      if (
        button
      ) {

        button.disabled =
          true;


        button.style.opacity =
          "0.7";

      }


      setInline(

        "aspDetailMessage",

        "Menyimpan ke Google Sheets..."

      );


      // -------------------------------------------------------
      // UPDATE GOOGLE SHEETS
      // -------------------------------------------------------

      await api.update(
        payload
      );


      // -------------------------------------------------------
      // REFRESH DATA
      // -------------------------------------------------------

      await refreshAspirasiFromServer();


      setInline(

        "aspDetailMessage",

        "Perubahan tersimpan di Google Sheets.",

        "success"

      );


      showToast(

        "Perubahan aspirasi tersimpan.",

        "success"

      );


      setTimeout(

        function () {

          if (

            typeof window.closeAspirasiDetail ===
            "function"

          ) {

            window.closeAspirasiDetail();

          }

        },

        450
      );

    }

    catch (error) {

      console.error(

        "[Aspirasi] Update gagal:",

        error

      );


      setInline(

        "aspDetailMessage",

        "Gagal menyimpan: " +
        error.message,

        "error"

      );

    }

    finally {

      if (
        button
      ) {

        button.disabled =
          false;


        button.style.opacity =
          "1";

      }

    }

  }


  /* =========================================================
     PASANG DETAIL BRIDGE
  ========================================================= */

  function installDetailBridge() {

    window.saveAspirasiDetail =
      saveDetailRemote;


    const button =
      document.getElementById(
        "saveAspDetailBtn"
      );


    button?.addEventListener(

      "click",

      function (
        event
      ) {

        event.preventDefault();

        event.stopImmediatePropagation();


        saveDetailRemote();

      },

      true

    );

  }


  /* =========================================================
     HAPUS SATU ASPIRASI
  ========================================================= */

  window.deleteAspirasi =
    async function (
      id
    ) {

      if (
        !id
      ) {

        return;

      }


      if (

        !confirm(
          "Hapus aspirasi ini dari Google Sheets?"
        )

      ) {

        return;

      }


      try {

        await api.delete(
          id
        );


        /*
         * Hapus juga dari cache browser.
         */

        state.items =
          state.items.filter(

            function (
              item
            ) {

              return (
                item.id !== id
              );

            }

          );


        syncUiFromCache();


        showToast(

          "Aspirasi berhasil dihapus.",

          "success"

        );


        /*
         * Update counter publik.
         */

        try {

          const countResult =
            await api.count();


          setPublicCounter(
            countResult.total
          );

        }

        catch (error) {

          console.warn(
            error
          );

        }

      }

      catch (error) {

        console.error(

          "[Aspirasi] Hapus gagal:",

          error

        );


        showToast(

          "Gagal menghapus aspirasi: " +
          error.message,

          "error"

        );

      }

    };


  /* =========================================================
     HAPUS SEMUA ASPIRASI
  ========================================================= */

  window.clearAspirasiStorage =
    async function () {


      const konfirmasi1 =
        confirm(
          "Hapus SEMUA aspirasi dari Google Sheets? Tindakan ini tidak bisa dibatalkan."
        );


      if (
        !konfirmasi1
      ) {

        return;

      }


      const konfirmasi2 =
        confirm(
          "Konfirmasi sekali lagi: seluruh data aspirasi akan dihapus permanen. Lanjutkan?"
        );


      if (
        !konfirmasi2
      ) {

        return;

      }


      try {

        await api.clear();


        state.items = [];

        state.loaded = true;


        syncUiFromCache();


        setPublicCounter(
          0
        );


        showToast(

          "Semua aspirasi berhasil dihapus dari Google Sheets.",

          "success"

        );

      }

      catch (error) {

        console.error(

          "[Aspirasi] Hapus semua gagal:",

          error

        );


        showToast(

          "Gagal menghapus semua aspirasi: " +
          error.message,

          "error"

        );

      }

    };


  /* =========================================================
     GANTI PASSWORD DASHBOARD
  ========================================================= */

  function installPasswordChangeBridge() {

    const form =
      document.getElementById(
        "passwordChangeForm"
      );


    if (
      !form
    ) {

      return;

    }


    form.addEventListener(

      "submit",

      async function (
        event
      ) {

        /*
         * Stop handler password localStorage lama.
         */

        event.preventDefault();

        event.stopImmediatePropagation();


        const current =

          document
            .getElementById(
              "current-password"
            )
            ?.value

          || "";


        const next =

          document
            .getElementById(
              "new-password"
            )
            ?.value

          || "";


        const confirmNext =

          document
            .getElementById(
              "confirm-password"
            )
            ?.value

          || "";


        // -----------------------------------------------------
        // VALIDASI
        // -----------------------------------------------------

        if (
          next.length < 12
        ) {

          setInline(

            "passwordChangeMessage",

            "Password baru minimal 12 karakter.",

            "error"

          );


          return;

        }


        if (
          next !==
          confirmNext
        ) {

          setInline(

            "passwordChangeMessage",

            "Konfirmasi password baru tidak sama.",

            "error"

          );


          return;

        }


        try {

          // ---------------------------------------------------
          // VERIFIKASI PASSWORD LAMA
          // ---------------------------------------------------

          setInline(

            "passwordChangeMessage",

            "Memverifikasi password saat ini..."

          );


          const reauth =
            await api.login(
              current
            );


          // ---------------------------------------------------
          // GANTI PASSWORD
          // ---------------------------------------------------

          setInline(

            "passwordChangeMessage",

            "Mengganti password backend..."

          );


          await api.changePassword(

            next,

            reauth.token

          );


          /*
           * Backend membuat secret baru,
           * sehingga token lama otomatis tidak berlaku.
           */

          clearAdminSession();


          form.reset();


          setInline(

            "passwordChangeMessage",

            "Password berhasil diganti. Silakan login ulang.",

            "success"

          );


          showToast(

            "Password berhasil diganti. Silakan login ulang.",

            "success"

          );


          // ---------------------------------------------------
          // TUTUP DASHBOARD
          // ---------------------------------------------------

          const osisArea =
            document.getElementById(
              "osis-area"
            );


          if (
            osisArea
          ) {

            osisArea.style.display =
              "none";

          }


          // ---------------------------------------------------
          // BUKA LOGIN LAGI
          // ---------------------------------------------------

          setTimeout(

            function () {

              if (

                typeof window.bukaModalLogin ===
                "function"

              ) {

                window.bukaModalLogin();

              }

            },

            700
          );

        }

        catch (error) {

          console.error(

            "[Aspirasi] Ganti password gagal:",

            error

          );


          setInline(

            "passwordChangeMessage",

            "Gagal mengganti password: " +
            error.message,

            "error"

          );

        }

      },

      true

    );

  }


  /* =========================================================
     INITIALIZE
  ========================================================= */

  async function initialize() {

    loadToken();


    // Form siswa
    installPublicFormBridge();


    // Login admin
    installLoginBridge();


    // Detail aspirasi
    installDetailBridge();


    // Ganti password
    installPasswordChangeBridge();


    /*
     * Ambil JUMLAH aspirasi saja.
     *
     * Isi aspirasi tidak diambil sebelum admin login.
     */

    try {

      const countResult =
        await api.count();


      setPublicCounter(
        countResult.total
      );

    }

    catch (error) {

      console.warn(

        "[Aspirasi] Gagal mengambil jumlah aspirasi:",

        error.message

      );

    }


    console.log(
      "[Aspirasi] Bridge Google Sheets v2 aktif."
    );

  }


  /* =========================================================
     API GLOBAL
     Untuk pengembangan berikutnya.
  ========================================================= */

  window.OSISAspirasiAPI = {

    ...api,

    refresh:
      refreshAspirasiFromServer,

    getCache:
      function () {

        return state.items;

      },

    clearSession:
      clearAdminSession

  };


  /* =========================================================
     START
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(

      "DOMContentLoaded",

      initialize,

      {
        once: true
      }

    );

  }

  else {

    initialize();

  }

})();