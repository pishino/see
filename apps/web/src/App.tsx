import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { routeOf } from '@see/core';
import { SettingsProvider, useSettings } from '@see/core/react';
import { StoreProvider, webStorage } from './data/store';
import { applyToDocument, webSettingsStorage } from './data/settings';
import { ToastProvider } from './components/Toast';
import { isDesktopShell } from './lib/platform';
import { Legal } from './pages/legal/Legal';
import { EmbedPage, TemplatePage } from './pages/share/RankYours';

const Landing = lazy(() => import('./pages/landing/Landing'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const LogIn = lazy(() => import('./pages/auth/LogIn'));
const AppShell = lazy(() => import('./pages/app/AppShell'));

/** Keep the document in step with Settings as they change. */
function SettingsEffects() {
  const { settings } = useSettings();
  useEffect(() => applyToDocument(settings), [settings]);
  return null;
}

/** see:// links (from email, push, or the installed web app's web+see: handler) open the same screen everywhere. */
function OpenLink() {
  const [params] = useSearchParams();
  const link = (params.get('link') ?? '').replace(/^web\+see:(\/\/)?/, 'see://');
  return <Navigate to={link.startsWith('see://') ? routeOf(link) : '/app'} replace />;
}

export default function App() {
  return (
    <SettingsProvider storage={webSettingsStorage}>
      <SettingsEffects />
      <StoreProvider storage={webStorage}>
        <ToastProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={isDesktopShell() ? <Navigate to="/app" replace /> : <Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/app/*" element={<AppShell />} />
              <Route path="/open" element={<OpenLink />} />
              <Route path="/t/:code" element={<TemplatePage />} />
              <Route path="/embed/:code" element={<EmbedPage />} />
              <Route path="/terms" element={<Legal doc="terms" />} />
              <Route path="/privacy" element={<Legal doc="privacy" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </StoreProvider>
    </SettingsProvider>
  );
}
