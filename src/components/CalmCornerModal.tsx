import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Wind, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { playTone } from '../services/sound';

interface CalmCornerModalProps {
  open: boolean;
  onClose: () => void;
}

type BreathPhase = 'Inhale slowly' | 'Hold gently' | 'Exhale softly';

const PETAL_COLORS = ['#EDE9FE', '#D1FAE5', '#FEF3C7', '#E0F2FE', '#FCE7F3'];

export const CalmCornerModal: React.FC<CalmCornerModalProps> = ({ open, onClose }) => {
  const { prefs } = useAccessibility();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [breathingActive, setBreathingActive] = useState(true);
  const [gardenPetals, setGardenPetals] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [calmSoundOn, setCalmSoundOn] = useState(prefs.sound_enabled);

  const phases: BreathPhase[] = ['Inhale slowly', 'Hold gently', 'Exhale softly'];

  useEffect(() => {
    if (!open || !breathingActive) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhaseIndex((p) => {
            const next = (p + 1) % 3;
            if (calmSoundOn) {
              playTone(next === 0 ? 392 : next === 1 ? 440 : 329.63, 280, true, 0.06);
            }
            return next;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, breathingActive, calmSoundOn]);

  if (!open) return null;

  const currentPhase = phases[phaseIndex];
  const circleScale =
    prefs.reduced_motion
      ? 'scale-100'
      : phaseIndex === 0
      ? 'scale-110'
      : phaseIndex === 1
      ? 'scale-110'
      : 'scale-90';

  const handleGardenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    const color = PETAL_COLORS[gardenPetals.length % PETAL_COLORS.length];
    if (calmSoundOn) {
      playTone(440 + (gardenPetals.length % 5) * 55, 240, true, 0.07);
    }
    setGardenPetals((prev) => [...prev.slice(-14), { id: Date.now() + Math.random(), x, y, color }]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calm-corner-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--nb-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h2 id="calm-corner-title" className="font-display text-xl font-bold text-[var(--nb-text)]">
                Calm Corner
              </h2>
              <p className="text-sm text-[var(--nb-text-muted)]">
                Take a quiet pause whenever you feel like resting your mind.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--nb-border)] text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)]"
            aria-label="Close Calm Corner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Guided Breathing */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6 text-center">
            <p className="text-sm font-semibold text-[var(--nb-text)]">4-4-4 Gentle Breathing</p>
            <div className="my-6 flex h-44 w-44 items-center justify-center">
              <div
                className={`flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-[#A78BFA] bg-[#EDE9FE] transition-transform duration-1000 ease-in-out ${circleScale}`}
              >
                <span className="font-display text-2xl font-bold tabular-nums text-[#25243A]">
                  {secondsLeft}s
                </span>
                <span className="mt-1 text-xs font-medium text-[#5A5870]">{currentPhase}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBreathingActive((b) => !b)}
                className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
              >
                {breathingActive ? 'Pause Guide' : 'Resume Guide'}
              </button>
              <button
                type="button"
                onClick={() => setCalmSoundOn((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-3 py-2 text-sm font-medium text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
                aria-label="Toggle calm breathing chime"
              >
                {calmSoundOn ? <Volume2 className="h-4 w-4 text-[#047857]" /> : <VolumeX className="h-4 w-4" />}
                <span>Chime</span>
              </button>
            </div>
          </div>

          {/* Gentle Sensory Tap Garden */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
            <div>
              <p className="text-sm font-semibold text-[var(--nb-text)]">Tap to Plant Calm Petals</p>
              <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
                Tap anywhere inside the quiet garden box below to place soft glowing leaves.
              </p>
            </div>
            <div
              onClick={handleGardenTap}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const color = PETAL_COLORS[gardenPetals.length % PETAL_COLORS.length];
                  setGardenPetals((prev) => [
                    ...prev.slice(-14),
                    {
                      id: Date.now() + Math.random(),
                      x: 20 + ((prev.length * 17) % 60),
                      y: 25 + ((prev.length * 23) % 50),
                      color,
                    },
                  ]);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Interactive calm garden canvas. Press Enter or click to plant a soft petal."
              className="relative my-4 h-44 w-full cursor-pointer overflow-hidden rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)]"
            >
              {gardenPetals.length === 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--nb-text-muted)]">
                  Tap here gently to grow a petal
                </span>
              )}
              {gardenPetals.map((petal) => (
                <div
                  key={petal.id}
                  style={{
                    left: `${petal.x}%`,
                    top: `${petal.y}%`,
                    backgroundColor: petal.color,
                  }}
                  className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/5 opacity-90 shadow-xs transition-transform"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGardenPetals([])}
              className="self-start rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[36px]"
            >
              Clear Garden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
