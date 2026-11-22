import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { useNavigation } from './hooks/useNavigation';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ChildDashboard } from './pages/ChildDashboard';
import { GameStudioPage } from './pages/GameStudioPage';
import { ParentDashboard } from './pages/ParentDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SafetyPage } from './pages/SafetyPage';

const AppContent: React.FC = () => {
  const { pathname, navigate } = useNavigation();
  const { user, loading } = useAuth();

  const renderRoute = () => {
    if (pathname === '/' || pathname === '') {
      return <LandingPage navigate={navigate} />;
    }
    if (pathname === '/auth') {
      return <AuthPage navigate={navigate} />;
    }
    if (pathname === '/accessibility') {
      return <AccessibilityPage />;
    }
    if (pathname === '/resources') {
      return <ResourcesPage />;
    }
    if (pathname === '/safety') {
      return <SafetyPage />;
    }

    if (loading) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-[var(--nb-text-muted)]">
          Loading your NeuroBloom workspace...
        </div>
      );
    }

    if (!user) {
      return <AuthPage navigate={navigate} />;
    }

    if (pathname.startsWith('/play/')) {
      const gameId = pathname.replace('/play/', '').split('/')[0];
      return <GameStudioPage gameId={gameId} navigate={navigate} />;
    }

    if (pathname === '/child') {
      return <ChildDashboard navigate={navigate} />;
    }

    if (pathname === '/parent') {
      if (user.role !== 'parent' && user.role !== 'admin') {
        return (
          <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <h1 className="font-display text-2xl font-bold">Parent Dashboard Restricted</h1>
            <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
              Please sign in with a Parent / Guardian account to access caregiver analytics.
            </p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="mt-5 rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Switch Account
            </button>
          </div>
        );
      }
      return <ParentDashboard navigate={navigate} />;
    }

    if (pathname === '/doctor') {
      return <DoctorDashboard />;
    }

    if (pathname === '/admin') {
      return <AdminDashboard />;
    }

    return <LandingPage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[var(--nb-bg)] text-[var(--nb-text)]">
      <Navbar pathname={pathname} navigate={navigate} />
      <main id="main-content">{renderRoute()}</main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
