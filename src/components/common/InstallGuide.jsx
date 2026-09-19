import { AnimatePresence, motion } from 'framer-motion';
import { Download, Smartphone, Share, X } from 'lucide-react';

const isAndroid = /android/i.test(navigator.userAgent);
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export default function InstallGuide({ open, onClose, onInstall, canInstall }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[76000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="installGuideTitle"
        >
          <motion.div
            className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:p-8"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <button
              aria-label="Tutup"
              className="absolute right-4 top-4 grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black tracking-tight" id="installGuideTitle">Pasang Aplikasi OSIS</h3>

            {isStandalone ? (
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Aplikasi sudah terpasang di perangkat kamu.</p>
            ) : canInstall ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Pasang website ini sebagai aplikasi untuk akses lebih cepat dan bisa dibuka dari layar utama.</p>
                <button
                  className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-500 active:scale-[.99]"
                  onClick={onInstall}
                  type="button"
                >
                  <Download className="h-4 w-4" /> Pasang Sekarang
                </button>
              </>
            ) : isIos ? (
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>Di iPhone/iPad, pasang lewat Safari:</p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300"><Share className="h-4 w-4" /></span>Ketuk tombol <strong>Bagikan</strong> di Safari.</li>
                  <li className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300"><Smartphone className="h-4 w-4" /></span>Pilih <strong>Tambahkan ke Layar Utama</strong>.</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>Di Android, pasang lewat menu browser:</p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300"><Smartphone className="h-4 w-4" /></span>Ketuk menu <strong>⋮</strong> di browser.</li>
                  <li className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300"><Download className="h-4 w-4" /></span>Pilih <strong>Tambahkan ke layar utama</strong> / <strong>Instal aplikasi</strong>.</li>
                </ol>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Gunakan browser Chrome/Edge untuk memasang aplikasi, atau buka lewat ponsel.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
