import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { formatServiceType, readServices, type ServiceItem } from "../lib/services";
import pathcareLogo from "../assets/pathcare-logo.svg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services | Nuno Pharmacy" },
      { name: "description", content: "Explore our in-house and at-home healthcare services at Nuno Pharmacy." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());

  useEffect(() => {
    setServices(readServices());
  }, []);

  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Flexible healthcare support for every routine"
        subtitle="Choose from in-house care and at-home visits designed around your schedule and comfort."
      />

      <section className="section-pad pb-0">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="rounded-4xl border border-border bg-linear-to-br from-primary/8 to-primary/4 p-6 shadow-soft md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    PathCare collaboration
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold">Laboratory services are coordinated through our trusted PathCare partnership.</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    These diagnostic services are arranged through PathCare and are not directly offered by Nuno Pharmacy, so we make that partnership clear for every visitor.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/85">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5">
                      <Check className="h-4 w-4 text-primary" /> Trusted diagnostics
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5">
                      <Check className="h-4 w-4 text-primary" /> Clear service coordination
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-soft">
                    <img src={pathcareLogo} alt="PathCare logo" className="h-24 w-24 object-contain" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {featuredServices.map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <article className="rounded-2xl border border-border bg-card p-6 shadow-soft card-lift">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {formatServiceType(service.type)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{service.createdAt}</span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold">{service.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant md:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Need help choosing?
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold">Speak with our team about the right care option for you.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                From home visits to on-site consultations, our team can help you find the most convenient and supportive service for your needs.
              </p>
              <a href="/contact" className="mt-6 inline-flex rounded-full btn-gradient px-6 py-3 text-sm font-semibold">
                Contact us
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
