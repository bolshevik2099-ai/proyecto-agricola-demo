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
        agri: {
          50: '#f2f9f3',
          100: '#e1f2e5',
          200: '#c5e4cd',
          300: '#9bcea7',
          400: '#69b07a',
          500: '#469458',
          600: '#347743',
          700: '#2b5f36',
          800: '#254c2d',
          900: '#1f3e26',
        },
      },
    },
  },
  plugins: [],
};
export default config;
