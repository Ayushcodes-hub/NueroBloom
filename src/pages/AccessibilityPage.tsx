import React from 'react';
import { Check, RotateCcw, Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { playSuccessChime, speakText } from '../services/sound';

export const AccessibilityPage: React.FC = () => {
  const { prefs, saving, updatePrefs, resetPrefs } = useAccessibility();
  const { activeChild } = useAuth();

  const toggleItems: Array<{
    key:
      | 'dyslexic_font'
      | 'high_contrast'
      | 'reduced_motion'
      | 'text_to_speech'
      | 'sound_enabled'
      | 'simplified_instructions'
      | 'keyboard_navigation'
      | 'alternative_tap';
    number: string;
    title: string;
    description: string;
  }> = [
    {
      key: 'dyslexic_font',
      number: '01',
      title: 'OpenDyslexic Font',
      description: 'Applies OpenDyslexic weighted letterforms with extra word spacing across every screen.',
    },
    {
      key: 'high_contrast',
      number: '02',
      title: 'High-Contrast Mode',
      description: 'Switches canvas surfaces and borders to crisp pure white and deep black for maximum legibility.',
    },
    {
      key: 'reduced_motion',
      number: '03',
      title: 'Reduced Motion',
      description: 'Disables non-essential animations, card motion, and transitions for sensory comfort.',
    },
    {
      key: 'text_to_speech',
      number: '04',
      title: 'Automatic Text-to-Speech',
      description: 'Reads game instructions and prompts aloud automatically using the browser Web Speech API.',
    },
    {
      key: 'sound_enabled',
      number: '05',
      title: 'Gentle Sound Effects',
      description: 'Plays soft musical chimes for positive feedback; never uses harsh or startling alert sounds.',
    },
    {
      key: 'simplified_instructions',
      number: '06',
      title: 'Simplified Instructions',
      description: 'Shows short, one-step instructions inside all 11 cognitive mini-games.',
    },
    {
      key: 'keyboard_navigation',
      number: '07',
      title: 'Enhanced Keyboard Focus',
      description: 'Displays bold high-visibility focus outlines and enables arrow/number shortcuts in games.',
    },
    {
      key: 'alternative_tap',
      number: '08',
      title: 'Alternative Tap-Based Controls',
      description: 'Replaces drag-and-drop and fine-motor gestures with comfortable large tap-to-select buttons.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[var(--nb-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--nb-primary)]">
            WCAG 2.2 AA Oriented · {activeChild ? `Synced for ${activeChild.display_name}` : 'Saved Locally'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-[var(--nb-text)]">
            Accessibility Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--nb-text-muted)]">
            Customize typography, sensory motion, audio guidance, and motor interaction preferences. Changes take effect immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => speakText('Accessibility voice guidance is active and clear.', true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
          >
            <Volume2 className="h-4 w-4 text-[var(--nb-primary)]" />
            <span>Test Voice</span>
          </button>
          <button
            type="button"
            onClick={() => playSuccessChime(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
          >
            <span>Test Chime</span>
          </button>
          <button
            type="button"
            onClick={resetPrefs}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {saving && (
        <p className="mt-3 text-xs font-medium text-[#047857]">Saving preferences to profile...</p>
      )}

      {/* 8 Boolean Toggles */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {toggleItems.map((item) => {
          const active = prefs[item.key];
          return (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-5"
            >
              <div>
                <p className="text-xs font-semibold text-[var(--nb-text-muted)]">{item.number}</p>
                <h2 className="mt-0.5 font-display text-base font-bold text-[var(--nb-text)]">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--nb-text-muted)]">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label={item.title}
                onClick={() => updatePrefs({ [item.key]: !active })}
                className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors min-h-[40px] ${
                  active
                    ? 'border-[var(--nb-primary)] bg-[var(--nb-primary)] text-white'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                <span>{active ? 'On' : 'Off'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 09 & 10: Text Size & Interaction Timing */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
          <p className="text-xs font-semibold text-[var(--nb-text-muted)]">09</p>
          <h2 className="mt-0.5 font-display text-base font-bold text-[var(--nb-text)]">
            Text Size Scale
          </h2>
          <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
            Increase global text size for comfortable reading across dashboards and games.
          </p>
          <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Text size">
            {(['normal', 'large', 'xlarge'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                role="radio"
                aria-checked={prefs.text_size === sz}
                onClick={() => updatePrefs({ text_size: sz })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold capitalize min-h-[42px] ${
                  prefs.text_size === sz
                    ? 'border-[var(--nb-primary)] bg-[var(--nb-primary-soft)] text-[#3719CA]'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                {sz === 'xlarge' ? 'Extra Large' : sz}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
          <p className="text-xs font-semibold text-[var(--nb-text-muted)]">10</p>
          <h2 className="mt-0.5 font-display text-base font-bold text-[var(--nb-text)]">
            Adjustable Interaction Timing
          </h2>
          <p className="mt-1 text-xs text-[var(--nb-text-muted)]">
            Controls sequence playback speed in Pattern Sequence, Audio Memory, and Sky Glider pacing.
          </p>
          <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Interaction timing">
            {(['relaxed', 'standard', 'brisk'] as const).map((timing) => (
              <button
                key={timing}
                type="button"
                role="radio"
                aria-checked={prefs.interaction_timing === timing}
                onClick={() => updatePrefs({ interaction_timing: timing })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold capitalize min-h-[42px] ${
                  prefs.interaction_timing === timing
                    ? 'border-[var(--nb-primary)] bg-[var(--nb-primary-soft)] text-[#3719CA]'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                {timing}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
