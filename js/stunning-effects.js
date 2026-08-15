/* ============================================================
   OSIS REDESIGN — Stunning Interactive Effects
   Efek memukau: partikel, 3D tilt, magnetik, paralaks, dll
   ============================================================ */

(function() {
    'use strict';

    // ============================================================
    // LOADING SCREEN
    // ============================================================
    function initLoadingScreen() {
        // Skip jika halaman sudah punya loading screen bawaan (mis. cinematic loader)
        const existingLoaderOnPage = document.querySelector('[id*="loader"], .loading-screen, [class*="loader"]');
        if (existingLoaderOnPage) return;

        const existing = document.querySelector('.loading-screen');
        if (existing) return;

        const loading = document.createElement('div');
        loading.className = 'loading-screen';
        loading.innerHTML = `
            <img src="images/logo-osis.png" alt="Loading..." class="loading-logo" onerror="this.style.display='none'">
            <div class="loading-bar"><div class="loading-bar-fill"></div></div>
        `;
        document.body.appendChild(loading);

        window.addEventListener('load', function() {
            setTimeout(function() {
                loading.classList.add('hidden');
                setTimeout(function() { loading.remove(); }, 800);
            }, 600);
        });

        // Fallback: hide after max 4s
        setTimeout(function() {
            if (!loading.classList.contains('hidden')) {
                loading.classList.add('hidden');
                setTimeout(function() { loading.remove(); }, 800);
            }
        }, 4000);
    }

    // ============================================================
    // FLOATING ORBS
    // ============================================================
    function initFloatingOrbs() {
        const existing = document.querySelector('.floating-orb');
        if (existing) return;

        const container = document.createElement('div');
        container.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 4; i++) {
            const orb = document.createElement('div');
            orb.className = 'floating-orb';
            container.appendChild(orb);
        }
        document.body.appendChild(container);
    }

    // ============================================================
    // PERFORMANCE MONITORING
    // Deteksi perangkat low-end, otomatis kurangi efek berat
    // ============================================================
    function getDeviceTier() {
        // 0 = high-end, 1 = medium, 2 = low-end
        try {
            const cores = navigator.hardwareConcurrency || 4;
            const mem = navigator.deviceMemory || 4;
            if (cores <= 2 || mem <= 2) return 2;
            if (cores <= 4 || mem <= 4) return 1;
            return 0;
        } catch (_) { return 1; }
    }

    var deviceTier = (function() {
        var tier = getDeviceTier();
        if (tier >= 1) document.body.setAttribute('data-low-power', 'true');
        if (tier === 2) document.body.setAttribute('data-extreme-low', 'true');
        return tier;
    })();

    // ============================================================
    // PARTICLE SYSTEM FOR HERO
    // ============================================================
    function initHeroParticles() {
        const header = document.querySelector('header');
        if (!header) return;

        const existing = header.querySelector('.hero-particles-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'hero-particles-container';
        container.setAttribute('aria-hidden', 'true');

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const baseCount = window.innerWidth < 768 ? 12 : 26;
        const particleCount = isReduced ? 0 : (deviceTier === 2 ? 4 : deviceTier === 1 ? baseCount * 0.6 : baseCount);

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'hero-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (2 + Math.random() * 6) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (8 + Math.random() * 12) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particle.style.opacity = 0.2 + Math.random() * 0.5;
            container.appendChild(particle);
        }

        header.appendChild(container);
    }

    // ============================================================
    // SCROLL REVEAL (Intersection Observer)
    // ============================================================
    function initScrollReveal() {
        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');

        if (!elements.length) return;

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(function(el) {
            observer.observe(el);
        });
    }

    // ============================================================
    // 3D TILT + DYNAMIC LIGHT SHINE ON CARDS
    // Kartu miring mengikuti kursor dengan kilau cahaya dinamis
    // ============================================================
    function initTiltEffect() {
        // Nonaktifkan di HP/tablet — sentuhan bikin efek miring yang nggak diinginkan
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const cards = document.querySelectorAll('.card-box, .leadership-card-v12, .division-card-v12, .contact-card-v13, .gallery-item');

        if (!cards.length) return;

        cards.forEach(function(card) {
            // Overlay cahaya yang mengikuti posisi kursor
            const shine = document.createElement('div');
            shine.className = 'tilt-shine';
            shine.setAttribute('aria-hidden', 'true');
            card.appendChild(shine);

            card.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const px = x / rect.width;
                const py = y / rect.height;

                // Kemiringan 3D halus berdasarkan posisi kursor (7° maksimal)
                const rotateX = (0.5 - py) * 7;
                const rotateY = (px - 0.5) * 7;

                card.style.transform =
                    'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px) scale(1.01)';
                card.style.transition = 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)';
                card.style.boxShadow = '0 20px 45px rgba(37, 99, 235, 0.13)';

                // Kilau cahaya halus mengikuti kursor
                shine.style.opacity = '0.8';
                shine.style.background =
                    'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(255,255,255,0.2), transparent 60%)';
            });

            card.addEventListener('mouseleave', function() {
                card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0)';
                card.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
                card.style.boxShadow = '';
                shine.style.opacity = '0';
            });
        });
    }

    // ============================================================
    // MAGNETIC BUTTON EFFECT
    // ============================================================
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.hero-btn, .aspirasi-btn');

        buttons.forEach(function(btn) {
            btn.addEventListener('mousemove', function(e) {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const strength = 12;
                const moveX = (x / rect.width) * strength;
                const moveY = (y / rect.height) * strength;

                btn.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
                btn.style.transition = 'transform 0.15s ease-out';
            });

            btn.addEventListener('mouseleave', function() {
                btn.style.transform = 'translate(0, 0)';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
        });
    }

    // ============================================================
    // CURSOR GLOW FOLLOWER (Desktop only)
    // ============================================================
    function initCursorGlow() {
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isTouch || isReduced) return;

        const existingGlow = document.getElementById('cursorGlow');
        if (existingGlow) return;

        const glow = document.createElement('div');
        glow.id = 'cursorGlow';
        document.body.appendChild(glow);

        let mouseX = -500, mouseY = -500;
        let currentX = -500, currentY = -500;

        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            glow.classList.add('visible');
        });

        document.addEventListener('mouseleave', function() {
            glow.classList.remove('visible');
        });

        // Smooth follow
        function animateGlow() {
            currentX += (mouseX - currentX) * 0.08;
            currentY += (mouseY - currentY) * 0.08;
            glow.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) translate(-50%, -50%)';
            requestAnimationFrame(animateGlow);
        }
        animateGlow();

        // Hide on interactive elements
        document.addEventListener('mouseover', function(e) {
            const target = e.target;
            const isInteractive = target.matches('a, button, input, select, textarea, .card-box, .gallery-item') ||
                target.closest('a, button, input, select, textarea, .card-box, .gallery-item');
            glow.style.opacity = isInteractive ? '0' : '';
        });
    }

    // ============================================================
    // PARALLAX ON SCROLL
    // ============================================================
    function initParallax() {
        const hero = document.querySelector('header');
        if (!hero) return;

        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            if (scrollY < window.innerHeight) {
                hero.style.backgroundPositionY = scrollY * 0.4 + 'px';
            }
        }, { passive: true });
    }

    // ============================================================
    // SMOOTH REVEAL ON IMAGE LOAD
    // ============================================================
    function initImageReveal() {
        document.querySelectorAll('.logo-img').forEach(function(img) {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', function() {
                    img.classList.add('loaded');
                });
            }
        });
    }

    // ============================================================
    // SPARKLE ON CLICK
    // ============================================================
    function initSparkles() {
        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReduced) return;

        document.addEventListener('click', function(e) {
            // Only on hero section
            const header = document.querySelector('header');
            if (!header || !header.contains(e.target)) return;

            const container = document.createElement('div');
            container.className = 'sparkle-container';
            container.style.position = 'fixed';
            container.style.left = '0';
            container.style.top = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '9999';
            document.body.appendChild(container);

            var colors = ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#f472b6'];

            for (var i = 0; i < 12; i++) {
                var sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                var size = 2 + Math.random() * 4;
                sparkle.style.width = size + 'px';
                sparkle.style.height = size + 'px';
                sparkle.style.left = (e.clientX + (Math.random() - 0.5) * 80) + 'px';
                sparkle.style.top = (e.clientY + (Math.random() - 0.5) * 80) + 'px';
                sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
                sparkle.style.animationDuration = (0.5 + Math.random() * 1) + 's';
                sparkle.style.boxShadow = '0 0 6px ' + sparkle.style.background;
                container.appendChild(sparkle);
            }

            setTimeout(function() { container.remove(); }, 2000);
        });
    }

    // ============================================================
    // NAVBAR SCROLL EFFECT
    // ============================================================
    function initNavbarScroll() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        let lastScroll = 0;

        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;

            if (scrollY > 100) {
                nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
            } else {
                nav.style.boxShadow = 'var(--shadow)';
            }

            // Hide/show on scroll (optional)
            if (scrollY > lastScroll && scrollY > 300) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }

            nav.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

            lastScroll = scrollY;
        }, { passive: true });
    }

    // ============================================================
    // COUNTER ANIMATION WITH PULSE
    // ============================================================
    function initCounterAnimation() {
        var counters = document.querySelectorAll('.stat-number[data-target]');
        if (!counters.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var counter = entry.target;
                    var target = parseInt(counter.getAttribute('data-target')) || 0;
                    var current = 0;
                    var increment = Math.max(1, Math.floor(target / 40));
                    var duration = 1500;
                    var stepTime = Math.max(10, Math.floor(duration / (target / increment)));

                    var timer = setInterval(function() {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        counter.textContent = current;
                        counter.classList.remove('counting');
                        void counter.offsetWidth; // reflow
                        counter.classList.add('counting');
                    }, stepTime);

                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function(c) { observer.observe(c); });
    }

    // ============================================================
    // SCROLL INDICATOR
    // ============================================================
    function initScrollIndicator() {
        var header = document.querySelector('header');
        if (!header) return;
        if (document.querySelector('.scroll-indicator')) return;

        var indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.innerHTML = 'Scroll <span class="scroll-dot"></span>';

        header.appendChild(indicator);

        // Hide when scrolled
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateX(-50%) translateY(20px)';
                indicator.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            } else {
                indicator.style.opacity = '1';
                indicator.style.transform = 'translateX(-50%) translateY(0)';
            }
        }, { passive: true });
    }

    // ============================================================
    // GRADIENT MESH
    // ============================================================
    function initGradientMesh() {
        if (document.querySelector('.gradient-mesh')) return;
        var mesh = document.createElement('div');
        mesh.className = 'gradient-mesh';
        mesh.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(mesh, document.body.firstChild);
    }

    // ============================================================
    // SECTION TRANSITION DIVIDERS
    // ============================================================
    function addSectionDividers() {
        document.querySelectorAll('.container').forEach(function(container, index) {
            if (index === 0) return; // skip first
            container.classList.add('section-transition');
        });
    }

    // ============================================================
    // ADD REVEAL CLASSES TO EXISTING ELEMENTS
    // ============================================================
    function addRevealClasses() {
        // Add reveal to section titles that don't already have AOS
        document.querySelectorAll('.section-title').forEach(function(title) {
            if (!title.hasAttribute('data-aos')) {
                title.classList.add('reveal');
            }
        });

        // Add reveal to card grids
        document.querySelectorAll('.grid-layout, .contact-grid-v13, .social-hub-v13').forEach(function(grid) {
            grid.classList.add('reveal-stagger');
        });

        // Add reveal-scale to specific elements
        document.querySelectorAll('.countdown-box, .aspirasi-card').forEach(function(el) {
            if (!el.hasAttribute('data-aos')) {
                el.classList.add('reveal-scale');
            }
        });
    }

    // ============================================================
    // PERFORMANCE: Debounced resize handler
    // ============================================================
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Re-init particles for new size
            initHeroParticles();
        }, 300);
    }, { passive: true });

    // ============================================================
    // SCROLL PROGRESS BAR
    // ============================================================
    function initScrollProgress() {
        if (document.getElementById('scrollProgress')) return;

        const bar = document.createElement('div');
        bar.id = 'scrollProgress';
        document.body.appendChild(bar);

        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = progress + '%';
        }, { passive: true });
    }

    // ============================================================
    // LIVE CLOCK DI FOOTER
    // ============================================================
    function initLiveClock() {
        var clockEl = document.getElementById('liveClock');
        if (!clockEl) return;

        function updateClock() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            clockEl.innerHTML =
                '<i class="fa-solid fa-circle" aria-hidden="true"></i> ' +
                '<span>' + hours + '</span>' +
                '<span class="clock-separator">:</span>' +
                '<span>' + minutes + '</span>' +
                '<span class="clock-separator">:</span>' +
                '<span>' + seconds + '</span>' +
                ' <small>WIB</small>';
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ============================================================
    // INIT ALL EFFECTS
    // ============================================================
    function initStunningEffects() {
        // Core ambient effects
        initGradientMesh();
        initFloatingOrbs();
        initLoadingScreen();

        // Hero effects
        initHeroParticles();
        initParallax();
        initScrollIndicator();
        initSparkles();

        // Interaction effects
        initCursorGlow();
        initMagneticButtons();

        // Card effects
        initTiltEffect();

        // Scroll effects
        addRevealClasses();
        initScrollReveal();
        initNavbarScroll();
        initCounterAnimation();

        // Visual polish
        initImageReveal();
        addSectionDividers();

        // Utility
        initScrollProgress();
        initLiveClock();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStunningEffects);
    } else {
        initStunningEffects();
    }

})();