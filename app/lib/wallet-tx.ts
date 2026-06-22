import {
  Connection,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { getPhantom, phantomMatches, phantomSignAndSend } from "@/lib/phantom";

type SendOpts = {
  blockhash?: string;
  lastValidBlockHeight?: number;
  /** When true, keep the tx blockhash (e.g. from server /api/build-burn). */
  preserveBlockhash?: boolean;
};

type WalletSigner = Pick<WalletContextState, "publicKey" | "sendTransaction" | "signTransaction">;

const SIGN_TIMEOUT_MS = 120_000;

function userRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /reject|cancel|denied|declined/i.test(msg);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/** Sign + send — Phantom direct first, then wallet adapter fallbacks. */
export async function sendWalletTransaction(
  connection: Connection,
  wallet: WalletSigner,
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

  const sendRaw = async (signed: Transaction): Promise<TransactionSignature> =>
    connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    });

  const timeoutMsg =
    "Phantom did not open — click the Phantom extension icon (puzzle piece) and approve the transaction, or unlock Phantom and try again";

  let sig: TransactionSignature | null = null;
  let lastErr: unknown;

  // 1) Direct Phantom API — most reliable popup after async server prep.
  if (getPhantom() && (phantomMatches(owner) || !wallet.sendTransaction)) {
    try {
      sig = await withTimeout(
        phantomSignAndSend(connection, owner, tx),
        SIGN_TIMEOUT_MS,
        timeoutMsg,
      );
    } catch (e) {
      lastErr = e;
      if (userRejected(e)) throw e;
      console.warn("[wallet-tx] phantom direct failed", e);
    }
  }

  // 2) Wallet adapter sendTransaction (opens wallet UI on most adapters).
  if (!sig && wallet.sendTransaction) {
    try {
      sig = await withTimeout(
        wallet.sendTransaction(tx, connection, {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }),
        SIGN_TIMEOUT_MS,
        timeoutMsg,
      );
    } catch (firstErr) {
      lastErr = firstErr;
      if (userRejected(firstErr)) throw firstErr;
      console.warn("[wallet-tx] sendTransaction failed, retrying with preflight", firstErr);
      try {
        sig = await withTimeout(
          wallet.sendTransaction(tx, connection, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          }),
          SIGN_TIMEOUT_MS,
          timeoutMsg,
        );
      } catch (secondErr) {
        lastErr = secondErr;
        if (userRejected(secondErr)) throw secondErr;
      }
    }
  }

  // 3) signTransaction + raw send.
  if (!sig && wallet.signTransaction) {
    try {
      const signed = await withTimeout(
        wallet.signTransaction(tx),
        SIGN_TIMEOUT_MS,
        timeoutMsg,
      );
      sig = await sendRaw(signed);
    } catch (e) {
      lastErr = e;
      if (userRejected(e)) throw e;
      console.warn("[wallet-tx] signTransaction path failed", e);
    }
  }

  if (!sig) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error("Wallet cannot sign — open Phantom, unlock it, and reconnect on Solaxie");
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
