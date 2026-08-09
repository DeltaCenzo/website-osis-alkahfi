/* =========================================================
   DASHBOARD ADMIN
   ========================================================= */
// Command Center, tab, backup/restore, QR, dan wiring panel admin.

function updateCommandCenterV12() {
    const aspirations = getAspirasiList();
    const announcements = getPublicCards();
    const activeAnnouncements = announcements.filter(item => announcementState(item) === 'active');
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('dashActiveAnnouncementsV12', activeAnnouncements.length);
    setText('dashPinnedAnnouncementsV12', `${activeAnnouncements.filter(item => item.pinned).length} dipin`);

    const albums = Array.isArray(driveGalleryData?.albums) ? driveGalleryData.albums : [];
    const galleryAlbums = albums.length;
    const galleryPhotos = albums.reduce((sum, album) => sum + (Array.isArray(album.photos) ? album.photos.length : 0), 0);
    setText('dashGalleryPhotosV12', galleryPhotos);
    setText('dashGalleryAlbumsV12', `${galleryAlbums} album`);

    const event = getEventConfig();
    setText('dashEventNameV12', event.name || 'Event belum diatur');
    const eventDate = new Date(event.datetime);
    setText('dashEventDateV12', Number.isNaN(eventDate.getTime()) ? 'Tanggal belum tersedia' : eventDate.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) + ' • ' + eventDate.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}));

    const today = new Date();
    const todayLabel = today.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});
    const todayEl = document.getElementById('dashboardTodayV12');
    if (todayEl) todayEl.innerHTML = `<i class=\"fa-regular fa-calendar\" aria-hidden=\"true\"></i> ${escapeHtml(todayLabel)}`;
    const greeting = document.getElementById('dashboardGreetingV12');
    if (greeting) {
        const h = today.getHours();
        greeting.textContent = `${h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'}, Pengurus OSIS. Berikut ringkasan terbaru website.`;
    }
    if (typeof updateQuickActionsV13 === 'function') updateQuickActionsV13();
}


function setDashboardSyncStatusV9(message, state = 'idle') {
    const status =
        document.getElementById(
            'dashboardSyncStatusV9'
        );

    if (!status) return;

    status.dataset.state = state;

    const icon =
        state === 'loading'
            ? 'fa-spinner fa-spin'
            : state === 'success'
                ? 'fa-circle-check'
                : state === 'error'
                    ? 'fa-triangle-exclamation'
                    : 'fa-cloud';

    status.innerHTML =
        `<i class="fa-solid ${icon}" aria-hidden="true"></i> ` +
        escapeHtml(message);
}

