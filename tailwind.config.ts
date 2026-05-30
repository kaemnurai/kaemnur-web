import type { Config } from "tailwindcss";

// Color tokens are extracted directly from the design-reference images.
// Treat the references as the source of truth — do not change these
// values without re-deriving from the PNGs.
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Surfaces ──────────────────────────────────────────
        bg: "#0F1419",       // primary page background
        card: "#1A1F2E",     // card / panel background
        sidebar: "#111318",  // sidebar / navbar background
        "card-hover": "#1E2438",
        // ─── Borders ───────────────────────────────────────────
        line: "#2A2F3E",
        // ─── Text ──────────────────────────────────────────────
        fg: "#FFFFFF",            // primary text
        "fg-sub": "#8B9098",      // secondary text
        "fg-muted": "#5A6170",    // muted text / section labels
        // ─── Accent + status ───────────────────────────────────
        accent: {
          DEFAULT: "#F4B400",
          hover: "#E0A500",
          soft: "rgba(244,180,0,0.12)",
        },
        success: "#4CAF50",
        warning: "#E0A000",
        danger: "#E5484D",
        info: "#5AA0E0",
        // ─── Per-product chip accents (Steam-style colored squares) ─
        chip: {
          orange: "#F4B400",
          teal: "#14B8A6",
          emerald: "#4CAF50",
          violet: "#8B5CF6",
          sky: "#5AA0E0",
          rose: "#E5484D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "12px", // rounded-xl per design system
        btn: "8px",   // rounded-lg per design system
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3)",
        "card-lg": "0 8px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
