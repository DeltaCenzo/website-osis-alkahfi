import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GalleryManager from '../components/admin/GalleryManager.jsx';
import SecretaryContentManager from '../components/admin/SecretaryContentManager.jsx';
import LeadershipWorkspace from '../components/admin/LeadershipWorkspace.jsx';
import TreasuryWorkspace from '../components/admin/TreasuryWorkspace.jsx';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Crown,
  FileDown,
  FileText,
  Languages,
  Landmark,
  LogOut,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const ROLE_META = {
  leadership: {
    label: 'Ketua & Wakil',
    Icon: Crown,
    description: 'Ringkasan, aspirasi, dan koordinasi seluruh program.',
    focuses: [
      ['Aspirasi', 'Pantau aspirasi baru dan status tindak lanjut.', MessageSquareText],
      ['Koordinasi', 'Tinjau agenda, pengumuman, dan pekerjaan lintas divisi.', Users],
      ['Evaluasi', 'Gunakan dashboard administrasi lengkap untuk memeriksa progres.', CheckCircle2],
    ],
  },
  secretariat: {
    label: 'Sekretaris',
    Icon: FileText,
    description: 'Pengumuman, agenda, administrasi, dan informasi resmi.',
  },
  treasury: {
    label: 'Bendahara',
    Icon: Banknote,
    description: 'Ringkasan kegiatan dan kebutuhan administrasi keuangan.',
    focuses: [
      ['Agenda Kegiatan', 'Pantau jadwal kegiatan yang membutuhkan persiapan administrasi.', CalendarDays],
      ['Administrasi', 'Gunakan catatan internal untuk koordinasi kebutuhan kegiatan.', ClipboardList],
      ['Koordinasi', 'Sinkronkan kebutuhan dengan Ketua, Wakil, dan Sekretaris.', Users],
    ],
  },
  humas: {
    label: 'Divisi Humas',
    Icon: Megaphone,
    description: 'Galeri, publikasi, dokumentasi, dan komunikasi.',
    focuses: [
      ['Dokumentasi', 'Kelola galeri dan dokumentasi kegiatan sekolah.', Camera],
      ['Publikasi', 'Koordinasikan pengumuman dan informasi publik OSIS.', Megaphone],
      ['Komunikasi', 'Jaga konsistensi informasi yang tampil pada website.', Users],
    ],
  },
  ibadah: {
    label: 'Divisi Ibadah / Keagamaan',
    Icon: Landmark,
    description: 'Agenda kegiatan dan informasi program keagamaan.',
  },
  bahasa: {
    label: 'Divisi Bahasa',
    Icon: Languages,
    description: 'Pengumuman, publikasi, dan program kebahasaan.',
    focuses: [
      ['Publikasi', 'Siapkan informasi program kebahasaan yang jelas dan konsisten.', Megaphone],
      ['Program Bahasa', 'Pantau agenda kegiatan dan kebutuhan publikasi.', Languages],
      ['Koordinasi', 'Sinkronkan informasi dengan Sekretaris dan Humas.', Users],
    ],
  },
};

const panelShell = 'rounded-[2rem] border border-slate-200/70 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75 sm:p-6 lg:p-7';
const field = 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white';
const label = 'text-sm font-bold text-slate-800 dark:text-slate-200';

function DashboardHeader({ role }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  const Icon = meta.Icon;
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/70 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Workspace Pengurus</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{meta.label}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{meta.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start">
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <ShieldCheck className="h-4 w-4" /> Role aktif
        </span>
        <button
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-blue-200"
          onClick={() => window.dispatchEvent(new CustomEvent('osis:workspace-select-open'))}
          type="button"
        >
          Ganti Area Kerja
        </button>
        <button
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-red-200"
          onClick={() => window.dispatchEvent(new CustomEvent('osis:workspace-logout'))}
          type="button"
        >
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  );
}

function RoleOverview({ role }) {
  const meta = ROLE_META[role];
  if (!meta?.focuses) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {meta.focuses.map(([title, copy, Icon]) => (
        <motion.article
          key={title}
          className="h-full rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.18 }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-300"><Icon className="h-5 w-5" /></span>
          <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{copy}</p>
        </motion.article>
      ))}
    </div>
  );
}

const violationTypes = [
  'Ketertiban kegiatan ibadah',
  'Adab berbicara dan bersikap',
  'Kedisiplinan kegiatan keagamaan',
  'Kebersihan dan kepedulian lingkungan',
  'Ketertiban berpakaian sesuai aturan sekolah',
  'Lainnya',
];

