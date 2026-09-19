import { useCallback, useEffect, useState } from 'react';
import Hero from './components/home/Hero.tsx';
import Navbar from './components/layout/Navbar.tsx';
import PublicSections from './pages/PublicSections.jsx';
import EventPage from './pages/EventPage.jsx';
import AISFairDetail from './pages/AISFairDetail.jsx';
import AISFairRegister from './pages/AISFairRegister.jsx';
import AISFairCompetitionDetail from './pages/AISFairCompetitionDetail.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UpdateBanner from './components/common/UpdateBanner.jsx';
import Footer from './components/layout/Footer.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import LoginModal from './components/auth/LoginModal.jsx';
import WorkspaceChooser from './components/auth/WorkspaceChooser.jsx';
import InstallGuide from './components/common/InstallGuide.jsx';
import ThemeToggle from './components/common/ThemeToggle.jsx';
import { usePwaInstall } from './hooks/usePwaInstall.js';
import { useTheme } from './hooks/useTheme.js';
import { ADMIN_WORKSPACE_KEY, clearAdminSessionCache, storeAdminSession, storeAdminWorkspace, validateAdminSession } from './lib/adminSession.js';

const VALID_ROLES = new Set(['leadership', 'secretariat', 'treasury', 'humas', 'ibadah', 'bahasa']);

function readWorkspace(){
  try {
    const value = window.sessionStorage.getItem(ADMIN_WORKSPACE_KEY) || '';
    return VALID_ROLES.has(value) ? value : '';
  } catch {
    return '';
  }
}

function readRoute(){
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

  let page = 'home';
  let competitionSlug = '';

    if (pathname === '/ais-fair-2026') page = 'aisfair';
  else if (pathname === '/ais-fair-2026/register') page = 'register';
  else if (pathname.startsWith('/ais-fair-2026/')) {
    const rest = pathname.replace('/ais-fair-2026/', '');
    if (rest.endsWith('/register')) {
      page = 'competition-register';
      competitionSlug = rest.replace('/register','');
    } else {
      page = 'competition';
      competitionSlug = rest;
    }
  }

  const dashboard = params.get('view') === 'dashboard';
  const requestedRole = params.get('role') || '';
  const storedRole = readWorkspace();
  return {
    view: dashboard ? 'dashboard' : 'public',
    page,
    competitionSlug,
    role: VALID_ROLES.has(requestedRole) ? requestedRole : storedRole,
  };
}

