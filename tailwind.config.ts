import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        mist: "#f5f3f2",
        line: "#e3dcd8",
        moss: "#FF5500",
        "moss-dark": "#E04B00",
        copper: "#c45c1a",
        sky: "#3d7899",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        sans: ["General Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
