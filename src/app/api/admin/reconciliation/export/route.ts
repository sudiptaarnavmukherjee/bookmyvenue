import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          const str = String(value);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

function resolveDateRange(range: string) {
  const now = new Date();
  switch (range) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const startDate = resolveDateRange(range);

    const rows = await prisma.cancellationRequest.findMany({
      where: {
        status: "APPROVED",
        approvedAt: { gte: startDate },
      },
      select: {
        id: true,
        bookingId: true,
        refundAmount: true,
        refundStatus: true,
        refundId: true,
        approvedAt: true,
        refundedAt: true,
        processNotes: true,
        booking: {
          select: {
            bookingNumber: true,
            customerName: true,
            customerEmail: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { approvedAt: "desc" },
    });

    const csvRows = rows.map((row) => ({
      cancellationId: row.id,
      bookingId: row.bookingId,
      bookingNumber: row.booking.bookingNumber,
      customerName: row.booking.customerName,
      customerEmail: row.booking.customerEmail || "",
      bookingTotalAmount: row.booking.totalAmount || 0,
      refundAmount: row.refundAmount || 0,
      refundStatus: row.refundStatus || "PENDING",
      refundReference: row.refundId || "",
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : "",
      refundedAt: row.refundedAt ? row.refundedAt.toISOString() : "",
      notes: row.processNotes || "",
      reconciliationFlag:
        (row.refundAmount || 0) > 0 && row.refundStatus !== "COMPLETED"
          ? "MISMATCH"
          : "OK",
    }));

    const csv = toCsv(csvRows);
    const filename = `reconciliation-${range}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Reconciliation export error:", error);
    return NextResponse.json({ error: "Failed to export reconciliation report" }, { status: 500 });
  }
}
