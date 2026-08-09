/* =========================================================
   CORE UI & UTILITIES
   ========================================================= */
// Navigasi, hero, tema, scroll, dan helper umum.

// Performance class and motion effects are handled by js/motion.js.

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

// Hero phrase rotation is handled by js/motion.js to avoid layout jitter.

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
const updateScrollTopVisibility = () => {
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
