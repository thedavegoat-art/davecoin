import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { ECONOMICS } from "./economics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TREASURY_ROOT = join(__dirname, "..");
export const DATA_DIR = join(TREASURY_ROOT, "data");
export const KEYS_DIR = join(TREASURY_ROOT, ".keys");
const TOKEN_DEPLOYMENTS = join(TREASURY_ROOT, "..", "token", "deployments");
const TOKEN_KEYS = join(TREASURY_ROOT, "..", "token", ".keys");

export type ClusterName = "devnet" | "mainnet-beta" | "localnet";

export function getCluster(): ClusterName {
  const value = (process.env.SOLANA_CLUSTER ?? "mainnet-beta") as ClusterName;
  if (!["devnet", "mainnet-beta", "localnet"].includes(value)) {
    throw new Error(`Invalid SOLANA_CLUSTER: ${value}`);
  }
  return value;
}

export function getConnection(): Connection {
  const cluster = getCluster();
  const rpc =
    process.env.SOLANA_RPC_URL ??
    (cluster === "localnet"
      ? "http://127.0.0.1:8899"
      : clusterApiUrl(cluster));
  return new Connection(rpc, "confirmed");
}

export function ensureDirs(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(KEYS_DIR, { recursive: true });
}

function loadKeypairFile(path: string): Keypair {
  const secret = Uint8Array.from(JSON.parse(readFileSync(path, "utf8")));
  return Keypair.fromSecretKey(secret);
}

function loadOrCreateLocalKey(name: string): Keypair {
  ensureDirs();
  const path = join(KEYS_DIR, `${name}.json`);
  if (existsSync(path)) return loadKeypairFile(path);
  const keypair = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`Created treasury key ${name}: ${keypair.publicKey.toBase58()}`);
  return keypair;
}

export function getTreasuryKeypair(): Keypair {
  if (process.env.TREASURY_SECRET_KEY) {
    const raw = process.env.TREASURY_SECRET_KEY;
    const secret = raw.startsWith("[")
      ? Uint8Array.from(JSON.parse(raw))
      : bs58.decode(raw);
    return Keypair.fromSecretKey(secret);
  }
  return loadOrCreateLocalKey("treasury");
}

/** Prefer env → economics default (pump) → deployments JSON */
export function getMint(): PublicKey {
  if (process.env.DAVE_MINT) return new PublicKey(process.env.DAVE_MINT);
  if (ECONOMICS.mint) return new PublicKey(ECONOMICS.mint);
  const pumpPath = join(TOKEN_DEPLOYMENTS, "mainnet-pump.json");
  const clusterPath = join(TOKEN_DEPLOYMENTS, `${getCluster()}.json`);
  const path = existsSync(pumpPath) ? pumpPath : clusterPath;
  if (!existsSync(path)) {
    throw new Error(
      `No mint configured. Set DAVE_MINT or add token/deployments/mainnet-pump.json`,
    );
  }
  const deployment = JSON.parse(readFileSync(path, "utf8")) as { mint: string };
  return new PublicKey(deployment.mint);
}

export function tryLoadDeployer(): Keypair | null {
  const path = join(TOKEN_KEYS, "deployer.json");
  if (!existsSync(path)) return null;
  return loadKeypairFile(path);
}

export const PORT = Number(process.env.PORT ?? 8787);

export function publicConfig(treasuryAta: string) {
  const cluster = getCluster();
  const mint = getMint().toBase58();
  const treasury = getTreasuryKeypair().publicKey.toBase58();
  return {
    ...ECONOMICS,
    cluster,
    mint,
    treasury,
    treasuryAta,
    creditsPerDave: ECONOMICS.creditsPerDave,
    buyUrl: ECONOMICS.buyUrl,
    note: "Live mint = pump.fun DaveCoin. Treasury is a custodial bridge for Palace.",
  };
}
