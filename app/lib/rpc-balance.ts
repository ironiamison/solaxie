import { Connection, PublicKey } from "@solana/web3.js";
import { fetchWalletSolaxBalance, findSolaxTokenAccount } from "./wallet-balance";

/** RPC endpoints for server-side reads — tries each until balance found. */
export function serverRpcUrls(): string[] {
  const urls = [
    process.env.SOLANA_RPC_URL,
    process.env.HELIUS_RPC_URL,
    process.env.NEXT_PUBLIC_RPC,
    "https://rpc.ankr.com/solana",
    "https://api.mainnet-beta.solana.com",
  ].filter((u): u is string => !!u && u.length > 0);
  return [...new Set(urls)];
}

/** Find the SPL token account + balance on the server (reliable for Token-2022). */
export async function fetchServerSolaxTokenAccount(
  owner: PublicKey,
): Promise<{ account: PublicKey; balance: number } | null> {
  const urls = serverRpcUrls();
  const attempts = await Promise.allSettled(
    urls.map(async (url) => {
      const connection = new Connection(url, "confirmed");
      const found = await findSolaxTokenAccount(connection, owner);
      if (!found?.balance) throw new Error("empty");
      return found;
    }),
  );

  let best: { account: PublicKey; balance: number } | null = null;
  for (const attempt of attempts) {
    if (attempt.status !== "fulfilled") continue;
    const found = attempt.value;
    if (!best || found.balance > best.balance) best = found;
  }
  return best;
}

/** Read SOLAX balance on the server with RPC fallbacks. */
export async function fetchServerSolaxBalance(owner: PublicKey): Promise<number> {
  const found = await fetchServerSolaxTokenAccount(owner);
  return found?.balance ?? 0;
}
