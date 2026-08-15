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
    iconTheme.classList.toggle('fa-sun', dark);
    iconTheme.classList.toggle('fa-moon', !dark);
    if (persist) localStorage.setItem('theme', dark ? 'dark' : 'light');
    syncBrowserThemeColor();
}

applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light', false);

themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const nextTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const commit = () => applyTheme(nextTheme, true);

    if (typeof document.startViewTransition === 'function' && !reducedThemeMotion) {
        const rect = themeToggle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.style.setProperty('--v41-theme-x', `${x}px`);
        root.style.setProperty('--v41-theme-y', `${y}px`);
        root.style.setProperty('--v41-theme-r', `${Math.ceil(radius)}px`);
        root.classList.add('v41-theme-transition');
        const transition = document.startViewTransition(commit);
        transition.finished.catch(() => {}).finally(() => root.classList.remove('v41-theme-transition'));
        return;
    }

    root.classList.add('v41-theme-fallback');
    commit();
    window.setTimeout(() => root.classList.remove('v41-theme-fallback'), 520);
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
