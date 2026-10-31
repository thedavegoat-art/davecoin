# Integrating DaveCoin into Dave’s Palace (for kyniops)

This repo stays **separate**. Palace can call the **Treasury API** instead of inventing custody.

## Mental model

```
Phantom wallet          Treasury API              Palace (casino)
──────────────          ────────────              ───────────────
SPL DAVE  ──deposit──►  ledger credits  ──sync──►  play DaveCoins
play DaveCoins ─cashout► ledger  ──withdraw──►   SPL DAVE
```

- On-chain token = real SPL DAVE  
- Treasury ledger = custodial balance (same unit: 1 credit = 1 DAVE)  
- Palace play balance can stay 1:1 with ledger credits (recommended)

Notional value of **all** DAVE ≈ **€1** (see `ECONOMICS.md`).

## API (treasury server)

Base URL example: `https://treasury.example.com`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/config` | mint, treasury owner, decimals, EUR notional |
| GET | `/balance/:wallet` | Ledger credits for a Solana pubkey |
| POST | `/deposit/confirm` | `{ wallet, signature }` — verify SPL transfer to treasury, credit ledger |
| POST | `/withdraw` | Signed withdraw request — debit ledger, send SPL |

### Deposit flow (Palace)

1. Show treasury ATA from `GET /config` → `treasuryAta`  
2. User sends DAVE (SPL) from Phantom to that ATA  
3. Palace (or this demo UI) posts the tx signature to `/deposit/confirm`  
4. Read `GET /balance/:wallet` and set / top-up `davecoin_<user>` (or cloud save)

### Withdraw flow (Palace)

1. Debit play balance first (or lock it)  
2. Ask wallet to `signMessage` the withdraw payload (see server)  
3. `POST /withdraw`  
4. On success, play balance already matches; show explorer link

### Auth

Withdraw messages are **ed25519** signatures over a UTF-8 payload from the user’s Solana wallet.
No email password on the treasury — the wallet is the account id.

## Security notes for Palace

- Run treasury on a **private host** (Railway, Fly, VPS). Never put the treasury secret key in the static GitHub Pages site.  
- Fund treasury with only the DAVE you are willing to lose (toy € economy).  
- Add your own rate limits / KYC / geo rules if you ever leave “fun toy” territory.  
- This is software scaffolding, not legal advice.

## Devnet checklist

1. `npm run token:create`  
2. Fund treasury: `npm run treasury:fund -- 100000000`  
3. `npm run treasury:dev`  
4. Point Palace (or the DaveCoin web UI) at `NEXT_PUBLIC_TREASURY_URL=http://localhost:8787`
