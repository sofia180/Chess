import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070A12',
        panel: '#0D1222',
        panel2: '#0A0F1E',
        neon: '#64FFDA',
        neon2: '#8A5CFF',
        danger: '#FF4D6D',
        text: '#E7ECFF',
        muted: '#95A2C6'
      },
      boxShadow: {
        glow: '0 0 30px rgba(100,255,218,0.15)'
      }
    }
  },
  plugins: []
} satisfies Config;

