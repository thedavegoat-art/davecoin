import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TOKEN_ROOT = join(__dirname, "..");
export const KEYS_DIR = join(TOKEN_ROOT, ".keys");
export const DEPLOYMENTS_DIR = join(TOKEN_ROOT, "deployments");

export const TOKEN = {
  name: "DaveCoin",
  symbol: "DAVE",
  decimals: 9,
  /** 1 billion DAVE with 9 decimals */
  totalSupply: 1_000_000_000n * 1_000_000_000n,
  uri: process.env.TOKEN_METADATA_URI ?? "",
} as const;

export type ClusterName = "devnet" | "mainnet-beta" | "localnet";

export function getCluster(): ClusterName {
  const value = (process.env.SOLANA_CLUSTER ?? "devnet") as ClusterName;
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
  mkdirSync(KEYS_DIR, { recursive: true });
  mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

function keyPath(name: string): string {
  return join(KEYS_DIR, `${name}.json`);
}

export function loadOrCreateKeypair(name: string): Keypair {
  ensureDirs();
  const path = keyPath(name);
  if (existsSync(path)) {
    const secret = Uint8Array.from(JSON.parse(readFileSync(path, "utf8")));
    return Keypair.fromSecretKey(secret);
  }

  const fromEnv = process.env.DEPLOYER_SECRET_KEY;
  if (name === "deployer" && fromEnv) {
    const secret = fromEnv.startsWith("[")
      ? Uint8Array.from(JSON.parse(fromEnv))
      : bs58.decode(fromEnv);
    const keypair = Keypair.fromSecretKey(secret);
    writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
    return keypair;
  }

  const keypair = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`Created keypair ${name}: ${keypair.publicKey.toBase58()}`);
  return keypair;
}

export function saveDeployment(data: Record<string, unknown>): string {
  ensureDirs();
  const cluster = getCluster();
  const path = join(DEPLOYMENTS_DIR, `${cluster}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2));
  return path;
}

export function loadDeployment(): {
  mint: string;
  decimals: number;
  symbol: string;
  name: string;
  cluster: string;
  totalSupplyRaw: string;
  deployer: string;
} | null {
  const path = join(DEPLOYMENTS_DIR, `${getCluster()}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function requireMint(): PublicKey {
  const deployment = loadDeployment();
  if (!deployment?.mint) {
    throw new Error(
      `No mint found for ${getCluster()}. Run: npm run token:create`,
    );
  }
  return new PublicKey(deployment.mint);
}
