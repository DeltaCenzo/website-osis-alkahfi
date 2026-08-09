/* =========================================================
   PUSH NOTIFICATION ADMIN — ONESIGNAL WEB SDK v16
   ========================================================= */

const OSIS_PUSH_SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const OSIS_PUSH_WORKER_FILE = 'push/onesignal/OneSignalSDKWorker.js';

let osisPushConfig = null;
let osisPushSdk = null;
let osisPushInitPromise = null;
let osisPushSubscriptionListenerAttached = false;
let osisPushCurrentSubscriptionId = '';
let osisPushRegistered = false;

function defaultPushPreferencesClient() {
    return {
        aspirasi: true,
        pengumuman: true,
        event: true,
        galeri: true,
        keamanan: true
    };
}

function getPushPreferenceInputs() {
    return {
        aspirasi: document.getElementById('pushPrefAspirasi'),
        pengumuman: document.getElementById('pushPrefPengumuman'),
        event: document.getElementById('pushPrefEvent'),
        galeri: document.getElementById('pushPrefGaleri'),
        keamanan: document.getElementById('pushPrefKeamanan')
    };
}

function readPushPreferences() {
    const inputs = getPushPreferenceInputs();
    const prefs = defaultPushPreferencesClient();
    Object.entries(inputs).forEach(([key, input]) => {
        if (input) prefs[key] = Boolean(input.checked);
    });
    return prefs;
}

function applyPushPreferences(preferences) {
    const prefs = {...defaultPushPreferencesClient(), ...(preferences || {})};
    const inputs = getPushPreferenceInputs();
    Object.entries(inputs).forEach(([key, input]) => {
        if (input) input.checked = prefs[key] !== false;
    });
}

function getPushSiteUrl() {
    try {
        return new URL('.', window.location.href).href.replace(/#.*$/, '');
    } catch (error) {
        return window.location.href.split('#')[0];
    }
}

function detectPushDeviceName() {
    const ua = navigator.userAgent || '';
    let browser = 'Browser';
    let platform = navigator.userAgentData?.platform || navigator.platform || 'Perangkat';

    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua)) browser = 'Opera';
    else if (/CriOS|Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/FxiOS|Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    if (/Android/i.test(ua)) platform = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iPhone/iPad';
    else if (/Windows/i.test(ua)) platform = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) platform = 'macOS';
    else if (/Linux/i.test(ua)) platform = 'Linux';

    return `${browser} • ${platform}`.slice(0, 100);
}

function isIosPushDevice() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function isStandalonePwa() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true;
}

function setPushInlineMessage(message, type = '') {
    const el = document.getElementById('pushAdminMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'form-message push-admin-message-v15';
    if (type) el.classList.add(type);
}

function setPushStatus(state, title, detail = '') {
    const badge = document.getElementById('pushStatusBadgeV15');
    const titleEl = document.getElementById('pushStatusTitleV15');
    const detailEl = document.getElementById('pushStatusDetailV15');

    if (badge) {
        badge.dataset.state = state;
        badge.innerHTML = state === 'active'
            ? '<i class="fa-solid fa-bell" aria-hidden="true"></i> Aktif'
            : state === 'blocked'
                ? '<i class="fa-solid fa-bell-slash" aria-hidden="true"></i> Diblokir'
                : state === 'loading'
                    ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Memuat'
                    : '<i class="fa-regular fa-bell" aria-hidden="true"></i> Belum aktif';
    }
    if (titleEl) titleEl.textContent = title || 'Notifikasi OSIS';
    if (detailEl) detailEl.textContent = detail || '';
}

function setPushButtonsState({configured=false, supported=false, registered=false, blocked=false}={}) {
    const activate = document.getElementById('activatePushBtnV15');
    const disable = document.getElementById('disablePushBtnV15');
    const save = document.getElementById('savePushPrefsBtnV15');
    const test = document.getElementById('testPushBtnV15');

    if (activate) {
        activate.hidden = registered;
        activate.disabled = !configured || !supported || blocked;
    }
    if (disable) {
        disable.hidden = !registered;
        disable.disabled = !registered;
    }
    if (save) save.disabled = !registered;
    if (test) test.disabled = !registered;
}

function getOneSignalWorkerOptions() {
    const basePath = (() => {
        try {
            const path = new URL('.', window.location.href).pathname;
            return path.endsWith('/') ? path : `${path}/`;
        } catch (error) {
            return '/';
        }
    })();

    return {
        serviceWorkerPath: `${basePath.replace(/^\/+/, '')}${OSIS_PUSH_WORKER_FILE}`,
        serviceWorkerParam: {
            scope: `${basePath}push/onesignal/`
        }
    };
}

function ensureOneSignalScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${OSIS_PUSH_SDK_URL}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = OSIS_PUSH_SDK_URL;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('SDK notifikasi gagal dimuat. Periksa koneksi internet.'));
        document.head.appendChild(script);
    });
}

