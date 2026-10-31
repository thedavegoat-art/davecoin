# Brief kyniops — brancher DaveCoin dans Dave’s Palace

Repo référence : https://github.com/thedavegoat-art/davecoin  
Pack drop-in : [`integrations/daves-palace/`](../integrations/daves-palace/)

## Objectif joueur

1. Connecte **Phantom** (Solana **mainnet**)
2. Clique **Acheter DAVE** → [pump.fun](https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump)
3. Revient sur Palace → **Déposer** → les DAVE on-chain partent en treasury
4. Son solde casino (`DP.wallet` / `davecoin_<user>`) est **crédité 1:1**
5. Plus tard : **Retirer** → débite le solde jeu → renvoie du DAVE SPL dans Phantom

## Token live (ne pas se tromper)

| | |
|--|--|
| Mint | `jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump` |
| Decimals | **6** |
| Buy | https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump |
| Cluster | mainnet-beta |

## Qui héberge quoi

| Composant | Qui | Où |
|-----------|-----|-----|
| Site Palace (GitHub Pages) | kyniops | statique |
| **Treasury API** (clés secrètes) | thedavegoat / ops | Railway / Fly / VPS — **jamais** dans Pages |
| Mint / pump.fun | déjà live | Solana |

Sans treasury déployée, le deposit/withdraw ne peut pas marcher en prod.

## Fichiers à copier dans Palace

Depuis ce repo → ton repo Palace :

```
integrations/daves-palace/dave-bridge.js  →  js/dave-bridge.js
integrations/daves-palace/ui-panel.html   →  coller dans le dashboard / shop
```

Dans `index.html` (après `core.js`, avant le dashboard) :

```html
<script src="https://unpkg.com/@solana/web3.js@1.98.4/lib/index.iife.min.js"></script>
<script src="https://unpkg.com/@solana/spl-token@0.4.13/lib/index.iife.min.js"></script>
<script src="js/dave-bridge.js"></script>
```

Config en tête de page ou dans `dave-bridge.js` :

```js
window.DAVE_BRIDGE_CONFIG = {
  treasuryUrl: "https://TON-TREASURY.example.com",
  mint: "jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
  decimals: 6,
  buyUrl: "https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
  cluster: "mainnet-beta",
};
```

## Branchement solde Palace (recommandé)

Après un deposit réussi (`credited` = montant DAVE) :

```js
DP.wallet.credit(credited);   // 1 DAVE → +1 DaveCoin jeu
if (DP.cloud && DP.cloud.pushNow) DP.cloud.pushNow();
DP.ui.toast("+" + credited + " DaveCoins (on-chain)", "win");
```

Avant un withdraw :

```js
if (!DP.wallet.place(amount)) return; // débit jeu d’abord
// puis DaveBridge.withdraw(amount)
// si withdraw API échoue → DP.wallet.credit(amount) pour rembourser
```

## Checklist kyniops

Voir [`integrations/daves-palace/CHECKLIST.md`](../integrations/daves-palace/CHECKLIST.md).

## Contact / questions

Tout le contrat HTTP est dans `INTEGRATION.md` + le client `dave-bridge.js` (commenté).  
Les tests UI de référence sont sur le site Next du repo davecoin (`web/`).
