/* =========================================================
   GALERI
   ========================================================= */
// Viewer dan integrasi Google Drive/Apps Script; logika dipertahankan.

// Gallery viewer
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxFallback = document.getElementById('lightboxFallback');
const lightboxAlbumName = document.getElementById('lightboxAlbumName');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxStage = document.getElementById('lightboxStage');
let activeViewerPhotos = [];
let activeViewerIndex = 0;
let viewerTouchStartX = null;

function syncGalleryModalScrollLock() {
    const viewerOpen = lightboxModal?.style.display === 'flex';
    const albumOpen = document.getElementById('albumModal')?.style.display === 'flex';
    document.body.style.overflow = viewerOpen || albumOpen ? 'hidden' : '';
}

function showViewerPhoto(index) {
    if (!activeViewerPhotos.length) return;
    activeViewerIndex = (index + activeViewerPhotos.length) % activeViewerPhotos.length;
    const photo = activeViewerPhotos[activeViewerIndex];
    const caption = photo?.name || `Foto ${activeViewerIndex + 1}`;

    lightboxFallback.style.display = 'none';
    lightboxImg.style.display = 'block';
    lightboxImg.classList.remove('is-ready');
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightboxCounter.textContent = `${activeViewerIndex + 1} / ${activeViewerPhotos.length}`;
    lightboxPrev.hidden = activeViewerPhotos.length <= 1;
    lightboxNext.hidden = activeViewerPhotos.length <= 1;
    lightboxImg.src = photo?.src || '';
}

function openGalleryViewer(photos, index=0, albumName='Galeri') {
    activeViewerPhotos = Array.isArray(photos) ? photos.filter(p => p?.src) : [];
    if (!activeViewerPhotos.length) return;
    lightboxAlbumName.textContent = albumName || 'Galeri';
    lightboxModal.style.display = 'flex';
    syncGalleryModalScrollLock();
    showViewerPhoto(index);
    lightboxModal.querySelector('.gallery-viewer-close')?.focus({preventScroll:true});
}

function openLightbox(src, caption) {
    openGalleryViewer([{src, name:caption || 'Foto'}], 0, 'Galeri');
}

function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.style.display = 'none';
    syncGalleryModalScrollLock();
}

function showPreviousViewerPhoto() { showViewerPhoto(activeViewerIndex - 1); }
function showNextViewerPhoto() { showViewerPhoto(activeViewerIndex + 1); }

lightboxImg?.addEventListener('load', () => lightboxImg.classList.add('is-ready'));
lightboxImg?.addEventListener('error', () => {
    lightboxImg.style.display = 'none';
    lightboxFallback.style.display = 'flex';
});
lightboxPrev?.addEventListener('click', showPreviousViewerPhoto);
lightboxNext?.addEventListener('click', showNextViewerPhoto);
lightboxModal?.addEventListener('click', e => { if (e.target === lightboxModal) closeLightbox(); });
lightboxStage?.addEventListener('touchstart', e => {
    viewerTouchStartX = e.changedTouches?.[0]?.clientX ?? null;
}, {passive:true});
lightboxStage?.addEventListener('touchend', e => {
    if (viewerTouchStartX === null || activeViewerPhotos.length <= 1) return;
    const endX = e.changedTouches?.[0]?.clientX ?? viewerTouchStartX;
    const dx = endX - viewerTouchStartX;
    viewerTouchStartX = null;
    if (Math.abs(dx) < 45) return;
    if (dx < 0) showNextViewerPhoto();
    else showPreviousViewerPhoto();
}, {passive:true});

