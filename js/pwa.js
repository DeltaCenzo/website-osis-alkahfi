/* =========================================================
   PWA — INSTALL GUIDE + UPDATE SERVICE WORKER V16
   ========================================================= */

let deferredPwaPrompt = null;
const installPwaBtn = document.getElementById('installPwaBtn');
const pwaInstallModal = document.getElementById('pwaInstallModal');
const pwaNativeInstallBtn = document.getElementById('pwaNativeInstallBtn');
const pwaInstallLaterBtn = document.getElementById('pwaInstallLaterBtnV16');
const pwaInstallSteps = document.getElementById('pwaInstallSteps');
const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
const isAndroidDevice = /android/i.test(navigator.userAgent || '');
const isStandalonePwa = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
const PWA_GUIDE_DISMISS_KEY = 'osis-pwa-install-guide-dismissed-v16';
const PWA_GUIDE_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function showPwaToast(message, type='info') {
    const toast = document.getElementById('pwaToast');
    if (!toast) return;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    toast.className = `pwa-toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
    toast.classList.add('show');
    clearTimeout(showPwaToast.timer);
    showPwaToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function showAppToast(message, type='success') { showPwaToast(message, type); }
window.showAppToast = showAppToast;

function setPwaInstallSteps(steps) {
    if (!pwaInstallSteps) return;
    pwaInstallSteps.innerHTML = '';
    steps.forEach((step, index) => {
        const item = document.createElement('div');
        item.className = 'pwa-install-step-v16';
        const number = document.createElement('span');
        number.textContent = String(index + 1);
        const text = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = step.title;
        const detail = document.createElement('small');
        detail.textContent = step.detail;
        text.append(title, detail);
        item.append(number, text);
        pwaInstallSteps.appendChild(item);
    });
}

function rememberPwaGuideDismissed() {
    try { localStorage.setItem(PWA_GUIDE_DISMISS_KEY, String(Date.now())); } catch (_) {}
}

function wasPwaGuideRecentlyDismissed() {
    try {
        const value = Number(localStorage.getItem(PWA_GUIDE_DISMISS_KEY) || 0);
        return value > 0 && Date.now() - value < PWA_GUIDE_COOLDOWN_MS;
    } catch (_) {
        return false;
    }
}

function closePwaInstallModal({remember=true}={}) {
    if (pwaInstallModal) pwaInstallModal.style.display = 'none';
    if (remember) rememberPwaGuideDismissed();
}

function configurePwaInstallGuide() {
    const installText = document.getElementById('pwaInstallText');
    const title = document.getElementById('pwaInstallTitle');
    if (!installText || !title || !pwaNativeInstallBtn) return;

    if (isIosDevice) {
        title.textContent = 'Pasang OSIS di iPhone/iPad';
        installText.textContent = 'Apple mewajibkan website dipasang ke Home Screen sebelum Web Push dapat digunakan. Prosesnya hanya sekali.';
        setPwaInstallSteps([
            {title:'Ketuk tombol Bagikan', detail:'Di browser, buka menu Share/Bagikan (ikon kotak dengan panah ke atas).'},
            {title:'Pilih “Tambahkan ke Layar Utama”', detail:'Jika belum terlihat, gulir daftar aksi ke bawah.'},
            {title:'Tekan Tambah', detail:'Ikon OSIS akan muncul di Home Screen seperti aplikasi biasa.'},
            {title:'Buka dari ikon OSIS', detail:'Setelah itu masuk Area OSIS → Notifikasi → Aktifkan di Perangkat Ini.'}
        ]);
        pwaNativeInstallBtn.hidden = true;
        return;
    }

    if (deferredPwaPrompt) {
        title.textContent = 'Install Aplikasi OSIS';
        installText.textContent = 'Browser kamu sudah siap memasang OSIS sebagai aplikasi. Tidak perlu download dari Play Store.';
        setPwaInstallSteps([
            {title:'Tekan “Install Sekarang”', detail:'Browser akan menampilkan konfirmasi instalasi.'},
            {title:'Konfirmasi Install', detail:'Tunggu beberapa detik sampai ikon OSIS dibuat.'},
            {title:'Buka dari ikon OSIS', detail:'Login Area OSIS lalu aktifkan notifikasi jika dibutuhkan.'}
        ]);
        pwaNativeInstallBtn.hidden = false;
        pwaNativeInstallBtn.innerHTML = '<i class="fa-solid fa-download"></i> Install Sekarang';
        return;
    }

    title.textContent = 'Tambahkan OSIS ke perangkat';
    installText.textContent = 'Browser ini belum menampilkan tombol instalasi otomatis. Kamu tetap bisa memasangnya dari menu browser.';
    setPwaInstallSteps([
        {title:'Buka menu browser', detail:isAndroidDevice ? 'Ketuk menu ⋮ di pojok browser.' : 'Buka menu utama browser.'},
        {title:'Cari opsi Install', detail:'Pilih “Install app”, “Install aplikasi”, atau “Tambahkan ke Home Screen”.'},
        {title:'Buka dari ikon OSIS', detail:'Setelah terpasang, website dapat dibuka seperti aplikasi biasa.'}
    ]);
    pwaNativeInstallBtn.hidden = true;
}

function openPwaInstallGuide({manual=false}={}) {
    if (!pwaInstallModal || isStandalonePwa) {
        if (manual && isStandalonePwa) showPwaToast('Aplikasi OSIS sudah terpasang di perangkat ini.', 'success');
        return;
    }
    configurePwaInstallGuide();
    pwaInstallModal.style.display = 'flex';
}
window.openPwaInstallGuide = openPwaInstallGuide;

function maybeAutoShowPwaInstallGuide() {
    if (isStandalonePwa || wasPwaGuideRecentlyDismissed() || document.visibilityState !== 'visible') return;
    const isMobile = window.matchMedia?.('(max-width: 760px)')?.matches;
    if (!isMobile && !deferredPwaPrompt) return;

    // Jangan menimpa dialog lain yang sedang dibuka.
    const anotherModalOpen = [...document.querySelectorAll('.modal-overlay')]
        .some(el => el !== pwaInstallModal && getComputedStyle(el).display !== 'none');
    if (anotherModalOpen) return;

    openPwaInstallGuide();
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPwaPrompt = event;
    if (installPwaBtn && !isStandalonePwa) installPwaBtn.hidden = false;
});

if (installPwaBtn) {
    installPwaBtn.hidden = isStandalonePwa;
    installPwaBtn.addEventListener('click', () => {
        if (typeof closeMobileNav === 'function') closeMobileNav();
        openPwaInstallGuide({manual:true});
    });
}

document.getElementById('closePwaInstallModal')?.addEventListener('click', () => closePwaInstallModal({remember:true}));
pwaInstallLaterBtn?.addEventListener('click', () => closePwaInstallModal({remember:true}));
pwaInstallModal?.addEventListener('click', event => {
    if (event.target === pwaInstallModal) closePwaInstallModal({remember:true});
});

pwaNativeInstallBtn?.addEventListener('click', async () => {
    if (!deferredPwaPrompt) {
        configurePwaInstallGuide();
        return;
    }
    try {
        deferredPwaPrompt.prompt();
        const result = await deferredPwaPrompt.userChoice;
        if (result.outcome === 'accepted') {
            showPwaToast('Aplikasi OSIS sedang ditambahkan ke perangkat.', 'success');
            rememberPwaGuideDismissed();
        }
    } catch (error) {
        showPwaToast('Browser belum dapat membuka instalasi. Gunakan menu browser → Install aplikasi.', 'warning');
    } finally {
        deferredPwaPrompt = null;
        if (pwaInstallModal) pwaInstallModal.style.display = 'none';
    }
});

window.addEventListener('appinstalled', () => {
    deferredPwaPrompt = null;
    rememberPwaGuideDismissed();
    if (installPwaBtn) installPwaBtn.hidden = true;
    if (pwaInstallModal) pwaInstallModal.style.display = 'none';
    showPwaToast('Aplikasi OSIS berhasil di-install.', 'success');
});

// Panduan otomatis hanya sekali-sekali, bukan setiap kunjungan.
window.addEventListener('load', () => {
    if (!isStandalonePwa) setTimeout(maybeAutoShowPwaInstallGuide, isIosDevice ? 4500 : 6500);
});

let waitingServiceWorker = null;
const pwaUpdateBar = document.getElementById('pwaUpdateBar');
function showPwaUpdate(registration) {
    waitingServiceWorker = registration?.waiting || waitingServiceWorker;
    if (waitingServiceWorker && pwaUpdateBar) pwaUpdateBar.hidden = false;
}
async function registerPwaServiceWorker() {
    if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        if (registration.waiting && navigator.serviceWorker.controller) showPwaUpdate(registration);
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) showPwaUpdate(registration);
            });
        });
        setTimeout(() => registration.update().catch(()=>{}), 2500);
    } catch(err) { console.warn('Service worker gagal didaftarkan:', err); }
}
let reloadingForPwaUpdate = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (reloadingForPwaUpdate) return;
    reloadingForPwaUpdate = true;
    location.reload();
});
document.getElementById('pwaUpdateNowBtn')?.addEventListener('click', () => {
    if (!waitingServiceWorker) return;
    waitingServiceWorker.postMessage({type:'SKIP_WAITING'});
});
document.getElementById('pwaUpdateLaterBtn')?.addEventListener('click', () => { if (pwaUpdateBar) pwaUpdateBar.hidden = true; });
window.addEventListener('load', registerPwaServiceWorker);

const bootGallery = () => initializeGallerySystem();
if ('requestIdleCallback' in window) requestIdleCallback(bootGallery, {timeout:1200});
else setTimeout(bootGallery, 250);
