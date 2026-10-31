import {
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  AuthorityType,
} from "@solana/spl-token";
import {
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getCluster,
  getConnection,
  loadOrCreateKeypair,
  saveDeployment,
  TOKEN,
} from "./config.js";

async function main() {
  const cluster = getCluster();
  const connection = getConnection();
  const deployer = loadOrCreateKeypair("deployer");
  const mintKeypair = loadOrCreateKeypair("mint");

  console.log(`Cluster:   ${cluster}`);
  console.log(`Deployer:  ${deployer.publicKey.toBase58()}`);
  console.log(`Mint:      ${mintKeypair.publicKey.toBase58()}`);

  const balance = await connection.getBalance(deployer.publicKey);
  if (balance < 0.05 * 1e9) {
    if (cluster === "devnet") {
      console.log("Requesting SOL airdrop for deployer...");
      try {
        const sig = await connection.requestAirdrop(
          deployer.publicKey,
          1 * 1e9,
        );
        await connection.confirmTransaction(sig, "confirmed");
      } catch {
        throw new Error(
          [
            "Devnet RPC faucet is closed.",
            `1) Open https://faucet.solana.com`,
            `2) Paste deployer: ${deployer.publicKey.toBase58()}`,
            `3) Request Devnet SOL, wait ~30s, then re-run: npm run token:create`,
          ].join("\n"),
        );
      }
    } else {
      throw new Error(
        `Deployer needs SOL. Balance: ${balance / 1e9}. Fund ${deployer.publicKey.toBase58()}`,
      );
    }
  }

  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const ata = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    deployer.publicKey,
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: deployer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      TOKEN.decimals,
      deployer.publicKey,
      null,
    ),
    createAssociatedTokenAccountInstruction(
      deployer.publicKey,
      ata,
      deployer.publicKey,
      mintKeypair.publicKey,
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      ata,
      deployer.publicKey,
      TOKEN.totalSupply,
    ),
    // Fixed supply: revoke mint authority after minting
    createSetAuthorityInstruction(
      mintKeypair.publicKey,
      deployer.publicKey,
      AuthorityType.MintTokens,
      null,
    ),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [
    deployer,
    mintKeypair,
  ]);

  const path = saveDeployment({
    name: TOKEN.name,
    symbol: TOKEN.symbol,
    decimals: TOKEN.decimals,
    totalSupplyRaw: TOKEN.totalSupply.toString(),
    totalSupplyUi: "1000000000",
    mint: mintKeypair.publicKey.toBase58(),
    deployer: deployer.publicKey.toBase58(),
    treasuryAta: ata.toBase58(),
    mintAuthority: null,
    freezeAuthority: null,
    cluster,
    createSignature: signature,
    createdAt: new Date().toISOString(),
  });

  console.log("\nDaveCoin minted successfully.");
  console.log(`Signature: ${signature}`);
  console.log(`Treasury ATA: ${ata.toBase58()}`);
  console.log(`Mint authority revoked (fixed supply).`);
  console.log(`Saved: ${path}`);
  console.log(
    `\nExplorer: https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=${cluster === "mainnet-beta" ? "mainnet" : cluster}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
