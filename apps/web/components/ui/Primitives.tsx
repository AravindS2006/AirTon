import React from 'react';
import type { DeliveryState, ReviewState } from '../../types';

/* ------------------------------------------------------------------ icons
   A small local icon set (24px grid, stroke icons). It replaces the unpinned
   CDN icon script, so the interface makes no third-party requests. */
const PATHS: Record<string, string> = {
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  dashboard: 'M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1-4 4.5-6 8-6s7 2 8 6',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  logout: 'M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5 M17 11a3 3 0 1 0-1-5.8 M22 20c-.5-2.6-2.1-4.3-4.5-4.9',
  clinic: 'M4 21V7l8-4 8 4v14z M9 21v-6h6v6 M12 7v6 M9 10h6',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 7l12-4v4 M16 13h2',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12 M18 6L6 18',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  cloud: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z',
  device: 'M7 3h10v18H7z M11 18h2',
  shield: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z M9 12l2 2 4-4',
  lock: 'M5 11h14v10H5z M8 11V8a4 4 0 0 1 8 0v3',
  database: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6 M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01',
  wind: 'M3 9h11a3 3 0 1 0-3-3 M3 15h15a3 3 0 1 1-3 3 M3 12h8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  calendar: 'M4 6h16v15H4z M4 10h16 M9 3v4 M15 3v4',
  message: 'M5 5h14v10H9l-4 4z',
  wrench: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z',
  play: 'M8 5l11 7-11 7z',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  plus: 'M12 5v14 M5 12h14',
  download: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  trash: 'M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13',
  table: 'M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14',
};

export const Icon: React.FC<{ name: keyof typeof PATHS | string; size?: number; className?: string; title?: string }> = ({
  name,
  size = 20,
  className = '',
  title,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon ${className}`}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
  >
    {title && <title>{title}</title>}
    <path d={PATHS[name] ?? PATHS.eye} />
  </svg>
);

/* ------------------------------------------------------------------ brand */
export const LogoMark: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
    <circle cx="17" cy="17" r="15" fill="none" strokeWidth="2" style={{ stroke: 'var(--cobalt)' }} />
    <circle cx="17" cy="17" r="8.5" fill="none" strokeWidth="3" style={{ stroke: 'var(--ember)' }} />
    <circle cx="17" cy="17" r="3.4" style={{ fill: 'var(--fluor)' }} />
  </svg>
);

export const Logo: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <span className="logo">
    <LogoMark size={size} />
    <span>AirTon</span>
  </span>
);

/* ------------------------------------------------------------------ evidence ladder
   The repository labels every artifact with one of these evidence levels. */
export type Level = 'supplied' | 'proposed' | 'synthetic' | 'bench' | 'clinical' | 'released';
const LEVELS: Level[] = ['supplied', 'proposed', 'synthetic', 'bench', 'clinical', 'released'];

export const EvidenceLadder: React.FC<{ lit: Level[]; compact?: boolean }> = ({ lit, compact }) => (
  <div className={`ladder ${compact ? 'compact' : ''}`} role="img" aria-label={`Evidence level: ${lit.join(', ') || 'context'}`}>
    {!compact && <span className="ladder-k">Evidence</span>}
    <ul>
      {LEVELS.map((l) => (
        <li key={l} data-l={l} className={lit.includes(l) ? 'lit' : ''}>
          {l}
        </li>
      ))}
    </ul>
  </div>
);

/* ------------------------------------------------------------------ people */
export const Monogram: React.FC<{ name: string; size?: number; tone?: 'cobalt' | 'ember' | 'fluor' }> = ({ name, size = 40, tone = 'cobalt' }) => {
  const initials = name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className={`monogram tone-${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials}
    </span>
  );
};

/* ------------------------------------------------------------------ states */
const DELIVERY: Record<DeliveryState, string> = { saved: 'Saved on device', delivered: 'Delivered', reviewed: 'Reviewed' };
export const DeliveryChip: React.FC<{ state: DeliveryState }> = ({ state }) => (
  <span className={`state-chip d-${state}`}>
    <i aria-hidden="true" />
    {DELIVERY[state]}
  </span>
);

const REVIEW: Record<ReviewState, string> = { awaiting: 'Awaiting review', reviewed: 'Reviewed', missed: 'Missed sessions' };
export const ReviewChip: React.FC<{ state: ReviewState }> = ({ state }) => (
  <span className={`state-chip r-${state}`}>
    <i aria-hidden="true" />
    {REVIEW[state]}
  </span>
);

export const FictionalBadge: React.FC<{ label?: string }> = ({ label = 'Fictional data' }) => (
  <span className="fictional">{label}</span>
);