function Website(){

  const [route, setRoute] = useState(() => readRoute());
  const [auth, setAuth] = useState({ status: 'idle', message: '' });
  const [authAttempt, setAuthAttempt] = useState(0);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const { canInstall, promptInstall } = usePwaInstall();
  const { theme, toggle: toggleTheme } = useTheme();

  const syncRoute = useCallback(() => {
    setRoute(readRoute());
  }, []);

  const retryAuthentication = useCallback(() => {
    setAuthAttempt((value) => value + 1);
  }, []);

  const goDashboard = useCallback((role) => {
    storeAdminWorkspace(role);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'dashboard');
    url.searchParams.set('role', role);
    window.history.pushState(null, '', url);
    syncRoute();
  }, [syncRoute]);

  useEffect(() => {
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('osis:route-change', syncRoute);
    window.addEventListener('osis:workspace-change', syncRoute);

    const onLogout = () => {
      clearAdminSessionCache();
      setAuth({ status: 'guest', message: '' });
      setChooserOpen(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('role');
      window.history.replaceState(null, '', url);
      syncRoute();
    };
    const onLoginOpen = () => setChooserOpen(false);
    const onLoginSuccess = (event) => {
      const detail = event.detail || {};
      if (detail.token) storeAdminSession(detail.token);
      setChooserOpen(true);
    };
    const onWorkspaceSelected = (event) => {
      setChooserOpen(false);
      if (event.detail?.key) goDashboard(event.detail.key);
    };
    const onWorkspaceChooserOpen = () => setChooserOpen(true);

    window.addEventListener('osis:workspace-logout', onLogout);
    window.addEventListener('osis:login-open', onLoginOpen);
    window.addEventListener('osis:login-success', onLoginSuccess);
    window.addEventListener('osis:workspace-select', onWorkspaceSelected);
    window.addEventListener('osis:workspace-select-open', onWorkspaceChooserOpen);

    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('osis:route-change', syncRoute);
      window.removeEventListener('osis:workspace-change', syncRoute);
      window.removeEventListener('osis:workspace-logout', onLogout);
      window.removeEventListener('osis:login-open', onLoginOpen);
      window.removeEventListener('osis:login-success', onLoginSuccess);
      window.removeEventListener('osis:workspace-select', onWorkspaceSelected);
      window.removeEventListener('osis:workspace-select-open', onWorkspaceChooserOpen);
    };
  }, [syncRoute, goDashboard]);

  useEffect(() => {
    if (route.view !== 'dashboard') {
      setAuth({ status: 'idle', message: '' });
      return undefined;
    }

    const controller = new AbortController();
    let mounted = true;
    setAuth({ status: 'checking', message: 'Memverifikasi sesi pengurus ke server OSIS...' });

    validateAdminSession({ signal: controller.signal }).then((result) => {
      if (!mounted) return;
      setAuth({
        status: result.valid ? 'authenticated' : result.reason === 'network' ? 'unavailable' : 'guest',
        message: result.message || '',
      });
    }).catch((error) => {
      if (!mounted || error?.name === 'AbortError') return;
      setAuth({ status: 'unavailable', message: error?.message || 'Verifikasi sesi gagal.' });
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [route.view, route.role, authAttempt]);

  const dashboardActive = route.view === 'dashboard';
  const publicPage = route.page || 'home';
  const isAISMicrosite = ['aisfair','register','competition','competition-register'].includes(publicPage);

  const openLogin = useCallback(() => {
    window.dispatchEvent(new CustomEvent('osis:login-open'));
  }, []);

  const openInstall = useCallback(() => setInstallOpen(true), []);

  const handleInstall = useCallback(async () => {
    const ok = await promptInstall();
    if (ok) setInstallOpen(false);
  }, [promptInstall]);

  const selectWorkspace = useCallback((key) => {
    window.dispatchEvent(new CustomEvent('osis:workspace-select', { detail: { key } }));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 selection:bg-blue-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      
      <noscript>
        <div className="fixed inset-x-4 top-4 z-[90000] rounded-2xl bg-red-600 p-4 text-center text-sm font-bold text-white shadow-2xl">
          Website ini memerlukan JavaScript untuk fitur interaktif seperti aspirasi, pengumuman, galeri, dan Area OSIS.
        </div>
      </noscript>

      <div className={dashboardActive ? 'hidden' : 'block'} data-public-page="true">
        <a href="#konten-utama" className="fixed left-4 top-4 z-[90001] -translate-y-24 bg-[#20255c] px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0">Langsung ke konten utama</a>

        {isAISMicrosite ? (
          <main id="konten-utama" tabIndex="-1" className="min-h-screen bg-[#f4f3ec]">
            <nav className="sticky top-0 z-50 border-b border-[#d6d7da] bg-[#f4f3ec]/95 backdrop-blur-sm" aria-label="Navigasi AIS FAIR">
              <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-7 lg:px-10">
                <a href="/" className="text-sm font-semibold text-[#565966] underline decoration-[#b9bbc3] underline-offset-4 transition hover:text-[#20255c]">← Event OSIS</a>
                <a href="/ais-fair-2026" className="text-sm font-extrabold tracking-[-0.02em] text-[#20255c]">AIS FAIR <span className="text-[#5eaa68]">2026</span></a>
              </div>
            </nav>
            {publicPage === 'aisfair' && <AISFairDetail />}
            {publicPage === 'register' && <AISFairRegister />}
            {publicPage === 'competition' && <AISFairCompetitionDetail competitionSlug={route.competitionSlug} />}
            {publicPage === 'competition-register' && <AISFairRegister competitionSlug={route.competitionSlug} />}
          </main>
        ) : (
          <>
            <Hero />
            <Navbar onOpenLogin={openLogin} onOpenInstall={openInstall} />
            <main className="relative z-10 overflow-x-hidden bg-slate-50 shadow-xl" id="konten-utama" tabIndex="-1">
              {publicPage === 'events' ? <EventPage /> : <PublicSections />}
            </main>
            <Footer />
          </>
        )}
      </div>

      <DashboardPage
        active={dashboardActive}
        authStatus={auth.status}
        authMessage={auth.message}
        onRetryAuth={retryAuthentication}
        onOpenLogin={openLogin}
        role={route.role}
      />
      <LoginModal />
      <WorkspaceChooser open={chooserOpen} onSelect={selectWorkspace} onClose={() => setChooserOpen(false)} />
      <InstallGuide open={installOpen} onClose={() => setInstallOpen(false)} onInstall={handleInstall} canInstall={canInstall} />
      <UpdateBanner />
      {!isAISMicrosite ? (
        <div className="fixed bottom-6 right-6 z-[60000]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      ) : null}
    </div>
  );
}

export default function App(){
  return <ErrorBoundary><Website /></ErrorBoundary>;
}
