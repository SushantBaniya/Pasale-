/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm terracotta theme (Light)
        terracotta: {
          DEFAULT: '#D4623A',
          light: '#FDF1EC',
          dark: '#8A3A1E',
          muted: '#D4623A22',
          border: '#D4623A30',
        },
        warm: {
          bg: '#FAF7F3',
          sidebar: '#F5EDE3',
          card: '#EDE5DA',
          border: '#E5D8CC',
          text: '#3D2B1A',
          muted: '#8A7060',
          green: '#3A7A5A',
        },
        // Dark Mode Custom Theme
        darkTheme: {
          bg: '#111111',
          sidebarStrip: '#0A0A0A',
          card: '#1A1A1A',
          alert: '#222222',
          inactiveBar: '#2A2A2A',
          border: '#222222',
          borderBtn: '#333333',
          textPrimary: '#E0E0E0',
          textSecondary: '#CCCCCC',
          textMuted: '#555555',
          textVeryMuted: '#444444',
          sectionLabel: '#333333',
          green: '#4CAF82',
        },
        primary: {
          50: '#FDF1EC',
          100: '#FADED0',
          200: '#F5BDA1',
          300: '#E89A72',
          400: '#D4623A',
          500: '#D4623A',
          600: '#B8502E',
          700: '#8A3A1E',
          800: '#3D2B1A',
          900: '#2A1D12',
        },
      },
    },
  },
  plugins: [],
}
