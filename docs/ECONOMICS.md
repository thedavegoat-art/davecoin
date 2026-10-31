# DaveCoin economics (intentionally tiny)

Target: the **entire** fixed supply is notionally worth about **€1**.

| | |
|--|--|
| Max supply | 1,000,000,000 DAVE |
| Notional FDV | **€1.00** |
| Notional price | **€0.000000001** per DAVE (`1e-9` EUR) |
| Ledger unit | **1 credit = 1 DAVE** (1:1 with on-chain token amount, UI decimals) |

## Why so small?

DaveCoin is a branding / game bridge token, not a “serious” investment asset.
A ~€1 fully diluted value keeps deposits, withdrawals, and casino rails in toy territory.

## Liquidity hint (later, mainnet)

If you seed a DEX pool to match ~€1 FDV:

- Put e.g. **40%** of supply in pool = 400,000,000 DAVE  
- Pair with about **€0.40** of SOL or USDC  
- Rough starting price ≈ `0.40 / 400_000_000` EUR per DAVE ≈ `1e-9` EUR  

Exact SOL amount depends on SOL/EUR at listing time.

## Treasury float

The treasury holds deposited DAVE (custodial bridge to game credits).

- Players **deposit** SPL DAVE → ledger credits increase  
- Players **withdraw** → ledger decreases → SPL DAVE leaves treasury  
- Treasury must keep enough on-chain DAVE to cover outstanding ledger balances  

Outstanding ledger ≤ on-chain treasury balance (enforced on withdraw).
