import cors from "cors";
import express from "express";
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import {
  assertFreshIssuedAt,
  buildWithdrawMessage,
  verifyWalletSignature,
} from "./auth.js";
import {
  getConnection,
  getMint,
  getTreasuryKeypair,
  PORT,
  publicConfig,
} from "./config.js";
import { formatEur } from "./economics.js";
import {
  creditDeposit,
  debitWithdraw,
  getCredits,
  hasDeposit,
  refundFailedWithdraw,
} from "./ledger.js";
import {
  getTokenUiBalance,
  parseIncomingDeposit,
  sendDaveFromTreasury,
  treasuryAta,
} from "./solana.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));

function mintPk() {
  return getMint();
}
function treasuryKp() {
  return getTreasuryKeypair();
}
function connection() {
  return getConnection();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "davecoin-treasury" });
});

app.get("/config", (_req, res) => {
  try {
    const mint = mintPk();
    const treasury = treasuryKp().publicKey;
    const ata = treasuryAta(mint, treasury).toBase58();
    res.json(publicConfig(ata));
  } catch (err) {
    res.status(503).json({
      error: err instanceof Error ? err.message : "Config unavailable",
    });
  }
});

app.get("/balance/:wallet", (req, res) => {
  try {
    const wallet = new PublicKey(req.params.wallet).toBase58();
    const credits = getCredits(wallet);
    res.json({
      wallet,
      credits,
      dave: credits,
      notionalEur: formatEur(credits),
    });
  } catch {
    res.status(400).json({ error: "Invalid wallet" });
  }
});

app.get("/treasury/onchain", async (_req, res) => {
  try {
    const mint = mintPk();
    const treasury = treasuryKp().publicKey;
    const balance = await getTokenUiBalance(connection(), mint, treasury);
    res.json({
      treasury: treasury.toBase58(),
      treasuryAta: treasuryAta(mint, treasury).toBase58(),
      balanceDave: balance,
      notionalEur: formatEur(balance),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed",
    });
  }
});

app.post("/deposit/confirm", async (req, res) => {
  try {
    const wallet = new PublicKey(String(req.body.wallet)).toBase58();
    const signature = String(req.body.signature || "");
    if (!signature) throw new Error("signature required");
    if (hasDeposit(signature)) {
      return res.status(409).json({ error: "Already credited" });
    }

    const mint = mintPk();
    const treasury = treasuryKp().publicKey;
    const ata = treasuryAta(mint, treasury);
    const { amountUi } = await parseIncomingDeposit(
      connection(),
      signature,
      mint,
      ata,
      new PublicKey(wallet),
    );

    const account = creditDeposit(wallet, amountUi, signature);
    res.json({
      ok: true,
      credited: amountUi,
      notionalEur: formatEur(amountUi),
      balance: account.credits,
      signature,
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Deposit failed",
    });
  }
});

app.post("/withdraw/prepare", (req, res) => {
  try {
    const wallet = new PublicKey(String(req.body.wallet)).toBase58();
    const amountUi = Number(req.body.amount);
    if (!(amountUi > 0)) throw new Error("Invalid amount");
    if (getCredits(wallet) + 1e-12 < amountUi) {
      throw new Error("Insufficient ledger balance");
    }
    const nonce = uuidv4();
    const issuedAt = new Date().toISOString();
    const message = buildWithdrawMessage({
      wallet,
      amountUi,
      nonce,
      issuedAt,
    });
    res.json({ message, nonce, issuedAt, amountUi, wallet });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Prepare failed",
    });
  }
});

app.post("/withdraw", async (req, res) => {
  try {
    const wallet = new PublicKey(String(req.body.wallet)).toBase58();
    const amountUi = Number(req.body.amount);
    const nonce = String(req.body.nonce || "");
    const issuedAt = String(req.body.issuedAt || "");
    const signatureBase58 = String(req.body.signature || "");

    if (!(amountUi > 0)) throw new Error("Invalid amount");
    assertFreshIssuedAt(issuedAt);
    const message = buildWithdrawMessage({
      wallet,
      amountUi,
      nonce,
      issuedAt,
    });
    verifyWalletSignature({ wallet, message, signatureBase58 });

    const mint = mintPk();
    const treasury = treasuryKp();
    const onchain = await getTokenUiBalance(
      connection(),
      mint,
      treasury.publicKey,
    );
    if (onchain + 1e-12 < amountUi) {
      throw new Error("Treasury underfunded on-chain — try a smaller amount");
    }

    const account = debitWithdraw(wallet, amountUi, nonce);
    let txSig: string;
    try {
      txSig = await sendDaveFromTreasury({
        connection: connection(),
        mint,
        treasury,
        recipient: new PublicKey(wallet),
        amountUi,
      });
    } catch (sendErr) {
      refundFailedWithdraw(wallet, amountUi);
      throw sendErr;
    }

    res.json({
      ok: true,
      withdrawn: amountUi,
      notionalEur: formatEur(amountUi),
      balance: account.credits,
      signature: txSig,
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Withdraw failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`DaveCoin treasury listening on :${PORT}`);
  try {
    const mint = mintPk();
    const treasury = treasuryKp().publicKey;
    console.log(`Mint:     ${mint.toBase58()}`);
    console.log(`Treasury: ${treasury.toBase58()}`);
    console.log(`ATA:      ${treasuryAta(mint, treasury).toBase58()}`);
    console.log(`Economics: 1B DAVE ≈ €1 FDV (toy)`);
  } catch (err) {
    console.warn(
      "Mint not ready yet:",
      err instanceof Error ? err.message : err,
    );
  }
});
