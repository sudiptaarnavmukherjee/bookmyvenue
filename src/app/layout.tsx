import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { SessionProviderGate } from "@/components/providers/SessionProviderGate";
import { CompareProviderGate } from "@/components/providers/CompareProviderGate";
import { generateOrganizationSchema, generateSearchActionSchema, JsonLd } from "@/lib/structured-data";
import { LayoutShell } from "@/components/layout/LayoutShell";
import Footer from "@/components/layout/Footer";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Happily Eated - Find Perfect Wedding Venues & Catering in Kolkata",
    template: "%s | Happily Eated",
  },
  description: "Discover and book the best wedding venues and catering services in Kolkata. Compare prices, amenities, and reviews. Transparent pricing. Trusted by 10,000+ couples.",
  keywords: [
    "wedding venue Kolkata",
    "wedding hall",
    "banquet hall Kolkata",
    "function hall",
    "catering services Kolkata",
    "wedding catering",
    "Kolkata venues",
    "marriage hall Kolkata",
    "Salt Lake venue",
    "New Town venue",
    "Happily Eated",
  ],
  authors: [{ name: "Happily Eated Team" }],
  creator: "Happily Eated",
  metadataBase: new URL("https://bookmyvenue.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bookmyvenue.in",
    siteName: "Happily Eated",
    title: "Happily Eated - Wedding Venues & Catering Marketplace Kolkata",
    description: "Find and book perfect wedding venues and catering services in Kolkata with transparent pricing.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Happily Eated - Wedding Venues & Catering Kolkata",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Happily Eated - Wedding Venues & Catering",
    description: "Find and book perfect wedding venues and catering services.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateSearchActionSchema()} />
      </head>
      <body className={`${lato.className} overflow-x-hidden antialiased`}>
        <SessionProviderGate>
          <CompareProviderGate>
            {/* Main content renders IMMEDIATELY - no blocking */}
            <main className="min-h-screen pb-16 lg:pt-16 page-enter">
              {children}
            </main>
            
            {/* Non-critical UI loads AFTER content via client component */}
            <LayoutShell />
            <Footer />
          </CompareProviderGate>
        </SessionProviderGate>
      </body>
    </html>
  );
}
