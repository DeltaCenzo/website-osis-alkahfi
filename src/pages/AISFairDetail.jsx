import React, { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { aisFairCompetitions } from "../data/aisFairCompetitions.js";

function RocketArt() {
  return (
    <svg viewBox="0 0 180 180" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M61 113c-10 7-18 18-22 31 14-1 25-5 35-14" fill="#5B8DE8" stroke="#DDE7FF" strokeWidth="4" />
      <path d="M110 69c22-23 43-33 54-34-1 14-9 37-31 58l-22 21-23-23 22-22Z" fill="#EEF3FF" stroke="#DDE7FF" strokeWidth="4" />
      <path d="M125 55c15-12 29-18 39-20-1 9-4 19-10 30" fill="#7FA7F4" opacity=".9" />
      <circle cx="126" cy="72" r="11" fill="#78DA86" stroke="#22306C" strokeWidth="5" />
      <path d="M96 107 74 130l-2-30 15-13" fill="#5B8DE8" stroke="#DDE7FF" strokeWidth="4" />
      <path d="M111 119c-4 14-12 25-24 34 2-12 0-21-2-27 6 0 15-3 26-7Z" fill="#78DA86" />
      <path d="M101 126c-3 11-8 20-15 27" stroke="#43F16A" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function BulbArt() {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M30 62c0-20 14-36 31-36s31 16 31 36c0 14-7 24-17 34-5 5-7 11-7 17H54c0-6-3-12-8-17-9-9-16-20-16-34Z" stroke="#78DA86" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 115h23M53 127h17" stroke="#A9B6E9" strokeWidth="6" strokeLinecap="round" />
      <path d="M61 8v10M18 30l8 7M103 30l-8 7M10 68h11M100 68h11" stroke="#78DA86" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 71c7-8 14-8 21 0M61 71v31" stroke="#78DA86" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function BookArt() {
  return (
    <svg viewBox="0 0 180 130" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M90 108c-20-14-43-20-68-16V24c26-4 49 3 68 18v66Z" stroke="#8795D3" strokeWidth="5" />
      <path d="M90 108c20-14 43-20 68-16V24c-26-4-49 3-68 18v66Z" stroke="#8795D3" strokeWidth="5" />
      <path d="M38 43c14 0 27 4 39 12M38 58c14 0 27 4 39 12M103 55c12-8 25-12 39-12M103 70c12-8 25-12 39-12" stroke="#8795D3" strokeWidth="3" strokeLinecap="round" opacity=".75" />
    </svg>
  );
}

function PlanetArt() {
  return (
    <div className="ais-planet" aria-hidden="true">
      <div className="ais-planet__land ais-planet__land--one" />
      <div className="ais-planet__land ais-planet__land--two" />
      <div className="ais-planet__shine" />
    </div>
  );
}

function HeroStars() {
  return (
    <div className="ais-stars" aria-hidden="true">
      {Array.from({ length: 13 }).map((_, index) => (
        <span key={index} className={`ais-star ais-star--${index + 1}`} />
      ))}
    </div>
  );
}

const levels = ["TK", "SD", "SMP", "SMA"];
const levelDescriptions = {
  TK: "Peserta jenjang TK",
  SD: "Siswa SD sederajat",
  SMP: "Siswa SMP sederajat",
  SMA: "Siswa SMA sederajat",
};

const groups = Object.fromEntries(
  levels.map((level) => [level, aisFairCompetitions.filter((item) => item.level === level)])
);

const timeline = [
  { number: "01", title: "Pendaftaran", date: "22 Agustus – 17 September 2026" },
  { number: "02", title: "Technical meeting", date: "23 September 2026" },
  { number: "03", title: "Pelaksanaan lomba", date: "26 – 27 September 2026" },
  { number: "04", title: "Pengumuman juara", date: "5 Oktober 2026" },
];

const groupSpans = [
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-7",
  "lg:col-span-5",
];

function CompetitionGroup({ title, items, className = "" }) {
  return (
    <article className={`overflow-hidden border border-[#d7d9df] bg-[#fbfbf7] ${className}`}>
      <header className="flex items-end justify-between gap-4 border-b border-[#d7d9df] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#676a79]">JENJANG</p>
          <h3 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#20255c] sm:text-4xl">{title}</h3>
          <p className="mt-1 text-sm text-[#656876]">{levelDescriptions[title]}</p>
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-[#797c88]">{String(items.length).padStart(2, "0")} lomba</span>
      </header>

      <div className="divide-y divide-[#e4e5e8]">
        {items.map((item, index) => (
          <a
            key={item.slug}
            href={`/ais-fair-2026/${item.slug}`}
            className={`group grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4 transition duration-200 sm:px-6 ${
              item.internalOnly ? "bg-[#efeff5] hover:bg-[#e8e8f1]" : "hover:bg-white"
            } active:translate-y-px`}
          >
            <span className="font-mono text-[11px] font-semibold tabular-nums text-[#92949e]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="font-semibold leading-snug text-[#262938]">{item.name}</span>
              {item.internalOnly ? (
                <span className="ml-2 whitespace-nowrap text-[10px] font-bold tracking-[0.08em] text-[#4d4f69]">
                  internal · AIS
                </span>
              ) : null}
            </span>
            <span className="translate-x-0 text-sm font-semibold text-[#20255c] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </article>
  );
}

export default function AISFairDetail() {
  const heroRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const posterY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const rocketY = useTransform(scrollYProgress, [0, 1], [0, -54]);
  const planetY = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const bookY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const orbitShift = useTransform(scrollYProgress, [0, 1], [0, 16]);

  return (
    <main className="ais-page bg-[#f4f3ec] text-[#252735]">
      <section ref={heroRef} className="ais-hero ais-halftone relative overflow-hidden bg-[#20255c] text-white">
        <HeroStars />

        <motion.div
          className="pointer-events-none absolute -left-[8rem] bottom-[-10rem] hidden h-[24rem] w-[24rem] 2xl:block"
          style={{ y: reduceMotion ? 0 : planetY }}
          aria-hidden="true"
        >
          <PlanetArt />
        </motion.div>

        <motion.div
          className="pointer-events-none absolute right-2 top-[6.8rem] z-[4] block h-16 w-16 opacity-70 sm:right-5 sm:top-[6.5rem] sm:h-20 sm:w-20 lg:right-[2vw] lg:top-[5.5rem] lg:h-24 lg:w-24 lg:opacity-90 xl:h-28 xl:w-28 2xl:h-32 2xl:w-32"
          style={{ y: reduceMotion ? 0 : rocketY }}
          animate={reduceMotion ? undefined : { rotate: [-3, 2, -3], x: [0, 8, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <RocketArt />
        </motion.div>

        <motion.div
          className="pointer-events-none absolute left-[2vw] top-[15rem] hidden w-20 text-[#78da86]/90 2xl:block"
          style={{ y: reduceMotion ? 0 : orbitShift }}
          animate={reduceMotion ? undefined : { x: [0, 4, 0], rotate: [-1, 2, -1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <BulbArt />
          <p className="ais-doodle-copy -mt-2 ml-4 rotate-[-5deg] text-[#a5afd8]">Learn<br />Create<br />Compete<br />Grow</p>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute bottom-[2.5rem] right-[2.5vw] hidden w-32 2xl:block"
          style={{ y: reduceMotion ? 0 : bookY }}
          animate={reduceMotion ? undefined : { rotate: [1, -2, 1] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <BookArt />
        </motion.div>

        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full 2xl:block" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M1320 146 C 1465 170, 1490 325, 1324 430 S 1120 540, 1270 610"
            fill="none"
            stroke="#55E979"
            strokeWidth="2.4"
            strokeDasharray="10 12"
            opacity=".9"
            style={{ pathLength: scrollYProgress }}
          />
          <motion.path
            d="M0 676 C 160 642, 210 740, 330 790"
            fill="none"
            stroke="#55E979"
            strokeWidth="2.2"
            strokeDasharray="10 12"
            opacity=".72"
            style={{ x: reduceMotion ? 0 : orbitShift }}
          />
          <motion.path
            d="M1290 746 C 1385 830, 1470 817, 1600 690"
            fill="none"
            stroke="#55E979"
            strokeWidth="2.2"
            strokeDasharray="10 12"
            opacity=".72"
            style={{ x: reduceMotion ? 0 : orbitShift }}
          />
        </svg>

        <div className="relative z-[5] mx-auto max-w-[1240px] px-5 pb-14 pt-7 sm:px-7 sm:pb-16 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/18 pb-4 text-[11px] font-semibold tracking-[0.14em] text-white/78">
            <span>AL-KAHFI ISLAMIC SCHOOL BATAM</span>
            <span>AIS FAIR 2026</span>
          </div>

          <div className="mt-9 grid items-center gap-10 md:mt-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            <motion.div className="relative lg:col-span-6" style={{ y: reduceMotion ? 0 : contentY }}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#55F173] sm:text-[12px]">Small Bytes, Big Impact!</p>
              <h1 className="ais-hero-title mt-4 font-extrabold tracking-[-0.055em]">
                <span>Ruang</span>
                <span>untuk berani</span>
                <span>mencoba,</span>
                <span>berkarya, dan</span>
                <span>berprestasi.</span>
              </h1>
              <p className="mt-6 max-w-[35rem] text-sm leading-6 text-white/76 sm:text-base sm:leading-7">
                Program tahunan Al-Kahfi Islamic School Batam untuk siswa-siswi Islam se-Kota Batam dalam menguji kompetensi, mengeksplorasi kreativitas, dan menyalurkan ide inovatif.
              </p>

              <div className="mt-7 grid max-w-[31rem] grid-cols-2 border-y border-white/18 py-3.5 text-sm">
                <div className="pr-5">
                  <span className="block text-xs font-medium text-white/50">Pendaftaran</span>
                  <strong className="mt-1 block font-semibold">22 Agu – 17 Sep 2026</strong>
                </div>
                <div className="border-l border-white/15 pl-5">
                  <span className="block text-xs font-medium text-white/50">Pelaksanaan</span>
                  <strong className="mt-1 block font-semibold">26 – 27 Sep 2026</strong>
                </div>
              </div>

              <div className="mt-7">
                <a href="#kompetisi" className="ais-cta ais-cta--green">Lihat daftar lomba</a>
              </div>
            </motion.div>

            <motion.div className="relative lg:col-span-6 lg:pl-2" style={{ y: reduceMotion ? 0 : posterY }}>
              <div className="ais-poster-orbit absolute -inset-10 hidden lg:block" aria-hidden="true" />
              <figure className="ais-poster-frame ais-poster-frame--hero relative mx-auto max-w-[620px] bg-[#171a45] p-2 sm:p-2.5 lg:ml-auto lg:mr-0">
                <span className="ais-poster-accent" aria-hidden="true" />
                <img
                  src="/images/ais-fair-2026-hero.png"
                  alt="Poster resmi AIS FAIR 2026 dengan tulisan AIS FAIR 2026 Ready"
                  className="block h-auto w-full border border-white/90"
                />
                <figcaption className="px-1 pb-0.5 pt-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Official visual · AIS FAIR 2026
                </figcaption>
              </figure>

              <motion.div
                className="pointer-events-none absolute -right-6 -top-16 hidden max-w-[7.5rem] rotate-[-4deg] text-left 2xl:block"
                animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                aria-hidden="true"
              >
                <p className="ais-doodle-copy text-[#9aa8df]">Ideas<br />Launch<br />Better<br />Futures</p>
                <span className="mt-2 block h-[2px] w-20 rotate-[-7deg] bg-[#55F173]" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="ais-hero-clouds pointer-events-none absolute inset-x-0 bottom-0 h-36" aria-hidden="true" />
      </section>

      <section id="tentang" className="mx-auto max-w-[1280px] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs font-semibold tabular-nums text-[#656876]">01 / TENTANG</p>
            <h2 className="mt-5 max-w-[9ch] text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#20255c] sm:text-5xl">Apa itu AIS FAIR?</h2>
          </div>

          <div className="lg:col-span-8 lg:pt-1">
            <p className="max-w-[60ch] text-2xl font-semibold leading-9 tracking-[-0.02em] text-[#2b2e3d]">
              “Small Bytes, Big Impact!” adalah semangat di balik program tahunan andalan Al-Kahfi Islamic School Batam.
            </p>
            <div className="mt-7 grid gap-7 text-base leading-8 text-[#646773] md:grid-cols-2">
              <p>AIS FAIR dirancang sebagai wadah bagi siswa-siswi Islam se-Kota Batam untuk menguji dan meningkatkan kompetensi, mengeksplorasi kreativitas, serta menyalurkan ide-ide inovatif.</p>
              <p>Tujuannya adalah menumbuhkan talenta muda yang tangguh dan siap menjadi agen perubahan melalui karya yang memberi dampak positif bagi agama, bangsa, dan masyarakat sekitar.</p>
            </div>

            <div className="mt-12 divide-y divide-[#d7d9df] border-y border-[#d7d9df]">
              {[
                ["01", "Kompetensi", "Menguji kemampuan dan memperkuat keterampilan lewat cabang lomba yang beragam."],
                ["02", "Kreativitas", "Memberi ruang untuk bereksperimen, tampil, dan menunjukkan potensi terbaik."],
                ["03", "Inovasi", "Mendorong ide yang relevan, berguna, dan punya dampak nyata."],
              ].map(([number, title, text]) => (
                <div key={number} className="grid gap-3 py-5 sm:grid-cols-[4rem_9rem_1fr] sm:items-baseline sm:gap-5">
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#8a8c95]">{number}</span>
                  <h3 className="text-lg font-bold text-[#20255c]">{title}</h3>
                  <p className="max-w-[54ch] text-sm leading-7 text-[#696c77]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="kompetisi" className="border-y border-[#d7d9df] bg-[#eceef0] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-7 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="font-mono text-xs font-semibold text-[#656876]">02 / KOMPETISI</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#20255c] sm:text-5xl">Pilih cabang lomba.</h2>
            </div>
            <p className="max-w-[46ch] text-sm leading-7 text-[#656876] lg:col-span-4 lg:justify-self-end">
              Buka halaman detail terlebih dahulu untuk membaca persyaratan, format peserta, dan petunjuk teknis sebelum melanjutkan ke pendaftaran.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            {levels.map((level, index) => (
              <CompetitionGroup key={level} title={level} items={groups[level]} className={groupSpans[index]} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="grid gap-7 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-xs font-semibold text-[#656876]">03 / JADWAL</p>
            <h2 className="mt-4 text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#20255c] sm:text-5xl">Tanggal yang perlu dicatat.</h2>
          </div>
          <p className="text-sm leading-7 text-[#656876] lg:col-span-5 lg:justify-self-end">Simpan jadwalnya lebih awal supaya persiapan lomba tidak mepet.</p>
        </div>

        <div className="mt-12 grid border-t border-[#bfc2ca] md:grid-cols-4">
          {timeline.map((item) => (
            <div key={item.number} className="border-b border-[#d7d9df] py-6 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
              <span className="font-mono text-xs font-semibold tabular-nums text-[#7f828d]">{item.number}</span>
              <h3 className="mt-4 text-xl font-bold tracking-[-0.02em] text-[#20255c]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#656876]">{item.date}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#20255c] px-5 py-12 text-white sm:px-7 lg:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="text-sm font-semibold text-[#78da86]">AIS FAIR 2026</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Pilih lomba yang paling cocok denganmu.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">Baca detail cabang terlebih dahulu. Setelah itu, tombol pendaftaran akan membawa kamu ke formulir khusus lomba tersebut.</p>
          </div>
          <div className="lg:col-span-4 lg:justify-self-end">
            <a href="#kompetisi" className="ais-cta ais-cta--light">Kembali ke daftar <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </section>
    </main>
  );
}
