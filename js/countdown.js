let eventPublicFetchPromise = null;
/* =========================================================
   COUNTDOWN EVENT — GOOGLE SHEETS
   ========================================================= */
// Satu sumber data: Sheet EVENT melalui Apps Script.
// localStorage event lama tidak lagi digunakan.

const EVENT_FALLBACK = Object.freeze({
    id: 'NEXT_EVENT',
    name: 'LOMBA KEMERDEKAAN (17AN) 2026',
    datetime: '2026-08-17T08:00',
    active: true
});

let eventRemoteCache = { ...EVENT_FALLBACK };
let eventRemoteLoaded = false;
let eventRemoteLoading = false;


function normalizeEventConfig(item) {
    const copy = { ...(item || {}) };

    return {
        id: String(copy.id || 'NEXT_EVENT'),
        name: String(copy.name || 'Event belum diatur'),
        datetime: String(copy.datetime || ''),
        active: copy.active !== false,
        updatedAt: String(copy.updatedAt || '')
    };
}


function getEventConfig() {
    return normalizeEventConfig(eventRemoteCache);
}


function setEventCache(item, { loaded = true } = {}) {
    eventRemoteCache = item
        ? normalizeEventConfig(item)
        : {
            id: 'NEXT_EVENT',
            name: 'Belum ada event aktif',
            datetime: '',
            active: false,
            updatedAt: ''
        };

    eventRemoteLoaded = loaded;

    updateCountdown();
    populateEventForm?.();
    updateCommandCenterV12?.();
    updateQuickActionsV13?.();
}


async function refreshEventFromServer() {
    if (eventRemoteLoading) {
        return getEventConfig();
    }

    eventRemoteLoading = true;

    try {
        const result = await aspirasiApi('eventPublic');
        setEventCache(result.data || null, { loaded: true });
        return getEventConfig();
    } catch (error) {
        console.warn(
            '[Event] Gagal memuat event dari Google Sheets. Fallback sementara digunakan.',
            error
        );

        if (!eventRemoteLoaded) {
            setEventCache(EVENT_FALLBACK, { loaded: false });
        }

        return getEventConfig();
    } finally {
        eventRemoteLoading = false;
    }
}


async function saveEventConfig(config) {
    if (!aspirasiAdminToken) {
        throw new Error('Sesi admin belum tersedia. Silakan login kembali.');
    }

    const normalized = normalizeEventConfig(config);

    if (!normalized.name.trim()) {
        throw new Error('Nama event wajib diisi.');
    }

    if (!normalized.datetime) {
        throw new Error('Tanggal dan jam event wajib diisi.');
    }

    const result = await aspirasiApi(
        'eventSave',
        {
            token: aspirasiAdminToken,
            name: normalized.name.trim(),
            datetime: normalized.datetime,
            active: normalized.active ? 'true' : 'false'
        }
    );

    setEventCache(
        result.data || normalized,
        { loaded: true }
    );

    return getEventConfig();
}


function updateCountdown() {
    const config = getEventConfig();

    const nameEl = document.getElementById('countdown-event-name');
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const labelEl = document.querySelector('.countdown-label');

    if (!daysEl) return;

    if (nameEl) {
        nameEl.textContent = config.name;
    }

    if (!config.active || !config.datetime) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';

        if (labelEl) {
            labelEl.innerHTML =
                '<i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i> BELUM ADA EVENT AKTIF';
        }

        return;
    }

    const target = new Date(config.datetime);
    const distance = target.getTime() - Date.now();

    if (Number.isNaN(target.getTime())) {
        daysEl.textContent = '--';
        hoursEl.textContent = '--';
        minutesEl.textContent = '--';
        secondsEl.textContent = '--';

        if (labelEl) {
            labelEl.innerHTML =
                '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> TANGGAL EVENT TIDAK VALID';
        }

        return;
    }

    if (distance < 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';

        if (labelEl) {
            labelEl.innerHTML =
                '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> AGENDA TELAH BERLALU';
        }

        return;
    }

    if (labelEl) {
        labelEl.innerHTML =
            '<i class="fa-solid fa-calendar-days" aria-hidden="true"></i> MENUJU EVENT BERIKUTNYA';
    }

    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
}


let countdownTimer = null;

function syncCountdownTimer() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    countdownTimer = null;
    updateCountdown();

    if (!document.hidden) {
        countdownTimer = setInterval(updateCountdown, 1000);
    }
}


document.addEventListener(
    'visibilitychange',
    syncCountdownTimer
);

syncCountdownTimer();
refreshEventFromServer();
