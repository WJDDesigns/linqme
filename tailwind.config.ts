import type { Config } from "tailwindcss";

/** Helper: reference a CSS custom-property that holds space-separated RGB values */
function rgb(name: string) {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Celestial Editorial palette (CSS-var driven) ── */
        primary: rgb("primary"),
        "on-primary": rgb("on-primary"),
        "primary-container": rgb("primary-container"),
        "on-primary-container": rgb("on-primary-container"),
        "inverse-primary": rgb("inverse-primary"),

        secondary: rgb("secondary"),
        "on-secondary": rgb("on-secondary"),
        "secondary-container": rgb("secondary-container"),
        "on-secondary-container": rgb("on-secondary-container"),

        tertiary: rgb("tertiary"),
        "on-tertiary": rgb("on-tertiary"),
        "tertiary-container": rgb("tertiary-container"),
        "on-tertiary-container": rgb("on-tertiary-container"),

        error: rgb("error"),
        "on-error": rgb("on-error"),
        "error-container": rgb("error-container"),
        "on-error-container": rgb("on-error-container"),

        surface: rgb("surface"),
        "surface-dim": rgb("surface-dim"),
        "surface-bright": rgb("surface-bright"),
        "surface-container-lowest": rgb("surface-container-lowest"),
        "surface-container-low": rgb("surface-container-low"),
        "surface-container": rgb("surface-container"),
        "surface-container-high": rgb("surface-container-high"),
        "surface-container-highest": rgb("surface-container-highest"),
        "surface-variant": rgb("surface-variant"),
        "surface-tint": rgb("surface-tint"),

        "on-surface": rgb("on-surface"),
        "on-surface-variant": rgb("on-surface-variant"),
        "on-background": rgb("on-background"),
        background: rgb("background"),

        outline: rgb("outline"),
        "outline-variant": rgb("outline-variant"),

        "inverse-surface": rgb("inverse-surface"),
        "inverse-on-surface": rgb("inverse-on-surface"),

        /* Legacy brand tokens (keep for compat) */
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
