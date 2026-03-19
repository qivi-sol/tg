import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#090d18",
          900: "#0f1424",
          800: "#161d32",
          700: "#212a44"
        },
        accent: {
          cyan: "#4DE6FF",
          gold: "#F7C96B",
          green: "#4EF7A7",
          danger: "#FF6B8A"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(77, 230, 255, 0.16), 0 24px 48px rgba(0, 0, 0, 0.38)"
      },
      backgroundImage: {
        "vault-grid":
          "radial-gradient(circle at top, rgba(77,230,255,0.18), transparent 32%), linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0))"
      },
      animation: {
        "vault-pulse": "vaultPulse 2.4s ease-in-out infinite",
        "rise-in": "riseIn 360ms ease-out"
      },
      keyframes: {
        vaultPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.03)", opacity: "1" }
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
