/* =========================================================
   PENGUMUMAN — GOOGLE SHEETS
   ========================================================= */
// Satu sumber data: Apps Script / Sheet PENGUMUMAN.
// Tidak lagi menyimpan pengumuman ke localStorage.

const ANNOUNCEMENT_CATEGORIES_V11 = [
    'Informasi',
    'Kegiatan',
    'Lomba',
    'Rapat',
    'Akademik',
    'Prestasi',
    'Pendaftaran',
    'Penting'
];

let announcementRemoteCache = getDefaultPublicCards();
let announcementRemoteLoaded = false;
let announcementRemoteLoading = false;
let announcementPublicFetchPromise = null;


function newAnnouncementId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'ann_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}


function getDefaultPublicCards() {
    return [
        {
            id: 'fallback-welcome',
            date: '1 Agustus 2026',
            title: 'Selamat Datang di Website Resmi OSIS',
            text: 'Portal informasi utama kegiatan, aspirasi, dan program kerja pengurus OSIS SMA Al-Kahfi Islamic School periode ini.',
            category: 'Informasi',
            pinned: true,
            active: true,
            startDate: '',
            endDate: ''
        },
        {
            id: 'fallback-aspirasi',
            date: 'Setiap Saat',
            title: 'Kotak Aspirasi Telah Dibuka',
            text: 'Punya kritik, saran, atau ide program untuk sekolah? Sampaikan lewat kotak aspirasi dan jadilah bagian dari perubahan positif.',
            category: 'Informasi',
            pinned: false,
            active: true,
            startDate: '',
            endDate: ''
        },
        {
            id: 'fallback-rapat',
            date: 'Menyesuaikan',
            title: 'Rapat Koordinasi Mingguan',
            text: 'Agenda rutin pengurus OSIS untuk mengevaluasi program kerja dan mempersiapkan kegiatan pekan depan.',
            category: 'Rapat',
            pinned: false,
            active: true,
            startDate: '',
            endDate: ''
        }
    ].map(normalizeAnnouncement);
}


function normalizeAnnouncement(item) {
    const copy = { ...(item || {}) };

    if (!copy.id) copy.id = newAnnouncementId();

    if (!ANNOUNCEMENT_CATEGORIES_V11.includes(copy.category)) {
        copy.category = 'Informasi';
    }

    copy.pinned = Boolean(copy.pinned);
    copy.active = copy.active !== false;
    copy.startDate = String(copy.startDate || '');
    copy.endDate = String(copy.endDate || '');
    copy.date = String(copy.date || '');
    copy.title = String(copy.title || '');
    copy.text = String(copy.text || '');

    return copy;
}


function getPublicCards() {
    return announcementRemoteCache.map(normalizeAnnouncement);
}


function setAnnouncementCache(list, { loaded = true } = {}) {
    announcementRemoteCache = Array.isArray(list)
        ? list.map(normalizeAnnouncement)
        : [];

    announcementRemoteLoaded = loaded;

    renderPublicCards();
    renderAdminPublicCards();

    if (typeof updateCommandCenterV12 === 'function') {
        updateCommandCenterV12();
    }

    if (typeof updateQuickActionsV13 === 'function') {
        updateQuickActionsV13();
    }
}


function announcementState(item) {
    const now = new Date();

    const start = item.startDate
        ? new Date(item.startDate + 'T00:00:00')
        : null;

    const end = item.endDate
        ? new Date(item.endDate + 'T23:59:59')
        : null;

    if (!item.active) return 'inactive';
    if (start && now < start) return 'scheduled';
    if (end && now > end) return 'expired';

    return 'active';
}


function getVisibleAnnouncements() {
    return getPublicCards()
        .filter(item => announcementState(item) === 'active')
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));
}


async function refreshPublicAnnouncementsFromServer() {
    if (announcementPublicFetchPromise) {
        return announcementPublicFetchPromise;
    }

    announcementPublicFetchPromise = (async () => {
        try {
            const result = await aspirasiApi('announcementPublic');

            setAnnouncementCache(
                Array.isArray(result.data) ? result.data : [],
                { loaded: true }
            );

            return getPublicCards();
        } catch (error) {
            console.warn(
                '[Pengumuman] Data publik gagal dimuat dari Google Sheets. Fallback lokal ditampilkan.',
                error
            );

            renderPublicCards();

            return getPublicCards();
        } finally {
            announcementPublicFetchPromise = null;
        }
    })();

    return announcementPublicFetchPromise;
}


