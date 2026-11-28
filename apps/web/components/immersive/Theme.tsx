import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion, useIris } from './Iris';

/**
 * Night and daylight themes. In daylight the iris background turns into an eye in
 * a bright room: the ground becomes the white of the eye and the pupil constricts,
 * the way a real pupil does. The preference is remembered per browser; "system"
 * follows the operating system.
 */
export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const KEY = 'airton-theme';
const QUERY = '(prefers-color-scheme: light)';

const readPref = (): ThemePref => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
};
const savePref = (p: ThemePref) => {
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
};
const systemTheme = (): Theme => (typeof window !== 'undefined' && window.matchMedia(QUERY).matches ? 'light' : 'dark');

function applyDom(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#eef1f7' : '#03060c');
}

interface Origin {
  x: number;
  y: number;
}
interface ThemeApi {
  pref: ThemePref;
  theme: Theme;
  setPref: (pref: ThemePref, origin?: Origin) => void;
}
const ThemeContext = createContext<ThemeApi>({ pref: 'system', theme: 'dark', setPref: () => undefined });
export const useTheme = () => useContext(ThemeContext);

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const iris = useIris();
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme: Theme = pref === 'system' ? system : pref;
  const viaTransition = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const on = () => setSystem(mql.matches ? 'light' : 'dark');
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (viaTransition.current) {
      viaTransition.current = false;
      return undefined;
    }
    const root = document.documentElement;
    const animate = !first.current && !prefersReducedMotion();
    if (animate) root.classList.add('theming');
    applyDom(theme);
    iris.setTheme(theme === 'light' ? 1 : 0, first.current);
    first.current = false;
    if (!animate) return undefined;
    const t = window.setTimeout(() => root.classList.remove('theming'), 700);
    return () => window.clearTimeout(t);
  }, [theme, iris]);

  const setPref = useCallback(
    (next: ThemePref, origin?: Origin) => {
      savePref(next);
      const nextTheme: Theme = next === 'system' ? systemTheme() : next;
      const doc = document as ViewTransitionDoc;
      if (nextTheme === theme || !origin || !doc.startViewTransition || prefersReducedMotion()) {
        setPrefState(next);
        return;
      }
      viaTransition.current = true;
      const vt = doc.startViewTransition(() => {
        flushSync(() => setPrefState(next));
        applyDom(nextTheme);
        iris.setTheme(nextTheme === 'light' ? 1 : 0, true);
      });
      const r = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
      vt.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
            { duration: 950, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
          );
        })
        .catch(() => undefined);
      vt.finished.then(() => iris.pulse(0.7)).catch(() => undefined);
    },
    [theme, iris],
  );

  const api = useMemo(() => ({ pref, theme, setPref }), [pref, theme, setPref]);
  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
};

/** The theme switch: an eye whose pupil constricts in daylight and dilates at night. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setPref } = useTheme();
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next === 'light' ? 'daylight' : 'night'} theme`;
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      aria-label={label}
      title={label}
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const fromPointer = e.clientX !== 0 || e.clientY !== 0;
        setPref(next, fromPointer ? { x: e.clientX, y: e.clientY } : { x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g className="tt-rays">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={16 + Math.cos(a) * 13} y1={16 + Math.sin(a) * 13} x2={16 + Math.cos(a) * 15.5} y2={16 + Math.sin(a) * 15.5} />;
          })}
        </g>
        <circle className="tt-iris" cx="16" cy="16" r="10" />
        <circle className="tt-ring" cx="16" cy="16" r="6.2" />
        <circle className="tt-pupil" cx="16" cy="16" r="4.6" />
        <circle className="tt-glint" cx="13.6" cy="13.6" r="1.3" />
      </svg>
    </button>
  );
};

/** Three-way appearance choice for the settings page. */
export const AppearancePicker: React.FC = () => {
  const { pref, setPref } = useTheme();
  const options: { v: ThemePref; label: string; hint: string }[] = [
    { v: 'system', label: 'System', hint: 'Follow this device' },
    { v: 'light', label: 'Daylight', hint: 'Light, pupil constricted' },
    { v: 'dark', label: 'Night', hint: 'Dark, pupil dilated' },
  ];
  return (
    <fieldset className="appearance">
      <legend className="sr-only">Appearance</legend>
      {options.map((o) => (
        <label key={o.v} htmlFor={`appearance-${o.v}`}>
          <input type="radio" id={`appearance-${o.v}`} name="appearance" checked={pref === o.v} onChange={() => setPref(o.v)} />
          <span className={`swatch s-${o.v}`} aria-hidden="true" />
          <b>{o.label}</b>
          <small>{o.hint}</small>
        </label>
      ))}
    </fieldset>
  );
};
