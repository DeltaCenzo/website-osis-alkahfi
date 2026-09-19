/* React migration compatibility layer: legacy production behavior retained during strangler migration. */
/* ==========================================================================
   OSIS AL-KAHFI — PRODUCTION JAVASCRIPT BUNDLE V45
   Ordered to preserve the previous defer execution contract.
   Config files remain separate because they are intentionally editable.
   ========================================================================== */

/* ===== MODULE: core.js ===== */
/* =========================================================
   CORE UI & UTILITIES
   ========================================================= */
// Navigasi, hero, tema, scroll, dan helper umum.

// Performance class and motion effects are handled by js/motion.js.

// Mobile navigation is owned exclusively by the V45.1 mobile controller near the end of this bundle.

// Hero phrase rotation is handled by js/motion.js to avoid layout jitter.


// Storage can throw SecurityError in private/restricted browsing contexts.
// Keep optional persistence from crashing the whole legacy compatibility runtime.
function safeStorageGet(storage, key, fallback = null) {
    try {
        const value = storage?.getItem?.(key);
        return value == null ? fallback : value;
    } catch (error) {
        console.warn('[Storage] Read unavailable:', key, error?.message || error);
        return fallback;
    }
}

function safeStorageSet(storage, key, value) {
    try {
        storage?.setItem?.(key, value);
        return true;
    } catch (error) {
        console.warn('[Storage] Write unavailable:', key, error?.message || error);
        return false;
    }
}

function safeStorageRemove(storage, key) {
    try {
        storage?.removeItem?.(key);
        return true;
    } catch (error) {
        console.warn('[Storage] Remove unavailable:', key, error?.message || error);
        return false;
    }
}

// Theme
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const iconTheme = themeToggle?.querySelector('i') || null;

const savedTheme = safeStorageGet(localStorage, 'theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const reducedThemeMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function syncBrowserThemeColor() {
    const isDark = body.getAttribute('data-theme') === 'dark';
    themeColorMeta?.setAttribute('content', isDark ? '#0b1730' : '#f5f8fe');
}

function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    if (dark) body.setAttribute('data-theme', 'dark');
    else body.removeAttribute('data-theme');
    iconTheme?.classList.toggle('fa-sun', dark);
    iconTheme?.classList.toggle('fa-moon', !dark);
    if (persist) safeStorageSet(localStorage, 'theme', dark ? 'dark' : 'light');
    syncBrowserThemeColor();
}

applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light', false);

themeToggle?.addEventListener('click', () => {
    const root = document.documentElement;
    const nextTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const commit = () => applyTheme(nextTheme, true);

    // V46: use a soft full-frame dissolve instead of the hard circular wipe.
    // The snapshot transition prevents dozens of components from animating at
    // slightly different speeds, which was the main source of the visual shock.
    if (typeof document.startViewTransition === 'function' && !reducedThemeMotion) {
        root.classList.add('v46-theme-transition');
        themeToggle.setAttribute('aria-busy', 'true');

        const transition = document.startViewTransition(commit);
        transition.finished.catch(() => {}).finally(() => {
            root.classList.remove('v46-theme-transition');
            themeToggle.removeAttribute('aria-busy');
        });
        return;
    }

    // Smooth fallback for Safari/older browsers.
    root.classList.add('v46-theme-fallback');
    commit();
    window.setTimeout(() => root.classList.remove('v46-theme-fallback'), 620);
});

// Scroll actions
const scrollTopBtn = document.getElementById('scrollTopBtn');
const updateScrollTopVisibility = () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 300) scrollTopBtn.classList.add('show');
    else scrollTopBtn.classList.remove('show');
};
window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
updateScrollTopVisibility();

function formatDisplayDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }) + ' • ' + date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[s]);
}

function setInlineMessage(id, text, type='') {
    const el = document.getElementById(id); if (!el) return;
    el.textContent=text; el.className='inline-message' + (type ? ' '+type : '');
}


/* ===== MODULE: motion.js ===== */
/* =========================================================
   NATIVE MOTION & HERO PHRASE — V24
   Lightweight replacement for AOS + old character-by-character typing.
   ========================================================= */
(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const constrainedMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 3);
    const perfLite = reducedMotion || saveData || constrainedMemory;

    if (perfLite) root.classList.add('perf-lite');

    // Tailwind/React owns ambient decoration and scroll progress in v6.
    // Keep this module focused on reveal hooks and the hero phrase rotator.

    const presets = {
        'fade-up':    { x: 0,   y: 18, scale: 1 },
        'fade-down':  { x: 0,   y: -14, scale: 1 },
        'fade-left':  { x: 18,  y: 0, scale: 1 },
        'fade-right': { x: -18, y: 0, scale: 1 },
        'zoom-in':    { x: 0,   y: 8, scale: .975 }
    };

    const bound = new WeakSet();
    let observer = null;

    function revealImmediately(el) {
        el.classList.remove('motion-pending', 'motion-animating');
    }

    function playReveal(el) {
        if (perfLite || typeof el.animate !== 'function') {
            revealImmediately(el);
            return;
        }

        const preset = presets[el.dataset.aos] || presets['fade-up'];
        const delay = Math.min(Math.max(Number(el.dataset.aosDelay) || 0, 0), 240);
        const duration = Math.min(Math.max(Number(el.dataset.aosDuration) || 520, 260), 720);
        const startTransform = `translate3d(${preset.x}px, ${preset.y}px, 0) scale(${preset.scale})`;

        el.classList.add('motion-animating');
        const animation = el.animate(
            [
                { opacity: 0, transform: startTransform },
                { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
            ],
            {
                duration,
                delay,
                easing: 'cubic-bezier(.22,1,.36,1)',
                fill: 'backwards'
            }
        );

        /* WAAPI owns the visual state as soon as animation starts. */
        el.classList.remove('motion-pending');
        animation.finished.catch(() => {}).finally(() => {
            el.classList.remove('motion-animating');
        });
    }

    if (!perfLite && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                playReveal(entry.target);
            });
        }, {
            rootMargin: '0px 0px -7% 0px',
            threshold: 0.08
        });
    }

    function bindMotionElement(el) {
        if (!(el instanceof Element) || bound.has(el) || !el.matches('[data-aos]')) return;
        bound.add(el);

        // Hero has its own V31 entry choreography; avoid stacking two reveal systems.
        if (el.closest('header')) {
            revealImmediately(el);
            return;
        }

        if (perfLite || !observer) {
            revealImmediately(el);
            return;
        }

        el.classList.add('motion-pending');
        observer.observe(el);
    }

    document.querySelectorAll('[data-aos]').forEach(bindMotionElement);

    /* Announcement cards and a few admin blocks are generated later. */
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                bindMotionElement(node);
                node.querySelectorAll?.('[data-aos]').forEach(bindMotionElement);
            });
        });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    /* Replaces dozens of per-character timers with one phrase transition.
       The fixed-height #typing-text box prevents all layout movement. */
    const heroText = document.getElementById('typing-text');
    const phrases = [
        'Aspiratif • Inovatif • Kolaboratif • Islami',
        'Membangun Generasi Unggul & Berkarakter',
        'Bersama OSIS, Kita Wujudkan Perubahan Positif!'
    ];

    if (!heroText) return;
    heroText.textContent = phrases[0];
    if (perfLite) return;

    let phraseIndex = 0;
    let phraseTimer = null;

    const schedulePhrase = () => {
        window.clearTimeout(phraseTimer);
        phraseTimer = window.setTimeout(rotatePhrase, 3900);
    };

    const rotatePhrase = async () => {
        if (document.hidden) {
            schedulePhrase();
            return;
        }

        try {
            await heroText.animate(
                [
                    { opacity: 1, transform: 'translate3d(0,0,0)' },
                    { opacity: 0, transform: 'translate3d(0,-5px,0)' }
                ],
                { duration: 160, easing: 'ease-out', fill: 'forwards' }
            ).finished;
        } catch (_) {}

        phraseIndex = (phraseIndex + 1) % phrases.length;
        heroText.textContent = phrases[phraseIndex];

        try {
            await heroText.animate(
                [
                    { opacity: 0, transform: 'translate3d(0,6px,0)' },
                    { opacity: 1, transform: 'translate3d(0,0,0)' }
                ],
                { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
            ).finished;
        } catch (_) {}

        /* Clear WAAPI fill so CSS/theme states remain authoritative. */
        heroText.getAnimations().forEach((animation) => animation.cancel());
        schedulePhrase();
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && document.body.classList.contains('v40-hero-live')) schedulePhrase();
    });

    const beginHeroPhraseRotation = () => {
        window.clearTimeout(phraseTimer);
        phraseTimer = window.setTimeout(rotatePhrase, 3200);
    };

    if (document.body.classList.contains('v40-hero-live') || !document.getElementById('v42-loader')) {
        beginHeroPhraseRotation();
    } else {
        document.addEventListener('osis:hero-live', beginHeroPhraseRotation, { once: true });
    }
})();


/* ===== MODULE: experience.js ===== */
/* =========================================================
   OSIS CINEMATIC EXPERIENCE — V31
   Progressive enhancement for depth, active navigation,
   spotlight cards, magnetic controls, and data micro-motion.
   ========================================================= */
