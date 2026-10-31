# Live DaveCoin = pump.fun

**Canonical mint (Mainnet):**

`jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump`

| | |
|--|--|
| Buy / sell | https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump |
| Decimals | **6** (pump standard) |
| Creator wallet | `CvPm2ANrGoTwfxPc4WAkzZ2j7gQdNHfVbE1eFzurk8LS` |
| Launchpad | pump.fun bonding curve → may graduate to Raydium later |

## Why this strategy

- People can **buy immediately** (no custom Raydium pool setup / ~0.2 SOL create fee first)
- Mint is already on **mainnet**
- Site + treasury + Palace should all point at **this** mint

## Lab vs live

| | Live | Lab (optional) |
|--|------|----------------|
| Mint | `jryX…pump` | `npm run token:create` on Devnet |
| Decimals | 6 | 9 (scripts default) |
| Buy | pump.fun | airdrop only |

## After graduation (if it hits Raydium)

Update `NEXT_PUBLIC_BUY_URL` to Jupiter if you prefer, or keep pump.fun redirect.
Raydium checklist remains in `POOL.md` as optional post-graduation liquidity ops.
