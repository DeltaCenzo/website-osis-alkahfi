/* =========================================================
   PWA — PLATFORM-AWARE INSTALL EXPERIENCE V19
   ========================================================= */

let deferredPwaPrompt = null;
const installPwaBtn = document.getElementById('installPwaBtn');
const pwaInstallModal = document.getElementById('pwaInstallModal');
const pwaInstallCard = document.getElementById('pwaInstallCard');
const pwaNativeInstallBtn = document.getElementById('pwaNativeInstallBtn');
const pwaInstallLaterBtn = document.getElementById('pwaInstallLaterBtnV16');
const pwaInstallSteps = document.getElementById('pwaInstallSteps');
const pwaAndroidSummary = document.getElementById('pwaAndroidSummary');
const pwaInstallKicker = document.getElementById('pwaInstallKicker');
const pwaAppMeta = document.getElementById('pwaAppMeta');
const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
const isAndroidDevice = /android/i.test(navigator.userAgent || '');
const isStandalonePwa = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
const PWA_GUIDE_DISMISS_KEY = 'osis-pwa-install-guide-dismissed-v19';
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
    pwaInstallSteps.hidden = !steps.length;
    steps.forEach((step, index) => {
        const item = document.createElement('div');
        item.className = 'pwa-install-step-v18';

        const number = document.createElement('span');
        number.className = 'pwa-step-number-v18';
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

function setInstallMode(mode) {
    if (!pwaInstallCard) return;
    pwaInstallCard.dataset.installMode = mode;
    pwaInstallCard.classList.toggle('is-ios', mode === 'ios');
    pwaInstallCard.classList.toggle('is-android', mode.startsWith('android'));
    pwaInstallCard.classList.toggle('is-native-install', mode === 'android-native' || mode === 'native');
}

function configurePwaInstallGuide() {
    const installText = document.getElementById('pwaInstallText');
    const title = document.getElementById('pwaInstallTitle');
    if (!installText || !title || !pwaNativeInstallBtn) return;

    pwaNativeInstallBtn.hidden = false;
    pwaInstallLaterBtn && (pwaInstallLaterBtn.textContent = 'Nanti');
    if (pwaAppMeta) pwaAppMeta.textContent = 'OSIS SMA Al-Kahfi • Aplikasi Web';

    if (isIosDevice) {
        setInstallMode('ios');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS • iPHONE/iPAD';
        title.textContent = 'Pasang Aplikasi OSIS';
        installText.textContent = 'Tambahkan OSIS ke Home Screen agar lebih cepat dibuka dan terasa seperti aplikasi biasa.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([
            {title:'Ketuk Bagikan', detail:'Di Safari, tekan ikon kotak dengan panah ke atas.'},
            {title:'Tambahkan ke Layar Utama', detail:'Pilih menu tersebut lalu tekan Tambah.'}
        ]);
        pwaNativeInstallBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Oke, Paham';
        pwaNativeInstallBtn.dataset.action = 'close-guide';
        return;
    }

    if (isAndroidDevice && deferredPwaPrompt) {
        setInstallMode('android-native');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS • ANDROID';
        title.textContent = 'Install Aplikasi OSIS';
        installText.textContent = 'Pasang sekali, lalu buka OSIS langsung dari Home Screen seperti aplikasi biasa.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([]);
        pwaNativeInstallBtn.innerHTML = '<i class="fa-brands fa-android" aria-hidden="true"></i> Install Aplikasi';
        pwaNativeInstallBtn.dataset.action = 'native-install';
        return;
    }

    if (deferredPwaPrompt) {
        setInstallMode('native');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS';
        title.textContent = 'Install Aplikasi OSIS';
        installText.textContent = 'Pasang OSIS sebagai aplikasi agar lebih cepat dibuka dan tersedia langsung dari perangkat.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([]);
        pwaNativeInstallBtn.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i> Install Aplikasi';
        pwaNativeInstallBtn.dataset.action = 'native-install';
        return;
    }

    if (isAndroidDevice) {
        setInstallMode('android-fallback');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS • ANDROID';
        title.textContent = 'Tambahkan OSIS ke Android';
        installText.textContent = 'Browser belum menyediakan tombol install otomatis. Kamu tetap bisa memasangnya dari menu browser.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([
            {title:'Buka menu ⋮ browser', detail:'Biasanya berada di pojok kanan atas Chrome atau browser Android.'},
            {title:'Pilih “Install aplikasi”', detail:'Jika tidak ada, pilih “Tambahkan ke layar utama”.'}
        ]);
        pwaNativeInstallBtn.hidden = true;
        pwaNativeInstallBtn.dataset.action = '';
        return;
    }

    setInstallMode('fallback');
    if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS';
    title.textContent = 'Tambahkan OSIS ke perangkat';
    installText.textContent = 'Browser ini belum menampilkan instalasi otomatis. Gunakan menu browser untuk menambahkan OSIS sebagai aplikasi.';
    if (pwaAndroidSummary) pwaAndroidSummary.hidden = true;
    setPwaInstallSteps([
        {title:'Buka menu browser', detail:'Cari menu instalasi atau opsi menambahkan website ke perangkat.'},
        {title:'Pilih Install / Tambahkan', detail:'Setelah selesai, buka OSIS dari ikon yang dibuat.'}
    ]);
    pwaNativeInstallBtn.hidden = true;
    pwaNativeInstallBtn.dataset.action = '';
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

    const anotherModalOpen = [...document.querySelectorAll('.modal-overlay')]
        .some(el => el !== pwaInstallModal && getComputedStyle(el).display !== 'none');
    if (anotherModalOpen) return;

    openPwaInstallGuide();
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPwaPrompt = event;
    if (installPwaBtn && !isStandalonePwa) installPwaBtn.hidden = false;
    if (pwaInstallModal && getComputedStyle(pwaInstallModal).display !== 'none') configurePwaInstallGuide();
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
    if (pwaNativeInstallBtn.dataset.action === 'close-guide') {
        closePwaInstallModal({remember:true});
        return;
    }
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
            closePwaInstallModal({remember:false});
        } else {
            showPwaToast('Instalasi dibatalkan. Kamu bisa memasangnya kapan saja.', 'info');
        }
    } catch (error) {
        showPwaToast('Browser belum dapat membuka instalasi. Gunakan menu browser → Install aplikasi.', 'warning');
    } finally {
        deferredPwaPrompt = null;
    }
});

window.addEventListener('appinstalled', () => {
    deferredPwaPrompt = null;
    rememberPwaGuideDismissed();
    if (installPwaBtn) installPwaBtn.hidden = true;
    if (pwaInstallModal) pwaInstallModal.style.display = 'none';
    showPwaToast('Aplikasi OSIS berhasil di-install.', 'success');
});

window.addEventListener('load', () => {
    if (!isStandalonePwa) setTimeout(maybeAutoShowPwaInstallGuide, isIosDevice ? 4500 : 5500);
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
