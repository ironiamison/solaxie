import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_DECIMALS,
  TOKEN_MINT,
  TOKEN_PROGRAM_FOR_MINT,
  playerAta,
} from "@/utils/anchor";

type ParsedTokenAccount = {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: { uiAmount: number | null; amount: string; decimals: number };
        };
      };
    };
  };
};

function sumBalances(accounts: ParsedTokenAccount[]): number {
  return accounts.reduce((sum, a) => {
    const t = a.account.data.parsed.info.tokenAmount;
    const ui = t.uiAmount ?? Number(t.amount) / 10 ** (t.decimals || TOKEN_DECIMALS);
    return sum + ui;
  }, 0);
}

function uiFromRaw(amount: string, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

/** Read SOLAX in the connected wallet — Token-2022 (pump.fun) safe. */
export async function fetchWalletSolaxBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<number> {
  let best = 0;

  // 1. Direct ATA (fast path when account exists).
  try {
    const bal = await connection.getTokenAccountBalance(playerAta(owner));
    const ui = bal.value.uiAmount ?? uiFromRaw(bal.value.amount, bal.value.decimals);
    if (ui > best) best = ui;
  } catch {
    // ATA may not exist yet.
  }

  // 2. Token-2022 program scan (pump.fun mint).
  try {
    const byProgram = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_FOR_MINT,
    });
    const ours = (byProgram.value as ParsedTokenAccount[]).filter(
      (a) => a.account.data.parsed.info.mint === TOKEN_MINT.toBase58(),
    );
    if (ours.length > 0) {
      const ui = sumBalances(ours);
      if (ui > best) best = ui;
    }
  } catch (e) {
    console.warn("[wallet-balance] program scan", e);
  }

  // 3. Mint filter fallback.
  try {
    const byMint = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: TOKEN_MINT,
      programId: TOKEN_PROGRAM_FOR_MINT,
    });
    if (byMint.value.length > 0) {
      const ui = sumBalances(byMint.value as ParsedTokenAccount[]);
      if (ui > best) best = ui;
    }
  } catch (e) {
    console.warn("[wallet-balance] mint scan", e);
  }

  return best;
}
