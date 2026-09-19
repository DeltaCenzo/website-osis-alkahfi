import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing,
  CalendarDays,
  Check,
  ClipboardList,
  Download,
  FileText,
  ImagePlus,
  Megaphone,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  listAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  fetchEvent,
  saveEvent,
} from '../../services/api.js';
import { getAdminSessionToken } from '../../lib/adminSession.js';
import { exportCsv } from '../../lib/export.js';

const field = 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white';
const label = 'text-sm font-bold text-slate-800 dark:text-slate-200';

const CATEGORIES = ['Informasi', 'Kegiatan', 'Lomba', 'Rapat', 'Akademik', 'Prestasi', 'Pendaftaran', 'Penting'];

const emptyAnnouncement = { id: '', title: '', category: 'Informasi', date: '', startDate: '', endDate: '', pinned: false, active: true, text: '' };

function escapeReportHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function WeeklyReport() {
  const [form, setForm] = useState({ week: '', startDate: '', endDate: '', summary: '', achievement: '' });
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState(false);
  const objectUrlsRef = useRef([]);

  useEffect(() => () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const onPhotoChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 6);
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    objectUrlsRef.current = next.map((item) => item.url);
    setPhotos(next);
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      objectUrlsRef.current = next.map((item) => item.url);
      return next;
    });
  };

  const printReport = () => {
    const title = `Laporan Mingguan OSIS${form.week ? ` - Minggu ${form.week}` : ''}`;
    const safeTitle = escapeReportHtml(title);
    const safeSummary = escapeReportHtml(form.summary || 'Belum diisi.');
    const safeAchievement = escapeReportHtml(form.achievement || 'Belum diisi.');
    const safeStart = escapeReportHtml(form.startDate || '—');
    const safeEnd = escapeReportHtml(form.endDate || '—');
    const photoHtml = photos.map((item) => `<img src="${item.url}" alt="Dokumentasi" style="width:31%;height:150px;object-fit:cover;border-radius:12px;margin:1%;" />`).join('');
    const popup = window.open('', '_blank', 'width=960,height=760');
    if (!popup) return;
    popup.opener = null;
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:36px;line-height:1.55}h1{margin:0 0 6px;font-size:26px}h2{font-size:15px;margin:24px 0 7px;text-transform:uppercase;letter-spacing:.08em;color:#475569}.meta{color:#64748b;font-size:13px;border-bottom:1px solid #cbd5e1;padding-bottom:18px}.box{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px}.photos{display:flex;flex-wrap:wrap;margin:0 -1%}@media print{button{display:none}body{padding:0}}</style></head><body><h1>${safeTitle}</h1><div class="meta">Periode ${safeStart} s.d. ${safeEnd} · OSIS SMA Al-Kahfi Islamic School</div><h2>Ringkasan Kegiatan</h2><div class="box">${safeSummary}</div><h2>Detail Capaian Program</h2><div class="box">${safeAchievement}</div>${photos.length ? `<h2>Dokumentasi</h2><div class="photos">${photoHtml}</div>` : ''}<script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`);
    popup.document.close();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/35 sm:p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-300"><FileText className="h-5 w-5" /></span>
          <div><h3 className="font-black text-slate-950 dark:text-white">Laporan Mingguan OSIS</h3><p className="text-xs text-slate-500 dark:text-slate-400">Template administrasi untuk dokumentasi kegiatan mingguan.</p></div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className={label}>Minggu Ke-<input className={field} min="1" onChange={(e) => update('week', e.target.value)} placeholder="Contoh: 3" type="number" value={form.week} /></label>
          <label className={label}>Tanggal Mulai<input className={field} onChange={(e) => update('startDate', e.target.value)} type="date" value={form.startDate} /></label>
          <label className={label}>Tanggal Selesai<input className={field} onChange={(e) => update('endDate', e.target.value)} type="date" value={form.endDate} /></label>
        </div>

        <label className={`${label} mt-5 block`}>Ringkasan Kegiatan<textarea className={`${field} min-h-32 resize-y`} onChange={(e) => update('summary', e.target.value)} placeholder="Tuliskan kegiatan utama, rapat, koordinasi, atau agenda yang dilaksanakan..." value={form.summary} /></label>
        <label className={`${label} mt-5 block`}>Detail Capaian Program<textarea className={`${field} min-h-40 resize-y`} onChange={(e) => update('achievement', e.target.value)} placeholder="Jelaskan progres, capaian, kendala, dan tindak lanjut program kerja..." value={form.achievement} /></label>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3"><span className={label}>Foto Dokumentasi</span><span className="text-xs text-slate-400 dark:text-slate-500">Maks. 6 foto</span></div>
          <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:bg-blue-500/10">
            <ImagePlus className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Pilih foto dokumentasi</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, atau WebP</span>
            <input accept="image/*" className="sr-only" multiple onChange={onPhotoChange} type="file" />
          </label>
          {photos.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((item, index) => <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700" key={`${item.file.name}-${index}`}><img alt={`Dokumentasi ${index + 1}`} className="aspect-[4/3] w-full object-cover" src={item.url} /><button aria-label={`Hapus foto ${index + 1}`} className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-xl bg-slate-950/70 text-white backdrop-blur" onClick={() => removePhoto(index)} type="button"><X className="h-4 w-4" /></button></div>)}</div>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200" onClick={() => setPreview((value) => !value)} type="button"><Sparkles className="h-4 w-4" /> Pratinjau Laporan</button>
          <button className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-500" onClick={printReport} type="button"><Printer className="h-4 w-4" /> Cetak / Ekspor Laporan</button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/45">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-blue-600 dark:text-blue-300"><Upload className="h-4 w-4" /> Alur Laporan</span>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><li><strong>1.</strong> Isi periode dan ringkasan kegiatan.</li><li><strong>2.</strong> Catat capaian program beserta kendala/tindak lanjut.</li><li><strong>3.</strong> Tambahkan foto dokumentasi bila diperlukan.</li><li><strong>4.</strong> Pratinjau lalu gunakan Cetak/Ekspor untuk menyimpan sebagai PDF.</li></ol>
        </div>
        {preview && <motion.div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-500/20 dark:bg-blue-500/10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><p className="text-xs font-extrabold uppercase tracking-[0.17em] text-blue-600 dark:text-blue-300">Pratinjau</p><h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">Laporan Mingguan{form.week ? ` · Minggu ${form.week}` : ''}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{form.startDate || 'Tanggal mulai'} — {form.endDate || 'Tanggal selesai'}</p><div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200"><div><strong>Ringkasan</strong><p className="mt-1 whitespace-pre-wrap">{form.summary || 'Belum ada ringkasan.'}</p></div><div><strong>Capaian</strong><p className="mt-1 whitespace-pre-wrap">{form.achievement || 'Belum ada capaian yang dicatat.'}</p></div></div></motion.div>}
      </aside>
    </div>
  );
}

