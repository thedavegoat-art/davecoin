/**
 * DaveBridge — drop-in client for Dave's Palace (kyniops)
 * Repo: https://github.com/thedavegoat-art/davecoin
 *
 * Requires (via script tags, before this file):
 *   - Phantom: window.solana
 *   - @solana/web3.js iife → window.solanaWeb3
 *   - @solana/spl-token iife → window.splToken
 *
 * Optional config before load:
 *   window.DAVE_BRIDGE_CONFIG = { treasuryUrl, mint, decimals, buyUrl, cluster, rpcUrl }
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    treasuryUrl: "http://localhost:8787",
    mint: "jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
    decimals: 6,
    buyUrl: "https://pump.fun/coin/jryXyEe7BPFxKze8bLJJSqbTWw464qgop8JfZUSpump",
    cluster: "mainnet-beta",
    rpcUrl: null,
  };

  const cfg = Object.assign({}, DEFAULTS, global.DAVE_BRIDGE_CONFIG || {});

  const BASE58 =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  function encodeBase58(bytes) {
    const arr = Array.from(bytes);
    let zeros = 0;
    while (zeros < arr.length && arr[zeros] === 0) zeros++;
    const digits = [0];
    for (let i = zeros; i < arr.length; i++) {
      let carry = arr[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let str = "";
    for (let i = 0; i < zeros; i++) str += "1";
    for (let i = digits.length - 1; i >= 0; i--) str += BASE58[digits[i]];
    return str;
  }

  function web3() {
    const w = global.solanaWeb3;
    if (!w) throw new Error("Charge @solana/web3.js (solanaWeb3) avant dave-bridge.js");
    return w;
  }

  function spl() {
    const s = global.splToken;
    if (!s) throw new Error("Charge @solana/spl-token (splToken) avant dave-bridge.js");
    return s;
  }

  function provider() {
    const p = global.solana;
    if (!p || !p.isPhantom) {
      throw new Error("Installe / ouvre Phantom (extension) sur Solana mainnet");
    }
    return p;
  }

  function connection() {
    const { Connection, clusterApiUrl } = web3();
    const url =
      cfg.rpcUrl ||
      (cfg.cluster === "mainnet-beta"
        ? clusterApiUrl("mainnet-beta")
        : clusterApiUrl(cfg.cluster));
    return new Connection(url, "confirmed");
  }

  async function api(path, init) {
    const res = await fetch(String(cfg.treasuryUrl).replace(/\/$/, "") + path, {
      headers: { "Content-Type": "application/json", ...(init && init.headers) },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "HTTP " + res.status);
    return body;
  }

  function uiToRaw(amountUi) {
    return BigInt(Math.round(Number(amountUi) * 10 ** cfg.decimals));
  }

  const DaveBridge = {
    config: cfg,

    buyUrl() {
      return cfg.buyUrl;
    },

    async connect() {
      const p = provider();
      const res = await p.connect();
      return res.publicKey.toString();
    },

    async wallet() {
      const p = provider();
      if (!p.publicKey) await p.connect();
      return p.publicKey.toString();
    },

    async getConfig() {
      return api("/config");
    },

    async ledgerBalance(wallet) {
      const w = wallet || (await this.wallet());
      return api("/balance/" + w);
    },

    async onChainBalance(wallet) {
      const { PublicKey } = web3();
      const { getAssociatedTokenAddressSync, getAccount } = spl();
      const owner = new PublicKey(wallet || (await this.wallet()));
      const mint = new PublicKey(cfg.mint);
      const ata = getAssociatedTokenAddressSync(mint, owner);
      try {
        const acc = await getAccount(connection(), ata);
        return Number(acc.amount) / 10 ** cfg.decimals;
      } catch {
        return 0;
      }
    },

    async snapshot() {
      let wallet = null;
      try {
        wallet = await this.wallet();
      } catch {
        return { wallet: null, onChain: null, ledger: null };
      }
      const [onChain, ledger] = await Promise.all([
        this.onChainBalance(wallet),
        this.ledgerBalance(wallet).then((b) => b.credits).catch(() => null),
      ]);
      return { wallet, onChain, ledger };
    },

    /**
     * Transfer SPL DAVE → treasury ATA, then credit ledger via API.
     * Palace should then: DP.wallet.credit(result.credited)
     */
    async deposit(amountUi) {
      const { PublicKey, Transaction } = web3();
      const {
        getAssociatedTokenAddressSync,
        getAccount,
        createAssociatedTokenAccountInstruction,
        createTransferInstruction,
        TokenAccountNotFoundError,
      } = spl();

      if (!(Number(amountUi) > 0)) throw new Error("Montant invalide");

      const p = provider();
      if (!p.publicKey) await p.connect();
      const wallet = p.publicKey.toString();
      const treasuryCfg = await this.getConfig();
      const mint = new PublicKey(treasuryCfg.mint || cfg.mint);
      const treasuryOwner = new PublicKey(treasuryCfg.treasury);
      const conn = connection();
      const fromAta = getAssociatedTokenAddressSync(mint, p.publicKey);
      const toAta = getAssociatedTokenAddressSync(mint, treasuryOwner);

      const tx = new Transaction();
      try {
        await getAccount(conn, toAta);
      } catch (err) {
        if (err instanceof TokenAccountNotFoundError || (err && err.name === "TokenAccountNotFoundError")) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              p.publicKey,
              toAta,
              treasuryOwner,
              mint,
            ),
          );
        } else if (String(err && err.message || err).includes("could not find account")) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              p.publicKey,
              toAta,
              treasuryOwner,
              mint,
            ),
          );
        } else {
          throw err;
        }
      }

      tx.add(
        createTransferInstruction(
          fromAta,
          toAta,
          p.publicKey,
          uiToRaw(amountUi),
        ),
      );

      const { blockhash } = await conn.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = p.publicKey;

      const signed = await p.signAndSendTransaction(tx);
      const signature = typeof signed === "string" ? signed : signed.signature;
      await conn.confirmTransaction(signature, "confirmed");

      return api("/deposit/confirm", {
        method: "POST",
        body: JSON.stringify({ wallet, signature }),
      });
    },

    /**
     * Sign withdraw message → treasury sends SPL back.
     * Palace should DP.wallet.place(amount) BEFORE calling this.
     */
    async withdraw(amountUi) {
      const p = provider();
      if (!p.publicKey) await p.connect();
      if (!p.signMessage) throw new Error("Ce wallet ne signe pas les messages");

      const wallet = p.publicKey.toString();
      const prepared = await api("/withdraw/prepare", {
        method: "POST",
        body: JSON.stringify({ wallet, amount: Number(amountUi) }),
      });

      const encoded = new TextEncoder().encode(prepared.message);
      const signed = await p.signMessage(encoded, "utf8");
      const sigBytes = signed.signature || signed;
      const signature = encodeBase58(
        sigBytes instanceof Uint8Array ? sigBytes : new Uint8Array(sigBytes),
      );

      return api("/withdraw", {
        method: "POST",
        body: JSON.stringify({
          wallet,
          amount: prepared.amountUi,
          nonce: prepared.nonce,
          issuedAt: prepared.issuedAt,
          signature,
        }),
      });
    },
  };

  global.DaveBridge = DaveBridge;
})(typeof window !== "undefined" ? window : globalThis);
