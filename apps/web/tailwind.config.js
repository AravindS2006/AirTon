/**
 * Tailwind provides the CSS reset (preflight) for the immersive design system in
 * index.css. Colour and type tokens live there as CSS variables; they are mirrored
 * here so utilities stay consistent if they are used.
 */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.tsx', './lib/**/*.ts', './services/**/*.ts'],
  theme: {
    extend: {
      colors: {
        void: '#03060c',
        ink: '#070d1c',
        paper: '#ecf1fa',
        mute: '#9cabc8',
        faint: '#6a7ba1',
        cobalt: '#5f8fff',
        fluor: '#d6ff3e',
        ember: '#ff7a2e',
        alarm: '#ff5a76',
      },
      fontFamily: {
        display: ['"Anybody Variable"', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