document.addEventListener('keydown', (e) => {
    if (lightboxModal?.style.display === 'flex') {
        if (e.key === 'Escape') { closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { showPreviousViewerPhoto(); return; }
        if (e.key === 'ArrowRight') { showNextViewerPhoto(); return; }
    }
    if (e.key === 'Escape') {
        if (document.getElementById('albumModal')?.style.display === 'flex') { closeAlbum(); return; }
        tutupModalLogin();
        closeMobileNav();
    }
});

// Google Drive gallery
const DRIVE_CONFIG = window.OSIS_GALLERY_CONFIG || {};
let driveGalleryData = {albums:[]};
let selectedGalleryAlbumId = null;
let galleryPendingFiles = [];
let galleryPendingObjectUrls = [];
let galleryFailedFiles = [];
const gallerySelectedPhotoIds = new Set();
let draggedGalleryPhotoId = null;
let driveGalleryLoadingPromise = null;

const albumModal = document.getElementById('albumModal');
const albumTitle = document.getElementById('albumTitle');
const albumSubtitle = document.getElementById('albumSubtitle');
const albumPhotoCount = document.getElementById('albumPhotoCount');
const albumDumpGrid = document.getElementById('albumDumpGrid');

function isDriveGalleryConfigured() {
    const url = String(DRIVE_CONFIG.appsScriptUrl || '').trim();
    return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(url);
}

function getDriveGalleryUrl() {
    return isDriveGalleryConfigured() ? String(DRIVE_CONFIG.appsScriptUrl).trim() : '';
}

// Kredensial admin galeri hanya hidup di memory tab ini.
// Tidak pernah disimpan ke localStorage/sessionStorage.
let driveAdminKey = '';
let driveAdminKeyPromise = null;

function clearDriveAdminCredential() {
    driveAdminKey = '';
    driveAdminKeyPromise = null;
}

window.clearDriveAdminCredential = clearDriveAdminCredential;

async function getDriveAdminKey() {
    if (driveAdminKey) {
        return driveAdminKey;
    }

    if (!aspirasiAdminToken) {
        throw new Error(
            'Sesi admin belum tersedia. Silakan login Area OSIS terlebih dahulu.'
        );
    }

    if (driveAdminKeyPromise) {
        return driveAdminKeyPromise;
    }

    driveAdminKeyPromise = aspirasiApi(
        'galleryCredential',
        {
            token: aspirasiAdminToken
        }
    )
        .then(result => {
            const key = String(result?.key || '').trim();

            if (!key) {
                throw new Error(
                    'Backend tidak memberikan kredensial galeri.'
                );
            }

            driveAdminKey = key;
            return driveAdminKey;
        })
        .finally(() => {
            driveAdminKeyPromise = null;
        });

    return driveAdminKeyPromise;
}

function revokeUrls(urls) {
    while (urls.length) {
        try { URL.revokeObjectURL(urls.pop()); } catch (e) {}
    }
}

function getVisibleGalleryAlbums() {
    return Array.isArray(driveGalleryData?.albums) ? driveGalleryData.albums : [];
}

function loadDriveGalleryData(force=false) {
    if (!isDriveGalleryConfigured()) return Promise.resolve({albums:[]});
    if (driveGalleryLoadingPromise && !force) return driveGalleryLoadingPromise;

    driveGalleryLoadingPromise = new Promise((resolve, reject) => {
        const callback = '__osisGalleryCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        const script = document.createElement('script');
        let finished = false;
        let timer;

        const cleanup = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            try { delete window[callback]; } catch(e) { window[callback] = undefined; }
            script.remove();
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error('Google Drive tidak merespons.'));
        }, 15000);

        window[callback] = data => {
            cleanup();
            if (!data || data.ok === false) {
                reject(new Error(data?.error || 'Galeri Google Drive gagal dimuat.'));
                return;
            }
            driveGalleryData = data;
            updateCommandCenterV12?.();
            resolve(data);
        };

        const sep = getDriveGalleryUrl().includes('?') ? '&' : '?';
        script.src = getDriveGalleryUrl() + sep + 'action=gallery&callback=' + encodeURIComponent(callback) + '&t=' + Date.now();
        script.onerror = () => {
            cleanup();
            reject(new Error('Tidak dapat terhubung ke Google Apps Script.'));
        };
        document.head.appendChild(script);
    }).finally(() => { driveGalleryLoadingPromise = null; });

    return driveGalleryLoadingPromise;
}

async function drivePost(payload, timeoutMs=60000) {
    const url = getDriveGalleryUrl();

    if (!url) {
        throw new Error(
            'Google Drive belum dihubungkan.'
        );
    }

    // Minta key sementara hanya setelah sesi admin tervalidasi.
    const key = await getDriveAdminKey();

    return new Promise((resolve, reject) => {
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        const frameName = 'osisDriveFrame_' + requestId;
        const iframe = document.createElement('iframe');
        iframe.name = frameName;
        iframe.style.display = 'none';
        iframe.setAttribute('aria-hidden', 'true');

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = frameName;
        form.style.display = 'none';

        const addField = (name, value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };
        addField('requestId', requestId);
        addField('payload', JSON.stringify({...payload, key}));

        let finished = false;
        let timer;
        const cleanup = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            setTimeout(() => { iframe.remove(); form.remove(); }, 0);
        };

        const onMessage = event => {
            const data = event.data;
            if (!data || data.source !== 'osis-drive-gallery' || data.requestId !== requestId) return;
            cleanup();
            if (data.ok) {
                resolve(data);
            } else {
                const message =
                    data.error ||
                    'Operasi Google Drive gagal.';

                if (/key|kunci|auth|unauthor|forbidden/i.test(message)) {
                    clearDriveAdminCredential();
                }

                reject(
                    new Error(message)
                );
            }
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error('Permintaan terlalu lama. Periksa deployment Apps Script.'));
        }, timeoutMs);

        window.addEventListener('message', onMessage);
        document.body.append(iframe, form);
        form.submit();
    });
}

