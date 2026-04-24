import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
      },
      boxShadow: {
        glow: "0 0 32px rgba(56, 189, 248, 0.22)",
      },
      keyframes: {
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: ".28" },
          "50%": { opacity: ".72" },
        },
      },
      animation: {
        "border-flow": "borderFlow 2.8s linear infinite",
        "float-in": "floatIn .42s ease both",
        "pulse-line": "pulseLine 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
