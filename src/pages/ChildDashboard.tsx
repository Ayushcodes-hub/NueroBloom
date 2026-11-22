import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  CheckCircle2,
  Coins,
  Flame,
  Play,
  SlidersHorizontal,
  Sparkles,
  Wind,
} from 'lucide-react';
import {
  ACHIEVEMENTS_CATALOG,
  GAMES_CATALOG,
  type CaregiverNote,
  type GameCategory,
  type GameDefinition,
  type GameRecommendation,
} from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api, type RewardsSummaryResponse } from '../services/api';
import { CalmCornerModal } from '../components/CalmCornerModal';

interface ChildDashboardProps {
  navigate: (to: string) => void;
}

const CATEGORY_FILTERS: Array<'All' | GameCategory> = [
  'All',
  'Memory',
  'Attention',
  'Pattern Recognition',
  'Motor Coordination',
  'Language',
  'Problem Solving',
];

export const ChildDashboard: React.FC<ChildDashboardProps> = ({ navigate }) => {
  const { activeChild } = useAuth();
  const [games, setGames] = useState<Array<GameDefinition & { recommended_difficulty: number }>>(
    GAMES_CATALOG.map((g) => ({ ...g, recommended_difficulty: 1 }))
  );
  const [rewards, setRewards] = useState<RewardsSummaryResponse | null>(null);
  const [primaryRec, setPrimaryRec] = useState<GameRecommendation | null>(null);
  const [notes, setNotes] = useState<CaregiverNote[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'All' | GameCategory>('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [calmOpen, setCalmOpen] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const loadChildData = useCallback(async () => {
    if (!activeChild) return;
    try {
      const [gamesRes, rewardsRes, recRes, notesRes] = await Promise.all([
        api.getGames(activeChild.id),
        api.getRewards(activeChild.id),
        api.getRecommendations(activeChild.id),
        api.getNotes(activeChild.id),
      ]);
      setGames(gamesRes.games);
      setRewards(rewardsRes);
      setPrimaryRec(recRes.primary);
      setNotes(notesRes.notes);
    } catch {
      // keep existing state cleanly
    }
  }, [activeChild]);

  useEffect(() => {
    loadChildData();
  }, [loadChildData]);

  const handleClaimMission = async () => {
    if (!activeChild) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await api.claimReward(activeChild.id, 'daily_mission');
      setRewards(res.rewards_summary);
      setClaimMsg(res.message);
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : 'Unable to claim right now');
    } finally {
      setClaiming(false);
    }
  };

  if (!activeChild) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">No Child Profile Selected</h1>
        <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
          Sign in with a child or parent demo account to open the Play Studio.
        </p>
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="mt-6 rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const firstName = activeChild.display_name.split(' ')[0];
  const filteredGames =
    categoryFilter === 'All' ? games : games.filter((g) => g.category === categoryFilter);
  const unlockedSet = new Set((rewards?.unlocked_achievements || []).map((a) => a.achievement_id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* CHILD HEADER BAR */}
      <section className="flex flex-col gap-5 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {activeChild.avatar_url && !avatarError ? (
            <img
              src={activeChild.avatar_url}
              alt={`${activeChild.display_name} avatar`}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-16 w-16 rounded-2xl border border-[var(--nb-border)] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE9FE] font-display text-xl font-bold text-[#6D4AFF]">
              {firstName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-[var(--nb-primary)]">
              Level {rewards?.level ?? 1} Explorer · {rewards?.progressPercent ?? 0}% to next level
            </p>
            <h1 className="font-display text-2xl font-bold text-[var(--nb-text)] sm:text-3xl">
              Hello, {firstName}! Ready for a new adventure?
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-4 py-2.5">
            <Coins className="h-4 w-4 text-[#B45309]" />
            <span className="font-mono-tabular text-sm font-bold text-[var(--nb-text)]">
              {rewards?.total_coins ?? 0} Coins
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-4 py-2.5">
            <Flame className="h-4 w-4 text-[#047857]" />
            <span className="font-mono-tabular text-sm font-bold text-[var(--nb-text)]">
              {rewards?.streak_days ?? 0}-Day Streak
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowNotifications((s) => !s)}
            aria-label="Open notifications and caregiver messages"
            aria-expanded={showNotifications}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)]"
          >
            <Bell className="h-5 w-5" />
          </button>

          {showNotifications && (
            <div
              role="region"
              aria-label="Notifications"
              className="absolute right-0 top-14 z-30 w-80 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[var(--nb-border)] pb-2">
                <p className="font-display text-sm font-bold">Messages & Badges</p>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[var(--nb-primary)]"
                >
                  Close
                </button>
              </div>
              <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto text-xs">
                {notes.slice(0, 3).map((n) => (
                  <div key={n.id} className="rounded-xl bg-[var(--nb-bg)] p-3">
                    <p className="font-bold text-[var(--nb-text)]">{n.author_name}</p>
                    <p className="mt-0.5 text-[var(--nb-text-muted)]">{n.note}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-[var(--nb-text-muted)]">No messages yet today. Have a wonderful session!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RECOMMENDED GAME + DAILY MISSION + CALM CORNER */}
      <section className="grid gap-6 lg:grid-cols-12">
        {/* Adaptive Recommendation */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nb-primary)]">
              <Sparkles className="h-4 w-4" />
              <span>Recommended For You</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--nb-text)]">
              {primaryRec?.title || 'Memory Match'}
            </h2>
            <p className="mt-1 text-xs font-medium text-[var(--nb-text-muted)]">
              {primaryRec?.category || 'Memory'} · Level {primaryRec?.recommended_difficulty ?? 1}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--nb-text-muted)]">
              {primaryRec?.reason ||
                'Recommended to keep your practice varied and comfortable today.'}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/play/${primaryRec?.game_id || 'memory-match'}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 min-h-[44px]"
            >
              <Play className="h-4 w-4" />
              <span>Play Recommended Game</span>
            </button>
          </div>
        </div>

        {/* Daily Mission */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 lg:col-span-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--nb-text)]">Daily Mission</h2>
            <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
              Gentle daily goals — finish 2 games to unlock +25 bonus coins.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Complete 2 cognitive games</span>
                <span className="font-mono-tabular font-bold">
                  {Math.min(2, rewards?.daily_mission.games_completed_today ?? 0)} / 2
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Earn 50 coins</span>
                <span className="font-mono-tabular font-bold">
                  {Math.min(50, rewards?.daily_mission.coins_today ?? 0)} / 50
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Practice 10 minutes</span>
                <span className="font-mono-tabular font-bold">
                  {Math.min(10, rewards?.daily_mission.minutes_today ?? 0)} / 10m
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {rewards?.daily_mission.bonus_claimed ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#D1FAE5] px-4 py-2.5 text-xs font-bold text-[#065F46]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Daily Mission Bonus Claimed Today</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={claiming}
                onClick={handleClaimMission}
                className="w-full rounded-xl border border-[var(--nb-primary)] bg-[var(--nb-primary-soft)] px-4 py-2.5 text-xs font-bold text-[#3719CA] hover:bg-[#DDD6FE] min-h-[42px]"
              >
                {claiming ? 'Checking...' : 'Claim +25 Daily Bonus Coins'}
              </button>
            )}
            {claimMsg && <p className="mt-2 text-xs text-[var(--nb-text-muted)]">{claimMsg}</p>}
          </div>
        </div>

        {/* Calm Corner + Quick Accessibility */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[#D1FAE5]/35 p-6 lg:col-span-3">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
              <Wind className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-[var(--nb-text)]">Calm Corner</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--nb-text-muted)]">
              Need a slow breather? Visit the quiet breathing circle and calm petal garden anytime.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => setCalmOpen(true)}
              className="w-full rounded-xl bg-[#047857] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 min-h-[42px]"
            >
              Open Calm Corner
            </button>
            <button
              type="button"
              onClick={() => navigate('/accessibility')}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] min-h-[40px]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Accessibility Settings</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11-GAME STUDIO CATALOG */}
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--nb-text)]">
              Cognitive Gameplay Studio (11 Games)
            </h2>
            <p className="text-sm text-[var(--nb-text-muted)]">
              Every activity adapts difficulty automatically and rewards effort without pressure.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Game categories">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold min-h-[38px] ${
                categoryFilter === cat
                  ? 'bg-[var(--nb-text)] text-white'
                  : 'border border-[var(--nb-border)] bg-[var(--nb-surface)] text-[var(--nb-text-muted)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[var(--nb-text-muted)]">
                  <span className="font-semibold" style={{ color: game.accentHex }}>
                    {game.category}
                  </span>
                  <span className="font-mono-tabular">
                    Level {game.recommended_difficulty} · ~{game.estimatedMinutes}m
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[var(--nb-text)]">
                  {game.number}. {game.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                  {game.shortDescription}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[var(--nb-border)] pt-4">
                <span className="text-xs text-[var(--nb-text-muted)]">
                  {game.skillsTargeted[0]}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/play/${game.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--nb-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 min-h-[38px]"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ACHIEVEMENTS GALLERY */}
      <section className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[#B45309]" />
          <h2 className="font-display text-xl font-bold text-[var(--nb-text)]">
            Achievement Badges ({unlockedSet.size} / {ACHIEVEMENTS_CATALOG.length})
          </h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS_CATALOG.map((ach) => {
            const isUnlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-4 ${
                  isUnlocked
                    ? 'border-[#A7F3D0] bg-[#D1FAE5]/30'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isUnlocked ? 'text-[#047857]' : 'text-[var(--nb-text-muted)]'}>
                    {isUnlocked ? 'Unlocked' : 'In Progress'}
                  </span>
                  <span className="font-mono-tabular text-[var(--nb-text-muted)]">
                    +{ach.coinsBonus} coins
                  </span>
                </div>
                <p className="mt-1 font-display text-base font-bold text-[var(--nb-text)]">
                  {ach.title}
                </p>
                <p className="mt-1 text-xs text-[var(--nb-text-muted)]">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <CalmCornerModal open={calmOpen} onClose={() => setCalmOpen(false)} />
    </div>
  );
};
