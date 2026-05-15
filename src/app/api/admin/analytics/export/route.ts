import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function toCsv(rows: Record<string, string | number | null | undefined>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

// GET /api/admin/analytics/export?type=bookings|revenue&period=week|month|year|all
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "bookings";
    const period = searchParams.get("period") || "month";

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    let csvContent = "";
    let filename = "";

    if (type === "bookings") {
      const bookings = await prisma.booking.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          bookingNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          status: true,
          eventDate: true,
          guestCount: true,
          totalAmount: true,
          createdAt: true,
          venue: { select: { name: true } },
          caterer: { select: { name: true } },
          payments: { select: { status: true, method: true, paidAt: true }, take: 1, orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      });

      const rows = bookings.map((b) => {
        const pmt = b.payments?.[0];
        return {
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          customerEmail: b.customerEmail || "",
          customerPhone: b.customerPhone || "",
          status: b.status,
          venueName: b.venue?.name || "",
          catererName: b.caterer?.name || "",
          eventDate: b.eventDate ? new Date(b.eventDate).toISOString().split("T")[0] : "",
          guestCount: b.guestCount ?? "",
          totalAmount: b.totalAmount ?? "",
          paymentStatus: pmt?.status || "",
          paymentMethod: pmt?.method || "",
          paidAt: pmt?.paidAt ? new Date(pmt.paidAt).toISOString() : "",
          createdAt: new Date(b.createdAt).toISOString(),
        };
      });

      csvContent = toCsv(rows);
      filename = `bookings-${period}-${now.toISOString().split("T")[0]}.csv`;
    } else if (type === "revenue") {
      const payments = await prisma.payment.findMany({
        where: {
          status: "COMPLETED",
          paidAt: { gte: startDate },
        },
        select: {
          id: true,
          amount: true,
          platformFee: true,
          ownerAmount: true,
          method: true,
          paidAt: true,
          booking: {
            select: {
              bookingNumber: true,
              customerName: true,
              venue: { select: { name: true } },
              caterer: { select: { name: true } },
            },
          },
        },
        orderBy: { paidAt: "desc" },
      });

      const rows = payments.map((p) => ({
        paymentId: p.id,
        bookingNumber: p.booking?.bookingNumber || "",
        customerName: p.booking?.customerName || "",
        property: p.booking?.venue?.name || p.booking?.caterer?.name || "",
        totalAmount: p.amount,
        platformFee: p.platformFee ?? "",
        ownerAmount: p.ownerAmount ?? "",
        method: p.method || "",
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : "",
      }));

      csvContent = toCsv(rows);
      filename = `revenue-${period}-${now.toISOString().split("T")[0]}.csv`;
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
