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
      },
      colors: {
        'gray-background': '#565656',
        'light-green': '#B2FFA9',
        'orange': '#FF4A1C',
        'light-brown': '#81523F',
        'dark-brown': '#3F2A2B'
      }
    }
  },
  plugins: [],
}