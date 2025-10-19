import "~/styles/globals.css";

import { type Metadata } from "next";
import { Poppins } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "PreciousVault - Gold & Silver Portfolio Tracker",
  description: "Track your gold and silver holdings with real-time pricing in AUD",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