export default function SecretaryContentManager(){
  const [tab, setTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState(emptyAnnouncement);
  const [editing, setEditing] = useState(false);
  const [eventForm, setEventForm] = useState({ name: '', datetime: '', active: true });

  const token = getAdminSessionToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [annData, eventData] = await Promise.all([
        listAnnouncements(token),
        fetchEvent(),
      ]);
      if (annData?.success === false) {
        setError(annData?.message || 'Gagal memuat pengumuman.');
        return;
      }
      setAnnouncements(Array.isArray(annData?.data) ? annData.data : []);
      const ev = eventData?.data || null;
      setEvent(ev);
      if (ev) {
        const dt = ev.datetime ? String(ev.datetime).slice(0, 16) : '';
        setEventForm({ name: ev.name || '', datetime: dt, active: ev.active !== false });
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item) => {
    setEditing(true);
    setForm({
      id: item.id || '',
      title: item.title || '',
      category: item.category || 'Informasi',
      date: item.date || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      pinned: Boolean(item.pinned),
      active: item.active !== false,
      text: item.text || '',
    });
    setNotice('');
    setError('');
  };

  const resetForm = () => {
    setEditing(false);
    setForm(emptyAnnouncement);
    setNotice('');
    setError('');
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.text.trim()) {
      setError('Judul dan isi pengumuman wajib diisi.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await saveAnnouncement(token, form);
      if (result?.success) {
        setNotice(editing ? 'Pengumuman diperbarui.' : 'Pengumuman ditambahkan.');
        resetForm();
        await load();
      } else {
        setError(result?.message || 'Gagal menyimpan pengumuman.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan pengumuman.');
    } finally {
      setBusy(false);
    }
  };

  const removeAnnouncement = async (id, title) => {
    if (!window.confirm(`Hapus pengumuman "${title}"?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await deleteAnnouncement(token, id);
      if (result?.success) {
        setNotice('Pengumuman dihapus.');
        await load();
      } else {
        setError(result?.message || 'Gagal menghapus pengumuman.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal menghapus pengumuman.');
    } finally {
      setBusy(false);
    }
  };

  const exportAnnouncements = () => {
    exportCsv(
      `pengumuman-osis-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Judul', 'Kategori', 'Tanggal', 'Mulai', 'Selesai', 'Dipin', 'Aktif', 'Isi'],
        ...announcements.map((item) => [
          item.title || '',
          item.category || '',
          item.date || '',
          item.startDate || '',
          item.endDate || '',
          item.pinned ? 'Ya' : 'Tidak',
          item.active === false ? 'Tidak' : 'Ya',
          item.text || '',
        ]),
      ],
    );
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.name.trim() || !eventForm.datetime) {
      setError('Nama dan tanggal/waktu agenda wajib diisi.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await saveEvent(token, eventForm);
      if (result?.success) {
        setNotice('Agenda diperbarui.');
        await load();
      } else {
        setError(result?.message || 'Gagal menyimpan agenda.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan agenda.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab('announcements')}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === 'announcements' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
        >
          <Megaphone className="h-4 w-4" /> Pengumuman
        </button>
        <button
          type="button"
          onClick={() => setTab('event')}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === 'event' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
        >
          <CalendarDays className="h-4 w-4" /> Agenda / Event
        </button>
        <button
          type="button"
          onClick={() => setTab('report')}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === 'report' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
        >
          <ClipboardList className="h-4 w-4" /> Laporan Mingguan
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" role="status">{notice}</p>}

      <AnimatePresence mode="wait">
        {tab === 'announcements' ? (
          <motion.div key="ann" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/35 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <h3 className="font-black text-slate-950 dark:text-white">{editing ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3>
                {editing && <button type="button" onClick={resetForm} className="ml-auto inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5" /> Batal</button>}
              </div>

              <form onSubmit={submitAnnouncement} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={label}>Judul<input className={field} maxLength={90} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Judul pengumuman" required value={form.title} /></label>
                  <label className={label}>Kategori
                    <select className={field} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} value={form.category}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className={label}>Label Tanggal<input className={field} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="Contoh: 1 Agustus 2026" value={form.date} /></label>
                  <label className={label}>Tanggal Mulai<input className={field} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} type="date" value={form.startDate} /></label>
                  <label className={label}>Tanggal Selesai<input className={field} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} type="date" value={form.endDate} /></label>
                </div>

                <label className={`${label} block`}>Isi Pengumuman<textarea className={`${field} min-h-28 resize-y`} maxLength={320} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} placeholder="Isi pengumuman..." required value={form.text} /></label>

                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="h-5 w-5 cursor-pointer rounded accent-blue-600" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} /> Dipin (tampil di atas)
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="h-5 w-5 cursor-pointer rounded accent-blue-600" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Aktif
                  </label>
                </div>

                <button type="submit" disabled={busy} className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50">
                  {busy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-slate-950 dark:text-white">Daftar Pengumuman</h3>
                <button type="button" onClick={exportAnnouncements} disabled={!announcements.length} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
              {loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Memuat...</p>
              ) : announcements.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pengumuman.</p>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-950 dark:text-white">{item.title}</h4>
                        {item.pinned && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">Dipin</span>}
                        {!item.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Nonaktif</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.category} · {item.date}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => startEdit(item)} className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button type="button" onClick={() => removeAnnouncement(item.id, item.title)} className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : tab === 'report' ? (
          <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <WeeklyReport />
          </motion.div>
        ) : (
          <motion.div key="event" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/35 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <h3 className="font-black text-slate-950 dark:text-white">Agenda / Event Berikutnya</h3>
              </div>
              <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Agenda ini tampil sebagai countdown di bagian "Pengumuman & Agenda" halaman utama.</p>

              <form onSubmit={submitEvent} className="space-y-4">
                <label className={label}>Nama Event<input className={field} maxLength={120} onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: AIS Fair 2026" required value={eventForm.name} /></label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={label}>Tanggal & Waktu<input className={field} onChange={(e) => setEventForm((f) => ({ ...f, datetime: e.target.value }))} type="datetime-local" required value={eventForm.datetime} /></label>
                  <label className="inline-flex cursor-pointer items-center gap-2 pt-7 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="h-5 w-5 cursor-pointer rounded accent-blue-600" checked={eventForm.active} onChange={(e) => setEventForm((f) => ({ ...f, active: e.target.checked }))} /> Aktif (tampil di halaman utama)
                  </label>
                </div>
                <button type="submit" disabled={busy} className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50">
                  <Check className="h-4 w-4" /> {busy ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </form>
            </div>

            {event && (
              <div className="rounded-2xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">Agenda tersimpan saat ini</p>
                <h4 className="mt-2 font-black text-slate-950 dark:text-white">{event.name}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{event.datetime}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}