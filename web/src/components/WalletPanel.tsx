"use client";

import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DAVE, explorerAddressUrl, formatDave } from "@/lib/token";

export function WalletPanel() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey || !DAVE.mint) {
      setBalance(null);
      return;
    }
    try {
      const mint = new PublicKey(DAVE.mint);
      const ata = getAssociatedTokenAddressSync(mint, publicKey);
      const account = await getAccount(connection, ata);
      setBalance(account.amount);
    } catch {
      setBalance(0n);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 12_000);
    return () => clearInterval(id);
  }, [refresh]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !DAVE.mint) return;
    setBusy(true);
    setStatus(null);
    try {
      const mint = new PublicKey(DAVE.mint);
      const toOwner = new PublicKey(recipient.trim());
      const rawAmount = BigInt(
        Math.round(Number(amount) * 10 ** DAVE.decimals),
      );
      if (rawAmount <= 0n) throw new Error("Amount must be positive");

      const fromAta = getAssociatedTokenAddressSync(mint, publicKey);
      const toAta = getAssociatedTokenAddressSync(mint, toOwner);
      const tx = new Transaction();

      try {
        await getAccount(connection, toAta);
      } catch (err) {
        if (err instanceof TokenAccountNotFoundError) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              toAta,
              toOwner,
              mint,
            ),
          );
        } else {
          throw err;
        }
      }

      tx.add(
        createTransferInstruction(fromAta, toAta, publicKey, rawAmount),
      );

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setStatus(`Sent ${amount} DAVE · ${signature.slice(0, 8)}…`);
      setRecipient("");
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wallet-panel" id="wallet">
      <div className="wallet-panel__head">
        <h2>Your wallet</h2>
        <p>Connect Phantom or Solflare on Solana {DAVE.cluster}.</p>
      </div>

      <div className="wallet-panel__connect">
        <WalletMultiButton />
      </div>

      {!DAVE.mint && (
        <p className="wallet-panel__hint">
          Mint not configured yet. After deploy, set{" "}
          <code>NEXT_PUBLIC_DAVE_MINT</code> in <code>web/.env.local</code>.
        </p>
      )}

      {connected && DAVE.mint && (
        <>
          <div className="wallet-panel__balance">
            <span>Balance</span>
            <strong>
              {balance === null ? "…" : `${formatDave(balance)} DAVE`}
            </strong>
            <a
              href={explorerAddressUrl(DAVE.mint)}
              target="_blank"
              rel="noreferrer"
            >
              View mint on Explorer
            </a>
          </div>

          <form className="wallet-panel__form" onSubmit={onSend}>
            <label>
              Recipient
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Solana address"
                required
                spellCheck={false}
              />
            </label>
            <label>
              Amount (DAVE)
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send DAVE"}
            </button>
          </form>
        </>
      )}

      {status && <p className="wallet-panel__status">{status}</p>}
    </section>
  );
}
