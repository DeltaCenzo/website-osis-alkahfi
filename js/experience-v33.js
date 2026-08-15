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
    const perfLite = reducedMotion || saveData || constrainedMemory || root.classList.contains('perf-lite');

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
    const mainNav = document.querySelector('body > nav');
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
