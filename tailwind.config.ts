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
        ink: "#17211c",
        mist: "#eef4f0",
        line: "#d8e3dc",
        moss: "#3e6f59",
        copper: "#b26442",
        sky: "#3d7899",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(23, 33, 28, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
