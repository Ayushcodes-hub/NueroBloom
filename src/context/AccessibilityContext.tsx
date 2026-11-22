import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_ACCESSIBILITY, type AccessibilityPreferences } from '../../shared/types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const LOCAL_A11Y_KEY = 'neurobloom_accessibility_prefs';

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences;
  saving: boolean;
  updatePrefs: (patch: Partial<AccessibilityPreferences>) => Promise<void>;
  resetPrefs: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function applyDomAttributes(prefs: AccessibilityPreferences) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.setAttribute('data-dyslexic-font', String(prefs.dyslexic_font));
  html.setAttribute('data-high-contrast', String(prefs.high_contrast));
  html.setAttribute('data-reduced-motion', String(prefs.reduced_motion));
  html.setAttribute('data-text-size', prefs.text_size);
  html.setAttribute('data-keyboard-focus', String(prefs.keyboard_navigation));
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeChild, user } = useAuth();
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_A11Y_KEY);
      return saved ? { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(saved) } : { ...DEFAULT_ACCESSIBILITY };
    } catch {
      return { ...DEFAULT_ACCESSIBILITY };
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyDomAttributes(prefs);
    localStorage.setItem(LOCAL_A11Y_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!user || !activeChild) return;
    let cancelled = false;
    api
      .getAccessibility(activeChild.id)
      .then((res) => {
        if (!cancelled && res.settings) {
          setPrefs(res.settings);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, activeChild?.id]);

  const updatePrefs = useCallback(
    async (patch: Partial<AccessibilityPreferences>) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      localStorage.setItem(LOCAL_A11Y_KEY, JSON.stringify(next));
      if (user && activeChild) {
        setSaving(true);
        try {
          const res = await api.updateAccessibility(activeChild.id, next);
          setPrefs(res.settings);
        } catch {
          // Local persistence still retained
        } finally {
          setSaving(false);
        }
      }
    },
    [prefs, user, activeChild]
  );

  const resetPrefs = useCallback(async () => {
    await updatePrefs(DEFAULT_ACCESSIBILITY);
  }, [updatePrefs]);

  return (
    <AccessibilityContext.Provider value={{ prefs, saving, updatePrefs, resetPrefs }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
