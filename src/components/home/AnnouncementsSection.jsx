import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, CalendarDays } from 'lucide-react';
import { fetchAnnouncements, fetchEvent } from '../../services/api.js';

const countdownCell = 'rounded-2xl border border-blue-200/60 bg-white/80 p-4 text-center shadow-sm dark:border-blue-400/10 dark:bg-slate-950/45';

function computeCountdown(target, now) {
  if (!target || Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

const CountdownGrid = memo(function CountdownGrid({ target }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target || Number.isNaN(target.getTime())) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const countdown = computeCountdown(target, now);
  const cell = (value, label, id) => (
    <div className={countdownCell}>
      <span className="block text-3xl font-black text-blue-700 dark:text-blue-300" id={id}>{value ?? '--'}</span>
      <small className="text-slate-500 dark:text-slate-400">{label}</small>
    </div>
  );

  return (
    <div aria-hidden="true" className="countdown-grid mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cell(countdown?.days, 'Hari', 'cd-days')}
      {cell(countdown?.hours, 'Jam', 'cd-hours')}
      {cell(countdown?.minutes, 'Menit', 'cd-minutes')}
      {cell(countdown?.seconds, 'Detik', 'cd-seconds')}
    </div>
  );
});

export default function AnnouncementsSection(){
  const [announcements, setAnnouncements] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    fetchAnnouncements()
      .then((data) => mounted && setAnnouncements(Array.isArray(data?.data) ? data.data : []))
      .catch(() => { if (mounted) setError(true); });
    fetchEvent()
      .then((data) => mounted && setEvent(data?.data || null))
      .catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, []);

  const countdownTarget = event?.datetime ? new Date(event.datetime) : null;
  const hasValidTarget = countdownTarget && !Number.isNaN(countdownTarget.getTime());

  const cards = announcements.length
    ? announcements.slice(0, 3).map((item) => [item.date, item.title, item.text, item.id])
    : [
        ['1 Agustus 2026','Selamat Datang di Website Resmi OSIS','Portal informasi utama kegiatan, aspirasi, dan program kerja pengurus OSIS SMA Al-Kahfi Islamic School periode ini.'],
        ['Setiap Saat','Kotak Aspirasi Telah Dibuka','Punya kritik, saran, atau ide program untuk sekolah? Sampaikan lewat kotak aspirasi di bawah.'],
        ['Menyesuaikan','Rapat Koordinasi Mingguan','Agenda rutin pengurus OSIS untuk mengevaluasi program kerja dan mempersiapkan kegiatan pekan depan.'],
      ];

  return (
    <section className="container scroll-mt-24 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="pengumuman">
      <motion.div
        className="section-title mb-10 text-center"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Pengumuman & Agenda</h2>
      </motion.div>
      <motion.div
        className="card-box countdown-box countdown-card overflow-hidden rounded-[2rem] border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-xl shadow-blue-950/5 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-slate-900 dark:to-cyan-950/30 sm:p-8"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="countdown-label flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300"><CalendarDays className="h-4 w-4" /> MENUJU EVENT BERIKUTNYA</p>
        <h3 aria-live="polite" className="mt-4 text-center text-2xl font-black text-slate-900 dark:text-white sm:text-3xl" id="countdown-event-name">{event?.name || (error ? 'Agenda belum dapat dimuat' : 'Belum ada event terjadwal')}</h3>
        <CountdownGrid target={hasValidTarget ? countdownTarget : null} />
      </motion.div>
      {error && announcements.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">Pengumuman daring belum tersedia. Menampilkan informasi bawaan.</p>
      )}
      <div className="grid-layout grid-3 mt-6 grid gap-5 md:grid-cols-3" id="publicAnnouncementCards">
        {cards.map(([date, title, text, id], i) => (
          <motion.article
            className="card-box rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/75"
            key={id || title}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="announcement-date inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Calendar className="h-3.5 w-3.5" />{date}</span>
            <h4 className="mt-4 text-lg font-black">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
