import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0B0C15", // Main background (Deep Void)
          800: "#151725", // Card background (Lighter Void)
          700: "#1F2235", // Border/Hover
        },
        accent: {
          green: "#00E096", // Success / High Probability
          red: "#FF3B30",   // Pressure / Danger
          blue: "#007AFF",  // Info / Links
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#8F9BB3",
        }
      },
    },
  },
  plugins: [],
};
export default config;