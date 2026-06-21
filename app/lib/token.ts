/** Stable numeric ids for on-chain shop purchase events (sku field). */
export function shopSku(itemId: string): number {
  let h = 0;
  for (let i = 0; i < itemId.length; i++) {
    h = (Math.imul(31, h) + itemId.charCodeAt(i)) | 0;
  }
  return (h >>> 0) || 1;
}

/** In-game SOLAX price → SPL base units (1 price unit = 1 whole token). */
export function solaxPriceToBaseUnits(price: number, decimals: number): bigint {
  const factor = BigInt(Math.pow(10, decimals));
  return BigInt(Math.floor(price)) * factor;
}

/** SPL base units → display whole tokens. */
export function baseUnitsToTokens(amount: bigint, decimals: number): number {
  const factor = BigInt(Math.pow(10, decimals));
  return Number(amount / factor);
}
