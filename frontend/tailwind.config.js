/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          light: '#1B263B',
        },
        blue: {
          DEFAULT: '#2EC4B6',
          light: '#3DD9CA',
        },
        red: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        yellow: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        green: {
          DEFAULT: '#2BC48A',
          light: '#34D399',
        },
        gray: {
          soft: '#E0E1DD',
          medium: '#9CA3AF',
        },
      },
    },
  },
  plugins: [],
}
