import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Copy, Mail, MapPin, Send } from 'lucide-react';
import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6';

const action = 'contact-action-v13 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[.98] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-500/10';

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button aria-label={`Salin ${label}`} className={action} onClick={copy} type="button">
      {copied ? <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      <span>{copied ? 'Tersalin' : 'Salin'}</span>
    </button>
  );
}

export default function ContactSection(){
  const reduced = useReducedMotion();
  const reveal = reduced ? false : { opacity: 0, y: 20 };

  return (
    <section className="container mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="kontak" aria-labelledby="contactTitleV13">
      <motion.div
        className="section-title mx-auto mb-10 max-w-3xl text-center"
        initial={reveal}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="section-kicker-v13 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Terhubung dengan OSIS</span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl" id="contactTitleV13">Kontak & Sosial Media</h2>
        <p className="subtitle mt-3 text-slate-600 dark:text-slate-400">Temukan kanal resmi sekolah dan OSIS dalam satu tempat.</p>
      </motion.div>

      <div className="contact-grid-v13 grid gap-5 lg:grid-cols-2">
        <motion.article
          className="contact-card-v13 flex flex-col gap-5 rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75 sm:flex-row sm:items-start"
          initial={reveal}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="contact-icon-v13 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300"><MapPin className="h-6 w-6" aria-hidden="true" /></span>
          <div className="contact-copy-v13 min-w-0">
            <span className="contact-label-v13 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Alamat Sekolah</span>
            <strong className="mt-1 block text-lg text-slate-900 dark:text-white">Al-Kahfi Islamic School</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Ruko The Capitol Imperium Block A No.42B-47. Jl. Jend. Soedirman Batam, Kepulauan Riau, Indonesia.</p>
          </div>
          <CopyButton label="Alamat" text="Ruko The Capitol Imperium Block A No.42B-47. Jl. Jend. Soedirman Batam, Kepulauan Riau, Indonesia." />
        </motion.article>

        <motion.article
          className="contact-card-v13 flex flex-col gap-5 rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75 sm:flex-row sm:items-start"
          initial={reveal}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="contact-icon-v13 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Mail className="h-6 w-6" aria-hidden="true" /></span>
          <div className="contact-copy-v13 min-w-0">
            <span className="contact-label-v13 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Email</span>
            <strong className="mt-1 block break-all text-lg text-slate-900 dark:text-white">edu@aisbatam.sch.id</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Gunakan email untuk komunikasi resmi dengan sekolah.</p>
          </div>
          <div className="contact-actions-v13 flex shrink-0 flex-wrap gap-2">
            <a aria-label="Kirim email ke sekolah" className={`${action} flex-none w-auto border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white`} href="mailto:edu@aisbatam.sch.id"><Send className="h-4 w-4" aria-hidden="true" /><span>Email</span></a>
            <CopyButton label="Email" text="edu@aisbatam.sch.id" />
          </div>
        </motion.article>
      </div>

      <motion.div
        className="social-hub-v13 mt-6 grid gap-6 overflow-hidden rounded-[2rem] border border-blue-300/10 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,.24),transparent_35%),linear-gradient(135deg,#07152f,#0b244a_55%,#08172f)] p-7 text-white shadow-xl sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:items-center"
        initial={reveal}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="social-hub-copy-v13">
          <span className="section-kicker-v13 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">Sosial Media OSIS</span>
          <h3 className="mt-3 text-2xl font-black">Ikuti kegiatan terbaru</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Dokumentasi, informasi kegiatan, dan kabar terbaru OSIS tersedia melalui kanal resmi.</p>
        </div>
        <div aria-label="Sosial media OSIS" className="social-links-v13 grid gap-3 sm:grid-cols-3">
          <a aria-label="Buka Instagram OSIS" className="social-channel-v13 instagram group flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.12] active:scale-[.99]" href="https://www.instagram.com/osis.smais/" rel="noopener noreferrer" target="_blank">
            <FaInstagram className="h-5 w-5" aria-hidden="true" />
            <div className="min-w-0 flex-1"><strong className="block">Instagram</strong><small className="text-slate-300">@osis.smais</small></div>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
          <a aria-label="Buka TikTok OSIS" className="social-channel-v13 tiktok group flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.12] active:scale-[.99]" href="https://www.tiktok.com/@osis.smais" rel="noopener noreferrer" target="_blank">
            <FaTiktok className="h-5 w-5" aria-hidden="true" />
            <div className="min-w-0 flex-1"><strong className="block">TikTok</strong><small className="text-slate-300">@osis.smais</small></div>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
          <a aria-label="Buka YouTube SMP SMA AIS Batam" className="social-channel-v13 youtube group flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.12] active:scale-[.99]" href="https://www.youtube.com/@smpsmaaisbatam" rel="noopener noreferrer" target="_blank">
            <FaYoutube className="h-5 w-5" aria-hidden="true" />
            <div className="min-w-0 flex-1"><strong className="block">YouTube</strong><small className="text-slate-300">@smpsmaaisbatam</small></div>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
