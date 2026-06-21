import dynamic from "next/dynamic";
import { createElement } from "react";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export default function WalletMultiButton() {
  return createElement(WalletMultiButtonDynamic);
}