function galleryPhotoUrl(photo) {
    return String(photo?.url || '');
}

function renderPublicGallery() {
    const grid = document.getElementById('galleryGrid');
    const summary = document.getElementById('gallerySummary');
    if (!grid) return;
    grid.innerHTML = '';
    const albums = getVisibleGalleryAlbums();
    const totalPhotos = albums.reduce((sum, album) => {
        return sum + (Array.isArray(album.photos) ? album.photos.length : 0);
    }, 0);

    if (summary) {
        summary.innerHTML = `<i class="fa-solid fa-images" aria-hidden="true"></i> ${albums.length} album${totalPhotos ? ` • ${totalPhotos} foto` : ''}`;
    }

    if (!albums.length) {
        grid.innerHTML = '<div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-regular fa-images"></i></span><strong>Belum ada album foto</strong><small>Galeri masih kosong.</small></div></div>';
        return;
    }

    albums.forEach((album, index) => {
        const photos = Array.isArray(album.photos) ? album.photos : [];
        const cover = photos.find(p => p.id === album.coverPhotoId) || photos[0];
        const coverSrc = galleryPhotoUrl(cover);
        const photoCount = photos.length;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery-item';
        button.setAttribute('aria-label', `Buka album ${album.title || 'galeri'}, ${photoCount} foto`);

        if (coverSrc) {
            const img = document.createElement('img');
            img.className = 'real-img';
            img.src = coverSrc;
            img.alt = `Cover ${album.title || 'album'}`;
            img.loading = index < 2 ? 'eager' : 'lazy';
            img.decoding = 'async';
            if (index === 0) img.fetchPriority = 'high';
            img.onerror = () => { img.style.display = 'none'; };
            button.appendChild(img);
        }

        const placeholder = document.createElement('div');
        placeholder.className = 'gallery-placeholder';
        placeholder.innerHTML = '<i class="fa-solid fa-images fa-2x" aria-hidden="true"></i>';

        const top = document.createElement('div');
        top.className = 'gallery-card-top';
        const count = document.createElement('span');
        count.className = 'gallery-photo-badge';
        count.innerHTML = `<i class="fa-solid fa-camera" aria-hidden="true"></i> ${photoCount} foto`;
        const albumBadge = document.createElement('span');
        albumBadge.className = 'gallery-cover-badge-public';
        albumBadge.innerHTML = '<i class="fa-solid fa-images" aria-hidden="true"></i>';
        top.append(count, albumBadge);

        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';
        const footer = document.createElement('div');
        footer.className = 'gallery-card-footer';
        const copy = document.createElement('div');
        copy.className = 'gallery-card-copy';
        const h4 = document.createElement('h4');
        h4.textContent = album.title || 'Album';
        const small = document.createElement('small');
        small.textContent = album.subtitle || 'Dokumentasi kegiatan OSIS';
        copy.append(h4, small);
        const hint = document.createElement('span');
        hint.className = 'gallery-open-hint';
        hint.innerHTML = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        footer.append(copy, hint);
        overlay.append(footer);

        button.append(placeholder, top, overlay);
        button.addEventListener('click', () => openAlbum(album.id));
        grid.appendChild(button);
    });
}

function getAlbumById(id) {
    return getVisibleGalleryAlbums().find(a => a.id === id) || null;
}

function getAlbumViewerPhotos(album) {
    if (!album || !Array.isArray(album.photos)) return [];
    return album.photos.map((p, i) => ({
        src: galleryPhotoUrl(p),
        name: p.name || `${album.title || 'Foto'} ${i + 1}`
    })).filter(p => p.src);
}

function openAlbum(key) {
    const album = getAlbumById(key);
    if (!album) return;

    albumTitle.textContent = album.title || 'Album';
    albumSubtitle.textContent = album.subtitle || 'Koleksi foto kegiatan';
    albumDumpGrid.innerHTML = '';
    const photos = getAlbumViewerPhotos(album);
    if (albumPhotoCount) {
        albumPhotoCount.innerHTML = `<i class="fa-solid fa-image" aria-hidden="true"></i> ${photos.length} foto`;
    }

    if (!photos.length) {
        albumDumpGrid.innerHTML = '<div class="gallery-empty">Belum ada foto di album ini.</div>';
    }

    photos.forEach((photo, i) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'dump-item';
        item.setAttribute('aria-label', `Buka foto ${i + 1} dari ${photos.length}`);

        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.name || `${album.title || 'Foto'} ${i + 1}`;
        img.loading = i < 6 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.onerror = () => { img.style.opacity = '.25'; };
        item.appendChild(img);
        item.addEventListener('click', () => openGalleryViewer(photos, i, album.title || 'Galeri'));
        albumDumpGrid.appendChild(item);
    });

    albumModal.style.display = 'flex';
    syncGalleryModalScrollLock();
    albumModal.querySelector('.album-close-btn')?.focus({preventScroll:true});
}

