# Integrating DaveCoin into Dave’s Palace (for kyniops)

**Start here (FR) :** [`PALACE_BRIEF_FR.md`](./PALACE_BRIEF_FR.md)  
**Drop-in pack :** [`integrations/daves-palace/`](../integrations/daves-palace/)

This repo stays **separate**. Palace copies the bridge script and calls the **Treasury API**.

## Mental model

```
Phantom                pump.fun              Treasury API           Palace
────────               ────────              ────────────           ──────
Connect  →  Buy DAVE  →  hold SPL  →  Deposit → ledger  →  DP.wallet.credit (1:1)
Play balance  →  Withdraw (sign)  →  SPL back to Phantom
```

| | |
|--|--|
| Live mint | `jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump` |
| Decimals | **6** |
| Buy | https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump |

## Treasury HTTP API

Base URL example: `https://treasury.example.com`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/config` | mint, treasury, treasuryAta, decimals, buyUrl |
| GET | `/balance/:wallet` | Ledger credits |
| POST | `/deposit/confirm` | `{ wallet, signature }` after SPL transfer to treasury |
| POST | `/withdraw/prepare` | `{ wallet, amount }` → message to sign |
| POST | `/withdraw` | `{ wallet, amount, nonce, issuedAt, signature }` |

### Deposit (Palace)

1. `DaveBridge.deposit(amount)` (handles transfer + confirm)  
2. `DP.wallet.credit(credited)`  
3. Optional `DP.cloud.pushNow()`

### Withdraw (Palace)

1. `DP.wallet.place(amount)` first  
2. `DaveBridge.withdraw(amount)`  
3. On API failure → `DP.wallet.credit(amount)` to refund play balance

### Auth

Withdraw = ed25519 `signMessage` over the UTF-8 payload from `/withdraw/prepare`.  
Wallet pubkey is the account id.

## Security

- Treasury **secret key** only on a private host (Railway / Fly / VPS) — never GitHub Pages  
- Restrict CORS to Palace origins  
- Fund treasury with only the DAVE float you accept to lose  
- Not legal / financial advice

## Ops deploy (treasury)

```bash
cd treasury
cp .env.example .env
# set DAVE_MINT, DAVE_DECIMALS=6, SOLANA_CLUSTER=mainnet-beta, TREASURY_SECRET_KEY
npm run start
```

Buy DAVE on pump → send some to the treasury wallet ATA → players can withdraw.
