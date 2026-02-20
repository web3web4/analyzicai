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
        ai: {
          DEFAULT: "#C044FF",
          soft: "#B06EFF",
          50: "#f9eeff",
          100: "#f1d9ff",
          200: "#e4b3ff",
          300: "#d280ff",
          400: "#C044FF",
          500: "#a800ff",
          600: "#8c00d9",
          700: "#7000b3",
          800: "#590090",
          900: "#430070",
          950: "#280045",
        },
        ux: {
          DEFAULT: "#FF2D9E",
          50: "#fff0f8",
          100: "#ffe4f3",
          200: "#ffcce8",
          300: "#ffa3d5",
          400: "#FF79C6",
          500: "#FF2D9E",
          600: "#e0007e",
          700: "#b80069",
          800: "#960057",
          900: "#7a0047",
          950: "#4a002b",
        },
        chain: {
          DEFAULT: "#00FFD1",
          400: "#5FFAE0",
        },
        surface: {
          950: "#04040A",
          900: "#08080D",
          800: "#0F0F18",
          700: "#16162A",
          600: "#1E1E38",
          500: "#2A2A48",
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
        "glow-ai-subtle": "0 0 20px rgba(192, 68, 255, 0.15)",
        "glow-ux-subtle": "0 0 20px rgba(255, 45, 158, 0.15)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "glitch-1": {
          "0%, 100%": { clipPath: "inset(0 0 0 0)", transform: "translate(0)" },
          "20%": {
            clipPath: "inset(20% 0 60% 0)",
            transform: "translate(-2px, 2px)",
          },
          "40%": {
            clipPath: "inset(40% 0 20% 0)",
            transform: "translate(2px, -1px)",
          },
          "60%": {
            clipPath: "inset(60% 0 10% 0)",
            transform: "translate(-1px, 1px)",
          },
          "80%": {
            clipPath: "inset(10% 0 70% 0)",
            transform: "translate(1px, -2px)",
          },
        },
        "glitch-2": {
          "0%, 100%": { clipPath: "inset(0 0 0 0)", transform: "translate(0)" },
          "20%": {
            clipPath: "inset(50% 0 30% 0)",
            transform: "translate(2px, -2px)",
          },
          "40%": {
            clipPath: "inset(10% 0 50% 0)",
            transform: "translate(-2px, 1px)",
          },
          "60%": {
            clipPath: "inset(30% 0 40% 0)",
            transform: "translate(1px, -1px)",
          },
          "80%": {
            clipPath: "inset(70% 0 5% 0)",
            transform: "translate(-1px, 2px)",
          },
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
