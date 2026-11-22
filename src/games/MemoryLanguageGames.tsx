import React, { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { playGentleNudge, playSuccessChime, playTone, speakText } from '../services/sound';
import type { MiniGameProps } from './GameShell';

// ============================================================================
// GAME 1: MEMORY MATCH
// ============================================================================
const MEMORY_SYMBOLS = [
  { id: 'leaf', label: 'Mint Leaf', symbol: '🌿', bg: '#D1FAE5' },
  { id: 'sun', label: 'Warm Sun', symbol: '☀️', bg: '#FEF3C7' },
  { id: 'flower', label: 'Bloom', symbol: '🌸', bg: '#FCE7F3' },
  { id: 'star', label: 'Star', symbol: '⭐', bg: '#EDE9FE' },
  { id: 'owl', label: 'Owl', symbol: '🦉', bg: '#E0E7FF' },
  { id: 'cloud', label: 'Cloud', symbol: '☁️', bg: '#E0F2FE' },
  { id: 'turtle', label: 'Turtle', symbol: '🐢', bg: '#CCFBF1' },
  { id: 'apple', label: 'Apple', symbol: '🍎', bg: '#FEE2E2' },
];

export const MemoryMatchGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const pairCount = Math.min(8, Math.max(3, difficulty + 2));

  const initialCards = useMemo(() => {
    const selected = MEMORY_SYMBOLS.slice(0, pairCount);
    const deck = [...selected, ...selected].map((item, idx) => ({
      uid: `${item.id}-${idx}`,
      ...item,
    }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, [pairCount]);

  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Tap any two cards to discover a matching pair.');
  const [peekIndex, setPeekIndex] = useState<number | null>(null);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      const unmatched = initialCards
        .map((c, idx) => ({ c, idx }))
        .filter((x) => !matchedIds.includes(x.c.id));
      if (unmatched.length > 0) {
        const pick = unmatched[0];
        setPeekIndex(pick.idx);
        setTimeout(() => setPeekIndex(null), 1500);
        return `Peek hint: Card #${pick.idx + 1} is ${pick.c.label}!`;
      }
      return 'You have matched all pairs!';
    });
  }, [initialCards, matchedIds, registerHintHandler]);

  const handleFlip = (index: number) => {
    if (flippedIndices.length >= 2) return;
    if (flippedIndices.includes(index)) return;
    if (matchedIds.includes(initialCards[index].id)) return;

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = initialCards[firstIdx];
      const secondCard = initialCards[secondIdx];
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (firstCard.id === secondCard.id) {
        playSuccessChime(prefs.sound_enabled);
        const nextMatched = [...matchedIds, firstCard.id];
        setMatchedIds(nextMatched);
        setFlippedIndices([]);
        setFeedback(`Nice match! You found the ${firstCard.label} pair.`);

        if (nextMatched.length === pairCount) {
          const accuracy = Math.min(100, Math.round((pairCount / nextAttempts) * 100));
          setTimeout(() => {
            onComplete({
              score: Math.max(60, accuracy),
              accuracy,
              attempts: nextAttempts,
              hintsUsed,
              repeatedErrors: mismatches,
            });
          }, 500);
        }
      } else {
        playGentleNudge(prefs.sound_enabled);
        setMismatches((m) => m + 1);
        setFeedback('Not quite a match yet—take a calm look and try another pair.');
        const delay = prefs.interaction_timing === 'relaxed' ? 1400 : 900;
        setTimeout(() => setFlippedIndices([]), delay);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <p className="text-sm font-medium text-[var(--nb-text)]">{feedback}</p>
        <p className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
          Pairs: {matchedIds.length}/{pairCount} · Attempts: {attempts}
        </p>
      </div>

      <div className={`grid gap-3 ${pairCount <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'}`}>
        {initialCards.map((card, idx) => {
          const isRevealed = flippedIndices.includes(idx) || matchedIds.includes(card.id) || peekIndex === idx;
          const isMatched = matchedIds.includes(card.id);
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleFlip(idx)}
              disabled={isMatched}
              aria-label={isRevealed ? `${card.label} card` : `Hidden card ${idx + 1}`}
              style={{ backgroundColor: isRevealed ? card.bg : undefined }}
              className={`flex h-24 sm:h-28 flex-col items-center justify-center rounded-2xl border-2 text-center transition-transform ${
                isMatched
                  ? 'border-[#047857] opacity-85'
                  : isRevealed
                  ? 'border-[var(--nb-primary)]'
                  : 'border-[var(--nb-border)] bg-[var(--nb-bg)] hover:border-[var(--nb-primary)]'
              }`}
            >
              {isRevealed ? (
                <>
                  <span className="text-3xl" aria-hidden="true">{card.symbol}</span>
                  <span className="mt-1 text-xs font-semibold text-[#25243A]">{card.label}</span>
                </>
              ) : (
                <span className="font-display text-lg font-bold text-[var(--nb-text-muted)]">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 7: WORD & IMAGE MATCHING
// ============================================================================
const WORD_ITEMS = [
  { word: 'Apple', emoji: '🍎', hint: 'A crunchy red fruit.' },
  { word: 'Sun', emoji: '☀️', hint: 'Shines warmly in the daytime sky.' },
  { word: 'Tree', emoji: '🌳', hint: 'Has a wooden trunk and green leaves.' },
  { word: 'Boat', emoji: '⛵', hint: 'Sails gently across the water.' },
  { word: 'Book', emoji: '📖', hint: 'You open pages to read a story.' },
  { word: 'Moon', emoji: '🌙', hint: 'Glows softly in the night sky.' },
  { word: 'Bird', emoji: '🐦', hint: 'Has wings and sings cheerful songs.' },
  { word: 'House', emoji: '🏡', hint: 'A cozy place where families live.' },
];

export const WordImageMatchingGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const totalRounds = Math.min(7, difficulty + 3);
  const optionCount = difficulty >= 3 ? 4 : 3;

  const rounds = useMemo(() => {
    const shuffled = [...WORD_ITEMS].sort(() => Math.random() - 0.5).slice(0, totalRounds);
    return shuffled.map((target) => {
      const distractors = WORD_ITEMS.filter((w) => w.word !== target.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, optionCount - 1);
      const options = [target, ...distractors].sort(() => Math.random() - 0.5);
      return { target, options };
    });
  }, [totalRounds, optionCount]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Select the picture that matches the word.');

  const current = rounds[roundIdx];

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      return `Hint for "${current.target.word}": ${current.target.hint}`;
    });
  }, [current, registerHintHandler]);

  const handleSelect = (chosenWord: string) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (chosenWord === current.target.word) {
      playSuccessChime(prefs.sound_enabled);
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);
      setStatusMsg(`Great job! That picture is ${current.target.word}.`);

      if (roundIdx + 1 >= rounds.length) {
        const accuracy = Math.min(100, Math.round((rounds.length / nextAttempts) * 100));
        setTimeout(() => {
          onComplete({
            score: Math.max(65, accuracy),
            accuracy,
            attempts: nextAttempts,
            hintsUsed,
            repeatedErrors: errors,
          });
        }, 450);
      } else {
        setTimeout(() => {
          setRoundIdx((r) => r + 1);
          setStatusMsg('Select the picture that matches the next word.');
        }, 450);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setStatusMsg(`That was ${chosenWord}. Look for ${current.target.word} — you can hear it too!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
          Word {roundIdx + 1} of {rounds.length}
        </span>
        <button
          type="button"
          onClick={() => speakText(current.target.word, true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] min-h-[40px]"
        >
          <Volume2 className="h-4 w-4 text-[var(--nb-primary)]" />
          <span>Hear Word</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6 text-center">
        <p className="text-xs font-medium text-[var(--nb-text-muted)]">Find the matching picture for:</p>
        <p className="mt-2 font-display text-4xl font-extrabold text-[var(--nb-text)]">
          {current.target.word}
        </p>
      </div>

      <p className="text-center text-sm font-medium text-[var(--nb-text-muted)]">{statusMsg}</p>

      <div className={`grid gap-4 ${optionCount === 4 ? 'sm:grid-cols-4 grid-cols-2' : 'sm:grid-cols-3'}`}>
        {current.options.map((opt) => (
          <button
            key={opt.word}
            type="button"
            onClick={() => handleSelect(opt.word)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 hover:border-[var(--nb-primary)] min-h-[130px]"
          >
            <span className="text-5xl" aria-hidden="true">{opt.emoji}</span>
            <span className="sr-only">{opt.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 8: AUDIO MEMORY
// ============================================================================
const CHIMES = [
  { id: 'do', label: 'Bell 1 (Do)', freq: 392.0, color: '#EDE9FE', border: '#6D4AFF', symbol: '●' },
  { id: 're', label: 'Bell 2 (Re)', freq: 440.0, color: '#D1FAE5', border: '#047857', symbol: '▲' },
  { id: 'mi', label: 'Bell 3 (Mi)', freq: 493.88, color: '#FEF3C7', border: '#B45309', symbol: '★' },
  { id: 'sol', label: 'Bell 4 (Sol)', freq: 587.33, color: '#E0F2FE', border: '#0369A1', symbol: '◆' },
];

export const AudioMemoryGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const totalRounds = 3;
  const baseLength = Math.min(5, difficulty + 1);

  const [roundIdx, setRoundIdx] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [playingDemo, setPlayingDemo] = useState(false);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [message, setMessage] = useState('Listen to the chimes and watch the bells glow.');

  const playSequence = (seq: number[]) => {
    setPlayingDemo(true);
    setMessage('Listening phase: watch and hear each bell...');
    const stepMs = prefs.interaction_timing === 'relaxed' ? 750 : 550;
    seq.forEach((padIdx, idx) => {
      setTimeout(() => {
        setActivePad(padIdx);
        playTone(CHIMES[padIdx].freq, 320, true, 0.14);
        setTimeout(() => setActivePad(null), stepMs - 140);
      }, idx * stepMs + 250);
    });
    setTimeout(() => {
      setPlayingDemo(false);
      setMessage('Your turn! Tap the bells in the same order.');
    }, seq.length * stepMs + 350);
  };

  useEffect(() => {
    const len = baseLength + roundIdx;
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * CHIMES.length));
    setSequence(seq);
    setUserInput([]);
    playSequence(seq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, baseLength]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      playSequence(sequence);
      return 'Replaying the chime sequence slowly for you.';
    });
  }, [sequence, registerHintHandler]);

  const handleTapPad = (padIdx: number) => {
    if (playingDemo) return;
    playTone(CHIMES[padIdx].freq, 260, true, 0.14);
    setActivePad(padIdx);
    setTimeout(() => setActivePad(null), 200);

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const expected = sequence[userInput.length];
    if (padIdx === expected) {
      const nextInput = [...userInput, padIdx];
      setUserInput(nextInput);

      if (nextInput.length === sequence.length) {
        playSuccessChime(prefs.sound_enabled);
        if (roundIdx + 1 >= totalRounds) {
          const totalNotes = (baseLength * 3) + 3;
          const accuracy = Math.min(100, Math.round((totalNotes / Math.max(totalNotes, nextAttempts)) * 100));
          setTimeout(() => {
            onComplete({
              score: Math.max(65, accuracy),
              accuracy,
              attempts: nextAttempts,
              hintsUsed,
              repeatedErrors: errors,
            });
          }, 500);
        } else {
          setMessage('Lovely melody! Moving to the next pattern...');
          setTimeout(() => setRoundIdx((r) => r + 1), 650);
        }
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setUserInput([]);
      setMessage('Let us hear that pattern again gently.');
      setTimeout(() => playSequence(sequence), 600);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--nb-text)]">{message}</p>
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs font-semibold text-[var(--nb-text-muted)]">
            Round {roundIdx + 1}/{totalRounds} · Progress {userInput.length}/{sequence.length}
          </span>
          <button
            type="button"
            disabled={playingDemo}
            onClick={() => playSequence(sequence)}
            className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--nb-text)] disabled:opacity-50 min-h-[36px]"
          >
            Replay Chimes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CHIMES.map((chime, idx) => {
          const isActive = activePad === idx;
          return (
            <button
              key={chime.id}
              type="button"
              disabled={playingDemo}
              onClick={() => handleTapPad(idx)}
              style={{
                backgroundColor: chime.color,
                borderColor: isActive ? '#25243A' : chime.border,
              }}
              className={`flex h-32 flex-col items-center justify-center rounded-2xl border-3 transition-transform ${
                isActive ? 'scale-105 shadow-md' : 'hover:opacity-95'
              }`}
            >
              <span className="text-3xl font-bold text-[#25243A]" aria-hidden="true">
                {chime.symbol}
              </span>
              <span className="mt-2 text-xs font-bold text-[#25243A]">{chime.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// GAME 11: EMOTION & EXPRESSION MATCHING
// ============================================================================
interface EmotionItem {
  word: string;
  context: string;
  bg: string;
  mouthPath: string;
  brows: 'normal' | 'raised' | 'angled' | 'soft';
}

const EMOTIONS: EmotionItem[] = [
  {
    word: 'Happy',
    context: 'Smiling warmly after finishing a favorite puzzle.',
    bg: '#FEF3C7',
    mouthPath: 'M 32 58 Q 50 74 68 58',
    brows: 'normal',
  },
  {
    word: 'Calm',
    context: 'Taking slow breaths in a peaceful garden.',
    bg: '#D1FAE5',
    mouthPath: 'M 36 60 Q 50 65 64 60',
    brows: 'soft',
  },
  {
    word: 'Surprised',
    context: 'Discovering an unexpected rainbow outside.',
    bg: '#EDE9FE',
    mouthPath: 'M 43 60 A 7 8 0 1 0 57 60 A 7 8 0 1 0 43 60',
    brows: 'raised',
  },
  {
    word: 'Sad',
    context: 'Feeling down when a rainy day cancels outdoor play.',
    bg: '#E0F2FE',
    mouthPath: 'M 34 66 Q 50 54 66 66',
    brows: 'angled',
  },
  {
    word: 'Curious',
    context: 'Wondering how a butterfly lands on a leaf.',
    bg: '#FCE7F3',
    mouthPath: 'M 38 61 Q 52 63 62 58',
    brows: 'raised',
  },
];

export const EmotionMatchingGame: React.FC<MiniGameProps> = ({
  difficulty,
  registerHintHandler,
  onComplete,
}) => {
  const { prefs } = useAccessibility();
  const rounds = useMemo(
    () => [...EMOTIONS].sort(() => Math.random() - 0.5).slice(0, Math.min(5, difficulty + 2)),
    [difficulty]
  );

  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState('Look at the face and choose the word that matches how they feel.');

  const current = rounds[idx];
  const choices = useMemo(() => {
    const others = EMOTIONS.filter((e) => e.word !== current.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [current, ...others].sort(() => Math.random() - 0.5);
  }, [current]);

  useEffect(() => {
    registerHintHandler(() => {
      setHintsUsed((h) => h + 1);
      return `Clue: ${current.context}`;
    });
  }, [current, registerHintHandler]);

  const chooseEmotion = (word: string) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (word === current.word) {
      playSuccessChime(prefs.sound_enabled);
      setFeedback(`Yes, that expression shows "${current.word}". ${current.context}`);
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
        }, 550);
      } else {
        setTimeout(() => {
          setIdx((i) => i + 1);
          setFeedback('Look at the next expression and choose the feeling word.');
        }, 700);
      }
    } else {
      playGentleNudge(prefs.sound_enabled);
      setErrors((e) => e + 1);
      setFeedback(`Every feeling is okay! Look at the mouth and eyebrows—clue: ${current.context}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--nb-text-muted)]">
        <span>Expression {idx + 1} of {rounds.length}</span>
        <span>Supportive Practice</span>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
        <div
          style={{ backgroundColor: current.bg }}
          className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-[#25243A]/20"
        >
          <svg viewBox="0 0 100 100" className="h-28 w-28" aria-label="Illustrated facial expression">
            <circle cx="50" cy="50" r="42" fill="#FDE68A" stroke="#25243A" strokeWidth="3" />
            {/* Eyebrows */}
            {current.brows === 'raised' && (
              <>
                <path d="M 28 32 Q 35 26 42 32" stroke="#25243A" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 58 32 Q 65 26 72 32" stroke="#25243A" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            )}
            {current.brows === 'angled' && (
              <>
                <path d="M 28 36 L 42 32" stroke="#25243A" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 58 32 L 72 36" stroke="#25243A" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            )}
            {(current.brows === 'normal' || current.brows === 'soft') && (
              <>
                <path d="M 29 34 Q 35 31 41 34" stroke="#25243A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 59 34 Q 65 31 71 34" stroke="#25243A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}
            {/* Eyes */}
            <circle cx="35" cy="44" r="4" fill="#25243A" />
            <circle cx="65" cy="44" r="4" fill="#25243A" />
            {/* Mouth */}
            <path d={current.mouthPath} stroke="#25243A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-[var(--nb-text)]">{feedback}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {choices.map((c) => (
          <button
            key={c.word}
            type="button"
            onClick={() => chooseEmotion(c.word)}
            className="rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-surface)] px-5 py-4 font-display text-base font-bold text-[var(--nb-text)] hover:border-[var(--nb-primary)] min-h-[56px]"
          >
            {c.word}
          </button>
        ))}
      </div>
    </div>
  );
};
