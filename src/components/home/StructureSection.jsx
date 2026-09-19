import { useCallback, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crown,
  FilePenLine,
  GitBranch,
  Languages,
  MoonStar,
  MoveHorizontal,
  Sprout,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';

const divisions = [
  { name: 'Divisi Humas', Icon: Users, members: ['M. Rizky Maulana', 'Haikal', 'Muhammad Yusuf', 'Najwa Karima', 'Chiara Queena Cordelia', 'Najwa Syahlina Oemar', 'Nur Aisyah'] },
  { name: 'Divisi Ibadah', Icon: MoonStar, members: ['M. Syahfiq Abdullah', 'M. Haidar Ali Dzaki', 'Fauzia Aniqa Ariawijaya', 'Khalisa Quinn'] },
  { name: 'Divisi Bahasa', Icon: Languages, members: ['Muhammad', 'Bigha', 'Razi', 'Alfina Maghfiroh', 'Nada Isaura', 'Mutiara Aulya Putri'] },
];

const card = 'relative min-w-0 h-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_22px_70px_-42px_rgba(15,23,42,.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-300/70 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-6';
const iconShell = 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 ring-1 ring-blue-500/15 dark:bg-blue-400/10 dark:text-blue-300';

function MotionArticle({ className = '', delay = 0, children }) {
  const reduced = useReducedMotion();

  if (reduced) return <article className={className}>{children}</article>;

  return (
    <motion.article
      className={className}
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.52, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.article>
  );
}

function MobileRootConnector({ delay = 0 }) {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto h-14 w-10 lg:hidden" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 origin-top bg-gradient-to-b from-blue-500/80 via-cyan-400/55 to-emerald-400/25"
        initial={reduced ? false : { scaleY: 0, opacity: 0 }}
        whileInView={reduced ? undefined : { scaleY: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-50 bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,.8)] dark:border-slate-950"
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: delay + 0.32 }}
      />
    </div>
  );
}

function HierarchyRoots({ variant = 'two', delay = 0 }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });

  const paths = variant === 'three'
    ? [
        'M250 0 V22 H500 V48',
        'M750 0 V22 H500',
        'M500 48 V70 H167 V100',
        'M500 70 V100',
        'M500 70 H833 V100',
      ]
    : [
        'M250 0 V24 H500 V50',
        'M750 0 V24 H500',
        'M500 50 V74 H250 V100',
        'M500 74 H750 V100',
      ];

  const bottomNodes = variant === 'three' ? [167, 500, 833] : [250, 750];

  return (
    <div ref={ref} className="relative hidden h-20 w-full lg:block" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`root-gradient-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="52%" stopColor="#22d3ee" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.45" />
          </linearGradient>
          <filter id={`root-glow-${variant}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke={`url(#root-gradient-${variant})`}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#root-glow-${variant})`}
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={inView && !reduced ? { pathLength: 1, opacity: 1 } : reduced ? undefined : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.62, delay: delay + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}

        {[250, 500, 750, ...bottomNodes].map((x, index) => (
          <motion.circle
            key={`${variant}-${x}-${index}`}
            cx={x}
            cy={index < 3 ? (index === 1 ? 50 : 24) : 98}
            r="4.5"
            fill="#22d3ee"
            stroke="#eff6ff"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            animate={inView && !reduced ? { scale: 1, opacity: 1 } : reduced ? undefined : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.3 + index * 0.045 }}
          />
        ))}
      </svg>
    </div>
  );
}

