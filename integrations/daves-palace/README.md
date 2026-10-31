# Pack intégration — Dave’s Palace

Pour **kyniops** : tout ce qu’il faut pour brancher le DaveCoin pump.fun + treasury dans le casino.

## Contenu

| Fichier | Rôle |
|---------|------|
| `dave-bridge.js` | Client Phantom + treasury (deposit / withdraw) |
| `ui-panel.html` | Panneau UI prêt à coller + wiring `DP.wallet` |
| `CHECKLIST.md` | Cases à cocher ops + Palace |
| [`docs/PALACE_BRIEF_FR.md`](../../docs/PALACE_BRIEF_FR.md) | Brief produit / technique |

## Token

- Mint : `jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump`
- Decimals : `6`
- Buy : https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump

## Installation rapide

1. Copier `dave-bridge.js` → `js/dave-bridge.js` dans Palace  
2. Dans `index.html` :

```html
<script>
  window.DAVE_BRIDGE_CONFIG = {
    treasuryUrl: "https://TON-TREASURY.example.com",
    mint: "jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
    decimals: 6,
    buyUrl: "https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
    cluster: "mainnet-beta",
  };
</script>
<script src="https://unpkg.com/@solana/web3.js@1.98.4/lib/index.iife.min.js"></script>
<script src="https://unpkg.com/@solana/spl-token@0.4.13/lib/index.iife.min.js"></script>
<script src="js/dave-bridge.js"></script>
```

3. Coller le contenu de `ui-panel.html` dans le dashboard  
4. Suivre `CHECKLIST.md` (treasury déployée obligatoire)

## API utilisée

Voir [docs/INTEGRATION.md](../../docs/INTEGRATION.md).
