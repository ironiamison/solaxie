import { FC, ReactNode, useCallback, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { WalletError } from "@solana/wallet-adapter-base";
import { RPC_URL } from "@/utils/anchor";
import { BurnerWalletAdapter } from "@/utils/burnerWallet";
require("@solana/wallet-adapter-react-ui/styles.css");

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => RPC_URL, []);
  const config = useMemo(() => {
    const wsEndpoint = endpoint.includes("127.0.0.1:8899")
      ? "ws://127.0.0.1:8900"
      : endpoint.includes("localhost:8899")
        ? "ws://localhost:8900"
        : undefined;
    return { commitment: "confirmed" as const, wsEndpoint };
  }, [endpoint]);

  // Phantom/Solflare are auto-detected via Wallet Standard when the extension is installed.
  // Burner is our dev fallback when no extension is present.
  const wallets = useMemo(() => [new BurnerWalletAdapter()], []);

  const onError = useCallback((error: WalletError) => {
    console.error("[wallet]", error);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("solaxie-wallet-error", { detail: error.message ?? String(error) }),
      );
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
