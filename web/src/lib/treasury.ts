export const TREASURY_URL =
  process.env.NEXT_PUBLIC_TREASURY_URL ?? "http://localhost:8787";

export type TreasuryConfig = {
  mint: string;
  treasury: string;
  treasuryAta: string;
  decimals: number;
  symbol: string;
  cluster: string;
  totalSupplyUi: number;
  notionalFdvEur: number;
  eurPerDave: number;
  note: string;
};

export type LedgerBalance = {
  wallet: string;
  credits: number;
  dave: number;
  notionalEur: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TREASURY_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body as T;
}

export const treasuryApi = {
  config: () => api<TreasuryConfig>("/config"),
  balance: (wallet: string) => api<LedgerBalance>(`/balance/${wallet}`),
  confirmDeposit: (wallet: string, signature: string) =>
    api<{ credited: number; balance: number; notionalEur: string }>(
      "/deposit/confirm",
      {
        method: "POST",
        body: JSON.stringify({ wallet, signature }),
      },
    ),
  prepareWithdraw: (wallet: string, amount: number) =>
    api<{
      message: string;
      nonce: string;
      issuedAt: string;
      amountUi: number;
      wallet: string;
    }>("/withdraw/prepare", {
      method: "POST",
      body: JSON.stringify({ wallet, amount }),
    }),
  withdraw: (payload: {
    wallet: string;
    amount: number;
    nonce: string;
    issuedAt: string;
    signature: string;
  }) =>
    api<{ withdrawn: number; balance: number; signature: string; notionalEur: string }>(
      "/withdraw",
      { method: "POST", body: JSON.stringify(payload) },
    ),
};
