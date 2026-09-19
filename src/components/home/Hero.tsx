import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { BellRing, GraduationCap, MessageCircle } from 'lucide-react';

export default function Hero(){
  const heroRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 92, damping: 25, mass: 0.38 });

  /* Building follows the page upward, then fades away. Scrolling back restores it. */
  const buildingY = useTransform(smoothProgress, [0, 1], [0, reduced ? 0 : -125]);
  const buildingScale = useTransform(smoothProgress, [0, 1], [1.015, reduced ? 1.015 : 1.065]);
  const buildingOpacity = useTransform(smoothProgress, [0, 0.76, 1], [1, 0.74, 0.08]);

  const contentY = useTransform(smoothProgress, [0, 1], [0, reduced ? 0 : -54]);
  const contentOpacity = useTransform(smoothProgress, [0, 0.76, 1], [1, 0.94, 0.12]);

  /* Cloud parallax: each layer travels at a different rate for depth. */
  const cloudBackX = useTransform(smoothProgress, [0, 1], [-18, reduced ? -18 : 62]);
  const cloudBackY = useTransform(smoothProgress, [0, 1], [0, reduced ? 0 : -34]);
  const cloudMidX = useTransform(smoothProgress, [0, 1], [10, reduced ? 10 : -78]);
  const cloudMidY = useTransform(smoothProgress, [0, 1], [0, reduced ? 0 : -58]);
  const cloudFrontX = useTransform(smoothProgress, [0, 1], [-6, reduced ? -6 : 98]);
  const cloudFrontY = useTransform(smoothProgress, [0, 1], [0, reduced ? 0 : -82]);

  return (
    <section ref={heroRef} id="top" className="osis-hero osis-hero-v6 relative min-h-[100dvh] overflow-hidden text-white">
      {/* Sky wash fills the dark/removed area of the source image. */}
      <div aria-hidden="true" className="osis-hero-sky absolute inset-0" />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 will-change-transform"
        style={{ y: buildingY, scale: buildingScale, opacity: buildingOpacity }}
      >
        <img
          src="/images/bg-sekolah.jpg"
          alt=""
          className="osis-building-image h-full w-full object-cover"
        />
      </motion.div>

      {/* Soft cloud layers cover the former black cut-out and move with scroll. */}
      <motion.div aria-hidden="true" className="osis-cloud-layer osis-cloud-layer--back" style={{ x: cloudBackX, y: cloudBackY }} />
      <motion.div aria-hidden="true" className="osis-cloud-layer osis-cloud-layer--mid" style={{ x: cloudMidX, y: cloudMidY }} />
      <motion.div aria-hidden="true" className="osis-cloud-layer osis-cloud-layer--front" style={{ x: cloudFrontX, y: cloudFrontY }} />

      <div className="osis-hero-shade absolute inset-0" />
      <div className="osis-hero-grain absolute inset-0" />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="osis-hero-arc osis-hero-arc--one" />
        <div className="osis-hero-arc osis-hero-arc--two" />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] items-center px-5 pb-14 pt-28 sm:px-7 sm:pt-32 lg:px-10 lg:pb-16 lg:pt-36"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="max-w-[44rem] lg:col-span-6 xl:col-span-6">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.08 }}
              className="osis-hero-kicker"
            >
              Kolaborasi · Kepemimpinan · Aksi nyata
            </motion.p>

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.68, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="osis-hero-heading"
            >
              OSIS SMA<br />Al-Kahfi<br />
              <span>Islamic School</span>
            </motion.h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.22 }}
              className="osis-hero-copy"
            >
              Wadah kolaborasi, kepemimpinan, dan aksi nyata siswa untuk mewujudkan lingkungan sekolah yang lebih baik, berkarakter, dan memberi dampak positif.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.28 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <a href="/#kritik-saran" className="osis-hero-button osis-hero-button--primary">
                <MessageCircle className="h-5 w-5" /> Sampaikan Aspirasi
              </a>
              <a href="/#pengumuman" className="osis-hero-button osis-hero-button--ghost">
                <BellRing className="h-5 w-5" /> Lihat Agenda
              </a>
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.34 }}
              className="osis-hero-meta"
            >
              <div>
                <span className="osis-hero-meta-label">Periode OSIS</span>
                <strong>2026/2027</strong>
              </div>
              <div className="osis-hero-logo-row">
                <span className="osis-logo-chip"><img src="/images/logo-sekolah.png" alt="Logo SMA Al-Kahfi Islamic School" /></span>
                <span className="osis-logo-chip"><img src="/images/logo-osis-v36.png" alt="Logo OSIS Al-Kahfi Islamic School" /></span>
              </div>
              <span className="osis-hero-meta-line" aria-hidden="true" />
            </motion.div>

            {/* Mobile version of the small feature note — kept in normal flow to avoid overlap. */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.38 }}
              className="osis-potency-card osis-potency-card--mobile"
            >
              <GraduationCap className="h-5 w-5" />
              <div><span>Satu sekolah</span><strong>Sejuta potensi untuk tumbuh bersama.</strong></div>
            </motion.div>
          </div>

          <div className="relative hidden min-h-[500px] lg:col-span-6 lg:block">
            <motion.div
              className="osis-handwritten absolute right-[6%] top-[12%]"
              animate={reduced ? undefined : { y: [0, -8, 0], rotate: [-2, -1, -2] }}
              transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              Better<br/>Students<br/>Brighter<br/>Tomorrow
              <span />
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}