(() => {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const constrainedMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 3);
    const perfLite = reducedMotion || saveData || constrainedMemory || root.classList.contains('perf-lite');

    // One-shot first paint class. CSS handles the sequence without JS timers per element.
    if (!reducedMotion) {
        body.classList.add('experience-boot-v31');
        window.setTimeout(() => {
            body.classList.remove('experience-boot-v31');
            body.classList.add('experience-ready-v31');
        }, 1300);
    }

    const header = document.querySelector('header');
    // V39 keeps the real school photograph clean. The former grid/sheen
    // overlays are intentionally retired; card/intersection motion below remains active.

    // Hero pointer parallax. Values are intentionally clamped and lerped.
    if (header && finePointer && !perfLite) {
        let frame = 0;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const renderHeroDepth = () => {
            frame = 0;
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;
            header.style.setProperty('--hero-x', `${currentX.toFixed(2)}px`);
            header.style.setProperty('--hero-y', `${currentY.toFixed(2)}px`);
            header.style.setProperty('--hero-rx', `${(-currentY * 0.035).toFixed(2)}deg`);
            header.style.setProperty('--hero-ry', `${(currentX * 0.035).toFixed(2)}deg`);

            if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
                frame = requestAnimationFrame(renderHeroDepth);
            }
        };

        const scheduleHeroDepth = () => {
            if (!frame) frame = requestAnimationFrame(renderHeroDepth);
        };

        header.addEventListener('pointermove', (event) => {
            const rect = header.getBoundingClientRect();
            const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
            const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
            targetX = Math.max(-15, Math.min(15, x * 30));
            targetY = Math.max(-11, Math.min(11, y * 22));
            scheduleHeroDepth();
        }, { passive: true });

        header.addEventListener('pointerleave', () => {
            targetX = 0;
            targetY = 0;
            scheduleHeroDepth();
        }, { passive: true });
    }

    // Card spotlight + subtle perspective. Excludes forms and full dashboard shells.
    const cardSelector = [
        '.leadership-card-v12',
        '.board-support-card-v12',
        '.division-card-v12',
        '#visi-misi .card-box',
        '#proker .card-box',
        '#pengumuman .card-box',
        '.contact-card-v13',
        '.social-hub-v13',
        '.gallery-item'
    ].join(',');

    const decorateCard = (card) => {
        if (!(card instanceof Element) || !card.matches(cardSelector)) return;
        card.classList.add('experience-card-v31');
    };

    document.querySelectorAll(cardSelector).forEach(decorateCard);

    // Gallery and announcement cards can be created after initial load.
    const dynamicCardObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                decorateCard(node);
                node.querySelectorAll?.(cardSelector).forEach(decorateCard);
            });
        });
    });
    dynamicCardObserver.observe(document.body, { childList: true, subtree: true });

    if (finePointer && !perfLite) {
        let activeCard = null;
        let cardFrame = 0;
        let cardState = null;

        const resetCard = (card) => {
            if (!card) return;
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
            card.style.setProperty('--spot-x', '50%');
            card.style.setProperty('--spot-y', '50%');
        };

        const paintCard = () => {
            cardFrame = 0;
            if (!activeCard || !cardState) return;
            activeCard.style.setProperty('--spot-x', `${cardState.px.toFixed(1)}%`);
            activeCard.style.setProperty('--spot-y', `${cardState.py.toFixed(1)}%`);
            activeCard.style.setProperty('--tilt-x', `${cardState.tiltX.toFixed(2)}deg`);
            activeCard.style.setProperty('--tilt-y', `${cardState.tiltY.toFixed(2)}deg`);
        };

        document.addEventListener('pointermove', (event) => {
            const card = event.target instanceof Element ? event.target.closest(cardSelector) : null;
            if (card !== activeCard) {
                resetCard(activeCard);
                activeCard = card;
                cardState = null;
            }
            if (!activeCard) return;

            decorateCard(activeCard);
            const rect = activeCard.getBoundingClientRect();
            const nx = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
            const ny = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1)));
            cardState = {
                px: nx * 100,
                py: ny * 100,
                tiltY: (nx - 0.5) * 2.2,
                tiltX: (0.5 - ny) * 1.8
            };
            if (!cardFrame) cardFrame = requestAnimationFrame(paintCard);
        }, { passive: true });

        document.addEventListener('pointerout', (event) => {
            if (!activeCard) return;
            const next = event.relatedTarget;
            if (next instanceof Node && activeCard.contains(next)) return;
            resetCard(activeCard);
            activeCard = null;
            cardState = null;
        }, { passive: true });
    }

    // Magnetic movement is kept tiny so controls still feel precise.
    const magneticSelector = [
        '.hero-btn',
        '.aspirasi-btn',
        '.contact-action-v13',
        '.float-btn'
    ].join(',');
    const magneticItems = [...document.querySelectorAll(magneticSelector)];
    magneticItems.forEach((item) => item.classList.add('experience-magnetic-v31'));

    if (finePointer && !perfLite) {
        magneticItems.forEach((item) => {
            item.addEventListener('pointermove', (event) => {
                const rect = item.getBoundingClientRect();
                const dx = event.clientX - (rect.left + rect.width / 2);
                const dy = event.clientY - (rect.top + rect.height / 2);
                item.style.setProperty('--mag-x', `${Math.max(-4, Math.min(4, dx * 0.07)).toFixed(2)}px`);
                item.style.setProperty('--mag-y', `${Math.max(-3, Math.min(3, dy * 0.07)).toFixed(2)}px`);
            }, { passive: true });
            item.addEventListener('pointerleave', () => {
                item.style.setProperty('--mag-x', '0px');
                item.style.setProperty('--mag-y', '0px');
            }, { passive: true });
        });
    }

    // Section rule animation. Uses one observer for all headings.
    const sectionTitles = [...document.querySelectorAll('.section-title')];
    if ('IntersectionObserver' in window && !reducedMotion) {
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-seen-v31');
                titleObserver.unobserve(entry.target);
            });
        }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
        sectionTitles.forEach((title) => titleObserver.observe(title));
    } else {
        sectionTitles.forEach((title) => title.classList.add('is-seen-v31'));
    }

    // Active nav state follows the section currently occupying the reading area.
    const sectionIds = ['struktur', 'visi-misi', 'proker', 'pengumuman', 'galeri', 'kritik-saran', 'kontak'];
    const navLinks = new Map();
    sectionIds.forEach((id) => {
        const link = document.querySelector(`nav .nav-links a[href="#${id}"]`);
        if (link) navLinks.set(id, link);
    });

    if ('IntersectionObserver' in window && navLinks.size) {
        let activeId = '';
        const sectionObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (!visible.length) return;
            const id = visible[0].target.id;
            if (!id || id === activeId) return;
            activeId = id;
            navLinks.forEach((link, key) => {
                const active = key === activeId;
                link.classList.toggle('is-active-v31', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-24% 0px -58% 0px', threshold: [0.01, 0.18, 0.4] });
        sectionIds.forEach((id) => {
            const section = document.getElementById(id);
            if (section) sectionObserver.observe(section);
        });
    }

    // Countdown digits receive motion only when their displayed value changes.
    const countdownIds = ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'];
    if (!reducedMotion && 'MutationObserver' in window) {
        countdownIds.forEach((id) => {
            const digit = document.getElementById(id);
            if (!digit) return;
            let previous = digit.textContent;
            const observer = new MutationObserver(() => {
                const current = digit.textContent;
                if (current === previous) return;
                previous = current;
                digit.classList.remove('tick-v31');
                void digit.offsetWidth;
                digit.classList.add('tick-v31');
            });
            observer.observe(digit, { childList: true, characterData: true, subtree: true });
        });
    }
})();


/* ===== MODULE: experience-v33.js ===== */
/* =========================================================
   OSIS MOTION SYSTEM — V33 TEXT-SAFE
   Canvas constellation, branded intro, hero choreography,
   scroll chapters, chapter rail, ripple feedback, and parallax.
   ========================================================= */
(() => {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const constrainedMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 3);
    const smallScreen = window.matchMedia('(max-width: 767.98px)').matches;
    const perfLite = reducedMotion || saveData || constrainedMemory || smallScreen || root.classList.contains('perf-lite');

    if (smallScreen) root.classList.add('mobile-experience-v45');
    root.classList.add('motion-v33');

    const sectionMeta = [
        ['struktur', '01 / Struktur'],
        ['visi-misi', '02 / Arah'],
        ['proker', '03 / Program'],
        ['pengumuman', '04 / Agenda'],
        ['galeri', '05 / Dokumentasi'],
        ['kritik-saran', '06 / Aspirasi'],
        ['kontak', '07 / Kontak']
    ];

    /* ---------- Opening sequence ---------- */
    // V38 owns the cinematic curtain loader. The older one-shot shutter is intentionally disabled
    // so two preloaders never compete for focus or animation timing.

    /* ---------- Hero scene ---------- */
    const header = document.querySelector('header');
    if (header) {
        const bg = document.createElement('div');
        bg.className = 'hero-bg-v32';
        bg.setAttribute('aria-hidden', 'true');
        header.prepend(bg);

        // V39 deliberately leaves the school photograph unobstructed.
        // Legacy hero orbits and scan lines are no longer injected.

        const cue = document.createElement('div');
        cue.className = 'hero-scroll-cue-v32';
        cue.setAttribute('aria-hidden', 'true');
        cue.innerHTML = '<span>Jelajahi</span><span class="hero-scroll-line-v32"></span>';
        header.appendChild(cue);

        // V33 text-safe rule: never split or rewrite visible copy for animation.
        // The complete heading stays as a single text node so wrapping remains native
        // and identical across desktop/mobile/font-loading states.
        const title = header.querySelector('h1');
        if (title) title.classList.add('hero-title-safe-v33');
    }

    /* ---------- Scene chapter metadata ---------- */
    const scenes = [];
    sectionMeta.forEach(([id, label], index) => {
        const section = document.getElementById(id);
        if (!section) return;
        section.classList.add('motion-scene-v32');
        section.dataset.sceneIndexV32 = String(index);

        // Keep editorial copy untouched. Chapter labels live only in navigation UI,
        // not inside section headings, so the content layout cannot shift unexpectedly.

        if (!perfLite) {
            const orb = document.createElement('span');
            orb.className = 'scene-orb-v32';
            orb.setAttribute('aria-hidden', 'true');
            section.prepend(orb);
        }

        scenes.push(section);
    });

    /* ---------- Chapter activation + one-shot card sheen ---------- */
    const sheenTargets = [
        '.leadership-card-v12',
        '.board-support-card-v12',
        '.division-card-v12',
        '#visi-misi .card-box',
        '#proker .card-box',
        '#pengumuman .card-box',
        '.contact-card-v13',
        '.social-hub-v13',
        '.gallery-item'
    ].join(',');

    const addArrivalSheen = (card) => {
        if (perfLite || !(card instanceof Element) || card.classList.contains('card-arrived-v32')) return;
        card.classList.add('card-arrived-v32');
        const sheen = document.createElement('span');
        sheen.className = 'card-arrival-sheen-v32';
        sheen.setAttribute('aria-hidden', 'true');
        card.appendChild(sheen);
        window.setTimeout(() => sheen.remove(), 1450);
    };

    if ('IntersectionObserver' in window) {
        const sceneObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('scene-active-v32', entry.isIntersecting);
            });
        }, { threshold: 0.16, rootMargin: '-8% 0px -16% 0px' });
        scenes.forEach((scene) => sceneObserver.observe(scene));

        if (!perfLite) {
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    cardObserver.unobserve(entry.target);
                    addArrivalSheen(entry.target);
                });
            }, { threshold: 0.28, rootMargin: '0px 0px -6% 0px' });
            document.querySelectorAll(sheenTargets).forEach((el) => cardObserver.observe(el));

            const dynamicObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    if (node.matches?.(sheenTargets)) cardObserver.observe(node);
                    node.querySelectorAll?.(sheenTargets).forEach((el) => cardObserver.observe(el));
                }));
            });
            dynamicObserver.observe(document.body, { childList: true, subtree: true });
        }
    } else {
        scenes.forEach((scene) => scene.classList.add('scene-active-v32'));
    }

    /* ---------- Chapter rail ---------- */
    // V39 removes the legacy chapter-dot rail. It used a <nav> element and
    // collided with global navbar selectors in V37/V38, producing the giant pill UI.
    const railDots = [];

    /* ---------- Scroll-linked chapter drift + nav compression ---------- */
    const mainNav = document.querySelector('#root > nav');
    let scrollFrame = 0;
    const updateScrollMotion = () => {
        scrollFrame = 0;
        const viewportH = Math.max(window.innerHeight, 1);
        mainNav?.classList.toggle('is-scrolled-v32', window.scrollY > 48);

        let closestSceneIndex = -1;
        let closestDistance = Infinity;

        scenes.forEach((scene, index) => {
            const rect = scene.getBoundingClientRect();
            const center = rect.top + rect.height * .5;
            const delta = center - viewportH * .5;
            const distance = Math.abs(delta);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestSceneIndex = index;
            }
            if (!perfLite && rect.bottom > -120 && rect.top < viewportH + 120) {
                const normalized = Math.max(-1, Math.min(1, delta / viewportH));
                scene.style.setProperty('--scene-shift-v32', `${(normalized * -34).toFixed(1)}px`);
            }
        });

        railDots.forEach((dot, index) => dot.classList.toggle('is-active', index === closestSceneIndex));
    };

    const scheduleScrollMotion = () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
    };
    window.addEventListener('scroll', scheduleScrollMotion, { passive: true });
    window.addEventListener('resize', scheduleScrollMotion, { passive: true });
    scheduleScrollMotion();

    /* ---------- Pointer aura ---------- */
    if (finePointer && !perfLite) {
        const aura = document.createElement('div');
        aura.className = 'pointer-aura-v32';
        aura.setAttribute('aria-hidden', 'true');
        body.appendChild(aura);
        let auraFrame = 0;
        let tx = -500;
        let ty = -500;
        let cx = -500;
        let cy = -500;
        const paintAura = () => {
            auraFrame = 0;
            cx += (tx - cx) * .16;
            cy += (ty - cy) * .16;
            aura.style.setProperty('--pointer-x', `${cx.toFixed(1)}px`);
            aura.style.setProperty('--pointer-y', `${cy.toFixed(1)}px`);
            if (Math.abs(tx - cx) > .15 || Math.abs(ty - cy) > .15) auraFrame = requestAnimationFrame(paintAura);
        };
        document.addEventListener('pointermove', (event) => {
            tx = event.clientX;
            ty = event.clientY;
            aura.classList.add('is-active');
            if (!auraFrame) auraFrame = requestAnimationFrame(paintAura);
        }, { passive: true });
        document.addEventListener('pointerleave', () => aura.classList.remove('is-active'));
    }

    /* ---------- Ripple feedback ---------- */
    if (!reducedMotion) {
        const rippleSelector = '.hero-btn, .aspirasi-btn, .contact-action-v13, .float-btn, .dashboard-utility-btn-v9, .tab-button, .secondary-action';
        document.addEventListener('pointerdown', (event) => {
            const host = event.target instanceof Element ? event.target.closest(rippleSelector) : null;
            if (!host) return;
            host.classList.add('motion-ripple-host-v32');
            const rect = host.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'motion-ripple-v32';
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            host.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 700);
        });
    }

    /* ---------- Canvas constellation: "collaboration network" ---------- */
    if (!perfLite && 'HTMLCanvasElement' in window) {
        const canvas = document.createElement('canvas');
        canvas.className = 'motion-canvas-v32';
        canvas.setAttribute('aria-hidden', 'true');
        body.prepend(canvas);
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let particles = [];
        let animationId = 0;
        let lastFrame = 0;
        let pointerX = -9999;
        let pointerY = -9999;
        let visible = !document.hidden;

        const makeParticle = () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - .5) * .16,
            vy: (Math.random() - .5) * .16,
            r: .7 + Math.random() * 1.45,
            phase: Math.random() * Math.PI * 2,
            warm: Math.random() > .84
        });

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.max(22, Math.min(width < 768 ? 28 : 56, Math.round((width * height) / 26000)));
            particles = Array.from({ length: count }, makeParticle);
        };

        const themeColors = () => {
            const dark = root.getAttribute('data-theme') === 'dark';
            return dark
                ? { dot: 'rgba(147,197,253,.52)', warm: 'rgba(251,191,36,.48)', line: 'rgba(96,165,250,.095)' }
                : { dot: 'rgba(37,99,235,.24)', warm: 'rgba(245,158,11,.27)', line: 'rgba(37,99,235,.055)' };
        };

        const draw = (time) => {
            animationId = 0;
            if (!visible) return;
            if (time - lastFrame < 32) {
                animationId = requestAnimationFrame(draw);
                return;
            }
            lastFrame = time;
            const colors = themeColors();
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                const dx = p.x - pointerX;
                const dy = p.y - pointerY;
                const distSq = dx * dx + dy * dy;
                if (distSq < 26000 && distSq > 1) {
                    const inv = 1 / Math.sqrt(distSq);
                    const force = (1 - distSq / 26000) * .018;
                    p.vx += dx * inv * force;
                    p.vy += dy * inv * force;
                }

                p.vx *= .996;
                p.vy *= .996;
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                if (p.y > height + 10) p.y = -10;
            });

            const threshold = width < 768 ? 96 : 126;
            const thresholdSq = threshold * threshold;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dsq = dx * dx + dy * dy;
                    if (dsq > thresholdSq) continue;
                    const alpha = 1 - dsq / thresholdSq;
                    ctx.strokeStyle = colors.line.replace(/\.\d+\)$/, `${(.018 + alpha * .09).toFixed(3)})`);
                    ctx.lineWidth = .7;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            particles.forEach((p) => {
                const pulse = .72 + Math.sin(time * .0012 + p.phase) * .18;
                ctx.globalAlpha = pulse;
                ctx.fillStyle = p.warm ? colors.warm : colors.dot;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            animationId = requestAnimationFrame(draw);
        };

        const startCanvas = () => {
            if (!animationId && visible) animationId = requestAnimationFrame(draw);
        };

        resize();
        startCanvas();
        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(resize, 180);
        }, { passive: true });
        if (finePointer) {
            document.addEventListener('pointermove', (event) => {
                pointerX = event.clientX;
                pointerY = event.clientY;
            }, { passive: true });
            document.addEventListener('pointerleave', () => {
                pointerX = -9999;
                pointerY = -9999;
            });
        }
        document.addEventListener('visibilitychange', () => {
            visible = !document.hidden;
            if (!visible && animationId) {
                cancelAnimationFrame(animationId);
                animationId = 0;
            } else {
                lastFrame = 0;
                startCanvas();
            }
        });
    }
})();


/* ===== MODULE: aspirasi.js ===== */
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

const adminWorkspaceModal = document.getElementById('adminWorkspaceModal');
const ADMIN_WORKSPACE_KEY = 'osis_admin_workspace_v1';
const ADMIN_WORKSPACES = {
    general: {
        label: 'Dashboard Umum',
        tab: 'aspirations',
        greeting: 'Ringkasan aktivitas dan akses cepat pengelolaan website.'
    },
    leadership: {
        label: 'Ketua & Wakil',
        tab: 'aspirations',
        greeting: 'Workspace Ketua & Wakil · pantau aspirasi dan koordinasi seluruh program.'
    },
    secretariat: {
        label: 'Sekretaris',
        tab: 'announcements',
        greeting: 'Workspace Sekretaris · kelola pengumuman, agenda, dan informasi resmi.'
    },
    treasury: {
        label: 'Bendahara',
        tab: 'event',
        greeting: 'Workspace Bendahara · pantau agenda kegiatan dan kebutuhan administrasi.'
    },
    humas: {
        label: 'Divisi Humas',
        tab: 'gallery',
        greeting: 'Workspace Humas · fokus dokumentasi, galeri, dan publikasi kegiatan.'
    },
    ibadah: {
        label: 'Divisi Ibadah / Keagamaan',
        tab: 'event',
        greeting: 'Workspace Divisi Ibadah / Keagamaan · fokus agenda, informasi program keagamaan, dan pencatatan pembinaan.'
    },
    bahasa: {
        label: 'Divisi Bahasa',
        tab: 'announcements',
        greeting: 'Workspace Divisi Bahasa · fokus informasi dan publikasi program kebahasaan.'
    }
};

const ADMIN_WORKSPACE_ALLOWED_TABS = {
    general: ['aspirations', 'announcements', 'event', 'gallery', 'notifications', 'security', 'backup', 'qr'],
    leadership: ['aspirations', 'announcements', 'event', 'gallery', 'notifications', 'security'],
    secretariat: ['announcements', 'event', 'security'],
    treasury: ['event', 'security'],
    humas: ['gallery', 'announcements', 'notifications', 'security'],
    ibadah: ['event', 'security'],
    bahasa: ['announcements', 'event', 'security']
};

function applyAdminWorkspaceTabVisibility(workspaceKey) {
    const allowed = new Set(ADMIN_WORKSPACE_ALLOWED_TABS[workspaceKey] || ADMIN_WORKSPACE_ALLOWED_TABS.general);
    document.querySelectorAll('.dashboard-nav-v14 .tab-button[data-tab], .dashboard-tabs .tab-button[data-tab]').forEach((button) => {
        button.hidden = !allowed.has(button.dataset.tab || '');
    });
    document.querySelectorAll('.dashboard-panel[data-panel]').forEach((panel) => {
        const permitted = allowed.has(panel.dataset.panel || '');
        panel.hidden = !permitted;
        if (!permitted) panel.classList.remove('active');
    });
}

function getAdminWorkspace() {
    try {
        const value = safeStorageGet(sessionStorage, ADMIN_WORKSPACE_KEY) || '';
        return ADMIN_WORKSPACES[value] ? value : '';
    } catch (error) {
        return '';
    }
}

function ensureAdminWorkspaceSwitcher() {
    const host = document.querySelector('.dashboard-session-actions-v9');
    if (!host || document.getElementById('changeAdminWorkspaceBtnV43')) return;
    const button = document.createElement('button');
    button.className = 'dashboard-utility-btn-v9 admin-workspace-switcher-v43';
    button.id = 'changeAdminWorkspaceBtnV43';
    button.type = 'button';
    button.innerHTML = '<i aria-hidden="true" class="fa-solid fa-layer-group"></i><span>Ganti Divisi</span>';
    button.addEventListener('click', () => showAdminWorkspaceChooser({ force: true }));
    host.prepend(button);
}

