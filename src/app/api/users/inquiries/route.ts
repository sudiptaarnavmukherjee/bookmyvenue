import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/inquiries
 * Returns all inquiries sent by the authenticated user, with listing details.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : null;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inquiries = await prisma.userInquiry.findMany({
      where: { userId },
      include: {
        venue: { select: { id: true, name: true, city: true, slug: true } },
        caterer: { select: { id: true, name: true, city: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("User inquiries fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
