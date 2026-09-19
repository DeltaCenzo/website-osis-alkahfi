import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays } from 'lucide-react';

export default function EventPreviewSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="event"
      className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      aria-labelledby="ais-fair-preview-title"
    >
      <motion.article
        initial={reduced ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="ais-event-card relative mx-auto grid w-full max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/10 text-white shadow-[0_28px_80px_-36px_rgba(27,31,78,.7)] lg:grid-cols-[0.82fr_1.18fr]"
      >
        <div className="ais-event-copy relative z-10 flex min-h-[360px] flex-col justify-center px-6 py-9 sm:px-9 sm:py-11 lg:min-h-[470px] lg:px-12 lg:py-14">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-10 bg-[#78da86]" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9be5a5]">Event unggulan OSIS</span>
          </div>

          <h2 id="ais-fair-preview-title" className="max-w-[9ch] text-[clamp(2.65rem,5vw,5.4rem)] font-black leading-[0.88] tracking-[-0.055em]">
            AIS FAIR <span className="text-[#78da86]">2026</span>
          </h2>

          <p className="mt-5 max-w-[34rem] text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
            <strong className="font-semibold text-white">Small Bytes, Big Impact.</strong> Ruang kompetisi, kreativitas, dan inovasi bagi siswa-siswi Islam se-Kota Batam.
          </p>

          <div className="mt-7 grid max-w-lg grid-cols-2 gap-x-5 border-y border-white/15 py-4 text-sm">
            <div>
              <span className="block text-[11px] text-white/48">Pendaftaran</span>
              <strong className="mt-1 block font-semibold">22 Agu – 17 Sep</strong>
            </div>
            <div className="border-l border-white/15 pl-5">
              <span className="block text-[11px] text-white/48">Pelaksanaan</span>
              <strong className="mt-1 block font-semibold">26 – 27 Sep 2026</strong>
            </div>
          </div>

          <div className="mt-7">
            <a
              href="/ais-fair-2026"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#78da86] px-5 py-3 text-sm font-extrabold text-[#18204c] transition duration-200 hover:-translate-y-0.5 hover:bg-[#8be198] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9be5a5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#20255c]"
            >
              Buka AIS FAIR 2026 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="ais-event-visual relative flex min-h-[290px] items-center justify-center overflow-hidden px-5 pb-6 pt-3 sm:min-h-[380px] sm:px-8 lg:min-h-[470px] lg:px-11 lg:py-10">
          <div className="ais-event-orbit" aria-hidden="true" />
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 14 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.08 }}
            whileHover={reduced ? undefined : { y: -4, rotate: -0.35 }}
            className="ais-event-poster relative z-10 w-full max-w-[690px]"
          >
            <div className="absolute -left-3 -top-3 h-full w-full border border-[#78da86]/70" aria-hidden="true" />
            <div className="relative border-2 border-white/85 bg-[#151942] p-2 shadow-[12px_14px_0_rgba(14,18,56,.42)] sm:p-3">
              <img
                src="/images/ais-fair-2026-hero.png"
                alt="Visual AIS FAIR 2026"
                className="block aspect-[724/499] h-auto w-full object-cover"
              />
              <div className="flex items-center justify-between px-1 pb-0.5 pt-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Official visual</span>
                <span>AISF / 26</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="ais-event-star ais-event-star--one"
            animate={reduced ? undefined : { opacity: [0.45, 1, 0.45], scale: [0.9, 1.12, 0.9] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="ais-event-star ais-event-star--two"
            animate={reduced ? undefined : { y: [0, -7, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="ais-event-dotfield" aria-hidden="true" />
      </motion.article>
    </section>
  );
}
