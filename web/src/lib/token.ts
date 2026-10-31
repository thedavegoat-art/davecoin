/** Canonical live DaveCoin (pump.fun mainnet) */
export const PUMP_DAVE = {
  mint: "jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
  decimals: 6,
  buyUrl:
    "https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
} as const;

export const DAVE = {
  name: "DaveCoin",
  symbol: "DAVE",
  decimals: Number(process.env.NEXT_PUBLIC_DAVE_DECIMALS ?? PUMP_DAVE.decimals),
  mint: process.env.NEXT_PUBLIC_DAVE_MINT ?? PUMP_DAVE.mint,
  cluster: (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "mainnet-beta") as
    | "devnet"
    | "mainnet-beta"
    | "localnet",
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  totalSupplyUi: 1_000_000_000,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? PUMP_DAVE.buyUrl,
} as const;

export function explorerAddressUrl(address: string): string {
  const cluster =
    DAVE.cluster === "mainnet-beta" ? "" : `?cluster=${DAVE.cluster}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

export function formatDave(raw: bigint): string {
  const base = 10n ** BigInt(DAVE.decimals);
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac
    .toString()
    .padStart(DAVE.decimals, "0")
    .replace(/0+$/, "");
  return fracStr
    ? `${whole.toLocaleString("en-US")}.${fracStr}`
    : whole.toLocaleString("en-US");
}
