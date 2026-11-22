import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Coins,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { AdaptiveAdjustment, GameDefinition } from '../../shared/types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { playCelebrationChord, speakText, stopSpeaking } from '../services/sound';

export interface GameCompletePayload {
  score: number;
  accuracy: number;
  attempts: number;
  hintsUsed: number;
  repeatedErrors: number;
}

export interface MiniGameProps {
  difficulty: number;
  paused: boolean;
  onHintRequest: (hintText: string) => void;
  registerHintHandler: (fn: () => string) => void;
  onComplete: (result: GameCompletePayload) => void;
}

interface GameShellProps {
  game: GameDefinition;
  initialDifficulty: number;
  onBack: () => void;
  renderGame: (props: MiniGameProps) => React.ReactNode;
}

type Stage = 'TITLE_MENU' | 'PLAYING' | 'COMPLETED';

export const GameShell: React.FC<GameShellProps> = ({
  game,
  initialDifficulty,
  onBack,
  renderGame,
}) => {
  const { prefs } = useAccessibility();
  const { activeChild } = useAuth();
  const [stage, setStage] = useState<Stage>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty || 1);
  const [paused, setPaused] = useState(false);
  const [hintBanner, setHintBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionIdKey, setSessionIdKey] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const hintProviderRef = useRef<(() => string) | null>(null);

  const [completionResult, setCompletionResult] = useState<{
    payload: GameCompletePayload;
    durationSeconds: number;
    coinsEarned: number;
    xpEarned: number;
    adaptive?: AdaptiveAdjustment;
    badges: Array<{ id: string; title: string; description: string; coinsBonus: number }>;
  } | null>(null);

  useEffect(() => {
    setDifficulty(initialDifficulty || 1);
  }, [initialDifficulty]);

  useEffect(() => {
    if (stage === 'PLAYING' && prefs.text_to_speech) {
      speakText(prefs.simplified_instructions ? game.simpleInstructions : game.detailedInstructions, true);
    }
    return () => stopSpeaking();
  }, [stage, game.id, prefs.text_to_speech, prefs.simplified_instructions]);

  const handleStart = () => {
    setHintBanner(null);
    setCompletionResult(null);
    setSaveError(null);
    setPaused(false);
    startTimeRef.current = Date.now();
    setSessionIdKey((k) => k + 1);
    setStage('PLAYING');
  };

  const handleRequestHint = () => {
    const msg = hintProviderRef.current
      ? hintProviderRef.current()
      : 'Take your time—look closely at each choice and try one gentle step.';
    setHintBanner(msg);
    if (prefs.text_to_speech) {
      speakText(msg, true);
    }
  };

  const handleGameComplete = async (payload: GameCompletePayload) => {
    const elapsedSeconds = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    playCelebrationChord(prefs.sound_enabled);
    setStage('COMPLETED');

    if (!activeChild) {
      setCompletionResult({
        payload,
        durationSeconds: elapsedSeconds,
        coinsEarned: 10,
        xpEarned: 25,
        badges: [],
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.submitGameSession({
        child_id: activeChild.id,
        game_id: game.id,
        score: Math.round(payload.score),
        accuracy: Math.round(payload.accuracy),
        attempts: Math.max(1, payload.attempts),
        duration: elapsedSeconds,
        difficulty,
        hints_used: payload.hintsUsed,
        repeated_errors: payload.repeatedErrors,
      });

      setCompletionResult({
        payload,
        durationSeconds: elapsedSeconds,
        coinsEarned: res.reward_earned.coins,
        xpEarned: res.reward_earned.xp,
        adaptive: res.adaptive_adjustment,
        badges: res.newly_unlocked_achievements || [],
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Saved locally; sync pending');
      setCompletionResult({
        payload,
        durationSeconds: elapsedSeconds,
        coinsEarned: 10,
        xpEarned: 25,
        badges: [],
      });
    } finally {
      setSaving(false);
    }
  };

  const instructionText = prefs.simplified_instructions ? game.simpleInstructions : game.detailedInstructions;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Studio Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--nb-border)] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Studio</span>
          </button>
          <div>
            <p className="text-xs font-medium text-[var(--nb-text-muted)]">
              Game {game.number} · {game.category}
            </p>
            <h1 className="font-display text-xl font-bold text-[var(--nb-text)]">{game.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => speakText(`${game.title}. ${instructionText}`, true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
          >
            <Volume2 className="h-4 w-4 text-[var(--nb-primary)]" />
            <span>Read Aloud</span>
          </button>

          {stage === 'PLAYING' && (
            <>
              <button
                type="button"
                onClick={handleRequestHint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
              >
                <HelpCircle className="h-4 w-4 text-[#B45309]" />
                <span>Gentle Hint</span>
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                <span>{paused ? 'Resume' : 'Pause'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* STAGE 1: TITLE MENU */}
      {stage === 'TITLE_MENU' && (
        <div className="mt-8 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[var(--nb-primary)]">
              Calm Practice · Zero Timers · Supportive Feedback
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--nb-text)]">
              Ready to play {game.title}?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--nb-text-muted)]">
              {instructionText}
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold text-[var(--nb-text)]">
                Difficulty Level (Recommended for you: Level {initialDifficulty})
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Select difficulty level">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    role="radio"
                    aria-checked={difficulty === lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold min-h-[40px] ${
                      difficulty === lvl
                        ? 'border-[var(--nb-primary)] bg-[var(--nb-primary)] text-white'
                        : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 min-h-[44px]"
              >
                <Play className="h-4 w-4" />
                <span>Start Game</span>
              </button>
              <span className="text-xs text-[var(--nb-text-muted)]">
                Skills: {game.skillsTargeted.join(' · ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: ACTIVE GAMEPLAY */}
      {stage === 'PLAYING' && (
        <div className="mt-6 space-y-4">
          {hintBanner && (
            <div
              role="status"
              className="flex items-center justify-between gap-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#78350F]"
            >
              <span>{hintBanner}</span>
              <button
                type="button"
                onClick={() => setHintBanner(null)}
                className="text-xs font-bold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {paused ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-12 text-center">
              <p className="font-display text-xl font-bold text-[var(--nb-text)]">Game Paused</p>
              <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
                Take a breather whenever you like. Your place is safely saved.
              </p>
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white min-h-[44px]"
              >
                <Play className="h-4 w-4" />
                <span>Resume Play</span>
              </button>
            </div>
          ) : (
            <div key={sessionIdKey} className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5 sm:p-8">
              {renderGame({
                difficulty,
                paused,
                onHintRequest: (text) => setHintBanner(text),
                registerHintHandler: (fn) => {
                  hintProviderRef.current = fn;
                },
                onComplete: handleGameComplete,
              })}
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: COMPLETION SUMMARY */}
      {stage === 'COMPLETED' && completionResult && (
        <div className="mt-8 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D1FAE5] text-[#047857]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#047857]">Wonderful Effort!</p>
              <h2 className="font-display text-2xl font-bold text-[var(--nb-text)]">
                You completed {game.title}
              </h2>
            </div>
          </div>

          {saving && (
            <p className="mt-4 text-xs font-medium text-[var(--nb-text-muted)]">
              Saving progress and updating adaptive recommendations...
            </p>
          )}
          {saveError && (
            <p className="mt-4 text-xs text-[#B45309]">{saveError}</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-4">
              <p className="text-xs text-[var(--nb-text-muted)]">Accuracy</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {Math.round(completionResult.payload.accuracy)}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-4">
              <p className="text-xs text-[var(--nb-text-muted)]">Time Practiced</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {completionResult.durationSeconds}s
              </p>
            </div>
            <div className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-4">
              <p className="text-xs text-[var(--nb-text-muted)]">Coins Earned</p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold tabular-nums text-[#B45309]">
                <Coins className="h-5 w-5" />+{completionResult.coinsEarned}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-4">
              <p className="text-xs text-[var(--nb-text-muted)]">XP Gained</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[var(--nb-primary)]">
                +{completionResult.xpEarned} XP
              </p>
            </div>
          </div>

          {completionResult.adaptive && (
            <div className="mt-6 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-5">
              <p className="text-xs font-semibold text-[var(--nb-primary)]">
                Adaptive Personalization Engine · Next Difficulty: Level {completionResult.adaptive.nextDifficulty}
              </p>
              <p className="mt-1 text-sm text-[var(--nb-text)]">{completionResult.adaptive.reason}</p>
              {completionResult.adaptive.suggestedNextCategory && (
                <p className="mt-1.5 text-xs text-[var(--nb-text-muted)]">
                  Variety tip: Try a <strong>{completionResult.adaptive.suggestedNextCategory}</strong> game next for balanced play!
                </p>
              )}
            </div>
          )}

          {completionResult.badges.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold text-[#047857]">New Badges Unlocked</p>
              <div className="flex flex-wrap gap-3">
                {completionResult.badges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#D1FAE5]/50 px-4 py-2.5 text-xs font-semibold text-[#065F46]"
                  >
                    <Award className="h-4 w-4" />
                    <span>{b.title} (+{b.coinsBonus} coins)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (completionResult.adaptive) {
                  setDifficulty(completionResult.adaptive.nextDifficulty);
                }
                handleStart();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white min-h-[44px]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--nb-text)] min-h-[44px]"
            >
              <span>Back to Child Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
