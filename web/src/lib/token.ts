export const DAVE = {
  name: "DaveCoin",
  symbol: "DAVE",
  decimals: 9,
  /** Set after `npm run token:create` — leave empty to show connect-only mode */
  mint: process.env.NEXT_PUBLIC_DAVE_MINT ?? "",
  cluster: (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet") as
    | "devnet"
    | "mainnet-beta"
    | "localnet",
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  totalSupplyUi: 1_000_000_000,
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
  const fracStr = frac.toString().padStart(DAVE.decimals, "0").replace(/0+$/, "");
  return fracStr
    ? `${whole.toLocaleString("en-US")}.${fracStr}`
    : whole.toLocaleString("en-US");
}
