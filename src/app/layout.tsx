import "~/styles/globals.css";

import { type Metadata } from "next";
import { Instrument_Serif, Source_Sans_3 } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "PreciousVault - Gold & Silver Portfolio Tracker",
  description: "Track your gold and silver holdings with real-time pricing in AUD",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${sourceSans.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
