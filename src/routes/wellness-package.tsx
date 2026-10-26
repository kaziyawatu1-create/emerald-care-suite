import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock3, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import packageImage from "../assets/new package.jpeg";

const packageHighlights = [
  "Full body check-up with lab screening",
  "Free home or office sample collection",
  "Doctor review and wellness summary",
  "Fast results and expert guidance",
];

const packageIncludes = [
  "CBC", 
  "Liver function test",
  "Kidney function test",
  "Blood sugar (HbA1c / fasting glucose)",
  "Cholesterol profile",
  "Thyroid screening",
  "Urinalysis",
  "HIV, Hepatitis B & C screening",
];

export const Route = createFileRoute("/wellness-package")({
  head: () => ({
    meta: [
      { title: "Wellness Package | Nuno Pharmacy" },
      {
        name: "description",
        content:
          "Detailed view of the Full Body Wellness Package with pricing, included tests, and WhatsApp booking.",
      },
    ],
  }),
  component: WellnessPackagePage,
});

function WellnessPackagePage() {
  const handleBookWhatsApp = () => {
    const message = encodeURIComponent(
      "Hello Nuno Pharmacy, I would like to book the Full Body Wellness Package. Please share the available dates and next steps.",
    );
    window.open(`https://wa.me/254768779649?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf7_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6 flex items-center gap-3 text-sm text-emerald-700">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold hover:underline">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back home
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(18,84,52,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[320px] bg-emerald-50">
              <img
                src={packageImage}
                alt="Full Body Wellness Package"
                className="h-full w-full object-cover"
              />
              <div className="absolute right-4 top-4 rounded-md bg-red-500 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                60% OFF
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Special Promo
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] text-slate-900 md:text-5xl">
                Full Body Wellness Package
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-500 line-through">KES 35,290</span>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-lg font-black text-white">KES 13,999/=</span>
              </div>

              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Complete diagnostic health screening designed to help you understand your overall
                wellbeing with expert guidance and convenient home or office collection.
              </p>

              <div className="mt-6 space-y-3">
                {packageHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBookWhatsApp}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  Book via WhatsApp
                </button>
                <a
                  href="tel:+254703244711"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  <Phone className="h-4 w-4" />
                  Call us
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">What’s included</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {packageIncludes.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Package details</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Professional screening and lab support from trusted healthcare specialists.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-slate-600" />
                <span>Sample collection available from home, office, and our Nairobi collection points.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-600" />
                <span>Serving Nairobi, South C, and nearby locations across the city.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
