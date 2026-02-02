import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const SITE_URL = "https://bookmyvenue.in";

export async function GET() {
  try {
    // Get all active venues and caterers
    const [venues, caterers, areas] = await Promise.all([
      prisma.venue.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.caterer.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.area.findMany({
        where: { isPopular: true },
        select: { name: true, city: true },
      }),
    ]);

    // Static pages
    const staticPages = [
      { url: "/", priority: 1.0, changefreq: "daily" },
      { url: "/venues", priority: 0.9, changefreq: "daily" },
      { url: "/catering", priority: 0.9, changefreq: "daily" },
      { url: "/auth/signin", priority: 0.3, changefreq: "monthly" },
      { url: "/auth/signup", priority: 0.3, changefreq: "monthly" },
    ];

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("")}
  ${venues
    .map(
      (venue) => `
  <url>
    <loc>${SITE_URL}/venues/${venue.slug}</loc>
    <lastmod>${venue.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
  ${caterers
    .map(
      (caterer) => `
  <url>
    <loc>${SITE_URL}/catering/${caterer.slug}</loc>
    <lastmod>${caterer.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
  ${areas
    .map(
      (area) => `
  <url>
    <loc>${SITE_URL}/venues?area=${encodeURIComponent(area.name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return NextResponse.json(
      { error: "Failed to generate sitemap" },
      { status: 500 }
    );
  }
}
