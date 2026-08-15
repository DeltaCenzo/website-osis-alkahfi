/* =========================================================
   ASPIRASI & AUTH BACKEND
   ========================================================= */
// Google Apps Script / Google Sheets; tanpa autentikasi PBKDF2 lokal lama.

// Authentication
const modal = document.getElementById('loginModal');
const osisArea = document.getElementById('osis-area');
const errorMsg = document.getElementById('errorMsg');
const passwordInput = document.getElementById('passwordInput');
const toggleLoginPasswordBtn = document.getElementById('toggleLoginPasswordV91');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const trustedLoginHint = document.getElementById('trustedLoginHint');

// =============================================================
// ASPIRASI API v2 — Google Apps Script / Google Sheets
// GANTI URL DI BAWAH INI DENGAN WEB APP URL YANG BERAKHIR /exec
// =============================================================
const ASPIRASI_API_URL = window.OSIS_ASPIRASI_CONFIG?.appsScriptUrl || '';
const ASPIRASI_SESSION_KEY = 'osis_aspirasi_admin_session_v2';
const ASPIRASI_REQUEST_TIMEOUT_MS = 25000;
const TRUSTED_DEVICE_STORAGE_KEY = 'osis_trusted_device_v1';

let aspirasiRemoteCache = [];
let aspirasiAdminToken = sessionStorage.getItem(ASPIRASI_SESSION_KEY) || '';
let aspirasiRemoteLoading = false;

// ID acak lokal untuk rate-limit dasar di backend. Ini bukan identitas siswa
// dan tidak dikirim ke layanan selain backend OSIS.
const OSIS_CLIENT_ID_KEY = 'osis_client_id_v1';

