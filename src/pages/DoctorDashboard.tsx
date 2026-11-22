import React, { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileCheck2, Send, UserCheck } from 'lucide-react';
import { GAMES_CATALOG, type CaregiverNote, type ChildProfile } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api, type AnalyticsResponse } from '../services/api';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedChildren, setAssignedChildren] = useState<
    Array<ChildProfile & { session_count: number; avg_accuracy: number; last_session_at: string | null }>
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [notes, setNotes] = useState<CaregiverNote[]>([]);
  const [recGameId, setRecGameId] = useState(GAMES_CATALOG[0].id);
  const [recDifficulty, setRecDifficulty] = useState(2);
  const [recReason, setRecReason] = useState('');
  const [obsNote, setObsNote] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDoctorChildren()
      .then((res) => {
        setAssignedChildren(res.children);
        if (res.children.length > 0 && !selectedId) {
          setSelectedId(res.children[0].id);
        }
      })
      .catch(() => {});
  }, [selectedId]);

  const loadSelectedChild = useCallback(async () => {
    if (!selectedId) return;
    try {
      const [aRes, nRes] = await Promise.all([api.getAnalytics(selectedId), api.getNotes(selectedId)]);
      setAnalytics(aRes);
      setNotes(nRes.notes);
    } catch {
      // handled
    }
  }, [selectedId]);

  useEffect(() => {
    loadSelectedChild();
  }, [loadSelectedChild]);

  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Restricted Educator Portal</h1>
        <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
          This workspace is accessible only to authorized Doctor / Special Educator or Administrator accounts.
        </p>
      </div>
    );
  }

  const activeProfile = assignedChildren.find((c) => c.id === selectedId) || null;

  const longitudinalData = [...(analytics?.recent_sessions || [])]
    .reverse()
    .map((s, idx) => ({
      sessionIndex: `S${idx + 1}`,
      accuracy: Math.round(s.accuracy),
      difficulty: s.difficulty * 20, // scaled for dual readability on 0-100 chart
      rawDifficulty: s.difficulty,
      game: s.game_title,
    }));

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !recReason.trim()) return;
    await api.addDoctorRecommendation({
      child_id: selectedId,
      game_id: recGameId,
      difficulty: recDifficulty,
      reason: recReason.trim(),
    });
    setRecReason('');
    setBanner('Educator activity & difficulty recommendation saved for the learner.');
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !obsNote.trim()) return;
    await api.addNote(selectedId, obsNote.trim());
    setObsNote('');
    setBanner('Educator observation shared with guardian.');
    loadSelectedChild();
  };

  const handleExportReport = async () => {
    if (!selectedId) return;
    const report = await api.getDoctorReport(selectedId);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurobloom-progress-${report.child.display_name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBanner('Exported Weekly Progress Report (JSON).');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-[var(--nb-border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--nb-primary)]">
            Special Educator & Specialist Portal · Assigned Learners Only
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-[var(--nb-text)]">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
            Gameplay trends are non-diagnostic educational observations—not clinically validated cognitive tests.
          </p>
        </div>

        {selectedId && (
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-text)] px-4 py-2.5 text-xs font-semibold text-white min-h-[42px]"
          >
            <Download className="h-4 w-4" />
            <span>Export Progress Report</span>
          </button>
        )}
      </div>

      {banner && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#D1FAE5]/50 px-4 py-2.5 text-xs font-semibold text-[#065F46]">
          <FileCheck2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Assigned Children Sidebar */}
        <aside className="lg:col-span-4 space-y-3">
          <h2 className="font-display text-base font-bold">
            Assigned Children ({assignedChildren.length})
          </h2>
          {assignedChildren.map((child) => {
            const selected = child.id === selectedId;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedId(child.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  selected
                    ? 'border-[var(--nb-primary)] bg-[var(--nb-surface)] shadow-xs'
                    : 'border-[var(--nb-border)] bg-[var(--nb-surface)] hover:bg-[var(--nb-bg)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-[var(--nb-text)]">
                    {child.display_name}
                  </span>
                  <span className="text-xs text-[var(--nb-text-muted)]">{child.age_group}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 font-mono-tabular text-xs text-[var(--nb-text-muted)]">
                  <span>{child.session_count} sessions</span>
                  <span aria-hidden="true">·</span>
                  <span>{child.avg_accuracy}% avg accuracy</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main Longitudinal View */}
        <div className="lg:col-span-8 space-y-6">
          {activeProfile && (
            <>
              <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#047857]">Individual Learner Profile</p>
                    <h2 className="font-display text-xl font-bold">{activeProfile.display_name}</h2>
                    <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
                      Age {activeProfile.age_group} · Preferences: {activeProfile.learning_preferences.join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-4 font-mono-tabular text-xs">
                    <div className="rounded-xl bg-[var(--nb-bg)] px-3.5 py-2">
                      <span className="text-[var(--nb-text-muted)]">Sessions: </span>
                      <strong>{analytics?.overview.total_sessions ?? 0}</strong>
                    </div>
                    <div className="rounded-xl bg-[var(--nb-bg)] px-3.5 py-2">
                      <span className="text-[var(--nb-text-muted)]">Avg Accuracy: </span>
                      <strong>{analytics?.overview.average_accuracy ?? 0}%</strong>
                    </div>
                  </div>
                </div>

                <h3 className="mt-6 font-display text-sm font-bold">
                  Longitudinal Session Accuracy Trend
                </h3>
                <div className="mt-3 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={longitudinalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DC" />
                      <XAxis dataKey="sessionIndex" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy %"
                        stroke="#6D4AFF"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommend Activity & Difficulty + Share Observation */}
              <div className="grid gap-6 md:grid-cols-2">
                <form
                  onSubmit={handleRecommend}
                  className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--nb-primary)]" />
                    <h3 className="font-display text-base font-bold">Suggest Activity & Difficulty</h3>
                  </div>
                  <div>
                    <label htmlFor="doc-game" className="block text-xs font-semibold">Game</label>
                    <select
                      id="doc-game"
                      value={recGameId}
                      onChange={(e) => setRecGameId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3 py-2 text-sm min-h-[40px]"
                    >
                      {GAMES_CATALOG.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.number}. {g.title} ({g.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="doc-diff" className="block text-xs font-semibold">
                      Target Difficulty: Level {recDifficulty}
                    </label>
                    <input
                      id="doc-diff"
                      type="range"
                      min={1}
                      max={5}
                      value={recDifficulty}
                      onChange={(e) => setRecDifficulty(Number(e.target.value))}
                      className="mt-1 w-full accent-[#6D4AFF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="doc-reason" className="block text-xs font-semibold">Rationale</label>
                    <textarea
                      id="doc-reason"
                      rows={2}
                      required
                      value={recReason}
                      onChange={(e) => setRecReason(e.target.value)}
                      placeholder="e.g., Encourage calm spatial planning at Level 2."
                      className="mt-1 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--nb-primary)] px-4 py-2.5 text-xs font-semibold text-white min-h-[40px]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Save Recommendation</span>
                  </button>
                </form>

                <form
                  onSubmit={handleAddObservation}
                  className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 space-y-3"
                >
                  <h3 className="font-display text-base font-bold">Caregiver & Educator Notes</h3>
                  <textarea
                    rows={3}
                    required
                    value={obsNote}
                    onChange={(e) => setObsNote(e.target.value)}
                    placeholder="Add a supportive observation for the parent/guardian..."
                    className="w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-2.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#047857] px-4 py-2.5 text-xs font-semibold text-white min-h-[40px]"
                  >
                    Post Observation
                  </button>
                  <div className="space-y-2 max-h-36 overflow-y-auto pt-2">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl bg-[var(--nb-bg)] p-3 text-xs">
                        <p className="font-bold">{n.author_name} ({n.author_role})</p>
                        <p className="mt-0.5 text-[var(--nb-text-muted)]">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
