/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {

      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        sans:    ["DM Sans", "sans-serif"],
      },

      keyframes: {
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        heroUp: {
          from: { opacity: "0", transform: "translateY(60px) skewY(2deg)" },
          to:   { opacity: "1", transform: "none" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to:   { opacity: "1", transform: "none" },
        },
        // translateX IS GPU-composited — fixes "non-composited animation" warning
        shimmer: {
          "0%":   { transform: "translateX(-200%)" },
          "100%": { transform: "translateX(200%)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%":      { transform: "translateY(-14px) rotate(1deg)" },
        },
        scrollBob: {
          "0%, 100%": { transform: "translateY(0)",   opacity: "1"   },
          "50%":      { transform: "translateY(8px)", opacity: "0.4" },
        },
        pingOnce: {
          "0%":   { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2)", opacity: "0"   },
        },
        spinOnce: {
          from: { transform: "rotate(0deg)"   },
          to:   { transform: "rotate(360deg)" },
        },
      },

      animation: {
        "ticker":       "ticker    28s  linear                       infinite",
        "hero-up":      "heroUp    1.1s cubic-bezier(0.16,1,0.3,1)  0.15s both",
        "fade-up":      "fadeUp    0.9s cubic-bezier(0.16,1,0.3,1)  0.6s  both",
        "fade-up-late": "fadeUp    0.9s cubic-bezier(0.16,1,0.3,1)  0.9s  both",
        "float":        "floatY    6s   ease-in-out                  infinite",
        "scroll-bob":   "scrollBob 2s   ease-in-out                  infinite",
        "ping-slow":    "pingOnce  1.4s ease-out                     infinite",
        "spin-fast":    "spinOnce  0.7s linear                       infinite",
        "shimmer":      "shimmer   4s   linear                       infinite",
      },

      backgroundImage: {
        "shimmer-gold": "linear-gradient(90deg, #C9A84C 0%, #fff 40%, #C9A84C 60%, #fff 80%, #C9A84C 100%)",
      },

      backgroundSize: {
        "200-auto": "200% auto",
      },

      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },

    },
  },
  plugins: [],
};