function getOsisClientId() {
    try {
        let value = localStorage.getItem(OSIS_CLIENT_ID_KEY) || '';
        if (!/^[A-Za-z0-9_-]{16,80}$/.test(value)) {
            value = (globalThis.crypto?.randomUUID?.() ||
                ('c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)))
                .replace(/[^A-Za-z0-9_-]/g, '')
                .slice(0, 80);
            localStorage.setItem(OSIS_CLIENT_ID_KEY, value);
        }
        return value;
    } catch (error) {
        return '';
    }
}

function getTrustedDeviceDefaultName() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const isiOS = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isWindows = /Windows/i.test(ua);
    const isMac = /Macintosh|Mac OS X/i.test(ua) && !isiOS;
    const isEdge = /Edg\//i.test(ua);
    const isChrome = /Chrome\//i.test(ua) && !isEdge;
    const isFirefox = /Firefox\//i.test(ua);
    const isSafari = /Safari\//i.test(ua) && !/Chrome|CriOS|Edg|FxiOS/i.test(ua);

    const browser = isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Browser';
    const device = isiOS ? 'iPhone/iPad' : isAndroid ? 'Android' : isWindows ? 'Windows' : isMac ? 'Mac' : 'Perangkat';
    return `${browser} • ${device}`;
}

function getTrustedDeviceCredentials() {
    try {
        const parsed = JSON.parse(localStorage.getItem(TRUSTED_DEVICE_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.token || !parsed.deviceId) return null;
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
            localStorage.removeItem(TRUSTED_DEVICE_STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}

function saveTrustedDeviceCredentials(result) {
    if (!result?.trustedToken || !result?.trustedDeviceId) return;
    const payload = {
        token: String(result.trustedToken),
        deviceId: String(result.trustedDeviceId),
        name: getTrustedDeviceDefaultName(),
        expiresAt: String(result.trustedExpiresAt || '')
    };
    try {
        localStorage.setItem(TRUSTED_DEVICE_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('[Auth] Gagal menyimpan perangkat tepercaya:', error.message);
    }
}

function clearTrustedDeviceCredentials() {
    try {
        localStorage.removeItem(TRUSTED_DEVICE_STORAGE_KEY);
    } catch (error) {
        // Abaikan kegagalan storage pada mode browser terbatas.
    }
}

function formatTrustedDeviceDate(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
}

function getAspirasiApiUrl() {
    const url = String(ASPIRASI_API_URL || '').trim();
    if (!url || url.includes('GANTI_DENGAN_URL')) {
        throw new Error('URL Google Apps Script belum dimasukkan di aspirasi-config.js.');
    }
    if (!url.endsWith('/exec')) {
        console.warn('[Aspirasi] Web App URL sebaiknya berakhiran /exec.');
    }
    return url;
}

async function aspirasiApi(action, payload = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ASPIRASI_REQUEST_TIMEOUT_MS);
    const body = new URLSearchParams();
    body.set('action', action);
    Object.entries(payload).forEach(([key, value]) => {
        body.set(key, value == null ? '' : String(value));
    });

    try {
        const response = await fetch(getAspirasiApiUrl(), {
            method: 'POST',
            body,
            signal: controller.signal,
            redirect: 'follow',
            credentials: 'omit'
        });
        if (!response.ok) throw new Error(`Server aspirasi merespons HTTP ${response.status}.`);
        const result = await response.json();
        if (!result || result.success !== true) {
            throw new Error(result?.message || 'Permintaan ke server aspirasi gagal.');
        }
        return result;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('Server aspirasi terlalu lama merespons. Coba lagi.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function setAspirasiAdminToken(token) {
    aspirasiAdminToken = String(token || '');

    if (aspirasiAdminToken) {
        sessionStorage.setItem(
            ASPIRASI_SESSION_KEY,
            aspirasiAdminToken
        );
    } else {
        sessionStorage.removeItem(
            ASPIRASI_SESSION_KEY
        );

        // Jangan biarkan kredensial galeri tertinggal
        // setelah sesi admin berakhir / password diganti.
        if (
            typeof window.clearDriveAdminCredential ===
            'function'
        ) {
            window.clearDriveAdminCredential();
        }
    }
}

function normalizeAspiration(item) {
    const copy = { ...(item || {}) };
    if (!copy.id) copy.id = '';
    if (!['unread', 'processing', 'done'].includes(copy.status)) copy.status = 'unread';
    if (!['high', 'normal', 'low'].includes(copy.priority)) copy.priority = 'normal';
    if (typeof copy.internalNote !== 'string') copy.internalNote = '';
    if (typeof copy.category !== 'string' || !copy.category) copy.category = 'Lainnya';
    if (typeof copy.name !== 'string' || !copy.name) copy.name = 'Anonim';
    if (typeof copy.kelas !== 'string' || !copy.kelas) copy.kelas = '-';
    if (typeof copy.message !== 'string') copy.message = '';
    if (typeof copy.timestamp !== 'string') copy.timestamp = String(copy.timestamp || '');
    return copy;
}

function showAspirasiTableLoading(message = 'Memuat data aspirasi dari Google Sheets...') {
    const tbody = document.getElementById('osisTbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>&nbsp; ${escapeHtml(message)}</td></tr>`;
}

function showAspirasiTableError(message) {
    const tbody = document.getElementById('osisTbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;"><strong>Data aspirasi belum dapat dimuat.</strong><br><br>${escapeHtml(message || 'Terjadi kesalahan.')}</td></tr>`;
}

async function refreshAspirasiFromServer({ showLoading = true } = {}) {
    if (!aspirasiAdminToken) throw new Error('Sesi admin belum tersedia. Silakan login kembali.');
    if (aspirasiRemoteLoading) return aspirasiRemoteCache;
    aspirasiRemoteLoading = true;
    if (showLoading) showAspirasiTableLoading();
    try {
        const result = await aspirasiApi('list', { token: aspirasiAdminToken });
        aspirasiRemoteCache = Array.isArray(result.data) ? result.data.map(normalizeAspiration) : [];
        renderAspirasiList();
        if (typeof updateQuickActionsV13 === 'function') updateQuickActionsV13();
        return aspirasiRemoteCache;
    } catch (error) {
        if (/sesi admin|kedaluwarsa|token/i.test(error.message || '')) setAspirasiAdminToken('');
        showAspirasiTableError(error.message);
        throw error;
    } finally {
        aspirasiRemoteLoading = false;
    }
}

async function refreshPublicAspirasiCount() {
    try {
        const result = await aspirasiApi('count');
        const total = Math.max(0, Number(result.total) || 0);
        const publicCounter = document.querySelector('#aspirasiCounter .stat-number');
        if (publicCounter) {
            publicCounter.dataset.target = String(total);
            publicCounter.textContent = String(total);
        }
    } catch (error) {
        console.warn('[Aspirasi] Gagal mengambil jumlah aspirasi:', error.message);
    }
}

// Login guard lokal hanya membatasi brute-force pada browser ini.
const LOGIN_GUARD_STORAGE_KEY = 'osis_login_guard_preview_v1';
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000;
let loginLockoutTimer = null;

function getLoginGuard() {
    try {
        const stored = JSON.parse(localStorage.getItem(LOGIN_GUARD_STORAGE_KEY) || 'null');
        if (stored && Number.isInteger(stored.failedAttempts) && Number.isFinite(stored.lockedUntil)) {
            return {
                failedAttempts: Math.max(0, stored.failedAttempts),
                lockedUntil: Math.max(0, stored.lockedUntil)
            };
        }
    } catch (e) {
    }
    return { failedAttempts: 0, lockedUntil: 0 };
}

function saveLoginGuard(guard) {
    localStorage.setItem(LOGIN_GUARD_STORAGE_KEY, JSON.stringify(guard));
}

function resetLoginGuard() {
    localStorage.removeItem(LOGIN_GUARD_STORAGE_KEY);
    if (loginLockoutTimer) {
        clearInterval(loginLockoutTimer);
        loginLockoutTimer = null;
    }
}

function getLockoutRemainingMs() {
    const guard = getLoginGuard();
    return Math.max(0, guard.lockedUntil - Date.now());
}

function isLoginLocked() {
    const remaining = getLockoutRemainingMs();
    if (remaining <= 0) {
        const guard = getLoginGuard();
        if (guard.lockedUntil > 0) resetLoginGuard();
        return false;
    }
    return true;
}

function setLoginControlsLocked(locked) {
    passwordInput.disabled = locked;
    loginSubmitBtn.disabled = locked;
    loginSubmitBtn.style.opacity = locked ? '0.6' : '1';
    loginSubmitBtn.style.cursor = locked ? 'not-allowed' : '';
}

function refreshLockoutMessage() {
    const remaining = getLockoutRemainingMs();
    if (remaining <= 0) {
        resetLoginGuard();
        setLoginControlsLocked(false);
        passwordInput.style.borderColor = '';
        if (modal.style.display === 'flex') {
            errorMsg.textContent = 'Kunci sementara selesai. Silakan coba login lagi.';
            errorMsg.style.display = 'block';
            passwordInput.focus();
        }
        return false;
    }

    const seconds = Math.max(1, Math.ceil(remaining / 1000));
    setLoginControlsLocked(true);
    passwordInput.style.borderColor = '#ef4444';
    errorMsg.textContent = `Terlalu banyak percobaan salah. Coba lagi dalam ${seconds} detik.`;
    errorMsg.style.display = 'block';
    return true;
}

function startLoginLockoutCountdown() {
    if (loginLockoutTimer) clearInterval(loginLockoutTimer);
    refreshLockoutMessage();
    loginLockoutTimer = setInterval(() => {
        if (!refreshLockoutMessage()) {
            clearInterval(loginLockoutTimer);
            loginLockoutTimer = null;
        }
    }, 250);
}

function registerFailedLoginAttempt() {
    const guard = getLoginGuard();
    guard.failedAttempts += 1;

    if (guard.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        guard.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        saveLoginGuard(guard);
        startLoginLockoutCountdown();
        return { locked: true, remainingAttempts: 0 };
    }

    saveLoginGuard(guard);
    return {
        locked: false,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - guard.failedAttempts
    };
}


function setLoginPasswordVisibility(show) {
    if (!passwordInput) return;

    const visible = Boolean(show);

    passwordInput.type =
        visible
            ? 'text'
            : 'password';

    if (!toggleLoginPasswordBtn) return;

    toggleLoginPasswordBtn.setAttribute(
        'aria-pressed',
        String(visible)
    );

    toggleLoginPasswordBtn.setAttribute(
        'aria-label',
        visible
            ? 'Sembunyikan password'
            : 'Tampilkan password'
    );

    toggleLoginPasswordBtn.title =
        visible
            ? 'Sembunyikan password'
            : 'Tampilkan password';

    const icon =
        toggleLoginPasswordBtn.querySelector(
            'i'
        );

    if (icon) {
        icon.classList.toggle(
            'fa-eye',
            !visible
        );

        icon.classList.toggle(
            'fa-eye-slash',
            visible
        );
    }
}

function toggleLoginPasswordVisibility() {
    setLoginPasswordVisibility(
        passwordInput?.type ===
            'password'
    );

    passwordInput?.focus();
}

async function completeAdminLogin({trusted=false} = {}) {
    resetLoginGuard();
    setLoginControlsLocked(false);
    modal.style.display = 'none';
    passwordInput.value = '';
    passwordInput.style.borderColor = '';
    setLoginPasswordVisibility(false);
    if (trustedLoginHint) trustedLoginHint.hidden = true;
    osisArea.style.display = 'block';
    window.location.href = '#osis-area';
    setTimeout(() => window.AOS?.refresh?.(), 350);

    showAspirasiTableLoading();
    try {
        await refreshAspirasiFromServer({ showLoading: false });
        if (typeof setDashboardLastSyncV9 === 'function') setDashboardLastSyncV9();
        showAppToast(trusted ? 'Perangkat dikenali. Dashboard dibuka otomatis.' : 'Dashboard terhubung ke Google Sheets.');
    } catch (loadError) {
        console.error('[Aspirasi] Login berhasil tetapi data gagal dimuat:', loadError);
        showAppToast('Login berhasil, tetapi data aspirasi belum dapat dimuat.');
    }

    if (typeof refreshAdminAnnouncementsFromServer === 'function') {
        try {
            await refreshAdminAnnouncementsFromServer({ showLoading: true });
        } catch (announcementError) {
            console.error('[Pengumuman] Login berhasil tetapi data pengumuman gagal dimuat:', announcementError);
            showAppToast('Dashboard terbuka, tetapi data pengumuman belum dapat dimuat.', 'error');
        }
    }

    if (typeof refreshEventFromServer === 'function') {
        try {
            await refreshEventFromServer();
        } catch (eventError) {
            console.error('[Event] Login berhasil tetapi event gagal dimuat:', eventError);
        }
    }

    if (typeof initializePushForAdmin === 'function') {
        initializePushForAdmin({silent:true}).catch(pushError => {
            console.warn('[Push] Login berhasil tetapi notifikasi belum siap:', pushError.message);
        });
    }

    refreshTrustedDevicesAdmin({silent:true}).catch(() => {});
}

async function tryTrustedDeviceLogin() {
    const saved = getTrustedDeviceCredentials();
    if (!saved) return false;

    setLoginControlsLocked(true);
    loginSubmitBtn.textContent = 'Membuka...';
    if (trustedLoginHint) {
        trustedLoginHint.textContent = 'Mengenali perangkat tepercaya...';
        trustedLoginHint.hidden = false;
    }

    try {
        const result = await aspirasiApi('trustedLogin', {
            trustedToken: saved.token,
            deviceId: saved.deviceId,
            clientId: getOsisClientId()
        });
        setAspirasiAdminToken(result.token);
        await completeAdminLogin({trusted:true});
        return true;
    } catch (error) {
        const invalid = /tidak lagi|berakhir|tidak valid|belum dipercaya|tidak terdaftar/i.test(error.message || '');
        if (invalid) clearTrustedDeviceCredentials();
        if (trustedLoginHint) {
            trustedLoginHint.textContent = invalid
                ? 'Akses otomatis sudah berakhir. Masukkan password sekali lagi.'
                : 'Akses otomatis belum dapat diperiksa. Masukkan password untuk melanjutkan.';
            trustedLoginHint.hidden = false;
        }
        return false;
    } finally {
        if (osisArea.style.display !== 'block' && !isLoginLocked()) {
            setLoginControlsLocked(false);
            loginSubmitBtn.textContent = 'Masuk Dashboard';
            passwordInput.focus();
        }
    }
}

async function bukaModalLogin() {
    if (osisArea.style.display === 'block') {
        window.location.href = '#osis-area';
        return;
    }
    modal.style.display = 'flex';
    closeMobileNav();
    setLoginPasswordVisibility(false);
    passwordInput.style.borderColor = '';
    errorMsg.style.display = 'none';
    if (trustedLoginHint) trustedLoginHint.hidden = true;

    if (isLoginLocked()) {
        startLoginLockoutCountdown();
        return;
    }

    if (await tryTrustedDeviceLogin()) return;

    setLoginControlsLocked(false);
    passwordInput.focus();
}

function tutupModalLogin() {
    modal.style.display = 'none';
    errorMsg.style.display = 'none';
    if (trustedLoginHint) trustedLoginHint.hidden = true;
    passwordInput.style.borderColor = '';
    passwordInput.value = '';
    setLoginPasswordVisibility(false);

    if (loginLockoutTimer) {
        clearInterval(loginLockoutTimer);
        loginLockoutTimer = null;
    }
}

async function verifikasiPassword() {
    if (isLoginLocked()) {
        startLoginLockoutCountdown();
        return;
    }

    const typed = passwordInput.value.trim();
    if (!typed) {
        errorMsg.textContent = 'Masukkan password terlebih dahulu.';
        errorMsg.style.display = 'block';
        passwordInput.focus();
        return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.style.opacity = '0.7';
    loginSubmitBtn.textContent = 'Memverifikasi...';
    errorMsg.style.display = 'none';
    if (trustedLoginHint) trustedLoginHint.hidden = true;

    try {
        const result = await aspirasiApi('login', {
            password: typed,
            clientId: getOsisClientId(),
            rememberDevice: false,
            deviceName: getTrustedDeviceDefaultName()
        });

        setAspirasiAdminToken(result.token);
        await completeAdminLogin({trusted:false});
    } catch (error) {
        console.error('[Aspirasi] Login gagal:', error);
        const isWrongPassword = /password salah/i.test(error.message || '');
        if (isWrongPassword) {
            const guardResult = registerFailedLoginAttempt();
            passwordInput.value = '';
            passwordInput.style.borderColor = '#ef4444';
            if (!guardResult.locked) {
                errorMsg.textContent = `Password salah. Sisa percobaan: ${guardResult.remainingAttempts}.`;
                errorMsg.style.display = 'block';
                passwordInput.focus();
            }
        } else {
            errorMsg.textContent = error.message || 'Tidak dapat terhubung ke server login.';
            errorMsg.style.display = 'block';
            passwordInput.focus();
        }
    } finally {
        if (!isLoginLocked() && osisArea.style.display !== 'block') {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.style.opacity = '1';
            loginSubmitBtn.style.cursor = '';
            loginSubmitBtn.textContent = 'Masuk Dashboard';
        }
    }
}

function updateTrustedCurrentDeviceUiV23(items = null) {
    const panel = document.getElementById('trustedCurrentDeviceV23');
    const title = document.getElementById('trustedCurrentTitleV23');
    const text = document.getElementById('trustedCurrentTextV23');
    const button = document.getElementById('trustCurrentDeviceBtnV23');
    if (!panel || !title || !text || !button) return;

    const saved = getTrustedDeviceCredentials();
    const currentId = getOsisClientId();
    const currentItem = Array.isArray(items)
        ? items.find(item => item.deviceId === currentId)
        : null;
    const active = Boolean(saved && (!items || currentItem));

    panel.classList.toggle('is-trusted', active);

    if (active) {
        const expiresAt = currentItem?.expiresAt || saved.expiresAt;
        title.textContent = 'Perangkat ini sudah diingat';
        text.textContent = `Area OSIS dapat dibuka tanpa password sampai ${formatTrustedDeviceDate(expiresAt)}.`;
        button.classList.add('secondary-action');
        button.classList.remove('aspirasi-btn');
        button.dataset.mode = 'forget';
        button.innerHTML = '<i class="fa-solid fa-link-slash" aria-hidden="true"></i><span>Lupakan perangkat ini</span>';
    } else {
        title.textContent = 'Perangkat ini belum diingat';
        text.textContent = 'Aktifkan hanya pada HP/laptop milik pengurus agar Area OSIS bisa dibuka tanpa login berulang.';
        button.classList.remove('secondary-action');
        button.classList.add('aspirasi-btn');
        button.dataset.mode = 'trust';
        button.innerHTML = '<i class="fa-solid fa-shield-heart" aria-hidden="true"></i><span>Ingat perangkat ini 30 hari</span>';
    }
}

async function trustCurrentDeviceV23() {
    const button = document.getElementById('trustCurrentDeviceBtnV23');
    if (!button || !aspirasiAdminToken) return;

    if (button.dataset.mode === 'forget') {
        await revokeTrustedDeviceAdmin(getOsisClientId(), {keepSession:true});
        return;
    }

    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Menyimpan perangkat...</span>';

    try {
        const result = await aspirasiApi('trustedDeviceEnroll', {
            token: aspirasiAdminToken,
            clientId: getOsisClientId(),
            deviceName: getTrustedDeviceDefaultName()
        });
        saveTrustedDeviceCredentials(result);
        const items = await refreshTrustedDevicesAdmin({silent:true});
        updateTrustedCurrentDeviceUiV23(items);
        showAppToast('Perangkat ini akan dikenali otomatis selama 30 hari.');
    } catch (error) {
        showAppToast('Gagal menyimpan perangkat: ' + error.message, 'error');
        button.innerHTML = original;
    } finally {
        button.disabled = false;
    }
}

async function refreshTrustedDevicesAdmin({silent=false} = {}) {
    const listEl = document.getElementById('trustedDeviceListV22');
    const countEl = document.getElementById('trustedDeviceCountV22');
    if (!listEl || !aspirasiAdminToken) {
        updateTrustedCurrentDeviceUiV23();
        return [];
    }

    if (!silent) {
        listEl.innerHTML = '<div class="trusted-device-empty-v22"><i class="fa-solid fa-spinner fa-spin"></i><span>Memuat perangkat...</span></div>';
    }

    try {
        const result = await aspirasiApi('trustedDeviceList', {token: aspirasiAdminToken});
        const items = Array.isArray(result.data) ? result.data : [];
        if (countEl) countEl.textContent = String(items.length);
        renderTrustedDevicesAdmin(items);
        updateTrustedCurrentDeviceUiV23(items);
        return items;
    } catch (error) {
        if (!silent) {
            listEl.innerHTML = `<div class="trusted-device-empty-v22 error"><i class="fa-solid fa-triangle-exclamation"></i><span>${escapeHtml(error.message)}</span></div>`;
        }
        throw error;
    }
}

function renderTrustedDevicesAdmin(items) {
    const listEl = document.getElementById('trustedDeviceListV22');
    if (!listEl) return;
    const currentId = getOsisClientId();
    if (!items.length) {
        listEl.innerHTML = '<div class="trusted-device-empty-v22"><i class="fa-solid fa-laptop"></i><span>Belum ada perangkat yang disimpan.</span></div>';
        return;
    }

    listEl.innerHTML = items.map(item => {
        const current = item.deviceId === currentId;
        return `<article class="trusted-device-item-v22 ${current ? 'current' : ''}">
            <div class="trusted-device-icon-v22"><i class="fa-solid ${/iphone|ipad|android/i.test(item.name || '') ? 'fa-mobile-screen-button' : 'fa-laptop'}"></i></div>
            <div class="trusted-device-copy-v22">
                <strong>${escapeHtml(item.name || 'Perangkat OSIS')} ${current ? '<span>Perangkat ini</span>' : ''}</strong>
                <small>Terakhir aktif ${escapeHtml(formatTrustedDeviceDate(item.lastActiveAt))}</small>
                <small>Akses otomatis sampai ${escapeHtml(formatTrustedDeviceDate(item.expiresAt))}</small>
            </div>
            <button class="trusted-device-revoke-v22" type="button" data-trusted-revoke="${escapeHtml(item.deviceId)}"><i class="fa-solid fa-link-slash"></i> Cabut</button>
        </article>`;
    }).join('');

    listEl.querySelectorAll('[data-trusted-revoke]').forEach(button => {
        button.addEventListener('click', () => revokeTrustedDeviceAdmin(button.dataset.trustedRevoke));
    });
}

async function revokeTrustedDeviceAdmin(deviceId, {keepSession=false} = {}) {
    const current = deviceId === getOsisClientId();
    const message = current
        ? (keepSession
            ? 'Lupakan perangkat ini untuk login otomatis? Dashboard yang sedang terbuka tetap aktif.'
            : 'Cabut akses otomatis pada perangkat ini?')
        : 'Cabut akses otomatis perangkat ini?';
    if (!confirm(message)) return;

    try {
        await aspirasiApi('trustedDeviceRevoke', {token: aspirasiAdminToken, deviceId});
        if (current) {
            clearTrustedDeviceCredentials();
            if (keepSession) {
                const items = await refreshTrustedDevicesAdmin({silent:true});
                updateTrustedCurrentDeviceUiV23(items);
                showAppToast('Login otomatis dinonaktifkan. Sesi dashboard saat ini tetap aktif.');
                return;
            }
        }
        await refreshTrustedDevicesAdmin();
        showAppToast('Akses perangkat berhasil dicabut.');
    } catch (error) {
        showAppToast('Gagal mencabut perangkat: ' + error.message, 'error');
    }
}

async function revokeAllTrustedDevicesAdmin() {
    if (!confirm('Keluarkan SEMUA perangkat tepercaya? Semua pengurus harus memasukkan password lagi.')) return;
    try {
        await aspirasiApi('trustedDeviceRevokeAll', {token: aspirasiAdminToken});
        clearTrustedDeviceCredentials();
        setAspirasiAdminToken('');
        aspirasiRemoteCache = [];
        osisArea.style.display = 'none';
        showAppToast('Semua perangkat tepercaya telah dikeluarkan.');
        setTimeout(bukaModalLogin, 350);
    } catch (error) {
        showAppToast('Gagal mengeluarkan perangkat: ' + error.message, 'error');
    }
}

function checkEnter(event) {
    if (event.key === 'Enter' && !isLoginLocked()) verifikasiPassword();
}

toggleLoginPasswordBtn?.addEventListener(
    'click',
    toggleLoginPasswordVisibility
);

document.getElementById('trustCurrentDeviceBtnV23')?.addEventListener(
    'click',
    trustCurrentDeviceV23
);
updateTrustedCurrentDeviceUiV23();

modal.addEventListener(
    'click',
    (e) => {
        if (e.target === modal) {
            tutupModalLogin();
        }
    }
);

function startStatCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target, 10) || 0;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 80));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = current;
            }
        }, 18);
    });
}

