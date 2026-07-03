import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, Clock3 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Nuno Pharmacy" },
      { name: "description", content: "Contact Nuno Pharmacy by phone, WhatsApp, email or visit our location. View business hours and send an appointment request." },
      { property: "og:title", content: "Contact Nuno Pharmacy" },
      { property: "og:description", content: "Get in touch for appointments, medicine inquiries and home services." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({ success: false, message: "Unable to send your message right now." }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send your message right now.");
      }

      setForm({ name: "", phone: "", email: "", message: "" });
      setStatus({ type: "success", message: data.message || "Your message was sent successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send your message right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Speak with our team or visit our location"
        subtitle="We are available for appointments, laboratory inquiries, medicine guidance and home healthcare scheduling."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="grid gap-4">
            {[
              [Phone, "Phone", "0703244711"],
              [MessageCircle, "WhatsApp", "0768779649"],
              [Mail, "Email", "mmuthamacollins90@gmail.com"],
              [MapPin, "Location", "Kenya, Nairobi, South C, opposite Midad Academy, off Popo Road"],
              [Clock3, "Working Hours", "Mon–Sun · 7:00 — 22:00"],
            ].map(([Icon, label, value], index) => {
              const Cmp = Icon as typeof Phone;
              return (
                <Reveal key={label as string} delay={index * 50}>
                  <div className="flex gap-4 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-5 shadow-soft card-lift">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Cmp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground">{label as string}</div>
                      <div className="mt-1 font-medium">{value as string}</div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card shadow-elegant">
              <iframe
                title="Nuno Pharmacy location map"
                src="https://www.google.com/maps?q=Kenya%20Nairobi%20South%20C%20opposite%20Midad%20Academy%20off%20Popo%20Road&z=15&output=embed"
                className="h-[360px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-8">
                <h2 className="font-display text-3xl font-bold">Send an appointment request</h2>
                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    name="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Full name"
                    aria-label="Full name"
                    required
                  />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Phone number"
                    aria-label="Phone number"
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2"
                    placeholder="Email address"
                    aria-label="Email address"
                    required
                  />
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    className="min-h-32 rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2"
                    placeholder="How can we help?"
                    aria-label="How can we help?"
                    required
                  />
                  {status.message ? (
                    <p className={`md:col-span-2 text-sm ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                      {status.message}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold md:col-span-2 md:justify-self-start disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>
                </form>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
