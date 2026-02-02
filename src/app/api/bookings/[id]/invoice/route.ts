import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { generateInvoiceNumber, generateInvoiceHTML, calculateGST, formatCurrency } from "@/lib/invoice";

// GET /api/bookings/[id]/invoice - Get or generate invoice for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json"; // json, html
    const type = searchParams.get("type") || "RECEIPT";

    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: {
          include: {
            owner: {
              select: { name: true, email: true, phone: true, gstNumber: true },
            },
          },
        },
        caterer: {
          include: {
            owner: {
              select: { name: true, email: true, phone: true, gstNumber: true },
            },
          },
        },
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          orderBy: { createdAt: "desc" },
        },
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access: user, owner, or admin
    const isOwner = 
      booking.venue?.ownerId === session.user.id ||
      booking.caterer?.ownerId === session.user.id;
    const isUser = booking.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isUser && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if invoice already exists
    let invoice = await prisma.invoice.findFirst({
      where: { bookingId, type },
      orderBy: { createdAt: "desc" },
    });

    // Generate invoice number if not exists
    const invoiceNumber = invoice?.invoiceNumber || generateInvoiceNumber(type);

    // Build business details
    const business = booking.venue
      ? {
          name: booking.venue.name,
          address: `${booking.venue.address}, ${booking.venue.area || ""}, ${booking.venue.city} - ${booking.venue.pincode}`,
          gst: booking.venue.owner?.gstNumber || undefined,
          email: booking.venue.owner?.email,
          phone: booking.venue.contactNumber || booking.venue.owner?.phone || undefined,
        }
      : booking.caterer
      ? {
          name: booking.caterer.name,
          address: booking.caterer.address,
          gst: booking.caterer.owner?.gstNumber || undefined,
          email: booking.caterer.owner?.email,
          phone: booking.caterer.contactNumber || booking.caterer.owner?.phone || undefined,
        }
      : {
          name: "ShubhSpace",
          address: "Kolkata, West Bengal, India",
          email: "support@shubhspace.com",
          phone: "+91 9999999999",
        };

    // Build customer details
    const customer = {
      name: booking.customerName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
    };

    // Calculate amounts
    const baseAmount = booking.baseAmount || booking.totalAmount || 0;
    const taxAmount = booking.taxAmount || 0;
    const totalAmount = booking.totalAmount || 0;
    const discount = 0; // TODO: Add promo code discount
    const gst = calculateGST(baseAmount, 18);
    
    // Calculate paid amounts
    const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = totalAmount - paidAmount;

    // Build line items
    const items = [];
    
    if (booking.venue) {
      items.push({
        description: `Venue Booking - ${booking.venue.name}`,
        quantity: 1,
        rate: baseAmount,
        amount: baseAmount,
      });
    } else if (booking.caterer) {
      const packageName = booking.selectedPackage || "Standard";
      items.push({
        description: `Catering Service - ${booking.caterer.name} (${packageName} Package)`,
        quantity: booking.guestCount || 1,
        rate: baseAmount / (booking.guestCount || 1),
        amount: baseAmount,
      });
    }

    // If HTML format requested, return rendered HTML
    if (format === "html") {
      const html = generateInvoiceHTML({
        invoiceNumber,
        type,
        booking,
        business,
        customer,
        items,
        subtotal: baseAmount,
        discount,
        gst,
        total: totalAmount,
        paidAmount,
        balanceDue,
      });

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // Create or update invoice record
    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          type,
          bookingId,
          paymentId: booking.payments[0]?.id,
          subtotal: baseAmount,
          discount,
          taxAmount: gst.total,
          totalAmount,
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          businessName: business.name,
          businessAddress: business.address,
          businessGst: business.gst,
          generatedAt: new Date(),
        },
      });
    }

    // Return JSON data
    return NextResponse.json({
      invoice: {
        ...invoice,
        business,
        customer,
        items,
        gst,
        paidAmount,
        balanceDue,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          eventDate: booking.eventDate,
          guestCount: booking.guestCount,
          status: booking.status,
          type: booking.type,
        },
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

// POST /api/bookings/[id]/invoice - Generate new invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { type = "RECEIPT", customerGst } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: { include: { owner: true } },
        caterer: { include: { owner: true } },
        payments: { where: { status: PaymentStatus.COMPLETED } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access
    const isOwner =
      booking.venue?.ownerId === session.user.id ||
      booking.caterer?.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const invoiceNumber = generateInvoiceNumber(type);
    const baseAmount = booking.baseAmount || booking.totalAmount || 0;
    const gst = calculateGST(baseAmount, 18);

    const business = booking.venue
      ? {
          name: booking.venue.name,
          address: booking.venue.address,
          gst: booking.venue.owner?.gstNumber,
        }
      : booking.caterer
      ? {
          name: booking.caterer.name,
          address: booking.caterer.address,
          gst: booking.caterer.owner?.gstNumber,
        }
      : { name: "ShubhSpace", address: "Kolkata" };

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type,
        bookingId,
        paymentId: booking.payments[0]?.id,
        subtotal: baseAmount,
        discount: 0,
        taxAmount: gst.total,
        totalAmount: booking.totalAmount || 0,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        gstNumber: customerGst,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        businessName: business.name,
        businessAddress: business.address,
        businessGst: business.gst,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
