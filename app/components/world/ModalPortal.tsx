import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Render modals on document.body so they aren't clipped by screen scroll containers. */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
