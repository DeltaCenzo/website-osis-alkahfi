import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, HandHeart, QrCode, Rocket } from 'lucide-react';

const programs = [
  { title: 'AIS Fair', Icon: CalendarDays, text: 'Agenda tahunan unggulan yang menghadirkan kompetisi edukatif, kreatif, dan interaktif untuk siswa.' },
  { title: 'Level Up', Icon: Rocket, text: 'Event baru yang menarik dan relevan dengan minat siswa agar kehidupan sekolah terasa lebih aktif.' },
  { title: 'OSIS Care', Icon: HandHeart, text: 'Aksi sosial dan kepedulian yang mengajak siswa memberi manfaat nyata bagi lingkungan sekitar.' },
  { title: 'QR Code Aspirasi', Icon: QrCode, text: 'Wadah aspirasi anonim yang memudahkan siswa menyampaikan ide, kritik, dan evaluasi kepada OSIS.' },
];

export default function ProgramsSection(){
  const reduced = useReducedMotion();

  return (
    <section id="proker" className="scroll-mt-24 overflow-hidden px-5 py-20 text-slate-950 sm:px-6 lg:px-8 lg:py-28 dark:text-white">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <motion.div
            className="lg:col-span-7"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-700 dark:text-cyan-300">Aksi nyata, hasil nyata</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-5xl dark:text-white">Program Kerja <span className="text-cyan-700 dark:text-cyan-300">Unggulan</span></h2>
          </motion.div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 lg:col-span-5 lg:justify-self-end dark:text-slate-300">Program dirancang untuk mengembangkan potensi siswa, memperkuat partisipasi, dan memberi dampak positif bagi lingkungan sekolah.</p>
        </div>

        <div className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {programs.map(({ title, Icon, text }, index) => (
            <motion.article
              key={title}
              initial={reduced ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.52, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduced ? undefined : { y: -5 }}
              className="group min-w-[82vw] snap-start rounded-[1.7rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_65px_-42px_rgba(15,23,42,.35)] transition-colors hover:border-cyan-300/80 sm:min-w-0 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex min-h-[230px] flex-col">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200/70 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-300/15"><Icon className="h-6 w-6" /></span>
                <div className="mt-auto pt-12">
                  <h3 className="text-xl font-black tracking-[-.02em] text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500 transition group-hover:text-cyan-700 dark:text-slate-400 dark:group-hover:text-cyan-300">Pelajari program <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