function closeAlbum() {
    albumModal.style.display = 'none';
    syncGalleryModalScrollLock();
}
albumModal.addEventListener('click', e => {
    if (e.target === albumModal) closeAlbum();
});

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function canvasToBlob(canvas, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

async function compressGalleryImage(file) {
    let image;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (bitmap) {
        image = bitmap;
    } else {
        image = await new Promise((resolve, reject) => {
            const img = new Image();
        img.loading = 'lazy';
        img.decoding = 'async';
            const u = URL.createObjectURL(file);
            img.onload = () => { URL.revokeObjectURL(u); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('Foto tidak dapat dibaca.')); };
            img.src = u;
        });
    }

    let maxSide = 1600;
    let quality = 0.80;
    let blob = null;

    for (let attempt = 0; attempt < 4; attempt++) {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d', {alpha:false}).drawImage(image, 0, 0, canvas.width, canvas.height);
        blob = await canvasToBlob(canvas, quality);
        if (blob && blob.size <= 850 * 1024) break;
        maxSide = Math.round(maxSide * 0.82);
        quality = Math.max(0.62, quality - 0.07);
    }

    if (bitmap?.close) bitmap.close();
    if (!blob) throw new Error('Foto gagal dikompres.');
    if (blob.size > 1200 * 1024) throw new Error('Foto masih terlalu besar setelah dikompres.');
    return blob;
}

function clearPendingGallerySelection() {
    galleryPendingFiles = [];
    galleryFailedFiles = [];
    revokeUrls(galleryPendingObjectUrls);
    const preview = document.getElementById('galleryPendingPreview');
    if (preview) preview.innerHTML = '';
    const input = document.getElementById('galleryPhotoInput');
    if (input) input.value = '';
    const upload = document.getElementById('uploadGalleryPhotosBtn');
    if (upload) upload.disabled = true;
    const clear = document.getElementById('clearGallerySelectionBtn');
    if (clear) clear.disabled = true;
}

function previewPendingGalleryFiles(files) {
    clearPendingGallerySelection();
    galleryFailedFiles = [];
    const seen = new Set();
    const accepted = [];
    let duplicates = 0;
    Array.from(files || []).filter(f => f.type.startsWith('image/')).slice(0,30).forEach(file => {
        const key = `${file.name}|${file.size}|${file.lastModified}`;
        if (seen.has(key)) { duplicates++; return; }
        seen.add(key);
        accepted.push(file);
    });
    galleryPendingFiles = accepted;
    renderPendingGalleryPreview();
    if (galleryPendingFiles.length) {
        setInlineMessage('galleryUploadMessage', `${galleryPendingFiles.length} foto dipilih${duplicates ? ` • ${duplicates} duplikat pilihan dilewati` : ''}.`);
    }
}

function renderPendingGalleryPreview() {
    revokeUrls(galleryPendingObjectUrls);
    galleryPendingObjectUrls = [];
    const preview = document.getElementById('galleryPendingPreview');
    if (preview) preview.innerHTML = '';
    galleryPendingFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        galleryPendingObjectUrls.push(url);
        const div = document.createElement('div');
        div.className = 'gallery-file-preview-item';
        const img = document.createElement('img');
        img.src = url; img.alt = file.name; img.loading = 'lazy';
        div.appendChild(img); preview?.appendChild(div);
    });
    const upload = document.getElementById('uploadGalleryPhotosBtn');
    if (upload) upload.disabled = !galleryPendingFiles.length;
    const clear = document.getElementById('clearGallerySelectionBtn');
    if (clear) clear.disabled = !galleryPendingFiles.length;
    const retry = document.getElementById('retryGalleryUploadsBtn');
    if (retry) retry.hidden = !galleryFailedFiles.length;
}

