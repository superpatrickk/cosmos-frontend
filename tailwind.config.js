/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pup-maroon': '#8B0000',
        'pup-maroon-dark': '#6B0000',
        'pup-maroon-light': '#A52828',
      },
    },
  },
  plugins: [],
}