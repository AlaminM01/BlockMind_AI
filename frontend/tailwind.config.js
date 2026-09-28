/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00E5FF',
          hover: '#00B4D8',
          glow: 'rgba(0, 229, 255, 0.4)',
        },
        secondary: {
          DEFAULT: '#7B61FF',
          hover: '#6845F5',
          glow: 'rgba(123, 97, 255, 0.4)',
        },
        accent: {
          DEFAULT: '#00FFB2',
          hover: '#00D995',
          glow: 'rgba(0, 255, 178, 0.4)',
        },
        dark: {
          bg: '#0F172A',
          card: 'rgba(30, 41, 59, 0.7)',
          cardSolid: '#1E293B',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#F8FAFC',
          muted: '#94A3B8'
        },
        light: {
          bg: '#F1F5F9',
          card: 'rgba(255, 255, 255, 0.85)',
          cardSolid: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          text: '#0F172A',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 229, 255, 0.5)',
        'glow-purple': '0 0 20px -5px rgba(123, 97, 255, 0.5)',
        'glow-accent': '0 0 20px -5px rgba(0, 255, 178, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
