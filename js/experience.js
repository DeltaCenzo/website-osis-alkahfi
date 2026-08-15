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
