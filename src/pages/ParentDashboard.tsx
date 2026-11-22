import React, { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BellPlus, CheckCircle2, FileText, Plus, ShieldCheck } from 'lucide-react';
import type { CaregiverNote, GameRecommendation } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api, type AnalyticsResponse } from '../services/api';

interface ParentDashboardProps {
  navigate: (to: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ navigate }) => {
  const { user, childrenList, activeChild, selectChild, refreshAuth } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [weekly, setWeekly] = useState<Array<{ date: string; label: string; sessions: number; minutes: number; avgAccuracy: number }>>([]);
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
  const [notes, setNotes] = useState<CaregiverNote[]>([]);
  const [reminders, setReminders] = useState<Array<{ id: string; title: string; scheduled_time: string; days_of_week: string; notification_status: string }>>([]);

  const [newNote, setNewNote] = useState('');
  const [remTitle, setRemTitle] = useState('Evening Calm Play (10 min)');
  const [remTime, setRemTime] = useState('17:00');
  const [remDays, setRemDays] = useState('Mon,Wed,Fri');
  const [newChildName, setNewChildName] = useState('');
  const [showAddChild, setShowAddChild] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const loadParentData = useCallback(async () => {
    if (!activeChild) return;
    try {
      const [aRes, wRes, rRes, nRes, remRes] = await Promise.all([
        api.getAnalytics(activeChild.id),
        api.getWeeklyAnalytics(activeChild.id),
        api.getRecommendations(activeChild.id),
        api.getNotes(activeChild.id),
        api.getReminders(activeChild.id),
      ]);
      setAnalytics(aRes);
      setWeekly(wRes.weekly);
      setRecommendations(rRes.recommendations);
      setNotes(nRes.notes);
      setReminders(remRes.reminders);
    } catch {
      // handled gracefully
    }
  }, [activeChild]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !newNote.trim()) return;
    await api.addNote(activeChild.id, newNote.trim());
    setNewNote('');
    setFeedbackBanner('Supportive caregiver note saved.');
    loadParentData();
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !user) return;
    await api.createReminder({
      child_id: activeChild.id,
      title: remTitle,
      scheduled_time: remTime,
      days_of_week: remDays,
      email_recipient: user.email,
    });
    setFeedbackBanner('Practice reminder scheduled.');
    loadParentData();
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    const res = await api.createChild({
      display_name: newChildName.trim(),
      age_group: '7-9 years',
      learning_preferences: ['Memory', 'Pattern Recognition'],
    });
    setNewChildName('');
    setShowAddChild(false);
    await refreshAuth();
    selectChild(res.child.id);
  };

  if (!activeChild) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Parent Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
          Sign in as a Parent / Guardian to monitor your child’s cognitive play journey.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Child Switcher */}
      <div className="flex flex-col gap-4 border-b border-[var(--nb-border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#047857]">
            Parent / Guardian Overview · Gameplay Observations Only (Non-Diagnostic)
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-[var(--nb-text)]">
            {activeChild.display_name}’s Learning Journey
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {childrenList.length > 1 && (
            <select
              aria-label="Select child profile"
              value={activeChild.id}
              onChange={(e) => selectChild(e.target.value)}
              className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3.5 py-2 text-sm font-semibold min-h-[40px]"
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name} ({c.age_group})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowAddChild((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Child Profile</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/accessibility')}
            className="rounded-xl bg-[var(--nb-primary)] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
          >
            Manage Accessibility
          </button>
        </div>
      </div>

      {showAddChild && (
        <form
          onSubmit={handleCreateChild}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5"
        >
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="new-child-name" className="block text-xs font-semibold">
              Child Display Name
            </label>
            <input
              id="new-child-name"
              type="text"
              required
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="e.g., Kabir Sharma"
              className="mt-1 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2 text-sm min-h-[40px]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-xs font-semibold text-white min-h-[40px]"
          >
            Create Profile
          </button>
        </form>
      )}

      {feedbackBanner && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#D1FAE5]/50 px-4 py-2.5 text-xs font-semibold text-[#065F46]">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5">
          <p className="text-xs text-[var(--nb-text-muted)]">Total Practice Sessions</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {analytics?.overview.total_sessions ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5">
          <p className="text-xs text-[var(--nb-text-muted)]">Total Practice Time</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {analytics?.overview.total_practice_minutes ?? 0} min
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5">
          <p className="text-xs text-[var(--nb-text-muted)]">Average Gameplay Accuracy</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {analytics?.overview.average_accuracy ?? 0}%
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5">
          <p className="text-xs text-[var(--nb-text-muted)]">Current Practice Streak</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-[#047857]">
            {analytics?.overview.current_streak ?? 0} days
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
          <h2 className="font-display text-lg font-bold">7-Day Practice Minutes</h2>
          <p className="text-xs text-[var(--nb-text-muted)]">Daily time spent across cognitive games</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DC" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="minutes" name="Minutes" fill="#6D4AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
          <h2 className="font-display text-lg font-bold">Cognitive Category Gameplay Accuracy</h2>
          <p className="text-xs text-[var(--nb-text-muted)]">
            Observed gameplay accuracy (%) by cognitive skill area
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.category_trends || []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DC" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="#047857" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Personalized Insights & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 lg:col-span-5 space-y-4">
          <h2 className="font-display text-lg font-bold">Personalized Gameplay Insights</h2>
          <div className="rounded-xl bg-[var(--nb-bg)] p-4">
            <p className="text-xs font-semibold text-[#047857]">Frequently Enjoyed Area</p>
            <p className="mt-1 text-sm font-medium">{analytics?.insights.enjoyed_area}</p>
          </div>
          <div className="rounded-xl bg-[var(--nb-bg)] p-4">
            <p className="text-xs font-semibold text-[#B45309]">Helpful Next Practice Area</p>
            <p className="mt-1 text-sm font-medium">{analytics?.insights.additional_practice_area}</p>
          </div>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-[var(--nb-text)]">Recommended Next Activities</p>
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.game_id} className="rounded-xl border border-[var(--nb-border)] p-3 text-xs">
                <p className="font-bold text-[var(--nb-text)]">
                  {rec.title} · Level {rec.recommended_difficulty}
                </p>
                <p className="mt-0.5 text-[var(--nb-text-muted)]">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions Table */}
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 lg:col-span-7 overflow-x-auto">
          <h2 className="font-display text-lg font-bold">Recent Activity History</h2>
          <table className="mt-4 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--nb-border)] text-[var(--nb-text-muted)]">
                <th className="py-2.5 pr-4 font-semibold">Game</th>
                <th className="py-2.5 pr-4 font-semibold">Date</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Difficulty</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Accuracy</th>
                <th className="py-2.5 font-semibold text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--nb-border)]">
              {(analytics?.recent_sessions || []).slice(0, 8).map((s) => (
                <tr key={s.id} className="hover:bg-[var(--nb-bg)]">
                  <td className="py-3 pr-4 font-semibold text-[var(--nb-text)]">{s.game_title}</td>
                  <td className="py-3 pr-4 font-mono-tabular text-[var(--nb-text-muted)]">
                    {s.completed_at.slice(0, 10)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono-tabular">L{s.difficulty}</td>
                  <td className="py-3 pr-4 text-right font-mono-tabular font-semibold">{Math.round(s.accuracy)}%</td>
                  <td className="py-3 text-right font-mono-tabular">{Math.round(s.duration / 60)}m {s.duration % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caregiver Notes & Practice Reminders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--nb-primary)]" />
            <h2 className="font-display text-lg font-bold">Supportive Caregiver Notes</h2>
          </div>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write an observation or encouragement note for your child and special educator..."
              className="w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--nb-primary)] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
            >
              Save Supportive Note
            </button>
          </form>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pt-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl bg-[var(--nb-bg)] p-3.5 text-xs">
                <div className="flex items-center justify-between text-[var(--nb-text-muted)]">
                  <span className="font-bold text-[var(--nb-text)]">
                    {n.author_name} ({n.author_role})
                  </span>
                  <span className="font-mono-tabular">{n.created_at.slice(0, 10)}</span>
                </div>
                <p className="mt-1.5 leading-relaxed text-[var(--nb-text)]">{n.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BellPlus className="h-4 w-4 text-[#047857]" />
            <h2 className="font-display text-lg font-bold">Practice Reminders & Resources</h2>
          </div>
          <form onSubmit={handleCreateReminder} className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder="Reminder title"
              className="sm:col-span-3 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3 py-2 text-sm min-h-[40px]"
            />
            <input
              type="time"
              value={remTime}
              onChange={(e) => setRemTime(e.target.value)}
              className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3 py-2 text-sm min-h-[40px]"
            />
            <input
              type="text"
              value={remDays}
              onChange={(e) => setRemDays(e.target.value)}
              placeholder="Mon,Wed,Fri"
              className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3 py-2 text-sm min-h-[40px]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#047857] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
            >
              Add Reminder
            </button>
          </form>

          <div className="space-y-2 pt-1">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-[var(--nb-bg)] px-4 py-2.5 text-xs">
                <div>
                  <p className="font-bold">{r.title}</p>
                  <p className="text-[var(--nb-text-muted)]">
                    {r.days_of_week} at {r.scheduled_time}
                  </p>
                </div>
                <span className="font-mono-tabular text-[#047857]">{r.notification_status}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--nb-border)] pt-4">
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="text-xs font-semibold text-[var(--nb-primary)] hover:underline"
            >
              Open Trusted Resource Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('/safety')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Emergency & Safety Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
