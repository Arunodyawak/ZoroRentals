/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.html",
    "./frontend/assets/js/**/*.js"
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        primary: "#1476cf",
        primarydark: "#0d62af",
        secondary: "#eef6fc",
        secondy: "#eef6fc",
        dark: "#24262d",
        muted: "#757982",
        line: "#e7edf4",
        soft: "#f3f8fc",
        footer: "#031b31",
        star: "#f2c94c",
        surface: "#fbfcfe"
      },
      fontFamily: {
        mainf: ["Inter", "Poppins", "Arial", "sans-serif"],
        secondaryf: ["Poppins", "Inter", "Arial", "sans-serif"],
        secondyf: ["Poppins", "Inter", "Arial", "sans-serif"]
      },
      boxShadow: {
        zoro: "0 16px 38px rgba(19, 53, 83, 0.12)",
        button: "0 8px 18px rgba(21, 120, 201, 0.18)"
      },
      ringOffsetColor: {
        DEFAULT: "#fbfcfe"
      },
      borderRadius: {
        zoro: "8px"
      }
    }
  },
  plugins: []
};
