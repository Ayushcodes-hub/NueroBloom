import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ChildProfile } from '../../shared/types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<{
    users: Array<{ id: string; name: string; email: string; role: string; created_at: string }>;
    children: ChildProfile[];
    counts: { userCount: number; childCount: number; sessionCount: number; noteCount: number };
  } | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.getAdminOverview().then(setOverview).catch(() => {});
    }
  }, [user?.role]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Administrator Access Required</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-[var(--nb-border)] pb-6">
        <p className="text-xs font-semibold text-[var(--nb-primary)]">Platform Administration</p>
        <h1 className="mt-1 font-display text-3xl font-bold">NeuroBloom Program Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Registered Users', val: overview?.counts.userCount ?? 0 },
          { label: 'Child Profiles', val: overview?.counts.childCount ?? 0 },
          { label: 'Saved Game Sessions', val: overview?.counts.sessionCount ?? 0 },
          { label: 'Caregiver & Educator Notes', val: overview?.counts.noteCount ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5">
            <p className="text-xs text-[var(--nb-text-muted)]">{item.label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{item.val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 overflow-x-auto">
        <h2 className="font-display text-lg font-bold">Accounts & Roles</h2>
        <table className="mt-4 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--nb-border)] text-[var(--nb-text-muted)]">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--nb-border)]">
            {(overview?.users || []).map((u) => (
              <tr key={u.id}>
                <td className="py-2.5 pr-4 font-semibold">{u.name}</td>
                <td className="py-2.5 pr-4 font-mono-tabular">{u.email}</td>
                <td className="py-2.5 pr-4 capitalize">{u.role}</td>
                <td className="py-2.5 font-mono-tabular text-[var(--nb-text-muted)]">{u.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
