import { Connection, PublicKey } from "@solana/web3.js";
import { fetchWalletSolaxBalance, findSolaxTokenAccount } from "./wallet-balance";

/** RPC endpoints for server-side reads — tries each until balance found. */
export function serverRpcUrls(): string[] {
  const urls = [
    process.env.SOLANA_RPC_URL,
    process.env.HELIUS_RPC_URL,
    process.env.NEXT_PUBLIC_RPC,
    "https://api.mainnet-beta.solana.com",
  ].filter((u): u is string => !!u && u.length > 0);
  return Array.from(new Set(urls));
}

/** Find the SPL token account + balance on the server (reliable for Token-2022). */
export async function fetchServerSolaxTokenAccount(
  owner: PublicKey,
): Promise<{ account: PublicKey; balance: number } | null> {
  const urls = serverRpcUrls();
  for (const url of urls) {
    try {
      const connection = new Connection(url, "confirmed");
      const found = await findSolaxTokenAccount(connection, owner);
      if (found?.balance && found.balance > 0) return found;
    } catch {
      // try next RPC
    }
  }
  return null;
}

/** Read SOLAX balance on the server with RPC fallbacks. */
export async function fetchServerSolaxBalance(owner: PublicKey): Promise<number> {
  const found = await fetchServerSolaxTokenAccount(owner);
  return found?.balance ?? 0;
}