function applyAdminWorkspace(workspaceKey, { navigate = true } = {}) {
    const key = ADMIN_WORKSPACES[workspaceKey] ? workspaceKey : 'general';
    const config = ADMIN_WORKSPACES[key];
    try { safeStorageSet(sessionStorage, ADMIN_WORKSPACE_KEY, key); } catch (error) {}
    document.body.dataset.adminWorkspace = key;

    const greeting = document.getElementById('dashboardGreetingV12');
    if (greeting) greeting.textContent = config.greeting;

    let chip = document.getElementById('adminWorkspaceChipV43');
    const chipHost = document.querySelector('.dashboard-head-badges');
    if (chipHost && !chip) {
        chip = document.createElement('span');
        chip.id = 'adminWorkspaceChipV43';
        chip.className = 'admin-workspace-chip-v43';
        chipHost.appendChild(chip);
    }
    if (chip) chip.innerHTML = `<i aria-hidden="true" class="fa-solid fa-layer-group"></i> ${escapeHtml(config.label)}`;

    ensureAdminWorkspaceSwitcher();
    applyAdminWorkspaceTabVisibility(key);
    if (typeof switchOsisTab === 'function') switchOsisTab(config.tab);

    if (adminWorkspaceModal) {
        adminWorkspaceModal.style.display = 'none';
        adminWorkspaceModal.setAttribute('aria-hidden', 'true');
    }

    window.dispatchEvent(new CustomEvent('osis:workspace-change', {
        detail: { key, label: config.label, tab: config.tab }
    }));

    if (navigate) {
        const url = new URL(window.location.href);
        const alreadyDashboard = url.searchParams.get('view') === 'dashboard';
        url.searchParams.set('view', 'dashboard');
        url.searchParams.set('role', key);
        url.hash = '';
        const routeState = { view: 'dashboard', role: key };
        if (alreadyDashboard) history.replaceState(routeState, '', url);
        else history.pushState(routeState, '', url);
        window.dispatchEvent(new CustomEvent('osis:route-change', {
            detail: routeState
        }));
        window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
    }

    showAppToast(`Workspace ${config.label} aktif.`);
}

function showAdminWorkspaceChooser({ force = false } = {}) {
    if (!adminWorkspaceModal) {
        applyAdminWorkspace(getAdminWorkspace() || 'general');
        return;
    }
    // A fresh login always asks the user to choose. Reopening Area OSIS while
    // already authenticated also makes changing division explicit and simple.
    if (!force) {
        const previous = getAdminWorkspace();
        if (previous) document.body.dataset.adminWorkspace = previous;
    }
    adminWorkspaceModal.style.display = 'flex';
    adminWorkspaceModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => adminWorkspaceModal.querySelector('[data-admin-workspace]')?.focus({ preventScroll: true }));
}

adminWorkspaceModal?.querySelectorAll('[data-admin-workspace]').forEach(button => {
    button.addEventListener('click', () => applyAdminWorkspace(button.dataset.adminWorkspace || 'general'));
});

window.showAdminWorkspaceChooser = showAdminWorkspaceChooser;
window.applyAdminWorkspace = applyAdminWorkspace;
window.applyAdminWorkspaceTabVisibility = applyAdminWorkspaceTabVisibility;

// =============================================================
// ASPIRASI API v2 — Google Apps Script / Google Sheets
// GANTI URL DI BAWAH INI DENGAN WEB APP URL YANG BERAKHIR /exec
// =============================================================
const ASPIRASI_API_URL = window.OSIS_ASPIRASI_CONFIG?.appsScriptUrl || '';
const ASPIRASI_SESSION_KEY = 'osis_aspirasi_admin_session_v2';
const ASPIRASI_REQUEST_TIMEOUT_MS = 25000;
const TRUSTED_DEVICE_STORAGE_KEY = 'osis_trusted_device_v1';

let aspirasiRemoteCache = [];
let aspirasiAdminToken = safeStorageGet(sessionStorage, ASPIRASI_SESSION_KEY) || '';
let aspirasiRemoteLoading = false;
let aspirasiRemotePromise = null;

// ID acak lokal untuk rate-limit dasar di backend. Ini bukan identitas siswa
// dan tidak dikirim ke layanan selain backend OSIS.
const OSIS_CLIENT_ID_KEY = 'osis_client_id_v1';

