import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gastric: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#fb7185',
          900: '#881337',
        },
      },
    },
  },
  plugins: [],
};

export default config;
