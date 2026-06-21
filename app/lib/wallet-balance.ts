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

/** Read SOLAX in the connected wallet — Token-2022 safe, no chain client required. */
export async function fetchWalletSolaxBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<number> {
  try {
    const byMint = await connection.getParsedTokenAccountsByOwner(owner, { mint: TOKEN_MINT });
    if (byMint.value.length > 0) {
      return sumBalances(byMint.value as ParsedTokenAccount[]);
    }
  } catch (e) {
    console.warn("[wallet-balance] mint scan", e);
  }

  try {
    const byProgram = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_FOR_MINT,
    });
    const ours = (byProgram.value as ParsedTokenAccount[]).filter(
      (a) => a.account.data.parsed.info.mint === TOKEN_MINT.toBase58(),
    );
    if (ours.length > 0) return sumBalances(ours);
  } catch (e) {
    console.warn("[wallet-balance] program scan", e);
  }

  try {
    const bal = await connection.getTokenAccountBalance(playerAta(owner));
    return bal.value.uiAmount ?? 0;
  } catch {
    return 0;
  }
}
