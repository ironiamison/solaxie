import {
  BaseSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionVersion,
} from "@solana/web3.js";

const STORAGE_KEY = "solaxie-burner-secret";

/** Load a persistent burner keypair from localStorage (created on first use). */
function loadKeypair(): Keypair {
  if (typeof window === "undefined") return Keypair.generate();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored)));
    } catch {
      /* fall through and regenerate */
    }
  }
  const kp = Keypair.generate();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

export const BurnerWalletName = "Burner (Local)" as WalletName<"Burner (Local)">;

const ICON =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#9f7aea"/><text x="32" y="42" font-size="32" text-anchor="middle" fill="white">🔥</text></svg>`
  ).toString("base64");

/**
 * A self-contained wallet adapter backed by a browser-local keypair. Great for local/devnet
 * testing without installing an extension. NEVER use for real funds.
 */
export class BurnerWalletAdapter extends BaseSignerWalletAdapter {
  name = BurnerWalletName;
  url = "https://solana.com";
  icon = ICON;
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> =
    new Set<TransactionVersion>(["legacy", 0]);
  readyState: WalletReadyState = WalletReadyState.Installed;

  private _keypair: Keypair | null = null;
  private _connecting = false;

  get connecting(): boolean {
    return this._connecting;
  }

  get publicKey(): PublicKey | null {
    return this._keypair ? this._keypair.publicKey : null;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    this._connecting = true;
    try {
      this._keypair = loadKeypair();
      this.emit("connect", this._keypair.publicKey);
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this._keypair = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this._keypair) throw new Error("Burner wallet not connected");
    if (tx instanceof VersionedTransaction) {
      tx.sign([this._keypair]);
    } else {
      tx.partialSign(this._keypair);
    }
    return tx;
  }
}
