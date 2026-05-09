/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      padding: {
        "18": "4.5rem",   // p-18 → 72px (all sides)
        "custom": "30px", // px-custom-x → left + right 30px
        "custom-y": "15px", // py-custom-y → top + bottom 15px
        "primarypad":"50px",
        "mprimarypad":"10px"
      },
      colors:{
        primary:"#581c87",
        secondary:"#517188",
        tertiary:"#F8F8F8"
      }
    },
  },
  plugins: [],
};
