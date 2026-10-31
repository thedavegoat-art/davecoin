import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DaveCoin — DAVE on Solana",
  description:
    "DaveCoin (DAVE) is a fixed-supply SPL token on Solana. Connect your wallet, hold DAVE, send DAVE.",
  openGraph: {
    title: "DaveCoin",
    description: "Fixed-supply SPL token on Solana",
    images: ["/davecoin.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${outfit.variable} antialiased`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
