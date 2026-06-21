import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  TOKEN_DECIMALS,
  TOKEN_MINT,
  TOKEN_PROGRAM_FOR_MINT,
} from "@/utils/anchor";
import { solaxPriceToBaseUnits } from "@/lib/token";
import { findSolaxTokenAccount, type SolaxTokenAccount } from "@/lib/wallet-balance";
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

export type BuiltBurnTx = {
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
  source: PublicKey;
  balance: number;
};

/** Build unsigned SOLAX → burn wallet transfer (Token-2022 / pump.fun safe). */
export async function buildSolaxBurnTransaction(
  connection: Connection,
  owner: PublicKey,
  priceWhole: number,
  sourceAccount: PublicKey,
): Promise<BuiltBurnTx> {
  const amount = solaxPriceToBaseUnits(priceWhole, TOKEN_DECIMALS);
  if (amount <= BigInt(0)) throw new Error("Invalid burn amount");

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
    createTransferCheckedInstruction(
      sourceAccount,
      TOKEN_MINT,
      destination,
      owner,
      amount,
      TOKEN_DECIMALS,
      [],
      TOKEN_PROGRAM_FOR_MINT,
    ),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = owner;
  tx.recentBlockhash = blockhash;

  return {
    transaction: tx,
    blockhash,
    lastValidBlockHeight,
    source: sourceAccount,
    balance: 0,
  };
}

export function serializeBurnTransaction(tx: Transaction): string {
  return Buffer.from(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  ).toString("base64");
}

export function deserializeBurnTransaction(encoded: string): Transaction {
  return Transaction.from(Buffer.from(encoded, "base64"));
}

/** Transfer pump.fun SOLAX to the burn wallet. */
export async function transferSolaxToBurnWallet(
  connection: Connection,
  wallet: Pick<WalletContextState, "publicKey" | "sendTransaction" | "signTransaction">,
  priceWhole: number,
  sourceOverride: SolaxTokenAccount,
  built?: Pick<BuiltBurnTx, "blockhash" | "lastValidBlockHeight">,
): Promise<TransactionSignature> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Wallet not connected");

  if (sourceOverride.balance < priceWhole) {
    throw new Error(
      `Need ${priceWhole.toLocaleString()} SOLAX (you have ${Math.floor(sourceOverride.balance).toLocaleString()})`,
    );
  }

  const builtTx = await buildSolaxBurnTransaction(
    connection,
    owner,
    priceWhole,
    sourceOverride.account,
  );

  return sendWalletTransaction(connection, wallet, builtTx.transaction, {
    blockhash: built?.blockhash ?? builtTx.blockhash,
    lastValidBlockHeight: built?.lastValidBlockHeight ?? builtTx.lastValidBlockHeight,
    preserveBlockhash: !!built,
  });
}

/** Confirm a tx moved at least `priceWhole` SOLAX from `owner` toward the burn wallet. */
export async function verifySolaxBurnTransfer(
  connection: Connection,
  signature: string,
  owner: PublicKey,
  priceWhole: number,
  sourceAccount?: PublicKey,
): Promise<boolean> {
  const minRaw = solaxPriceToBaseUnits(priceWhole, TOKEN_DECIMALS);
  const mint = TOKEN_MINT.toBase58();
  const ownerStr = owner.toBase58();
  const burnAta = burnWalletAta().toBase58();

  const sourceAta =
    sourceAccount?.toBase58() ??
    (await findSolaxTokenAccount(connection, owner))?.account.toBase58();

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
