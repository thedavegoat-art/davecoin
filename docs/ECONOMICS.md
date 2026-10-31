# DaveCoin economics

## Live (pump.fun)

Market cap / price are **set by the market** on:

https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump

| | |
|--|--|
| Mint | `jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump` |
| Decimals | 6 |
| Ledger unit | **1 credit = 1 DAVE** (UI amount) |

There is no fixed “€1 FDV” on the live coin — that was a toy target for a custom Raydium micro-pool. Live FDV follows pump.fun.

## Lab treasury (optional Devnet mint)

For local treasury / Palace bridge tests you may still use a Devnet mint from `npm run token:create` (9 decimals in scripts). Keep lab keys and live pump mint separate.

## Treasury float

Same model either way:

- Deposit SPL DAVE → ledger credits  
- Withdraw → SPL leaves treasury  
- Outstanding ledger ≤ on-chain treasury balance  
