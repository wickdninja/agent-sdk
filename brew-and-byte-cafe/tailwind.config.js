/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f3',
          100: '#f9e8d8',
          200: '#f3d0a9',
          300: '#e8a968',
          400: '#d97f3e',
          500: '#c05621',
          600: '#a43f19',
          700: '#7a2e14',
          800: '#5a2311',
          900: '#3d180c',
        }
      }
    },
  },
  plugins: [],
}