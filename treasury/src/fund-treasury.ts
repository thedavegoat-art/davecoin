import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import {
  getConnection,
  getMint,
  getTreasuryKeypair,
  tryLoadDeployer,
} from "./config.js";
import { uiToRaw } from "./solana.js";

async function main() {
  const amountUi = Number(process.argv[2] ?? "100000000");
  if (!(amountUi > 0)) throw new Error("Amount must be > 0");

  const deployer = tryLoadDeployer();
  if (!deployer) {
    throw new Error("Missing token/.keys/deployer.json — create mint first");
  }

  const connection = getConnection();
  const mint = getMint();
  const treasury = getTreasuryKeypair();
  const fromAta = getAssociatedTokenAddressSync(mint, deployer.publicKey);
  const toAta = getAssociatedTokenAddressSync(mint, treasury.publicKey);

  console.log(`Funding treasury with ${amountUi} DAVE`);
  console.log(`Treasury: ${treasury.publicKey.toBase58()}`);
  console.log(`Treasury ATA: ${toAta.toBase58()}`);

  const tx = new Transaction();
  try {
    await getAccount(connection, toAta);
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          deployer.publicKey,
          toAta,
          treasury.publicKey,
          mint,
        ),
      );
    } else {
      throw err;
    }
  }

  tx.add(
    createTransferInstruction(
      fromAta,
      toAta,
      deployer.publicKey,
      uiToRaw(amountUi),
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [deployer]);
  console.log(`Done: ${sig}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
