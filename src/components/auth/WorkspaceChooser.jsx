import { useRef } from 'react';
import { Bell, BellOff, Crown, FileText, WalletCards, Megaphone, Landmark, Languages, X } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

export const WORKSPACE_ROLES = [
  { key: 'leadership', label: 'Ketua & Wakil', Icon: Crown, desc: 'Pantau aspirasi dan koordinasi seluruh program.' },
  { key: 'secretariat', label: 'Sekretaris', Icon: FileText, desc: 'Kelola pengumuman, agenda, dan informasi resmi.' },
  { key: 'treasury', label: 'Bendahara', Icon: WalletCards, desc: 'Pantau agenda dan kebutuhan administrasi.' },
  { key: 'humas', label: 'Divisi Humas', Icon: Megaphone, desc: 'Kelola galeri, publikasi, dan dokumentasi.' },
  { key: 'ibadah', label: 'Divisi Ibadah', Icon: Landmark, desc: 'Agenda dan program keagamaan.' },
  { key: 'bahasa', label: 'Divisi Bahasa', Icon: Languages, desc: 'Informasi dan program kebahasaan.' },
];

export default function WorkspaceChooser({ open, onSelect, onClose }) {
  const { enabled: notif, busy: notifBusy, message: notifMsg, toggle: toggleNotif } = useNotifications();
  const dialogRef = useRef(null);

  useFocusTrap(open, dialogRef);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[73000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspaceChooserTitle"
      onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <div ref={dialogRef} className="relative my-auto w-full max-w-2xl rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 p-6 dark:border-white/10 sm:p-8 sm:pb-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white" id="workspaceChooserTitle">Pilih Divisi</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Pilih ruang kerja sesuai divisi kepengurusan kamu.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={toggleNotif}
              disabled={notifBusy}
              aria-pressed={notif}
              aria-label={notif ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi'}
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition disabled:opacity-60 ${notif ? 'border-blue-400/40 bg-blue-500/20 text-blue-200' : 'border-slate-200 bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 dark:border-white/15 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'}`}
            >
              {notif ? <Bell className="h-4 w-4 shrink-0" /> : <BellOff className="h-4 w-4 shrink-0" />}
              <span className="hidden whitespace-nowrap text-xs font-bold sm:inline sm:text-sm">{notifBusy ? 'Memproses...' : notif ? 'Notifikasi Aktif' : 'Notifikasi'}</span>
            </button>
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[.97] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {notifMsg && <p className="px-6 text-xs font-semibold text-amber-600 dark:text-amber-300 sm:px-8" role="status">{notifMsg}</p>}

        <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8 sm:pt-6">
          {WORKSPACE_ROLES.map(({ key, label, Icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 active:scale-[.99] dark:border-slate-700 dark:hover:bg-blue-500/10"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block font-black text-slate-900 dark:text-white">{label}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
