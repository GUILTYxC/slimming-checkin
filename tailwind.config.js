/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7f8',
          100: '#ecf0f2',
          200: '#d5dee2',
          300: '#afc2c9',
          400: '#829fab',
          500: '#638591',
          600: '#4f6d7b',
          700: '#415a66',
          800: '#384c56',
          900: '#32414a',
        },
      },
    },
  },
  plugins: [],
}
