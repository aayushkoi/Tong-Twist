// tong/tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "quizlet-blue": "#4257b2", // Quizlet's primary blue color
        "quizlet-gray": "#f6f7f8", // Quizlet's light gray background
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};