async function sha256Blob(blob) {
    if (!crypto?.subtle) return '';
    const buf = await blob.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function updateDriveGalleryStatus(error='') {
    const status = document.getElementById('driveGalleryStatus');
    const openBtn = document.getElementById('openDriveGalleryBtn');
    if (!status) return;

    if (!isDriveGalleryConfigured()) {
        status.textContent = 'Google Drive belum dihubungkan.';
        if (openBtn) openBtn.style.display = 'none';
        return;
    }
    if (error) {
        status.textContent = 'Google Drive belum dapat diakses.';
        if (openBtn) openBtn.style.display = 'none';
        return;
    }

    status.textContent = `Terhubung • ${driveGalleryData.albums?.length || 0} album`;
    if (openBtn && driveGalleryData.rootFolderUrl) {
        openBtn.href = driveGalleryData.rootFolderUrl;
        openBtn.style.display = 'inline-flex';
    }
}

async function refreshDriveGallery({showMessage=false, preserveAlbum=true}={}) {
    try {
        const previous = preserveAlbum ? selectedGalleryAlbumId : null;
        await loadDriveGalleryData(true);
        renderPublicGallery();
        populateGalleryAlbumSelect(previous);
        updateDriveGalleryStatus();
        if (showMessage) {
            setInlineMessage('driveGalleryMessage', 'Galeri Google Drive berhasil dimuat.', 'success');
        }
        return true;
    } catch (e) {
        console.error(e);
        updateDriveGalleryStatus(e.message);
        if (showMessage) setInlineMessage('driveGalleryMessage', e.message, 'error');
        return false;
    }
}

function populateGalleryAlbumSelect(preferredId=null) {
    const select = document.getElementById('galleryAlbumSelect');
    if (!select) return;
    const albums = Array.isArray(driveGalleryData.albums) ? driveGalleryData.albums : [];
    select.innerHTML = '';

    if (!albums.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Belum ada album';
        select.appendChild(option);
        selectedGalleryAlbumId = null;
    } else {
        albums.forEach(album => {
            const option = document.createElement('option');
            option.value = album.id;
            option.textContent = album.title || 'Album';
            select.appendChild(option);
        });
        selectedGalleryAlbumId =
            preferredId && albums.some(a => a.id === preferredId)
                ? preferredId
                : albums[0].id;
        select.value = selectedGalleryAlbumId;
    }
    loadGalleryAlbumForm();
}

function loadGalleryAlbumForm() {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId) || null;
    const title = document.getElementById('galleryAlbumTitle');
    const subtitle = document.getElementById('galleryAlbumSubtitle');
    if (title) title.value = album?.title || '';
    if (subtitle) subtitle.value = album?.subtitle || '';
    const del = document.getElementById('deleteGalleryAlbumBtn');
    if (del) del.disabled = !album;
    const albums = driveGalleryData.albums || [];
    const albumIndex = album ? albums.findIndex(a => a.id === album.id) : -1;
    const up = document.getElementById('moveGalleryAlbumUpBtn');
    const down = document.getElementById('moveGalleryAlbumDownBtn');
    if (up) up.disabled = albumIndex <= 0;
    if (down) down.disabled = albumIndex < 0 || albumIndex >= albums.length - 1;
    renderGalleryAdminPhotos();
}

function startNewGalleryAlbum() {
    selectedGalleryAlbumId = null;
    const select = document.getElementById('galleryAlbumSelect');
    if (select) select.selectedIndex = -1;
    const title = document.getElementById('galleryAlbumTitle');
    if (title) title.value = '';
    const subtitle = document.getElementById('galleryAlbumSubtitle');
    if (subtitle) subtitle.value = '';
    const grid = document.getElementById('galleryAdminPhotos');
    if (grid) grid.innerHTML = '<div class="gallery-empty">Simpan album baru, lalu upload foto.</div>';
    setInlineMessage('galleryAlbumMessage', '');
}

async function saveGalleryAlbum() {
    const title = document.getElementById('galleryAlbumTitle')?.value.trim();
    const subtitle = document.getElementById('galleryAlbumSubtitle')?.value.trim() || '';
    if (!title) {
        setInlineMessage('galleryAlbumMessage', 'Isi judul album terlebih dahulu.', 'error');
        return;
    }

    try {
        setInlineMessage('galleryAlbumMessage', 'Menyimpan album...');
        const result = await drivePost({
            action:'upsertAlbum',
            albumId:selectedGalleryAlbumId || '',
            title,
            subtitle
        });
        selectedGalleryAlbumId = result.albumId || selectedGalleryAlbumId;
        await refreshDriveGallery({preserveAlbum:true});
        setInlineMessage('galleryAlbumMessage', 'Album berhasil disimpan.', 'success');
        showAppToast('Album berhasil disimpan.');
    } catch (e) {
        setInlineMessage('galleryAlbumMessage', e.message, 'error');
    }
}

async function deleteSelectedGalleryAlbum() {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album) return;
    if (!confirm(`Hapus album “${album.title}” beserta semua fotonya dari Google Drive?`)) return;

    try {
        setInlineMessage('galleryAlbumMessage', 'Menghapus album...');
        await drivePost({action:'deleteAlbum', albumId:album.id});
        selectedGalleryAlbumId = null;
        await refreshDriveGallery({preserveAlbum:false});
        setInlineMessage('galleryAlbumMessage', 'Album dihapus.', 'success');
        showAppToast('Album berhasil dihapus.');
    } catch (e) {
        setInlineMessage('galleryAlbumMessage', e.message, 'error');
    }
}

