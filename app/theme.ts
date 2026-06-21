import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// Neon accents tuned for the dark "arena" backdrop. Class colors are the brighter
// variants of the on-chain palette so creature cards pop against the dark UI.
export const CLASS_NEON: Record<string, string> = {
  Beast: "#ffa83d",
  Aquatic: "#3db4ff",
  Plant: "#54e07a",
  Bird: "#ff5fb0",
  Bug: "#a779ff",
  Reptile: "#2fe0cf",
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Baloo 2', system-ui, sans-serif`,
    body: `'Inter', system-ui, sans-serif`,
  },
  colors: {
    brand: {
      50: "#f3e9ff",
      100: "#d9bdff",
      200: "#bf90ff",
      300: "#a463ff",
      400: "#8a37ff",
      500: "#711eff",
      600: "#5912d6",
      700: "#410da0",
      800: "#29076b",
      900: "#140337",
    },
    ink: {
      900: "#0a0612",
      850: "#0f0a1d",
      800: "#150f29",
      750: "#1c1436",
      700: "#241945",
      600: "#2f2057",
    },
  },
  styles: {
    global: {
      "html, body, #__next": {
        bg: "#0a0612",
        color: "whiteAlpha.900",
        minH: "100%",
      },
      "::selection": { background: "rgba(138,55,255,0.4)" },
      "::-webkit-scrollbar": { width: "10px", height: "10px" },
      "::-webkit-scrollbar-thumb": {
        background: "rgba(138,55,255,0.45)",
        borderRadius: "8px",
      },
      "::-webkit-scrollbar-track": { background: "transparent" },
    },
  },
  components: {
    Button: {
      baseStyle: { fontWeight: 700, borderRadius: "xl", letterSpacing: "0.2px" },
      variants: {
        neon: {
          color: "white",
          bgGradient: "linear(to-r, #8a37ff, #d63cff)",
          boxShadow: "0 8px 24px rgba(138,55,255,0.45)",
          _hover: {
            bgGradient: "linear(to-r, #9a4dff, #e055ff)",
            transform: "translateY(-1px)",
            boxShadow: "0 12px 30px rgba(138,55,255,0.6)",
            _disabled: { transform: "none" },
          },
          _active: { transform: "translateY(0)" },
        },
        neonPink: {
          color: "white",
          bgGradient: "linear(to-r, #ff3d9a, #ff7a3d)",
          boxShadow: "0 8px 24px rgba(255,61,154,0.4)",
          _hover: {
            bgGradient: "linear(to-r, #ff55a8, #ff8f55)",
            transform: "translateY(-1px)",
          },
        },
        neonRed: {
          color: "white",
          bgGradient: "linear(to-r, #ff4d4d, #ff2d7a)",
          boxShadow: "0 8px 24px rgba(255,77,77,0.4)",
          _hover: {
            bgGradient: "linear(to-r, #ff6363, #ff4d8f)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
  },
});

export default theme;
