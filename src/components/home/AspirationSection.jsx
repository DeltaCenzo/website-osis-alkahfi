import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { countAspirations, submitAspiration } from '../../services/api.js';

const field = 'form-control mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white';
const label = 'form-label text-sm font-bold text-slate-800 dark:text-slate-200';

export default function AspirationSection(){
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [sender, setSender] = useState('Siswa');
  const [category, setCategory] = useState('Kritik & Saran untuk OSIS');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const reduced = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    countAspirations()
      .then((data) => mounted && data?.success && setCount(Number(data.total) || 0))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (status === 'done') setStatus('idle');
    if (!message.trim()) {
      setError('Mohon isi pesan aspirasi.');
      return;
    }
    setStatus('busy');
    setError('');
    try {
      const result = await submitAspiration({
        nama: name.trim(),
        kelas: sender,
        kategori: category,
        aspirasi: message.trim(),
        website: '',
      });
      if (result?.success) {
        setStatus('done');
        setMessage('');
        setName('');
        setCount((c) => c + 1);
      } else {
        setStatus('idle');
        setError(result?.message || 'Gagal mengirim aspirasi.');
      }
    } catch {
      setStatus('idle');
      setError('Tidak dapat menghubungi server. Coba lagi nanti.');
    }
  };

  return (
    <section className="container scroll-mt-24 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="kritik-saran" aria-labelledby="aspirasi-title">
      <motion.div
        className="section-title mb-10 text-center sm:mb-12"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl" id="aspirasi-title">Kotak Aspirasi</h2>
        <p className="subtitle mt-3 text-slate-600 dark:text-slate-400">Sampaikan saran, kritik, atau ide kamu demi kemajuan SMA Al-Kahfi.</p>
      </motion.div>

      <div className="interactive-box rounded-[2rem] border border-slate-200/70 bg-white/85 p-4 shadow-2xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75 sm:p-6 xl:p-7">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
          <aside className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-[1.75rem] border border-blue-200/60 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-cyan-500/10" id="aspirasiCounter">
              <div className="counter-box inline-flex items-end gap-3 rounded-2xl bg-blue-600/10 px-5 py-3 text-blue-700 dark:text-blue-300">
                <strong className="stat-number text-3xl font-black">{count}</strong>
                <span className="pb-1 text-sm font-bold">Aspirasi Masuk</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Suara siswa dan guru membantu OSIS menentukan evaluasi, perbaikan, dan program berikutnya.</p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-300">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Ruang Aspirasi yang Aman</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>• Nama bisa dikosongkan jika ingin anonim.</li>
                <li>• Pilih peran pengirim dan ranah aspirasi agar lebih mudah diproses.</li>
                <li>• Tulis pesan yang jelas, singkat, dan sopan agar cepat ditindaklanjuti.</li>
              </ul>
            </div>

            <div className="aspirasi-privacy-v8 flex gap-3 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100" id="asp-privacy" role="note">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p><strong>Privasi aspirasi.</strong> Hindari mencantumkan password, nomor identitas, informasi kesehatan, atau data pribadi sensitif lainnya.</p>
            </div>
          </aside>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/45 sm:p-5 lg:p-6">
            <form aria-describedby="asp-privacy" id="aspirasiForm" noValidate className="space-y-5" onSubmit={onSubmit}>
              <div aria-hidden="true" className="asp-honeypot hidden"><label htmlFor="asp-website">Website</label><input autoComplete="off" id="asp-website" tabIndex="-1" type="text" /></div>

              <div className="form-group">
                <label className={label} htmlFor="asp-nama">Nama <span className="optional-label font-normal text-slate-400 dark:text-slate-500">(opsional)</span></label>
                <input autoComplete="name" className={field} id="asp-nama" maxLength="80" onChange={(e) => setName(e.target.value)} placeholder="Kosongkan jika ingin anonim" type="text" value={name} />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="form-group">
                  <label className={label} htmlFor="asp-kelas">Pengirim</label>
                  <select aria-label="Jenis pengirim aspirasi" className={field} id="asp-kelas" onChange={(e) => setSender(e.target.value)} value={sender}>
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                  </select>
                  <span className="form-note mt-2 block text-xs text-slate-500 dark:text-slate-400">Pilih sesuai peran pengirim aspirasi.</span>
                </div>

                <div className="form-group">
                  <label className={label} htmlFor="asp-category">Ranah Aspirasi</label>
                  <select aria-label="Ranah aspirasi OSIS dan kesiswaan" className={field} id="asp-category" onChange={(e) => setCategory(e.target.value)} value={category}>
                    {['Program & Kegiatan OSIS','Event, Lomba & Kreativitas','Ekskul & Minat Bakat','Kesejahteraan & Kenyamanan Siswa','Disiplin & Tata Tertib','Kebersihan & Lingkungan','Fasilitas Siswa','Keagamaan','Sosial & Kepedulian','Informasi & Komunikasi OSIS','Kritik & Saran untuk OSIS','Lainnya'].map(v => <option value={v} key={v}>{v}</option>)}
                  </select>
                  <span className="form-note mt-2 block text-xs text-slate-500 dark:text-slate-400">Pilih bidang yang paling dekat dengan hal yang ingin disampaikan.</span>
                </div>
              </div>

              <div className="form-group">
                <label className={label} htmlFor="asp-pesan">Pesan Aspirasi</label>
                <textarea aria-describedby="asp-privacy asp-char-count asp-error" aria-invalid={error ? 'true' : 'false'} className={`${field} min-h-44 resize-y`} id="asp-pesan" maxLength="2000" onChange={(e) => setMessage(e.target.value)} placeholder="Tuliskan aspirasi kamu secara jelas..." required rows="7" value={message} />
                <div className="aspirasi-field-meta mt-2 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="form-note">Maksimal 2.000 karakter.</span>
                  <span aria-live="polite" className="asp-char-count" id="asp-char-count">{message.length} / 2000</span>
                </div>
                {error && <div aria-live="assertive" className="form-note mt-2 text-sm font-semibold text-red-500" id="asp-error" role="alert">{error}</div>}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Dengan mengirim formulir ini, kamu membantu OSIS memberikan tindak lanjut yang lebih cepat dan terarah.</p>
                <button className="aspirasi-btn inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 sm:w-auto" disabled={status === 'busy'} type="submit"><Send className="h-4 w-4" /> {status === 'busy' ? 'Mengirim...' : status === 'done' ? 'Terkirim ✓' : 'Kirim Pesan'}</button>
              </div>
              {status === 'done' && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" role="status">Aspirasi berhasil dikirim. Terima kasih!</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
