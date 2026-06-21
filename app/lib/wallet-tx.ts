import {
  Connection,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

type SendOpts = {
  blockhash?: string;
  lastValidBlockHeight?: number;
  /** When true, keep the tx blockhash (e.g. from server /api/build-burn). */
  preserveBlockhash?: boolean;
};

/** Sign + send via wallet adapter (sendTransaction or signTransaction fallback). */
export async function sendWalletTransaction(
  connection: Connection,
  wallet: Pick<WalletContextState, "publicKey" | "sendTransaction" | "signTransaction">,
  tx: Transaction,
  opts?: SendOpts,
): Promise<TransactionSignature> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Wallet not connected");

  let blockhash = opts?.blockhash ?? tx.recentBlockhash ?? null;
  let lastValidBlockHeight = opts?.lastValidBlockHeight;

  if (!blockhash || !opts?.preserveBlockhash) {
    try {
      const latest = await connection.getLatestBlockhash("confirmed");
      blockhash = latest.blockhash;
      lastValidBlockHeight = latest.lastValidBlockHeight;
    } catch (e) {
      if (!blockhash) throw e;
      console.warn("[wallet-tx] client blockhash failed, using provided blockhash", e);
    }
  }

  tx.feePayer = owner;
  tx.recentBlockhash = blockhash;

  let sig: TransactionSignature;

  if (wallet.sendTransaction) {
    try {
      sig = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
    } catch (firstErr) {
      console.warn("[wallet-tx] skipPreflight send failed, retrying with preflight", firstErr);
      sig = await wallet.sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    }
  } else if (wallet.signTransaction) {
    const signed = await wallet.signTransaction(tx);
    sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
  } else {
    throw new Error("Wallet cannot sign transactions — reconnect your wallet");
  }

  if (blockhash && lastValidBlockHeight) {
    try {
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );
    } catch (confirmErr) {
      console.warn("[wallet-tx] confirm pending — tx may still land", sig, confirmErr);
    }
  }

  return sig;
}
