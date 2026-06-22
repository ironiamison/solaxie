import { Connection, PublicKey, Transaction, type TransactionSignature } from "@solana/web3.js";

export type PhantomSolana = {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: PublicKey;
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
  signAndSendTransaction?: (
    tx: Transaction,
    opts?: { skipPreflight?: boolean; maxRetries?: number; preflightCommitment?: string },
  ) => Promise<{ signature: string }>;
};

export function getPhantom(): PhantomSolana | null {
  if (typeof window === "undefined") return null;
  const p = (window as { phantom?: { solana?: PhantomSolana } }).phantom?.solana;
  return p?.isPhantom ? p : null;
}

/** True when Phantom extension is present and linked to this pubkey. */
export function phantomMatches(owner: PublicKey): boolean {
  const phantom = getPhantom();
  if (!phantom?.publicKey) return false;
  try {
    return phantom.publicKey.equals(owner);
  } catch {
    return phantom.publicKey.toBase58() === owner.toBase58();
  }
}

export async function ensurePhantomConnected(phantom: PhantomSolana): Promise<void> {
  if (phantom.publicKey) return;
  try {
    await phantom.connect?.({ onlyIfTrusted: true });
  } catch {
    await phantom.connect?.();
  }
}

export async function phantomSignAndSend(
  connection: Connection,
  owner: PublicKey,
  tx: Transaction,
): Promise<TransactionSignature> {
  const phantom = getPhantom();
  if (!phantom) throw new Error("Phantom wallet not detected — install the extension or use the Phantom app");

  await ensurePhantomConnected(phantom);

  if (phantom.publicKey && !phantom.publicKey.equals(owner)) {
    throw new Error("Phantom is on a different wallet — switch accounts in Phantom to match Solaxie");
  }

  tx.feePayer = owner;

  if (phantom.signAndSendTransaction) {
    const { signature } = await phantom.signAndSendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    });
    return signature;
  }

  if (phantom.signTransaction) {
    const signed = await phantom.signTransaction(tx);
    return connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    });
  }

  throw new Error("Phantom cannot sign — update the extension and reconnect");
}