function IbadahViolationWorkspace() {
  const [form, setForm] = useState({ name: '', className: '', type: violationTypes[0], date: new Date().toISOString().slice(0, 10), count: 1 });
  const [entries, setEntries] = useState([]);

  const aggregated = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      const key = `${entry.name.trim().toLowerCase()}::${entry.className.trim().toLowerCase()}`;
      const current = map.get(key) || { name: entry.name, className: entry.className, total: 0, latest: entry.date, types: new Set() };
      current.total += Number(entry.count) || 0;
      if (entry.date > current.latest) current.latest = entry.date;
      current.types.add(entry.type);
      map.set(key, current);
    });
    return Array.from(map.values()).map((item) => ({ ...item, types: Array.from(item.types) })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [entries]);

  const escalated = aggregated.filter((item) => item.total >= 5);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.className.trim() || !form.date) return;
    setEntries((current) => [...current, { ...form, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` }]);
    setForm((current) => ({ ...current, name: '', className: '', count: 1 }));
  };

  const draftFor = (student) => `Yth. Pembina OSIS,\n\nMohon peninjauan terhadap catatan pembinaan siswa berikut:\nNama: ${student.name}\nKelas: ${student.className}\nAkumulasi catatan: ${student.total} kali\nKategori terkait: ${student.types.join(', ')}\n\nStatus sistem: Siap Dilaporkan ke Pembina OSIS.\n\nCatatan ini merupakan draf administrasi awal dan perlu diverifikasi kembali sesuai tata tertib resmi sekolah sebelum tindak lanjut.`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35" onSubmit={submit}>
          <div className="mb-5"><h3 className="font-black text-slate-950 dark:text-white">Catat Pelanggaran Siswa</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Gunakan kategori yang telah disesuaikan dengan tata tertib resmi sekolah. Data pada modul ini belum disimpan ke server.</p></div>
          <div className="space-y-4">
            <label className={label}>Nama Siswa<input className={field} onChange={(e) => update('name', e.target.value)} placeholder="Nama lengkap siswa" required type="text" value={form.name} /></label>
            <label className={label}>Kelas<input className={field} onChange={(e) => update('className', e.target.value)} placeholder="Contoh: XI IPA 1" required type="text" value={form.className} /></label>
            <label className={label}>Jenis Pelanggaran<select className={field} onChange={(e) => update('type', e.target.value)} value={form.type}>{violationTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className={label}>Tanggal<input className={field} onChange={(e) => update('date', e.target.value)} required type="date" value={form.date} /></label>
              <label className={label}>Jumlah Pelanggaran<input className={field} max="5" min="1" onChange={(e) => update('count', Math.max(1, Math.min(5, Number(e.target.value) || 1)))} required type="number" value={form.count} /></label>
            </div>
          </div>
          <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500" type="submit"><ClipboardList className="h-4 w-4" /> Simpan Catatan</button>
        </form>

        <div className="min-w-0 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/45 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950 dark:text-white">Akumulasi Pelanggaran</h3><p className="text-xs text-slate-500 dark:text-slate-400">Batas eskalasi otomatis: 5 kali pelanggaran.</p></div><span className="inline-flex self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{aggregated.length} siswa</span></div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-4 py-3">Siswa</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Terakhir</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody>{aggregated.length ? aggregated.map((item) => <tr className="border-t border-slate-200 dark:border-slate-800" key={`${item.name}-${item.className}`}><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.className}</td><td className="px-4 py-3"><span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-1 text-xs font-black ${item.total >= 5 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'}`}>{item.total}</span></td><td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.latest}</td><td className="px-4 py-3">{item.total >= 5 ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Siap Dilaporkan ke Pembina OSIS</span> : <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pemantauan</span>}</td></tr>) : <tr><td className="px-4 py-10 text-center text-slate-500 dark:text-slate-400" colSpan="5">Belum ada catatan pelanggaran.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>

      {escalated.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{escalated.map((student) => <motion.article className="rounded-3xl border border-amber-300/70 bg-amber-50/80 p-5 dark:border-amber-500/25 dark:bg-amber-500/10" key={`${student.name}-${student.className}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><FileDown className="h-5 w-5" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Draf Laporan Otomatis</p><h3 className="mt-1 font-black text-slate-950 dark:text-white">{student.name} · {student.className}</h3></div></div><textarea className="mt-4 min-h-48 w-full resize-y rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm leading-6 text-slate-700 outline-none dark:border-amber-500/20 dark:bg-slate-950/45 dark:text-slate-200" readOnly value={draftFor(student)} /></motion.article>)}</div>}
    </div>
  );
}

export default function RoleWorkspaceDashboard({ activeRole = null }) {
  const [role, setRole] = useState(() => {
    if (activeRole && ROLE_META[activeRole]) return activeRole;
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    return urlRole && ROLE_META[urlRole] ? urlRole : null;
  });

  useEffect(() => {
    if (activeRole && ROLE_META[activeRole]) setRole(activeRole);
    const initialRole = document.body.dataset.adminWorkspace;
    if (initialRole && ROLE_META[initialRole]) setRole(initialRole);

    const onWorkspace = (event) => setRole(event.detail?.key && ROLE_META[event.detail.key] ? event.detail.key : null);
    const onLogout = () => setRole(null);
    window.addEventListener('osis:workspace-change', onWorkspace);
    window.addEventListener('osis:workspace-logout', onLogout);
    return () => {
      window.removeEventListener('osis:workspace-change', onWorkspace);
      window.removeEventListener('osis:workspace-logout', onLogout);
    };
  }, [activeRole]);

  if (!role || !ROLE_META[role]) return null;

  return (
    <section className="mx-auto w-full max-w-7xl scroll-mt-28 px-4 pt-12 sm:px-6 lg:px-8" id={`workspace-${role}`} aria-label={`Dashboard ${ROLE_META[role].label}`}>
      <div className={panelShell}>
        <DashboardHeader role={role} />
        {role === 'secretariat' ? (
          <div className="space-y-8">
            <SecretaryContentManager />
          </div>
        ) : role === 'ibadah' ? <IbadahViolationWorkspace /> : role === 'humas' ? <GalleryManager /> : role === 'leadership' ? <LeadershipWorkspace /> : role === 'treasury' ? <TreasuryWorkspace /> : <RoleOverview role={role} />}
      </div>
    </section>
  );
}
