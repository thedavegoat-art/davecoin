import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  getCluster,
  getConnection,
  loadDeployment,
  loadOrCreateKeypair,
  requireMint,
  TOKEN,
} from "./config.js";

function parseAmount(raw: string): bigint {
  const [whole, frac = ""] = raw.split(".");
  const fracPadded = (frac + "0".repeat(TOKEN.decimals)).slice(
    0,
    TOKEN.decimals,
  );
  return BigInt(whole + fracPadded);
}

async function main() {
  const recipientArg = process.argv[2];
  const amountArg = process.argv[3] ?? "1000";

  if (!recipientArg) {
    console.error(
      "Usage: npm run token:airdrop -- <RECIPIENT_PUBKEY> [AMOUNT_DAVE]",
    );
    process.exit(1);
  }

  const connection = getConnection();
  const deployer = loadOrCreateKeypair("deployer");
  const mint = requireMint();
  const deployment = loadDeployment()!;
  const recipient = new PublicKey(recipientArg);
  const amount = parseAmount(amountArg);

  const fromAta = getAssociatedTokenAddressSync(mint, deployer.publicKey);
  const toAta = getAssociatedTokenAddressSync(mint, recipient);

  const tx = new Transaction();

  try {
    await getAccount(connection, toAta);
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          deployer.publicKey,
          toAta,
          recipient,
          mint,
        ),
      );
    } else {
      throw err;
    }
  }

  tx.add(
    createTransferInstruction(fromAta, toAta, deployer.publicKey, amount),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [deployer]);

  console.log(`Airdropped ${amountArg} ${TOKEN.symbol} to ${recipientArg}`);
  console.log(`Cluster: ${getCluster()}`);
  console.log(`Mint: ${deployment.mint}`);
  console.log(`Signature: ${signature}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
