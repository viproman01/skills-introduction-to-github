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