async function refreshAdminAnnouncementsFromServer({ showLoading = true } = {}) {
    if (!aspirasiAdminToken) {
        throw new Error('Sesi admin belum tersedia. Silakan login kembali.');
    }

    if (announcementRemoteLoading) {
        return getPublicCards();
    }

    announcementRemoteLoading = true;

    if (showLoading) {
        showAnnouncementAdminLoading();
    }

    try {
        const result = await aspirasiApi(
            'announcementList',
            { token: aspirasiAdminToken }
        );

        setAnnouncementCache(
            Array.isArray(result.data) ? result.data : [],
            { loaded: true }
        );

        return getPublicCards();
    } catch (error) {
        showAnnouncementAdminError(error.message);
        throw error;
    } finally {
        announcementRemoteLoading = false;
    }
}


function showAnnouncementAdminLoading() {
    const container = document.getElementById('publicCardList');

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state-v12">
            <div>
                <span class="empty-icon-v12">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </span>
                <strong>Memuat pengumuman</strong>
                <small>Mengambil data dari Google Sheets...</small>
            </div>
        </div>
    `;
}


function showAnnouncementAdminError(message) {
    const container = document.getElementById('publicCardList');

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state-v12">
            <div>
                <span class="empty-icon-v12">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </span>
                <strong>Pengumuman belum dapat dimuat</strong>
                <small>${escapeHtml(message || 'Terjadi kesalahan.')}</small>
            </div>
        </div>
    `;
}


function renderPublicCards() {
    const container = document.getElementById('publicAnnouncementCards');

    if (!container) return;

    const cards = getVisibleAnnouncements();

    container.innerHTML = '';

    if (!cards.length) {
        container.innerHTML = `
            <div class="empty-state-v12">
                <div>
                    <span class="empty-icon-v12">
                        <i class="fa-regular fa-calendar-check"></i>
                    </span>
                    <strong>Belum ada pengumuman aktif</strong>
                    <small>Belum ada informasi terbaru.</small>
                </div>
            </div>
        `;

        return;
    }

    cards.forEach((card, i) => {
        const box = document.createElement('article');

        box.className =
            'card-box announcement-card-v9' +
            (card.pinned ? ' is-pinned' : '');

        box.setAttribute('data-aos', 'fade-up');

        box.setAttribute(
            'data-aos-delay',
            String(Math.min(i, 5) * 70)
        );

        const label =
            card.date ||
            (
                card.startDate
                    ? new Date(card.startDate + 'T00:00:00')
                        .toLocaleDateString(
                            'id-ID',
                            {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            }
                        )
                    : 'Informasi'
            );

        box.innerHTML = `
            <div class="announcement-meta-v9">
                <span class="announcement-chip category">
                    ${escapeHtml(card.category)}
                </span>

                ${
                    card.pinned
                        ? `
                            <span class="announcement-chip pinned">
                                <i class="fa-solid fa-thumbtack"></i>
                                Dipin
                            </span>
                        `
                        : ''
                }

                <span class="announcement-chip">
                    <i class="fa-regular fa-calendar"></i>
                    ${escapeHtml(label)}
                </span>
            </div>

            <h4>${escapeHtml(card.title)}</h4>

            <p>${escapeHtml(card.text)}</p>
        `;

        container.appendChild(box);
    });

    window.AOS?.refresh?.();
}


function announcementAdminStateLabel(item) {
    const state = announcementState(item);

    return ({
        active: 'Aktif',
        inactive: 'Nonaktif',
        scheduled: 'Terjadwal',
        expired: 'Kedaluwarsa'
    })[state] || state;
}


function announcementStateIconV11(state) {
    return ({
        active: 'fa-circle-check',
        scheduled: 'fa-clock',
        inactive: 'fa-eye-slash',
        expired: 'fa-calendar-xmark'
    })[state] || 'fa-circle-info';
}