function updateAspirasiCounter() {
    const counter = document.querySelector('#aspirasiCounter .stat-number');
    if (!counter) return;
    const targetCount = getAspirasiList().length;
    counter.dataset.target = targetCount;
    counter.textContent = '0';
}

const statSection = document.querySelector('#aspirasiCounter');
if (statSection) {
    updateAspirasiCounter();
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startStatCounters();
                obs.disconnect();
            }
        });
    }, { threshold: 0.5 });
    observer.observe(statSection);
}

// Aspirations
const aspirasiForm = document.getElementById('aspirasiForm');
const aspPesan = document.getElementById('asp-pesan');
const aspError = document.getElementById('asp-error');
const aspSuccessModal = document.getElementById('aspSuccessModal');

function closeAspSuccess() { aspSuccessModal.style.display = 'none'; }

function getAspirasiList() {
    return aspirasiRemoteCache.map(normalizeAspiration);
}

// Cache lokal hanya dipakai untuk merender data yang sudah diambil dari Google Sheets.
// Fungsi ini tidak lagi menulis aspirasi ke localStorage.
function saveAspirasiList(list) {
    aspirasiRemoteCache = Array.isArray(list) ? list.map(normalizeAspiration) : [];
    renderAspirasiList();
}

async function saveAspirasi(item) {
    const result = await aspirasiApi('submit', {
        nama: item.name || 'Anonim',
        kelas: item.kelas || '-',
        kategori: item.category || 'Kritik & Saran untuk OSIS',
        aspirasi: item.message || '',
        clientId: getOsisClientId(),
        website: item.website || ''
    });
    await refreshPublicAspirasiCount();
    if (aspirasiAdminToken && osisArea?.style.display === 'block') {
        await refreshAspirasiFromServer({ showLoading: false });
    }
    return result;
}

