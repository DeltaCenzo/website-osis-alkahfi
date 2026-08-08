/* =========================================================
   PWA
   ========================================================= */
// Install prompt, update service worker, dan boot galeri.

// PWA
let deferredPwaPrompt = null;
const installPwaBtn = document.getElementById('installPwaBtn');
const pwaInstallModal = document.getElementById('pwaInstallModal');
const pwaNativeInstallBtn = document.getElementById('pwaNativeInstallBtn');
        const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalonePwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

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

function closePwaInstallModal() {
    if (pwaInstallModal) pwaInstallModal.style.display = 'none';
}

function openPwaInstallModal() {
    if (!pwaInstallModal) return;
    const installText = document.getElementById('pwaInstallText');

    if (deferredPwaPrompt) {
        installText.textContent = 'Aplikasi OSIS siap dipasang di perangkat ini.';
        pwaNativeInstallBtn.hidden = false;
        pwaNativeInstallBtn.textContent = 'Install Sekarang';
    } else if (isIosDevice) {
        installText.textContent = 'Safari → Bagikan → Tambahkan ke Layar Utama.';
        pwaNativeInstallBtn.hidden = true;
    } else {
        installText.textContent = 'Gunakan opsi Install aplikasi pada menu browser.';
        pwaNativeInstallBtn.hidden = true;
    }

    pwaInstallModal.style.display = 'flex';
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPwaPrompt = event;
});

if (installPwaBtn) {
    installPwaBtn.hidden = isStandalonePwa;
    installPwaBtn.addEventListener('click', () => {
        if (typeof closeMobileNav === 'function') closeMobileNav();
        openPwaInstallModal();
    });
}
document.getElementById('closePwaInstallModal')?.addEventListener('click', closePwaInstallModal);
pwaInstallModal?.addEventListener('click', e => { if (e.target === pwaInstallModal) closePwaInstallModal(); });
pwaNativeInstallBtn?.addEventListener('click', async () => {
    if (!deferredPwaPrompt) return openPwaInstallModal();
    deferredPwaPrompt.prompt();
    const result = await deferredPwaPrompt.userChoice;
    if (result.outcome === 'accepted') showPwaToast('Aplikasi OSIS sedang ditambahkan ke perangkat.');
    deferredPwaPrompt = null;
    closePwaInstallModal();
    if (installPwaBtn) installPwaBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
    deferredPwaPrompt = null;
    if (installPwaBtn) installPwaBtn.hidden = true;
    showPwaToast('Aplikasi OSIS berhasil di-install.');
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
