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
        // Modern Navy & Yellow theme
        brand: {
          DEFAULT: '#F2DD50', // Yellow highlight
          light: '#FDE68A',
          dark: '#D97706',
          muted: '#F2DD5022',
          border: '#F2DD5030',
        },
        warm: {
          bg: '#F7FAFC', // Content area white
          sidebar: '#101B55', // Dark navy blue
          card: '#FFFFFF', // Light gray cards
          border: '#E2E8F0', // Slate 200
          text: '#1E293B', // Charcoal text
          muted: '#475569',
          green: '#10B981', // Green icons
        },
        // Dark Mode (Adjusted to navy dark mode)
        darkTheme: {
          bg: '#020617', // Slate 950
          sidebarStrip: '#101B55',
          card: '#101B55',
          alert: '#1E293B',
          inactiveBar: '#1E293B',
          border: '#1E293B',
          borderBtn: '#334155',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
          textVeryMuted: '#475569',
          sectionLabel: '#334155',
          green: '#10B981',
        },
        primary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#F2DD50', // Primary accent
          600: '#D97706',
          700: '#334155',
          800: '#1E293B',
          900: '#101B55',
        },
      },
    },
  },
  plugins: [],
}
