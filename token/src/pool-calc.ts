/**
 * How much SOL to seed a toy pool so FDV ≈ €1.
 *
 * Usage:
 *   npm run pool:calc -- [SOL_PRICE_EUR] [POOL_SHARE] [FDV_EUR]
 * Defaults: 150 EUR/SOL, 40% of supply in pool, €1 FDV
 */
const TOTAL_SUPPLY = 1_000_000_000;

function main() {
  const solPriceEur = Number(process.argv[2] ?? 150);
  const poolShare = Number(process.argv[3] ?? 0.4);
  const fdvEur = Number(process.argv[4] ?? 1);

  if (!(solPriceEur > 0) || !(poolShare > 0 && poolShare <= 1) || !(fdvEur > 0)) {
    console.error(
      "Usage: npm run pool:calc -- [SOL_PRICE_EUR] [POOL_SHARE] [FDV_EUR]",
    );
    process.exit(1);
  }

  const daveInPool = TOTAL_SUPPLY * poolShare;
  const eurInPool = fdvEur * poolShare;
  const solInPool = eurInPool / solPriceEur;
  const priceEur = fdvEur / TOTAL_SUPPLY;
  const priceSol = priceEur / solPriceEur;

  console.log("DaveCoin micro-pool calculator");
  console.log("------------------------------");
  console.log(`Target FDV:          €${fdvEur}`);
  console.log(`SOL price assumed:   €${solPriceEur}`);
  console.log(`Pool share:          ${(poolShare * 100).toFixed(0)}%`);
  console.log(`DAVE in pool:        ${daveInPool.toLocaleString("en-US")}`);
  console.log(`EUR side of pool:    €${eurInPool.toFixed(4)}`);
  console.log(`SOL to deposit:      ${solInPool.toFixed(6)} SOL`);
  console.log(`Price:               €${priceEur.toExponential(1)} / DAVE`);
  console.log(`                     ${priceSol.toExponential(3)} SOL / DAVE`);
  console.log("");
  console.log("Next: create pool on Raydium (Mainnet) with those amounts,");
  console.log("then buy via https://jup.ag/swap/SOL-<MINT>");
}

main();
