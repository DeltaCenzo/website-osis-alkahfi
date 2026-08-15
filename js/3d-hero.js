/* ============================================================
   OSIS REDESIGN — 3D HERO SCENE (Three.js)
   Ribuan partikel 3D + geometri mengambang, parallax mouse,
   scroll depth, dan auto-pause saat tidak terlihat.
   ============================================================ */
(function() {
    'use strict';

    var header = document.querySelector('header');
    if (!header) return;

    // Skip jika user suka reduced-motion atau Three.js gagal dimuat
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof THREE === 'undefined') return;

    var container = null;
    var scene, camera, renderer, clock;
    var particleSystem = null;
    var shapes = [];
    var mouseX = 0, mouseY = 0;
    var sectionVisible = true, pageVisible = true;

    try {
        init();
    } catch (err) {
        console.warn('[3D-Hero] Gagal menginisialisasi scene:', err);
        if (container && container.parentNode) container.parentNode.removeChild(container);
        return;
    }

    // ------------------------------------------------------------
    // INIT
    // ------------------------------------------------------------
    function init() {
        container = document.createElement('div');
        container.id = 'hero3d';
        container.setAttribute('aria-hidden', 'true');
        header.appendChild(container);

        var w = header.clientWidth || window.innerWidth;
        var h = header.clientHeight || 720;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
        camera.position.set(0, 0, 30);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        addLights();
        buildParticles();
        buildShapes();

        header.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('visibilitychange', onVisibility);

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) { sectionVisible = entry.isIntersecting; });
            }, { threshold: 0.01 });
            io.observe(header);
        }

        clock = new THREE.Clock();
        animate();
    }

    // ------------------------------------------------------------
    // LIGHTS
    // ------------------------------------------------------------
    function addLights() {
        var ambient = new THREE.AmbientLight(0x8899bb, 1.0);
        scene.add(ambient);

        var light1 = new THREE.PointLight(0x3b82f6, 1.6, 80);
        light1.position.set(-16, 8, 12);
        scene.add(light1);

        var light2 = new THREE.PointLight(0x8b5cf6, 1.4, 80);
        light2.position.set(16, -8, 10);
        scene.add(light2);

        var light3 = new THREE.PointLight(0xf59e0b, 1.0, 80);
        light3.position.set(0, 14, 16);
        scene.add(light3);
    }

    // ------------------------------------------------------------
    // PARTICLES — 3D starfield berwarna
    // ------------------------------------------------------------
    function buildParticles() {
        var count = window.innerWidth < 768 ? 550 : 1200;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);

        var palette = [
            new THREE.Color(0x3b82f6),
            new THREE.Color(0x8b5cf6),
            new THREE.Color(0xf59e0b),
            new THREE.Color(0x34d399),
            new THREE.Color(0xffffff)
        ];

        for (var i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 95;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 58;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 52;

            var c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3]     = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var mat = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        particleSystem = new THREE.Points(geo, mat);
        scene.add(particleSystem);
    }

    // ------------------------------------------------------------
    // SHAPES — geometri mengambang dengan material glow
    // ------------------------------------------------------------
    function buildShapes() {
        var defs = [
            {
                geo: new THREE.IcosahedronGeometry(2.7, 0),
                pos: [-11, 5, -7],
                color: 0x3b82f6, emit: 0x1e40af,
                wire: true,
                rot: [0.004, 0.006, 0.002],
                amp: 1.2, speed: 0.5, phase: 0
            },
            {
                geo: new THREE.TorusKnotGeometry(2.1, 0.65, 100, 14),
                pos: [11, -4, -9],
                color: 0x8b5cf6, emit: 0x6d28d9,
                wire: false,
                rot: [-0.005, 0.007, 0.003],
                amp: 1.5, speed: 0.4, phase: 1.2
            },
            {
                geo: new THREE.TorusGeometry(2.3, 0.85, 24, 80),
                pos: [14, 6, -13],
                color: 0xf59e0b, emit: 0xb45309,
                wire: false,
                rot: [0.006, 0.0, 0.004],
                amp: 1.0, speed: 0.6, phase: 2.4
            },
            {
                geo: new THREE.OctahedronGeometry(2.3, 0),
                pos: [-13, -6, -11],
                color: 0x34d399, emit: 0x059669,
                wire: true,
                rot: [0.005, -0.004, 0.003],
                amp: 1.3, speed: 0.45, phase: 0.8
            },
            {
                geo: new THREE.IcosahedronGeometry(1.4, 0),
                pos: [0, 9, -16],
                color: 0x60a5fa, emit: 0x2563eb,
                wire: false,
                rot: [0.008, 0.006, 0.002],
                amp: 1.6, speed: 0.7, phase: 1.8
            },
            {
                geo: new THREE.TorusGeometry(2.0, 0.3, 16, 60),
                pos: [-2, -8, -6],
                color: 0xf472b6, emit: 0xdb2777,
                wire: false,
                rot: [0.004, 0.008, 0.002],
                amp: 1.1, speed: 0.55, phase: 3.0
            }
        ];

        defs.forEach(function(d) {
            var solid = new THREE.Mesh(
                d.geo,
                new THREE.MeshStandardMaterial({
                    color: d.color,
                    emissive: d.emit,
                    emissiveIntensity: 0.4,
                    metalness: 0.55,
                    roughness: 0.22,
                    transparent: true,
                    opacity: 0.8,
                    flatShading: false
                })
            );
            solid.position.set(d.pos[0], d.pos[1], d.pos[2]);

            var wire = null;
            if (d.wire) {
                wire = new THREE.Mesh(
                    d.geo.clone(),
                    new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.32
                    })
                );
                wire.position.copy(solid.position);
                wire.scale.set(1.25, 1.25, 1.25);
            }

            scene.add(solid);
            if (wire) scene.add(wire);

            shapes.push({
                mesh: solid,
                wire: wire,
                baseY: d.pos[1],
                rotSpeed: d.rot,
                floatAmp: d.amp,
                floatSpeed: d.speed,
                floatPhase: d.phase
            });
        });
    }

    // ------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------
    function onMouseMove(e) {
        var rect = header.getBoundingClientRect();
        if (!rect.width) return;
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }

    function onResize() {
        if (!renderer || !camera) return;
        var w = header.clientWidth || window.innerWidth;
        var h = header.clientHeight || 720;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function onScroll() {
        if (!container) return;
        var y = window.scrollY;
        var limit = window.innerHeight * 0.9;
        var fade = Math.max(0, 1 - y / limit);
        container.style.opacity = String(fade);
        container.style.transform = 'translateY(' + (y * 0.15) + 'px)';
    }

    function onVisibility() {
        pageVisible = !document.hidden;
    }

    // ------------------------------------------------------------
    // ANIMATION LOOP
    // ------------------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);

        if (!sectionVisible || !pageVisible) return; // pause saat offscreen

        var t = clock.getElapsedTime();

        if (particleSystem) {
            particleSystem.rotation.y = t * 0.02;
            particleSystem.rotation.x = t * 0.008;
        }

        var i, s;
        for (i = 0; i < shapes.length; i++) {
            s = shapes[i];
            s.mesh.rotation.x += s.rotSpeed[0];
            s.mesh.rotation.y += s.rotSpeed[1];
            s.mesh.rotation.z += s.rotSpeed[2];
            s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed + s.floatPhase) * s.floatAmp;

            if (s.wire) {
                s.wire.rotation.x = s.mesh.rotation.x;
                s.wire.rotation.y = s.mesh.rotation.y;
                s.wire.rotation.z = s.mesh.rotation.z;
                s.wire.position.y = s.mesh.position.y;
            }
        }

        // Kamera parallax mengikuti kursor
        camera.position.x += (mouseX * 4.5 - camera.position.x) * 0.04;
        camera.position.y += (mouseY * 3.5 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

})();