import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { homeVisitImage } from "../lib/site-data";
import { listServices } from "../lib/services.functions";
import type { ServiceItem } from "../lib/services";

export const Route = createFileRoute("/home-services")({
  head: () => ({
    meta: [
      { title: "Home Services | Nuno Pharmacy" },
      { name: "description", content: "Book home sample collection, medicine delivery and home consultation services with Nuno Pharmacy." },
      { property: "og:title", content: "Nuno Pharmacy Home Services" },
      { property: "og:description", content: "Home healthcare support including appointments, delivery and sample collection." },
    ],
  }),
  component: HomeServicesPage,
});

function HomeServicesPage() {
  const loadServicesFn = useServerFn(listServices);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    loadServicesFn()
      .then((rows) => {
        if (!mounted) return;
        const next = Array.isArray(rows) ? (rows as ServiceItem[]) : [];
        setServices(next);
        if (next.length) {
          setSelectedService((current) => current || next[0].name);
        }
      })
      .catch(() => {
        // allow the page to render without service data if the fetch fails
      });

    return () => {
      mounted = false;
    };
  }, [loadServicesFn]);

  const homeServices = useMemo(
    () => services.filter((service) => service.location === "home" || service.location === "office"),
    [services]
  );

  return (
    <>
      <PageHeader
        eyebrow="Home Services"
        title="Healthcare support delivered to your home or workplace"
        subtitle="Convenient appointments, sample collection and medicine delivery designed around your schedule."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <img
              src={homeVisitImage}
              alt="Home healthcare visit"
              className="aspect-[16/10] w-full rounded-[var(--radius-3xl)] border border-border object-cover shadow-elegant"
              width={1600}
              height={1024}
            />
          </Reveal>
          <div className="grid gap-5">
            {homeServices.length === 0 ? (
              <Reveal>
                <article className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                  <h2 className="font-display text-2xl font-bold">No home services available</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We’re loading current home and workplace service offerings from the service catalog.</p>
                </article>
              </Reveal>
            ) : (
              homeServices.map((service, index) => (
                <Reveal key={service.id} delay={index * 60}>
                  <article className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                    <h2 className="font-display text-2xl font-bold">{service.name}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  </article>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <Reveal>
            <div className="rounded-[var(--radius-3xl)] border border-border bg-card p-8 shadow-elegant md:p-10">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Appointment Booking
                </span>
                <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Request a home appointment</h2>
              </div>
              <form onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()} className="mt-8 grid gap-4 md:grid-cols-2">
                <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Full name" aria-label="Full name" />
                <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Phone number" aria-label="Phone number" />
                <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Email address" aria-label="Email address" />
                <select
                  className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  aria-label="Select service"
                  value={selectedService}
                  onChange={(event) => setSelectedService(event.target.value)}
                >
                  {homeServices.length === 0 ? (
                    <option value="" disabled>
                      Loading home services...
                    </option>
                  ) : (
                    homeServices.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
                <input className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2" placeholder="Address" aria-label="Address" />
                <textarea className="min-h-32 rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary md:col-span-2" placeholder="Tell us what you need" aria-label="Tell us what you need" />
                <button className="rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold md:col-span-2 md:justify-self-start">Book Appointment</button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
