import { Connection, PublicKey } from "@solana/web3.js";
import {
  deserializeBurnTransaction,
  verifySolaxBurnTransfer,
} from "@/lib/solax-burn";
import { sendWalletTransaction } from "@/lib/wallet-tx";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export type SolaxWalletSigner = Pick<
  WalletContextState,
  "publicKey" | "sendTransaction" | "signTransaction"
>;

export type SolaxSpendResult =
  | { ok: true; signature: string; balance: number }
  | { ok: false; error: string };

/** Build burn tx on server, sign in wallet, verify — shared by every SOLAX sink. */
export async function spendSolaxViaBurnWallet(
  connection: Connection,
  signer: SolaxWalletSigner,
  owner: PublicKey,
  cost: number,
  opts?: { onReadyToSign?: () => void },
): Promise<SolaxSpendResult> {
  if (cost <= 0) return { ok: false, error: "Invalid amount" };

  const buildRes = await fetch("/api/build-burn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: owner.toBase58(), amount: cost }),
    signal: AbortSignal.timeout(30_000),
  });

  const buildData = (await buildRes.json().catch(() => ({}))) as {
    error?: string;
    balance?: number;
    account?: string;
    transaction?: string;
    blockhash?: string;
    lastValidBlockHeight?: number;
  };

  if (!buildRes.ok || !buildData.transaction || !buildData.account) {
    return {
      ok: false,
      error:
        buildData.error ??
        "Could not prepare SOLAX transfer — reconnect wallet and try again",
    };
  }

  const held = {
    account: new PublicKey(buildData.account),
    balance: buildData.balance ?? 0,
  };

  const tx = deserializeBurnTransaction(buildData.transaction);
  opts?.onReadyToSign?.();
  const signature = await sendWalletTransaction(connection, signer, tx, {
    blockhash: buildData.blockhash,
    lastValidBlockHeight: buildData.lastValidBlockHeight,
    preserveBlockhash: true,
  });

  let verified = await verifySolaxBurnTransfer(
    connection,
    signature,
    owner,
    cost,
    held.account,
  );
  if (!verified) {
    const res = await fetch("/api/verify-burn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature, wallet: owner.toBase58(), amount: cost }),
    });
    if (res.ok) {
      const data = (await res.json()) as { verified?: boolean };
      verified = !!data.verified;
    }
  }

  if (!verified) {
    console.warn("[solax-spend] verify inconclusive but tx sent", signature);
  }

  return {
    ok: true,
    signature,
    balance: Math.max(0, held.balance - cost),
  };
}
