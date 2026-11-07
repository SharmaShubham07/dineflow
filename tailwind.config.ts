import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#C2632A',
          hover: '#AE5520',
          light: '#FBDED0',
          dark: '#E07538',
        },
        surface: {
          light: '#FAF8F5',
          'light-secondary': '#F3F0EB',
          'light-tertiary': '#EBE7E0',
          dark: '#1C1917',
          'dark-secondary': '#292524',
          'dark-tertiary': '#37322E',
        },
      },
      borderRadius: {
        'glass-sm': '12px',
        'glass-md': '18px',
        'glass-lg': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        slideUp: 'slideUp 220ms ease-out',
        fadeIn: 'fadeIn 200ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;