async function uploadPendingGalleryPhotos() {
    if (!galleryPendingFiles.length) return;
    let albumId = selectedGalleryAlbumId;
    const title = document.getElementById('galleryAlbumTitle')?.value.trim();
    const subtitle = document.getElementById('galleryAlbumSubtitle')?.value.trim() || '';
    if (!albumId && !title) return setInlineMessage('galleryUploadMessage','Pilih album atau buat album baru terlebih dahulu.','error');

    const btn = document.getElementById('uploadGalleryPhotosBtn');
    const progress = document.getElementById('galleryUploadProgress');
    const bar = progress?.querySelector('span');
    btn.disabled = true; if (progress) progress.style.display = 'block'; if (bar) bar.style.width = '0%';
    const queue = galleryPendingFiles.slice();
    galleryFailedFiles = [];
    let uploaded = 0, duplicates = 0, processed = 0;
    try {
        if (!albumId) {
            const created = await drivePost({action:'upsertAlbum', albumId:'', title, subtitle});
            albumId = created.albumId; selectedGalleryAlbumId = albumId;
        }
        for (const file of queue) {
            setInlineMessage('galleryUploadMessage', `Memproses ${processed + 1} dari ${queue.length} foto...`);
            try {
                const blob = await compressGalleryImage(file);
                const hash = await sha256Blob(blob);
                const dataUrl = await blobToDataUrl(blob);
                const result = await drivePost({action:'uploadPhoto', albumId, name:file.name, sha256:hash, dataUrl}, 90000);
                if (result.duplicate) duplicates++; else uploaded++;
            } catch (fileError) {
                console.warn('Upload foto gagal:', file.name, fileError);
                galleryFailedFiles.push(file);
            }
            processed++;
            if (bar) bar.style.width = `${Math.round(processed / queue.length * 100)}%`;
        }
        galleryPendingFiles = galleryFailedFiles.slice();
        renderPendingGalleryPreview();
        await refreshDriveGallery({preserveAlbum:true});
        const parts = [];
        if (uploaded) parts.push(`${uploaded} berhasil`);
        if (duplicates) parts.push(`${duplicates} duplikat dilewati`);
        if (galleryFailedFiles.length) parts.push(`${galleryFailedFiles.length} gagal`);
        const uploadSummary = parts.join(' • ') || 'Tidak ada foto yang diupload.';
        setInlineMessage('galleryUploadMessage', uploadSummary, galleryFailedFiles.length ? 'error' : 'success');
        showAppToast(uploadSummary, galleryFailedFiles.length ? 'warning' : 'success');
    } finally {
        if (progress) setTimeout(() => { progress.style.display='none'; if(bar) bar.style.width='0%'; }, 700);
        btn.disabled = !galleryPendingFiles.length;
        const retry = document.getElementById('retryGalleryUploadsBtn'); if (retry) retry.hidden = !galleryFailedFiles.length;
    }
}

function retryFailedGalleryUploads() {
    if (!galleryFailedFiles.length) return;
    galleryPendingFiles = galleryFailedFiles.slice();
    uploadPendingGalleryPhotos();
}

async function persistGalleryPhotoOrder(albumId, ids) {
    await drivePost({action:'reorderPhotos', albumId, photoIds:ids});
    await refreshDriveGallery({preserveAlbum:true});
}

async function moveGalleryPhoto(photoId, direction) {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album) return;
    const ids = album.photos.map(p => p.id);
    const idx = ids.indexOf(photoId);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    try { await persistGalleryPhotoOrder(album.id, ids); } catch(e) { setInlineMessage('galleryAlbumMessage',e.message,'error'); }
}

async function moveSelectedGalleryAlbum(direction) {
    const albums = driveGalleryData.albums || [];
    const ids = albums.map(a => a.id);
    const idx = ids.indexOf(selectedGalleryAlbumId);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    try {
        await drivePost({action:'reorderAlbums', albumIds:ids});
        await refreshDriveGallery({preserveAlbum:true});
    } catch(e) { setInlineMessage('galleryAlbumMessage',e.message,'error'); }
}

function updateGalleryBulkButtons() {
    const del = document.getElementById('deleteSelectedGalleryPhotosBtn');
    if (del) del.disabled = gallerySelectedPhotoIds.size === 0;
    const all = document.getElementById('selectAllGalleryPhotosBtn');
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (all) all.innerHTML = gallerySelectedPhotoIds.size && gallerySelectedPhotoIds.size === (album?.photos?.length || 0) ? '<i class="fa-regular fa-square"></i> Batal Pilih' : '<i class="fa-regular fa-square-check"></i> Pilih Semua';
}

