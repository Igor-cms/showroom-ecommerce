import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        headline: ["var(--font-headline)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        pixel: ['"Pixelify Sans"', "monospace"],
        /* The Readymag-exported Helvetica the whole design is composed with.
           It was only ever reachable as an inline `fontFamily` string repeated
           across components, which cannot be applied per breakpoint — and the
           arbitrary-property form (`sm:[font-family:custom_75139,…]`) is not
           generated at all, so a responsive override silently did nothing. */
        rm: ["custom_75139", "Helvetica", "Arial", "sans-serif"],
        "rm-bold": ["custom_75141", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        "bg-cream": "hsl(var(--bg-cream))",
        ink: "hsl(var(--ink))",
        "ink-60": "hsl(var(--ink-60))",
        line: "hsl(var(--line))",
        badge: "hsl(var(--badge))",
        "accent-olive": "hsl(var(--accent-olive))",
        "accent-sand": "hsl(var(--accent-sand))",
        "wholesale-primary": "hsl(var(--wholesale-primary))",
        "wholesale-secondary": "hsl(var(--wholesale-secondary))",
        "wholesale-bg": "hsl(var(--wholesale-bg))",
        "wholesale-accent": "hsl(var(--wholesale-accent))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      boxShadow: {
        "card": "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "drawer": "var(--shadow-drawer)",
        "wholesale": "0 4px 24px rgba(0,0,0,0.04)",
      },
      transitionDuration: {
        "fast": "var(--transition-fast)",
        "smooth": "var(--transition-smooth)",
        "reveal": "var(--transition-reveal)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
