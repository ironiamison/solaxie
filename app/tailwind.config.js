/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Baloo 2'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0a0612",
          850: "#0f0a1d",
          800: "#150f29",
          700: "#241945",
        },
        brand: {
          300: "#a463ff",
          400: "#8a37ff",
          500: "#711eff",
          600: "#5912d6",
        },
        cls: {
          beast: "#ffa83d",
          aquatic: "#3db4ff",
          plant: "#54e07a",
          bird: "#ff5fb0",
          bug: "#a779ff",
          reptile: "#2fe0cf",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(138,55,255,0.55)",
        glowpink: "0 0 24px rgba(255,95,176,0.5)",
        panel: "0 18px 44px rgba(0,0,0,0.5)",
      },
      keyframes: {
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-8px) rotate(1deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(138,55,255,0.5)" },
          "50%": { boxShadow: "0 0 0 8px rgba(138,55,255,0)" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        ripple: {
          "0%": { transform: "translate(-50%,-50%) scale(0.45)", opacity: "0.55" },
          "100%": { transform: "translate(-50%,-50%) scale(1.7)", opacity: "0" },
        },
        contact: {
          // shadow shrinks/fades as the creature floats up (synced with bob)
          "0%,100%": { transform: "translateX(-50%) scaleX(1)", opacity: "0.5" },
          "50%": { transform: "translateX(-50%) scaleX(0.78)", opacity: "0.28" },
        },
        sparkle: {
          "0%": { transform: "translateY(0) scale(0.3)", opacity: "0" },
          "35%": { opacity: "1" },
          "100%": { transform: "translateY(-16px) scale(1)", opacity: "0" },
        },
        flicker: {
          "0%,100%": { transform: "scaleY(1) translateY(0)", opacity: "0.95" },
          "25%": { transform: "scaleY(1.15) translateY(-1px)", opacity: "1" },
          "55%": { transform: "scaleY(0.9) translateY(1px)", opacity: "0.82" },
          "80%": { transform: "scaleY(1.07)", opacity: "0.98" },
        },
        wave: {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        aura: {
          "0%,100%": { opacity: "0.5", transform: "translate(-50%,-50%) scale(1)" },
          "50%": { opacity: "0.85", transform: "translate(-50%,-50%) scale(1.14)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(10px,-14px)" },
          "50%": { transform: "translate(-8px,-22px)" },
          "75%": { transform: "translate(-12px,-8px)" },
          "100%": { transform: "translate(0,0)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        flutter: {
          "0%": { transform: "translate(0,0) rotate(-10deg)" },
          "25%": { transform: "translate(34px,-22px) rotate(8deg)" },
          "50%": { transform: "translate(74px,-6px) rotate(-6deg)" },
          "75%": { transform: "translate(118px,-26px) rotate(10deg)" },
          "100%": { transform: "translate(160px,-4px) rotate(-8deg)" },
        },
        wings: {
          "0%,100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(0.4)" },
        },
        watershimmer: {
          "0%,100%": { opacity: "0.12", transform: "translateX(-2%) scale(1)" },
          "50%": { opacity: "0.3", transform: "translateX(2%) scale(1.04)" },
        },
        cloud: {
          "0%": { transform: "translateX(-6%)" },
          "100%": { transform: "translateX(6%)" },
        },
        // ---- gacha / reveal juice ----
        rayspin: {
          "0%": { transform: "translate(-50%,-50%) rotate(0deg)" },
          "100%": { transform: "translate(-50%,-50%) rotate(360deg)" },
        },
        shockwave: {
          "0%": { transform: "translate(-50%,-50%) scale(0.2)", opacity: "0.9" },
          "100%": { transform: "translate(-50%,-50%) scale(2.6)", opacity: "0" },
        },
        slamin: {
          "0%": { transform: "scale(2.4)", opacity: "0", filter: "blur(6px)" },
          "55%": { transform: "scale(0.92)", opacity: "1", filter: "blur(0)" },
          "75%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        flashout: {
          "0%": { opacity: "0.95" },
          "100%": { opacity: "0" },
        },
        starpop: {
          "0%": { transform: "scale(0) rotate(-40deg)", opacity: "0" },
          "60%": { transform: "scale(1.35) rotate(8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        bannerin: {
          "0%": { transform: "translateY(18px) scale(0.8)", opacity: "0" },
          "60%": { transform: "translateY(0) scale(1.08)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-7px,4px)" },
          "40%": { transform: "translate(6px,-5px)" },
          "60%": { transform: "translate(-5px,-4px)" },
          "80%": { transform: "translate(5px,5px)" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "1" },
        },
        charge: {
          "0%,100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.12)", filter: "brightness(1.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        risefade: {
          "0%": { transform: "translateY(0) scale(0.8)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateY(-40px) scale(1.1)", opacity: "0" },
        },
        slideinl: {
          "0%": { transform: "translateX(-120%) scale(0.8)", opacity: "0" },
          "65%": { transform: "translateX(6%) scale(1.04)", opacity: "1" },
          "100%": { transform: "translateX(0) scale(1)", opacity: "1" },
        },
        slideinr: {
          "0%": { transform: "translateX(120%) scale(0.8)", opacity: "0" },
          "65%": { transform: "translateX(-6%) scale(1.04)", opacity: "1" },
          "100%": { transform: "translateX(0) scale(1)", opacity: "1" },
        },
        searchspin: {
          "0%": { transform: "rotate(0deg)", filter: "brightness(1)" },
          "50%": { filter: "brightness(1.4)" },
          "100%": { transform: "rotate(360deg)", filter: "brightness(1)" },
        },
        swipein: {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "35%": { opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" },
        },
        burstpop: {
          "0%": { transform: "translate(-50%,-50%) scale(0.2)", opacity: "0.95" },
          "100%": { transform: "translate(-50%,-50%) scale(2.4)", opacity: "0" },
        },
        jump: {
          "0%,100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-34px)" },
          "45%": { transform: "translateY(0)" },
          "62%": { transform: "translateY(-15px)" },
          "80%": { transform: "translateY(0)" },
        },
        riseup: {
          "0%": { transform: "translateY(30px) scale(0.8)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        drip: {
          "0%": { transform: "translateY(-12px) scaleY(0.6)", opacity: "0" },
          "20%": { opacity: "0.9" },
          "100%": { transform: "translateY(150px) scaleY(1.2)", opacity: "0" },
        },
        lunger: {
          "0%": { transform: "translateX(0) rotate(0)" },
          "22%": { transform: "translateX(46px) rotate(-7deg) scale(1.07)" },
          "34%": { transform: "translateX(40px) rotate(-7deg)" },
          "100%": { transform: "translateX(0) rotate(0)" },
        },
        lungel: {
          "0%": { transform: "translateX(0) rotate(0)" },
          "22%": { transform: "translateX(-46px) rotate(7deg) scale(1.07)" },
          "34%": { transform: "translateX(-40px) rotate(7deg)" },
          "100%": { transform: "translateX(0) rotate(0)" },
        },
        shardfly: {
          "0%": { transform: "translateX(0) scaleX(0.4)", opacity: "1" },
          "100%": { transform: "translateX(54px) scaleX(1)", opacity: "0" },
        },
        recoilr: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(26px)" },
          "55%": { transform: "translateX(-6px)" },
        },
        recoill: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-26px)" },
          "55%": { transform: "translateX(6px)" },
        },
        // ---- living idle chamber ----
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        orbitrev: {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        bubble: {
          "0%": { transform: "translateY(10px) scale(0.5)", opacity: "0" },
          "18%": { opacity: "0.85" },
          "100%": { transform: "translateY(-150px) scale(1.05)", opacity: "0" },
        },
        eggglow: {
          "0%,100%": { filter: "drop-shadow(0 0 24px rgba(196,107,255,0.7)) brightness(1)" },
          "50%": { filter: "drop-shadow(0 0 48px rgba(120,200,255,0.95)) brightness(1.18)" },
        },
        feedin: {
          "0%": { transform: "translateY(-12px) scale(0.96)", opacity: "0", maxHeight: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1", maxHeight: "80px" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-18deg)" },
          "100%": { transform: "translateX(220%) skewX(-18deg)" },
        },
        // ---- nursery / breeding ----
        eggwobble: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        eggrattle: {
          "0%,100%": { transform: "translate(0,0) rotate(0)" },
          "20%": { transform: "translate(-3px,0) rotate(-7deg)" },
          "40%": { transform: "translate(3px,0) rotate(7deg)" },
          "60%": { transform: "translate(-2px,0) rotate(-5deg)" },
          "80%": { transform: "translate(2px,0) rotate(5deg)" },
        },
        dashflow: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-24" },
        },
        heartpulse: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.18)", opacity: "1" },
        },
      },
      animation: {
        bob: "bob 3s ease-in-out infinite",
        floaty: "floaty 4s ease-in-out infinite",
        pop: "pop 0.18s ease-out",
        fade: "fade 0.2s ease-out",
        pulseGlow: "pulseGlow 2.2s ease-out infinite",
        breathe: "breathe 2.6s ease-in-out infinite",
        ripple: "ripple 3.4s ease-out infinite",
        contact: "contact 3s ease-in-out infinite",
        sparkle: "sparkle 2.8s ease-in-out infinite",
        flicker: "flicker 0.45s ease-in-out infinite",
        wave: "wave 2.2s ease-in-out infinite",
        aura: "aura 3.5s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        flutter: "flutter 7s ease-in-out infinite alternate",
        wings: "wings 0.3s ease-in-out infinite",
        watershimmer: "watershimmer 7s ease-in-out infinite",
        cloud: "cloud 60s ease-in-out infinite alternate",
        rayspin: "rayspin 9s linear infinite",
        shockwave: "shockwave 0.7s ease-out forwards",
        slamin: "slamin 0.6s cubic-bezier(0.2,0.9,0.3,1.4) forwards",
        flashout: "flashout 0.5s ease-out forwards",
        starpop: "starpop 0.4s cubic-bezier(0.2,0.9,0.3,1.6) forwards",
        bannerin: "bannerin 0.5s cubic-bezier(0.2,0.9,0.3,1.4) forwards",
        shake: "shake 0.5s ease-in-out",
        confetti: "confetti linear forwards",
        charge: "charge 0.5s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        risefade: "risefade 1.1s ease-out forwards",
        slideinl: "slideinl 0.6s cubic-bezier(0.2,0.9,0.3,1.3) forwards",
        slideinr: "slideinr 0.6s cubic-bezier(0.2,0.9,0.3,1.3) forwards",
        searchspin: "searchspin 1.1s linear infinite",
        swipein: "swipein 0.34s ease-out forwards",
        burstpop: "burstpop 0.5s ease-out forwards",
        jump: "jump 0.85s ease-in-out infinite",
        riseup: "riseup 0.55s ease-out forwards",
        drip: "drip 1.8s ease-in infinite",
        lunger: "lunger 0.5s ease-out",
        lungel: "lungel 0.5s ease-out",
        shardfly: "shardfly 0.42s ease-out forwards",
        recoilr: "recoilr 0.42s ease-out",
        recoill: "recoill 0.42s ease-out",
        orbit: "orbit 18s linear infinite",
        orbitrev: "orbitrev 26s linear infinite",
        bubble: "bubble 5.5s ease-in infinite",
        eggglow: "eggglow 4s ease-in-out infinite",
        eggwobble: "eggwobble 2.4s ease-in-out infinite",
        eggrattle: "eggrattle 0.4s ease-in-out infinite",
        dashflow: "dashflow 0.8s linear infinite",
        heartpulse: "heartpulse 1.1s ease-in-out infinite",
        feedin: "feedin 0.5s ease-out",
        sheen: "sheen 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
