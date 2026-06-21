import type { AppProps } from "next/app";
import WalletContextProvider from "@/contexts/WalletContextProvider";
import "../styles/globals.css";

// NOTE: Benign "Failed to connect to MetaMask" noise from wallet browser
// extensions (inpage.js) is silenced by an inline script in `pages/_document.tsx`,
// which runs before Next's dev error overlay attaches its own handlers.
export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletContextProvider>
      <Component {...pageProps} />
    </WalletContextProvider>
  );
}