function formatAnnouncementDateV11(value) {
    if (!value) return '';

    const date =
        new Date(
            value + 'T00:00:00'
        );

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        'id-ID',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }
    );
}


function updateAnnouncementStatsV11(list = getPublicCards()) {
    const stats = {
        total: list.length,
        active: 0,
        scheduled: 0,
        pinned: 0
    };

    list.forEach(item => {
        const state = announcementState(item);

        if (state === 'active') stats.active++;
        if (state === 'scheduled') stats.scheduled++;
        if (item.pinned) stats.pinned++;
    });

    const set = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }
    };

    set('announcementStatTotal', stats.total);
    set('announcementStatActive', stats.active);
    set('announcementStatScheduled', stats.scheduled);
    set('announcementStatPinned', stats.pinned);
}


function getFilteredAnnouncementsV11() {
    const query =
        (
            document.getElementById('announcementSearch')?.value ||
            ''
        )
            .trim()
            .toLowerCase();

    const status =
        document.getElementById('announcementStatusFilter')?.value ||
        'all';

    const category =
        document.getElementById('announcementCategoryFilter')?.value ||
        'all';

    return getPublicCards()
        .filter(item => {
            const state = announcementState(item);

            const haystack =
                `${item.title} ${item.text} ${item.date} ${item.category}`
                    .toLowerCase();

            return (
                (!query || haystack.includes(query)) &&
                (status === 'all' || state === status) &&
                (category === 'all' || item.category === category)
            );
        })
        .sort((a, b) => {
            if (Number(b.pinned) !== Number(a.pinned)) {
                return Number(b.pinned) - Number(a.pinned);
            }

            const order = {
                active: 0,
                scheduled: 1,
                inactive: 2,
                expired: 3
            };

            return (
                (order[announcementState(a)] ?? 9) -
                (order[announcementState(b)] ?? 9)
            );
        });
}


function renderAdminPublicCards() {
    const container = document.getElementById('publicCardList');

    if (!container) return;

    const all = getPublicCards();
    const list = getFilteredAnnouncementsV11();

    updateAnnouncementStatsV11(all);

    const resultCount =
        document.getElementById('announcementResultCount');

    if (resultCount) {
        resultCount.textContent =
            `${list.length} item`;
    }

    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state-v12">
                <div>
                    <span class="empty-icon-v12">
                        <i class="fa-regular fa-folder-open"></i>
                    </span>

                    <strong>Tidak ada pengumuman yang cocok</strong>

                    <small>Tidak ada hasil.</small>
                </div>
            </div>
        `;

        return;
    }

    list.forEach(item => {
        const state =
            announcementState(item);

        const label =
            announcementAdminStateLabel(item);

        const card =
            document.createElement('article');

        card.className =
            `announcement-admin-card-v11 ${
                state === 'inactive'
                    ? 'is-inactive'
                    : ''
            } ${
                state === 'expired'
                    ? 'is-expired'
                    : ''
            }`;

        const displayDate =
            item.date ||
            formatAnnouncementDateV11(
                item.startDate
            ) ||
            'Tanpa label tanggal';

        const start =
            item.startDate
                ? formatAnnouncementDateV11(
                    item.startDate
                )
                : 'Langsung';

        const end =
            item.endDate
                ? formatAnnouncementDateV11(
                    item.endDate
                )
                : 'Tanpa batas';

        card.innerHTML = `
            <div class="announcement-card-top-v11">
                <div>
                    <h5>
                        ${escapeHtml(item.title)}
                    </h5>

                    <div class="announcement-card-date-v11">
                        <i class="fa-regular fa-calendar"></i>
                        ${escapeHtml(displayDate)}
                    </div>
                </div>

                ${
                    item.pinned
                        ? `
                            <span class="announcement-chip pinned">
                                <i class="fa-solid fa-thumbtack"></i>
                                Pin
                            </span>
                        `
                        : ''
                }
            </div>

            <div class="announcement-card-badges-v11">
                <span class="announcement-chip category">
                    ${escapeHtml(item.category)}
                </span>

                <span class="announcement-state-v11 ${state}">
                    <i class="fa-solid ${announcementStateIconV11(state)}"></i>
                    ${escapeHtml(label)}
                </span>
            </div>

            <p>
                ${escapeHtml(item.text)}
            </p>

            <div class="announcement-schedule-v11">
                <span>
                    <i class="fa-solid fa-play"></i>
                    Mulai: ${escapeHtml(start)}
                </span>

                <span>
                    <i class="fa-solid fa-flag-checkered"></i>
                    Selesai: ${escapeHtml(end)}
                </span>
            </div>

            <div class="announcement-card-actions-v11">
                <button
                    type="button"
                    class="mini-btn"
                    onclick="editPublicCard('${item.id}')"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button
                    type="button"
                    class="mini-btn"
                    onclick="togglePublicCardActive('${item.id}')"
                >
                    <i class="fa-solid ${
                        item.active
                            ? 'fa-eye-slash'
                            : 'fa-eye'
                    }"></i>

                    ${
                        item.active
                            ? 'Nonaktifkan'
                            : 'Aktifkan'
                    }
                </button>

                <button
                    type="button"
                    class="mini-btn"
                    onclick="togglePublicCardPinned('${item.id}')"
                >
                    <i class="fa-solid fa-thumbtack"></i>

                    ${
                        item.pinned
                            ? 'Lepas Pin'
                            : 'Pin'
                    }
                </button>

                <button
                    type="button"
                    class="mini-btn"
                    onclick="duplicatePublicCardV11('${item.id}')"
                >
                    <i class="fa-regular fa-copy"></i>
                    Duplikat
                </button>

                <button
                    type="button"
                    class="announcement-delete-v11"
                    onclick="removePublicCardById('${item.id}')"
                >
                    <i class="fa-solid fa-trash"></i>
                    Hapus
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}


