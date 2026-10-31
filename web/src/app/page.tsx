import Image from "next/image";
import { WalletPanel } from "@/components/WalletPanel";
import { DAVE } from "@/lib/token";

export default function Home() {
  return (
    <>
      <header className="site-header">
        <span className="brand-mark">DaveCoin</span>
        <a className="nav-link" href="#wallet">
          Wallet
        </a>
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
              Fixed-supply DAVE on Solana — one billion tokens, mint authority
              burned at create.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#wallet">
                Connect wallet
              </a>
              <a className="btn btn--ghost" href="#specs">
                Token specs
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
          </dl>
        </section>

        <div className="section wallet-panel">
          <WalletPanel />
        </div>
      </main>

      <footer className="site-footer">
        DaveCoin · open source on GitHub · not financial advice
      </footer>
    </>
  );
}
