import React, { useState } from 'react';
import { Phone, ShieldAlert, Heart, CheckCircle2 } from 'lucide-react';

export const SafetyPage: React.FC = () => {
  const [guardianPhone, setGuardianPhone] = useState(
    () => localStorage.getItem('neurobloom_guardian_phone') || '+91 98450 00112'
  );
  const [guardianName, setGuardianName] = useState(
    () => localStorage.getItem('neurobloom_guardian_name') || 'Meera Sharma (Mother)'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('neurobloom_guardian_phone', guardianPhone);
    localStorage.setItem('neurobloom_guardian_name', guardianName);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--nb-border)] pb-6">
        <p className="text-xs font-semibold text-[#92400E]">Safety & Caregiver Support</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-[var(--nb-text)]">
          Emergency & Safety Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--nb-text-muted)]">
          Quick reference for guardian contacts, India’s 112 emergency helpline, and calm sensory overload steps. Calling actions require your explicit tap or click.
        </p>
      </div>

      {/* Clear Emergency Disclaimer */}
      <div
        role="note"
        className="mt-6 rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/60 p-5 text-sm text-[#78350F]"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
          <div>
            <p className="font-bold">Important Emergency Disclaimer</p>
            <p className="mt-1 text-xs leading-relaxed">
              NeuroBloom is an educational cognitive play platform and cannot monitor medical emergencies or dispatch responders automatically. If a child or family member is in immediate physical danger or experiencing a medical emergency, contact local emergency services directly.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* India 112 National Emergency */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
          <div>
            <p className="text-xs font-semibold text-rose-700">India National Emergency Number</p>
            <h2 className="mt-1 font-display text-4xl font-extrabold tabular-nums text-[var(--nb-text)]">
              112
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
              Unified emergency response number across India for medical, police, and fire assistance. Calls are only initiated when you explicitly click the button below.
            </p>
          </div>
          <div className="mt-6">
            <a
              href="tel:112"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-800 transition-colors min-h-[44px]"
            >
              <Phone className="h-4 w-4" />
              <span>Call 112 (User Confirmation Required)</span>
            </a>
          </div>
        </div>

        {/* Guardian Contact Details */}
        <form
          onSubmit={saveContact}
          className="rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--nb-text)]">
              Primary Guardian Contact
            </h2>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
          <div>
            <label htmlFor="guardian-name" className="block text-xs font-semibold text-[var(--nb-text)]">
              Guardian Name & Relationship
            </label>
            <input
              id="guardian-name"
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2 text-sm min-h-[42px]"
            />
          </div>
          <div>
            <label htmlFor="guardian-phone" className="block text-xs font-semibold text-[var(--nb-text)]">
              Guardian Phone Number
            </label>
            <input
              id="guardian-phone"
              type="tel"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--nb-border)] bg-[var(--nb-bg)] px-3.5 py-2 text-sm font-mono-tabular min-h-[42px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="rounded-xl bg-[var(--nb-primary)] px-4 py-2.5 text-xs font-semibold text-white min-h-[40px]"
            >
              Update Guardian Contact
            </button>
            <a
              href={`tel:${guardianPhone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--nb-border)] px-4 py-2.5 text-xs font-semibold text-[var(--nb-text)] hover:bg-[var(--nb-surface-subtle)] min-h-[40px]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call Guardian</span>
            </a>
          </div>
        </form>
      </div>

      {/* Sensory Calm Guidance */}
      <div className="mt-8 rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#047857]" />
          <h2 className="font-display text-lg font-bold text-[var(--nb-text)]">
            Supportive Guidance During Sensory Overload
          </h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-[var(--nb-text-muted)]">
          <div className="rounded-xl bg-[var(--nb-bg)] p-4">
            <p className="font-bold text-[var(--nb-text)]">01. Lower Sensory Input</p>
            <p className="mt-1">Dim bright room lights, mute sound effects in Accessibility Center, and pause the current game without worry.</p>
          </div>
          <div className="rounded-xl bg-[var(--nb-bg)] p-4">
            <p className="font-bold text-[var(--nb-text)]">02. Offer Choice & Space</p>
            <p className="mt-1">Speak calmly in short sentences. Offer the Calm Corner breathing guide or let the child step away from the screen.</p>
          </div>
          <div className="rounded-xl bg-[var(--nb-bg)] p-4">
            <p className="font-bold text-[var(--nb-text)]">03. Seek Help When Needed</p>
            <p className="mt-1">If distress continues or physical safety is a concern, reach out to the primary guardian or call 112 immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
