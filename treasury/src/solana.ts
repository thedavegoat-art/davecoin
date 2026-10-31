import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { ECONOMICS } from "./economics.js";

export function treasuryAta(mint: PublicKey, treasury: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, treasury);
}

export function uiToRaw(amountUi: number): bigint {
  const factor = 10 ** ECONOMICS.decimals;
  return BigInt(Math.round(amountUi * factor));
}

export function rawToUi(raw: bigint): number {
  return Number(raw) / 10 ** ECONOMICS.decimals;
}

export async function getTokenUiBalance(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
): Promise<number> {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  try {
    const account = await getAccount(connection, ata);
    return rawToUi(account.amount);
  } catch {
    return 0;
  }
}

type ParsedIx = {
  program?: string;
  parsed?: {
    type: string;
    info: Record<string, unknown>;
  };
};

function extractTransferRaw(
  ix: ParsedIx,
  mint: PublicKey,
  treasuryAtaPk: PublicKey,
  expectedWallet: PublicKey,
): bigint {
  if (ix.program !== "spl-token" || !ix.parsed) return 0n;
  const { type, info } = ix.parsed;
  if (type !== "transfer" && type !== "transferChecked") return 0n;
  if (String(info.destination) !== treasuryAtaPk.toBase58()) return 0n;
  const authority = String(info.authority ?? info.multisigAuthority ?? "");
  if (authority && authority !== expectedWallet.toBase58()) return 0n;
  if (type === "transferChecked" && String(info.mint) !== mint.toBase58()) {
    return 0n;
  }
  const tokenAmount = info.tokenAmount;
  if (
    typeof tokenAmount === "object" &&
    tokenAmount &&
    "amount" in tokenAmount
  ) {
    return BigInt(String((tokenAmount as { amount: string }).amount));
  }
  return BigInt(String(info.amount ?? "0"));
}

/**
 * Confirm a user transferred DAVE to the treasury ATA.
 */
export async function parseIncomingDeposit(
  connection: Connection,
  signature: string,
  mint: PublicKey,
  treasuryAtaPk: PublicKey,
  expectedWallet: PublicKey,
): Promise<{ amountUi: number }> {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx || tx.meta?.err) throw new Error("Transaction not found or failed");

  const signed = tx.transaction.message.accountKeys.some((k) => {
    const pk = typeof k === "string" ? k : k.pubkey.toBase58();
    const signer = typeof k === "string" ? true : Boolean(k.signer);
    return signer && pk === expectedWallet.toBase58();
  });
  if (!signed) throw new Error("Claimed wallet did not sign this transaction");

  let amountRaw = 0n;
  for (const ix of tx.transaction.message.instructions) {
    amountRaw += extractTransferRaw(
      ix as ParsedIx,
      mint,
      treasuryAtaPk,
      expectedWallet,
    );
  }
  for (const inner of tx.meta?.innerInstructions ?? []) {
    for (const ix of inner.instructions) {
      amountRaw += extractTransferRaw(
        ix as ParsedIx,
        mint,
        treasuryAtaPk,
        expectedWallet,
      );
    }
  }

  if (amountRaw <= 0n) {
    throw new Error("No DAVE transfer to treasury found in this transaction");
  }

  return { amountUi: rawToUi(amountRaw) };
}

export async function sendDaveFromTreasury(input: {
  connection: Connection;
  mint: PublicKey;
  treasury: Keypair;
  recipient: PublicKey;
  amountUi: number;
}): Promise<string> {
  const { connection, mint, treasury, recipient, amountUi } = input;
  const fromAta = getAssociatedTokenAddressSync(mint, treasury.publicKey);
  const toAta = getAssociatedTokenAddressSync(mint, recipient);
  const raw = uiToRaw(amountUi);

  const tx = new Transaction();
  try {
    await getAccount(connection, toAta);
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          treasury.publicKey,
          toAta,
          recipient,
          mint,
        ),
      );
    } else {
      throw err;
    }
  }

  tx.add(createTransferInstruction(fromAta, toAta, treasury.publicKey, raw));
  return sendAndConfirmTransaction(connection, tx, [treasury]);
}
