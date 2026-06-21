import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  TOKEN_DECIMALS,
  TOKEN_MINT,
  TOKEN_PROGRAM_FOR_MINT,
} from "@/utils/anchor";
import { solaxPriceToBaseUnits } from "@/lib/token";
import { findSolaxTokenAccount } from "@/lib/wallet-balance";
import { sendWalletTransaction } from "@/lib/wallet-tx";
import type { WalletContextState } from "@solana/wallet-adapter-react";

/** Public burn sink — tokens sent here leave circulation (Solana incinerator). */
export const SOLAX_BURN_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_SOLAX_BURN_WALLET ??
    "1nc1nerator11111111111111111111111111111111",
);

export function burnWalletAta(): PublicKey {
  return getAssociatedTokenAddressSync(
    TOKEN_MINT,
    SOLAX_BURN_WALLET,
    true,
    TOKEN_PROGRAM_FOR_MINT,
  );
}

/** Transfer pump.fun SOLAX to the burn wallet. */
export async function transferSolaxToBurnWallet(
  connection: Connection,
  wallet: Pick<WalletContextState, "publicKey" | "sendTransaction" | "signTransaction">,
  priceWhole: number,
): Promise<TransactionSignature> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Wallet not connected");

  const amount = solaxPriceToBaseUnits(priceWhole, TOKEN_DECIMALS);
  if (amount <= BigInt(0)) throw new Error("Invalid burn amount");

  const sourceInfo = await findSolaxTokenAccount(connection, owner);
  if (!sourceInfo) {
    throw new Error("No SOLAX in wallet — buy SOLAX on pump.fun first");
  }
  if (sourceInfo.balance < priceWhole) {
    throw new Error(
      `Need ${priceWhole.toLocaleString()} SOLAX (you have ${Math.floor(sourceInfo.balance).toLocaleString()})`,
    );
  }

  const source = sourceInfo.account;
  const destination = burnWalletAta();
  const tx = new Transaction();

  const destInfo = await connection.getAccountInfo(destination);
  if (!destInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        owner,
        destination,
        SOLAX_BURN_WALLET,
        TOKEN_MINT,
        TOKEN_PROGRAM_FOR_MINT,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  tx.add(
    createTransferInstruction(
      source,
      destination,
      owner,
      amount,
      [],
      TOKEN_PROGRAM_FOR_MINT,
    ),
  );

  return sendWalletTransaction(connection, wallet, tx);
}

/** Confirm a tx moved at least `priceWhole` SOLAX from `owner` toward the burn wallet. */
export async function verifySolaxBurnTransfer(
  connection: Connection,
  signature: string,
  owner: PublicKey,
  priceWhole: number,
): Promise<boolean> {
  const minRaw = solaxPriceToBaseUnits(priceWhole, TOKEN_DECIMALS);
  const mint = TOKEN_MINT.toBase58();
  const ownerStr = owner.toBase58();
  const burnAta = burnWalletAta().toBase58();

  const sourceAta = (await findSolaxTokenAccount(connection, owner))?.account.toBase58();

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));

    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx?.meta || tx.meta.err) continue;

    const pre = tx.meta.preTokenBalances ?? [];
    const post = tx.meta.postTokenBalances ?? [];

    let fromOwner = BigInt(0);
    let toBurn = BigInt(0);

    for (const preBal of pre) {
      if (preBal.mint !== mint) continue;
      const postBal = post.find((p) => p.accountIndex === preBal.accountIndex);
      if (!postBal) continue;

      const preAmt = BigInt(preBal.uiTokenAmount?.amount ?? "0");
      const postAmt = BigInt(postBal.uiTokenAmount?.amount ?? "0");
      if (postAmt >= preAmt) continue;

      const delta = preAmt - postAmt;
      const acct = accountAtIndex(tx, preBal.accountIndex);

      if (preBal.owner === ownerStr || acct === sourceAta) fromOwner += delta;
      if (acct === burnAta) toBurn += delta;
    }

    for (const postBal of post) {
      if (postBal.mint !== mint) continue;
      const preBal = pre.find((p) => p.accountIndex === postBal.accountIndex);
      if (preBal) continue;

      const postAmt = BigInt(postBal.uiTokenAmount?.amount ?? "0");
      const acct = accountAtIndex(tx, postBal.accountIndex);
      if (acct === burnAta) toBurn += postAmt;
    }

    if (fromOwner >= minRaw || toBurn >= minRaw) return true;
  }

  return false;
}

function accountAtIndex(
  tx: NonNullable<Awaited<ReturnType<Connection["getParsedTransaction"]>>>,
  index: number,
): string | undefined {
  const keys = tx.transaction.message.accountKeys;
  const key = keys[index];
  if (!key) return undefined;
  if (typeof key === "string") return key;
  return key.pubkey.toBase58();
}
