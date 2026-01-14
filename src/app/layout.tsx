import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/layout/MobileNav";
import DesktopNav from "@/components/layout/DesktopNav";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShubhSpace - Wedding Venues & Catering Marketplace",
  description: "Find and book perfect wedding venues and catering services. The ultimate wedding planning platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <DesktopNav />
          <main className="min-h-screen bg-cream-50">
            {children}
          </main>
          <MobileNav />
        </SessionProvider>
      </body>
    </html>
  );
}
