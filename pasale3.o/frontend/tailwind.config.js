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
        // Ink & Cashmere theme (Light)
        terracotta: {
          DEFAULT: '#A3876A',
          light: '#F5F0E6',
          dark: '#6B5340',
          muted: '#A3876A22',
          border: '#A3876A30',
        },
        warm: {
          bg: '#F4F0EA',
          sidebar: '#EBE5DA',
          card: '#E3DDD2',
          border: '#DDD7CC',
          text: '#1A1C20',
          muted: '#6B7280',
          green: '#3A7A5A',
        },
        // Dark Mode (Ink theme)
        darkTheme: {
          bg: '#0D0E12',
          sidebarStrip: '#080A0F',
          card: '#15161C',
          alert: '#1C1D24',
          inactiveBar: '#22232C',
          border: '#1C1D24',
          borderBtn: '#2A2B36',
          textPrimary: '#EAE5DF',
          textSecondary: '#C8C3BC',
          textMuted: '#44454F',
          textVeryMuted: '#35363F',
          sectionLabel: '#2A2B36',
          green: '#4CAF82',
        },
        primary: {
          50: '#F5F0E6',
          100: '#EBE2D3',
          200: '#D6C4AC',
          300: '#BFA487',
          400: '#A3876A',
          500: '#A3876A',
          600: '#8E7356',
          700: '#6B5340',
          800: '#1A1C20',
          900: '#0D0E12',
        },
      },
    },
  },
  plugins: [],
}
