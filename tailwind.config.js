/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope Variable", "Manrope", "system-ui", "sans-serif"],
      },
      screens: {
        // mid (>=640px): tabs move from the bottom bar into the header
        mid: "640px",
        // side (>=720px): history beside the keypad; converter cards side by side
        side: "720px",
        // wide (>=860px): roomier padding and a wider keypad
        wide: "860px",
        // phones turned sideways: short screens get a side-by-side keypad and header tabs
        land: { raw: "(orientation: landscape) and (max-height: 540px)" },
        // small phones turned sideways (under 700px wide): icon-only header tabs, short labels
        tightland: { raw: "(orientation: landscape) and (max-height: 540px) and (max-width: 699px)" },
      },
    },
  },
  plugins: [],
}
