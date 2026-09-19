import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[OSIS React] Render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white" role="alert">
        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
          <img className="mx-auto h-20 w-20 object-contain" src="/images/logo-osis-v36.png" alt="Logo OSIS" width="80" height="80" />
          <h1 className="mt-5 text-2xl font-black">Website gagal dimuat sempurna</h1>
          <p className="mt-3 leading-7 text-slate-300">Silakan muat ulang halaman. Jika masalah tetap muncul, lihat Console browser untuk detail error.</p>
          {this.state.error?.message && <code className="mt-4 block rounded-xl bg-black/30 p-3 text-left text-xs text-rose-200">{this.state.error.message}</code>}
          <button className="mt-6 min-h-12 rounded-xl bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-500" type="button" onClick={() => window.location.reload()}>Muat ulang</button>
        </section>
      </main>
    );
  }
}