function getStatusMeta(status) {
    return ({
        unread: { label: 'Belum Dibaca', cls: 'status-unread' },
        processing: { label: 'Sedang Dibahas', cls: 'status-processing' },
        done: { label: 'Selesai', cls: 'status-done' }
    })[status] || { label: 'Belum Dibaca', cls: 'status-unread' };
}

function updateAspirasiCounters() {
    const list = getAspirasiList();
    const counts = {
        total: list.length,
        unread: list.filter(i => i.status === 'unread').length,
        processing: list.filter(i => i.status === 'processing').length,
        done: list.filter(i => i.status === 'done').length
    };
    const ids = { dashUnreadAsp:'unread', dashProcessingAsp:'processing', dashDoneAsp:'done' };
    Object.entries(ids).forEach(([id,key]) => { const el=document.getElementById(id); if(el) el.textContent=counts[key]; });
    const totalText = document.getElementById('dashTotalAspTextV12'); if (totalText) totalText.textContent = `${counts.total} total aspirasi`;
    const high = document.getElementById('dashHighPriorityAspV12'); if (high) high.textContent = list.filter(i => i.priority === 'high' && i.status !== 'done').length;
    const quickCounts = {
        aspQuickAllCountV14: counts.total,
        aspQuickUnreadCountV14: counts.unread,
        aspQuickProcessingCountV14: counts.processing,
        aspQuickDoneCountV14: counts.done
    };
    Object.entries(quickCounts).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
    // Counter publik diambil dari endpoint count agar tetap benar sebelum admin login.
    if (aspirasiAdminToken) {
        const publicCounter = document.querySelector('#aspirasiCounter .stat-number');
        if (publicCounter) { publicCounter.dataset.target = counts.total; publicCounter.textContent = counts.total; }
    }
}

