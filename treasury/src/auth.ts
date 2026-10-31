import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

export function buildWithdrawMessage(input: {
  wallet: string;
  amountUi: number;
  nonce: string;
  issuedAt: string;
}): string {
  return [
    "DaveCoin Treasury Withdraw",
    `Wallet: ${input.wallet}`,
    `Amount: ${input.amountUi}`,
    `Nonce: ${input.nonce}`,
    `IssuedAt: ${input.issuedAt}`,
  ].join("\n");
}

export function verifyWalletSignature(input: {
  wallet: string;
  message: string;
  signatureBase58: string;
}): void {
  const pubkey = new PublicKey(input.wallet);
  const msg = new TextEncoder().encode(input.message);
  const sig = bs58.decode(input.signatureBase58);
  const ok = nacl.sign.detached.verify(msg, sig, pubkey.toBytes());
  if (!ok) throw new Error("Invalid wallet signature");
}

export function assertFreshIssuedAt(issuedAt: string, maxAgeMs = 5 * 60 * 1000) {
  const t = Date.parse(issuedAt);
  if (Number.isNaN(t)) throw new Error("Invalid IssuedAt");
  if (Math.abs(Date.now() - t) > maxAgeMs) {
    throw new Error("Withdraw message expired — sign again");
  }
}
