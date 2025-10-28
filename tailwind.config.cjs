/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0f8',
          100: '#cfe1f1',
          200: '#9fc3e3',
          300: '#70a5d5',
          400: '#4087c7',
          500: '#5b8cc9', // Main brand color from legacy
          600: '#4a76a8',
          700: '#3a5a7a', // Darker variant
          800: '#2d4460',
          900: '#1f2e46',
        },
      },
    },
  },
  plugins: [],
}
