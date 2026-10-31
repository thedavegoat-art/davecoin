# Acheter du DaveCoin — micro-pool (~€1 FDV)

Sans pool DEX, **personne ne peut acheter** DAVE.  
Ce guide crée un marché minuscule : **toute la supply ≈ €1**.

## Chiffres cibles

| | |
|--|--|
| Supply | 1 000 000 000 DAVE |
| FDV visé | ≈ **€1** |
| Prix | ≈ **€0.000000001** / DAVE |
| Dans la pool (exemple) | **40 %** = 400 000 000 DAVE |
| Face (SOL ou USDC) | ≈ **€0.40** |

### Combien de SOL mettre ?

```
SOL_à_déposer ≈ 0.40 / prix_SOL_en_EUR
```

Exemples si 1 SOL = €150 → **≈ 0.0027 SOL** face à 400M DAVE.  
Si 1 SOL = €100 → **≈ 0.004 SOL**.

Garde le reste (60 %) hors pool : communauté, treasury Palace, équipe.

> Sur **Devnet**, tu peux tester la mécanique, mais ce n’est pas un vrai achat.  
> Pour que des gens achètent avec du vrai SOL → **Mainnet**.

---

## Checklist Mainnet

### 0. Prérequis

- [ ] Mint DAVE créé sur **mainnet** (`SOLANA_CLUSTER=mainnet-beta` + `npm run token:create`)
- [ ] Assez de SOL pour : frais + liquidité (~0.01 SOL largement suffisant pour cette taille toy)
- [ ] Wallet (Phantom) sur **Solana Mainnet**
- [ ] Metadata token optionnelle (nom / image) via un outil type [Token Metadata](https://token-creator-lac.vercel.app/) ou Metaplex

### 1. Préparer les montants

1. Calcule `SOL_à_déposer` avec la formule ci-dessus  
2. Envoie **400M DAVE** (ou le % choisi) vers le wallet qui créera la pool  
3. Garde le SOL de liquidité sur le **même** wallet

Helper local :

```bash
npm run pool:calc -- 150
# → affiche SOL à mettre si 1 SOL = 150 EUR, pour 400M DAVE et FDV €1
```

### 2. Créer la pool (Raydium — le plus simple)

1. Ouvre [https://raydium.io/liquidity-pools/](https://raydium.io/liquidity-pools/) (ou *Create pool* / AMM selon l’UI du moment)  
2. Connecte Phantom (Mainnet)  
3. Base token = **SOL** (ou USDC)  
4. Quote token = colle l’adresse **mint DAVE**  
5. Dépose : `SOL_à_déposer` + `400_000_000` DAVE  
6. Confirme les transactions  
7. Note l’adresse de la pool / du marché

Alternatives : [Meteora](https://app.meteora.ag/), [Orca](https://www.orca.so/) — même idée (très petite liquidité).

### 3. Vérifier qu’on peut acheter

1. Ouvre Jupiter :  
   `https://jup.ag/swap/SOL-<MINT_DAVE>`  
2. Ou dans Phantom → Swap → colle le mint DAVE  
3. Swap un tout petit montant (ex. 0.0001 SOL) pour tester  
4. Tu dois recevoir des DAVE

### 4. Brancher le site DaveCoin

Dans `web/.env.local` (mainnet) :

```env
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
NEXT_PUBLIC_DAVE_MINT=<mint>
NEXT_PUBLIC_BUY_URL=https://jup.ag/swap/SOL-<mint>
```

Le bouton **Buy DAVE** du site ouvre ce lien.

### 5. (Plus tard) Palace

Les joueurs achètent sur Jupiter → déposent via la **treasury API** → crédits casino.  
Voir `INTEGRATION.md`.

---

## Risques (même à €1)

- Quelqu’un peut **vider** la micro-pool avec très peu de SOL (slippage énorme) — normal à cette taille  
- Un faux mint peut circuler : **toujours** coller le mint officiel  
- Ce n’est **pas** un investissement : toy token / fun bridge

## Devnet (test only)

Il n’y a en général **pas** de vrai Raydium liquid pour un mint custom Devnet.  
Sur Devnet, continue avec `token:airdrop` + treasury deposit.  
La pool “acheter” = **Mainnet**.
