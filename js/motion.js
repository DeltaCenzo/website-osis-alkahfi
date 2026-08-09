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

    /* V30 ambient layer. It is decorative only and uses transform-based
       motion so the navy background feels alive without moving the cards. */
    if (!perfLite) {
        const ambient = document.createElement('div');
        ambient.className = 'ambient-motion-v30';
        ambient.setAttribute('aria-hidden', 'true');
        document.body.prepend(ambient);
    }

    /* Thin scroll progress indicator. Updates are batched with rAF to avoid
       doing layout work for every native scroll event. */
    const progress = document.createElement('div');
    progress.className = 'scroll-progress-v30';
    progress.setAttribute('aria-hidden', 'true');
    const progressFill = document.createElement('span');
    progress.appendChild(progressFill);
    document.body.appendChild(progress);

    let progressFrame = 0;
    const updateProgress = () => {
        progressFrame = 0;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const ratio = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        progressFill.style.transform = `scaleX(${ratio})`;
    };
    const scheduleProgress = () => {
        if (progressFrame) return;
        progressFrame = window.requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress, { passive: true });
    scheduleProgress();

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
                { opacity: 0, transform: startTransform, filter: 'blur(2px)' },
                { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0)' }
            ],
            {
                duration,
                delay,
                easing: 'cubic-bezier(.2,.72,.2,1)',
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
                { duration: 300, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'forwards' }
            ).finished;
        } catch (_) {}

        /* Clear WAAPI fill so CSS/theme states remain authoritative. */
        heroText.getAnimations().forEach((animation) => animation.cancel());
        schedulePhrase();
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) schedulePhrase();
    });

    schedulePhrase();
})();
