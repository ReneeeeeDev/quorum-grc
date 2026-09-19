import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14162b",
        muted: "#676b83",
        line: "#e3e4ef",
        panel: "#ffffff",
        canvas: "#f5f5fa",
        primary: {
          DEFAULT: "#4338ca",
          strong: "#3730a3",
          soft: "#eef0ff",
        },
        accent: "#0e7490",
        warning: "#b7791f",
        danger: "#b42318"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20, 22, 43, 0.05), 0 8px 24px rgba(20, 22, 43, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
