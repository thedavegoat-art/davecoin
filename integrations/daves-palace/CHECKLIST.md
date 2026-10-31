# Checklist intégration Palace (kyniops)

## Infra (thedavegoat / ops)

- [ ] Déployer `treasury/` (Railway / Fly / VPS)
- [ ] `SOLANA_CLUSTER=mainnet-beta`
- [ ] `DAVE_MINT=jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump`
- [ ] `DAVE_DECIMALS=6`
- [ ] Clé `TREASURY_SECRET_KEY` en secret (jamais dans git / Pages)
- [ ] Fund treasury ATA avec un float DAVE (achetés sur pump)
- [ ] CORS : autoriser l’origine `https://kyniops.github.io` (et localhost)
- [ ] Donner l’URL publique à kyniops : `https://….railway.app` (ex.)

## Palace (kyniops)

- [ ] Copier `dave-bridge.js` → `js/dave-bridge.js`
- [ ] Ajouter scripts Solana + bridge dans `index.html`
- [ ] Coller le panneau UI (Connect / Acheter / Déposer / Retirer)
- [ ] Brancher `DP.wallet.credit` / `place` comme dans le brief
- [ ] Phantom **mainnet** indiqué clairement dans l’UI
- [ ] Tester : buy pump → deposit → solde jeu ↑ → withdraw → Phantom ↑
- [ ] (Option) sync cloud `DP.cloud.pushNow()` après deposit/withdraw

## QA mini

| Test | Attendu |
|------|---------|
| Pas de Phantom | Toast “installe Phantom” |
| Deposit sans DAVE | Erreur solde |
| Deposit OK | Ledger API + `DP.wallet` ↑ |
| Withdraw > solde jeu | Bloqué par `wallet.place` |
| Withdraw OK | SPL reçu + solde jeu ↓ |
