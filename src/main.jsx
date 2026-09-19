import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const rootNode = document.getElementById('root');

function BootFailure({ error }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-slate-100" role="alert">
      <section className="w-full max-w-2xl rounded-3xl border border-rose-400/25 bg-rose-950/30 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">React startup error</span>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">Website belum berhasil dimuat</h1>
        <p className="mt-3 leading-7 text-slate-300">Terjadi kesalahan sebelum aplikasi utama selesai dipasang. Buka Console VS Code/browser untuk detail teknis.</p>
        <pre className="mt-5 max-h-52 overflow-auto rounded-2xl bg-slate-950/70 p-4 text-xs leading-6 text-rose-200">{String(error?.message || error || 'Unknown startup error')}</pre>
        <button className="mt-5 min-h-12 rounded-xl bg-white px-5 font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20" onClick={() => window.location.reload()} type="button">Muat ulang</button>
      </section>
    </main>
  );
}

try {
  createRoot(rootNode).render(
    <App />,
  );
} catch (error) {
  console.error('[OSIS React] Startup failed:', error);
  if (rootNode) createRoot(rootNode).render(<BootFailure error={error} />);
}