function setDashboardLastSyncV9() {
    const time =
        new Date().toLocaleTimeString(
            'id-ID',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    setDashboardSyncStatusV9(
        `Sinkron terakhir pukul ${time}.`,
        'success'
    );
}

async function syncDashboardDataV9() {
    const button =
        document.getElementById(
            'syncDashboardBtnV9'
        );

    if (!aspirasiAdminToken) {
        setDashboardSyncStatusV9(
            'Sesi admin tidak tersedia. Silakan login ulang.',
            'error'
        );
        return;
    }

    const originalHtml =
        button?.innerHTML || '';

    try {
        if (button) {
            button.disabled = true;
            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Sinkron...</span>';
        }

        setDashboardSyncStatusV9(
            'Menyinkronkan data cloud...',
            'loading'
        );

        const jobs = [];

        if (
            typeof refreshAspirasiFromServer ===
            'function'
        ) {
            jobs.push(
                refreshAspirasiFromServer({
                    showLoading: false
                })
            );
        }

        if (
            typeof refreshAdminAnnouncementsFromServer ===
            'function'
        ) {
            jobs.push(
                refreshAdminAnnouncementsFromServer({
                    showLoading: false
                })
            );
        }

        if (
            typeof refreshEventFromServer ===
            'function'
        ) {
            jobs.push(
                refreshEventFromServer()
            );
        }

        if (
            typeof refreshDriveGallery ===
            'function'
        ) {
            jobs.push(
                refreshDriveGallery({
                    showMessage: false,
                    preserveAlbum: true
                })
            );
        }

        const results =
            await Promise.allSettled(jobs);

        const failed =
            results.filter(
                result =>
                    result.status ===
                    'rejected'
            );

        renderAspirasiList?.();
        renderAdminPublicCards?.();
        populateEventForm?.();
        updateCommandCenterV12();

        if (failed.length) {
            setDashboardSyncStatusV9(
                `${failed.length} sumber data gagal disinkronkan.`,
                'error'
            );
            showAppToast(
                'Sebagian data gagal disinkronkan.',
                'error'
            );
        } else {
            setDashboardLastSyncV9();
            showAppToast(
                'Data dashboard berhasil disinkronkan.'
            );
        }
    } catch (error) {
        console.error(
            '[Dashboard] Sinkronisasi gagal:',
            error
        );

        setDashboardSyncStatusV9(
            'Sinkronisasi gagal: ' +
                error.message,
            'error'
        );

        showAppToast(
            'Sinkronisasi dashboard gagal.',
            'error'
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML =
                originalHtml;
        }
    }
}

function logoutDashboardV9() {
    if (
        !confirm(
            'Keluar dari Dashboard Internal OSIS?'
        )
    ) {
        return;
    }

    setAspirasiAdminToken('');
    aspirasiRemoteCache = [];

    if (
        typeof clearDriveAdminCredential ===
        'function'
    ) {
        clearDriveAdminCredential();
    }

    if (osisArea) {
        osisArea.style.display = 'none';
    }

    switchOsisTab('aspirations');

    showAppToast(
        'Anda telah keluar dari Area OSIS.'
    );

    window.location.hash = 'top';
}

function resetAspirationFiltersV9() {
    const search =
        document.getElementById(
            'asp-search'
        );
    const status =
        document.getElementById(
            'asp-status-filter'
        );
    const category =
        document.getElementById(
            'asp-category-filter'
        );
    const priority = document.getElementById('asp-priority-filter');
    const classFilter = document.getElementById('asp-class-filter');

    if (search) search.value = '';
    if (status) status.value = 'all';
    if (category) category.value = 'all';
    if (priority) priority.value = 'all';
    if (classFilter) classFilter.value = 'all';

    document.querySelectorAll('[data-asp-quick]').forEach(button => {
        button.classList.toggle('active', button.dataset.aspQuick === 'all');
    });

    renderAspirasiList();

    search?.focus();
}

function initializeDashboardTabKeyboardV9() {
    const tabs =
        Array.from(
            document.querySelectorAll(
                '.dashboard-tabs-primary-v14 .tab-button'
            )
        );

    tabs.forEach(
        (tab, index) => {
            tab.addEventListener(
                'keydown',
                event => {
                    let nextIndex = null;

                    if (
                        event.key ===
                        'ArrowRight'
                    ) {
                        nextIndex =
                            (index + 1) %
                            tabs.length;
                    }

                    if (
                        event.key ===
                        'ArrowLeft'
                    ) {
                        nextIndex =
                            (index - 1 +
                                tabs.length) %
                            tabs.length;
                    }

                    if (
                        event.key ===
                        'Home'
                    ) {
                        nextIndex = 0;
                    }

                    if (
                        event.key ===
                        'End'
                    ) {
                        nextIndex =
                            tabs.length - 1;
                    }

                    if (
                        nextIndex ===
                        null
                    ) {
                        return;
                    }

                    event.preventDefault();

                    const target =
                        tabs[nextIndex];

                    target.focus();
                    switchOsisTab(
                        target.dataset.tab
                    );
                }
            );
        }
    );
}

function initializeCommandCenterV12() {
    document.querySelectorAll('[data-command-tab]').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.commandTab;
            switchOsisTab(tab);
            document.querySelector('.dashboard-nav-v14')?.scrollIntoView({behavior:'smooth', block:'start'});
            if (button.dataset.commandAction === 'new-announcement') {
                setTimeout(() => document.getElementById('newAnnouncementBtn')?.click(), 300);
            }
        });
    });
    updateCommandCenterV12();
}

// Dashboard tabs
function switchOsisTab(tab) {
    document.querySelectorAll('.dashboard-nav-v14 .tab-button').forEach(btn => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
        const isPrimary = Boolean(btn.closest('.dashboard-tabs-primary-v14'));
        if (isPrimary) btn.tabIndex = active ? 0 : -1;
        else btn.tabIndex = 0;
        if (active && isPrimary && window.innerWidth <= 600) btn.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
    });
    document.querySelectorAll('.dashboard-panel').forEach(panel => {
        const active = panel.dataset.panel === tab;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', String(!active));
    });

    const tools = document.getElementById('dashboardToolsMenuV14');
    const isToolTab = ['notifications', 'security', 'backup', 'qr'].includes(tab);
    if (tools) {
        tools.classList.toggle('has-active-tool', isToolTab);
        if (isToolTab) tools.open = true;
    }
}

function populateEventForm() {
    const cfg = getEventConfig();
    const name = document.getElementById('event-name');
    const dt = document.getElementById('event-datetime');
    if (name) name.value = cfg.name;
    if (dt) dt.value = cfg.datetime.slice(0,16);
}