async function getOneSignalInstance(appId) {
    if (osisPushSdk) return osisPushSdk;
    if (osisPushInitPromise) return osisPushInitPromise;

    osisPushInitPromise = new Promise((resolve, reject) => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                const worker = getOneSignalWorkerOptions();
                await OneSignal.init({
                    appId,
                    serviceWorkerPath: worker.serviceWorkerPath,
                    serviceWorkerParam: worker.serviceWorkerParam,
                    allowLocalhostAsSecureOrigin: true,
                    welcomeNotification: {disable: true}
                });
                osisPushSdk = OneSignal;
                resolve(OneSignal);
            } catch (error) {
                reject(error);
            }
        });
    });

    await ensureOneSignalScript();
    return osisPushInitPromise;
}

async function waitForPushSubscription(OneSignal, timeoutMs = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        const id = String(OneSignal.User.PushSubscription.id || '').trim();
        const optedIn = Boolean(OneSignal.User.PushSubscription.optedIn);
        if (id && optedIn) return id;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    return '';
}

async function getCurrentPushState() {
    if (!osisPushSdk) {
        return {supported:false, permission:false, optedIn:false, subscriptionId:''};
    }
    const supported = Boolean(await osisPushSdk.Notifications.isPushSupported());
    const permission = Boolean(osisPushSdk.Notifications.permission);
    const optedIn = Boolean(osisPushSdk.User.PushSubscription.optedIn);
    const subscriptionId = String(osisPushSdk.User.PushSubscription.id || '').trim();
    return {supported, permission, optedIn, subscriptionId};
}

async function registerCurrentPushDevice({silent=false}={}) {
    if (!aspirasiAdminToken || !osisPushSdk) return null;
    const state = await getCurrentPushState();
    if (!state.subscriptionId || !state.optedIn) return null;

    const deviceNameInput = document.getElementById('pushDeviceNameV15');
    const deviceName = (deviceNameInput?.value || '').trim() || detectPushDeviceName();

    const result = await aspirasiApi('pushRegister', {
        token: aspirasiAdminToken,
        subscriptionId: state.subscriptionId,
        deviceName,
        preferencesJson: JSON.stringify(readPushPreferences()),
        siteUrl: getPushSiteUrl()
    });

    osisPushCurrentSubscriptionId = state.subscriptionId;
    osisPushRegistered = true;
    if (deviceNameInput && !deviceNameInput.value.trim()) deviceNameInput.value = deviceName;
    if (!silent) showAppToast('Notifikasi OSIS aktif di perangkat ini.');
    return result;
}

function attachPushSubscriptionListener(OneSignal) {
    if (osisPushSubscriptionListenerAttached) return;
    osisPushSubscriptionListenerAttached = true;

    OneSignal.User.PushSubscription.addEventListener('change', async event => {
        try {
            const current = event?.current || {};
            osisPushCurrentSubscriptionId = String(current.id || '').trim();
            if (aspirasiAdminToken && current.optedIn && current.id) {
                await registerCurrentPushDevice({silent:true});
            }
            await refreshPushAdminPanel({silent:true});
        } catch (error) {
            console.warn('[Push] Sinkronisasi subscription gagal:', error.message);
        }
    });
}

