import { CartProvider } from "@/components/cart-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { paymentsMode } from "@/lib/config";
import { phpPerUsd } from "@/lib/currency";
import type { Metadata } from "next";
import { Sora, Syne } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "NebulaCraft Store",
    template: "%s · NebulaCraft",
  },
  description: "Buy NebulaCraft ranks, Stardust, and crate keys. Delivered in game.",
};

export const viewport = {
  themeColor: "#12343c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const mode = paymentsMode();

  return (
    <html lang="en">
      <body className={`${sora.variable} ${syne.variable}`}>
        <CurrencyProvider phpRate={phpPerUsd()}>
          <CartProvider>
            <a
              href="#content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2"
            >
              Skip to content
            </a>
            {mode === "test" ? (
              <p className="bg-[#ff7a32] px-4 py-2 text-center text-sm font-semibold text-[#1c120b]">
                Test checkout is on. No card is charged. Packages still queue for the server.
              </p>
            ) : null}
            <Header />
            <main id="content">{children}</main>
            <Footer />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
