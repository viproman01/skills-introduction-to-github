import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#005bff',
          fg: '#ffffff',
          hover: '#0044cc',
          soft: '#e8f0ff',
        },
        accent: {
          DEFAULT: '#f91155',
          fg: '#ffffff',
        },
        // Scoped to /map (bazaar design)
        bazaar: {
          bg: '#F4EBD1',
          card: '#FAF5E5',
          panel: '#FFFFFF',
          ink: '#2B2623',
          muted: '#6B5F52',
          line: '#D4C9AE',
          accent: '#E87B3A',
          accent2: '#F3A363',
          open: '#BFD8B2',
          openDim: '#E3EEDB',
          live: '#6EA874',
          hit: '#E87B3A',
          dark: '#1E1B19',
          cellEmpty: '#F3EAD0',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)',
        cardHover: '0 4px 14px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
