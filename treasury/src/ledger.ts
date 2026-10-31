import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, ensureDirs } from "./config.js";

export type LedgerAccount = {
  wallet: string;
  /** DAVE UI units (not raw lamport-like base units) */
  credits: number;
  updatedAt: string;
};

export type DepositRecord = {
  signature: string;
  wallet: string;
  amountUi: number;
  creditedAt: string;
};

type LedgerFile = {
  accounts: Record<string, LedgerAccount>;
  deposits: Record<string, DepositRecord>;
  nonces: Record<string, string>;
};

const FILE = join(DATA_DIR, "ledger.json");

function empty(): LedgerFile {
  return { accounts: {}, deposits: {}, nonces: {} };
}

function read(): LedgerFile {
  ensureDirs();
  if (!existsSync(FILE)) return empty();
  return JSON.parse(readFileSync(FILE, "utf8")) as LedgerFile;
}

function write(data: LedgerFile): void {
  ensureDirs();
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, FILE);
}

export function getCredits(wallet: string): number {
  const w = wallet.trim();
  return read().accounts[w]?.credits ?? 0;
}

export function creditDeposit(
  wallet: string,
  amountUi: number,
  signature: string,
): LedgerAccount {
  if (!(amountUi > 0)) throw new Error("Invalid deposit amount");
  const data = read();
  if (data.deposits[signature]) {
    throw new Error("Deposit signature already credited");
  }
  const prev = data.accounts[wallet] ?? {
    wallet,
    credits: 0,
    updatedAt: new Date(0).toISOString(),
  };
  const next: LedgerAccount = {
    wallet,
    credits: round6(prev.credits + amountUi),
    updatedAt: new Date().toISOString(),
  };
  data.accounts[wallet] = next;
  data.deposits[signature] = {
    signature,
    wallet,
    amountUi,
    creditedAt: next.updatedAt,
  };
  write(data);
  return next;
}

export function debitWithdraw(
  wallet: string,
  amountUi: number,
  nonce: string,
): LedgerAccount {
  if (!(amountUi > 0)) throw new Error("Invalid withdraw amount");
  const data = read();
  if (data.nonces[nonce]) throw new Error("Nonce already used");
  const prev = data.accounts[wallet];
  if (!prev || prev.credits + 1e-12 < amountUi) {
    throw new Error("Insufficient ledger balance");
  }
  const next: LedgerAccount = {
    wallet,
    credits: round6(prev.credits - amountUi),
    updatedAt: new Date().toISOString(),
  };
  data.accounts[wallet] = next;
  data.nonces[nonce] = new Date().toISOString();
  write(data);
  return next;
}

/** Undo a failed chain send after debitWithdraw (nonce stays consumed). */
export function refundFailedWithdraw(wallet: string, amountUi: number): LedgerAccount {
  const data = read();
  const prev = data.accounts[wallet] ?? {
    wallet,
    credits: 0,
    updatedAt: new Date(0).toISOString(),
  };
  const next: LedgerAccount = {
    wallet,
    credits: round6(prev.credits + amountUi),
    updatedAt: new Date().toISOString(),
  };
  data.accounts[wallet] = next;
  write(data);
  return next;
}

export function hasDeposit(signature: string): boolean {
  return Boolean(read().deposits[signature]);
}

function round6(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6;
}
