/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          red: '#FF4136',
          'red-hover': '#E63329',
          'red-light': '#FF6B61',
        },
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          elevated: '#2D2D2D',
          border: '#3A3A3A',
          text: '#E0E0E0',
          'text-secondary': '#A0A0A0',
          'text-muted': '#6A6A6A',
        }
      },
    },
  },
  plugins: [],
};