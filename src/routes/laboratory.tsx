import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FormEvent, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { laboratoryTests } from "../lib/site-data";
import { bookLaboratoryTest } from "../lib/shop.functions";

export const Route = createFileRoute("/laboratory")({
  head: () => ({
    meta: [
      { title: "Laboratory Services | Nuno Pharmacy" },
      { name: "description", content: "Modern laboratory testing including HIV, blood sugar, malaria, H. pylori, blood grouping and sample collection." },
      { property: "og:title", content: "Nuno Pharmacy Laboratory Services" },
      { property: "og:description", content: "Reliable diagnostic services with home and office sample collection." },
    ],
  }),
  component: LaboratoryPage,
});

function LaboratoryPage() {
  const bookTestFn = useServerFn(bookLaboratoryTest);
  const [form, setForm] = useState<{
    patient_name: string;
    patient_phone: string;
    patient_email: string;
    service: string;
    booking_type: "home" | "inhouse" | "office";
    appointment_date: string;
    notes: string;
  }>({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    service: laboratoryTests[0]?.name ?? "",
    booking_type: "inhouse",
    appointment_date: "",
    notes: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });
    setIsSubmitting(true);
    try {
      const response = await bookTestFn(form);
      if (!response || !response.success) {
        throw new Error(response?.message || "Unable to submit your booking request.");
      }
      setStatus({ type: "success", message: response.message });
      setForm((current) => ({ ...current, patient_name: "", patient_phone: "", patient_email: "", appointment_date: "", notes: "", service: laboratoryTests[0]?.name ?? "", booking_type: "inhouse" }));
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to submit your booking request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Laboratory"
        title="Reliable laboratory diagnostics with professional care"
        subtitle="Every test is handled with speed, precision and clear communication — from in-house diagnostics to home and office sample collection."
      >
        <a href="#book-test" className="inline-flex rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold">
          Book Test
        </a>
      </PageHeader>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {laboratoryTests.map((test, index) => (
            <Reveal key={test.name} delay={index * 50}>
              <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                <img src={test.image} alt={test.name} className="aspect-[4/3] w-full object-cover" loading="lazy" width={1280} height={960} />
                <div className="p-6">
                  <h2 className="font-display text-xl font-semibold">{test.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{test.description}</p>
                  <a href="#book-test" className="mt-6 inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-display font-semibold">
                    Book Test
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-5xl px-4 md:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Included Services
            </span>
            <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Testing designed for convenience</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "Rapid HIV Testing",
              "Blood Sugar Test",
              "Malaria Testing",
              "H. pylori Test",
              "Blood Grouping",
              "Home Sample Collection",
              "Office Sample Collection",
              "Home Healthcare",
            ].map((service, index) => (
              <Reveal key={service} delay={index * 40}>
                <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 text-left shadow-soft">
                  <Check className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="font-medium">{service}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="book-test" className="section-pad">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Laboratory booking
                </span>
                <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold">Book your test appointment</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Share the patient details, test type, appointment preference and we’ll contact you to confirm the booking.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="rounded-[var(--radius-3xl)] border border-border bg-card p-8 shadow-soft">
                <div className="grid gap-4">
                  <input
                    name="patient_name"
                    value={form.patient_name}
                    onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Patient full name"
                    aria-label="Patient full name"
                    required
                  />
                  <input
                    name="patient_phone"
                    value={form.patient_phone}
                    onChange={(event) => setForm((current) => ({ ...current, patient_phone: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Phone number"
                    aria-label="Phone number"
                    required
                  />
                  <input
                    type="email"
                    name="patient_email"
                    value={form.patient_email}
                    onChange={(event) => setForm((current) => ({ ...current, patient_email: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Email address (optional)"
                    aria-label="Email address"
                  />
                  <select
                    name="service"
                    value={form.service}
                    onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Select service"
                    required
                  >
                    {laboratoryTests.map((test) => (
                      <option key={test.name} value={test.name}>
                        {test.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="booking_type"
                    value={form.booking_type}
                    onChange={(event) => setForm((current) => ({ ...current, booking_type: event.target.value as "inhouse" | "home" | "office" }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Booking type"
                    required
                  >
                    <option value="inhouse">In-house lab visit</option>
                    <option value="home">Home sample collection</option>
                    <option value="office">Office sample collection</option>
                  </select>
                  <input
                    type="date"
                    name="appointment_date"
                    value={form.appointment_date}
                    onChange={(event) => setForm((current) => ({ ...current, appointment_date: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Preferred appointment date"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-32 rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Additional notes or instructions"
                    aria-label="Additional notes or instructions"
                  />
                  {status.message ? (
                    <p className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{status.message}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Booking"}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
