
import { motion } from 'framer-motion';

export default function EventPage(){
  return <section className="mx-auto max-w-6xl px-5 py-24">
    <div className="mb-10">
      <h1 className="text-4xl font-black">Event OSIS</h1>
      <p className="mt-3 text-slate-600">Informasi kegiatan dan event terbaru OSIS Al-Kahfi.</p>
    </div>
    <motion.article whileHover={{y:-6}} className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-950 via-blue-700 to-emerald-500 p-8 text-white shadow-2xl">
      <p className="text-sm font-bold tracking-widest text-emerald-200">EVENT UNGGULAN</p>
      <h2 className="mt-3 text-4xl font-black">AIS FAIR 2026</h2>
      <p className="mt-3 max-w-2xl text-white/85">Small Bytes, Big Impact. Kompetisi akademik, bahasa, olahraga, dan keislaman untuk siswa SMP dan SMA.</p>
      <button onClick={()=>window.history.pushState({},'', '/ais-fair-2026')} className="mt-6 rounded-full bg-white px-6 py-3 font-bold text-blue-900">Lihat Detail</button>
    </motion.article>
  </section>
}
