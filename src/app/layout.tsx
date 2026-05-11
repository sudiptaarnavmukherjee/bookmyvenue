import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CompareProvider } from "@/components/providers/CompareProvider";
import { generateOrganizationSchema, generateSearchActionSchema, JsonLd } from "@/lib/structured-data";
import { LayoutShell, FooterShell } from "@/components/layout/LayoutShell";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "BookMyVenue - Find Perfect Wedding Venues & Catering in Kolkata",
    template: "%s | BookMyVenue",
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
    "BookMyVenue",
  ],
  authors: [{ name: "BookMyVenue Team" }],
  creator: "BookMyVenue",
  metadataBase: new URL("https://bookmyvenue.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bookmyvenue.in",
    siteName: "BookMyVenue",
    title: "BookMyVenue - Wedding Venues & Catering Marketplace Kolkata",
    description: "Find and book perfect wedding venues and catering services in Kolkata with transparent pricing.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BookMyVenue - Wedding Venues & Catering Kolkata",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookMyVenue - Wedding Venues & Catering",
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
      <body className={`${inter.className} overflow-x-hidden antialiased`}>
        <SessionProvider>
          <CompareProvider>
            {/* Main content renders IMMEDIATELY - no blocking */}
            <main className="min-h-screen pb-16 lg:pt-16 page-enter">
              {children}
            </main>
            
            {/* Non-critical UI loads AFTER content via client component */}
            <LayoutShell />
            <FooterShell />
          </CompareProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
