/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          base:    '#f4f6fb',   // page background — cool off-white
          surface: '#ffffff',   // cards, panels
          raised:  '#eef1f8',   // slightly elevated surfaces
          hover:   '#e6eaf5',   // hover state
        },
        border: {
          subtle:  '#e4e8f2',
          default: '#d0d6ea',
          strong:  '#a8b2d0',
        },
        text: {
          primary:   '#16192e',   // near-black with slight blue tint
          secondary: '#4a5080',
          muted:     '#8890b5',
        },
      },
      animation: {
        'slide-in':   'slideIn 0.15s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
