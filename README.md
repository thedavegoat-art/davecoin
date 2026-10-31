# DaveCoin (DAVE)

Fixed-supply **SPL token** on **Solana**, plus a Next.js site to connect a wallet, check balance, and send DAVE.

![DaveCoin](./assets/davecoin.png)

| | |
|--|--|
| Name | DaveCoin |
| Symbol | DAVE |
| Decimals | 9 |
| Supply | 1,000,000,000 (mint authority revoked after create) |
| Repo | [thedavegoat-art/davecoin](https://github.com/thedavegoat-art/davecoin) |

## Structure

```
davecoin/
├── assets/          # Brand (coin image)
├── docs/            # Tokenomics
├── token/           # Create mint / airdrop / balance scripts
└── web/             # Next.js landing + wallet UI
```

## Prerequisites

- Node.js 20+
- A Solana wallet (Phantom / Solflare) for the web app
- Devnet SOL for the deployer (script can airdrop on Devnet)

## Setup

```bash
npm install
cp token/.env.example token/.env
cp web/.env.example web/.env.local
```

## Create the mint (Devnet)

```bash
npm run token:create
```

This will:

1. Create (or reuse) a deployer keypair in `token/.keys/`
2. Create the DAVE mint
3. Mint the full supply to the deployer ATA
4. **Revoke mint authority** (fixed supply)
5. Write `token/deployments/devnet.json`

Copy the `mint` address into `web/.env.local`:

```env
NEXT_PUBLIC_DAVE_MINT=<mint from deployments/devnet.json>
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

### Airdrop test tokens

```bash
npm run token:airdrop -- <RECIPIENT_PUBKEY> 1000
```

### Check balance

```bash
npm run balance --workspace=token
# or
npm run balance --workspace=token -- <PUBKEY>
```

## Web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mainnet

1. Fund the deployer with real SOL  
2. Set `SOLANA_CLUSTER=mainnet-beta` (and ideally a private RPC)  
3. Use **fresh** keys under `token/.keys/` (or a dedicated mainnet folder)  
4. Run `npm run token:create` again  
5. Point `NEXT_PUBLIC_*` at mainnet + the new mint  

**Never commit** `token/.keys/`, `.env`, or secret key material.

## Security notes

- DaveCoin v1 is a standard SPL mint + UI — not a custom L1
- Revoking mint authority does not protect against scams, fake mints, or phishing
- This project is software, not financial advice
