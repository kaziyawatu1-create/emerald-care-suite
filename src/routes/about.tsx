import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { team } from "../lib/site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Nuno Pharmacy | Trusted Healthcare" },
      { name: "description", content: "Learn about Nuno Pharmacy's mission, vision, history and healthcare team." },
      { property: "og:title", content: "About Nuno Pharmacy" },
      { property: "og:description", content: "Mission-driven healthcare, laboratory excellence and professional pharmaceutical care." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Trusted healthcare built on professionalism, quality and care"
        subtitle="Nuno Pharmacy combines pharmacy excellence, diagnostic reliability and customer-centered service in one modern healthcare destination."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "Mission",
              text: "To provide genuine medicines, accurate laboratory services and dependable healthcare support that improves everyday wellbeing.",
            },
            {
              icon: Eye,
              title: "Vision",
              text: "To be the most trusted pharmacy and diagnostic partner for families, businesses and communities across the region.",
            },
            {
              icon: HeartHandshake,
              title: "Core Values",
              text: "Integrity, compassion, professionalism, affordability, confidentiality and continuous quality improvement guide every interaction.",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 70}>
                <article className="h-full rounded-[var(--radius-2xl)] border border-border bg-card p-7 shadow-soft card-lift">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold">{item.title}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Our Story
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">A modern pharmacy with a human approach</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                Nuno Pharmacy was established to raise the standard for accessible healthcare — combining genuine medicines, trusted diagnostic services and premium customer experience in one carefully designed environment.
              </p>
              <p>
                From the beginning, our focus has been simple: give every patient confidence in the products they buy, clarity in the advice they receive and convenience in the way care is delivered.
              </p>
              <p>
                Today, we continue to serve individuals, families and organizations with professionalism, discretion and a commitment to long-term health partnerships.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                Our Team
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Experienced professionals you can rely on</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {team.map((member, index) => (
              <Reveal key={member.name} delay={index * 70}>
                <article className="h-full rounded-[var(--radius-2xl)] border border-border bg-card p-7 shadow-soft card-lift">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/12 text-gold">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold">{member.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-primary">{member.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{member.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
