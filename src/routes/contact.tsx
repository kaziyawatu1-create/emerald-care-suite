import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, Clock3 } from "lucide-react";
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
              [Phone, "Phone", "+256 700 000 000"],
              [MessageCircle, "WhatsApp", "+256 700 000 000"],
              [Mail, "Email", "hello@nunopharmacy.com"],
              [MapPin, "Location", "Plot 42, Main Street, Kampala"],
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
                src="https://www.google.com/maps?q=Kampala%20Uganda&z=13&output=embed"
                className="h-[360px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-8">
                <h2 className="font-display text-3xl font-bold">Send an appointment request</h2>
                <form onSubmit={(e) => e.preventDefault()} className="mt-6 grid gap-4 md:grid-cols-2">
                  <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Full name" aria-label="Full name" />
                  <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Phone number" aria-label="Phone number" />
                  <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2" placeholder="Email address" aria-label="Email address" />
                  <textarea className="min-h-32 rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2" placeholder="How can we help?" aria-label="How can we help?" />
                  <button className="rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold md:col-span-2 md:justify-self-start">Send Request</button>
                </form>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
