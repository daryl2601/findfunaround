/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Fredoka', 'system-ui', 'sans-serif'] },
      colors: {
        night: '#120826',
        grape: '#2a1252',
        blob: '#ff4fd8',
        zap: '#facc15',
        mint: '#5eead4',
      },
    },
  },
  plugins: [],
}
