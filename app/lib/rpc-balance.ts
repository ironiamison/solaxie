import { Connection, PublicKey } from "@solana/web3.js";
import { fetchWalletSolaxBalance } from "./wallet-balance";

/** RPC endpoints for server-side reads — tries each until balance found. */
export function serverRpcUrls(): string[] {
  const urls = [
    process.env.SOLANA_RPC_URL,
    process.env.HELIUS_RPC_URL,
    process.env.NEXT_PUBLIC_RPC,
    "https://api.mainnet-beta.solana.com",
  ].filter((u): u is string => !!u && u.length > 0);
  return [...new Set(urls)];
}

/** Read SOLAX balance on the server with RPC fallbacks. */
export async function fetchServerSolaxBalance(owner: PublicKey): Promise<number> {
  let best = 0;
  for (const url of serverRpcUrls()) {
    try {
      const connection = new Connection(url, "confirmed");
      const bal = await fetchWalletSolaxBalance(connection, owner);
      if (bal > best) best = bal;
      if (best > 0) return best;
    } catch (e) {
      console.warn("[rpc-balance]", url.slice(0, 40), e);
    }
  }
  return best;
}
