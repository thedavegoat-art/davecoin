import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  getCluster,
  getConnection,
  loadOrCreateKeypair,
  requireMint,
  TOKEN,
} from "./config.js";

async function main() {
  const ownerArg = process.argv[2];
  const connection = getConnection();
  const mint = requireMint();
  const owner = ownerArg
    ? new PublicKey(ownerArg)
    : loadOrCreateKeypair("deployer").publicKey;

  const ata = getAssociatedTokenAddressSync(mint, owner);
  try {
    const account = await getAccount(connection, ata);
    const ui =
      Number(account.amount) / 10 ** TOKEN.decimals;
    console.log(`Owner:   ${owner.toBase58()}`);
    console.log(`Mint:    ${mint.toBase58()}`);
    console.log(`Cluster: ${getCluster()}`);
    console.log(`Balance: ${ui.toLocaleString("en-US")} ${TOKEN.symbol}`);
  } catch {
    console.log(`No ${TOKEN.symbol} token account for ${owner.toBase58()}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
