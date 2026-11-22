import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { playGentleNudge, playSuccessChime } from '../services/sound';
import type { MiniGameProps } from './GameShell';

// ============================================================================
// GAME 9: MAZE EXPLORER (Keyboard + D-Pad + Tap-Adjacent Controls)
// ============================================================================
const MAZE_PRESETS: Record<number, number[][]> = {
  1: [
    [0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
  ],
  2: [
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [1, 1, 1, 0, 0, 0],
  ],
  3: [
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0],
  ],
};

export const MazeExplorerGame: React.FC<MiniGameProps> = ({
  difficulty,
  paused,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const grid = useMemo(() => MAZE_PRESETS[Math.min(3, Math.max(1, Math.ceil(difficulty / 2)))] || MAZE_PRESETS[1], [difficulty]);
  const rows = grid.length;
  const cols = grid[0].length;
  const goal = { r: rows - 1, c: cols - 1 };

  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [moves, setMoves] = useState(0);
  const [wallBumps, setWallBumps] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [status, setStatus] = useState('Guide the explorer to the glowing flower goal.');
  const completedRef = useRef(false);

  const tryMove = useCallback(
    (dr: number, dc: number) => {
      if (paused || completedRef.current) return;
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === 1) {
        playGentleNudge(prefs.sound_enabled);
        setWallBumps((w) => w + 1);
        setStatus('Gentle hedge ahead—try an open path tile.');
        return;
      }
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setPos({ r: nr, c: nc });
      setStatus('Keep going! Follow the open garden path.');

      if (nr === goal.r && nc === goal.c) {
        completedRef.current = true;
        playSuccessChime(prefs.sound_enabled);
        const accuracy = Math.max(65, Math.min(100, Math.round(100 - wallBumps * 6)));
        setTimeout(() => {
          onComplete({
            score: accuracy,
            accuracy,
            attempts: nextMoves,
            hintsUsed,
            repeatedErrors: wallBumps,
          });
        }, 350);
      }
    },
    [paused, pos, rows, cols, grid, moves, goal.r, goal.c, prefs.sound_enabled, wallBumps, hintsUsed, onComplete]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        tryMove(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        tryMove(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        tryMove(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        tryMove(0, 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      const dirs = [
        { dr: 0, dc: 1, label: 'Right' },
        { dr: 1, dc: 0, label: 'Down' },
        { dr: 0, dc: -1, label: 'Left' },
        { dr: -1, dc: 0, label: 'Up' },
      ];
      const openDir = dirs.find(
        (d) =>
          pos.r + d.dr >= 0 &&
          pos.r + d.dr < rows &&
          pos.c + d.dc >= 0 &&
          pos.c + d.dc < cols &&
          grid[pos.r + d.dr][pos.c + d.dc] === 0
      );
      return openDir
        ? `Hint: You can step ${openDir.label} onto an open path tile.`
        : 'Look for an adjacent open tile.';
    });
  }, [pos, rows, cols, grid, registerHintHandler]);

  return (
    <div className="grid gap-8 md:grid-cols-12 items-center">
      <div className="md:col-span-7 flex flex-col items-center">
        <div
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          className="grid gap-1.5 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-3"
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = pos.r === r && pos.c === c;
              const isGoal = goal.r === r && goal.c === c;
              const isAdjacentOpen =
                cell === 0 && Math.abs(pos.r - r) + Math.abs(pos.c - c) === 1;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={!isAdjacentOpen}
                  onClick={() => {
                    if (isAdjacentOpen) tryMove(r - pos.r, c - pos.c);
                  }}
                  aria-label={`Row ${r + 1} Col ${c + 1} ${cell === 1 ? 'hedge' : isGoal ? 'flower goal' : 'open path'}`}
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-lg font-bold transition-colors ${
                    isPlayer
                      ? 'bg-[var(--nb-primary)] text-white shadow-sm'
                      : isGoal
                      ? 'bg-[#FEF3C7] border-2 border-[#B45309]'
                      : cell === 1
                      ? 'bg-[#25243A]/15 cursor-not-allowed'
                      : isAdjacentOpen
                      ? 'bg-[#D1FAE5]/70 border border-[#047857]/40 hover:bg-[#A7F3D0]'
                      : 'bg-[var(--nb-surface)] border border-[var(--nb-border)]'
                  }`}
                >
                  {isPlayer ? '🧭' : isGoal ? '🌸' : ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="md:col-span-5 space-y-5">
        <div>
          <p className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
            Steps taken: {moves}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--nb-text)]">{status}</p>
          <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
            Use keyboard arrows, tap glowing adjacent green tiles, or use the direction pad below.
          </p>
        </div>

        {/* Accessible D-Pad */}
        <div className="inline-grid grid-cols-3 gap-2 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-3">
          <div />
          <button
            type="button"
            onClick={() => tryMove(-1, 0)}
            aria-label="Move up"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] hover:bg-[var(--nb-surface-subtle)]"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <div />
          <button
            type="button"
            onClick={() => tryMove(0, -1)}
            aria-label="Move left"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] hover:bg-[var(--nb-surface-subtle)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => tryMove(1, 0)}
            aria-label="Move down"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] hover:bg-[var(--nb-surface-subtle)]"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => tryMove(0, 1)}
            aria-label="Move right"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] hover:bg-[var(--nb-surface-subtle)]"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GAME 10: SKY GLIDER MOTOR SIMULATOR (Original Gentle Tap-to-Glide Game)
// ============================================================================
export const SkyGliderGame: React.FC<MiniGameProps> = ({
  difficulty,
  paused,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const targetGates = Math.min(8, 3 + difficulty);
  const [sensitivity, setSensitivity] = useState(5); // 1 gentle to 10 brisk
  const [gatesCleared, setGatesCleared] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [bumps, setBumps] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    kiteY: 140,
    velY: 0,
    gatesCleared: 0,
    bumps: 0,
    flaps: 0,
    done: false,
    obstacles: [
      { x: 420, gapY: 130, passed: false },
      { x: 680, gapY: 170, passed: false },
    ],
  });

  const flap = useCallback(() => {
    if (paused || stateRef.current.done) return;
    const lift = -2.6 - sensitivity * 0.35;
    stateRef.current.velY = lift;
    stateRef.current.flaps += 1;
    setAttempts(stateRef.current.flaps);
  }, [paused, sensitivity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      return 'Tip: Short gentle taps keep the paper kite steady. You can lower Sensitivity below for slower gliding!';
    });
  }, [registerHintHandler]);

  useEffect(() => {
    if (paused) return;
    let rafId = 0;
    const gravity = 0.08 + sensitivity * 0.015;
    const speed = (prefs.interaction_timing === 'relaxed' ? 1.3 : 1.75) + difficulty * 0.18;
    const gapHeight = Math.max(92, 138 - difficulty * 8);

    const step = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const st = stateRef.current;
      if (!canvas || !ctx || st.done) return;

      // Physics
      st.velY = Math.min(4.2, st.velY + gravity);
      st.kiteY = Math.max(24, Math.min(canvas.height - 24, st.kiteY + st.velY));

      // Move cloud gates
      for (const obs of st.obstacles) {
        obs.x -= speed;
        const kiteX = 90;
        if (!obs.passed && obs.x + 28 < kiteX) {
          obs.passed = true;
          st.gatesCleared += 1;
          setGatesCleared(st.gatesCleared);
          playSuccessChime(prefs.sound_enabled);
        }

        // Gentle bump check (no instant death, softly nudges back to center of gate)
        if (Math.abs(obs.x - kiteX) < 24) {
          const topEdge = obs.gapY - gapHeight / 2;
          const bottomEdge = obs.gapY + gapHeight / 2;
          if (st.kiteY < topEdge || st.kiteY > bottomEdge) {
            st.bumps += 1;
            setBumps(st.bumps);
            st.kiteY = obs.gapY;
            st.velY = 0;
            playGentleNudge(prefs.sound_enabled);
          }
        }

        if (obs.x < -60) {
          obs.x = canvas.width + 120;
          obs.gapY = 75 + Math.random() * (canvas.height - 150);
          obs.passed = false;
        }
      }

      // Draw calm sky scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#E0F2FE');
      grad.addColorStop(1, '#FAFAF7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cloud arches
      for (const obs of st.obstacles) {
        const topH = Math.max(10, obs.gapY - gapHeight / 2);
        const botY = obs.gapY + gapHeight / 2;
        ctx.fillStyle = '#A78BFA';
        ctx.beginPath();
        ctx.roundRect(obs.x - 18, 0, 36, topH, 12);
        ctx.roundRect(obs.x - 18, botY, 36, canvas.height - botY, 12);
        ctx.fill();
      }

      // Paper kite explorer
      ctx.save();
      ctx.translate(90, st.kiteY);
      ctx.fillStyle = '#FDE68A';
      ctx.strokeStyle = '#25243A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(0, -14);
      ctx.lineTo(-16, 0);
      ctx.lineTo(0, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      if (st.gatesCleared >= targetGates) {
        st.done = true;
        const accuracy = Math.max(60, Math.min(100, Math.round(100 - st.bumps * 8)));
        onComplete({
          score: accuracy,
          accuracy,
          attempts: Math.max(1, st.flaps),
          hintsUsed,
          repeatedErrors: st.bumps,
        });
        return;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused, difficulty, sensitivity, targetGates, prefs.interaction_timing, prefs.sound_enabled, hintsUsed, onComplete]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono-tabular text-sm font-bold text-[var(--nb-text)]">
            Gates Cleared: {gatesCleared} / {targetGates}
          </span>
          <span className="font-mono-tabular text-xs text-[var(--nb-text-muted)]">
            Taps: {attempts} · Soft Bumps: {bumps}
          </span>
        </div>

        <label className="flex items-center gap-3 text-xs font-semibold text-[var(--nb-text)]">
          <span>Lift Sensitivity: {sensitivity}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="accent-[#6D4AFF]"
          />
        </label>
      </div>

      <div
        onClick={flap}
        className="cursor-pointer overflow-hidden rounded-2xl border border-[var(--nb-border)]"
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={280}
          className="h-[260px] w-full block"
          aria-label="Sky Glider interactive flight canvas. Click or press Space to lift the kite."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-[var(--nb-text-muted)]">
          Press <strong>Space</strong>, <strong>Up Arrow</strong>, click the sky canvas, or tap Lift Kite.
        </p>
        <button
          type="button"
          onClick={flap}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-6 py-3 text-sm font-semibold text-white min-h-[44px]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Lift Kite</span>
        </button>
      </div>
    </div>
  );
};