function getPriorityMeta(priority) {
    return ({
        high:{label:'Tinggi', cls:'priority-high'},
        normal:{label:'Normal', cls:'priority-normal'},
        low:{label:'Rendah', cls:'priority-low'}
    })[priority] || {label:'Normal', cls:'priority-normal'};
}

function getAspirationSenderType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['guru', 'teacher', 'pengajar'].includes(normalized)) return 'Guru';
    // Data versi lama menyimpan tingkat/kelas (mis. X, XI, XII).
    // Saat ditampilkan di UI baru, data tersebut tetap masuk kelompok Siswa.
    return 'Siswa';
}

function populateAspirationClassFilter() {
    const select = document.getElementById('asp-class-filter');
    if (!select) return;
    const current = select.value || 'all';
    select.innerHTML = '<option value="all">Semua pengirim</option><option value="Siswa">Siswa</option><option value="Guru">Guru</option>';
    select.value = ['all', 'Siswa', 'Guru'].includes(current) ? current : 'all';
}

function syncAspirationQuickFilters() {
    const status = document.getElementById('asp-status-filter')?.value || 'all';
    const priority = document.getElementById('asp-priority-filter')?.value || 'all';
    let mode = 'all';
    if (priority === 'high' && status === 'all') mode = 'high';
    else if (['unread','processing','done'].includes(status) && priority === 'all') mode = status;
    document.querySelectorAll('[data-asp-quick]').forEach(button => {
        button.classList.toggle('active', button.dataset.aspQuick === mode);
    });
}

