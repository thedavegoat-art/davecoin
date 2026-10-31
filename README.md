# DaveCoin (DAVE)

Fixed-supply **SPL token** on **Solana**, demo site, and a **toy treasury** (deposit / withdraw) so projects like [Dave’s Palace](https://github.com/kyniops/Dave-s-Palace) can integrate later.

![DaveCoin](./assets/davecoin.png)

| | |
|--|--|
| Name | DaveCoin |
| Symbol | DAVE |
| Decimals | 9 |
| Supply | 1,000,000,000 (mint authority revoked after create) |
| Notional FDV | **≈ €1** for the whole supply (`€1e-9` / DAVE) |
| Repo | [thedavegoat-art/davecoin](https://github.com/thedavegoat-art/davecoin) |

## Structure

```
davecoin/
├── assets/
├── docs/
│   ├── ECONOMICS.md      # why ≈ €1 FDV
│   ├── INTEGRATION.md    # how Palace should call the treasury
│   └── tokenomics.md
├── token/                # create mint / airdrop / balance
├── treasury/             # custodial ledger API (deposit / withdraw)
└── web/                  # Next.js UI
```

This repo stays **separate** from Dave’s Palace. Palace can copy the API contract in `docs/INTEGRATION.md`.

## Setup

```bash
npm install
cp token/.env.example token/.env
cp treasury/.env.example treasury/.env
cp web/.env.example web/.env.local
```

## 1) Create the mint (Devnet)

Fund deployer via https://faucet.solana.com if RPC airdrop is closed, then:

```bash
npm run token:create
```

Set in `web/.env.local`:

```env
NEXT_PUBLIC_DAVE_MINT=<mint>
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_TREASURY_URL=http://localhost:8787
```

## 2) Fund the treasury + run API

```bash
npm run treasury:fund -- 100000000
npm run treasury:dev
```

## 3) Web UI

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → connect wallet → **Treasury** section to deposit / withdraw.

## Economics

See [`docs/ECONOMICS.md`](./docs/ECONOMICS.md): **1B DAVE ≈ €1** total. Ledger is **1 credit = 1 DAVE**.

## Palace integration

See [`docs/INTEGRATION.md`](./docs/INTEGRATION.md).

## Security

- Never commit `token/.keys/`, `treasury/.keys/`, `treasury/data/`, or secrets  
- Treasury secret key must stay on a private server (not GitHub Pages)  
- Toy valuation — not financial advice, not a production casino custody stack
