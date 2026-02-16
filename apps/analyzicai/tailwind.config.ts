import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/shared-platform/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ai-ui-library/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: "0",
      DEFAULT: "0",
      full: "9999px",
    },
    extend: {
      colors: {
        cyan: {
          DEFAULT: "#00FFD1",
          50: "#edfffe",
          100: "#d1fffc",
          200: "#a4fffa",
          300: "#6bfff5",
          400: "#00FFD1",
          500: "#00e6bc",
          600: "#00bf9d",
          700: "#00997e",
          800: "#007a66",
          900: "#006454",
          950: "#003d35",
        },
        magenta: {
          DEFAULT: "#E500CE",
          50: "#fef1fc",
          100: "#fde6fa",
          200: "#fccdf6",
          300: "#faa4ed",
          400: "#f56de0",
          500: "#E500CE",
          600: "#c700b0",
          700: "#a5008f",
          800: "#870075",
          900: "#6f0061",
          950: "#4a0041",
        },
        surface: {
          950: "#06060A",
          900: "#0A0A0F",
          800: "#12121A",
          700: "#1A1A2E",
          600: "#242440",
          500: "#2E2E52",
        },
      },
      fontFamily: {
        mono: ['"Space Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        // Subtle single-layer glow — used sparingly on hover only
        "glow-cyan-subtle":
          "0 0 20px rgba(0, 255, 209, 0.15)",
        "glow-magenta-subtle":
          "0 0 20px rgba(229, 0, 206, 0.15)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "glitch-1": {
          "0%, 100%": { clipPath: "inset(0 0 0 0)", transform: "translate(0)" },
          "20%": { clipPath: "inset(20% 0 60% 0)", transform: "translate(-2px, 2px)" },
          "40%": { clipPath: "inset(40% 0 20% 0)", transform: "translate(2px, -1px)" },
          "60%": { clipPath: "inset(60% 0 10% 0)", transform: "translate(-1px, 1px)" },
          "80%": { clipPath: "inset(10% 0 70% 0)", transform: "translate(1px, -2px)" },
        },
        "glitch-2": {
          "0%, 100%": { clipPath: "inset(0 0 0 0)", transform: "translate(0)" },
          "20%": { clipPath: "inset(50% 0 30% 0)", transform: "translate(2px, -2px)" },
          "40%": { clipPath: "inset(10% 0 50% 0)", transform: "translate(-2px, 1px)" },
          "60%": { clipPath: "inset(30% 0 40% 0)", transform: "translate(1px, -1px)" },
          "80%": { clipPath: "inset(70% 0 5% 0)", transform: "translate(-1px, 2px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
      },
      animation: {
        "scan-line": "scan-line 4s linear infinite",
        "glitch-1": "glitch-1 0.3s ease-in-out",
        "glitch-2": "glitch-2 0.3s ease-in-out 0.05s",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
