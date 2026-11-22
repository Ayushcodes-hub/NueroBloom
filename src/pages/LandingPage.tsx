import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
  HeartHandshake,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { GAMES_CATALOG, type GameCategory } from '../../shared/types';
import { useAccessibility } from '../context/AccessibilityContext';
import { speakText } from '../services/sound';

interface LandingPageProps {
  navigate: (to: string) => void;
}

const CATEGORIES: Array<'All' | GameCategory> = [
  'All',
  'Memory',
  'Attention',
  'Pattern Recognition',
  'Motor Coordination',
  'Language',
  'Problem Solving',
];

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { prefs, updatePrefs } = useAccessibility();
  const [selectedCategory, setSelectedCategory] = useState<'All' | GameCategory>('All');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const visibleGames =
    selectedCategory === 'All'
      ? GAMES_CATALOG.slice(0, 6)
      : GAMES_CATALOG.filter((g) => g.category === selectedCategory);

  return (
    <div className="bg-[var(--nb-bg)] text-[var(--nb-text)]">
      {/* 1. HERO SECTION */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-sm font-semibold text-[var(--nb-primary)]">
              NeuroBloom · Grow at Your Own Pace
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[var(--nb-text)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] [text-wrap:balance]">
              Every Mind Grows Differently.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--nb-text-muted)] sm:text-lg">
              An inclusive, adaptive digital classroom where children with autism, ADHD, dyslexia, speech, or motor differences practice cognitive skills through calm, supportive play.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--nb-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 transition-opacity min-h-[44px]"
              >
                <span>Start Exploring</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-5 py-3.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] transition-colors min-h-[44px]"
              >
                <span>Explore How It Works</span>
              </a>
            </div>
            <p className="mt-6 text-xs text-[var(--nb-text-muted)]">
              Educational and therapy-support prototype by RNS Institute of Technology, Bengaluru · Non-diagnostic
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[300px] overflow-hidden rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] shadow-sm">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/hero_learning_garden_1795193964604.jpg"
                  alt="Warm inclusive digital classroom and botanical puzzle learning environment"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center bg-gradient-to-br from-[#EDE9FE] via-[#FAFAF7] to-[#D1FAE5] p-8 text-center">
                  <Sparkles className="h-12 w-12 text-[#6D4AFF]" />
                  <p className="mt-4 font-display text-lg font-bold text-[#25243A]">
                    Inclusive Play Studio
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-[#5A5870]">
                    11 gentle cognitive activities tailored to every learner’s comfort and pace.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR CORE CAPABILITY CARDS */}
      <section className="border-y border-[var(--nb-border)] bg-[var(--nb-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Learning adapts to the child, never the other way around.
            </h2>
            <p className="mt-3 text-base text-[var(--nb-text-muted)]">
              Built around sensory comfort, zero-punishment feedback, and transparent progress shared between home and educators.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6D4AFF]">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Personalized Learning</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                Rule-based adaptive difficulty gently steps up after consistent mastery or eases down when extra support helps.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Play-Based Practice</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                11 calm mini-games across memory, attention, patterns, language, motor rhythm, and problem solving.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#92400E]">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Accessible Learning</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                OpenDyslexic typography, high-contrast palettes, reduced motion, tap-to-sort alternatives, and Web Speech read-aloud.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E7FF] text-[#3730A3]">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Parent & Educator Insights</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                Shared practice trends, supportive caregiver notes, and special educator game recommendations in one connected view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW NEUROBLOOM WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            How NeuroBloom Works
          </h2>
          <p className="mt-3 text-base text-[var(--nb-text-muted)]">
            A calm, predictable cycle designed to build confidence step by step.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01. Understand',
              desc: 'Choose sensory preferences, font readability, audio guidance, and favorite play categories.',
            },
            {
              step: '02. Play',
              desc: 'Explore 11 unhurried cognitive games with gentle hints, zero harsh failure screens, and positive encouragement.',
            },
            {
              step: '03. Adapt',
              desc: 'Our transparent personalization engine tunes next difficulty levels and suggests varied skill categories.',
            },
            {
              step: '04. Grow',
              desc: 'Parents and special educators review longitudinal gameplay trends and share encouraging notes.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6"
            >
              <h3 className="font-display text-lg font-bold text-[var(--nb-primary)]">{item.step}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--nb-text-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PREVIEW OF COGNITIVE GAMES */}
      <section id="games-preview" className="border-y border-[var(--nb-border)] bg-[var(--nb-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                11 Cognitive Mini-Games Built for Comfort
              </h2>
              <p className="mt-2 text-base text-[var(--nb-text-muted)]">
                Every game supports keyboard navigation, optional audio instructions, and adjustable pacing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="self-start rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0 min-h-[42px]"
            >
              Open Full Game Studio
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter preview games by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                  selectedCategory === cat
                    ? 'bg-[var(--nb-text)] text-white'
                    : 'border border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text-muted)] hover:text-[var(--nb-text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGames.map((game) => (
              <div
                key={game.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--nb-text-muted)]">
                    <span className="font-semibold text-[var(--nb-text)]">{game.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>~{game.estimatedMinutes} min</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-[var(--nb-text)]">
                    {game.number}. {game.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                    {game.shortDescription}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--nb-border)] pt-4">
                  <span className="text-xs text-[var(--nb-text-muted)]">
                    {game.skillsTargeted.slice(0, 2).join(' · ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="text-sm font-semibold text-[var(--nb-primary)] hover:underline whitespace-nowrap shrink-0"
                  >
                    Try in Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE ACCESSIBILITY SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-8 lg:grid-cols-12 lg:p-10">
          <div className="lg:col-span-6">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Accessibility Built Into Every Screen
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--nb-text-muted)]">
              Try our live accessibility controls right here. Preferences apply across the entire platform and persist to the child’s profile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updatePrefs({ dyslexic_font: !prefs.dyslexic_font })}
                aria-pressed={prefs.dyslexic_font}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] ${
                  prefs.dyslexic_font
                    ? 'border-[var(--nb-primary)] bg-[#EDE9FE] text-[#25243A]'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                OpenDyslexic Font: {prefs.dyslexic_font ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => updatePrefs({ high_contrast: !prefs.high_contrast })}
                aria-pressed={prefs.high_contrast}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] ${
                  prefs.high_contrast
                    ? 'border-[var(--nb-primary)] bg-[#EDE9FE] text-[#25243A]'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                High Contrast: {prefs.high_contrast ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => updatePrefs({ reduced_motion: !prefs.reduced_motion })}
                aria-pressed={prefs.reduced_motion}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] ${
                  prefs.reduced_motion
                    ? 'border-[var(--nb-primary)] bg-[#EDE9FE] text-[#25243A]'
                    : 'border-[var(--nb-border)] bg-[var(--nb-bg)] text-[var(--nb-text)]'
                }`}
              >
                Reduced Motion: {prefs.reduced_motion ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() =>
                  speakText(
                    'Welcome to NeuroBloom. You can listen to instructions anytime using read aloud.',
                    true
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[42px]"
              >
                <Volume2 className="h-4 w-4 text-[var(--nb-primary)]" />
                <span>Test Read Aloud</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/accessibility')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--nb-primary)] hover:underline"
            >
              <span>Open Full Accessibility Center (10 Controls)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-6">
            <p className="text-xs font-semibold text-[var(--nb-text-muted)]">
              Live Typography & Contrast Preview
            </p>
            <p className="mt-3 font-display text-xl font-bold text-[var(--nb-text)]">
              “Take your time, Aarav. Look at the shapes and tap the pair that matches.”
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
              Dual-coded visual symbols ensure colors are never the sole cue. Keyboard arrows, Tab focus rings, and tap-to-select alternatives remove fine-motor friction.
            </p>
          </div>
        </div>
      </section>

      {/* 6. PARENT & EDUCATOR COLLABORATION + TRUSTED RESOURCES */}
      <section className="border-t border-[var(--nb-border)] bg-[var(--nb-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-8">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-[var(--nb-primary)]" />
                <h2 className="font-display text-xl font-bold">Parent & Educator Collaboration</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                Guardians view daily practice balance, category strengths, and gentle reminders. Special educators review assigned learner trends, suggest next activities, and export weekly summary reports.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[42px]"
                >
                  Try Parent Demo
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[42px]"
                >
                  Try Educator Demo
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-bg)] p-8">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#047857]" />
                <h2 className="font-display text-xl font-bold">Trusted Resources & Safety</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                Access curated external reading from CDC, NICHD, Understood.org, CHADD, and Autism Speaks alongside a dedicated Safety Center with India’s 112 emergency guidance.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/resources')}
                  className="rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[42px]"
                >
                  Browse Resource Library
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/safety')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] bg-[var(--nb-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[42px]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#047857]" />
                  <span>Safety Center</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-[var(--nb-border)] bg-[var(--nb-bg)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div className="max-w-md">
              <p className="font-display text-lg font-bold text-[var(--nb-text)]">NeuroBloom</p>
              <p className="mt-2 text-sm text-[var(--nb-text-muted)]">
                Community Engineering Project by Computer Science & Engineering students at RNS Institute of Technology, Bengaluru.
              </p>
              <p className="mt-2 text-xs text-[var(--nb-text-muted)]">
                Educational & therapy-support prototype only. NeuroBloom does not provide medical advice, clinical assessment, or neurodevelopmental diagnosis.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[var(--nb-text-muted)]">
              <button type="button" onClick={() => navigate('/auth')} className="hover:text-[var(--nb-text)]">
                Sign In
              </button>
              <button type="button" onClick={() => navigate('/accessibility')} className="hover:text-[var(--nb-text)]">
                Accessibility
              </button>
              <button type="button" onClick={() => navigate('/resources')} className="hover:text-[var(--nb-text)]">
                Trusted Resources
              </button>
              <button type="button" onClick={() => navigate('/safety')} className="hover:text-[var(--nb-text)]">
                Safety Center
              </button>
              <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-[var(--nb-text)]">
                API Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
