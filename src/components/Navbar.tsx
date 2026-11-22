import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  pathname: string;
  navigate: (to: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ pathname, navigate }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardRoute =
    user?.role === 'child'
      ? '/child'
      : user?.role === 'parent'
      ? '/parent'
      : user?.role === 'doctor'
      ? '/doctor'
      : user?.role === 'admin'
      ? '/admin'
      : '/auth';

  const navItems = user
    ? [
        { label: 'Dashboard', to: dashboardRoute },
        { label: 'Play Studio', to: '/child' },
        { label: 'Accessibility', to: '/accessibility' },
        { label: 'Resources', to: '/resources' },
        { label: 'Safety', to: '/safety' },
      ]
    : [
        { label: 'How It Works', to: pathname === '/' ? '#how-it-works' : '/' },
        { label: 'Games', to: pathname === '/' ? '#games-preview' : '/' },
        { label: 'Accessibility', to: '/accessibility' },
        { label: 'Resources', to: '/resources' },
        { label: 'Safety', to: '/safety' },
      ];

  const handleLinkClick = (to: string) => {
    setMobileOpen(false);
    if (to.startsWith('#') && pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      return;
    }
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--nb-border)] bg-[var(--nb-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2"
          aria-label="NeuroBloom home"
        >
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="#6D4AFF" />
            <path
              d="M14 21C14 14.5 17.5 10.5 22 9.5C21.5 14.5 18.5 18.5 14 21Z"
              fill="#A7F3D0"
            />
            <path
              d="M14 21C14 14.5 10.5 10.5 6 9.5C6.5 14.5 9.5 18.5 14 21Z"
              fill="#FDE68A"
            />
            <circle cx="14" cy="8.5" r="2.2" fill="#FFFFFF" />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--nb-text)]">
            NeuroBloom
          </span>
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--nb-text-muted)]" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLinkClick(item.to)}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  active
                    ? 'text-[var(--nb-primary)] border-b-2 border-[var(--nb-primary)] font-semibold'
                    : 'hover:text-[var(--nb-text)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--nb-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
            >
              Start Exploring
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[44px] min-w-[44px]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleLinkClick(item.to)}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)]"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                logout();
                navigate('/');
              }}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
};
