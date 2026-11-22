import React, { useState } from 'react';
import { ArrowRight, Lock, UserCheck } from 'lucide-react';
import type { UserRole } from '../../shared/types';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  navigate: (to: string) => void;
}

const DEMO_ACCOUNTS: Array<{
  role: UserRole;
  label: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  summary: string;
}> = [
  {
    role: 'child',
    label: 'Child Explorer',
    name: 'Aarav Sharma',
    email: 'aarav@neurobloom.demo',
    password: 'BloomChild123!',
    avatar: '/src/assets/images/avatar_child_aarav_1795193965975.jpg',
    summary: 'Play 11 cognitive games, earn coins, unlock badges, and visit the Calm Corner.',
  },
  {
    role: 'parent',
    label: 'Parent / Guardian',
    name: 'Meera Sharma',
    email: 'meera@neurobloom.demo',
    password: 'BloomParent123!',
    avatar: '/src/assets/images/avatar_parent_meera_1795193964870.jpg',
    summary: 'Track daily practice time, accuracy trends, reminders, and supportive notes.',
  },
  {
    role: 'doctor',
    label: 'Doctor / Special Educator',
    name: 'Dr. Ananya Rao',
    email: 'doctor@neurobloom.demo',
    password: 'BloomDoctor123!',
    avatar: '/src/assets/images/avatar_doctor_karthik_1795193966468.jpg',
    summary: 'Review assigned learners, recommend games/difficulty, and export weekly reports.',
  },
  {
    role: 'admin',
    label: 'Administrator',
    name: 'RNSIT Program Admin',
    email: 'admin@neurobloom.demo',
    password: 'BloomAdmin123!',
    avatar: '',
    summary: 'Inspect platform users, assigned profiles, and database session overview.',
  },
];

function routeForRole(role: UserRole): string {
  if (role === 'child') return '/child';
  if (role === 'parent') return '/parent';
  if (role === 'doctor') return '/doctor';
  return '/admin';
}

export const AuthPage: React.FC<AuthPageProps> = ({ navigate }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('child');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('aarav@neurobloom.demo');
  const [password, setPassword] = useState('BloomChild123!');
  const [ageGroup, setAgeGroup] = useState('7-9 years');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDemoQuickLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setError(null);
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setSubmitting(true);
    try {
      const user = await login(account.email, account.password);
      navigate(routeForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(routeForRole(user.role));
      } else {
        const user = await register({
          name,
          email,
          password,
          role: selectedRole === 'admin' ? 'parent' : selectedRole,
          ageGroup,
        });
        navigate(routeForRole(user.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left: Role Selector & Demo Accounts */}
        <div className="lg:col-span-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--nb-text)]">
            Choose Your Role to Enter NeuroBloom
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
            Select any stakeholder demo account below for instant sign-in, or sign in with your own credentials on the right.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedRole === acc.role;
              return (
                <div
                  key={acc.role}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                    isSelected
                      ? 'border-[var(--nb-primary)] bg-[var(--nb-surface)] shadow-sm'
                      : 'border-[var(--nb-border)] bg-[var(--nb-surface)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 rounded-full object-cover border border-[var(--nb-border)]"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE9FE] font-display text-sm font-bold text-[#6D4AFF]">
                          AD
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-[var(--nb-primary)]">{acc.label}</p>
                        <p className="font-display text-base font-bold text-[var(--nb-text)]">{acc.name}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[var(--nb-text-muted)]">{acc.summary}</p>
                    <p className="mt-2 font-mono-tabular text-[11px] text-[var(--nb-text-muted)]">
                      {acc.email} · {acc.password}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDemoQuickLogin(acc)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nb-primary-soft)] px-4 py-2.5 text-xs font-bold text-[#3719CA] hover:bg-[#DDD6FE] transition-colors min-h-[40px]"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Enter as {acc.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Login / Register Form */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-1 rounded-xl bg-[var(--nb-surface-subtle)] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors min-h-[40px] ${
                  mode === 'login' ? 'bg-[var(--nb-surface)] text-[var(--nb-text)] shadow-xs' : 'text-[var(--nb-text-muted)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setEmail('');
                  setPassword('');
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors min-h-[40px] ${
                  mode === 'register' ? 'bg-[var(--nb-surface)] text-[var(--nb-text)] shadow-xs' : 'text-[var(--nb-text-muted)]'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label htmlFor="auth-role" className="block text-xs font-semibold text-[var(--nb-text)]">
                      Account Role
                    </label>
                    <select
                      id="auth-role"
                      value={selectedRole === 'admin' ? 'parent' : selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="mt-1.5 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2.5 text-sm text-[var(--nb-text)] min-h-[42px]"
                    >
                      <option value="child">Child Explorer</option>
                      <option value="parent">Parent / Guardian</option>
                      <option value="doctor">Doctor / Special Educator</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-[var(--nb-text)]">
                      Full Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Kavya Nair"
                      className="mt-1.5 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2.5 text-sm text-[var(--nb-text)] min-h-[42px]"
                    />
                  </div>

                  {selectedRole === 'child' && (
                    <div>
                      <label htmlFor="auth-age" className="block text-xs font-semibold text-[var(--nb-text)]">
                        Age Group
                      </label>
                      <select
                        id="auth-age"
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2.5 text-sm text-[var(--nb-text)] min-h-[42px]"
                      >
                        <option value="5-6 years">5-6 years</option>
                        <option value="7-9 years">7-9 years</option>
                        <option value="10-12 years">10-12 years</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-[var(--nb-text)]">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2.5 text-sm text-[var(--nb-text)] min-h-[42px]"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-[var(--nb-text)]">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-1.5 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2.5 text-sm text-[var(--nb-text)] min-h-[42px]"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nb-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 min-h-[44px]"
              >
                <Lock className="h-4 w-4" />
                <span>{submitting ? 'Signing in...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-5 text-xs leading-relaxed text-[var(--nb-text-muted)]">
              Protected by JWT sessions and role-based route authorization. NeuroBloom is an educational practice tool, not a medical service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
