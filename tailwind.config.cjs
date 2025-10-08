/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        modalIn: 'modal-in .28s cubic-bezier(.16,.84,.44,1)',
        modalOut: 'modal-out .2s ease',
        fadeIn: 'fade-in 0.5s ease-out forwards',
        fadeOut: 'fade-out 0.3s ease-in forwards'
      }
    },
  },
  plugins: [],
};
