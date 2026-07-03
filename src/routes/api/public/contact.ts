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

export const Route = createFileRoute("/api/public/contact")({
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
        const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
        const email = typeof payload.email === "string" ? payload.email.trim() : "";
        const message = typeof payload.message === "string" ? payload.message.trim() : "";

        if (!name || !email || !message) {
          return Response.json({ success: false, message: "Please provide your name, email, and message." }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return Response.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
        }

        if (!transporter) {
          console.info("Contact form received without SMTP config", { name, phone, email, message });
          return Response.json(
            {
              success: false,
              message: "Email service is not configured. Set your Gmail app password in SMTP_PASS to enable delivery.",
            },
            { status: 503 }
          );
        }

        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: contactEmail,
            replyTo: email,
            subject: `New contact request from ${name}`,
            text: [
              `Name: ${name}`,
              `Phone: ${phone || "Not provided"}`,
              `Email: ${email}`,
              "",
              `Message: ${message}`,
            ].join("\n"),
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h3>New contact request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong><br />${message.replace(/\n/g, "<br />")}</p>
              </div>
            `,
          });

          return Response.json({ success: true, message: "Your message was sent successfully." });
        } catch (error) {
          console.error("Contact email failed", error);
          return Response.json({ success: false, message: "We could not send your message right now. Please try again later." }, { status: 500 });
        }
      },
    },
  },
});
