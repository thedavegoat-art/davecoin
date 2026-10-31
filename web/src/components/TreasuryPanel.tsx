"use client";

import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DAVE } from "@/lib/token";
import {
  treasuryApi,
  type LedgerBalance,
  type TreasuryConfig,
} from "@/lib/treasury";

export function TreasuryPanel() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, connected } = useWallet();
  const [config, setConfig] = useState<TreasuryConfig | null>(null);
  const [ledger, setLedger] = useState<LedgerBalance | null>(null);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("100");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const cfg = await treasuryApi.config();
      setConfig(cfg);
      if (publicKey) {
        setLedger(await treasuryApi.balance(publicKey.toBase58()));
      } else {
        setLedger(null);
      }
    } catch (err) {
      setConfig(null);
      setStatus(
        err instanceof Error
          ? `Treasury offline: ${err.message}`
          : "Treasury offline",
      );
    }
  }, [publicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onDeposit(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !config || !DAVE.mint) return;
    setBusy(true);
    setStatus(null);
    try {
      const mint = new PublicKey(config.mint || DAVE.mint);
      const treasuryOwner = new PublicKey(config.treasury);
      const amountUi = Number(depositAmount);
      if (!(amountUi > 0)) throw new Error("Invalid amount");
      const raw = BigInt(Math.round(amountUi * 10 ** DAVE.decimals));

      const fromAta = getAssociatedTokenAddressSync(mint, publicKey);
      const toAta = getAssociatedTokenAddressSync(mint, treasuryOwner);
      const tx = new Transaction();

      try {
        await getAccount(connection, toAta);
      } catch (err) {
        if (err instanceof TokenAccountNotFoundError) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              toAta,
              treasuryOwner,
              mint,
            ),
          );
        } else {
          throw err;
        }
      }

      tx.add(createTransferInstruction(fromAta, toAta, publicKey, raw));
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const result = await treasuryApi.confirmDeposit(
        publicKey.toBase58(),
        signature,
      );
      setStatus(
        `Deposited ${result.credited} DAVE (${result.notionalEur}). Ledger: ${result.balance}`,
      );
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  }

  async function onWithdraw(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !signMessage) {
      setStatus("Wallet cannot sign messages");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const amount = Number(withdrawAmount);
      const prepared = await treasuryApi.prepareWithdraw(
        publicKey.toBase58(),
        amount,
      );
      const sigBytes = await signMessage(
        new TextEncoder().encode(prepared.message),
      );
      const result = await treasuryApi.withdraw({
        wallet: publicKey.toBase58(),
        amount: prepared.amountUi,
        nonce: prepared.nonce,
        issuedAt: prepared.issuedAt,
        signature: bs58.encode(sigBytes),
      });
      setStatus(
        `Withdrew ${result.withdrawn} DAVE (${result.notionalEur}). Tx ${result.signature.slice(0, 8)}…`,
      );
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wallet-panel" id="treasury">
      <div className="wallet-panel__head">
        <h2>Treasury bridge</h2>
        <p>
          Deposit live pump.fun DAVE → ledger credits (1:1) for Dave&apos;s
          Palace later. Buy first on pump if your wallet is empty.
        </p>
      </div>

      {config ? (
        <div className="wallet-panel__balance">
          <span>Live mint</span>
          <strong style={{ fontSize: "1rem", wordBreak: "break-all" }}>
            {config.mint}
          </strong>
          <span>
            {config.decimals} decimals · {config.cluster}
            {config.buyUrl ? (
              <>
                {" "}
                ·{" "}
                <a href={config.buyUrl} target="_blank" rel="noreferrer">
                  Buy on pump.fun
                </a>
              </>
            ) : null}
          </span>
        </div>
      ) : (
        <p className="wallet-panel__hint">
          Start the API: <code>npm run treasury:dev</code>
        </p>
      )}

      {connected && ledger && (
        <div className="wallet-panel__balance">
          <span>Ledger (custodial credits)</span>
          <strong>
            {ledger.credits.toLocaleString("en-US")} DAVE
          </strong>
          <span>{ledger.notionalEur}</span>
        </div>
      )}

      {connected && config && (
        <div className="treasury-grid">
          <form className="wallet-panel__form" onSubmit={onDeposit}>
            <label>
              Deposit to treasury
              <input
                type="number"
                min="0"
                step="any"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working…" : "Deposit DAVE"}
            </button>
          </form>

          <form className="wallet-panel__form" onSubmit={onWithdraw}>
            <label>
              Withdraw to wallet
              <input
                type="number"
                min="0"
                step="any"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Working…" : "Withdraw DAVE"}
            </button>
          </form>
        </div>
      )}

      {status && <p className="wallet-panel__status">{status}</p>}
    </section>
  );
}
