import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { BellRing, CalendarDays, ContactRound, Images, ListChecks, LockKeyhole, Menu, MessageCircle, Network, Smartphone, Target, X } from 'lucide-react';

const links = [
  ['struktur', Network, 'Pengurus'],
  ['visi-misi', Target, 'Visi & Misi'],
  ['proker', ListChecks, 'Program Kerja'],
  ['event', CalendarDays, 'Event'],
  ['pengumuman', BellRing, 'Pengumuman'],
  ['galeri', Images, 'Galeri'],
  ['kritik-saran', MessageCircle, 'Aspirasi'],
  ['kontak', ContactRound, 'Kontak'],
];

export default function Navbar({ onOpenLogin, onOpenInstall }: { onOpenLogin?: () => void; onOpenInstall?: () => void }) {
  const [open, setOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [activeLink, setActiveLink] = useState('struktur');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { scrollY } = useScroll();

  const closeMenu = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  const openAdmin = () => { closeMenu(); onOpenLogin?.(); };
  const openInstallGuide = () => { closeMenu(); onOpenInstall?.(); };

  useMotionValueEvent(scrollY, 'change', (value) => setCondensed(value > 80));

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && setActiveLink(entry.target.id));
    }, { threshold: 0.45, rootMargin: '-120px 0px -45%' });
    links.forEach(([id]) => document.getElementById(id) && observer.observe(document.getElementById(id)!));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const old = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu({ restoreFocus: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeMenu]);


  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    setActiveLink(id);
    closeMenu();
  };

  return <>
    <nav className="fixed top-5 left-1/2 z-[60000] w-full max-w-7xl -translate-x-1/2 px-3 text-white sm:px-6">
      <motion.div
        layout
        initial={{ opacity: 0, y: -30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: condensed ? 0.96 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative mx-auto flex w-fit max-w-full items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:px-6"
      >
        <a href="/" onClick={() => closeMenu()} className="flex shrink-0 items-center gap-3">
          <motion.span whileHover={{ scale: 1.05 }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 p-1.5">
            <img src="/images/logo-osis-v36.png" alt="OSIS" className="h-full w-full object-contain" />
          </motion.span>
          <AnimatePresence initial={false}>
            {!condensed && (
              <motion.span
                key="brand-text"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ transformOrigin: 'left center' }}
                className="overflow-hidden whitespace-nowrap"
              >
                <b className="block text-sm tracking-[.12em]">OSIS AL-KAHFI</b>
                <small className="text-[10px] text-slate-300">SMA AL-KAHFI ISLAMIC SCHOOL</small>
              </motion.span>
            )}
          </AnimatePresence>
        </a>

        <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none md:flex ml-6">
          {links.map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="relative flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-slate-300 transition hover:text-white xl:px-4"
            >
              {activeLink === id && <motion.span layoutId="active-nav" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className="relative z-10 flex items-center gap-1"><Icon className="h-4 w-4" />{label}</span>
            </button>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button onClick={openAdmin} className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 text-xs transition hover:bg-white/20"><LockKeyhole className="mr-1 h-3.5" />Area OSIS</button>
          <button onClick={openInstallGuide} className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 text-xs transition hover:bg-white/20"><Smartphone className="mr-1 h-3.5" />Install</button>
        </div>

        <button ref={triggerRef} onClick={() => setOpen(!open)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 md:hidden" aria-label={open ? 'Tutup menu' : 'Buka menu'}>
          {open ? <X /> : <Menu />}
        </button>
      </motion.div>
    </nav>
    <AnimatePresence mode="wait">
      {open && <motion.div key="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu navigasi" initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-[60001] overflow-y-auto bg-slate-950/95 p-6 text-white backdrop-blur-xl">
        <button onClick={() => closeMenu({ restoreFocus: true })} aria-label="Tutup menu" className="mb-8 grid min-h-11 min-w-11 place-items-center rounded-full border border-white/15 p-3"><X /></button>
        <div className="grid gap-3">{links.map(([id, Icon, label]) => <button key={id} onClick={() => scrollToSection(id)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"><Icon className="mr-3 inline" />{label}</button>)}</div>
        <div className="mt-4 grid gap-3">
          <button onClick={openAdmin} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"><LockKeyhole className="h-5 w-5" />Area OSIS</button>
          <button onClick={openInstallGuide} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"><Smartphone className="h-5 w-5" />Install Aplikasi</button>
        </div>
      </motion.div>}
    </AnimatePresence>
  </>;
}