async function initializePushForAdmin({silent=true}={}) {
    if (!aspirasiAdminToken) return;

    setPushStatus('loading', 'Memeriksa notifikasi...', 'Menghubungkan perangkat ke layanan push.');

    try {
        const config = await aspirasiApi('pushConfig', {token: aspirasiAdminToken});
        osisPushConfig = config;

        const countEl = document.getElementById('pushDeviceCountV15');
        if (countEl) countEl.textContent = String(config.deviceCount || 0);

        if (!config.configured || !config.appId) {
            setPushStatus('idle', 'Push notification belum disiapkan', 'Backend belum memiliki konfigurasi OneSignal.');
            setPushButtonsState({configured:false});
            setPushInlineMessage('Setup OneSignal belum selesai. Setelah App ID dan App API Key dipasang di backend, tombol aktivasi akan tersedia.', 'warning');
            return;
        }

        const OneSignal = await getOneSignalInstance(config.appId);
        attachPushSubscriptionListener(OneSignal);
        await refreshPushAdminPanel({silent});
    } catch (error) {
        console.error('[Push] Inisialisasi gagal:', error);
        setPushStatus('idle', 'Notifikasi belum tersedia', error.message || 'Tidak dapat memuat sistem notifikasi.');
        setPushButtonsState({configured:Boolean(osisPushConfig?.configured)});
        if (!silent) showAppToast('Notifikasi belum dapat diaktifkan: ' + error.message, 'error');
    }
}

async function refreshPushAdminPanel({silent=true}={}) {
    if (!aspirasiAdminToken || !osisPushConfig?.configured || !osisPushSdk) return;

    try {
        const state = await getCurrentPushState();
        osisPushCurrentSubscriptionId = state.subscriptionId;
        const blocked = typeof Notification !== 'undefined' && Notification.permission === 'denied';

        const status = await aspirasiApi('pushConfig', {
            token: aspirasiAdminToken,
            subscriptionId: state.subscriptionId || ''
        });
        osisPushRegistered = Boolean(status.current?.registered && state.optedIn);

        const countEl = document.getElementById('pushDeviceCountV15');
        if (countEl) countEl.textContent = String(status.deviceCount || 0);

        const deviceNameInput = document.getElementById('pushDeviceNameV15');
        if (deviceNameInput && !deviceNameInput.dataset.edited) {
            deviceNameInput.value = status.current?.deviceName || deviceNameInput.value || detectPushDeviceName();
        }
        if (status.current?.preferences) applyPushPreferences(status.current.preferences);

        if (!state.supported) {
            setPushStatus('idle', 'Browser tidak mendukung push', 'Gunakan Chrome, Edge, Firefox, atau Safari yang mendukung Web Push.');
        } else if (blocked) {
            setPushStatus('blocked', 'Notifikasi diblokir browser', 'Ubah izin notifikasi website menjadi Allow/Izinkan di pengaturan browser.');
        } else if (isIosPushDevice() && !isStandalonePwa()) {
            setPushStatus('idle', 'Tambahkan ke Home Screen', 'Di iPhone/iPad, buka website dari ikon Home Screen terlebih dahulu.');
        } else if (osisPushRegistered) {
            setPushStatus('active', 'Notifikasi aktif', 'Perangkat ini akan menerima pemberitahuan OSIS sesuai preferensi.');
        } else {
            setPushStatus('idle', 'Notifikasi belum aktif', 'Aktifkan sekali pada perangkat pengurus yang ingin menerima pemberitahuan.');
        }

        setPushButtonsState({
            configured:true,
            supported:state.supported,
            registered:osisPushRegistered,
            blocked
        });

        await refreshPushDeviceList();
    } catch (error) {
        console.warn('[Push] Gagal menyegarkan panel:', error);
        if (!silent) setPushInlineMessage(error.message, 'error');
    }
}

