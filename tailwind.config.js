/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/react/**/*.{js,ts,jsx,tsx}",
    "./src/react/index.html",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        // or customize your own gradient:
        // 'gradient-main': 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      },
    },
  },
  plugins: [],
}