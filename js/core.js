/* =========================================================
   CORE UI & UTILITIES
   ========================================================= */
// Navigasi, hero, tema, scroll, dan helper umum.

// Performance
const lowEndDevice = Boolean(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    navigator.connection?.saveData ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4)
);
if (lowEndDevice) document.documentElement.classList.add('perf-lite');
if (window.AOS) {
    AOS.init({
        duration: lowEndDevice ? 0 : 650,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80,
        delay: 0,
        disable: lowEndDevice
    });
}

// Mobile navigation
const hamburgerBtn = document.getElementById('hamburger-btn');
const navLinks = document.getElementById('nav-links');
const navOverlay = document.getElementById('nav-overlay');

function closeMobileNav() {
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
}

hamburgerBtn.addEventListener('click', () => {
    const isActive = navLinks.classList.toggle('active');
    navOverlay.classList.toggle('active', isActive);
    hamburgerBtn.setAttribute('aria-expanded', String(isActive));
});
navOverlay.addEventListener('click', closeMobileNav);
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
});

// Hero
const words = [
    "Aspiratif • Inovatif • Kolaboratif • Islami",
    "Membangun Generasi Unggul & Berkarakter",
    "Bersama OSIS, Kita Wujudkan Perubahan Positif!"
];
const typingText = document.getElementById('typing-text');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let typingWordIndex = 0;
let typingCharIndex = 0;
let typingDeleting = false;
let typingTimer = null;

function runHeroTyping() {
    if (!typingText) return;

    if (reduceMotion) {
        typingText.textContent = words[0];
        return;
    }

    const currentWord = words[typingWordIndex];

    if (!typingDeleting) {
        typingCharIndex++;
        typingText.textContent = currentWord.slice(0, typingCharIndex) || '\u00A0';

        if (typingCharIndex >= currentWord.length) {
            typingDeleting = true;
            typingTimer = window.setTimeout(runHeroTyping, 3000);
            return;
        }

        typingTimer = window.setTimeout(runHeroTyping, 70);
        return;
    }

    typingCharIndex--;
    typingText.textContent = currentWord.slice(0, typingCharIndex) || '\u00A0';

    if (typingCharIndex <= 0) {
        typingDeleting = false;
        typingWordIndex = (typingWordIndex + 1) % words.length;
        typingTimer = window.setTimeout(runHeroTyping, 500);
        return;
    }

    typingTimer = window.setTimeout(runHeroTyping, 40);
}

if (typingText) {
    typingText.textContent = reduceMotion ? words[0] : "\u00A0";
    runHeroTyping();
}

// Theme
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const iconTheme = themeToggle.querySelector('i');

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.setAttribute('data-theme', 'dark');
    iconTheme.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        iconTheme.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        iconTheme.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});

// Scroll actions
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
});

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
