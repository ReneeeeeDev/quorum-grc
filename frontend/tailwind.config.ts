import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#697386",
        line: "#d8dee8",
        panel: "#ffffff",
        canvas: "#f4f6f9",
        primary: "#0f766e",
        accent: "#2563eb",
        warning: "#b7791f",
        danger: "#b42318"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23, 32, 51, 0.08), 0 10px 24px rgba(23, 32, 51, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

