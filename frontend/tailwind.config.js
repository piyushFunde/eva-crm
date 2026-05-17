/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#2563EB', light: '#EFF6FF', dark: '#1D4ED8', 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE' },
        success:   { DEFAULT: '#16A34A', light: '#F0FDF4', dark: '#15803D' },
        danger:    { DEFAULT: '#DC2626', light: '#FEF2F2', dark: '#B91C1C' },
        warning:   { DEFAULT: '#D97706', light: '#FFFBEB', dark: '#B45309' },
        surface:   '#FFFFFF',
        muted:     '#6B7280',
        border:    '#E5E7EB',
        subtle:    '#F3F4F6',
        bg:        '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        btn:  '10px',
      },
      boxShadow: {
        card:     '0 1px 4px rgba(0,0,0,0.06)',
        'card-md':'0 4px 12px rgba(0,0,0,0.08)',
        'card-lg':'0 8px 24px rgba(0,0,0,0.10)',
        modal:    '0 -4px 32px rgba(0,0,0,0.12)',
        nav:      '0 -1px 3px rgba(0,0,0,0.06)',
      },
      animation: {
        'slide-up':   'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in':    'fadeIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
