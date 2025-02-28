/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'rainbow': {
          'red': '#FF5757',
          'orange': '#FF914D',
          'yellow': '#FFDE59',
          'green': '#70FF66',
          'blue': '#5CE1E6',
          'indigo': '#7B68EE',
          'violet': '#C77DFF',
          'pink': '#FF70A6',
        },
        'primary': {
          50: '#f0e7ff',
          100: '#d9c2ff',
          200: '#b794ff',
          300: '#9966ff',
          400: '#7c3afd',
          500: '#6d28d9',
          600: '#5b21b6',
          700: '#4c1d95',
          800: '#3a1674',
          900: '#2e1065',
        },
        'secondary': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      fontFamily: {
        'display': ['Poppins', 'sans-serif'],
        'body': ['Nunito', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-rainbow': 'pulse-rainbow 4s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pulse-rainbow': {
          '0%, 100%': { 
            backgroundColor: '#FF5757',
            borderColor: '#FF5757'
          },
          '16.66%': { 
            backgroundColor: '#FF914D',
            borderColor: '#FF914D'
          },
          '33.33%': { 
            backgroundColor: '#FFDE59',
            borderColor: '#FFDE59'
          },
          '50%': { 
            backgroundColor: '#70FF66',
            borderColor: '#70FF66'
          },
          '66.66%': { 
            backgroundColor: '#5CE1E6',
            borderColor: '#5CE1E6'
          },
          '83.33%': { 
            backgroundColor: '#7B68EE',
            borderColor: '#7B68EE'
          },
        }
      },
      backgroundImage: {
        'rainbow-gradient': 'linear-gradient(to right, #FF5757, #FF914D, #FFDE59, #70FF66, #5CE1E6, #7B68EE, #C77DFF)',
        'pastel-gradient': 'linear-gradient(to right, #FFD1DC, #FFE2AD, #FFFAC8, #BDFCC9, #CDF5FD, #D0D1FF, #F8C8FF)',
      },
    },
  },
  plugins: [],
} 