function LeadershipCard({ role, name, description, primary = false, delay = 0 }) {
  return (
    <MotionArticle className={`${card} v41-org-node`} delay={delay}>
      {primary && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400" />}
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className={iconShell}><Crown className="h-6 w-6" aria-hidden="true" /></span>
        <span className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">{role}</span>
        <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{name}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </MotionArticle>
  );
}

function SupportCard({ eyebrow, title, Icon, members, delay = 0 }) {
  return (
    <MotionArticle className={`${card} v41-org-node`} delay={delay}>
      <div className="flex h-full flex-col items-center justify-between text-center">
        <div className="flex flex-col items-center">
          <span className={iconShell}><Icon className="h-6 w-6" aria-hidden="true" /></span>
          <span className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{eyebrow}</span>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
        </div>
        <div className="mt-4 flex w-full flex-col gap-2">
          {members.map((member) => (
            <span className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300" key={member}>
              <UserRound className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
              <span>{member}</span>
            </span>
          ))}
        </div>
      </div>
    </MotionArticle>
  );
}

function DivisionCard({ division, index }) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, division.members.length - 3);
  const visibleMembers = expanded ? division.members : division.members.slice(0, 3);
  const Icon = division.Icon;

  return (
    <MotionArticle className="division-card-v12 v41-org-node mx-auto flex h-full w-full max-w-sm flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80" delay={0.04 + index * 0.05}>
      <div>
        <div className="division-card-head-v12 flex flex-col items-center gap-3 text-center">
          <span className={iconShell}><Icon className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{division.name}</h3>
            <small className="text-slate-500 dark:text-slate-400">{division.members.length} anggota</small>
          </div>
        </div>

        <ul className="division-members-v12 mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
          {visibleMembers.map((member) => (
            <li className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/60" key={member}>
              <UserRound className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
              <span>{member}</span>
            </li>
          ))}
        </ul>
      </div>

      {hiddenCount > 0 && (
        <button
          aria-expanded={expanded}
          className="v43-member-toggle mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[.98] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-500/10"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <span>{expanded ? 'Ringkas anggota' : `Lihat ${hiddenCount} anggota lainnya`}</span>
          {expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}
    </MotionArticle>
  );
}

export default function StructureSection() {
  const divisionScrollerRef = useRef(null);
  const scrollRafRef = useRef(0);
  const [activeDivision, setActiveDivision] = useState(0);
  const reduced = useReducedMotion();

  const syncDivisionIndex = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const scroller = divisionScrollerRef.current;
      if (!scroller) return;
      const cards = [...scroller.querySelectorAll('[data-division-card]')];
      if (!cards.length) return;

      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveDivision((current) => (current === nearestIndex ? current : nearestIndex));
    });
  }, []);

  const scrollToDivision = useCallback((index) => {
    const scroller = divisionScrollerRef.current;
    if (!scroller) return;
    const cards = [...scroller.querySelectorAll('[data-division-card]')];
    const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
    cards[safeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <section className="container scroll-mt-24 v41-hierarchy-section mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="struktur" aria-labelledby="struktur-title">
      <div className="section-title mx-auto mb-12 max-w-3xl text-center">
        <span className="v41-hierarchy-kicker inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          <GitBranch className="h-4 w-4" aria-hidden="true" /> Struktur Organisasi
        </span>
        <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl" id="struktur-title">Pengurus OSIS 2026/2027</h2>
        <p className="subtitle mt-3 text-slate-600 dark:text-slate-400">Struktur inti dan divisi OSIS SMA Al-Kahfi Islamic School.</p>
      </div>

      <div className="v41-root-tree relative mx-auto w-full max-w-5xl">
        <div className="leadership-grid-v12 v41-tree-level grid grid-cols-1 gap-4 md:grid-cols-2">
          <LeadershipCard
            primary
            role="Ketua OSIS"
            name="Ibnu Ali Ahmad"
            description="Memimpin koordinasi pengurus dan pelaksanaan program kerja OSIS."
          />
          <LeadershipCard
            role="Wakil Ketua OSIS"
            name="Olivia Lianny"
            description="Mendampingi ketua serta membantu koordinasi lintas divisi."
            delay={0.05}
          />
        </div>

        <div className="relative mx-auto flex h-12 max-w-md items-center justify-center" aria-label="Koneksi ketua dan wakil ketua">
          <span className="absolute h-px w-48 bg-slate-300 dark:bg-slate-700" />
          <motion.span className="relative h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-slate-900" animate={reduced ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>

        <MobileRootConnector delay={0.08} />
        <HierarchyRoots variant="two" delay={0.05} />

        <div className="board-support-grid-v12 v41-tree-level grid grid-cols-1 gap-4 md:grid-cols-2">
          <SupportCard eyebrow="Sekretariat" title="Sekretaris" Icon={FilePenLine} members={['Qinan Isaura Widiarto', 'Haidar Widad Wahyudi']} delay={0.04} />
          <SupportCard eyebrow="Keuangan" title="Bendahara OSIS" Icon={WalletCards} members={['Zahratu Uzliful Abdi', 'Faruq Abdurrahman']} delay={0.08} />
        </div>

        <MobileRootConnector delay={0.14} />
        <HierarchyRoots variant="three" delay={0.12} />

        <div className="v41-tree-badge mx-auto mb-7 grid h-12 w-12 place-items-center rounded-full border border-emerald-300/50 bg-emerald-50 text-emerald-600 shadow-[0_0_28px_rgba(52,211,153,.22)] dark:bg-emerald-500/10 dark:text-emerald-300" aria-hidden="true">
          <Sprout className="h-5 w-5" />
        </div>

        <div className="division-title-v12 v41-division-title mb-4 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Tim Pelaksana</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white">Divisi OSIS</h3>
            <small className="mt-2 block max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Setiap divisi bekerja sesuai fokus program dan kebutuhan siswa.</small>
          </div>

          <div className="hidden items-center gap-2 md:flex" aria-label="Navigasi carousel divisi">
            <button
              aria-label="Lihat divisi sebelumnya"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              disabled={activeDivision === 0}
              onClick={() => scrollToDivision(activeDivision - 1)}
              type="button"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              aria-label="Lihat divisi berikutnya"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              disabled={activeDivision === divisions.length - 1}
              onClick={() => scrollToDivision(activeDivision + 1)}
              type="button"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-500 md:justify-start dark:text-blue-300">
          <MoveHorizontal className="h-4 w-4 animate-pulse" aria-hidden="true" />
          <span>Geser ke samping untuk melihat divisi lain →</span>
        </div>

        <div className="relative -mx-4 sm:-mx-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 lg:hidden" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 lg:hidden" aria-hidden="true" />

          <div
            ref={divisionScrollerRef}
            className="division-grid-v12 v41-tree-level scrollbar-none flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-2"
            onScroll={syncDivisionIndex}
          >
            {divisions.map((division, index) => (
              <div className="min-w-[84vw] snap-center sm:min-w-[360px] md:min-w-[calc(50%_-_0.5rem)] lg:min-w-[calc(33.333%_-_0.7rem)]" data-division-card key={division.name}>
                <DivisionCard division={division} index={index} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center" aria-label="Posisi carousel divisi">
          {divisions.map((division, index) => (
            <button
              aria-label={`Buka ${division.name}`}
              aria-current={activeDivision === index ? 'true' : undefined}
              className="grid h-11 w-11 place-items-center"
              key={division.name}
              onClick={() => scrollToDivision(index)}
              type="button"
            >
              <span className={`h-2.5 rounded-full transition-all duration-300 ${activeDivision === index ? 'w-7 bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,.35)]' : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
