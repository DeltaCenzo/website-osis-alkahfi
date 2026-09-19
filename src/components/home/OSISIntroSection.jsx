import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, HeartHandshake, Leaf, UsersRound } from 'lucide-react';

const pillars = [
  { Icon: UsersRound, title: 'Kepemimpinan', text: 'Melatih jiwa pemimpin yang amanah, aktif, dan bertanggung jawab.' },
  { Icon: HeartHandshake, title: 'Kolaborasi', text: 'Membawa ide siswa menjadi aksi yang dikerjakan bersama.' },
  { Icon: Leaf, title: 'Dampak nyata', text: 'Mendorong program yang relevan dan bermanfaat bagi lingkungan sekolah.' },
];

export default function OSISIntroSection(){
  const reduced = useReducedMotion();

  return (
    <section id="osis-intro" className="osis-intro-section relative overflow-hidden bg-[#f6f8fb] px-5 py-16 text-slate-950 sm:px-6 lg:px-8 lg:py-24 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full border border-cyan-300/20" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-6 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl dark:bg-cyan-500/5" aria-hidden="true" />
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-12 lg:items-center">
        <motion.div
          className="lg:col-span-6"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-cyan-700 dark:text-cyan-300">
            <span className="h-px w-8 bg-current" /> Lebih dari organisasi
          </div>
          <h2 className="mt-5 max-w-[11ch] text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-5xl lg:text-6xl">Tentang OSIS Al-Kahfi</h2>
          <p className="mt-6 max-w-[60ch] text-base leading-8 text-slate-600 dark:text-slate-300">
            OSIS SMA Al-Kahfi Islamic School adalah ruang bagi siswa untuk belajar memimpin, berkolaborasi, menyampaikan aspirasi, dan memberi kontribusi nyata bagi lingkungan sekolah yang lebih baik, islami, serta berprestasi.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {pillars.map(({ Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-extrabold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
              </motion.div>
            ))}
          </div>

          <a href="#struktur" className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-cyan-300/50">
            Kenali pengurus OSIS <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        <motion.div
          className="relative lg:col-span-6"
          initial={reduced ? false : { opacity: 0, x: 34 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-[0_30px_90px_-45px_rgba(8,47,73,.6)]">
            <motion.img
              src="/images/bg-sekolah.jpg"
              alt="Gedung Al-Kahfi Islamic School"
              className="aspect-[4/3] w-full object-cover object-center opacity-90"
              whileHover={reduced ? undefined : { scale: 1.025 }}
              transition={{ duration: 0.55 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-slate-950/55 p-5 text-white backdrop-blur-lg sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-200">Semangat kami</p>
              <p className="mt-2 text-xl font-black leading-snug">“Pemimpin hari ini, untuk masa depan yang lebih baik.”</p>
            </div>
          </div>
          <motion.div
            aria-hidden="true"
            className="absolute -right-5 -top-5 hidden h-24 w-24 rounded-full border border-cyan-300/25 sm:block"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
