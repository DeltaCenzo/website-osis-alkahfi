import { motion, useReducedMotion } from 'framer-motion';
import { Eye, Rocket, CheckCircle2 } from 'lucide-react';

const missions = [
  'Membangun komunikasi terbuka antara OSIS dan siswa melalui wadah aspirasi dan interaksi.',
  'Mendorong siswa untuk aktif menyampaikan ide, pendapat, dan evaluasi.',
  'Mengembangkan kegiatan positif, kreatif, dan bermanfaat bagi siswa.',
  'Menumbuhkan kepedulian serta akhlak mulia.',
  'Melakukan evaluasi dan perbaikan agar OSIS semakin responsif dan berdampak.',
];

export default function VisionMissionSection(){
  const reduced = useReducedMotion();

  return (
    <section className="container scroll-mt-24 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="visi-misi">
      <motion.div
        className="section-title mb-10 text-center"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Visi & Misi OSIS</h2>
      </motion.div>
      <div className="grid-layout grid-2 grid gap-6 lg:grid-cols-2">
        <motion.article
          className="card-box group rounded-[2rem] border border-slate-200/70 bg-white/85 p-7 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/75 sm:p-9"
          initial={reduced ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="section-highlight flex items-center gap-3 text-xl font-black text-slate-950 dark:text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300"><Eye className="h-5 w-5" /></span>Visi</h3>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">Mewujudkan OSIS yang aktif, dekat dengan siswa, berkarakter, dan bertanggung jawab dalam menciptakan lingkungan sekolah yang positif serta berlandaskan nilai-nilai Islam.</p>
        </motion.article>
        <motion.article
          className="card-box rounded-[2rem] border border-slate-200/70 bg-white/85 p-7 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/75 sm:p-9"
          initial={reduced ? false : { opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="section-highlight flex items-center gap-3 text-xl font-black text-slate-950 dark:text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Rocket className="h-5 w-5" /></span>Misi</h3>
          <ul className="clean-list mt-5 space-y-3">
            {missions.map((item, i) => (
              <motion.li
                className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
                key={item}
                initial={reduced ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />{item}
              </motion.li>
            ))}
          </ul>
        </motion.article>
      </div>
    </section>
  );
}
