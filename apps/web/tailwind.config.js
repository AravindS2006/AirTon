/** Local theme recovered from the upstream CDN configuration. */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        'airton-blue': '#00529B',
        'airton-blue-dark': '#003A6D',
        'airton-blue-light': '#E6F0F7',
        'airton-teal': '#00A89D',
        'airton-gray': '#6B7280',
      },
      fontFamily: { sans: ['Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
