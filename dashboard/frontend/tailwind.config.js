/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-dark)",
        foreground: "var(--text-main)",
        primary: "var(--primary)",
        app: {
          ink: "var(--app-ink)",
          muted: "var(--app-muted)",
          soft: "var(--app-soft)",
          canvas: "var(--app-canvas)",
          hairline: "var(--app-hairline)"
        }
      },
    },
  },
  plugins: [],
}
