/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flash: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'print-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'paper-wobble': {
          '0%': { transform: 'rotate(-0.5deg)' },
          '100%': { transform: 'rotate(0.5deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s ease-out both',
        flash: 'flash 0.3s ease-out both',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'print-down': 'print-down 2.8s ease-in-out 0.2s both',
        'paper-wobble': 'paper-wobble 0.9s ease-in-out infinite alternate',
        'pulse-soft': 'pulse-soft 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};