function serializeAnnouncementForApi(item) {
    const normalized =
        normalizeAnnouncement(item);

    return {
        id: normalized.id,
        title: normalized.title,
        category: normalized.category,
        date: normalized.date,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        pinned: normalized.pinned ? 'true' : 'false',
        active: normalized.active ? 'true' : 'false',
        text: normalized.text
    };
}


async function saveAnnouncementRemote(item) {
    if (!aspirasiAdminToken) {
        throw new Error(
            'Sesi admin belum tersedia. Silakan login kembali.'
        );
    }

    return aspirasiApi(
        'announcementSave',
        {
            token: aspirasiAdminToken,
            ...serializeAnnouncementForApi(item)
        }
    );
}


async function handleAnnouncementSubmit(event) {
    event.preventDefault();

    const editId =
        document.getElementById('public-card-edit-id').value;

    const item =
        normalizeAnnouncement({
            id:
                editId ||
                newAnnouncementId(),

            title:
                document.getElementById('public-card-title')
                    .value
                    .trim(),

            category:
                document.getElementById('public-card-category')
                    .value,

            date:
                document.getElementById('public-card-date')
                    .value
                    .trim(),

            startDate:
                document.getElementById('public-card-start')
                    .value,

            endDate:
                document.getElementById('public-card-end')
                    .value,

            pinned:
                document.getElementById('public-card-pinned')
                    .checked,

            active:
                document.getElementById('public-card-active')
                    .checked,

            text:
                document.getElementById('public-card-text')
                    .value
                    .trim()
        });

    if (!item.title || !item.text) {
        return setInlineMessage(
            'announcementMessage',
            'Judul dan keterangan wajib diisi.',
            'error'
        );
    }

    if (
        item.startDate &&
        item.endDate &&
        item.endDate < item.startDate
    ) {
        return setInlineMessage(
            'announcementMessage',
            'Tanggal berakhir tidak boleh sebelum tanggal mulai.',
            'error'
        );
    }

    const button =
        document.getElementById('publicCardSubmitBtn');

    const originalHtml =
        button?.innerHTML || '';

    try {
        if (button) {
            button.disabled = true;
            button.style.opacity = '.7';
            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        }

        setInlineMessage(
            'announcementMessage',
            'Menyimpan ke Google Sheets...'
        );

        await saveAnnouncementRemote(item);

        await refreshAdminAnnouncementsFromServer({
            showLoading: false
        });

        resetPublicCardForm();

        const message =
            editId
                ? 'Pengumuman diperbarui di Google Sheets.'
                : 'Pengumuman ditambahkan ke Google Sheets.';

        setInlineMessage(
            'announcementMessage',
            message,
            'success'
        );

        showAppToast(message);
    } catch (error) {
        console.error(
            '[Pengumuman] Simpan gagal:',
            error
        );

        setInlineMessage(
            'announcementMessage',
            'Gagal menyimpan: ' + error.message,
            'error'
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.innerHTML = originalHtml;
        }
    }
}


