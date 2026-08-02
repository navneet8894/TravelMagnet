/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { navy: "#07182e" },
      boxShadow: { premium: "0 24px 70px -28px rgba(15, 23, 42, .35)" }
    }
  },
  plugins: []
};