async function activatePushOnThisDevice() {
    if (!aspirasiAdminToken) return;

    const button = document.getElementById('activatePushBtnV15');
    const oldHtml = button?.innerHTML || '';
    try {
        if (!osisPushSdk) await initializePushForAdmin({silent:false});
        if (!osisPushSdk) throw new Error('SDK notifikasi belum siap.');

        if (isIosPushDevice() && !isStandalonePwa()) {
            throw new Error('Di iPhone/iPad, tambahkan website ke Home Screen lalu buka dari ikon tersebut sebelum mengaktifkan notifikasi.');
        }

        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengaktifkan...';
        }
        setPushInlineMessage('Browser akan meminta izin notifikasi. Pilih Izinkan/Allow.', '');

        await osisPushSdk.User.PushSubscription.optIn();
        const subscriptionId = await waitForPushSubscription(osisPushSdk);
        if (!subscriptionId) {
            if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
                throw new Error('Izin notifikasi ditolak. Ubah izin website menjadi Izinkan/Allow di pengaturan browser.');
            }
            throw new Error('Browser belum membuat subscription push. Coba tutup-buka website lalu ulangi.');
        }

        await registerCurrentPushDevice({silent:true});
        setPushInlineMessage('Notifikasi aktif. Coba tombol “Kirim Tes” untuk memastikan perangkat menerima push.', 'success');
        showAppToast('Notifikasi OSIS berhasil diaktifkan.');
        await refreshPushAdminPanel({silent:true});
    } catch (error) {
        console.error('[Push] Aktivasi gagal:', error);
        setPushInlineMessage(error.message, 'error');
        showAppToast('Gagal mengaktifkan notifikasi: ' + error.message, 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = oldHtml;
        }
    }
}

async function disablePushOnThisDevice() {
    if (!aspirasiAdminToken || !osisPushSdk) return;
    const state = await getCurrentPushState();
    const id = state.subscriptionId || osisPushCurrentSubscriptionId;
    if (!id) return;

    try {
        await aspirasiApi('pushUnregister', {
            token: aspirasiAdminToken,
            subscriptionId: id
        });
        await osisPushSdk.User.PushSubscription.optOut();
        osisPushRegistered = false;
        setPushInlineMessage('Notifikasi dinonaktifkan pada perangkat ini.', 'success');
        showAppToast('Notifikasi perangkat dinonaktifkan.');
        await refreshPushAdminPanel({silent:true});
    } catch (error) {
        setPushInlineMessage(error.message, 'error');
        showAppToast('Gagal menonaktifkan notifikasi: ' + error.message, 'error');
    }
}

async function savePushPreferences() {
    if (!aspirasiAdminToken || !osisPushRegistered || !osisPushCurrentSubscriptionId) return;
    try {
        const deviceName = document.getElementById('pushDeviceNameV15')?.value.trim() || detectPushDeviceName();
        await aspirasiApi('pushUpdatePreferences', {
            token: aspirasiAdminToken,
            subscriptionId: osisPushCurrentSubscriptionId,
            deviceName,
            preferencesJson: JSON.stringify(readPushPreferences())
        });
        setPushInlineMessage('Preferensi notifikasi berhasil disimpan.', 'success');
        showAppToast('Preferensi notifikasi disimpan.');
        await refreshPushDeviceList();
    } catch (error) {
        setPushInlineMessage(error.message, 'error');
    }
}

async function sendPushTest() {
    if (!aspirasiAdminToken || !osisPushCurrentSubscriptionId) return;
    const button = document.getElementById('testPushBtnV15');
    const oldHtml = button?.innerHTML || '';
    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
        }
        const result = await aspirasiApi('pushTest', {
            token: aspirasiAdminToken,
            subscriptionId: osisPushCurrentSubscriptionId
        });
        setPushInlineMessage(result.message || 'Notifikasi tes dikirim.', result.sent === false ? 'warning' : 'success');
        if (result.sent !== false) showAppToast('Notifikasi tes dikirim ke perangkat ini.');
    } catch (error) {
        setPushInlineMessage('Tes gagal: ' + error.message, 'error');
        showAppToast('Tes notifikasi gagal: ' + error.message, 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = oldHtml;
        }
    }
}

