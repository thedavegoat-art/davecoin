/** Defaults match live pump.fun DaveCoin (6 decimals). Override via env. */
export const ECONOMICS = {
  name: "DaveCoin",
  symbol: "DAVE",
  decimals: Number(process.env.DAVE_DECIMALS ?? 6),
  totalSupplyUi: 1_000_000_000,
  /** Informal display only — live FDV is market-driven on pump.fun */
  notionalFdvEur: Number(process.env.NOTIONAL_FDV_EUR ?? 0),
  eurPerDave: Number(process.env.EUR_PER_DAVE ?? 0),
  creditsPerDave: 1,
  mint: process.env.DAVE_MINT ?? "jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
  buyUrl:
    process.env.BUY_URL ??
    "https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
} as const;

export function eurNotional(daveUi: number): number {
  return daveUi * ECONOMICS.eurPerDave;
}

export function formatEur(daveUi: number): string {
  if (!(ECONOMICS.eurPerDave > 0)) return "market-priced (pump.fun)";
  const eur = eurNotional(daveUi);
  if (eur < 0.01) return `≈ €${eur.toExponential(2)}`;
  return `≈ €${eur.toFixed(4)}`;
}