function updateAspirationFilterSummary(filteredCount, totalCount) {
    const result = document.getElementById('aspFilterResultV14');
    const query = (document.getElementById('asp-search')?.value || '').trim();
    const filters = [
        document.getElementById('asp-status-filter')?.value || 'all',
        document.getElementById('asp-class-filter')?.value || 'all',
        document.getElementById('asp-category-filter')?.value || 'all',
        document.getElementById('asp-priority-filter')?.value || 'all'
    ];
    const activeCount = filters.filter(value => value !== 'all').length + (query ? 1 : 0);
    if (result) result.textContent = activeCount
        ? `Menampilkan ${filteredCount} dari ${totalCount} aspirasi`
        : `Menampilkan ${totalCount} aspirasi`;
    const badge = document.getElementById('aspActiveFilterCountV14');
    if (badge) badge.textContent = activeCount ? `${activeCount} aktif` : '';
    syncAspirationQuickFilters();
}

function renderAspirasiList() {
    const tbody = document.getElementById('osisTbody');
    if (!tbody) return;
    const allItems = getAspirasiList();
    populateAspirationClassFilter(allItems);
    const query = (document.getElementById('asp-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('asp-status-filter')?.value || 'all';
    const classFilter = document.getElementById('asp-class-filter')?.value || 'all';
    const categoryFilter = document.getElementById('asp-category-filter')?.value || 'all';
    const priorityFilter = document.getElementById('asp-priority-filter')?.value || 'all';
    let list = allItems.slice();
    if (query) list = list.filter(item => [item.name,item.kelas,item.category,item.message,item.internalNote].some(v => String(v || '').toLowerCase().includes(query)));
    if (statusFilter !== 'all') list = list.filter(item => item.status === statusFilter);
    if (classFilter !== 'all') list = list.filter(item => getAspirationSenderType(item.kelas) === classFilter);
    if (categoryFilter !== 'all') list = list.filter(item => item.category === categoryFilter);
    if (priorityFilter !== 'all') list = list.filter(item => item.priority === priorityFilter);

    updateAspirationFilterSummary(list.length, allItems.length);
    tbody.innerHTML = '';
    if (!list.length) {
        const hasFilters = Boolean(query || statusFilter !== 'all' || classFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all');
        tbody.innerHTML = hasFilters
            ? '<tr class="empty-row-v12"><td colspan="9"><div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-solid fa-filter-circle-xmark"></i></span><strong>Tidak ada hasil yang cocok</strong><small>Coba ubah kata pencarian atau reset filter.</small></div></div></td></tr>'
            : '<tr class="empty-row-v12"><td colspan="9"><div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-regular fa-message"></i></span><strong>Belum ada aspirasi</strong><small>Data dari Google Sheets akan muncul di sini.</small></div></div></td></tr>';
        updateAspirasiCounters();
        return;
    }
    list.forEach(item => {
        const status = getStatusMeta(item.status);
        const priority = getPriorityMeta(item.priority);
        const tr = document.createElement('tr');
        const values = [
            ['Waktu', escapeHtml(formatDisplayDateTime(item.timestamp))],
            ['Nama', escapeHtml(item.name || 'Anonim')],
            ['Pengirim', escapeHtml(getAspirationSenderType(item.kelas))],
            ['Kategori', `<span class="category-pill">${escapeHtml(item.category || 'Lainnya')}</span>`],
            ['Pesan', escapeHtml(item.message || '')],
            ['Prioritas', `<span class="priority-pill ${priority.cls}">${priority.label}</span>`],
            ['Status', `<span class="status-pill ${status.cls}">${status.label}</span>`],
            ['Catatan', `<div class="asp-note-preview">${escapeHtml(item.internalNote || 'Belum ada catatan')}</div>`],
            ['Aksi', `<div class="asp-action-group"><button class="mini-btn" type="button" onclick="openAspirasiDetail('${item.id}')">Detail</button><button class="mini-btn danger" type="button" onclick="deleteAspirasi('${item.id}')">Hapus</button></div>`]
        ];
        values.forEach(([label, value], idx) => {
            const td = document.createElement('td');
            td.dataset.label = label;
            if (idx === 4) td.className = 'message-cell';
            td.innerHTML = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    updateAspirasiCounters();
}

function openAspirasiDetail(id) {
    const item = getAspirasiList().find(x => x.id === id);
    if (!item) return;
    document.getElementById('asp-detail-id').value = item.id;
    const categorySelect = document.getElementById('asp-detail-category');
    if (categorySelect) {
        categorySelect.querySelectorAll('option[data-legacy-category]').forEach(option => option.remove());
        const currentCategory = item.category || 'Lainnya';
        const hasCurrentCategory = [...categorySelect.options].some(option => option.value === currentCategory);
        if (!hasCurrentCategory && currentCategory) {
            const legacyOption = document.createElement('option');
            legacyOption.value = currentCategory;
            legacyOption.textContent = `${currentCategory} (kategori lama)`;
            legacyOption.dataset.legacyCategory = 'true';
            categorySelect.appendChild(legacyOption);
        }
        categorySelect.value = currentCategory;
    }
    document.getElementById('asp-detail-priority').value = item.priority || 'normal';
    document.getElementById('asp-detail-status').value = item.status || 'unread';
    document.getElementById('asp-detail-note').value = item.internalNote || '';
    document.getElementById('aspDetailIdentity').textContent = `${item.name || 'Anonim'} • ${getAspirationSenderType(item.kelas)} • ${formatDisplayDateTime(item.timestamp)}`;
    document.getElementById('aspDetailModal').style.display = 'flex';
}

function closeAspirasiDetail() {
    const modal = document.getElementById('aspDetailModal');
    if (modal) modal.style.display = 'none';
}

async function saveAspirasiDetail() {
    const id = document.getElementById('asp-detail-id')?.value;
    if (!id) return;
    if (!aspirasiAdminToken) return setInlineMessage('aspDetailMessage', 'Sesi admin tidak tersedia. Silakan login ulang.', 'error');

    const patch = {
        id,
        category: document.getElementById('asp-detail-category').value,
        priority: document.getElementById('asp-detail-priority').value,
        status: document.getElementById('asp-detail-status').value,
        internalNote: document.getElementById('asp-detail-note').value.trim()
    };

    const button = document.getElementById('saveAspDetailBtn');
    if (button) { button.disabled = true; button.style.opacity = '0.7'; }
    setInlineMessage('aspDetailMessage', 'Menyimpan ke Google Sheets...');
    try {
        await aspirasiApi('update', { token: aspirasiAdminToken, ...patch });
        await refreshAspirasiFromServer({ showLoading: false });
        setInlineMessage('aspDetailMessage', 'Perubahan tersimpan di Google Sheets.', 'success');
        showAppToast('Perubahan aspirasi berhasil disimpan.');
        setTimeout(closeAspirasiDetail, 450);
    } catch (error) {
        console.error('[Aspirasi] Update gagal:', error);
        setInlineMessage('aspDetailMessage', 'Gagal menyimpan: ' + error.message, 'error');
    } finally {
        if (button) { button.disabled = false; button.style.opacity = '1'; }
    }
}

async function updateAspirasiStatus(id, status) {
    const item = getAspirasiList().find(x => x.id === id);
    if (!item || !aspirasiAdminToken) return;
    await aspirasiApi('update', {
        token: aspirasiAdminToken,
        id,
        category: item.category,
        priority: item.priority,
        status,
        internalNote: item.internalNote || ''
    });
    await refreshAspirasiFromServer({ showLoading: false });
}

async function deleteAspirasi(id) {
    if (!confirm('Hapus aspirasi ini dari Google Sheets?')) return;
    try {
        await aspirasiApi('delete', { token: aspirasiAdminToken, id });
        aspirasiRemoteCache = aspirasiRemoteCache.filter(item => item.id !== id);
        renderAspirasiList();
        await refreshPublicAspirasiCount();
        showAppToast('Aspirasi berhasil dihapus.');
    } catch (error) {
        console.error('[Aspirasi] Hapus gagal:', error);
        showAppToast('Gagal menghapus aspirasi: ' + error.message);
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const next = document.getElementById('new-password').value;
    const confirmNext = document.getElementById('confirm-password').value;
    setInlineMessage('passwordChangeMessage', 'Memverifikasi password saat ini...');
    if (next.length < 12) return setInlineMessage('passwordChangeMessage', 'Password baru minimal 12 karakter.', 'error');
    if (next !== confirmNext) return setInlineMessage('passwordChangeMessage', 'Konfirmasi password baru tidak sama.', 'error');
    try {
        const reauth = await aspirasiApi('login', { password: current, clientId: getOsisClientId() });
        setInlineMessage('passwordChangeMessage', 'Mengganti password backend...');
        await aspirasiApi('changePassword', { token: reauth.token, newPassword: next });
        clearTrustedDeviceCredentials();
        setAspirasiAdminToken('');
        aspirasiRemoteCache = [];
        resetLoginGuard();
        document.getElementById('passwordChangeForm').reset();
        setInlineMessage('passwordChangeMessage', 'Password berhasil diganti. Silakan login ulang.', 'success');
        showAppToast('Password berhasil diganti. Silakan login ulang.');
        osisArea.style.display = 'none';
        setTimeout(bukaModalLogin, 500);
    } catch (err) {
        console.error(err);
        setInlineMessage('passwordChangeMessage', 'Gagal mengganti password: ' + err.message, 'error');
    }
}
