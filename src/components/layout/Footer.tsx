import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Circle } from 'lucide-react';

const formatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatWib(date){
  return `${formatter.format(date).replace(/\./g, ':')} WIB`;
}

export default function Footer(){
  const [now, setNow] = useState(() => new Date());
  const shellRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ['start end', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], reduceMotion ? [1, 1, 1, 1] : [0, 0.2, 0.86, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 1], reduceMotion ? [1, 1, 1] : [0.94, 0.97, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [42, 0]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) setNow(new Date());
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <footer
      ref={shellRef}
      className="relative z-0 min-h-[clamp(300px,42svh,430px)] bg-[#020817] text-slate-300"
      role="contentinfo"
    >
      <motion.div
        className="sticky bottom-0 flex min-h-[clamp(300px,42svh,430px)] items-end overflow-hidden border-t border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,.18),transparent_34%),linear-gradient(180deg,#07152f_0%,#020817_62%)] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-14 sm:px-6 lg:px-8"
        style={{ opacity, scale, y, transformOrigin: '50% 100%' }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-28 top-6 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/35 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,.65fr)] md:items-end">
            <div className="max-w-2xl">
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-200 backdrop-blur"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                OSIS 2026/2027
              </motion.span>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                OSIS SMA Al-Kahfi Islamic School
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Aspiratif • Inovatif • Kolaboratif • Islami
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Portal Resmi Pengurus</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Informasi, kegiatan, galeri, dan aspirasi siswa dalam satu ruang digital.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {now.getFullYear()} OSIS SMA Al-Kahfi Islamic School</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 tabular-nums" id="liveClock" aria-live="off" title="Waktu Indonesia Barat">
                <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" aria-hidden="true" />
                {formatWib(now)}
              </span>
              <span>Dikelola oleh pengurus OSIS.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
