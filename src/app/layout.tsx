import type { Metadata } from "next";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import "./globals.css";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME ?? "TOKEN";

export const metadata: Metadata = {
  title: "Board of Meme",
  description: `${TOKEN_NAME} token holder meme canvas. Your bag size = your tile size.`,
  openGraph: {
    title: "Board of Meme",
    description: `${TOKEN_NAME} holders only. Connect wallet, drop meme.`,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