function toggleSelectAllGalleryPhotos() {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album) return;
    if (gallerySelectedPhotoIds.size === album.photos.length) gallerySelectedPhotoIds.clear();
    else album.photos.forEach(p => gallerySelectedPhotoIds.add(p.id));
    renderGalleryAdminPhotos();
}

async function deleteSelectedGalleryPhotos() {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album || !gallerySelectedPhotoIds.size) return;
    const count = gallerySelectedPhotoIds.size;
    if (!confirm(`Hapus ${count} foto terpilih dari Google Drive?`)) return;
    try {
        await drivePost({action:'deletePhotos', albumId:album.id, photoIds:Array.from(gallerySelectedPhotoIds)}, 90000);
        gallerySelectedPhotoIds.clear();
        await refreshDriveGallery({preserveAlbum:true});
        setInlineMessage('galleryAlbumMessage', `${count} foto dihapus.`, 'success');
    } catch(e) { setInlineMessage('galleryAlbumMessage',e.message,'error'); }
}

function renderGalleryAdminPhotos() {
    const grid = document.getElementById('galleryAdminPhotos');
    if (!grid) return;
    grid.innerHTML = '';
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album) { grid.innerHTML = '<div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-regular fa-folder-open"></i></span><strong>Belum ada album dipilih</strong><small>Pilih album dari daftar.</small></div></div>'; gallerySelectedPhotoIds.clear(); updateGalleryBulkButtons(); return; }
    const photos = Array.isArray(album.photos) ? album.photos : [];
    [...gallerySelectedPhotoIds].forEach(id => { if (!photos.some(p => p.id === id)) gallerySelectedPhotoIds.delete(id); });
    if (!photos.length) { grid.innerHTML = '<div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-regular fa-image"></i></span><strong>Album masih kosong</strong><small>Belum ada foto.</small></div></div>'; gallerySelectedPhotoIds.clear(); updateGalleryBulkButtons(); return; }

    photos.forEach((photo, index) => {
        const card = document.createElement('div');
        card.className = 'gallery-admin-photo' + (gallerySelectedPhotoIds.has(photo.id) ? ' is-selected' : '');
        card.draggable = true; card.dataset.photoId = photo.id;
        const select = document.createElement('input');
        select.type='checkbox'; select.className='gallery-photo-select'; select.checked=gallerySelectedPhotoIds.has(photo.id); select.setAttribute('aria-label',`Pilih ${photo.name || 'foto'}`);
        select.addEventListener('change', () => { select.checked ? gallerySelectedPhotoIds.add(photo.id) : gallerySelectedPhotoIds.delete(photo.id); card.classList.toggle('is-selected',select.checked); updateGalleryBulkButtons(); });
        const img = document.createElement('img');
        img.src=galleryPhotoUrl(photo); img.alt=photo.name || 'Foto'; img.loading='lazy'; img.decoding='async';
        const body=document.createElement('div'); body.className='gallery-admin-photo-body';
        const name=document.createElement('small'); name.textContent=photo.name || 'Foto';
        const dragHint=document.createElement('span'); dragHint.className='gallery-photo-drag-hint'; dragHint.innerHTML=`<i class="fa-solid fa-grip"></i> Posisi ${index+1}`;
        const actions=document.createElement('div'); actions.className='gallery-admin-photo-actions';
        const cover=document.createElement('button'); cover.type='button'; cover.className='gallery-mini-btn'+(album.coverPhotoId===photo.id?' primary':''); cover.innerHTML=album.coverPhotoId===photo.id?'<i class="fa-solid fa-star"></i> Cover':'<i class="fa-regular fa-star"></i> Cover';
        cover.addEventListener('click', async () => { try { await drivePost({action:'setCover',albumId:album.id,photoId:photo.id}); await refreshDriveGallery({preserveAlbum:true}); showAppToast('Cover album diperbarui.'); } catch(e){ setInlineMessage('galleryAlbumMessage',e.message,'error'); showAppToast(e.message,'error'); } });
        const del=document.createElement('button'); del.type='button'; del.className='gallery-mini-btn danger'; del.innerHTML='<i class="fa-solid fa-trash"></i>'; del.setAttribute('aria-label','Hapus foto');
        del.addEventListener('click', async () => { if(!confirm('Hapus foto ini dari Google Drive?')) return; try{ await drivePost({action:'deletePhoto',albumId:album.id,photoId:photo.id}); gallerySelectedPhotoIds.delete(photo.id); await refreshDriveGallery({preserveAlbum:true}); showAppToast('Foto berhasil dihapus.'); }catch(e){setInlineMessage('galleryAlbumMessage',e.message,'error'); showAppToast(e.message,'error');} });
        const order=document.createElement('div'); order.className='gallery-photo-order';
        const left=document.createElement('button'); left.type='button'; left.className='gallery-mini-btn'; left.innerHTML='<i class="fa-solid fa-arrow-left"></i>'; left.disabled=index===0; left.setAttribute('aria-label','Geser foto ke kiri'); left.addEventListener('click',()=>moveGalleryPhoto(photo.id,-1));
        const right=document.createElement('button'); right.type='button'; right.className='gallery-mini-btn'; right.innerHTML='<i class="fa-solid fa-arrow-right"></i>'; right.disabled=index===photos.length-1; right.setAttribute('aria-label','Geser foto ke kanan'); right.addEventListener('click',()=>moveGalleryPhoto(photo.id,1));
        order.append(left,right); actions.append(cover,del); body.append(name,dragHint,actions,order); card.append(select,img,body); grid.appendChild(card);

        card.addEventListener('dragstart', () => { draggedGalleryPhotoId=photo.id; card.classList.add('dragging'); });
        card.addEventListener('dragend', () => { draggedGalleryPhotoId=null; card.classList.remove('dragging'); grid.querySelectorAll('.drag-target').forEach(el=>el.classList.remove('drag-target')); });
        card.addEventListener('dragover', e => { if(!draggedGalleryPhotoId || draggedGalleryPhotoId===photo.id) return; e.preventDefault(); card.classList.add('drag-target'); });
        card.addEventListener('dragleave',()=>card.classList.remove('drag-target'));
        card.addEventListener('drop', async e => {
            e.preventDefault(); card.classList.remove('drag-target');
            if(!draggedGalleryPhotoId || draggedGalleryPhotoId===photo.id) return;
            const ids=album.photos.map(p=>p.id); const from=ids.indexOf(draggedGalleryPhotoId); const to=ids.indexOf(photo.id);
            if(from<0||to<0) return; const [moved]=ids.splice(from,1); ids.splice(to,0,moved);
            try{ await persistGalleryPhotoOrder(album.id,ids); }catch(err){setInlineMessage('galleryAlbumMessage',err.message,'error');}
        });
    });
    updateGalleryBulkButtons();
}

