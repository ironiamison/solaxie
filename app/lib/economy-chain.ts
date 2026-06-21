import { Connection } from "@solana/web3.js";
import { TOKEN_DECIMALS, vaultPDA } from "@/utils/anchor";

/** SPL tokens sitting in the program treasury vault (on-chain shop sinks). */
export async function fetchVaultSolax(): Promise<number> {
  const rpc =
    process.env.NEXT_PUBLIC_RPC ??
    (process.env.NODE_ENV === "production"
      ? "https://api.mainnet-beta.solana.com"
      : "http://127.0.0.1:8899");

  try {
    const conn = new Connection(rpc, "confirmed");
    const bal = await conn.getTokenAccountBalance(vaultPDA);
    return Number(bal.value.amount) / Math.pow(10, TOKEN_DECIMALS);
  } catch {
    return 0;
  }
}
