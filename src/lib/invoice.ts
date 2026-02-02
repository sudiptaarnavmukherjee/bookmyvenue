import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

// Generate unique invoice number
export function generateInvoiceNumber(type: string = "RECEIPT"): string {
  const prefix = type === "INVOICE" ? "INV" : "RCP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Calculate GST breakdown
export function calculateGST(amount: number, rate: number = 18) {
  const taxAmount = (amount * rate) / 100;
  const isInterState = false; // For simplicity, assuming intra-state
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      total: taxAmount,
    };
  }
  
  return {
    cgst: taxAmount / 2,
    sgst: taxAmount / 2,
    igst: 0,
    total: taxAmount,
  };
}

// Generate invoice HTML
export function generateInvoiceHTML(data: {
  invoiceNumber: string;
  type: string;
  booking: any;
  payment?: any;
  business: {
    name: string;
    address: string;
    gst?: string;
    email?: string;
    phone?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    gst?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  gst: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  total: number;
  paidAmount?: number;
  balanceDue?: number;
}): string {
  const { invoiceNumber, type, booking, business, customer, items, subtotal, discount, gst, total, paidAmount, balanceDue } = data;
  
  const isReceipt = type === "RECEIPT";
  const title = isReceipt ? "Payment Receipt" : "Tax Invoice";
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  const eventDate = booking?.eventDate 
    ? new Date(booking.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 14px; 
      line-height: 1.5;
      color: #333;
      background: #fff;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #7c3aed;
    }
    .logo-section h1 {
      font-size: 28px;
      color: #7c3aed;
      margin-bottom: 5px;
    }
    .logo-section p {
      color: #666;
      font-size: 12px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 24px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .invoice-title .invoice-number {
      font-size: 14px;
      color: #7c3aed;
      font-weight: 600;
      margin-top: 5px;
    }
    .invoice-title .date {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      flex: 1;
    }
    .party h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 10px;
    }
    .party p {
      margin: 3px 0;
    }
    .party .name {
      font-weight: 600;
      font-size: 16px;
      color: #333;
    }
    .booking-details {
      background: #f8f5ff;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .booking-details h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #7c3aed;
      margin-bottom: 15px;
    }
    .booking-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .booking-item label {
      display: block;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }
    .booking-item span {
      font-weight: 600;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #7c3aed;
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #7c3aed;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #7c3aed;
    }
    .totals-row.discount {
      color: #16a34a;
    }
    .payment-status {
      margin-top: 30px;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .payment-status.paid {
      background: #dcfce7;
      color: #16a34a;
    }
    .payment-status.partial {
      background: #fef3c7;
      color: #d97706;
    }
    .payment-status.unpaid {
      background: #fee2e2;
      color: #dc2626;
    }
    .payment-status h3 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    .qr-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #ddd;
    }
    .qr-section p {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #666;
      text-align: center;
    }
    .terms {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 11px;
      color: #666;
    }
    .terms h4 {
      font-size: 12px;
      color: #333;
      margin-bottom: 10px;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .invoice-container { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <h1>✨ ShubhSpace</h1>
        <p>Your Perfect Wedding Destination</p>
      </div>
      <div class="invoice-title">
        <h2>${title}</h2>
        <div class="invoice-number">#${invoiceNumber}</div>
        <div class="date">${date}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>From</h3>
        <p class="name">${business.name}</p>
        <p>${business.address}</p>
        ${business.gst ? `<p>GSTIN: ${business.gst}</p>` : ""}
        ${business.email ? `<p>${business.email}</p>` : ""}
        ${business.phone ? `<p>${business.phone}</p>` : ""}
      </div>
      <div class="party" style="text-align: right;">
        <h3>Bill To</h3>
        <p class="name">${customer.name}</p>
        <p>${customer.email}</p>
        <p>${customer.phone}</p>
        ${customer.address ? `<p>${customer.address}</p>` : ""}
        ${customer.gst ? `<p>GSTIN: ${customer.gst}</p>` : ""}
      </div>
    </div>

    <div class="booking-details">
      <h3>Booking Details</h3>
      <div class="booking-grid">
        <div class="booking-item">
          <label>Booking Number</label>
          <span>${booking?.bookingNumber || "N/A"}</span>
        </div>
        <div class="booking-item">
          <label>Event Date</label>
          <span>${eventDate}</span>
        </div>
        <div class="booking-item">
          <label>Guest Count</label>
          <span>${booking?.guestCount || "N/A"}</span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.rate)}</td>
            <td>${formatCurrency(item.amount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div class="totals-row discount">
            <span>Discount</span>
            <span>-${formatCurrency(discount)}</span>
          </div>
        ` : ""}
        ${gst.cgst > 0 ? `
          <div class="totals-row">
            <span>CGST (9%)</span>
            <span>${formatCurrency(gst.cgst)}</span>
          </div>
          <div class="totals-row">
            <span>SGST (9%)</span>
            <span>${formatCurrency(gst.sgst)}</span>
          </div>
        ` : ""}
        ${gst.igst > 0 ? `
          <div class="totals-row">
            <span>IGST (18%)</span>
            <span>${formatCurrency(gst.igst)}</span>
          </div>
        ` : ""}
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>
        ${paidAmount !== undefined ? `
          <div class="totals-row">
            <span>Paid</span>
            <span>${formatCurrency(paidAmount)}</span>
          </div>
          <div class="totals-row">
            <span>Balance Due</span>
            <span>${formatCurrency(balanceDue || 0)}</span>
          </div>
        ` : ""}
      </div>
    </div>

    ${isReceipt && paidAmount !== undefined ? `
      <div class="payment-status ${paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'}">
        <h3>${paidAmount >= total ? '✓ PAID IN FULL' : paidAmount > 0 ? '⏳ PARTIALLY PAID' : '✗ UNPAID'}</h3>
        ${paidAmount >= total ? '<p>Thank you for your payment!</p>' : `<p>Balance Due: ${formatCurrency((balanceDue || 0))}</p>`}
      </div>
    ` : ""}

    <div class="terms">
      <h4>Terms & Conditions</h4>
      <ul>
        <li>Advance payment is non-refundable within 7 days of the event.</li>
        <li>Cancellation charges apply as per our cancellation policy.</li>
        <li>Final guest count must be confirmed 3 days before the event.</li>
        <li>This is a computer-generated document and does not require a signature.</li>
      </ul>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString("en-IN")} | ShubhSpace - Making Your Wedding Dreams Come True</p>
      <p>For support, contact: support@shubhspace.com | +91 9999999999</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Create invoice record
export async function createInvoice(bookingId: string, paymentId?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      venue: { include: { owner: true } },
      caterer: { include: { owner: true } },
      payments: { where: { status: PaymentStatus.COMPLETED } },
      user: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const invoiceNumber = generateInvoiceNumber("RECEIPT");
  const payment = paymentId 
    ? booking.payments.find(p => p.id === paymentId)
    : booking.payments[0];

  const business = booking.venue 
    ? {
        name: booking.venue.name,
        address: booking.venue.address,
        gst: booking.venue.owner?.gstNumber || undefined,
      }
    : booking.caterer
    ? {
        name: booking.caterer.name,
        address: booking.caterer.address,
        gst: booking.caterer.owner?.gstNumber || undefined,
      }
    : {
        name: "ShubhSpace",
        address: "Kolkata, West Bengal",
      };

  const subtotal = booking.baseAmount || booking.totalAmount || 0;
  const taxAmount = booking.taxAmount || 0;
  const gst = calculateGST(subtotal - taxAmount, 18);
  const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      type: "RECEIPT",
      bookingId,
      paymentId: payment?.id,
      subtotal,
      discount: 0,
      taxAmount,
      totalAmount: booking.totalAmount || 0,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      businessName: business.name,
      businessAddress: business.address,
      businessGst: business.gst,
      generatedAt: new Date(),
    },
  });

  return invoice;
}
