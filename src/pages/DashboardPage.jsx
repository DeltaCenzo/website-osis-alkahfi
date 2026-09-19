import RoleWorkspaceDashboard from './RoleWorkspaceDashboard.jsx';

function AuthGate({ status, message, onRetry, onLogin }) {
  if (status === 'checking') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-center shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true" />
          <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">{message || 'Memverifikasi sesi pengurus...'}</p>
        </div>
      </main>
    );
  }

  if (status === 'unavailable') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center shadow-xl dark:border-amber-500/20 dark:bg-amber-500/10">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Tidak dapat menghubungi server OSIS</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message || 'Periksa koneksi internet lalu coba lagi.'}</p>
          <button className="mt-5 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500" onClick={onRetry} type="button">Coba Lagi</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/75">
        <h2 className="text-xl font-black text-slate-950 dark:text-white">Sesi pengurus tidak valid</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message || 'Silakan masuk untuk membuka ruang kerja pengurus.'}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500" onClick={onLogin} type="button">Masuk Area OSIS</button>
          <button className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300" onClick={() => { window.history.pushState(null, '', window.location.pathname); window.dispatchEvent(new PopStateEvent('popstate')); }} type="button">Kembali ke Beranda</button>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage({ active = false, authStatus = 'idle', authMessage = '', onRetryAuth, onOpenLogin, role = null }) {
  if (!active) return null;

  if (authStatus === 'authenticated') {
    return (
      <main className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950">
        <RoleWorkspaceDashboard activeRole={role} />
      </main>
    );
  }

  return <AuthGate status={authStatus} message={authMessage} onRetry={onRetryAuth} onLogin={onOpenLogin} />;
}
