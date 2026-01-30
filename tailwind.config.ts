import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          dark: "#121212",
          card: "#1E1E1E",
        }
      },
      backgroundImage: {
        'solana-gradient': 'linear-gradient(to bottom right, #000000, #1a1a1a)',
        'accent-gradient': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
