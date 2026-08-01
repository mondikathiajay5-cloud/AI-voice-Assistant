/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // UEL-inspired deep blue + a warm accent for the assistant's voice state
        campus: {
          navy: '#0B1E3D',
          blue: '#14315C',
          slate: '#3E5C8A',
          mist: '#EEF2F8',
        },
        assistant: {
          listening: '#E8A33D',
          speaking: '#2F9E6E',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
