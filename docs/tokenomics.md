# DaveCoin (DAVE) Tokenomics

| Parameter | Value |
|-----------|-------|
| Name | DaveCoin |
| Symbol | DAVE |
| Chain | Solana |
| Standard | SPL Token |
| Decimals | 9 |
| Max supply | 1,000,000,000 DAVE |
| Mint model | Fixed supply (mint authority revoked after creation) |
| Freeze authority | None |

## Suggested allocation

| Bucket | Share | Amount |
|--------|-------|--------|
| Liquidity / DEX pool | 40% | 400,000,000 |
| Community / airdrops | 30% | 300,000,000 |
| Team (vesting later) | 20% | 200,000,000 |
| Treasury / partnerships | 10% | 100,000,000 |

At launch, the full supply is minted to the deployer treasury ATA. Distribution is handled via transfers / airdrop scripts.

## Networks

1. **Devnet** — create mint, test wallet UX
2. **Mainnet** — fund deployer with SOL, set `SOLANA_CLUSTER=mainnet-beta`, run create again with fresh keys