async function togglePublicCardActive(id) {
    const item =
        getPublicCards()
            .find(x => x.id === id);

    if (!item) return;

    const updated = {
        ...item,
        active: !item.active
    };

    try {
        await saveAnnouncementRemote(updated);

        await refreshAdminAnnouncementsFromServer({
            showLoading: false
        });

        showAppToast(
            item.active
                ? 'Pengumuman dinonaktifkan.'
                : 'Pengumuman diaktifkan.'
        );
    } catch (error) {
        showAppToast(
            'Gagal mengubah status pengumuman: ' +
            error.message,
            'error'
        );
    }
}


async function togglePublicCardPinned(id) {
    const item =
        getPublicCards()
            .find(x => x.id === id);

    if (!item) return;

    const updated = {
        ...item,
        pinned: !item.pinned
    };

    try {
        await saveAnnouncementRemote(updated);

        await refreshAdminAnnouncementsFromServer({
            showLoading: false
        });

        showAppToast(
            item.pinned
                ? 'Pin pengumuman dilepas.'
                : 'Pengumuman dipin.'
        );
    } catch (error) {
        showAppToast(
            'Gagal mengubah pin pengumuman: ' +
            error.message,
            'error'
        );
    }
}


async function removePublicCardById(id) {
    if (
        !confirm(
            'Hapus pengumuman ini dari Google Sheets?'
        )
    ) {
        return;
    }

    try {
        await aspirasiApi(
            'announcementDelete',
            {
                token: aspirasiAdminToken,
                id
            }
        );

        await refreshAdminAnnouncementsFromServer({
            showLoading: false
        });

        resetPublicCardForm();

        showAppToast(
            'Pengumuman berhasil dihapus.'
        );
    } catch (error) {
        showAppToast(
            'Gagal menghapus pengumuman: ' +
            error.message,
            'error'
        );
    }
}


function removePublicCard(index) {
    const item =
        getPublicCards()[index];

    if (item) {
        removePublicCardById(
            item.id
        );
    }
}


function editPublicCard(id) {
    const item =
        getPublicCards()
            .find(x => x.id === id);

    if (!item) return;

    document.getElementById(
        'public-card-edit-id'
    ).value = item.id;

    document.getElementById(
        'public-card-title'
    ).value = item.title || '';

    document.getElementById(
        'public-card-category'
    ).value = item.category || 'Informasi';

    document.getElementById(
        'public-card-date'
    ).value = item.date || '';

    document.getElementById(
        'public-card-start'
    ).value = item.startDate || '';

    document.getElementById(
        'public-card-end'
    ).value = item.endDate || '';

    document.getElementById(
        'public-card-pinned'
    ).checked = Boolean(item.pinned);

    document.getElementById(
        'public-card-active'
    ).checked = item.active !== false;

    document.getElementById(
        'public-card-text'
    ).value = item.text || '';

    document.getElementById(
        'publicCardSubmitBtn'
    ).innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';

    document.getElementById(
        'cancelPublicCardEditBtn'
    ).hidden = false;

    const title =
        document.getElementById(
            'announcementFormTitle'
        );

    if (title) {
        title.textContent =
            'Edit Pengumuman';
    }

    const mode =
        document.getElementById(
            'announcementFormMode'
        );

    if (mode) {
        mode.textContent =
            'Mode Edit';
    }

    updateAnnouncementCharCountV11();

    document.getElementById(
        'announcementFormPanel'
    )
        ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    setTimeout(
        () =>
            document.getElementById(
                'public-card-title'
            )
                ?.focus({
                    preventScroll: true
                }),
        350
    );
}


