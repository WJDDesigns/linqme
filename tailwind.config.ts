import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Celestial Editorial palette ───────────────── */
        primary: "#c0c1ff",
        "on-primary": "#1000a9",
        "primary-container": "#040050",
        "on-primary-container": "#696cf8",
        "inverse-primary": "#494bd6",
        "primary-fixed": "#e1e0ff",
        "primary-fixed-dim": "#c0c1ff",
        "on-primary-fixed": "#07006c",
        "on-primary-fixed-variant": "#2f2ebe",

        secondary: "#bcc7de",
        "on-secondary": "#263143",
        "secondary-container": "#3e495d",
        "on-secondary-container": "#aeb9d0",
        "secondary-fixed": "#d8e3fb",
        "secondary-fixed-dim": "#bcc7de",
        "on-secondary-fixed": "#111c2d",
        "on-secondary-fixed-variant": "#3c475a",

        tertiary: "#3cddc7",
        "on-tertiary": "#003731",
        "tertiary-container": "#001612",
        "on-tertiary-container": "#008d7e",
        "tertiary-fixed": "#62fae3",
        "tertiary-fixed-dim": "#3cddc7",
        "on-tertiary-fixed": "#00201c",
        "on-tertiary-fixed-variant": "#005047",

        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",

        surface: "#0b1326",
        "surface-dim": "#0b1326",
        "surface-bright": "#31394d",
        "surface-container-lowest": "#060e20",
        "surface-container-low": "#131b2e",
        "surface-container": "#171f33",
        "surface-container-high": "#222a3d",
        "surface-container-highest": "#2d3449",
        "surface-variant": "#2d3449",
        "surface-tint": "#c0c1ff",

        "on-surface": "#dae2fd",
        "on-surface-variant": "#c7c6cb",
        "on-background": "#dae2fd",
        background: "#0b1326",

        outline: "#909095",
        "outline-variant": "#46464b",

        "inverse-surface": "#dae2fd",
        "inverse-on-surface": "#283044",

        /* keep old brand tokens as aliases so nothing breaks */
        brand: {
          50: "#e1e0ff",
          100: "#c0c1ff",
          500: "#696cf8",
          600: "#494bd6",
          700: "#2f2ebe",
        },
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        label: ['"Inter"', "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
