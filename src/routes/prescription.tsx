import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "../components/site/PageHeader";
import { createPrescription, getPrescription } from "../lib/prescriptions.functions";

type PrescriptionRecord = {
  id: string;
  customer_name: string;
  customer_phone: string;
  prescription_path: string;
  prescription_url: string;
  uploaded_at: string;
  created_at: string;
};

export const Route = createFileRoute("/prescription")({
  head: () => ({
    meta: [
      { title: "My Prescription | Nuno Pharmacy" },
      { name: "description", content: "View your saved prescription upload details and download the prescription image or PDF." },
    ],
  }),
  component: PrescriptionPage,
});

function PrescriptionPage() {
  const createPrescriptionFn = useServerFn(createPrescription);
  const getPrescriptionFn = useServerFn(getPrescription);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionRecord | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = window.localStorage.getItem("nuno-dashboard-session");
    setIsLoggedIn(Boolean(session && JSON.parse(session)?.email));
    setPrescriptionId(window.localStorage.getItem("nuno-prescription-id"));
  }, []);

  useEffect(() => {
    if (!prescriptionId) return;
    let mounted = true;
    setIsLoading(true);

    getPrescriptionFn({ data: { id: prescriptionId } })
      .then((result) => {
        if (!mounted) return;
        setPrescription(result);
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        setStatus({ type: "error", message: "Unable to load your prescription." });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [getPrescriptionFn, prescriptionId]);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    prescription_file: null as File | null,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (!form.prescription_file) {
      setStatus({ type: "error", message: "Please attach a prescription image or PDF." });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(form.prescription_file as Blob);
      });

      const result = await createPrescriptionFn({
        data: {
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          prescription_data_url: dataUrl,
          prescription_filename: form.prescription_file.name,
        },
      });

      if (!result || !result.id) {
        throw new Error("Prescription upload failed.");
      }

      window.localStorage.setItem("nuno-prescription-id", result.id);
      setPrescription(result);
      setStatus({ type: "success", message: "Prescription uploaded successfully." });
      toast.success("Prescription uploaded successfully. Redirecting to home...");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
      }, 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload prescription.";
      setStatus({ type: "error", message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="section-pad">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <PageHeader eyebrow="Prescription" title="Sign in to view your saved prescription" subtitle="This page is available to logged in customers only. Upload a prescription from the navbar and sign in to view it here." />
          <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
            <p>Please sign in to access your saved prescription upload history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-pad">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <PageHeader eyebrow="Prescription" title="Your prescription upload" subtitle="View the prescription you uploaded, download the file, or upload a fresh copy." />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[var(--radius-3xl)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Prescription details</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading prescription...</p>
            ) : prescription ? (
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <div className="grid gap-3 rounded-2xl border border-border bg-muted/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-foreground">Name</span>
                    <span>{prescription.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-foreground">Phone</span>
                    <span>{prescription.customer_phone}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-foreground">Uploaded</span>
                    <span>{new Date(prescription.uploaded_at).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  {prescription.prescription_url ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-border bg-background p-4">
                        {prescription.prescription_path.endsWith(".pdf") ? (
                          <iframe src={prescription.prescription_url} className="h-72 w-full rounded-2xl border border-border" title="Prescription preview" />
                        ) : (
                          <img src={prescription.prescription_url} alt="Prescription" className="w-full rounded-2xl border border-border object-contain" />
                        )}
                      </div>
                      <a href={prescription.prescription_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary">
                        Open prescription
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No prescription file URL available.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">You don’t have a saved prescription yet. Upload one from the navbar.</p>
            )}
          </div>

          <div className="rounded-[var(--radius-3xl)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Upload new prescription</h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
              <input
                value={form.customer_name}
                onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Patient full name"
                aria-label="Patient full name"
                required
              />
              <input
                value={form.customer_phone}
                onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))}
                className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Phone number"
                aria-label="Phone number"
                required
              />
              <label className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary cursor-pointer">
                <span>{form.prescription_file ? form.prescription_file.name : "Attach prescription image or PDF"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] ?? null;
                    setForm((current) => ({ ...current, prescription_file: file }));
                  }}
                />
              </label>

              {status.message ? (
                <p className={`text-sm ${status.type === "error" ? "text-red-500" : "text-green-600"}`}>{status.message}</p>
              ) : null}

              <button type="submit" disabled={isLoading} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70">
                {isLoading ? "Saving..." : "Save prescription"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
