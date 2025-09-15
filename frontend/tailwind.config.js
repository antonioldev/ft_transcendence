/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./src/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'tiny5-regular': ['"Tiny5"', 'sans-serif'],
        'poppins': ['"Poppins"', 'sans-serif'],
        'poppins-light': ['"Poppins"', 'sans-serif'],
        'poppins-medium': ['"Poppins"', 'sans-serif'],
        'poppins-semibold': ['"Poppins"', 'sans-serif'],
        'poppins-bold': ['"Poppins"', 'sans-serif'],
      },
      colors: {
        'blue-background': '#143D60',
        'light-green': '#A0C878',
        'orange': '#EB5B00',
        'light-brown': '#81523F',
        'dark-brown': '#3F2A2B'
      }
    }
  },
  plugins: [],
}