function getOsisClientId() {
    try {
        let value = safeStorageGet(localStorage, OSIS_CLIENT_ID_KEY) || '';
        if (!/^[A-Za-z0-9_-]{16,80}$/.test(value)) {
            value = (globalThis.crypto?.randomUUID?.() ||
                ('c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)))
                .replace(/[^A-Za-z0-9_-]/g, '')
                .slice(0, 80);
            safeStorageSet(localStorage, OSIS_CLIENT_ID_KEY, value);
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
        const parsed = JSON.parse(safeStorageGet(localStorage, TRUSTED_DEVICE_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.token || !parsed.deviceId) return null;
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
            safeStorageRemove(localStorage, TRUSTED_DEVICE_STORAGE_KEY);
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
        safeStorageSet(localStorage, TRUSTED_DEVICE_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('[Auth] Gagal menyimpan perangkat tepercaya:', error.message);
    }
}

function clearTrustedDeviceCredentials() {
    try {
        safeStorageRemove(localStorage, TRUSTED_DEVICE_STORAGE_KEY);
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
        safeStorageSet(sessionStorage, 
            ASPIRASI_SESSION_KEY,
            aspirasiAdminToken
        );
    } else {
        safeStorageRemove(sessionStorage, 
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
    tbody.innerHTML = `<tr><td colspan="9" class="osis-table-state-cell"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>&nbsp; ${escapeHtml(message)}</td></tr>`;
}

function showAspirasiTableError(message) {
    const tbody = document.getElementById('osisTbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" class="osis-table-state-cell"><strong>Data aspirasi belum dapat dimuat.</strong><br><br>${escapeHtml(message || 'Terjadi kesalahan.')}</td></tr>`;
}

async function refreshAspirasiFromServer({ showLoading = true } = {}) {
    if (!aspirasiAdminToken) throw new Error('Sesi admin belum tersedia. Silakan login kembali.');
    if (aspirasiRemotePromise) return aspirasiRemotePromise;

    aspirasiRemoteLoading = true;
    if (showLoading) showAspirasiTableLoading();

    aspirasiRemotePromise = (async () => {
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
            aspirasiRemotePromise = null;
        }
    })();

    return aspirasiRemotePromise;
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
        const stored = JSON.parse(safeStorageGet(localStorage, LOGIN_GUARD_STORAGE_KEY) || 'null');
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
    safeStorageSet(localStorage, LOGIN_GUARD_STORAGE_KEY, JSON.stringify(guard));
}

function resetLoginGuard() {
    safeStorageRemove(localStorage, LOGIN_GUARD_STORAGE_KEY);
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
    showAdminWorkspaceChooser();
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
    if (!modal || !osisArea || !passwordInput || !errorMsg || !loginSubmitBtn) {
        console.error('[Auth] Markup login tidak lengkap.');
        showAppToast('Area OSIS belum siap. Muat ulang halaman.');
        return;
    }
    if (osisArea.style.display === 'block') {
        showAdminWorkspaceChooser({ force: true });
        return;
    }
    modal.style.display = 'flex';
    window.closeMobileNav?.();
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
    if (!modal || !passwordInput || !errorMsg) return;
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
    if (!passwordInput || !errorMsg || !loginSubmitBtn || !osisArea) {
        showAppToast('Komponen login tidak lengkap. Muat ulang halaman.');
        return;
    }
    if (isLoginLocked()) {
        startLoginLockoutCountdown();
        return;
    }

    const typed = passwordInput.value;
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
                errorMsg.textContent = `Password ditolak backend. Sisa percobaan: ${guardResult.remainingAttempts}. Jika backend baru dipindah/diganti, pastikan setupAdminPassword() sudah dijalankan pada project Apps Script yang sedang di-deploy.`;
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

window.toggleLoginPasswordVisibility = toggleLoginPasswordVisibility;

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

function closeAspSuccess() { if (aspSuccessModal) aspSuccessModal.style.display = 'none'; }

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

    const idInput = document.getElementById('asp-detail-id');
    const categorySelect = document.getElementById('asp-detail-category');
    const prioritySelect = document.getElementById('asp-detail-priority');
    const statusSelect = document.getElementById('asp-detail-status');
    const noteInput = document.getElementById('asp-detail-note');
    const identity = document.getElementById('aspDetailIdentity');
    const detailModal = document.getElementById('aspDetailModal');

    if (!idInput || !categorySelect || !prioritySelect || !statusSelect || !noteInput || !identity || !detailModal) {
        console.error('[Aspirasi] Markup detail tidak lengkap.');
        showAppToast('Detail aspirasi belum dapat dibuka. Muat ulang halaman.');
        return;
    }

    idInput.value = item.id;
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
    prioritySelect.value = item.priority || 'normal';
    statusSelect.value = item.status || 'unread';
    noteInput.value = item.internalNote || '';
    identity.textContent = `${item.name || 'Anonim'} • ${getAspirationSenderType(item.kelas)} • ${formatDisplayDateTime(item.timestamp)}`;
    detailModal.style.display = 'flex';
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


/* ===== MODULE: push.js ===== */
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

function updatePushPreferenceSummaryV16() {
    const summary = document.getElementById('pushPrefSummaryV16');
    if (!summary) return;
    const prefs = readPushPreferences();
    const active = Object.values(prefs).filter(Boolean).length;
    summary.textContent = active === 5 ? '5 kategori aktif' : `${active} dari 5 aktif`;
}

function syncPushPrefsDisclosureV16() {
    const details = document.getElementById('pushPrefDetailsV16');
    if (!details || details.dataset.responsiveReady === '1') return;
    details.dataset.responsiveReady = '1';
    if (window.matchMedia('(max-width: 600px)').matches) details.open = false;
}

function applyPushPreferences(preferences) {
    const prefs = {...defaultPushPreferencesClient(), ...(preferences || {})};
    const inputs = getPushPreferenceInputs();
    Object.entries(inputs).forEach(([key, input]) => {
        if (input) input.checked = prefs[key] !== false;
    });
    updatePushPreferenceSummaryV16();
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

function isPushStandalonePwa() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true;
}

function setPushInlineMessage(message, type = '') {
    const el = document.getElementById('pushAdminMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'form-message push-admin-message-v15';
    if (type) el.classList.add(type);
}

function showPushToast(message, type = 'success') {
    if (typeof window.showAppToast === 'function') {
        window.showAppToast(message, type);
        return;
    }
    if (typeof showAppToast === 'function') {
        showAppToast(message, type);
        return;
    }
    setPushInlineMessage(message, type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success');
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

async function waitForPushSubscription(OneSignal, timeoutMs = 30000) {
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
    if (!silent) showPushToast('Notifikasi OSIS aktif di perangkat ini.');
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
        if (!silent) showPushToast('Notifikasi belum dapat diaktifkan: ' + error.message, 'error');
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
        } else if (isIosPushDevice() && !isPushStandalonePwa()) {
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

async function verifyPushWorkerFile() {
    const worker = getOneSignalWorkerOptions();
    const workerUrl = new URL(worker.serviceWorkerPath, window.location.origin + '/').href;
    const response = await fetch(workerUrl, {cache:'no-store'});
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();

    if (!response.ok) {
        throw new Error(`File OneSignal Service Worker tidak ditemukan (${response.status}). Pastikan ${workerUrl} bisa dibuka.`);
    }
    if (!contentType.includes('javascript') && !contentType.includes('ecmascript')) {
        throw new Error(`Service Worker OneSignal terbaca sebagai ${contentType || 'tipe file tidak dikenal'}, bukan JavaScript.`);
    }
    return workerUrl;
}

async function buildPushDiagnosticMessage() {
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    const state = await getCurrentPushState().catch(() => ({supported:false, permission:false, optedIn:false, subscriptionId:''}));
    const token = String(osisPushSdk?.User?.PushSubscription?.token || '').trim();
    const workerScope = `${window.location.origin}${getOneSignalWorkerOptions().serviceWorkerParam.scope}`;
    const registration = await navigator.serviceWorker?.getRegistration(getOneSignalWorkerOptions().serviceWorkerParam.scope).catch(() => null);

    if (permission === 'default') {
        return 'Browser belum memberikan izin notifikasi. Klik ikon gembok di samping alamat website → Notifikasi → Izinkan, lalu coba lagi.';
    }
    if (permission === 'denied') {
        return 'Izin notifikasi diblokir. Klik ikon gembok di samping alamat website → Notifikasi → Izinkan, lalu muat ulang halaman.';
    }
    if (!registration) {
        return `Izin sudah diberikan, tetapi Service Worker OneSignal belum terdaftar pada ${workerScope}. Muat ulang website lalu coba lagi.`;
    }
    if (!token) {
        return 'Izin sudah diberikan dan Service Worker aktif, tetapi browser belum memberikan push token ke OneSignal. Pastikan tidak memakai Incognito/Private dan domain yang dibuka sama persis dengan Site URL di OneSignal.';
    }
    if (!state.subscriptionId) {
        return 'Push token sudah tersedia, tetapi OneSignal belum memberikan Subscription ID. Tunggu beberapa detik, tutup-buka website, lalu coba lagi.';
    }
    return 'Subscription belum selesai dibuat. Muat ulang website lalu coba kembali.';
}

async function activatePushOnThisDevice() {
    if (!aspirasiAdminToken) return;

    const button = document.getElementById('activatePushBtnV15');
    const oldHtml = button?.innerHTML || '';
    try {
        if (!osisPushSdk) await initializePushForAdmin({silent:false});
        if (!osisPushSdk) throw new Error('SDK notifikasi belum siap.');

        if (isIosPushDevice() && !isPushStandalonePwa()) {
            throw new Error('Di iPhone/iPad, tambahkan website ke Home Screen lalu buka dari ikon tersebut sebelum mengaktifkan notifikasi.');
        }

        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengaktifkan...';
        }

        setPushInlineMessage('Memeriksa Service Worker OneSignal...', '');
        await verifyPushWorkerFile();

        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            setPushInlineMessage('Browser akan meminta izin notifikasi. Pilih Izinkan/Allow.', '');
            await osisPushSdk.Notifications.requestPermission();
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
            throw new Error('Izin notifikasi ditolak. Klik ikon gembok di samping alamat website → Notifikasi → Izinkan, lalu muat ulang halaman.');
        }

        if (!osisPushSdk.Notifications.permission) {
            throw new Error('Izin notifikasi belum diberikan. Pilih Izinkan/Allow pada permintaan browser lalu coba lagi.');
        }

        setPushInlineMessage('Izin diterima. Sedang membuat subscription push...', '');
        await osisPushSdk.User.PushSubscription.optIn();
        const subscriptionId = await waitForPushSubscription(osisPushSdk, 30000);
        if (!subscriptionId) {
            throw new Error(await buildPushDiagnosticMessage());
        }

        await registerCurrentPushDevice({silent:true});
        setPushInlineMessage('Notifikasi aktif. Coba tombol “Kirim Tes” untuk memastikan perangkat menerima push.', 'success');
        showPushToast('Notifikasi OSIS berhasil diaktifkan.');
        await refreshPushAdminPanel({silent:true});
    } catch (error) {
        console.error('[Push] Aktivasi gagal:', error);
        setPushInlineMessage(error.message, 'error');
        showPushToast('Gagal mengaktifkan notifikasi: ' + error.message, 'error');
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
        showPushToast('Notifikasi perangkat dinonaktifkan.');
        await refreshPushAdminPanel({silent:true});
    } catch (error) {
        setPushInlineMessage(error.message, 'error');
        showPushToast('Gagal menonaktifkan notifikasi: ' + error.message, 'error');
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
        showPushToast('Preferensi notifikasi disimpan.');
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
        if (result.sent === false) {
            throw new Error(result.message || 'OneSignal menerima request, tetapi tidak mengirim ke perangkat ini.');
        }
        const suffix = result.notificationId ? ` • ID ${String(result.notificationId).slice(0, 8)}` : '';
        setPushInlineMessage((result.message || 'Notifikasi tes dikirim.') + suffix, 'success');
        showPushToast('Notifikasi tes dikirim ke perangkat ini.');
    } catch (error) {
        setPushInlineMessage('Tes gagal: ' + error.message, 'error');
        showPushToast('Tes notifikasi gagal: ' + error.message, 'error');
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
                    showPushToast('Akses notifikasi perangkat dicabut.');
                    await refreshPushAdminPanel({silent:true});
                } catch (error) {
                    showPushToast('Gagal mencabut perangkat: ' + error.message, 'error');
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
    document.getElementById('pushOpenInstallGuideBtnV16')?.addEventListener('click', () => {
        if (typeof window.openPwaInstallGuide === 'function') window.openPwaInstallGuide({manual:true});
    });
    Object.values(getPushPreferenceInputs()).forEach(input => {
        input?.addEventListener('change', updatePushPreferenceSummaryV16);
    });
    syncPushPrefsDisclosureV16();
    updatePushPreferenceSummaryV16();
}

window.initializePushForAdmin = initializePushForAdmin;
window.refreshPushAdminPanel = refreshPushAdminPanel;
window.notifyGalleryAdminChange = notifyGalleryAdminChange;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePushUi, {once:true});
} else {
    initializePushUi();
}


/* ===== MODULE: gallery.js ===== */
/* =========================================================
   GALERI
   ========================================================= */
// Viewer dan integrasi Google Drive/Apps Script; logika dipertahankan.

// Gallery viewer — V45.2
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
let activeViewerUrlIndex = 0;
let viewerTouchStartX = null;
let viewerTouchStartY = null;
let viewerReturnFocus = null;
let albumReturnFocus = null;
let driveGalleryLoadError = null;

function isGalleryModalOpen(modal) {
    return Boolean(modal?.classList.contains('is-open') || modal?.style.display === 'flex');
}

function syncGalleryModalScrollLock() {
    const album = document.getElementById('albumModal');
    const shouldLock = isGalleryModalOpen(lightboxModal) || isGalleryModalOpen(album);
    document.body.classList.toggle('gallery-modal-open', shouldLock);
}

function setGalleryModalState(modal, open) {
    if (!modal) return;
    modal.classList.toggle('is-open', open);
    modal.style.display = open ? 'flex' : 'none';
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    syncGalleryModalScrollLock();
}

function galleryFocusable(modal) {
    if (!modal) return [];
    return [...modal.querySelectorAll(
        'button:not([disabled]):not([hidden]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.hidden && el.offsetParent !== null);
}

function trapGalleryFocus(event, modal) {
    if (event.key !== 'Tab' || !modal) return;
    const items = galleryFocusable(modal);
    if (!items.length) {
        event.preventDefault();
        modal.querySelector('[role="dialog"]')?.focus({preventScroll:true});
        return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function showViewerPhoto(index) {
    if (!activeViewerPhotos.length || !lightboxImg) return;
    activeViewerIndex = (index + activeViewerPhotos.length) % activeViewerPhotos.length;
    const photo = activeViewerPhotos[activeViewerIndex];
    const caption = photo?.name || `Foto ${activeViewerIndex + 1}`;

    lightboxFallback.style.display = 'none';
    lightboxImg.style.display = 'block';
    lightboxImg.classList.remove('is-ready');
    lightboxImg.setAttribute('aria-busy', 'true');
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightboxCounter.textContent = `${activeViewerIndex + 1} / ${activeViewerPhotos.length}`;
    lightboxPrev.hidden = activeViewerPhotos.length <= 1;
    lightboxNext.hidden = activeViewerPhotos.length <= 1;

    const urls = Array.isArray(photo?.urls) && photo.urls.length
        ? photo.urls
        : [photo?.src].filter(Boolean);
    activeViewerUrlIndex = 0;
    lightboxImg.referrerPolicy = 'no-referrer';
    lightboxImg.src = urls[0] || '';
}

function suspendAlbumForViewer(suspend) {
    const album = document.getElementById('albumModal');
    if (!album || !isGalleryModalOpen(album)) return;

    album.classList.toggle('is-suspended', suspend);
    if (suspend) {
        album.setAttribute('aria-hidden', 'true');
        album.setAttribute('inert', '');
    } else {
        album.setAttribute('aria-hidden', 'false');
        album.removeAttribute('inert');
    }

    const dialog = album.querySelector('[role="dialog"]');
    if (dialog) dialog.setAttribute('aria-modal', suspend ? 'false' : 'true');
}

function openGalleryViewer(photos, index=0, albumName='Galeri') {
    activeViewerPhotos = Array.isArray(photos)
        ? photos.filter(p => (Array.isArray(p?.urls) && p.urls.length) || p?.src)
        : [];
    if (!activeViewerPhotos.length || !lightboxModal) return;

    viewerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lightboxAlbumName.textContent = albumName || 'Galeri';
    suspendAlbumForViewer(true);
    setGalleryModalState(lightboxModal, true);
    showViewerPhoto(index);
    requestAnimationFrame(() => {
        lightboxModal.querySelector('.gallery-viewer-close')?.focus({preventScroll:true});
    });
}

function openLightbox(src, caption) {
    openGalleryViewer([{src, name:caption || 'Foto'}], 0, 'Galeri');
}

function closeLightbox({restoreFocus=true}={}) {
    if (!lightboxModal || !isGalleryModalOpen(lightboxModal)) return;
    setGalleryModalState(lightboxModal, false);
    lightboxImg?.classList.remove('is-ready');
    lightboxImg?.removeAttribute('aria-busy');
    lightboxImg?.removeAttribute('src');
    activeViewerPhotos = [];
    activeViewerIndex = 0;
    viewerTouchStartX = null;
    viewerTouchStartY = null;
    suspendAlbumForViewer(false);
    if (restoreFocus && viewerReturnFocus?.isConnected) {
        requestAnimationFrame(() => viewerReturnFocus.focus({preventScroll:true}));
    }
    viewerReturnFocus = null;
}

function showPreviousViewerPhoto() {
    if (activeViewerPhotos.length > 1) showViewerPhoto(activeViewerIndex - 1);
}
function showNextViewerPhoto() {
    if (activeViewerPhotos.length > 1) showViewerPhoto(activeViewerIndex + 1);
}

lightboxImg?.addEventListener('load', () => {
    lightboxImg.classList.add('is-ready');
    lightboxImg.removeAttribute('aria-busy');
});
lightboxImg?.addEventListener('error', () => {
    const photo = activeViewerPhotos[activeViewerIndex];
    if (!photo) return;
    const urls = Array.isArray(photo?.urls) && photo.urls.length
        ? photo.urls
        : [photo?.src].filter(Boolean);
    activeViewerUrlIndex += 1;
    if (activeViewerUrlIndex < urls.length) {
        lightboxImg.src = urls[activeViewerUrlIndex];
        return;
    }
    lightboxImg.removeAttribute('aria-busy');
    lightboxImg.style.display = 'none';
    lightboxFallback.style.display = 'flex';
});
lightboxPrev?.addEventListener('click', showPreviousViewerPhoto);
lightboxNext?.addEventListener('click', showNextViewerPhoto);
lightboxModal?.addEventListener('click', event => {
    if (event.target === lightboxModal) closeLightbox();
});

lightboxStage?.addEventListener('touchstart', event => {
    const touch = event.changedTouches?.[0];
    viewerTouchStartX = touch?.clientX ?? null;
    viewerTouchStartY = touch?.clientY ?? null;
}, {passive:true});
lightboxStage?.addEventListener('touchend', event => {
    if (viewerTouchStartX === null || viewerTouchStartY === null || activeViewerPhotos.length <= 1) {
        viewerTouchStartX = null;
        viewerTouchStartY = null;
        return;
    }
    const touch = event.changedTouches?.[0];
    const endX = touch?.clientX ?? viewerTouchStartX;
    const endY = touch?.clientY ?? viewerTouchStartY;
    const dx = endX - viewerTouchStartX;
    const dy = endY - viewerTouchStartY;
    viewerTouchStartX = null;
    viewerTouchStartY = null;

    // Horizontal intent must be clear. This avoids changing photos while the
    // user is making a mostly vertical gesture on a phone.
    if (Math.abs(dx) < 52 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
    if (dx < 0) showNextViewerPhoto();
    else showPreviousViewerPhoto();
}, {passive:true});
lightboxStage?.addEventListener('touchcancel', () => {
    viewerTouchStartX = null;
    viewerTouchStartY = null;
}, {passive:true});

document.addEventListener('keydown', event => {
    const album = document.getElementById('albumModal');
    if (isGalleryModalOpen(lightboxModal)) {
        if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); return; }
        if (event.key === 'ArrowLeft') { event.preventDefault(); showPreviousViewerPhoto(); return; }
        if (event.key === 'ArrowRight') { event.preventDefault(); showNextViewerPhoto(); return; }
        trapGalleryFocus(event, lightboxModal);
        return;
    }
    if (isGalleryModalOpen(album)) {
        if (event.key === 'Escape') { event.preventDefault(); closeAlbum(); return; }
        trapGalleryFocus(event, album);
        return;
    }
    if (event.key === 'Escape') {
        tutupModalLogin();
        window.closeMobileNav?.();
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
let draggedGalleryAlbumId = null;
let driveGalleryLoadingPromise = null;
let driveGalleryRequestSerial = 0;
let galleryPendingDeleteJob = null;
const galleryPendingDeletePhotoIds = new Set();
let galleryPendingDeleteAlbumId = null;

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

function getSelectedGalleryAlbum() {
    return (driveGalleryData.albums || []).find(album => album.id === selectedGalleryAlbumId) || null;
}

function updateGalleryAdminGuidance() {
    const album = getSelectedGalleryAlbum();
    const titleInput = document.getElementById('galleryAlbumTitle');
    const draftTitle = titleInput?.value.trim() || '';
    const pendingCount = galleryPendingFiles.length;
    const photoCount = Array.isArray(album?.photos) ? album.photos.length : 0;

    const target = document.getElementById('galleryUploadTarget');
    if (target) {
        if (album) target.textContent = `Foto akan masuk ke “${album.title || 'Album'}”.`;
        else if (draftTitle) target.textContent = `Album baru “${draftTitle}” akan dibuat saat upload.`;
        else target.textContent = 'Pilih album atau buat album baru terlebih dahulu.';
    }

    const selection = document.getElementById('gallerySelectionSummary');
    if (selection) {
        selection.classList.toggle('has-files', pendingCount > 0);
        selection.innerHTML = pendingCount
            ? `<i class="fa-solid fa-images" aria-hidden="true"></i> ${pendingCount} foto siap diupload`
            : '<i class="fa-regular fa-image" aria-hidden="true"></i> Belum ada foto dipilih';
    }

    const upload = document.getElementById('uploadGalleryPhotosBtn');
    if (upload) {
        upload.innerHTML = pendingCount
            ? `<i class="fa-solid fa-cloud-arrow-up"></i> Upload ${pendingCount} Foto`
            : '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Foto';
    }

    const manager = document.getElementById('galleryManagerAlbumName');
    if (manager) {
        manager.textContent = album
            ? `${album.title || 'Album'} • ${photoCount} foto`
            : 'Pilih album untuk melihat fotonya.';
    }

    const step1 = document.getElementById('galleryWorkflowStep1');
    const step2 = document.getElementById('galleryWorkflowStep2');
    const step3 = document.getElementById('galleryWorkflowStep3');
    [step1, step2, step3].forEach(step => step?.classList.remove('is-active', 'is-ready'));

    const albumReady = Boolean(album || draftTitle);
    if (!albumReady) {
        step1?.classList.add('is-active');
    } else {
        step1?.classList.add('is-ready');
        if (pendingCount > 0) {
            step2?.classList.add('is-active');
        } else if (album && photoCount > 0) {
            step2?.classList.add('is-ready');
            step3?.classList.add('is-active');
        } else {
            step2?.classList.add('is-active');
        }
    }
}

// Token admin galeri hanya hidup di memory tab ini dan memiliki masa berlaku singkat.
// Secret permanen tidak pernah dikirim ke browser.
let driveAdminToken = '';
let driveAdminTokenExpiresAt = 0;
let driveAdminTokenPromise = null;

function clearDriveAdminCredential() {
    driveAdminToken = '';
    driveAdminTokenExpiresAt = 0;
    driveAdminTokenPromise = null;
}

window.clearDriveAdminCredential = clearDriveAdminCredential;

async function getDriveAdminToken() {
    const now = Date.now();
    if (driveAdminToken && driveAdminTokenExpiresAt > now + 30000) {
        return driveAdminToken;
    }

    if (!aspirasiAdminToken) {
        throw new Error(
            'Sesi admin belum tersedia. Silakan login Area OSIS terlebih dahulu.'
        );
    }

    if (driveAdminTokenPromise) {
        return driveAdminTokenPromise;
    }

    driveAdminTokenPromise = aspirasiApi(
        'galleryCredential',
        { token: aspirasiAdminToken }
    )
        .then(result => {
            const token = String(result?.token || '').trim();
            const expiresInSeconds = Math.max(60, Number(result?.expiresInSeconds) || 600);

            if (!token) {
                throw new Error(
                    'Backend tidak memberikan token galeri.'
                );
            }

            driveAdminToken = token;
            driveAdminTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
            return driveAdminToken;
        })
        .finally(() => {
            driveAdminTokenPromise = null;
        });

    return driveAdminTokenPromise;
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

    const requestSerial = ++driveGalleryRequestSerial;
    const requestPromise = new Promise((resolve, reject) => {
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
            if (requestSerial !== driveGalleryRequestSerial) {
                resolve(driveGalleryData);
                return;
            }
            driveGalleryLoadError = 'Google Drive tidak merespons.';
            reject(new Error(driveGalleryLoadError));
        }, 15000);

        window[callback] = data => {
            cleanup();
            if (requestSerial !== driveGalleryRequestSerial) {
                resolve(driveGalleryData);
                return;
            }
            if (!data || data.ok === false) {
                driveGalleryLoadError = data?.error || 'Galeri Google Drive gagal dimuat.';
                reject(new Error(driveGalleryLoadError));
                return;
            }
            driveGalleryLoadError = null;
            driveGalleryData = data;
            updateCommandCenterV12?.();
            resolve(data);
        };

        const sep = getDriveGalleryUrl().includes('?') ? '&' : '?';
        script.src = getDriveGalleryUrl() + sep + 'action=gallery&callback=' + encodeURIComponent(callback) + '&t=' + Date.now();
        script.onerror = () => {
            cleanup();
            if (requestSerial !== driveGalleryRequestSerial) {
                resolve(driveGalleryData);
                return;
            }
            driveGalleryLoadError = 'Tidak dapat terhubung ke Google Apps Script.';
            reject(new Error(driveGalleryLoadError));
        };
        document.head.appendChild(script);
    });

    let trackedPromise;
    trackedPromise = requestPromise.finally(() => {
        if (driveGalleryLoadingPromise === trackedPromise) driveGalleryLoadingPromise = null;
    });
    driveGalleryLoadingPromise = trackedPromise;
    return trackedPromise;
}

async function drivePost(payload, timeoutMs=60000) {
    const url = getDriveGalleryUrl();

    if (!url) {
        throw new Error('Google Drive belum dihubungkan.');
    }

    // Token galeri tetap sementara; secret permanen tidak pernah dikirim ke browser.
    const authToken = await getDriveAdminToken();
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const body = new URLSearchParams();
    body.set('requestId', requestId);
    body.set('responseMode', 'json');
    body.set('payload', JSON.stringify({...payload, authToken}));

    try {
        const response = await fetch(url, {
            method: 'POST',
            body,
            signal: controller.signal,
            redirect: 'follow',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`Backend galeri merespons HTTP ${response.status}.`);
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            // Backend galeri versi lama mengembalikan HTML postMessage.
            // Pesan ini membuat masalah deployment langsung terbaca, bukan timeout 60 detik.
            if (/postMessage|<!doctype|<script/i.test(text)) {
                throw new Error('Backend galeri masih memakai versi lama. Deploy BACKEND-GALERI-Code.gs terbaru terlebih dahulu.');
            }
            throw new Error('Respons backend galeri tidak valid. Deploy ulang Web App galeri.');
        }

        if (!data || data.ok !== true) {
            const message = data?.error || 'Operasi Google Drive gagal.';
            if (/token|key|kunci|auth|unauthor|forbidden|kedaluwarsa/i.test(message)) {
                clearDriveAdminCredential();
            }
            throw new Error(message);
        }

        return data;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('Backend galeri terlalu lama merespons. Periksa deployment Apps Script galeri.');
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}
function galleryPhotoCandidates(photo, preferredWidth=1600) {
    const urls = [];
    const add = value => {
        const url = String(value || '').trim();
        if (url && !urls.includes(url)) urls.push(url);
    };

    const width = Math.max(480, Math.min(2600, Number(preferredWidth) || 1600));
    add(photo?.thumbnailUrl);

    // Prefer Drive thumbnail delivery before full-size view/download URLs.
    // It is substantially lighter on mobile and still falls back safely.
    const id = String(photo?.id || '').trim();
    if (id) {
        const resourceKey = String(photo?.resourceKey || '').trim();
        const resourcePart = resourceKey
            ? `&resourcekey=${encodeURIComponent(resourceKey)}`
            : '';
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}${resourcePart}`);
    }

    add(photo?.url);
    add(photo?.downloadUrl);
    if (id) {
        const resourceKey = String(photo?.resourceKey || '').trim();
        const resourcePart = resourceKey
            ? `&resourcekey=${encodeURIComponent(resourceKey)}`
            : '';
        add(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}${resourcePart}`);
    }

    return urls;
}

function galleryPhotoUrl(photo) {
    return galleryPhotoCandidates(photo, 1200)[0] || '';
}

function setGalleryImageSource(img, photo, onFinalError, preferredWidth=1600) {
    if (!img) return;
    const urls = Array.isArray(photo?.urls) && photo.urls.length
        ? photo.urls.filter(Boolean)
        : galleryPhotoCandidates(photo, preferredWidth);
    let index = 0;

    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
        index += 1;
        if (index < urls.length) {
            img.src = urls[index];
            return;
        }
        if (typeof onFinalError === 'function') onFinalError();
    };

    if (urls.length) img.src = urls[0];
    else if (typeof onFinalError === 'function') onFinalError();
}

function renderGalleryLoadingState() {
    const grid = document.getElementById('galleryGrid');
    const summary = document.getElementById('gallerySummary');
    if (!grid) return;
    if (summary) {
        summary.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Menyiapkan galeri';
    }
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = Array.from({length: 3}, (_, index) => `
        <div class="gallery-skeleton${index === 0 ? ' is-featured' : ''}" aria-hidden="true">
            <span></span><span></span><span></span>
        </div>`).join('');
}

function renderPublicGallery() {
    const grid = document.getElementById('galleryGrid');
    const summary = document.getElementById('gallerySummary');
    if (!grid) return;
    grid.removeAttribute('aria-busy');
    grid.innerHTML = '';
    const albums = getVisibleGalleryAlbums();
    const totalPhotos = albums.reduce((sum, album) => {
        return sum + (Array.isArray(album.photos) ? album.photos.length : 0);
    }, 0);

    if (summary) {
        summary.innerHTML = `<i class="fa-solid fa-images" aria-hidden="true"></i> ${albums.length} album${totalPhotos ? ` • ${totalPhotos} foto` : ''}`;
    }

    if (!albums.length) {
        if (driveGalleryLoadError) {
            // Galeri gagal dimuat — tampilkan fallback ramah pengguna dengan tombol coba lagi
            const friendlyMessage = driveGalleryLoadError.includes('tidak merespons')
                ? 'Galeri sedang lambat. Coba beberapa saat lagi ya.'
                : 'Galeri sedang tidak dapat diakses.';
            grid.innerHTML = `
                <div class="empty-state-v12 gallery-error-state">
                    <div>
                        <span class="empty-icon-v12"><i class="fa-solid fa-cloud-arrow-down"></i></span>
                        <strong>Galeri tidak tersedia</strong>
                        <small>${friendlyMessage} Pastikan koneksi internet kamu stabil.</small>
                        <button type="button" class="gallery-retry-btn" onclick="retryPublicGalleryLoad()">
                            <i class="fa-solid fa-rotate-right"></i> Coba lagi
                        </button>
                    </div>
                </div>`;
        } else {
            grid.innerHTML = '<div class="empty-state-v12"><div><span class="empty-icon-v12"><i class="fa-regular fa-images"></i></span><strong>Belum ada album foto</strong><small>Galeri masih kosong, pantau terus ya!</small></div></div>';
        }
        return;
    }

    albums.forEach((album, index) => {
        const photos = Array.isArray(album.photos) ? album.photos : [];
        const cover = photos.find(p => p.id === album.coverPhotoId) || photos[0];
        const coverSrc = galleryPhotoUrl(cover);
        const photoCount = photos.length;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery-item' + (index === 0 ? ' is-featured' : '');
        button.setAttribute('data-aos', 'fade-up');
        button.setAttribute('data-aos-delay', String(Math.min(index, 4) * 60));
        button.setAttribute('aria-label', `Buka album ${album.title || 'galeri'}, ${photoCount} foto`);

        if (coverSrc) {
            const img = document.createElement('img');
            img.className = 'real-img';
            img.alt = `Cover ${album.title || 'album'}`;
            img.loading = index < 2 ? 'eager' : 'lazy';
            img.decoding = 'async';
            if (index === 0) img.fetchPriority = 'high';
            setGalleryImageSource(img, cover, () => { img.style.display = 'none'; }, 1200);
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
    return album.photos.map((p, i) => {
        const urls = galleryPhotoCandidates(p, 2400);
        return {
            src: urls[0] || '',
            urls,
            name: p.name || `${album.title || 'Foto'} ${i + 1}`
        };
    }).filter(p => p.urls.length);
}

function openAlbum(key) {
    const album = getAlbumById(key);
    if (!album || !albumModal) return;

    albumReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    albumTitle.textContent = album.title || 'Album';
    albumSubtitle.textContent = album.subtitle || 'Koleksi foto kegiatan';
    albumDumpGrid.innerHTML = '';
    albumDumpGrid.scrollTop = 0;
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
        item.dataset.photoIndex = String(i + 1);
        item.setAttribute('aria-label', `Buka foto ${i + 1} dari ${photos.length}`);

        const img = document.createElement('img');
        img.alt = photo.name || `${album.title || 'Foto'} ${i + 1}`;
        img.loading = i < 3 ? 'eager' : 'lazy';
        img.decoding = 'async';
        setGalleryImageSource(img, photo, () => { img.classList.add('gallery-image-failed'); }, 900);
        item.appendChild(img);
        item.addEventListener('click', () => openGalleryViewer(photos, i, album.title || 'Galeri'));
        albumDumpGrid.appendChild(item);
    });

    setGalleryModalState(albumModal, true);
    requestAnimationFrame(() => albumModal.querySelector('.album-close-btn')?.focus({preventScroll:true}));
}

function closeAlbum({restoreFocus=true}={}) {
    if (!albumModal || !isGalleryModalOpen(albumModal)) return;
    if (isGalleryModalOpen(lightboxModal)) closeLightbox({restoreFocus:false});
    setGalleryModalState(albumModal, false);
    if (restoreFocus && albumReturnFocus?.isConnected) {
        requestAnimationFrame(() => albumReturnFocus.focus({preventScroll:true}));
    }
    albumReturnFocus = null;
}
albumModal?.addEventListener('click', event => {
    if (event.target === albumModal) closeAlbum();
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

function formatGalleryBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function setGalleryUploadProgress({percent=0, text='', stats=''}={}) {
    const wrap = document.getElementById('galleryUploadProgressWrap');
    const progress = document.getElementById('galleryUploadProgress');
    const bar = progress?.querySelector('span');
    const textEl = document.getElementById('galleryUploadProgressText');
    const percentEl = document.getElementById('galleryUploadProgressPercent');
    const statsEl = document.getElementById('galleryUploadStats');
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    if (wrap) wrap.hidden = false;
    if (bar) bar.style.width = `${safePercent}%`;
    if (progress) progress.setAttribute('aria-valuenow', String(safePercent));
    if (textEl && text) textEl.textContent = text;
    if (percentEl) percentEl.textContent = `${safePercent}%`;
    if (statsEl && stats) statsEl.textContent = stats;
}

function hideGalleryUploadProgress(delay=900) {
    const wrap = document.getElementById('galleryUploadProgressWrap');
    setTimeout(() => {
        if (wrap) wrap.hidden = true;
        const progress = document.getElementById('galleryUploadProgress');
        const bar = progress?.querySelector('span');
        if (bar) bar.style.width = '0%';
        progress?.setAttribute('aria-valuenow', '0');
    }, delay);
}

async function compressGalleryImage(file) {
    let image;
    const bitmap = typeof createImageBitmap === 'function' ? await createImageBitmap(file).catch(() => null) : null;
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
    return {
        blob,
        originalBytes: file.size,
        outputBytes: blob.size,
        savedBytes: Math.max(0, file.size - blob.size)
    };
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
    updateGalleryAdminGuidance();
}

function previewPendingGalleryFiles(files) {
    // FileList dari <input type="file"> bersifat live. Salin dulu sebelum input
    // dikosongkan, kalau tidak daftar file ikut menjadi kosong di Safari/Chrome.
    const incomingFiles = Array.from(files || []);
    clearPendingGallerySelection();
    galleryFailedFiles = [];
    const seen = new Set();
    const accepted = [];
    let duplicates = 0;
    incomingFiles.filter(f => !f.type || f.type.startsWith('image/')).slice(0,30).forEach(file => {
        const key = `${file.name}|${file.size}|${file.lastModified}`;
        if (seen.has(key)) { duplicates++; return; }
        seen.add(key);
        accepted.push(file);
    });
    galleryPendingFiles = accepted;
    renderPendingGalleryPreview();
    if (galleryPendingFiles.length) {
        setInlineMessage('galleryUploadMessage', `${galleryPendingFiles.length} foto dipilih${duplicates ? ` • ${duplicates} duplikat pilihan dilewati` : ''}.`, 'success');
    } else if (incomingFiles.length) {
        setInlineMessage('galleryUploadMessage', 'File yang dipilih bukan format gambar yang didukung.', 'error');
    }
    updateGalleryAdminGuidance();
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
        const meta = document.createElement('div');
        meta.className = 'gallery-file-preview-meta';
        meta.innerHTML = `<strong>${escapeHtml(file.name)}</strong><span>${formatGalleryBytes(file.size)} • kompres otomatis</span>`;
        div.append(img, meta); preview?.appendChild(div);
    });
    const upload = document.getElementById('uploadGalleryPhotosBtn');
    if (upload) upload.disabled = !galleryPendingFiles.length;
    const clear = document.getElementById('clearGallerySelectionBtn');
    if (clear) clear.disabled = !galleryPendingFiles.length;
    const retry = document.getElementById('retryGalleryUploadsBtn');
    if (retry) retry.hidden = !galleryFailedFiles.length;
    updateGalleryAdminGuidance();
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
        renderPublicGallery();
        return false;
    }
}

/**
 * Retry publik dari tombol "Coba lagi" saat galeri gagal dimuat.
 * User-friendly: reset status, tampilkan loading, lalu coba refresh.
 */
async function retryPublicGalleryLoad() {
    const grid = document.getElementById('galleryGrid');
    const summary = document.getElementById('gallerySummary');
    if (!grid) return;

    // Reset error state agar tombol tidak menumpuk
    driveGalleryLoadError = null;

    if (grid.querySelector('.gallery-retry-btn')) {
        const btn = grid.querySelector('.gallery-retry-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencoba lagi...';
    }

    if (summary) {
        summary.innerHTML = '<i class="fa-solid fa-cloud-arrow-down fa-spin"></i> Menghubungkan galeri...';
    }

    // Gunakan fungsi utama supaya konsisten dengan tombol refresh admin
    const ok = await refreshDriveGallery({ showMessage: false, preserveAlbum: true });

    if (!ok) {
        // Tetap tampilkan pesan error yang ramah di grid
        renderPublicGallery();
        showAppToast?.('Galeri belum bisa dimuat. Periksa koneksi internetmu.', 'error');
    } else {
        showAppToast?.('Galeri berhasil dimuat!', 'success');
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
        option.textContent = 'Belum ada album — buat album baru';
        select.appendChild(option);
        selectedGalleryAlbumId = null;
        const settings = document.getElementById('galleryAlbumSettings');
        if (settings) settings.open = true;
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
    renderGalleryAlbumOrderList();
    renderGalleryAdminPhotos();
    updateGalleryAdminGuidance();
}

function renderGalleryAlbumOrderList() {
    const list = document.getElementById('galleryAlbumOrderList');
    if (!list) return;
    const albums = Array.isArray(driveGalleryData.albums) ? driveGalleryData.albums : [];
    list.innerHTML = '';
    if (albums.length <= 1) {
        list.innerHTML = `<div class="gallery-album-order-empty">${albums.length ? 'Hanya ada satu album.' : 'Belum ada album.'}</div>`;
        return;
    }
    albums.forEach((album, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-album-order-item' + (album.id === selectedGalleryAlbumId ? ' is-current' : '') + (album.id === galleryPendingDeleteAlbumId ? ' is-pending-delete' : '');
        item.draggable = true;
        item.dataset.albumId = album.id;
        item.innerHTML = `<span class="gallery-album-drag-handle" title="Geser album"><i class="fa-solid fa-grip-vertical" aria-hidden="true"></i></span><span class="gallery-album-order-index">${index + 1}</span><strong>${escapeHtml(album.title || 'Album')}</strong><span class="gallery-album-photo-count">${Array.isArray(album.photos) ? album.photos.length : 0} foto</span>`;
        item.addEventListener('click', event => {
            if (event.target.closest('.gallery-album-drag-handle')) return;
            selectedGalleryAlbumId = album.id;
            const select = document.getElementById('galleryAlbumSelect');
            if (select) select.value = album.id;
            loadGalleryAlbumForm();
        });
        item.addEventListener('dragstart', event => {
            draggedGalleryAlbumId = album.id;
            item.classList.add('dragging');
            event.dataTransfer?.setData('text/plain', album.id);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragend', () => {
            draggedGalleryAlbumId = null;
            item.classList.remove('dragging');
            list.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'));
        });
        item.addEventListener('dragover', event => {
            if (!draggedGalleryAlbumId || draggedGalleryAlbumId === album.id) return;
            event.preventDefault();
            item.classList.add('drag-target');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-target'));
        item.addEventListener('drop', async event => {
            event.preventDefault();
            item.classList.remove('drag-target');
            if (!draggedGalleryAlbumId || draggedGalleryAlbumId === album.id) return;
            const ids = albums.map(entry => entry.id);
            const from = ids.indexOf(draggedGalleryAlbumId);
            const to = ids.indexOf(album.id);
            if (from < 0 || to < 0) return;
            const [moved] = ids.splice(from, 1);
            ids.splice(to, 0, moved);
            try {
                await drivePost({action:'reorderAlbums', albumIds:ids});
                await refreshDriveGallery({preserveAlbum:true});
                showAppToast('Urutan album diperbarui.');
            } catch (error) {
                setInlineMessage('galleryAlbumMessage', error.message, 'error');
            }
        });
        list.appendChild(item);
    });
}

function startNewGalleryAlbum() {
    selectedGalleryAlbumId = null;
    const select = document.getElementById('galleryAlbumSelect');
    if (select) select.selectedIndex = -1;
    const title = document.getElementById('galleryAlbumTitle');
    if (title) title.value = '';
    const subtitle = document.getElementById('galleryAlbumSubtitle');
    if (subtitle) subtitle.value = '';
    const settings = document.getElementById('galleryAlbumSettings');
    if (settings) settings.open = true;
    const grid = document.getElementById('galleryAdminPhotos');
    if (grid) grid.innerHTML = '<div class="gallery-empty">Buat album, lalu pilih foto untuk diupload.</div>';
    setInlineMessage('galleryAlbumMessage', 'Isi judul album baru, lalu klik Simpan Album.');
    updateGalleryAdminGuidance();
    setTimeout(() => title?.focus({preventScroll:true}), 0);
}

async function saveGalleryAlbum() {
    const title = document.getElementById('galleryAlbumTitle')?.value.trim();
    const subtitle = document.getElementById('galleryAlbumSubtitle')?.value.trim() || '';
    const wasNewAlbum = !selectedGalleryAlbumId;
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
        const settings = document.getElementById('galleryAlbumSettings');
        if (settings) settings.open = false;
        setInlineMessage('galleryAlbumMessage', 'Album berhasil disimpan.', 'success');
        updateGalleryAdminGuidance();
        showAppToast('Album berhasil disimpan.');
        if (typeof notifyGalleryAdminChange === 'function') {
            notifyGalleryAdminChange({
                kind: wasNewAlbum ? 'album-created' : 'album-updated',
                albumTitle: title
            });
        }
    } catch (e) {
        setInlineMessage('galleryAlbumMessage', e.message, 'error');
    }
}

function clearGalleryDeleteVisualState() {
    galleryPendingDeletePhotoIds.clear();
    galleryPendingDeleteAlbumId = null;
    renderGalleryAlbumOrderList();
    renderGalleryAdminPhotos();
}

function hideGalleryUndoBar() {
    const bar = document.getElementById('galleryUndoBar');
    if (bar) bar.hidden = true;
}

function updateGalleryUndoCountdown() {
    if (!galleryPendingDeleteJob) return;
    const remaining = Math.max(0, galleryPendingDeleteJob.expiresAt - Date.now());
    const countdown = document.getElementById('galleryUndoCountdown');
    if (countdown) countdown.textContent = `${Math.ceil(remaining / 1000)} dtk`;
}

function undoGalleryDeletion() {
    const job = galleryPendingDeleteJob;
    if (!job) return;
    clearTimeout(job.timer);
    clearInterval(job.interval);
    galleryPendingDeleteJob = null;
    hideGalleryUndoBar();
    clearGalleryDeleteVisualState();
    setInlineMessage('galleryAlbumMessage', 'Penghapusan dibatalkan.', 'success');
    showAppToast('Penghapusan dibatalkan.');
}

async function commitGalleryDeletion(job) {
    if (!job || galleryPendingDeleteJob !== job) return;
    clearInterval(job.interval);
    galleryPendingDeleteJob = null;
    hideGalleryUndoBar();
    try {
        if (job.kind === 'album') {
            await drivePost({action:'deleteAlbum', albumId:job.albumId});
            selectedGalleryAlbumId = null;
            await refreshDriveGallery({preserveAlbum:false});
        } else {
            await drivePost({action:'deletePhotos', albumId:job.albumId, photoIds:job.photoIds}, 90000);
            job.photoIds.forEach(id => gallerySelectedPhotoIds.delete(id));
            await refreshDriveGallery({preserveAlbum:true});
        }
        clearGalleryDeleteVisualState();
        setInlineMessage('galleryAlbumMessage', job.successMessage, 'success');
        showAppToast(job.successMessage);
        if (typeof notifyGalleryAdminChange === 'function') {
            notifyGalleryAdminChange({
                kind: job.kind === 'album' ? 'album-deleted' : 'photos-deleted',
                albumTitle: job.albumTitle || 'Galeri OSIS',
                count: job.kind === 'album' ? 0 : (job.photoIds?.length || 0)
            });
        }
    } catch (error) {
        clearGalleryDeleteVisualState();
        setInlineMessage('galleryAlbumMessage', `Gagal menghapus: ${error.message}`, 'error');
        showAppToast(`Gagal menghapus: ${error.message}`, 'error');
    }
}

function scheduleGalleryDeletion(job) {
    if (galleryPendingDeleteJob) {
        showAppToast('Batalkan atau tunggu penghapusan sebelumnya selesai.', 'warning');
        return false;
    }
    const bar = document.getElementById('galleryUndoBar');
    const text = document.getElementById('galleryUndoText');
    const expiresAt = Date.now() + 8000;
    const pending = {...job, expiresAt};
    pending.timer = setTimeout(() => commitGalleryDeletion(pending), 8000);
    pending.interval = setInterval(updateGalleryUndoCountdown, 250);
    galleryPendingDeleteJob = pending;
    if (job.kind === 'album') galleryPendingDeleteAlbumId = job.albumId;
    else job.photoIds.forEach(id => galleryPendingDeletePhotoIds.add(id));
    if (text) text.textContent = job.undoMessage;
    if (bar) bar.hidden = false;
    updateGalleryUndoCountdown();
    renderGalleryAlbumOrderList();
    renderGalleryAdminPhotos();
    return true;
}

async function deleteSelectedGalleryAlbum() {
    const album = driveGalleryData.albums?.find(a => a.id === selectedGalleryAlbumId);
    if (!album) return;
    if (!confirm(`Hapus album “${album.title}” beserta semua fotonya? Kamu masih punya 8 detik untuk membatalkan.`)) return;
    scheduleGalleryDeletion({
        kind:'album',
        albumId:album.id,
        albumTitle:album.title,
        undoMessage:`Album “${album.title}” akan dihapus.`,
        successMessage:'Album berhasil dihapus.'
    });
}

async function uploadPendingGalleryPhotos() {
    if (!galleryPendingFiles.length) return;
    let albumId = selectedGalleryAlbumId;
    const title = document.getElementById('galleryAlbumTitle')?.value.trim();
    const subtitle = document.getElementById('galleryAlbumSubtitle')?.value.trim() || '';
    let uploadAlbumTitle = driveGalleryData.albums?.find(a => a.id === albumId)?.title || title || 'Galeri OSIS';
    if (!albumId && !title) return setInlineMessage('galleryUploadMessage','Pilih album atau buat album baru terlebih dahulu.','error');

    const btn = document.getElementById('uploadGalleryPhotosBtn');
    btn.disabled = true;
    const queue = galleryPendingFiles.slice();
    galleryFailedFiles = [];
    let uploaded = 0, duplicates = 0, processed = 0;
    let originalBytes = 0, compressedBytes = 0;
    try {
        setGalleryUploadProgress({percent:1, text:`Menyiapkan ${queue.length} foto...`, stats:'Kompresi otomatis aktif untuk mempercepat upload.'});
        if (!albumId) {
            const created = await drivePost({action:'upsertAlbum', albumId:'', title, subtitle});
            albumId = created.albumId; selectedGalleryAlbumId = albumId;
            uploadAlbumTitle = created.title || title || uploadAlbumTitle;
        }
        for (const file of queue) {
            const number = processed + 1;
            const startPercent = processed / queue.length * 100;
            setGalleryUploadProgress({
                percent:startPercent,
                text:`Foto ${number} dari ${queue.length} • Mengompres ${file.name}`,
                stats:`Ukuran awal ${formatGalleryBytes(file.size)}`
            });
            try {
                const compressed = await compressGalleryImage(file);
                const blob = compressed.blob;
                originalBytes += compressed.originalBytes;
                compressedBytes += compressed.outputBytes;
                const midPercent = ((processed + 0.45) / queue.length) * 100;
                setGalleryUploadProgress({
                    percent:midPercent,
                    text:`Foto ${number} dari ${queue.length} • Mengupload...`,
                    stats:`${formatGalleryBytes(compressed.originalBytes)} → ${formatGalleryBytes(compressed.outputBytes)}${compressed.savedBytes > 0 ? ` • hemat ${Math.round(compressed.savedBytes / compressed.originalBytes * 100)}%` : ''}`
                });
                const hash = await sha256Blob(blob);
                const dataUrl = await blobToDataUrl(blob);
                const result = await drivePost({action:'uploadPhoto', albumId, name:file.name, sha256:hash, dataUrl}, 90000);
                if (result.duplicate) duplicates++; else uploaded++;
            } catch (fileError) {
                console.warn('Upload foto gagal:', file.name, fileError);
                galleryFailedFiles.push(file);
            }
            processed++;
            const donePercent = processed / queue.length * 100;
            setGalleryUploadProgress({
                percent:donePercent,
                text:`Selesai ${processed} dari ${queue.length} foto`,
                stats: originalBytes ? `Total ${formatGalleryBytes(originalBytes)} → ${formatGalleryBytes(compressedBytes)}` : 'Memproses foto berikutnya...'
            });
        }
        galleryPendingFiles = galleryFailedFiles.slice();
        renderPendingGalleryPreview();
        await refreshDriveGallery({preserveAlbum:true});
        updateGalleryAdminGuidance();
        const parts = [];
        if (uploaded) parts.push(`${uploaded} berhasil`);
        if (duplicates) parts.push(`${duplicates} duplikat dilewati`);
        if (galleryFailedFiles.length) parts.push(`${galleryFailedFiles.length} gagal`);
        if (originalBytes > compressedBytes && compressedBytes > 0) parts.push(`hemat ${Math.round((originalBytes-compressedBytes)/originalBytes*100)}% ukuran`);
        const uploadSummary = parts.join(' • ') || 'Tidak ada foto yang diupload.';
        setGalleryUploadProgress({percent:100, text:'Upload selesai', stats:uploadSummary});
        setInlineMessage('galleryUploadMessage', uploadSummary, galleryFailedFiles.length ? 'error' : 'success');
        showAppToast(uploadSummary, galleryFailedFiles.length ? 'warning' : 'success');
        if (uploaded > 0 && typeof notifyGalleryAdminChange === 'function') {
            notifyGalleryAdminChange({
                kind:'photos-uploaded',
                albumTitle:uploadAlbumTitle,
                count:uploaded
            });
        }
    } finally {
        hideGalleryUploadProgress(galleryFailedFiles.length ? 1800 : 1100);
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
    const ids = Array.from(gallerySelectedPhotoIds);
    const count = ids.length;
    scheduleGalleryDeletion({
        kind:'photos',
        albumId:album.id,
        albumTitle:album.title,
        photoIds:ids,
        undoMessage:`${count} foto akan dihapus.`,
        successMessage:`${count} foto berhasil dihapus.`
    });
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
        card.className = 'gallery-admin-photo' + (gallerySelectedPhotoIds.has(photo.id) ? ' is-selected' : '') + (galleryPendingDeletePhotoIds.has(photo.id) ? ' is-pending-delete' : '');
        card.draggable = !galleryPendingDeletePhotoIds.has(photo.id); card.dataset.photoId = photo.id;
        const select = document.createElement('input');
        select.type='checkbox'; select.className='gallery-photo-select'; select.checked=gallerySelectedPhotoIds.has(photo.id); select.setAttribute('aria-label',`Pilih ${photo.name || 'foto'}`);
        select.addEventListener('change', () => { select.checked ? gallerySelectedPhotoIds.add(photo.id) : gallerySelectedPhotoIds.delete(photo.id); card.classList.toggle('is-selected',select.checked); updateGalleryBulkButtons(); });
        const img = document.createElement('img');
        img.alt=photo.name || 'Foto'; img.loading='lazy'; img.decoding='async';
        setGalleryImageSource(img, photo, () => { img.classList.add('gallery-image-failed'); });
        const body=document.createElement('div'); body.className='gallery-admin-photo-body';
        const name=document.createElement('small'); name.textContent=photo.name || 'Foto';
        const dragHint=document.createElement('span'); dragHint.className='gallery-photo-drag-hint'; dragHint.innerHTML=`<i class="fa-solid fa-grip-vertical"></i> Geser • Posisi ${index+1}`;
        const actions=document.createElement('div'); actions.className='gallery-admin-photo-actions';
        const cover=document.createElement('button'); cover.type='button'; cover.className='gallery-mini-btn'+(album.coverPhotoId===photo.id?' primary':''); cover.innerHTML=album.coverPhotoId===photo.id?'<i class="fa-solid fa-star"></i> Cover':'<i class="fa-regular fa-star"></i> Cover';
        cover.addEventListener('click', async () => { try { await drivePost({action:'setCover',albumId:album.id,photoId:photo.id}); await refreshDriveGallery({preserveAlbum:true}); showAppToast('Cover album diperbarui.'); } catch(e){ setInlineMessage('galleryAlbumMessage',e.message,'error'); showAppToast(e.message,'error'); } });
        const del=document.createElement('button'); del.type='button'; del.className='gallery-mini-btn danger'; del.innerHTML='<i class="fa-solid fa-trash"></i>'; del.setAttribute('aria-label','Hapus foto');
        del.disabled = galleryPendingDeletePhotoIds.has(photo.id);
        del.addEventListener('click', () => {
            scheduleGalleryDeletion({kind:'photos', albumId:album.id, albumTitle:album.title, photoIds:[photo.id], undoMessage:`Foto “${photo.name || 'Foto'}” akan dihapus.`, successMessage:'Foto berhasil dihapus.'});
        });
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
    updateGalleryAdminGuidance();
}

async function initializeGallerySystem() {
    renderGalleryLoadingState();

    const securityStatus =
        document.getElementById(
            'driveGallerySecurityStatus'
        );

    if (securityStatus) {
        securityStatus.title =
            'Token upload sementara diterbitkan backend setelah login admin.';
    }

    document.getElementById('galleryUndoBtn')?.addEventListener('click', undoGalleryDeletion);

    const uploadZone = document.querySelector('.gallery-upload-zone-simple');
    if (uploadZone) {
        ['dragenter','dragover'].forEach(type => uploadZone.addEventListener(type, event => {
            event.preventDefault();
            uploadZone.classList.add('is-dragover');
        }));
        ['dragleave','drop'].forEach(type => uploadZone.addEventListener(type, event => {
            event.preventDefault();
            uploadZone.classList.remove('is-dragover');
        }));
        uploadZone.addEventListener('drop', event => {
            const files = event.dataTransfer?.files;
            if (files?.length) previewPendingGalleryFiles(files);
        });
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
        const settings = document.getElementById('galleryAlbumSettings');
        if (settings) settings.open = false;
        loadGalleryAlbumForm();
    });
    document.getElementById('saveGalleryAlbumBtn')?.addEventListener('click', () => {
        saveGalleryAlbum();
    });
    document.getElementById('newGalleryAlbumBtn')?.addEventListener('click', startNewGalleryAlbum);
    document.getElementById('galleryAlbumTitle')?.addEventListener('input', updateGalleryAdminGuidance);
    document.getElementById('deleteGalleryAlbumBtn')?.addEventListener('click', () => {
        deleteSelectedGalleryAlbum();
    });
    const galleryPhotoInput = document.getElementById('galleryPhotoInput');
    const galleryPhotoPicker = document.getElementById('galleryPhotoPicker');

    const openGalleryPhotoPicker = () => {
        if (!galleryPhotoInput) return;
        // Memungkinkan memilih file yang sama dua kali berturut-turut.
        galleryPhotoInput.value = '';
        galleryPhotoInput.click();
    };

    galleryPhotoPicker?.addEventListener('click', openGalleryPhotoPicker);
    galleryPhotoPicker?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openGalleryPhotoPicker();
        }
    });
    galleryPhotoInput?.addEventListener('change', e => {
        const selectedFiles = Array.from(e.target.files || []);
        previewPendingGalleryFiles(selectedFiles);
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
    updateGalleryAdminGuidance();

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


/* ===== MODULE: countdown.js ===== */
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
let eventRemotePromise = null;


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
    if (eventRemotePromise) return eventRemotePromise;

    eventRemoteLoading = true;
    eventRemotePromise = (async () => {
        try {
            const result = await aspirasiApi('eventPublic');
            setEventCache(result.data || null, { loaded: true });
            return getEventConfig();
        } catch (error) {
            console.warn(
                '[Event] Gagal memuat event dari Google Sheets. Fallback sementara digunakan.',
                error
            );
            if (!eventRemoteLoaded) setEventCache(EVENT_FALLBACK, { loaded: false });
            return getEventConfig();
        } finally {
            eventRemoteLoading = false;
            eventRemotePromise = null;
        }
    })();

    return eventRemotePromise;
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


/* ===== MODULE: announcements.js ===== */
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
let announcementAdminPromise = null;
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
    if (announcementAdminPromise) return announcementAdminPromise;

    announcementRemoteLoading = true;
    if (showLoading) showAnnouncementAdminLoading();

    announcementAdminPromise = (async () => {
        try {
            const result = await aspirasiApi('announcementList', { token: aspirasiAdminToken });
            setAnnouncementCache(Array.isArray(result.data) ? result.data : [], { loaded: true });
            return getPublicCards();
        } catch (error) {
            showAnnouncementAdminError(error.message);
            throw error;
        } finally {
            announcementRemoteLoading = false;
            announcementAdminPromise = null;
        }
    })();

    return announcementAdminPromise;
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


/* ===== MODULE: dashboard.js ===== */
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

async function logoutDashboardV9() {
    if (
        !confirm(
            'Keluar dari Dashboard Internal OSIS? Perangkat ini juga tidak akan masuk otomatis lagi.'
        )
    ) {
        return;
    }

    const currentToken = aspirasiAdminToken;
    const trusted = typeof getTrustedDeviceCredentials === 'function' ? getTrustedDeviceCredentials() : null;
    if (trusted && currentToken) {
        try {
            await aspirasiApi('trustedDeviceRevoke', {token: currentToken, deviceId: trusted.deviceId});
        } catch (error) {
            console.warn('[Auth] Gagal mencabut trusted device saat logout:', error.message);
        }
    }
    if (typeof clearTrustedDeviceCredentials === 'function') clearTrustedDeviceCredentials();
    setAspirasiAdminToken('');
    aspirasiRemoteCache = [];
    try { safeStorageRemove(sessionStorage, ADMIN_WORKSPACE_KEY); } catch (error) {}
    delete document.body.dataset.adminWorkspace;
    window.dispatchEvent(new CustomEvent('osis:workspace-logout'));

    const publicUrl = new URL(window.location.href);
    publicUrl.searchParams.delete('view');
    publicUrl.searchParams.delete('role');
    publicUrl.hash = 'top';
    history.replaceState({view:'public'}, '', publicUrl);
    window.dispatchEvent(new CustomEvent('osis:route-change', {detail:{view:'public'}}));

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

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.logoutDashboardV9 = logoutDashboardV9;

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
    const workspaceKey = getAdminWorkspace() || 'general';
    const allowedTabs = new Set(ADMIN_WORKSPACE_ALLOWED_TABS[workspaceKey] || ADMIN_WORKSPACE_ALLOWED_TABS.general);
    const fallbackTab = ADMIN_WORKSPACES[workspaceKey]?.tab || 'aspirations';
    const requestedTab = allowedTabs.has(tab) ? tab : fallbackTab;

    document.querySelectorAll('.dashboard-nav-v14 .tab-button').forEach(btn => {
        const permitted = allowedTabs.has(btn.dataset.tab || '');
        btn.hidden = !permitted;
        const active = permitted && btn.dataset.tab === requestedTab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
        const isPrimary = Boolean(btn.closest('.dashboard-tabs-primary-v14'));
        if (isPrimary) btn.tabIndex = active ? 0 : -1;
        else btn.tabIndex = permitted ? 0 : -1;
        if (active && isPrimary && window.innerWidth <= 600) btn.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
    });
    document.querySelectorAll('.dashboard-panel').forEach(panel => {
        const permitted = allowedTabs.has(panel.dataset.panel || '');
        const active = permitted && panel.dataset.panel === requestedTab;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', String(!active));
    });

    const tools = document.getElementById('dashboardToolsMenuV14');
    const isToolTab = ['notifications', 'security', 'backup', 'qr'].includes(tab);
    if (tools) {
        // Tandai bahwa tab sekunder sedang aktif tanpa memaksa menu tetap terbuka.
        // Ini mencegah popover "Lainnya" menutupi panel setelah pengguna memilih menu.
        tools.classList.toggle('has-active-tool', isToolTab);
    }

    if (tab === 'security' && typeof refreshTrustedDevicesAdmin === 'function' && aspirasiAdminToken) {
        refreshTrustedDevicesAdmin({silent:true}).catch(() => {});
    }
}

function closeDashboardToolsV17() {
    const tools = document.getElementById('dashboardToolsMenuV14');
    if (tools) tools.open = false;
}

function initializeDashboardToolsPopoverV17() {
    const tools = document.getElementById('dashboardToolsMenuV14');
    if (!tools || tools.dataset.popoverReady === '1') return;
    tools.dataset.popoverReady = '1';

    // Klik di luar popover menutup menu, seperti dropdown aplikasi biasa.
    document.addEventListener('pointerdown', (event) => {
        if (tools.open && !tools.contains(event.target)) closeDashboardToolsV17();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && tools.open) {
            closeDashboardToolsV17();
            tools.querySelector('summary')?.focus();
        }
    });
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
    const rows = [['timestamp','name','pengirim','category','message','priority','status','internal_note']];
    list.slice().reverse().forEach(i => rows.push([i.timestamp,i.name,getAspirationSenderType(i.kelas),i.category,i.message,getPriorityMeta(i.priority).label,getStatusMeta(i.status).label,i.internalNote || '']));
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
            theme: safeStorageGet(localStorage, 'theme') || 'light'
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
            safeStorageSet(localStorage, 'theme', payload.data.theme);
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

let qrCodeLibraryPromise = null;
function ensureQrCodeLibrary() {
    if (typeof QRCode === 'function') return Promise.resolve();
    if (qrCodeLibraryPromise) return qrCodeLibraryPromise;

    qrCodeLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.async = true;
        script.onload = () => typeof QRCode === 'function'
            ? resolve()
            : reject(new Error('Library QR tidak tersedia.'));
        script.onerror = () => reject(new Error('Gagal memuat pembuat QR. Periksa koneksi internet.'));
        document.head.appendChild(script);
    }).catch((error) => {
        qrCodeLibraryPromise = null;
        throw error;
    });

    return qrCodeLibraryPromise;
}

async function generateAspirationQr() {
    const input = document.getElementById('qr-url');
    const preview = document.getElementById('qrPreview');
    let value = (input?.value || '').trim();
    if (!value) return setInlineMessage('qrMessage','Masukkan URL website yang sudah dipublish.','error');
    if (!value.includes('#')) value = value.replace(/#.*$/,'') + '#kritik-saran';
    try { new URL(value); } catch (e) { return setInlineMessage('qrMessage','URL tidak valid. Gunakan alamat lengkap yang diawali https://','error'); }

    preview.innerHTML='<span class="small-note"><i class="fa-solid fa-spinner fa-spin"></i> Menyiapkan QR...</span>';
    setInlineMessage('qrMessage','Memuat pembuat QR...');

    try {
        await ensureQrCodeLibrary();
        preview.innerHTML='';
        new QRCode(preview, { text:value, width:210, height:210, colorDark:'#0f172a', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H });
        setInlineMessage('qrMessage','QR berhasil dibuat.','success');
    } catch (error) {
        preview.innerHTML='<span class="small-note">QR tidak tersedia.</span>';
        setInlineMessage('qrMessage', error.message || 'QR tidak dapat dibuat.','error');
    }
}

// Password

function initializeOsisAdmin() {
    document.querySelectorAll('.dashboard-nav-v14 .tab-button').forEach(button => button.addEventListener('click', () => {
        switchOsisTab(button.dataset.tab);
        closeDashboardToolsV17();
    }));

    initializeDashboardToolsPopoverV17();
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
    document.getElementById('refreshTrustedDevicesBtnV22')?.addEventListener('click', () => refreshTrustedDevicesAdmin());
    document.getElementById('revokeAllTrustedDevicesBtnV22')?.addEventListener('click', revokeAllTrustedDevicesAdmin);
    document.getElementById('restoreBackupInput')?.addEventListener('change', e => { if(e.target.files?.[0]) restoreOsisBackup(e.target.files[0]); });
    document.getElementById('generateQrBtn')?.addEventListener('click', generateAspirationQr);

    const qrInput=document.getElementById('qr-url');
    if (qrInput && !qrInput.value) qrInput.value=getDefaultQrUrl();
    populateEventForm();
    renderAdminPublicCards();
    renderAspirasiList();
    switchOsisTab('aspirations');
}


/* ===== MODULE: pwa.js ===== */
/* =========================================================
   PWA — PLATFORM-AWARE INSTALL EXPERIENCE V20
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
const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
const isAndroidDevice = /android/i.test(navigator.userAgent || '');
const isStandalonePwa = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
const PWA_GUIDE_DISMISS_KEY = 'osis-pwa-install-guide-dismissed-v20';
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
        item.className = 'pwa-install-step-v20';

        const number = document.createElement('span');
        number.className = 'pwa-step-number-v20';
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
    try { safeStorageSet(localStorage, PWA_GUIDE_DISMISS_KEY, String(Date.now())); } catch (_) {}
}

function wasPwaGuideRecentlyDismissed() {
    try {
        const value = Number(safeStorageGet(localStorage, PWA_GUIDE_DISMISS_KEY) || 0);
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

    if (isIosDevice) {
        setInstallMode('ios');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS • iPHONE';
        title.textContent = 'Pasang OSIS di iPhone';
        installText.textContent = 'Tambahkan ke Layar Utama supaya OSIS bisa dibuka seperti aplikasi.';
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
        title.textContent = 'Install OSIS';
        installText.textContent = 'Tambahkan OSIS ke perangkat untuk akses lebih cepat.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([]);
        pwaNativeInstallBtn.innerHTML = '<i class="fa-brands fa-android" aria-hidden="true"></i> Install Aplikasi';
        pwaNativeInstallBtn.dataset.action = 'native-install';
        return;
    }

    if (deferredPwaPrompt) {
        setInstallMode('native');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS';
        title.textContent = 'Install OSIS';
        installText.textContent = 'Tambahkan OSIS ke perangkat untuk akses lebih cepat.';
        if (pwaAndroidSummary) pwaAndroidSummary.hidden = false;
        setPwaInstallSteps([]);
        pwaNativeInstallBtn.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i> Install Aplikasi';
        pwaNativeInstallBtn.dataset.action = 'native-install';
        return;
    }

    if (isAndroidDevice) {
        setInstallMode('android-fallback');
        if (pwaInstallKicker) pwaInstallKicker.textContent = 'APLIKASI OSIS • ANDROID';
        title.textContent = 'Pasang OSIS di Android';
        installText.textContent = 'Gunakan menu browser untuk menambahkan OSIS ke layar utama.';
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
        window.closeMobileNav?.();
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
    // Install UI is user-initiated in v6; avoid interrupting reading/forms with an automatic modal.
});

let waitingServiceWorker = null;
let pwaRegistration = null;
let userRequestedPwaReload = false;

const pwaUpdateBar = document.getElementById('pwaUpdateBar');

const PWA_UPDATE_DISMISS_KEY = 'osis_pwa_update_dismissed_v14';

function showPwaUpdate(registration) {
    waitingServiceWorker = registration?.waiting || waitingServiceWorker;

    // Jangan tampilkan kembali jika pengguna sudah memilih "Nanti"
    // untuk service worker yang sama.
    if (localStorage.getItem(PWA_UPDATE_DISMISS_KEY) === 'true') {
        return;
    }

    if (waitingServiceWorker && pwaUpdateBar) {
        pwaUpdateBar.hidden = false;
    }
}

async function registerPwaServiceWorker() {
    if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    try {
        const registration = await navigator.serviceWorker.register('./sw.js', {
            updateViaCache: 'none'
        });

        pwaRegistration = registration;

        // Jika versi baru sudah menunggu, cukup beri pilihan ke pengguna.
        // Tidak ada reload atau aktivasi paksa.
        if (registration.waiting && navigator.serviceWorker.controller) {
            showPwaUpdate(registration);
        }

        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                    showPwaUpdate(registration);
                }
            });
        });

        // Satu pengecekan ringan setelah halaman stabil. Browser juga melakukan
        // pengecekan service worker secara berkala sendiri.
        setTimeout(() => {
            registration.update().catch(() => {});
        }, 6000);
    } catch (err) {
        console.warn('Service worker gagal didaftarkan:', err);
    }
}

navigator.serviceWorker?.addEventListener('controllerchange', () => {
    // Reload HANYA jika pengguna sendiri menekan tombol Perbarui.
    if (!userRequestedPwaReload) return;
    userRequestedPwaReload = false;
    location.reload();
});

document.getElementById('pwaUpdateNowBtn')?.addEventListener('click', () => {
    localStorage.removeItem(PWA_UPDATE_DISMISS_KEY);

    if (!waitingServiceWorker) {
        if (pwaUpdateBar) pwaUpdateBar.hidden = true;
        return;
    }

    userRequestedPwaReload = true;
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
});

document.getElementById('pwaUpdateLaterBtn')?.addEventListener('click', () => {
    localStorage.setItem(PWA_UPDATE_DISMISS_KEY, 'true');
    if (pwaUpdateBar) pwaUpdateBar.hidden = true;
});

window.addEventListener('load', registerPwaServiceWorker);

const bootGallery = () => initializeGallerySystem();
if ('requestIdleCallback' in window) requestIdleCallback(bootGallery, {timeout:1200});
else setTimeout(bootGallery, 250);


/* ===== MODULE: ui.js ===== */
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


/* ===== MODULE: bootstrap.js ===== */
/* =========================================================
   APPLICATION BOOTSTRAP
   ========================================================= */
// Semua initializer dijalankan setelah dependency selesai dimuat.

initializeOsisAdmin();
initializeAnnouncementV11();
initializeCommandCenterV12();
initializeV13Ux();
renderPublicCards();
updateAspirasiCounters();
refreshPublicAspirasiCount();

if (aspirasiForm) {
    const aspCharCount =
        document.getElementById('asp-char-count');

    const updateAspCharacterCount = () => {
        if (!aspPesan || !aspCharCount) return;

        const length = aspPesan.value.length;
        aspCharCount.textContent = `${length} / 2000`;

        if (length >= 1800) {
            aspCharCount.classList.add('near-limit');
        } else {
            aspCharCount.classList.remove('near-limit');
        }
    };

    aspPesan?.addEventListener(
        'input',
        () => {
            updateAspCharacterCount();

            if (aspPesan.value.trim()) {
                aspPesan.setAttribute(
                    'aria-invalid',
                    'false'
                );
                aspError.style.display = 'none';
            }
        }
    );

    updateAspCharacterCount();

    aspirasiForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        aspError.style.display = 'none';
        aspPesan.setAttribute(
            'aria-invalid',
            'false'
        );

        if (!aspPesan.value.trim()) {
            aspError.textContent =
                'Mohon isi pesan aspirasi.';
            aspError.style.display = 'block';
            aspPesan.setAttribute(
                'aria-invalid',
                'true'
            );
            aspPesan.focus();
            return;
        }

        const submitBtn = aspirasiForm.querySelector('button[type="submit"]');
        const originalHtml = submitBtn?.innerHTML || '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '.7';
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Mengirim...';
        }

        const aspName = document.getElementById('asp-nama');
        const aspSender = document.getElementById('asp-kelas');
        const aspCategory = document.getElementById('asp-category');
        if (!aspName || !aspSender || !aspCategory || !aspPesan || !aspError) {
            console.error('[Aspirasi] Markup form tidak lengkap.');
            showAppToast('Form aspirasi belum siap. Muat ulang halaman.');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = originalHtml; }
            return;
        }

        const payload = {
            name: aspName.value.trim() || 'Anonim',
            kelas: aspSender.value.trim() || '-',
            category: aspCategory.value || 'Kritik & Saran untuk OSIS',
            message: aspPesan.value.trim(),
            website: document.getElementById('asp-website')?.value || ''
        };

        try {
            await saveAspirasi(payload);
            aspirasiForm.reset();
            updateAspCharacterCount();
            aspPesan.setAttribute(
                'aria-invalid',
                'false'
            );
            if (aspSuccessModal) aspSuccessModal.style.display = 'flex';
            showAppToast('Aspirasi berhasil dikirim.');
        } catch (err) {
            console.error('[Aspirasi] Kirim gagal:', err);
            aspError.style.display = 'block';
            aspPesan.setAttribute(
                'aria-invalid',
                'true'
            );
            aspError.textContent =
                'Gagal mengirim aspirasi: ' +
                err.message;
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalHtml;
            }
        }
    });
}


/* ===== MODULE: cinematic-v42.js ===== */
/* =========================================================
   OSIS AL-KAHFI — V42 AURORA GATE
   Perspective gate, crest FLIP handoff, school-photo focus,
   nav morph indicator, and staggered section choreography.
   ========================================================= */
(()=>{
  'use strict';

  const root=document.documentElement;
  const body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData=Boolean(navigator.connection?.saveData);
  const lowMemory=Boolean(navigator.deviceMemory&&navigator.deviceMemory<=3);
  const smallScreen=matchMedia('(max-width: 767.98px)').matches;
  const lite=reduced||saveData||lowMemory||smallScreen||root.classList.contains('perf-lite');

  root.classList.add('v42-active');
  root.classList.remove('v41-active','v40-active');

  // V42 has one motion language. Remove older generated scenery so effects do not stack.
  document.querySelectorAll([
    '.motion-canvas-v32','.pointer-aura-v32','.scene-orb-v32','.scene-kicker-v32',
    '.motion-rail-v32','header .hero-orbits-v32','header .hero-scan-v32',
    'header .hero-grid-v31','header .hero-sheen-v31','.v37-liquid-canvas',
    '.v37-liquid-fallback','.v37-hero-wave','.v37-hero-glint',
    'header .v40-hero-lightpass','header .v40-hero-frame','header .v41-hero-veil',
    '.card-arrival-sheen-v32'
  ].join(',')).forEach((node)=>node.remove());

  const header=document.querySelector('header');
  const heroBg=header?.querySelector('.hero-bg-v32');
  if(heroBg&&!heroBg.querySelector('.v40-school-photo')){
    heroBg.classList.add('v40-bg-shell');
    const photo=document.createElement('div');
    photo.className='v40-school-photo';
    photo.setAttribute('aria-hidden','true');
    heroBg.appendChild(photo);
  }else if(heroBg){
    heroBg.classList.add('v40-bg-shell');
  }

  if(header){
    const lens=document.createElement('span');
    lens.className='v42-hero-lens';
    lens.setAttribute('aria-hidden','true');
    header.appendChild(lens);

    const horizon=document.createElement('span');
    horizon.className='v42-hero-horizon';
    horizon.setAttribute('aria-hidden','true');
    header.appendChild(horizon);
  }

  const loader=document.getElementById('v42-loader');
  const meter=document.getElementById('v42-meter-fill');
  const status=document.getElementById('v42-status');
  const emblem=document.getElementById('v42-emblem');
  const emblemImage=emblem?.querySelector('img');
  const targetLogo=header?.querySelector('.hero-logo-osis-v39 .logo-img');

  let heroLive=false;
  const releaseHero=()=>{
    if(heroLive) return;
    heroLive=true;
    body.classList.add('v40-hero-live','v42-hero-live');
    body.classList.remove('v42-loader-lock');
    document.dispatchEvent(new CustomEvent('osis:hero-live'));
  };

  const landLogo=()=>body.classList.add('v42-logo-landed');

  const morphCrest=()=>{
    if(!emblemImage||!targetLogo||reduced){landLogo();return Promise.resolve();}
    const from=emblemImage.getBoundingClientRect();
    const to=targetLogo.getBoundingClientRect();
    if(!from.width||!to.width){landLogo();return Promise.resolve();}

    const dx=(to.left+to.width/2)-(from.left+from.width/2);
    const dy=(to.top+to.height/2)-(from.top+from.height/2);
    const scale=Math.max(.2,Math.min(1.4,to.width/from.width));
    loader?.classList.add('is-morphing');

    const anim=emblemImage.animate([
      {transform:'translate3d(0,0,18px) scale(1)',filter:'brightness(1)',opacity:1,offset:0},
      {transform:`translate3d(${dx*.42}px,${dy*.32}px,90px) scale(${Math.max(scale,1.04)})`,filter:'brightness(1.35)',opacity:1,offset:.38},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,filter:'brightness(1)',opacity:1,offset:.88},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,filter:'brightness(1)',opacity:0,offset:1}
    ],{
      duration:lite?650:1080,
      easing:'cubic-bezier(.16,1,.3,1)',
      fill:'forwards'
    });

    return anim.finished.catch(()=>{}).then(()=>{landLogo();});
  };

  if(loader){
    body.classList.add('v42-loader-lock');
    body.classList.remove('v40-hero-live','v42-hero-live','v42-logo-landed');

    const minDuration=reduced?520:(lite?1500:3300);
    const hardLimit=reduced?900:(lite?2800:5400);
    const started=performance.now();
    let loaded=document.readyState==='complete';
    let finishing=false;
    if(!loaded) addEventListener('load',()=>{loaded=true;},{once:true});

    const phases=[
      [0,'MENYIAPKAN RUANG'],
      [.24,'MENGUNCI IDENTITAS'],
      [.48,'MENYELARASKAN VISUAL'],
      [.72,'MEMBANGUN MOMENTUM'],
      [.9,'SIAP MEMBUKA']
    ];

    const update=(ratio)=>{
      const p=Math.max(0,Math.min(1,ratio));
      meter?.style.setProperty('transform',`scaleX(${p.toFixed(4)})`);
      if(status){
        let label=phases[0][1];
        for(const [at,text] of phases){if(p>=at) label=text;}
        status.textContent=label;
      }
      if(p>.18) loader.classList.add('is-calibrating');
      if(p>.72) loader.classList.add('is-armed');
    };

    const finish=()=>{
      if(finishing) return;
      finishing=true;
      update(1);
      loader.classList.add('is-armed');
      const charge=reduced?20:(lite?90:260);
      setTimeout(()=>{
        body.classList.add('v42-reveal-start');
        loader.classList.add('is-breaking');
        // The school photo starts focusing before the gate moves, so the center reveal has depth.
        setTimeout(()=>loader.classList.add('is-opening'),reduced?30:(lite?110:230));
        setTimeout(()=>{
          morphCrest();
          releaseHero();
        },reduced?40:(lite?260:510));
        setTimeout(()=>body.classList.add('v42-reveal-complete'),reduced?180:(lite?900:1550));
        setTimeout(()=>{
          landLogo();
          if(loader?.dataset.reactLoader!=='true') loader.remove();
          body.classList.remove('v42-reveal-start');
        },reduced?260:(lite?1250:2050));
      },charge);
    };

    const tick=(now)=>{
      const elapsed=now-started;
      const raw=Math.min(1,elapsed/minDuration);
      // Deliberate build-up: quick initial response, slower tension before the break.
      const eased=raw<.68
        ? .62*(1-Math.pow(1-raw/.68,2.25))
        : .62+((raw-.68)/.32)*.38;
      const normalized=Math.max(0,Math.min(1,eased));
      const waiting=elapsed>=minDuration&&!loaded&&elapsed<hardLimit;
      update(waiting?Math.min(.94,normalized):Math.min(.997,normalized));
      if((elapsed>=minDuration&&loaded)||elapsed>=hardLimit){finish();return;}
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }else{
    landLogo();
    releaseHero();
  }

  /* ---------- Hero camera: smooth inertia, low amplitude ---------- */
  if(header&&heroBg&&!lite){
    let tx=0,ty=0,cx=0,cy=0,raf=0,visible=true;
    const paint=()=>{
      raf=0;
      cx+=(tx-cx)*.055;
      cy+=(ty-cy)*.055;
      header.style.setProperty('--v42-depth-x',`${cx.toFixed(2)}px`);
      header.style.setProperty('--v42-depth-y',`${cy.toFixed(2)}px`);
      header.style.setProperty('--v42-spot-x',`${(50+cx*.55).toFixed(2)}%`);
      header.style.setProperty('--v42-spot-y',`${(40+cy*.7).toFixed(2)}%`);
      if(Math.abs(tx-cx)>.03||Math.abs(ty-cy)>.03) raf=requestAnimationFrame(paint);
    };
    const schedule=()=>{if(!raf&&visible) raf=requestAnimationFrame(paint);};
    if(fine){
      header.addEventListener('pointermove',(event)=>{
        const r=header.getBoundingClientRect();
        const nx=(event.clientX-r.left)/Math.max(1,r.width)-.5;
        const ny=(event.clientY-r.top)/Math.max(1,r.height)-.5;
        tx=Math.max(-6,Math.min(6,nx*12));
        ty=Math.max(-4,Math.min(4,ny*8));
        schedule();
      },{passive:true});
      header.addEventListener('pointerleave',()=>{tx=0;ty=0;schedule();},{passive:true});
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(([entry])=>{visible=Boolean(entry?.isIntersecting);if(visible)schedule();},{threshold:.02}).observe(header);
    }
  }

  /* ---------- One morphing navigation pill ---------- */
  const nav=document.querySelector('#root > nav[aria-label="Navigasi utama"]');
  const navLinksWrap=nav?.querySelector('.nav-links');
  const sectionIds=['struktur','visi-misi','proker','pengumuman','galeri','kritik-saran','kontak'];
  const navMap=new Map();
  sectionIds.forEach((id)=>{
    const link=navLinksWrap?.querySelector(`a[href="#${id}"]`);
    if(link) navMap.set(id,link);
  });
  let currentNav=[...navMap.values()][0]||null;
  let pill=null;

  const movePill=(target)=>{
    if(!pill||!navLinksWrap||!target||innerWidth<=900) return;
    const host=navLinksWrap.getBoundingClientRect();
    const rect=target.getBoundingClientRect();
    navLinksWrap.style.setProperty('--v42-nav-x',`${(rect.left-host.left).toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-y',`${(rect.top-host.top).toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-w',`${rect.width.toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-h',`${rect.height.toFixed(1)}px`);
    pill.classList.add('is-visible');
  };

  if(navLinksWrap&&fine){
    pill=document.createElement('span');
    pill.className='v42-nav-pill';
    pill.setAttribute('aria-hidden','true');
    navLinksWrap.prepend(pill);
    [...navLinksWrap.querySelectorAll('a,button')].forEach((item)=>item.addEventListener('pointerenter',()=>movePill(item),{passive:true}));
    navLinksWrap.addEventListener('pointerleave',()=>movePill(currentNav),{passive:true});
    addEventListener('resize',()=>movePill(currentNav),{passive:true});
  }

  /* ---------- Section choreography + card staggers ---------- */
  const sections=sectionIds.map((id)=>document.getElementById(id)).filter(Boolean);
  sections.forEach((section)=>section.classList.add('v42-section'));

  const cardSelector=[
    '.leadership-card-v12','.board-support-card-v12','.division-card-v12',
    '#visi-misi .card-box','#proker .card-box','#pengumuman .card-box',
    '.gallery-item','.contact-card-v13','.social-hub-v13'
  ].join(',');
  const cardSeen=new WeakSet();
  let cardObserver=null;

  const decorate=(card)=>{
    if(!(card instanceof Element)||cardSeen.has(card)||!card.matches(cardSelector)) return;
    cardSeen.add(card);
    card.classList.add('v42-card');
    const siblings=[...card.parentElement?.children||[]].filter((node)=>node instanceof Element&&node.matches(cardSelector));
    const index=Math.max(0,siblings.indexOf(card));
    card.style.setProperty('--v42-stagger',`${Math.min(420,index*72)}ms`);
    if(cardObserver) cardObserver.observe(card); else card.classList.add('v42-card-live');

    if(fine&&!lite){
      card.addEventListener('pointermove',(event)=>{
        const r=card.getBoundingClientRect();
        const x=Math.max(0,Math.min(100,(event.clientX-r.left)/Math.max(1,r.width)*100));
        const y=Math.max(0,Math.min(100,(event.clientY-r.top)/Math.max(1,r.height)*100));
        card.style.setProperty('--v42-card-x',`${x.toFixed(1)}%`);
        card.style.setProperty('--v42-card-y',`${y.toFixed(1)}%`);
      },{passive:true});
    }
  };

  if('IntersectionObserver' in window&&!reduced){
    cardObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('v42-card-live');
        cardObserver.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  }
  document.querySelectorAll(cardSelector).forEach(decorate);

  const mutations=new MutationObserver((records)=>records.forEach((record)=>record.addedNodes.forEach((node)=>{
    if(!(node instanceof Element)) return;
    decorate(node);
    node.querySelectorAll?.(cardSelector).forEach(decorate);
  })));
  mutations.observe(document.body,{childList:true,subtree:true});

  if('IntersectionObserver' in window&&!reduced){
    const sectionObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('v42-in-view');
        const link=navMap.get(entry.target.id);
        if(link){currentNav=link;movePill(link);}
      });
    },{threshold:.22,rootMargin:'-12% 0px -38% 0px'});
    sections.forEach((section)=>sectionObserver.observe(section));
  }else{
    sections.forEach((section)=>section.classList.add('v42-in-view'));
  }

  let scrollFrame=0;
  const paintScroll=()=>{
    scrollFrame=0;
    body.classList.toggle('v40-scrolled',scrollY>36);
    const vh=Math.max(innerHeight,1);
    if(!smallScreen){
      sections.forEach((section)=>{
        const r=section.getBoundingClientRect();
        if(r.bottom<0||r.top>vh) return;
        const norm=Math.max(-1,Math.min(1,(r.top+r.height/2-vh/2)/vh));
        section.style.setProperty('--v42-section-shift',`${(-norm*18).toFixed(1)}px`);
      });
    }
  };
  const scheduleScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);};
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});
  scheduleScroll();

  /* ---------- Footer gets a deliberate final arrival ---------- */
  const footer=document.querySelector('.footer-v13');
  if(footer&&'IntersectionObserver' in window&&!reduced){
    new IntersectionObserver(([entry],observer)=>{
      if(!entry?.isIntersecting) return;
      footer.classList.add('v40-footer-live');
      observer.disconnect();
    },{threshold:.12}).observe(footer);
  }
})();