async function duplicatePublicCardV11(id) {
    const source =
        getPublicCards()
            .find(x => x.id === id);

    if (!source) return;

    const copy =
        normalizeAnnouncement({
            ...source,
            id: newAnnouncementId(),
            title:
                `${source.title} (Salinan)`,
            pinned: false,
            active: false
        });

    try {
        await saveAnnouncementRemote(copy);

        await refreshAdminAnnouncementsFromServer({
            showLoading: false
        });

        setInlineMessage(
            'announcementMessage',
            'Salinan dibuat dalam keadaan nonaktif. Edit lalu aktifkan saat siap.',
            'success'
        );

        showAppToast(
            'Salinan pengumuman dibuat.'
        );
    } catch (error) {
        showAppToast(
            'Gagal menduplikasi pengumuman: ' +
            error.message,
            'error'
        );
    }
}


function updateAnnouncementCharCountV11() {
    const input =
        document.getElementById(
            'public-card-text'
        );

    const counter =
        document.getElementById(
            'announcementCharCount'
        );

    if (
        input &&
        counter
    ) {
        counter.textContent =
            `${input.value.length} / 320`;
    }
}


function resetPublicCardForm() {
    const form =
        document.getElementById(
            'publicCardForm'
        );

    form?.reset();

    const active =
        document.getElementById(
            'public-card-active'
        );

    if (active) {
        active.checked = true;
    }

    const edit =
        document.getElementById(
            'public-card-edit-id'
        );

    if (edit) {
        edit.value = '';
    }

    const submit =
        document.getElementById(
            'publicCardSubmitBtn'
        );

    if (submit) {
        submit.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengumuman';
    }

    const cancel =
        document.getElementById(
            'cancelPublicCardEditBtn'
        );

    if (cancel) {
        cancel.hidden = true;
    }

    const title =
        document.getElementById(
            'announcementFormTitle'
        );

    if (title) {
        title.textContent =
            'Pengumuman Baru';
    }

    const mode =
        document.getElementById(
            'announcementFormMode'
        );

    if (mode) {
        mode.textContent =
            'Baru';
    }

    updateAnnouncementCharCountV11();

    setInlineMessage(
        'announcementMessage',
        ''
    );
}


async function replaceAllAnnouncementsRemote(items) {
    if (!aspirasiAdminToken) {
        throw new Error(
            'Sesi admin belum tersedia. Silakan login kembali.'
        );
    }

    const normalized =
        Array.isArray(items)
            ? items.map(normalizeAnnouncement)
            : [];

    await aspirasiApi(
        'announcementReplaceAll',
        {
            token: aspirasiAdminToken,
            itemsJson:
                JSON.stringify(normalized)
        }
    );

    await refreshAdminAnnouncementsFromServer({
        showLoading: false
    });
}


function initializeAnnouncementV11() {
    document.getElementById(
        'announcementSearch'
    )
        ?.addEventListener(
            'input',
            renderAdminPublicCards
        );

    document.getElementById(
        'announcementStatusFilter'
    )
        ?.addEventListener(
            'change',
            renderAdminPublicCards
        );

    document.getElementById(
        'announcementCategoryFilter'
    )
        ?.addEventListener(
            'change',
            renderAdminPublicCards
        );

    document.getElementById(
        'public-card-text'
    )
        ?.addEventListener(
            'input',
            updateAnnouncementCharCountV11
        );

    document.getElementById(
        'newAnnouncementBtn'
    )
        ?.addEventListener(
            'click',
            () => {
                resetPublicCardForm();

                document.getElementById(
                    'announcementFormPanel'
                )
                    ?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                setTimeout(
                    () =>
                        document.getElementById(
                            'public-card-title'
                        )
                            ?.focus({
                                preventScroll: true
                            }),
                    350
                );
            }
        );

    updateAnnouncementCharCountV11();

    renderPublicCards();

    // Pengunjung publik hanya mengambil pengumuman yang aktif.
    refreshPublicAnnouncementsFromServer();
}
