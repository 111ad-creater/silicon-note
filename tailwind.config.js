/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        cyber: {
          DEFAULT: '#38BDF8',
          dark: '#0284C7',
        },
        chip: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        navy: {
          950: '#050811',
          900: '#0B1120',
          850: '#0F172A',
          800: '#162033',
        }
      },
      boxShadow: {
        'glow-cyber': '0 0 32px -8px rgba(56, 189, 248, 0.3)',
        'glow-chip': '0 0 32px -8px rgba(16, 185, 129, 0.3)',
        'glow-oom': '0 0 28px -6px rgba(239, 68, 68, 0.45)',
      }
    },
  },
  plugins: [],
}
