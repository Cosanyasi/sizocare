import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#EFF3EE',
        panel: '#FFFFFF',
        'panel-2': '#F6F8F5',
        border: '#DCE5DD',
        ink: '#24312D',
        'ink-soft': '#5B6B64',
        teal: { DEFAULT: '#3F7268', deep: '#2E574F', tint: '#E3EEEA' },
        gold: '#C08F52',
        terracotta: { DEFAULT: '#B5624A', tint: '#F3E3DE' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(36,49,45,0.06), 0 8px 24px rgba(36,49,45,0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
