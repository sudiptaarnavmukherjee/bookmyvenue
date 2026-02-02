import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/layout/MobileNav";
import DesktopNav from "@/components/layout/DesktopNav";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { generateOrganizationSchema, generateSearchActionSchema, JsonLd } from "@/lib/structured-data";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "BookMyVenue - Find Perfect Wedding Venues & Catering in Hyderabad",
    template: "%s | BookMyVenue",
  },
  description: "Discover and book the best wedding venues and catering services in Hyderabad. Compare prices, amenities, and reviews. Trusted by 10,000+ couples.",
  keywords: [
    "wedding venue",
    "wedding hall",
    "banquet hall",
    "function hall",
    "catering services",
    "wedding catering",
    "Hyderabad venues",
    "marriage hall",
    "ShubhSpace",
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
    title: "BookMyVenue - Wedding Venues & Catering Marketplace",
    description: "Find and book perfect wedding venues and catering services in Hyderabad.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BookMyVenue - Wedding Venues & Catering",
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
    <html lang="en">
      <head>
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateSearchActionSchema()} />
      </head>
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
