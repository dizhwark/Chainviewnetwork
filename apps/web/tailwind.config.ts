import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f5",
          100: "#d3ebe5",
          200: "#a8d7cc",
          300: "#78bfae",
          400: "#4fa590",
          500: "#2f8a75",
          600: "#22705f",
          700: "#1c594c",
          800: "#18463d",
          900: "#153a33",
        },
        emergency: {
          50: "#fdf2f2",
          500: "#c0362c",
          600: "#a12b23",
          700: "#82221c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
