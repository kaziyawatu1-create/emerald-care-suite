import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

type MailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

type OrderReceiptData = {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_kes: number | string;
  payment_method: string;
  order_status: string;
  notes?: string | null;
};

type OrderReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price_kes: number;
  subtotal_kes: number;
};

function formatKES(value: number | string) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);
}

function getMailConfig() {
  const contactEmail = process.env.CONTACT_EMAIL ?? "nunopharmaceutical@gmail.com";
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER ?? contactEmail;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? smtpUser;

  const transporter = smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

  return { contactEmail, smtpFrom, transporter };
}

export async function sendMail(options: SendMailOptions) {
  const { transporter, smtpFrom, contactEmail } = getMailConfig();

  if (!transporter) {
    throw new Error(`Email service is not configured. Set SMTP_PASS for ${contactEmail}.`);
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: options.to,
    cc: options.cc,
    replyTo: options.replyTo ?? options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
}

export async function buildOrderReceiptPdf(order: OrderReceiptData, items: OrderReceiptItem[]) {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const buffers: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => buffers.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.fontSize(20).text("Nuno Pharmacy", { align: "left" });
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor("#444").text("Order Receipt", { align: "left" });
    doc.moveDown(0.8);

    doc.fontSize(10).fillColor("#111");
    doc.text(`Order #: ${order.order_number}`);
    doc.text(`Customer: ${order.customer_name}`);
    doc.text(`Phone: ${order.customer_phone}`);
    doc.text(`Delivery: ${order.delivery_address}`);
    doc.text(`Payment: ${order.payment_method === "whatsapp" ? "Order via WhatsApp" : order.payment_method === "cod" ? "Pay on Delivery" : "Order via WhatsApp"}`);
    doc.text(`Status: ${order.order_status}`);
    doc.moveDown(0.6);

    if (order.notes) {
      doc.text(`Notes: ${order.notes}`);
      doc.moveDown(0.6);
    }

    doc.fontSize(12).text("Items");
    doc.moveDown(0.2);

    const tableTop = doc.y;
    const col1X = 40;
    const col2X = 300;
    const col3X = 430;
    const col4X = 500;

    doc.fontSize(9).text("Item", col1X, tableTop);
    doc.text("Qty", col2X, tableTop);
    doc.text("Unit Price", col3X, tableTop);
    doc.text("Subtotal", col4X, tableTop);
    doc.moveTo(36, doc.y + 12).lineTo(560, doc.y + 12).stroke();

    let currentY = doc.y + 16;
    items.forEach((item) => {
      if (currentY > 720) {
        doc.addPage();
        currentY = 40;
      }

      doc.fontSize(9).text(item.product_name, col1X, currentY, { width: 240, lineGap: 2 });
      doc.text(String(item.quantity), col2X, currentY);
      doc.text(formatKES(item.unit_price_kes), col3X, currentY);
      doc.text(formatKES(item.subtotal_kes), col4X, currentY);
      currentY += 16;
    });

    doc.moveTo(36, currentY + 8).lineTo(560, currentY + 8).stroke();
    doc.fontSize(11).text(`Total: ${formatKES(order.total_kes)}`, 430, currentY + 18, { align: "left" });
    doc.end();
  });
}

export async function sendOrderReceiptEmail({
  to,
  order,
  items,
}: {
  to: string;
  order: OrderReceiptData;
  items: OrderReceiptItem[];
}) {
  const { contactEmail } = getMailConfig();
  const pdfBuffer = await buildOrderReceiptPdf(order, items);
  const recipients = to || contactEmail;
  const cc = to && to !== contactEmail ? contactEmail : undefined;

  await sendMail({
    to: recipients,
    cc,
    replyTo: recipients,
    subject: `New order placed by ${order.customer_name}`,
    text: `New order placed by ${order.customer_name}.\n\nOrder number: ${order.order_number}\nCustomer phone: ${order.customer_phone}\nDelivery address: ${order.delivery_address}\nTotal: ${formatKES(order.total_kes)}\n\nPlease find the attached PDF order receipt.`,
    html: `<p><strong>New order placed by ${order.customer_name}</strong></p><p><strong>Order number:</strong> ${order.order_number}</p><p><strong>Customer phone:</strong> ${order.customer_phone}</p><p><strong>Delivery address:</strong> ${order.delivery_address}</p><p><strong>Total:</strong> ${formatKES(order.total_kes)}</p><p>Please find the attached PDF order receipt.</p>`,
    attachments: [{ filename: `order-${order.order_number}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
  });
}
