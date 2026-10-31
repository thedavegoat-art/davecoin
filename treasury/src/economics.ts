/** Entire supply notionally ≈ €1 */
export const ECONOMICS = {
  name: "DaveCoin",
  symbol: "DAVE",
  decimals: 9,
  totalSupplyUi: 1_000_000_000,
  notionalFdvEur: 1,
  /** EUR per 1 DAVE (UI unit) */
  eurPerDave: 1e-9,
  /** 1 ledger credit = 1 DAVE */
  creditsPerDave: 1,
} as const;

export function eurNotional(daveUi: number): number {
  return daveUi * ECONOMICS.eurPerDave;
}

export function formatEur(daveUi: number): string {
  const eur = eurNotional(daveUi);
  if (eur < 0.01) return `≈ €${eur.toExponential(2)}`;
  return `≈ €${eur.toFixed(4)}`;
}
