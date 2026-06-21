import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

type Win = Window & typeof globalThis & {
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
    };
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  onError?: (message: string) => void;
};

/** Wallet picker that connects inside the click handler (required for Phantom popup). */
export function ConnectWalletModal({ open, onClose, onError }: Props) {
  const { wallets, select, connect } = useWallet();
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const [connecting, setConnecting] = useState(false);
  const [fade, setFade] = useState(false);

  const sorted = useMemo(() => {
    const rank = (w: Wallet) => {
      if (w.readyState === WalletReadyState.Installed) return 0;
      if (w.readyState === WalletReadyState.Loadable) return 1;
      return 2;
    };
    return [...wallets].sort((a, b) => rank(a) - rank(b));
  }, [wallets]);

  useEffect(() => {
    if (!open) {
      setFade(false);
      return;
    }
    const t = requestAnimationFrame(() => setFade(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pick = useCallback(
    async (w: Wallet) => {
      if (connecting) return;
      setConnecting(true);
      try {
        const name = w.adapter.name;

        // Phantom blocks connect() unless it runs inside the original click gesture.
        if (/phantom/i.test(name) && typeof window !== "undefined") {
          const phantom = (window as Win).phantom?.solana;
          if (phantom?.isPhantom) {
            await phantom.connect();
            flushSync(() => select(name));
            await connectRef.current();
            onClose();
            return;
          }
        }

        flushSync(() => select(name));
        await connectRef.current();
        onClose();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[ConnectWalletModal]", e);
        onError?.(
          msg.includes("User rejected") || msg.includes("rejected")
            ? "Connection cancelled in wallet."
            : `Could not connect: ${msg}`,
        );
      } finally {
        setConnecting(false);
      }
    },
    [connecting, onClose, onError, select],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`wallet-adapter-modal ${fade ? "wallet-adapter-modal-fade-in" : ""}`}
      role="dialog"
      aria-label="Connect wallet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="wallet-adapter-modal-wrapper">
        <button
          type="button"
          className="wallet-adapter-modal-button-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" aria-hidden>
            <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <h1 className="wallet-adapter-modal-title">Connect a wallet on Solana to continue</h1>
        <p className="wallet-adapter-modal-subtitle mb-4 text-center text-sm text-white/55">
          Play and earn activity tickets for creator rewards.
        </p>
        <ul className="wallet-adapter-modal-list">
          {sorted.map((w) => (
            <li key={w.adapter.name}>
              <button
                type="button"
                className="wallet-adapter-button"
                disabled={connecting}
                onClick={() => void pick(w)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.adapter.icon} alt="" width={28} height={28} className="wallet-adapter-button-start-icon" />
                {w.adapter.name}
                {w.readyState === WalletReadyState.Installed && <span>Detected</span>}
              </button>
            </li>
          ))}
        </ul>
        {connecting ? (
          <p className="mt-3 text-center text-sm text-white/60">Approve in your wallet…</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