function exportAspirasiCSV() {
    const list = getAspirasiList();
    if (!list.length) return alert('Belum ada data untuk diekspor.');
    const rows = [['timestamp','name','kelas','category','message','priority','status','internal_note']];
    list.slice().reverse().forEach(i => rows.push([i.timestamp,i.name,i.kelas,i.category,i.message,getPriorityMeta(i.priority).label,getStatusMeta(i.status).label,i.internalNote || '']));
    const csv = '\uFEFF' + rows.map(r => r.map(c => '"'+String(c ?? '').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='aspirasi-osis.csv'; a.click(); URL.revokeObjectURL(url);
}

async function clearAspirasiStorage() {
    if (!confirm('Hapus SEMUA aspirasi dari Google Sheets? Tindakan ini tidak bisa dibatalkan.')) return;
    if (!confirm('Konfirmasi sekali lagi: seluruh data aspirasi akan dihapus permanen. Lanjutkan?')) return;
    try {
        await aspirasiApi('clear', { token: aspirasiAdminToken });
        aspirasiRemoteCache = [];
        renderAspirasiList();
        await refreshPublicAspirasiCount();
        showAppToast('Semua aspirasi berhasil dihapus dari Google Sheets.');
    } catch (error) {
        console.error('[Aspirasi] Hapus semua gagal:', error);
        showAppToast('Gagal menghapus semua aspirasi: ' + error.message);
    }
}

// Backup and restore
function downloadOsisBackup() {
    const payload = {
        app: 'OSIS SMA Al-Kahfi', version: 4, exportedAt: new Date().toISOString(),
        data: {
            aspirations: getAspirasiList(),
            announcements: getPublicCards(),
            nextEvent: getEventConfig(),
            theme: localStorage.getItem('theme') || 'light'
        }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href=url; a.download=`osis-backup-${stamp}.json`; a.click(); URL.revokeObjectURL(url);
    setInlineMessage('backupMessage','Backup berhasil dibuat. Simpan file ini di tempat aman.','success');
    showAppToast('Backup berhasil dibuat.');
}

async function restoreOsisBackup(file) {
    const msg = document.getElementById('backupMessage');
    try {
        const payload = JSON.parse(await file.text());
        if (!payload || !payload.data) throw new Error('Format backup tidak dikenali.');
        if (!confirm('Restore akan mengganti pengumuman dan event di Google Sheets serta tema pada browser ini. Lanjutkan?')) return;

        // Aspirasi tidak direstore agar data siswa di Google Sheets tidak tertimpa.
        if (Array.isArray(payload.data.announcements)) {
            if (typeof replaceAllAnnouncementsRemote !== 'function') {
                throw new Error('Modul restore pengumuman cloud tidak tersedia.');
            }
            await replaceAllAnnouncementsRemote(payload.data.announcements);
        }

        if (payload.data.nextEvent?.name && payload.data.nextEvent?.datetime) {
            await saveEventConfig({
                ...payload.data.nextEvent,
                active: payload.data.nextEvent.active !== false
            });
        }

        if (['light','dark'].includes(payload.data.theme)) {
            localStorage.setItem('theme', payload.data.theme);
            if (payload.data.theme === 'dark') body.setAttribute('data-theme','dark'); else body.removeAttribute('data-theme');
        }

        renderAspirasiList();
        renderPublicCards();
        renderAdminPublicCards();
        populateEventForm();
        updateCountdown();

        setInlineMessage('backupMessage','Restore selesai. Pengumuman dan event dipulihkan ke Google Sheets.','success');
        showAppToast('Restore data selesai.');
    } catch (e) {
        console.error(e);
        setInlineMessage('backupMessage','Restore gagal: ' + e.message,'error');
    } finally {
        const input=document.getElementById('restoreBackupInput'); if(input) input.value='';
    }
}

// QR
function getDefaultQrUrl() {
    const base = location.href.split('#')[0];
    return base.startsWith('http') ? base + '#kritik-saran' : '';
}

function generateAspirationQr() {
    const input = document.getElementById('qr-url');
    const preview = document.getElementById('qrPreview');
    let value = (input?.value || '').trim();
    if (!value) return setInlineMessage('qrMessage','Masukkan URL website yang sudah dipublish.','error');
    if (!value.includes('#')) value = value.replace(/#.*$/,'') + '#kritik-saran';
    try { new URL(value); } catch (e) { return setInlineMessage('qrMessage','URL tidak valid. Gunakan alamat lengkap yang diawali https://','error'); }
    preview.innerHTML='';
    if (typeof QRCode !== 'function') {
        preview.innerHTML='<span class="small-note">QR tidak tersedia.</span>';
        return setInlineMessage('qrMessage','QR tidak dapat dibuat.','error');
    }
    new QRCode(preview, { text:value, width:210, height:210, colorDark:'#0f172a', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H });
    setInlineMessage('qrMessage','QR berhasil dibuat.','success');
}

// Password

function initializeOsisAdmin() {
    document.querySelectorAll('.dashboard-nav-v14 .tab-button').forEach(button => button.addEventListener('click', () => {
        switchOsisTab(button.dataset.tab);
        if (button.closest('.dashboard-tools-popover-v14')) {
            const menu = document.getElementById('dashboardToolsMenuV14');
            if (menu && window.innerWidth <= 760) menu.open = false;
        }
    }));

    initializeDashboardTabKeyboardV9();

    document.getElementById('syncDashboardBtnV9')?.addEventListener(
        'click',
        syncDashboardDataV9
    );

    document.getElementById('logoutDashboardBtnV9')?.addEventListener(
        'click',
        logoutDashboardV9
    );

    document.getElementById('resetAspFiltersV9')?.addEventListener(
        'click',
        resetAspirationFiltersV9
    );
    document.getElementById('asp-search')?.addEventListener('input', renderAspirasiList);
    document.getElementById('asp-status-filter')?.addEventListener('change', renderAspirasiList);
    document.getElementById('asp-category-filter')?.addEventListener('change', renderAspirasiList);
    document.getElementById('asp-priority-filter')?.addEventListener('change', renderAspirasiList);
    document.getElementById('asp-class-filter')?.addEventListener('change', renderAspirasiList);

    document.querySelectorAll('[data-asp-quick]').forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.aspQuick || 'all';
            const status = document.getElementById('asp-status-filter');
            const priority = document.getElementById('asp-priority-filter');
            if (status) status.value = ['unread','processing','done'].includes(mode) ? mode : 'all';
            if (priority) priority.value = mode === 'high' ? 'high' : 'all';
            document.querySelectorAll('[data-asp-quick]').forEach(item => item.classList.toggle('active', item === button));
            renderAspirasiList();
        });
    });

    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k' && osisArea?.style.display === 'block') {
            event.preventDefault();
            switchOsisTab('aspirations');
            const search = document.getElementById('asp-search');
            search?.focus({preventScroll:false});
            search?.select?.();
        }
    });

    const publicCardForm = document.getElementById('publicCardForm');
    publicCardForm?.addEventListener('submit', handleAnnouncementSubmit);
    document.getElementById('cancelPublicCardEditBtn')?.addEventListener('click', resetPublicCardForm);
    document.getElementById('closeAspDetailModal')?.addEventListener('click', closeAspirasiDetail);
    document.getElementById('saveAspDetailBtn')?.addEventListener('click', saveAspirasiDetail);
    document.getElementById('aspDetailModal')?.addEventListener('click', e => { if (e.target.id === 'aspDetailModal') closeAspirasiDetail(); });

    document.getElementById('eventForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('event-name').value.trim();
        const datetime = document.getElementById('event-datetime').value;
        const submitButton = this.querySelector('button[type="submit"]');
        const originalHtml = submitButton?.innerHTML || '';

        if (!name || !datetime) {
            return setInlineMessage('eventMessage','Nama event dan tanggal wajib diisi.','error');
        }

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.style.opacity = '.7';
                submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            }

            setInlineMessage('eventMessage','Menyimpan event ke Google Sheets...');

            await saveEventConfig({
                name,
                datetime,
                active: true
            });

            setInlineMessage('eventMessage','Countdown berhasil diperbarui di Google Sheets.','success');
            showAppToast('Event berhasil diperbarui untuk semua pengunjung.');
        } catch (error) {
            console.error('[Event] Gagal menyimpan:', error);
            setInlineMessage('eventMessage','Gagal menyimpan event: ' + error.message,'error');
            showAppToast('Event gagal diperbarui: ' + error.message, 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.style.opacity = '1';
                submitButton.innerHTML = originalHtml;
            }
        }
    });

    document.getElementById('passwordChangeForm')?.addEventListener('submit', handlePasswordChange);
    document.getElementById('restoreBackupInput')?.addEventListener('change', e => { if(e.target.files?.[0]) restoreOsisBackup(e.target.files[0]); });
    document.getElementById('generateQrBtn')?.addEventListener('click', generateAspirationQr);

    const qrInput=document.getElementById('qr-url');
    if (qrInput && !qrInput.value) qrInput.value=getDefaultQrUrl();
    populateEventForm();
    renderAdminPublicCards();
    renderAspirasiList();
    switchOsisTab('aspirations');
}
