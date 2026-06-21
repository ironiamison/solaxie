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

type ParsedTokenAccountEntry = {
  pubkey: PublicKey;
  account: ParsedTokenAccount["account"];
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

function uiFromTokenAmount(t: { uiAmount: number | null; amount: string; decimals: number }): number {
  return t.uiAmount ?? uiFromRaw(t.amount, t.decimals || TOKEN_DECIMALS);
}

/** Find the token account that actually holds SOLAX (not always the derived ATA). */
export async function findSolaxTokenAccount(
  connection: Connection,
  owner: PublicKey,
): Promise<{ account: PublicKey; balance: number } | null> {
  let best: { account: PublicKey; balance: number } | null = null;

  const consider = (account: PublicKey, balance: number) => {
    if (balance > 0 && (!best || balance > best.balance)) {
      best = { account, balance };
    }
  };

  try {
    const byProgram = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_FOR_MINT,
    });
    for (const entry of byProgram.value as ParsedTokenAccountEntry[]) {
      const info = entry.account.data.parsed.info;
      if (info.mint !== TOKEN_MINT.toBase58()) continue;
      consider(entry.pubkey, uiFromTokenAmount(info.tokenAmount));
    }
  } catch (e) {
    console.warn("[wallet-balance] program scan", e);
  }

  if (!best) {
    try {
      const byMint = await connection.getParsedTokenAccountsByOwner(owner, {
        mint: TOKEN_MINT,
        programId: TOKEN_PROGRAM_FOR_MINT,
      });
      for (const entry of byMint.value as ParsedTokenAccountEntry[]) {
        consider(entry.pubkey, uiFromTokenAmount(entry.account.data.parsed.info.tokenAmount));
      }
    } catch (e) {
      console.warn("[wallet-balance] mint scan", e);
    }
  }

  if (best) return best;

  try {
    const ata = playerAta(owner);
    const bal = await connection.getTokenAccountBalance(ata);
    const ui = bal.value.uiAmount ?? uiFromRaw(bal.value.amount, bal.value.decimals);
    if (ui > 0) return { account: ata, balance: ui };
  } catch {
    // no ATA
  }

  return null;
}

/** Read SOLAX in the connected wallet — Token-2022 (pump.fun) safe. */
export async function fetchWalletSolaxBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<number> {
  const found = await findSolaxTokenAccount(connection, owner);
  return found?.balance ?? 0;
}