async function initializeGallerySystem() {
    const securityStatus =
        document.getElementById(
            'driveGallerySecurityStatus'
        );

    if (securityStatus) {
        securityStatus.title =
            'Kredensial upload diambil sementara dari backend setelah login admin.';
    }

    document.getElementById('testDriveGalleryBtn')?.addEventListener('click', () => {
        refreshDriveGallery({showMessage:true});
    });
    document.getElementById('refreshDriveGalleryBtn')?.addEventListener('click', () => {
        refreshDriveGallery({showMessage:true});
    });
    document.getElementById('galleryAlbumSelect')?.addEventListener('change', e => {
        selectedGalleryAlbumId = e.target.value || null;
        gallerySelectedPhotoIds.clear();
        clearPendingGallerySelection();
        loadGalleryAlbumForm();
    });
    document.getElementById('saveGalleryAlbumBtn')?.addEventListener('click', () => {
        saveGalleryAlbum();
    });
    document.getElementById('newGalleryAlbumBtn')?.addEventListener('click', startNewGalleryAlbum);
    document.getElementById('deleteGalleryAlbumBtn')?.addEventListener('click', () => {
        deleteSelectedGalleryAlbum();
    });
    document.getElementById('galleryPhotoInput')?.addEventListener('change', e => {
        previewPendingGalleryFiles(e.target.files);
    });
    document.getElementById('uploadGalleryPhotosBtn')?.addEventListener('click', () => {
        uploadPendingGalleryPhotos();
    });
    document.getElementById('clearGallerySelectionBtn')?.addEventListener('click', () => {
        clearPendingGallerySelection();
        setInlineMessage('galleryUploadMessage', '');
    });
    document.getElementById('retryGalleryUploadsBtn')?.addEventListener('click', retryFailedGalleryUploads);
    document.getElementById('selectAllGalleryPhotosBtn')?.addEventListener('click', toggleSelectAllGalleryPhotos);
    document.getElementById('deleteSelectedGalleryPhotosBtn')?.addEventListener('click', deleteSelectedGalleryPhotos);
    document.getElementById('moveGalleryAlbumUpBtn')?.addEventListener('click', () => moveSelectedGalleryAlbum(-1));
    document.getElementById('moveGalleryAlbumDownBtn')?.addEventListener('click', () => moveSelectedGalleryAlbum(1));

    updateDriveGalleryStatus();

    if (isDriveGalleryConfigured()) {
        await refreshDriveGallery({preserveAlbum:false});
    } else {
        driveGalleryData = {albums:[]};
        renderPublicGallery();
        populateGalleryAlbumSelect();
        setInlineMessage(
            'driveGalleryMessage',
            'Hubungkan Apps Script terlebih dahulu untuk mengaktifkan upload Google Drive.'
        );
    }
}
