import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Banknote, Plus, Trash2, Wallet } from 'lucide-react';

const STORAGE_KEY = 'osis_treasury_ledger_v1';
const field = 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white';
const label = 'text-sm font-bold text-slate-800 dark:text-slate-200';

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch {}
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function TreasuryWorkspace() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ type: 'in', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    try {
      const saved = JSON.parse(safeGet(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setEntries(saved);
    } catch {}
  }, []);

  useEffect(() => {
    safeSet(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const totals = useMemo(() => {
    const income = entries.filter((e) => e.type === 'in').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expense = entries.filter((e) => e.type === 'out').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !amount || amount <= 0 || !form.date) return;
    setEntries((current) => [
      {
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        type: form.type,
        description: form.description.trim(),
        amount,
        date: form.date,
      },
      ...current,
    ]);
    setForm((f) => ({ ...f, description: '', amount: '' }));
  };

  const remove = (id) => {
    if (!window.confirm('Hapus catatan ini?')) return;
    setEntries((current) => current.filter((e) => e.id !== id));
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><ArrowDownCircle className="h-4 w-4" /> Pemasukan</span>
          <p className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-300">{formatRupiah(totals.income)}</p>
        </div>
        <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300"><ArrowUpCircle className="h-4 w-4" /> Pengeluaran</span>
          <p className="mt-2 text-xl font-black text-red-700 dark:text-red-300">{formatRupiah(totals.expense)}</p>
        </div>
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300"><Wallet className="h-4 w-4" /> Saldo</span>
          <p className="mt-2 text-xl font-black text-blue-700 dark:text-blue-300">{formatRupiah(totals.balance)}</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/35">
        <div className="mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h3 className="font-black text-slate-950 dark:text-white">Catat Transaksi</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-[140px_1fr_160px_160px]">
          <label className={label}>Jenis
            <select className={field} value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option value="in">Pemasukan</option>
              <option value="out">Pengeluaran</option>
            </select>
          </label>
          <label className={label}>Keterangan
            <input className={field} maxLength={120} placeholder="Contoh: Dana kegiatan class meeting" value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </label>
          <label className={label}>Jumlah (Rp)
            <input className={field} type="number" min="1" step="1000" placeholder="50000" value={form.amount} onChange={(e) => update('amount', e.target.value)} required />
          </label>
          <label className={label}>Tanggal
            <input className={field} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
          </label>
        </div>
        <button type="submit" className="mt-4 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500">
          <Plus className="h-4 w-4" /> Tambah Catatan
        </button>
      </form>

      <div>
        <h3 className="font-black text-slate-950 dark:text-white">Riwayat Transaksi</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Catatan tersimpan di perangkat ini (belum disinkronkan ke server).</p>
        {entries.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-400">Belum ada transaksi.</p>
        ) : (
          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/45"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.type === 'in' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-600 dark:text-red-300'}`}>
                    {entry.type === 'in' ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{entry.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(entry.date)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-black ${entry.type === 'in' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                    {entry.type === 'in' ? '+' : '−'}{formatRupiah(entry.amount)}
                  </p>
                  <button type="button" onClick={() => remove(entry.id)} className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10" aria-label="Hapus transaksi">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