function formatPushDeviceDate(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return 'Belum diketahui';
    return date.toLocaleString('id-ID', {
        day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
}

function pushPreferenceSummary(prefs) {
    const labels = {
        aspirasi:'Aspirasi', pengumuman:'Pengumuman', event:'Event', galeri:'Galeri', keamanan:'Keamanan'
    };
    const active = Object.keys(labels).filter(key => prefs?.[key] !== false).map(key => labels[key]);
    return active.length === Object.keys(labels).length ? 'Semua notifikasi' : active.join(', ') || 'Semua kategori dimatikan';
}

async function refreshPushDeviceList() {
    const list = document.getElementById('pushDeviceListV15');
    if (!list || !aspirasiAdminToken) return;

    try {
        const result = await aspirasiApi('pushListDevices', {token: aspirasiAdminToken});
        const devices = Array.isArray(result.data) ? result.data : [];
        const countEl = document.getElementById('pushDeviceCountV15');
        if (countEl) countEl.textContent = String(devices.length);

        if (!devices.length) {
            list.innerHTML = '<div class="push-device-empty-v15"><i class="fa-regular fa-bell-slash"></i><span>Belum ada perangkat OSIS terdaftar.</span></div>';
            return;
        }

        list.innerHTML = '';
        devices.forEach(device => {
            const item = document.createElement('div');
            item.className = 'push-device-item-v15';
            const isCurrent = device.subscriptionId === osisPushCurrentSubscriptionId;

            const main = document.createElement('div');
            main.className = 'push-device-main-v15';
            const title = document.createElement('strong');
            title.textContent = device.deviceName || 'Perangkat OSIS';
            if (isCurrent) {
                const chip = document.createElement('span');
                chip.className = 'push-current-chip-v15';
                chip.textContent = 'Perangkat ini';
                title.appendChild(chip);
            }
            const meta = document.createElement('small');
            meta.textContent = `${pushPreferenceSummary(device.preferences)} • Aktif ${formatPushDeviceDate(device.lastActiveAt)}`;
            main.append(title, meta);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'gallery-mini-btn danger';
            remove.innerHTML = '<i class="fa-solid fa-link-slash" aria-hidden="true"></i><span>Cabut</span>';
            remove.addEventListener('click', async () => {
                if (!confirm(`Cabut akses notifikasi “${device.deviceName || 'perangkat ini'}”?`)) return;
                try {
                    await aspirasiApi('pushRemoveDevice', {
                        token: aspirasiAdminToken,
                        subscriptionId: device.subscriptionId
                    });
                    if (isCurrent && osisPushSdk) {
                        await osisPushSdk.User.PushSubscription.optOut().catch(() => {});
                        osisPushRegistered = false;
                    }
                    showAppToast('Akses notifikasi perangkat dicabut.');
                    await refreshPushAdminPanel({silent:true});
                } catch (error) {
                    showAppToast('Gagal mencabut perangkat: ' + error.message, 'error');
                }
            });

            item.append(main, remove);
            list.appendChild(item);
        });
    } catch (error) {
        list.innerHTML = `<div class="push-device-empty-v15"><span>Gagal memuat perangkat: ${escapeHtml(error.message)}</span></div>`;
    }
}

async function notifyGalleryAdminChange({kind, albumTitle='', count=0}={}) {
    if (!aspirasiAdminToken) return;
    try {
        await aspirasiApi('pushNotifyChange', {
            token: aspirasiAdminToken,
            kind: String(kind || ''),
            albumTitle: String(albumTitle || ''),
            count: Number(count) || 0
        });
    } catch (error) {
        // Perubahan galeri tetap dianggap sukses walau push sedang bermasalah.
        console.warn('[Push] Notifikasi perubahan galeri gagal:', error.message);
    }
}

function initializePushUi() {
    const deviceName = document.getElementById('pushDeviceNameV15');
    if (deviceName && !deviceName.value) deviceName.value = detectPushDeviceName();
    deviceName?.addEventListener('input', () => { deviceName.dataset.edited = '1'; });

    document.getElementById('activatePushBtnV15')?.addEventListener('click', activatePushOnThisDevice);
    document.getElementById('disablePushBtnV15')?.addEventListener('click', disablePushOnThisDevice);
    document.getElementById('savePushPrefsBtnV15')?.addEventListener('click', savePushPreferences);
    document.getElementById('testPushBtnV15')?.addEventListener('click', sendPushTest);
    document.getElementById('refreshPushDevicesBtnV15')?.addEventListener('click', () => refreshPushAdminPanel({silent:false}));
    document.getElementById('dashboardTabNotifications')?.addEventListener('click', () => initializePushForAdmin({silent:true}));
}

window.initializePushForAdmin = initializePushForAdmin;
window.refreshPushAdminPanel = refreshPushAdminPanel;
window.notifyGalleryAdminChange = notifyGalleryAdminChange;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePushUi, {once:true});
} else {
    initializePushUi();
}
