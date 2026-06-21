import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

/** Sign + send via wallet adapter (sendTransaction or signTransaction fallback). */
export async function sendWalletTransaction(
  connection: Connection,
  wallet: Pick<WalletContextState, "publicKey" | "sendTransaction" | "signTransaction">,
  tx: Transaction,
): Promise<TransactionSignature> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Wallet not connected");

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = owner;
  tx.recentBlockhash = blockhash;

  let sig: TransactionSignature;

  if (wallet.sendTransaction) {
    try {
      // skipPreflight avoids RPC simulation failures blocking the wallet popup.
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

  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}
