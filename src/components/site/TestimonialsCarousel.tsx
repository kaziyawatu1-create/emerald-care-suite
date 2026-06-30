import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { testimonials } from "../../lib/site-data";

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="section-pad bg-muted/45">
      <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          Testimonials
        </span>
        <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">What our clients say</h2>
        <div className="mt-10 rounded-[var(--radius-2xl)] border border-border bg-card px-6 py-10 md:px-12 shadow-soft">
          <Quote className="mx-auto h-10 w-10 text-gold" />
          <div className="mt-5 flex justify-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-xl md:text-2xl font-medium leading-relaxed">
            “{testimonials[index]}”
          </p>
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-2.5 bg-border"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
