import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './data/store';
import { ToastProvider } from './components/Toast';

const Landing = lazy(() => import('./pages/landing/Landing'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const LogIn = lazy(() => import('./pages/auth/LogIn'));
const AppShell = lazy(() => import('./pages/app/AppShell'));

export default function App() {
  return (
    <StoreProvider>
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
  );
}
