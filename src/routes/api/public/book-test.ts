import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

const contactEmail = process.env.CONTACT_EMAIL ?? "mmuthamacollins90@gmail.com";
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

export const Route = createFileRoute("/api/public/book-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> = {};

        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
        }

        const name = typeof payload.name === "string" ? payload.name.trim() : "";
        const locationType = typeof payload.locationType === "string" ? payload.locationType.trim() : "";
        const preferredDate = typeof payload.preferredDate === "string" ? payload.preferredDate.trim() : "";
        const contact = typeof payload.contact === "string" ? payload.contact.trim() : "";
        const pinLocation = typeof payload.pinLocation === "string" ? payload.pinLocation.trim() : "";
        const testType = typeof payload.testType === "string" ? payload.testType.trim() : "";

        if (!name || !contact || !preferredDate || !pinLocation || !testType) {
          return Response.json({ success: false, message: "Please complete all booking details." }, { status: 400 });
        }

        if (!transporter) {
          console.info("Booking request received without SMTP config", { name, contact, preferredDate, testType });
          return Response.json(
            {
              success: false,
              message: "Email delivery is not configured. Set your Gmail app password in SMTP_PASS to enable booking emails.",
            },
            { status: 503 }
          );
        }

        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: contactEmail,
            replyTo: contact,
            subject: `New lab booking request from ${name}`,
            text: [
              `Name: ${name}`,
              `Location Type: ${locationType || "Not provided"}`,
              `Preferred Date: ${preferredDate}`,
              `Contact: ${contact}`,
              `Pin/Location: ${pinLocation}`,
              `Test Type: ${testType}`,
            ].join("\n"),
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h3>New lab booking request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Location Type:</strong> ${locationType || "Not provided"}</p>
                <p><strong>Preferred Date:</strong> ${preferredDate}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Pin/Location:</strong> ${pinLocation}</p>
                <p><strong>Test Type:</strong> ${testType}</p>
              </div>
            `,
          });

          return Response.json({ success: true, message: "Your booking request was sent successfully." });
        } catch (error) {
          console.error("Booking email failed", error);
          return Response.json({ success: false, message: "We could not send your booking request right now. Please try again later." }, { status: 500 });
        }
      },
    },
  },
});
