import { FC, ReactNode, useCallback, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { WalletError } from "@solana/wallet-adapter-base";
import { RPC_URL } from "@/utils/anchor";
import { BurnerWalletAdapter } from "@/utils/burnerWallet";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
require("@solana/wallet-adapter-react-ui/styles.css");

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => RPC_URL, []);
  const config = useMemo(
    () => ({ commitment: "confirmed" as const }),
    [],
  );

  // Phantom for real wallets; Burner for local testing without an extension.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new BurnerWalletAdapter()],
    [],
  );

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
