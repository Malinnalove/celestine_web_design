import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#FCF9EA",
        mist: "#BADFDB",
        blush: "#FFA4A4",
        petal: "#FFBDBD",
        ink: "#1F1B16",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 25px 50px rgba(31,27,22,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
