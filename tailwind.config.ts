import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        'bg-card': '#111111',
        'bg-card-hover': '#1A1A1A',
        text: '#F5F0E8',
        'text-muted': '#8A8A8A',
        accent: '#FF4500',
        'accent-hover': '#FF5722',
        'accent-dim': 'rgba(255, 69, 0, 0.15)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
