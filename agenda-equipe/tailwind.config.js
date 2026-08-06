/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 23, 42, 0.12), 0 1px 2px rgba(15, 23, 42, 0.08)',
        pop: '0 12px 32px -8px rgba(15, 23, 42, 0.25)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.92) translateY(2px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.12s ease-out',
      },
    },
  },
  plugins: [],
}
