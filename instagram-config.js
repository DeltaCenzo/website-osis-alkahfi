/* =========================================================
   INSTAGRAM OSIS — KONFIGURASI AUTO-UPDATE
   =========================================================
   Mode AUTO (recommended):
     1. Buka lightwidget.com → Sign Up (gratis)
     2. Hubungkan akun Instagram @osis.smais
     3. Create Widget → pilih tata letak
     4. Copy Widget ID (contoh: "abcd1234efgh")
     5. Paste di bawah di 'widgetId'
     ✅ Setelah itu, setiap postingan IG baru OTOMATIS muncul!

   Mode MANUAL (cadangan):
     Isi array 'posts' dengan link postingan Instagram.
     Mode ini dipakai kalau widgetId dikosongkan.
   ========================================================= */

window.OSIS_INSTAGRAM_CONFIG = {

    // =========================================================
    // 1. AUTO MODE — LightWidget (SET AND FORGET)
    // =========================================================
    // Mode: "auto" (LightWidget) atau "manual" (daftar postingan)
    mode: "auto",

    // Widget ID dari LightWidget — kosongkan untuk pakai mode manual
    widgetId: "",

    // =========================================================
    // 2. MANUAL MODE — Daftar Postingan (cadangan)
    // =========================================================
    username: "osis.smais",
    profileUrl: "https://www.instagram.com/osis.smais/",

    posts: [
        // Format: { url: "link-post-ig", thumbnail: "url-gambar (opsional)" }
        // Contoh:
        // { url: "https://www.instagram.com/p/ABC123/", thumbnail: "" },
    ]
};


// =========================================================
// RENDER ENGINE
// =========================================================
(function() {
    'use strict';

    var cfg = window.OSIS_INSTAGRAM_CONFIG;
    var container = document.getElementById('instagramFeed');
    if (!container) return;

    var useWidget = cfg.mode === 'auto' && cfg.widgetId;

    if (useWidget) {
        // ======== AUTO MODE: LightWidget iframe ========
        container.innerHTML = '';
        container.style.maxWidth = '100%';
        container.style.display = 'block';

        var wrapper = document.createElement('div');
        wrapper.id = 'lightwidget-wrapper';
        wrapper.style.cssText = 'width:100%;position:relative;min-height:200px;';

        // Loading placeholder
        var loading = document.createElement('div');
        loading.className = 'ig-empty-state';
        loading.id = 'igWidgetLoading';
        loading.innerHTML = '<i class="fa-brands fa-instagram fa-2x" aria-hidden="true"></i><span>Memuat Instagram...</span>';
        wrapper.appendChild(loading);

        // iframe LightWidget
        var iframe = document.createElement('iframe');
        iframe.src = '//lightwidget.com/widgets/' + encodeURIComponent(cfg.widgetId) + '.html';
        iframe.scrolling = 'no';
        iframe.allowTransparency = true;
        iframe.className = 'lightwidget-widget';
        iframe.style.cssText = 'display:block;width:100%;border:0;overflow:hidden;';
        iframe.title = 'Feed Instagram OSIS';
        iframe.setAttribute('importance', 'low');

        iframe.onload = function() {
            var loading = document.getElementById('igWidgetLoading');
            if (loading) loading.style.display = 'none';
        };

        wrapper.appendChild(iframe);
        container.appendChild(wrapper);

        // Fallback: jika iframe tidak load dalam 8 detik, sembunyikan loading
        setTimeout(function() {
            var loading = document.getElementById('igWidgetLoading');
            if (loading) loading.style.display = 'none';
        }, 8000);

    } else if (Array.isArray(cfg.posts) && cfg.posts.length) {
        // ======== MANUAL MODE: daftar postingan ========
        container.className = 'instagram-grid';
        container.style.cssText = '';

        var posts = cfg.posts.filter(function(p) { return p.url; }).slice(0, 8);
        var loaded = 0;
        var rendered = false;

        function render() {
            if (rendered) return;
            rendered = true;
            var html = posts.map(function(post) {
                var thumb = post.thumbnail || '';
                return '<a href="' + esc(post.url) + '" target="_blank" rel="noopener noreferrer" class="ig-item">' +
                    '<div class="ig-thumb-wrap">' +
                        '<img src="' + esc(thumb) + '" alt="Postingan Instagram" loading="lazy" onerror="this.parentElement.classList.add(\'ig-failed\')"' + (thumb ? '' : ' style="display:none"') + '>' +
                        '<div class="ig-overlay-icon"><i class="fa-brands fa-instagram" aria-hidden="true"></i></div>' +
                    '</div></a>';
            }).join('');
            container.innerHTML = html;
        }

        // Coba fetch thumbnail via oEmbed
        posts.forEach(function(post, i) {
            if (post.thumbnail) {
                loaded++;
                if (loaded >= posts.length) render();
                return;
            }
            var cb = '__igCb' + i;
            var s = document.createElement('script');
            s.src = 'https://api.instagram.com/oembed?url=' + encodeURIComponent(post.url) + '&callback=' + cb;
            window[cb] = function(d) {
                if (d && d.thumbnail_url) post.thumbnail = d.thumbnail_url;
                loaded++;
                s.remove();
                delete window[cb];
                if (loaded >= posts.length) render();
            };
            s.onerror = function() {
                if (!post.thumbnail) {
                    post.thumbnail = '';
                    post._noThumb = true;
                }
                loaded++;
                s.remove();
                delete window[cb];
                if (loaded >= posts.length) render();
            };
            document.head.appendChild(s);
        });

        // Fallback render after 4 seconds
        setTimeout(render, 4000);
    }

    // Update tombol follow
    var btn = document.getElementById('igFollowBtn');
    if (btn) {
        btn.href = cfg.profileUrl || 'https://www.instagram.com/' + cfg.username + '/';
        var span = btn.querySelector('.ig-username');
        if (span) span.textContent = '@' + cfg.username;
    }

    function esc(t) {
        return String(t || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
})();