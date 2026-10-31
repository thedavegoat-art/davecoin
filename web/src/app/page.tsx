import Image from "next/image";
import { TreasuryPanel } from "@/components/TreasuryPanel";
import { WalletPanel } from "@/components/WalletPanel";
import { DAVE } from "@/lib/token";

export default function Home() {
  return (
    <>
      <header className="site-header">
        <span className="brand-mark">DaveCoin</span>
        <nav style={{ display: "flex", gap: "1.25rem" }}>
          <a className="nav-link" href="#specs">
            Specs
          </a>
          <a className="nav-link" href="#wallet">
            Wallet
          </a>
          <a className="nav-link" href="#treasury">
            Treasury
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-label="DaveCoin">
          <div className="hero__media">
            <Image
              src="/davecoin.png"
              alt="Physical DaveCoin medallion"
              fill
              priority
              sizes="100vw"
            />
            <div className="hero__shade" aria-hidden />
          </div>
          <div className="hero__copy">
            <h1 className="hero__brand">DaveCoin</h1>
            <p className="hero__lede">
              Fixed-supply DAVE on Solana — one billion tokens ≈ €1 notional
              FDV. Treasury bridge ready for Dave&apos;s Palace.
            </p>
            <div className="hero__actions">
              {DAVE.buyUrl ? (
                <a
                  className="btn btn--primary"
                  href={DAVE.buyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buy DAVE
                </a>
              ) : (
                <a className="btn btn--primary" href="#wallet">
                  Connect wallet
                </a>
              )}
              <a className="btn btn--ghost" href="#treasury">
                Treasury
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="specs">
          <h2>Built as SPL</h2>
          <p>
            DaveCoin ships as a standard Solana token. Create on Devnet first,
            then promote the same flow to mainnet when you are ready.
          </p>
          <dl className="specs">
            <div>
              <dt>Symbol</dt>
              <dd>{DAVE.symbol}</dd>
            </div>
            <div>
              <dt>Decimals</dt>
              <dd>{DAVE.decimals}</dd>
            </div>
            <div>
              <dt>Supply</dt>
              <dd>{DAVE.totalSupplyUi.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>{DAVE.cluster}</dd>
            </div>
            <div>
              <dt>Notional FDV</dt>
              <dd>≈ €1</dd>
            </div>
          </dl>
        </section>

        <div className="section wallet-panel">
          <WalletPanel />
        </div>

        <div className="section">
          <TreasuryPanel />
        </div>
      </main>

      <footer className="site-footer">
        DaveCoin · open source on GitHub · not financial advice
      </footer>
    </>
  );
}