/* ===== MODULE: mobile-experience-v45.1.js ===== */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const nav = document.querySelector('#root > nav[aria-label="Navigasi utama"]');
  const menu = document.getElementById('nav-links');
  const menuButton = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('nav-overlay');
  const mobileQuery = matchMedia('(max-width: 1100px)');

  if (!nav || !menu || !menuButton || !overlay) return;
  // React V4.3 owns compact/mobile navigation. Avoid attaching a second
  // controller that can race the React state and make the hamburger unreliable.
  if (nav.dataset.reactNav === 'true') return;

  // Stable viewport fallback for older mobile browsers; CSS uses svh/dvh first.
  const syncViewport = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--app-vh', `${height * 0.01}px`);
  };
  syncViewport();
  window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
  addEventListener('orientationchange', () => setTimeout(syncViewport, 120), { passive: true });

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const renderMenuState = (open, { focusMenu = false, restoreFocus = false } = {}) => {
    const shouldOpen = Boolean(open && mobileQuery.matches);

    menu.classList.toggle('active', shouldOpen);
    overlay.classList.toggle('active', shouldOpen);
    body.classList.toggle('mobile-nav-open', shouldOpen);

    menuButton.setAttribute('aria-expanded', String(shouldOpen));
    menuButton.setAttribute('aria-label', shouldOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    overlay.setAttribute('aria-hidden', String(!shouldOpen));

    const icon = menuButton.querySelector('i');
    icon?.classList.toggle('fa-bars', !shouldOpen);
    icon?.classList.toggle('fa-xmark', shouldOpen);

    if (shouldOpen && focusMenu) {
      requestAnimationFrame(() => menu.querySelector(focusableSelector)?.focus({ preventScroll: true }));
    } else if (!shouldOpen && restoreFocus) {
      requestAnimationFrame(() => menuButton.focus({ preventScroll: true }));
    }
  };

  const isOpen = () => menu.classList.contains('active');
  const closeMenu = (restoreFocus = false) => renderMenuState(false, { restoreFocus });

  menuButton.addEventListener('click', () => {
    if (!mobileQuery.matches) return;
    renderMenuState(!isOpen(), { focusMenu: false });
  });

  overlay.addEventListener('click', () => closeMenu(false));

  menu.addEventListener('click', (event) => {
    const action = event.target instanceof Element ? event.target.closest('a, button') : null;
    if (!action || !mobileQuery.matches) return;
    // Close after the action has received the click; modal/PWA handlers still execute normally.
    closeMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (!mobileQuery.matches || !isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    // Keep keyboard focus inside the open bottom sheet.
    if (event.key === 'Tab') {
      const items = [...menu.querySelectorAll(focusableSelector)].filter((el) => !el.hasAttribute('hidden') && el.getClientRects().length);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  mobileQuery.addEventListener?.('change', () => {
    // Never leave a mobile-only state behind when crossing into tablet/desktop.
    if (!mobileQuery.matches) closeMenu(false);
    else renderMenuState(false);
  });

  // Condense the sticky bar after a small scroll without hiding it.
  let lastY = scrollY;
  let frame = 0;
  const paintScroll = () => {
    frame = 0;
    const y = scrollY;
    nav.classList.toggle('mobile-nav-condensed', mobileQuery.matches && y > 24);
    body.classList.toggle('is-scrolling-down-v45', mobileQuery.matches && y > lastY && y > 120);
    lastY = y;
  };
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(paintScroll);
  }, { passive: true });

  renderMenuState(false);
  paintScroll();
})();


/* ===== React compatibility handshake ===== */
document.documentElement.dataset.legacyCoreBooted = 'true';
document.dispatchEvent(new CustomEvent('osis:legacy-app-booted'));
