import React from 'react';

const FLOW = 'M262,222 C276,262 272,320 252,348 C230,354 206,346 200,320 C197,262 214,216 232,194';

/** Cross-section of the eye: aqueous humour flows from behind the iris to the drainage angle. Colours follow the theme. */
const EyeCrossSection: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`eye-x ${className}`}
    viewBox="0 0 820 700"
    role="img"
    aria-label="Cross-section of the eye showing the cornea, aqueous humour, lens, drainage angle and optic nerve, with pressure pushing outward on the globe"
  >
    <defs>
      <radialGradient id="eye-vit" cx="58%" cy="50%" r="62%">
        <stop offset="0" className="ex-stop-a" />
        <stop offset="1" className="ex-stop-b" />
      </radialGradient>
    </defs>
    <path className="ex-globe" d="M226.9,180.8 A280,280 0 1,1 226.9,519.2 A182,182 0 0,1 226.9,180.8 Z" fill="url(#eye-vit)" strokeWidth="3" />
    <path className="ex-retina" d="M317,119.6 A266,266 0 1,1 317,580.4" fill="none" strokeWidth="2.5" />
    <path className="ex-chamber" d="M226.9,180.8 A182,182 0 0,0 226.9,519.2 L247,504 L247,196 Z" />
    <path className="ex-cornea" d="M226.9,519.2 A182,182 0 0,1 226.9,180.8" fill="none" strokeWidth="5" strokeLinecap="round" />
    <ellipse className="ex-lens" cx="290" cy="350" rx="40" ry="92" strokeWidth="2" />
    <line className="ex-iris" x1="247" y1="198" x2="247" y2="316" strokeWidth="10" strokeLinecap="round" />
    <line className="ex-iris" x1="247" y1="384" x2="247" y2="502" strokeWidth="10" strokeLinecap="round" />
    <ellipse className="ex-cil" cx="262" cy="196" rx="13" ry="22" />
    <ellipse className="ex-cil" cx="262" cy="504" rx="13" ry="22" />
    <path className="ex-nerve" d="M722,360 L812,352 L812,420 L722,412 Z" strokeWidth="2" />
    <ellipse className="eye-x-disc" cx="724" cy="386" rx="7" ry="24" />
    <g className="eye-x-arrows" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M480,190 l0,-34 m-10,12 l10,-12 l10,12" />
      <path d="M480,510 l0,34 m-10,-12 l10,12 l10,-12" />
      <path d="M620,350 l34,0 m-12,-10 l12,10 l-12,10" />
      <path d="M579,251 l24,-24 m-15,1 l15,-1 l-1,15" />
      <path d="M579,449 l24,24 m-15,-1 l15,1 l-1,-15" />
      <path d="M381,251 l-18,-18 m14,0 l-14,0 l0,14" />
      <path d="M381,449 l-18,18 m14,0 l-14,0 l0,-14" />
    </g>
    <text x="480" y="356" textAnchor="middle" className="eye-x-iop">IOP</text>
    <text x="480" y="392" textAnchor="middle" className="eye-x-unit">mmHg</text>
    <g className="ex-flow">
      {[0, -1.25, -2.5, -3.75].map((b) => (
        <circle key={b} r="4.5">
          <animateMotion dur="5s" repeatCount="indefinite" begin={`${b}s`} path={FLOW} />
        </circle>
      ))}
    </g>
    <g className="eye-x-labels">
      <line x1="96" y1="128" x2="140" y2="262" />
      <text x="40" y="116">Cornea</text>
      <line x1="230" y1="68" x2="233" y2="186" />
      <text x="170" y="56">Drainage angle</text>
      <line x1="120" y1="596" x2="206" y2="404" />
      <text x="20" y="622">Aqueous humour</text>
      <line x1="300" y1="460" x2="352" y2="572" />
      <text x="318" y="600">Lens</text>
      <line x1="760" y1="424" x2="730" y2="548" />
      <text x="620" y="574">Optic nerve</text>
    </g>
  </svg>
);

export default EyeCrossSection;
