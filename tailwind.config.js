/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sage Green Palette - Primary calming colors
        sage: {
          50: '#f6f7f5',
          100: '#eaebe7',
          200: '#d1d3c7',
          300: '#b9c0ac',
          400: '#9caf88',
          500: '#8a9f77',
          600: '#708360',
          700: '#5a6b4e',
          800: '#475440',
          900: '#3a4535',
        },
        // Dusty Rose Palette - Accent colors
        rose: {
          50: '#fdf9f8',
          100: '#faf2f0',
          200: '#f5e4e0',
          300: '#eecec8',
          400: '#dea59b',
          500: '#ceaca1',
          600: '#b08980',
          700: '#936b63',
          800: '#795652',
          900: '#654847',
        },
        // Soft Cream & Ivory - Background colors
        cream: {
          50: '#fffef7',
          100: '#fffdd0',
          200: '#fef9e7',
          300: '#fdf2d9',
          400: '#f9e5bc',
          500: '#f4d8a0',
          600: '#e7c47a',
          700: '#d1a85f',
          800: '#b08b4e',
          900: '#8f6f41',
        },
        // Gold Accents - Luxury touches
        gold: {
          50: '#fdfaf3',
          100: '#fbf3e0',
          200: '#f7e4bd',
          300: '#f2d099',
          400: '#e8b56b',
          500: '#dda15e',
          600: '#c78443',
          700: '#a66938',
          800: '#875432',
          900: '#6f452b',
        },
        // Soft Blues - Trust and cleanliness
        spa: {
          50: '#f5fafa',
          100: '#eaf4f4',
          200: '#d0e7e7',
          300: '#aad4d4',
          400: '#7dbaba',
          500: '#5c9e9e',
          600: '#4a8383',
          700: '#3f6a6a',
          800: '#375757',
          900: '#314a4a',
        },
        // Neutral Grays - Text and subtle elements
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(221, 161, 94, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(221, 161, 94, 0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-spa': 'linear-gradient(135deg, #f6f7f5 0%, #faf2f0 25%, #eaebe7 50%, #f5fafa 75%, #fffef7 100%)',
      }
    },
  },
  plugins: [],
}