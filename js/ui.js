/* =========================================================
   UX & ACCESSIBILITY
   ========================================================= */
// Quick actions, copy helper, keyboard tabs, dan accessibility hooks.

// UI utilities
function updateQuickActionsV13() {
    const aspirations = getAspirasiList();
    const unread = aspirations.filter(item => normalizeAspiration(item).status === 'unread').length;
    const badge = document.getElementById('quickAspBadgeV13');
    const aspText = document.getElementById('quickAspTextV13');
    if (badge) { badge.textContent = `${unread} baru`; badge.hidden = unread < 1; }
    if (aspText) aspText.textContent = unread ? `${unread} aspirasi belum dibaca` : 'Semua aspirasi sudah ditinjau';

    const announcements = getPublicCards();
    const activeAnnouncements = announcements.filter(item => announcementState(item) === 'active').length;
    const annText = document.getElementById('quickAnnouncementTextV13');
    if (annText) annText.textContent = `${activeAnnouncements} pengumuman aktif`;

    const albums = Array.isArray(driveGalleryData?.albums) ? driveGalleryData.albums : [];
    const photos = albums.reduce((sum, album) => sum + (Array.isArray(album.photos) ? album.photos.length : 0), 0);
    const galleryText = document.getElementById('quickGalleryTextV13');
    if (galleryText) galleryText.textContent = `${albums.length} album • ${photos} foto`;

    const event = getEventConfig();
    const eventText = document.getElementById('quickEventTextV13');
    if (eventText) {
        const d = new Date(event.datetime);
        eventText.textContent = Number.isNaN(d.getTime()) ? 'Atur event berikutnya' : d.toLocaleDateString('id-ID', {day:'numeric', month:'short'});
    }
}

async function copyTextV13(text, label='Teks') {
    try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
        else {
            const input = document.createElement('textarea');
            input.value = text; input.setAttribute('readonly',''); input.style.position='fixed'; input.style.opacity='0';
            document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
        }
        showAppToast(`${label} berhasil disalin.`);
    } catch (err) {
        showAppToast(`Gagal menyalin ${label.toLowerCase()}.`, 'error');
    }
}

function initializeContactV13() {
    document.querySelectorAll('[data-copy-text]').forEach(button => {
        button.addEventListener('click', () => copyTextV13(button.dataset.copyText || '', button.dataset.copyLabel || 'Teks'));
    });
}

function initializeAccessibilityV13() {
    const tabs = [...document.querySelectorAll('.dashboard-tabs .tab-button')];
    tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', event => {
            let next = null;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === null) return;
            event.preventDefault();
            tabs[next].focus();
            switchOsisTab(tabs[next].dataset.tab);
        });
    });

    const syncThemeA11y = () => {
        const dark = body.getAttribute('data-theme') === 'dark';
        themeToggle?.setAttribute('aria-pressed', String(dark));
        themeToggle?.setAttribute('aria-label', dark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
    };
    syncThemeA11y();
    themeToggle?.addEventListener('click', () => setTimeout(syncThemeA11y, 0));

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (pwaInstallModal?.style.display === 'flex') closePwaInstallModal();
        if (document.getElementById('aspDetailModal')?.style.display === 'flex') closeAspirasiDetail();
        if (document.getElementById('aspSuccessModal')?.style.display === 'flex') closeAspSuccess();
    });
}

function initializeV13Ux() {
    initializeContactV13();
    initializeAccessibilityV13();
    updateQuickActionsV13();
}
