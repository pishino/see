import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsProvider, useSettings } from '@see/core/react';
import { StoreProvider, webStorage } from './data/store';
import { applyToDocument, webSettingsStorage } from './data/settings';
import { ToastProvider } from './components/Toast';

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

export default function App() {
  return (
    <SettingsProvider storage={webSettingsStorage}>
      <SettingsEffects />
      <StoreProvider storage={webStorage}>
        <ToastProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/app/*" element={<AppShell />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </StoreProvider>
    </SettingsProvider>
  );
}
