import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/site/PageHeader";
import { listAllProductsForReport, listBrands } from "../lib/shop.functions";
import { formatKES } from "../lib/cart";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Products Report | Nuno Pharmacy" },
      { name: "description", content: "Generate and download a PDF report of all pharmacy products, filtered by category, brand, stock status or price range." },
      { property: "og:title", content: "Products Report — Nuno Pharmacy" },
      { property: "og:description", content: "Filter the product catalogue and export a PDF report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

type ReportRow = {
  id: string;
  name: string;
  category: string;
  price_kes: number | string;
  unit: string | null;
  requires_prescription: boolean;
  in_stock: boolean;
  brand_id: string | null;
  created_at?: string | null;
};

function ReportsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["products-report"], queryFn: () => listAllProductsForReport() });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => listBrands() });

  const [category, setCategory] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [stock, setStock] = useState<"all" | "in" | "out">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [generating, setGenerating] = useState(false);

  const products = (data ?? []) as ReportRow[];
  const brandName = (id: string | null) => (brands ?? []).find((b: any) => b.id === id)?.name ?? "—";

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);

  const rows = useMemo(() => {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    return products.filter((p) => {
      const price = Number(p.price_kes);
      if (category !== "all" && p.category !== category) return false;
      if (brandId !== "all" && (p.brand_id ?? "none") !== brandId) return false;
      if (stock === "in" && !p.in_stock) return false;
      if (stock === "out" && p.in_stock) return false;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;
      return true;
    });
  }, [products, category, brandId, stock, minPrice, maxPrice]);

  const totalValue = rows.reduce((sum, p) => sum + Number(p.price_kes), 0);

  async function downloadPdf() {
    if (!rows.length) {
      toast.error("No products match the current filters.");
      return;
    }
    setGenerating(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const generated = new Date().toLocaleString("en-KE");

      doc.setFontSize(18);
      doc.text("Nuno Pharmacy — Products Report", 40, 45);
      doc.setFontSize(10);
      doc.setTextColor(110);
      const filterLine = [
        `Category: ${category === "all" ? "All" : category}`,
        `Brand: ${brandId === "all" ? "All" : brandId === "none" ? "No brand" : brandName(brandId)}`,
        `Stock: ${stock === "all" ? "All" : stock === "in" ? "In stock" : "Out of stock"}`,
        `Price: ${minPrice || 0} – ${maxPrice || "∞"} KES`,
      ].join("   |   ");
      doc.text(filterLine, 40, 64);
      doc.text(`Generated: ${generated}`, 40, 79);
      doc.text(`Products: ${rows.length}    Total catalogue value: ${formatKES(totalValue)}`, 40, 94);

      autoTable(doc, {
        startY: 110,
        head: [["#", "Product", "Category", "Brand", "Price (KES)", "Unit", "Prescription", "Stock"]],
        body: rows.map((p, i) => [
          String(i + 1),
          p.name,
          p.category,
          brandName(p.brand_id),
          Number(p.price_kes).toLocaleString("en-KE"),
          p.unit ?? "-",
          p.requires_prescription ? "Required" : "No",
          p.in_stock ? "In stock" : "Out of stock",
        ]),
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [15, 139, 109], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 248, 246] },
        columnStyles: { 0: { cellWidth: 30 }, 4: { halign: "right" } },
        didDrawPage: () => {
          const page = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(140);
          doc.text(`Page ${page}`, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 20);
        },
      });

      doc.save(`nuno-products-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Report downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate the report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader compact eyebrow="Reports" title="Products report" subtitle="Filter your catalogue and download a clean PDF of every product." />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 rounded-4xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm font-medium">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Brand
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All brands</option>
                <option value="none">No brand</option>
                {(brands ?? []).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Stock status
              <select value={stock} onChange={(e) => setStock(e.target.value as "all" | "in" | "out")} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All</option>
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Min price (KES)
              <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium">
              Max price (KES)
              <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{rows.length}</span> products · total catalogue value{" "}
              <span className="font-semibold text-foreground">{formatKES(totalValue)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setCategory("all"); setBrandId("all"); setStock("all"); setMinPrice(""); setMaxPrice(""); }}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
              >
                Reset filters
              </button>
              <button
                onClick={downloadPdf}
                disabled={generating || isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-4xl border border-border bg-card shadow-soft">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">Could not load products. Please refresh the page.</p>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No products match these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Brand</th>
                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="px-4 py-3 font-semibold">Prescription</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3">{brandName(p.brand_id)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKES(Number(p.price_kes))}</td>
                      <td className="px-4 py-3">{p.unit ?? "-"}</td>
                      <td className="px-4 py-3">{p.requires_prescription ? "Required" : "No"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.in_stock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {p.in_stock ? "In stock" : "Out of stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
