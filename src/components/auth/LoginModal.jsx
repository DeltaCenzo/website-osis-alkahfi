import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, UserRoundCog, X } from 'lucide-react';
import { login } from '../../services/api.js';
import { getClientId } from '../../lib/adminSession.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

export default function LoginModal(){
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusTrap(visible, dialogRef);

  useEffect(() => {
    const onOpen = () => {
      setError('');
      setPassword('');
      setBusy(false);
      setVisible(true);
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    };
    const onClose = () => {
      setVisible(false);
      setPassword('');
      setError('');
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setVisible(false);
    };
    window.addEventListener('osis:login-open', onOpen);
    window.addEventListener('osis:login-close', onClose);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('osis:login-open', onOpen);
      window.removeEventListener('osis:login-close', onClose);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setError('');
    setPassword('');
  }, []);

  const submit = useCallback(async () => {
    if (busy) return;
    if (!password.trim()) {
      setError('Password wajib diisi.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await login(password, { clientId: getClientId() });
      if (result && result.success) {
        setBusy(false);
        window.dispatchEvent(new CustomEvent('osis:login-success', {
          detail: {
            token: result.token,
            expiresInHours: result.expiresInHours,
            trustedToken: result.trustedToken,
            trustedDeviceId: result.trustedDeviceId,
          },
        }));
        close();
        return;
      }
      setBusy(false);
      setError(result?.message || 'Password salah.');
    } catch (err) {
      setBusy(false);
      setError(err?.message || 'Tidak dapat menghubungi server OSIS.');
    }
  }, [password, busy, close]);

  const handleKeyUp = (event) => {
    if (event.key === 'Enter') submit();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[72000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loginModalTitle"
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div ref={dialogRef} className="relative my-auto w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:p-8">
        <button
          aria-label="Tutup jendela login"
          className="absolute right-4 top-4 z-20 grid h-12 w-12 cursor-pointer place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[.97] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          onClick={close}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
          <UserRoundCog className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="pr-14 sm:pr-0">
          <h3 className="text-xl font-black tracking-tight" id="loginModalTitle">Akses Khusus OSIS</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Masukkan password untuk membuka ruang kerja pengurus.</p>
        </div>

        <label className="sr-only" htmlFor="passwordInput">Password Area OSIS</label>
        <div className="relative mt-5 w-full">
          <input
            ref={inputRef}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-3 pr-14 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            id="passwordInput"
            onChange={(event) => setPassword(event.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            aria-pressed={showPassword}
            className="pointer-events-auto absolute right-2 top-1/2 z-[100] grid h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {error && <p aria-live="assertive" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}

        <div className="mt-6">
          <button
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-500 active:scale-[.99] disabled:pointer-events-none disabled:opacity-50"
            disabled={busy}
            onClick={submit}
            type="button"
          >
            {busy ? 'Memverifikasi...' : 'Masuk Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
