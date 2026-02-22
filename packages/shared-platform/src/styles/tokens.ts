/** Mirrors packages/shared-platform/src/styles/tokens.css exactly. */
export const tokens = {
  brand: {
    web4Purple: "#C044FF",
    web4PurpleSoft: "#B06EFF",
    web4PurpleLight: "#C084FC",
    web3Cyan: "#00FFD1",
    web3CyanLight: "#5FFAE0",
    uxPink: "#FF2D9E",
    uxPinkLight: "#FF79C6",
    black: "#000000",
    white: "#ffffff",
  },
  background: {
    950: "#04040A",
    900: "#08080D",
    800: "#0F0F18",
    700: "#16162A",
    600: "#1E1E38",
    500: "#2A2A48",
  },
  foreground: {
    primary: "#ffffff",
    muted: "#ededed",
  },
  semantic: {
    border: "#3f3f46",
    muted: "#71717a",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  /** Default slot values — each app overrides primary/accent in its own globals.css */
  appSlots: {
    primary: "#C044FF",
    primaryLight: "#C084FC",
    primaryDark: "#8c00d9",
    primarySoft: "#B06EFF",
    accent: "#FF2D9E",
    accentLight: "#FF79C6",
  },
} as const;

export type Tokens = typeof tokens;
export const brandColors = tokens.brand;
