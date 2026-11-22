import React, { useEffect, useMemo, useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { playGentleNudge, playSuccessChime } from '../services/sound';
import type { MiniGameProps } from './GameShell';

// ============================================================================
// GAME 2: PATTERN SEQUENCE
// ============================================================================
const PATTERN_TOKENS = [
  { id: 'circle', label: 'Lavender Circle', symbol: '●', bg: '#EDE9FE', border: '#6D4AFF' },
  { id: 'triangle', label: 'Mint Triangle', symbol: '▲', bg: '#D1FAE5', border: '#047857' },
  { id: 'star', label: 'Sunny Star', symbol: '★', bg: '#FEF3C7', border: '#B45309' },
  { id: 'diamond', label: 'Sky Diamond', symbol: '◆', bg: '#E0F2FE', border: '#0369A1' },
];

export const PatternSequenceGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const totalRounds = 3;
  const startLen = Math.min(4, difficulty + 1);

  const [roundIdx, setRoundIdx] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputSeq, setInputSeq] = useState<number[]>([]);
  const [showingDemo, setShowingDemo] = useState(true);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [status, setStatus] = useState('Watch the pattern light up!');

  const playDemo = (seq: number[]) => {
    setShowingDemo(true);
    setStatus('Watch closely...');
    const stepMs = prefs.interaction_timing === 'relaxed' ? 750 : 550;
    seq.forEach((tokenIdx, i) => {
      setTimeout(() => {
        setHighlighted(tokenIdx);
        setTimeout(() => setHighlighted(null), stepMs - 140);
      }, i * stepMs + 250);
    });
    setTimeout(() => {
      setShowingDemo(false);
      setStatus('Now tap the shapes in the same order.');
    }, seq.length * stepMs + 350);
  };

  useEffect(() => {
    const seq = Array.from({ length: startLen + roundIdx }, () =>
      Math.floor(Math.random() * PATTERN_TOKENS.length)
    );
    setSequence(seq);
    setInputSeq([]);
    playDemo(seq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, startLen]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      playDemo(sequence);
      return 'Watching the pattern sequence one more time.';
    });
  }, [sequence, registerHintHandler]);

  const handleTap = (idx: number) => {
    if (showingDemo) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (idx === sequence[inputSeq.length]) {
      playSuccessChime(prefs.sound_enabled);
      const nextInput = [...inputSeq, idx];
      setInputSeq(nextInput);
      if (nextInput.length === sequence.length) {
        if (roundIdx + 1 >= totalRounds) {
          const totalItems = startLen * totalRounds + 3;
          const accuracy = Math.min(100, Math.round((totalItems / Math.max(totalItems, nextAttempts)) * 100));
          setTimeout(() => {
            onComplete({
              score: Math.max(70, accuracy),
              accuracy,
              attempts: nextAttempts,
              hintsUsed,
              repeatedErrors: errors,
            });
          }, 450);
        } else {
          setStatus('Pattern complete! Get ready for one more step.');
          setTimeout(() => setRoundIdx((r) => r + 1), 650);
        }
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setInputSeq([]);
      setStatus('Let us watch the pattern again gently.');
      setTimeout(() => playDemo(sequence), 550);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--nb-text)]">{status}</p>
        <span className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
          Round {roundIdx + 1}/{totalRounds} · Step {inputSeq.length}/{sequence.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PATTERN_TOKENS.map((tok, idx) => {
          const isLit = highlighted === idx;
          return (
            <button
              key={tok.id}
              type="button"
              disabled={showingDemo}
              onClick={() => handleTap(idx)}
              style={{
                backgroundColor: tok.bg,
                borderColor: isLit ? '#25243A' : tok.border,
              }}
              className={`flex h-32 flex-col items-center justify-center rounded-2xl border-3 transition-transform ${
                isLit ? 'scale-105 shadow-lg ring-4 ring-[#6D4AFF]/30' : ''
              }`}
            >
              <span className="text-4xl text-[#25243A]" aria-hidden="true">{tok.symbol}</span>
              <span className="mt-2 text-xs font-bold text-[#25243A]">{tok.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 3: COLOR SORTING (Supports both Drag & Accessible Tap-to-Select)
// ============================================================================
const SORT_CATEGORIES = [
  { id: 'lavender', name: 'Lavender', symbol: '●', bg: '#EDE9FE', border: '#6D4AFF' },
  { id: 'mint', name: 'Mint', symbol: '▲', bg: '#D1FAE5', border: '#047857' },
  { id: 'yellow', name: 'Sunny', symbol: '★', bg: '#FEF3C7', border: '#B45309' },
];

export const ColorSortingGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const itemCount = Math.min(9, difficulty + 4);

  const [tokens, setTokens] = useState(() =>
    Array.from({ length: itemCount }, (_, i) => {
      const cat = SORT_CATEGORIES[i % SORT_CATEGORIES.length];
      return { uid: `tok-${i}`, categoryId: cat.id, symbol: cat.symbol, bg: cat.bg, name: cat.name };
    }).sort(() => Math.random() - 0.5)
  );
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState(
    prefs.alternative_tap
      ? 'Tap a token first, then tap its matching basket.'
      : 'Drag a token into its matching basket—or tap token then basket.'
  );

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      const first = tokens[0];
      if (!first) return 'All tokens sorted!';
      setSelectedUid(first.uid);
      return `Hint: The ${first.name} (${first.symbol}) token belongs in the ${first.name} basket.`;
    });
  }, [tokens, registerHintHandler]);

  const placeInBasket = (tokenUid: string, basketId: string) => {
    const token = tokens.find((t) => t.uid === tokenUid);
    if (!token) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (token.categoryId === basketId) {
      playSuccessChime(prefs.sound_enabled);
      const remaining = tokens.filter((t) => t.uid !== tokenUid);
      setTokens(remaining);
      setSelectedUid(null);
      setFeedback(`Sorted into the ${token.name} basket!`);

      if (remaining.length === 0) {
        const accuracy = Math.min(100, Math.round((itemCount / nextAttempts) * 100));
        setTimeout(() => {
          onComplete({
            score: Math.max(70, accuracy),
            accuracy,
            attempts: nextAttempts,
            hintsUsed,
            repeatedErrors: errors,
          });
        }, 400);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setFeedback(`Look closely at the symbol (${token.symbol}) and match it with the ${token.name} basket.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--nb-text)]">{feedback}</p>
        <span className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
          Remaining: {tokens.length}
        </span>
      </div>

      {/* Tokens Tray */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-5 min-h-[100px]">
        {tokens.map((tok) => {
          const isSelected = selectedUid === tok.uid;
          return (
            <button
              key={tok.uid}
              type="button"
              draggable={!prefs.alternative_tap}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', tok.uid)}
              onClick={() => setSelectedUid(isSelected ? null : tok.uid)}
              style={{ backgroundColor: tok.bg }}
              aria-pressed={isSelected}
              aria-label={`${tok.name} token`}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold text-[#25243A] transition-transform ${
                isSelected ? 'scale-105 border-[#25243A] ring-3 ring-[#6D4AFF]/30' : 'border-black/15'
              }`}
            >
              {tok.symbol}
            </button>
          );
        })}
      </div>

      {/* Target Baskets */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SORT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedUid = e.dataTransfer.getData('text/plain');
              if (droppedUid) placeInBasket(droppedUid, cat.id);
            }}
            onClick={() => {
              if (selectedUid) placeInBasket(selectedUid, cat.id);
            }}
            style={{ backgroundColor: cat.bg, borderColor: cat.border }}
            className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-[#25243A] hover:opacity-95"
          >
            <span className="text-3xl font-bold" aria-hidden="true">{cat.symbol}</span>
            <span className="mt-2 font-display text-sm font-bold">{cat.name} Basket</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 4: SHAPE IDENTIFICATION
// ============================================================================
const SHAPES = [
  { id: 'circle', name: 'Circle', svg: <circle cx="50" cy="50" r="32" fill="#A78BFA" stroke="#25243A" strokeWidth="3" /> },
  { id: 'triangle', name: 'Triangle', svg: <polygon points="50,16 84,80 16,80" fill="#A7F3D0" stroke="#25243A" strokeWidth="3" /> },
  { id: 'square', name: 'Square', svg: <rect x="20" y="20" width="60" height="60" rx="4" fill="#FDE68A" stroke="#25243A" strokeWidth="3" /> },
  { id: 'diamond', name: 'Diamond', svg: <polygon points="50,12 86,50 50,88 14,50" fill="#BAE6FD" stroke="#25243A" strokeWidth="3" /> },
  { id: 'hexagon', name: 'Hexagon', svg: <polygon points="50,14 82,32 82,68 50,86 18,68 18,32" fill="#FBCFE8" stroke="#25243A" strokeWidth="3" /> },
];

export const ShapeIdentificationGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const totalRounds = Math.min(5, difficulty + 2);
  const rounds = useMemo(
    () => [...SHAPES].sort(() => Math.random() - 0.5).slice(0, totalRounds),
    [totalRounds]
  );

  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [msg, setMsg] = useState('Tap the geometric shape asked for below.');

  const target = rounds[idx];
  const options = useMemo(() => {
    const others = SHAPES.filter((s) => s.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, difficulty >= 3 ? 3 : 2);
    return [target, ...others].sort(() => Math.random() - 0.5);
  }, [target, difficulty]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      const sidesHint =
        target.id === 'circle'
          ? 'It is completely round with no corners.'
          : target.id === 'triangle'
          ? 'Count 3 straight sides.'
          : target.id === 'hexagon'
          ? 'Count 6 sides.'
          : 'Count 4 corners.';
      return `Hint for ${target.name}: ${sidesHint}`;
    });
  }, [target, registerHintHandler]);

  const pickShape = (id: string) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (id === target.id) {
      playSuccessChime(prefs.sound_enabled);
      setMsg(`Spot on! That is the ${target.name}.`);
      if (idx + 1 >= rounds.length) {
        const accuracy = Math.min(100, Math.round((rounds.length / nextAttempts) * 100));
        setTimeout(() => {
          onComplete({
            score: Math.max(70, accuracy),
            accuracy,
            attempts: nextAttempts,
            hintsUsed,
            repeatedErrors: errors,
          });
        }, 450);
      } else {
        setTimeout(() => {
          setIdx((i) => i + 1);
          setMsg('Tap the next requested shape.');
        }, 500);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setMsg(`Let us look for the ${target.name}. Count the sides gently!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--nb-text-muted)]">
        <span>Shape {idx + 1} of {rounds.length}</span>
        <span>{msg}</span>
      </div>
      <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6 text-center">
        <p className="text-xs text-[var(--nb-text-muted)]">Tap the shape:</p>
        <p className="mt-1 font-display text-3xl font-extrabold text-[var(--nb-text)]">{target.name}</p>
      </div>
      <div className={`grid gap-4 ${options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => pickShape(opt.id)}
            aria-label={opt.name}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 hover:border-[var(--nb-primary)]"
          >
            <svg viewBox="0 0 100 100" className="h-24 w-24">
              {opt.svg}
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 5: NUMBER SEQUENCE
// ============================================================================
export const NumberSequenceGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const totalRounds = 4;

  const puzzles = useMemo(() => {
    return Array.from({ length: totalRounds }, (_, i) => {
      const step = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 3 ? 5 : (i % 2 === 0 ? 3 : 4);
      const start = (i + 1) * step;
      const seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      const missingPos = (i % 3) + 1;
      const answer = seq[missingPos];
      const choices = [answer, answer + step, Math.max(1, answer - 1), answer + 2]
        .filter((v, idx, arr) => arr.indexOf(v) === idx)
        .slice(0, 4)
        .sort(() => Math.random() - 0.5);
      return { seq, missingPos, answer, step, choices };
    });
  }, [difficulty]);

  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [msg, setMsg] = useState('Choose the missing stepping-stone number.');

  const current = puzzles[idx];

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      return `Hint: Each stepping stone increases by ${current.step}.`;
    });
  }, [current, registerHintHandler]);

  const handleAnswer = (val: number) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (val === current.answer) {
      playSuccessChime(prefs.sound_enabled);
      setMsg(`Correct! ${current.answer} completes the stone path.`);
      if (idx + 1 >= puzzles.length) {
        const accuracy = Math.min(100, Math.round((puzzles.length / nextAttempts) * 100));
        setTimeout(() => {
          onComplete({
            score: Math.max(70, accuracy),
            accuracy,
            attempts: nextAttempts,
            hintsUsed,
            repeatedErrors: errors,
          });
        }, 450);
      } else {
        setTimeout(() => {
          setIdx((i) => i + 1);
          setMsg('Find the missing number in the next path.');
        }, 500);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setMsg(`Notice the jump between stones is +${current.step}. Try another number!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--nb-text-muted)]">
        <span>Sequence {idx + 1} of {puzzles.length}</span>
        <span>{msg}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
        {current.seq.map((num, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 font-display text-2xl font-bold tabular-nums ${
              i === current.missingPos
                ? 'border-dashed border-[var(--nb-primary)] bg-[#EDE9FE] text-[#3719CA]'
                : 'border-[var(--nb-border)] bg-[var(--nb-surface)] text-[var(--nb-text)]'
            }`}
          >
            {i === current.missingPos ? '?' : num}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {current.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => handleAnswer(choice)}
            className="rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-surface)] py-4 font-display text-2xl font-bold tabular-nums text-[var(--nb-text)] hover:border-[var(--nb-primary)] min-h-[60px]"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 6: VISUAL ATTENTION
// ============================================================================
const GARDEN_ITEMS = ['🌼', '🍃', '🦋', '🐞', '🍄', '🌰'];

export const VisualAttentionGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const gridSize = Math.min(20, 8 + difficulty * 3);
  const targetEmoji = GARDEN_ITEMS[difficulty % GARDEN_ITEMS.length];
  const targetCount = Math.min(5, 2 + Math.floor(difficulty / 2) + 1);

  const cells = useMemo(() => {
    const distractors = GARDEN_ITEMS.filter((e) => e !== targetEmoji);
    const list: string[] = Array.from({ length: targetCount }, () => targetEmoji);
    while (list.length < gridSize) {
      list.push(distractors[list.length % distractors.length]);
    }
    return list.sort(() => Math.random() - 0.5);
  }, [gridSize, targetEmoji, targetCount]);

  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [msg, setMsg] = useState('Tap every item that matches the target above.');

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      const nextUnfound = cells.findIndex((c, idx) => c === targetEmoji && !foundIndices.includes(idx));
      if (nextUnfound >= 0) {
        setHintIndex(nextUnfound);
        setTimeout(() => setHintIndex(null), 1600);
        return `Hint: Look closely at tile #${nextUnfound + 1}.`;
      }
      return 'You found them all!';
    });
  }, [cells, targetEmoji, foundIndices, registerHintHandler]);

  const tapCell = (idx: number) => {
    if (foundIndices.includes(idx)) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (cells[idx] === targetEmoji) {
      playSuccessChime(prefs.sound_enabled);
      const nextFound = [...foundIndices, idx];
      setFoundIndices(nextFound);
      setMsg(`Found ${nextFound.length} of ${targetCount}!`);

      if (nextFound.length === targetCount) {
        const accuracy = Math.min(100, Math.round((targetCount / nextAttempts) * 100));
        setTimeout(() => {
          onComplete({
            score: Math.max(70, accuracy),
            accuracy,
            attempts: nextAttempts,
            hintsUsed,
            repeatedErrors: errors,
          });
        }, 450);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setMsg(`Keep scanning gently for ${targetEmoji}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{targetEmoji}</span>
          <div>
            <p className="text-xs text-[var(--nb-text-muted)]">Target to Find</p>
            <p className="font-display text-base font-bold text-[var(--nb-text)]">
              Found {foundIndices.length} of {targetCount}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--nb-text-muted)]">{msg}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {cells.map((emoji, idx) => {
          const isFound = foundIndices.includes(idx);
          const isHinted = hintIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => tapCell(idx)}
              disabled={isFound}
              aria-label={`Grid tile ${idx + 1}: ${emoji}`}
              className={`flex h-20 items-center justify-center rounded-2xl border-2 text-3xl transition-colors ${
                isFound
                  ? 'border-[#047857] bg-[#D1FAE5]'
                  : isHinted
                  ? 'border-[var(--nb-primary)] bg-[#EDE9FE]'
                  : 'border-[var(--nb-border)] bg-[var(--nb-surface)] hover:border-[var(--nb-primary)]'
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
};
