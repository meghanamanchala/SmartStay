// import { Config } from 'tailwindcss'; // Not needed in JS

const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: '#0d968b',
        'primary-text': '#ffffff',
        secondary: '#f6fafb',
        'secondary-text': '#263740',
        accent: '#1ba7a5',
        'accent-text': '#ffffff',
        background: '#f6fafb',
      },
      borderRadius: {
        DEFAULT: '1.25rem',
      },
      boxShadow: {
        custom: '0 4px 32px 0 rgba(13,150,139,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
