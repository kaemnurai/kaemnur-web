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
        // ─── /custom microsite — light theme, intentionally separate from
        // the dark tokens above so the rest of the site is untouched ───
        cw: {
          bg: "#FFFFFF",
          "bg-soft": "#F6F8FB",
          card: "#FFFFFF",
          "card-soft": "#F2F4F8",
          line: "#E3E8EF",
          fg: "#101828",
          "fg-sub": "#4B5567",
          "fg-muted": "#8A94A6",
          navy: "#1D3A8A",
          "navy-hover": "#16306F",
          "navy-soft": "rgba(29,58,138,0.08)",
          orange: "#F5871F",
          "orange-hover": "#DD7611",
          "orange-soft": "rgba(245,135,31,0.12)",
          green: "#1FA855",
          "green-hover": "#178A45",
          "green-soft": "rgba(31,168,85,0.10)",
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
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
