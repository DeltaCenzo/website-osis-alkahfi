import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Laptop,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Loader2,
  CircleDashed,
  Download,
} from 'lucide-react';
import {
  changePassword,
  deleteAspiration,
  listAspirations,
  login,
  trustedDeviceEnroll,
  trustedDeviceList,
  trustedDeviceRevoke,
  updateAspiration,
} from '../../services/api.js';
import { getAdminSessionToken, getClientId } from '../../lib/adminSession.js';
import { exportCsv } from '../../lib/export.js';

const field = 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white';
const label = 'text-sm font-bold text-slate-800 dark:text-slate-200';

const TRUSTED_KEY = 'osis_trusted_device_v1'; // ponytail: trusted token disimpan plaintext di localStorage (rawan XSS). Pindah ke httpOnly cookie bila backend mendukung.
const STATUS_META = {
  unread: { label: 'Baru', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  processing: { label: 'Diproses', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  done: { label: 'Selesai', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
};

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch {}
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); } catch {}
}

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function senderType(kelas) {
  if (!kelas || kelas === '-') return 'Umum';
  if (/guru|ustadz|pembina/i.test(kelas)) return 'Guru / Staf';
  return 'Siswa';
}

function AspirationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const token = getAdminSessionToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAspirations(token);
      if (result?.success === false) {
        setError(result?.message || 'Gagal memuat aspirasi.');
        return;
      }
      setItems(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat aspirasi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (item, status) => {
    if (busyId) return;
    setBusyId(item.id);
    setError('');
    try {
      const result = await updateAspiration(token, {
        id: item.id,
        category: item.category,
        priority: item.priority,
        status,
        internalNote: item.internalNote || '',
      });
      if (result?.success) {
        await load();
      } else {
        setError(result?.message || 'Gagal memperbarui status.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui status.');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus aspirasi dari "${item.name || 'Anonim'}"?`)) return;
    if (busyId) return;
    setBusyId(item.id);
    setError('');
    try {
      const result = await deleteAspiration(token, item.id);
      if (result?.success) {
        await load();
      } else {
        setError(result?.message || 'Gagal menghapus aspirasi.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal menghapus aspirasi.');
    } finally {
      setBusyId('');
    }
  };

  const counts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, { total: 0 });

  const filtered = filter === 'all' ? items : items.filter((item) => item.status === filter);

  const downloadCsv = () => {
    const statusLabel = { unread: 'Baru', processing: 'Diproses', done: 'Selesai' };
    exportCsv(
      `aspirasi-osis-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Waktu', 'Nama', 'Pengirim', 'Kategori', 'Pesan', 'Prioritas', 'Status', 'Catatan Internal'],
        ...filtered.map((item) => [
          formatDate(item.timestamp),
          item.name || 'Anonim',
          senderType(item.kelas),
          item.category || 'Lainnya',
          item.message || '',
          item.priority || 'normal',
          statusLabel[item.status] || item.status,
          item.internalNote || '',
        ]),
      ],
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-950 dark:text-white">Aspirasi Warga Sekolah</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pantau aspirasi yang dikirim ke kotak aspirasi OSIS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadCsv} disabled={!items.length} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button type="button" onClick={load} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['all', 'Semua'], ['unread', 'Baru'], ['processing', 'Diproses'], ['done', 'Selesai']].map(([key, text]) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${filter === key ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
            {text}
            <span className={`rounded-full px-2 py-0.5 text-xs ${filter === key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{key === 'all' ? counts.total : counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat aspirasi...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950/45">
          <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada aspirasi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const status = STATUS_META[item.status] || STATUS_META.unread;
            const busy = busyId === item.id;
            return (
              <motion.article key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/45">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black text-slate-950 dark:text-white">{item.name || 'Anonim'}</h4>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{senderType(item.kelas)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.cls}`}>{status.label}</span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{formatDate(item.timestamp)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                {item.category && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Kategori: {item.category}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {item.status !== 'processing' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(item, 'processing')}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-50 disabled:pointer-events-none disabled:opacity-50 dark:border-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/10"
                    >
                      <CircleDashed className="h-3.5 w-3.5" /> Tandai Diproses
                    </button>
                  )}
                  {item.status !== 'done' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(item, 'done')}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selesai Dibahas
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(item)}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Hapus
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SecurityPanel() {
  const token = getAdminSessionToken();
  const clientId = getClientId();

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const [devices, setDevices] = useState([]);
  const [trusted, setTrusted] = useState(false);
  const [trustBusy, setTrustBusy] = useState(false);

  useEffect(() => {
    setTrusted(Boolean(safeGet(TRUSTED_KEY)));
    trustedDeviceList(token).then((result) => setDevices(Array.isArray(result?.data) ? result.data : [])).catch(() => {});
  }, [token]);

  const submitPassword = async (event) => {
    event.preventDefault();
    setPwMsg('');
    if (!pw.current.trim()) return setPwMsg('Password saat ini wajib diisi.', 'error');
    if (pw.next.length < 12) return setPwMsg('Password baru minimal 12 karakter.', 'error');
    if (pw.next !== pw.confirm) return setPwMsg('Konfirmasi password baru tidak sama.', 'error');
    setPwBusy(true);
    try {
      const reauth = await login(pw.current, { clientId });
      if (!reauth?.success || !reauth?.token) {
        setPwMsg(reauth?.message || 'Password saat ini salah.');
        return;
      }
      const result = await changePassword(reauth.token, pw.next);
      if (result?.success) {
        setPwMsg('Password berhasil diganti. Silakan login ulang.');
        setPw({ current: '', next: '', confirm: '' });
        setTimeout(() => window.dispatchEvent(new CustomEvent('osis:workspace-logout')), 1200);
      } else {
        setPwMsg(result?.message || 'Gagal mengganti password.');
      }
    } catch (err) {
      setPwMsg(err?.message || 'Gagal mengganti password.');
    } finally {
      setPwBusy(false);
    }
  };

  const toggleTrust = async () => {
    if (trustBusy) return;
    setTrustBusy(true);
    try {
      if (trusted) {
        await trustedDeviceRevoke(token, clientId);
        safeRemove(TRUSTED_KEY);
        setTrusted(false);
        setDevices((list) => list.filter((item) => item.deviceId !== clientId));
      } else {
        const result = await trustedDeviceEnroll(token, clientId, navigator.userAgent || 'Browser OSIS');
        if (result?.trustedToken && result?.trustedDeviceId) {
          safeSet(TRUSTED_KEY, JSON.stringify({ token: result.trustedToken, deviceId: result.trustedDeviceId, expiresAt: result.trustedExpiresAt || '' }));
          setTrusted(true);
          const list = await trustedDeviceList(token);
          setDevices(Array.isArray(list?.data) ? list.data : []);
        }
      }
    } catch (err) {
      setPwMsg(err?.message || 'Gagal memperbarui perangkat.');
    } finally {
      setTrustBusy(false);
    }
  };

  const revokeDevice = async (deviceId) => {
    if (!window.confirm('Cabut akses otomatis perangkat ini?')) return;
    try {
      await trustedDeviceRevoke(token, deviceId);
      setDevices((list) => list.filter((item) => item.deviceId !== deviceId));
      if (deviceId === clientId) { safeRemove(TRUSTED_KEY); setTrusted(false); }
    } catch (err) {
      setPwMsg(err?.message || 'Gagal mencabut perangkat.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <h3 className="font-black text-slate-950 dark:text-white">Ganti Password</h3>
          </div>
          <form onSubmit={submitPassword} className="space-y-4">
            <label className={label}>Password Saat Ini<input className={field} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} type="password" value={pw.current} required /></label>
            <label className={label}>Password Baru<input className={field} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} type="password" value={pw.next} required /></label>
            <label className={label}>Konfirmasi Password Baru<input className={field} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} type="password" value={pw.confirm} required /></label>
            <button type="submit" disabled={pwBusy} className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50">
              <ShieldCheck className="h-4 w-4" /> {pwBusy ? 'Mengganti...' : 'Ganti Password'}
            </button>
          </form>
          {pwMsg && <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" role="status">{pwMsg}</p>}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35">
        <div className="mb-4 flex items-center gap-2">
          <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h3 className="font-black text-slate-950 dark:text-white">Perangkat Terpercaya</h3>
        </div>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Ingat perangkat ini agar tidak perlu memasukkan password berulang kali selama 30 hari.</p>

        <button type="button" onClick={toggleTrust} disabled={trustBusy} className={`mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition disabled:pointer-events-none disabled:opacity-50 ${trusted ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
          {trustBusy ? 'Memproses...' : trusted ? 'Lupakan Perangkat Ini' : 'Ingat Perangkat Ini'}
        </button>

        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Daftar Perangkat</h4>
          {devices.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada perangkat tersimpan.</p>
          ) : (
            devices.map((item) => (
              <div key={item.deviceId} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/45">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300"><Laptop className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name || 'Perangkat OSIS'}{item.deviceId === clientId ? ' · Perangkat ini' : ''}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Sampai {formatDate(item.expiresAt)}</p>
                </div>
                <button type="button" onClick={() => revokeDevice(item.deviceId)} className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" /> Cabut</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadershipWorkspace() {
  const [tab, setTab] = useState('aspirations');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800">
        <button type="button" onClick={() => setTab('aspirations')} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === 'aspirations' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
          <MessageSquareText className="h-4 w-4" /> Aspirasi
        </button>
        <button type="button" onClick={() => setTab('security')} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${tab === 'security' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
          <ShieldCheck className="h-4 w-4" /> Keamanan
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'aspirations' ? <AspirationList /> : <SecurityPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
