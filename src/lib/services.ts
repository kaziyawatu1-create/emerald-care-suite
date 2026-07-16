export interface ServiceItem {
  id: string;
  name: string;
  price_kes: number;
  duration_minutes: number;
  icon_url: string | null;
  service_category_id?: string | null;
  createdAt: string;
}

const storageKey = "nuno-services";

const defaultServices: ServiceItem[] = [
  {
    id: "service-home-sample-collection",
    name: "Home Sample Collection",
    price_kes: 2500,
    duration_minutes: 60,
    icon_url: null,
    createdAt: "2026-07-04",
  },
  {
    id: "service-clinic-consultation",
    name: "In-clinic Consultation",
    price_kes: 1500,
    duration_minutes: 45,
    icon_url: null,
    createdAt: "2026-07-04",
  },
];

export function readServices(): ServiceItem[] {
  if (typeof window === "undefined") return defaultServices;

  try {
    const raw = window.localStorage.getItem(storageKey);
    type LegacyService = Partial<ServiceItem> & { image_urls?: string[] };
    const parsed = raw ? (JSON.parse(raw) as LegacyService[]) : null;
    const normalized: LegacyService[] =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultServices;

    return normalized.map((service) => {
      const legacyIcon =
        Array.isArray(service.image_urls) && typeof service.image_urls[0] === "string"
          ? service.image_urls[0]
          : null;

      return {
        id: service.id ?? crypto.randomUUID(),
        name: service.name ?? "",
        price_kes: service.price_kes ?? 0,
        duration_minutes: service.duration_minutes ?? 30,
        icon_url:
          typeof service.icon_url === "string" && service.icon_url.trim()
            ? service.icon_url
            : legacyIcon,
        service_category_id: typeof service.service_category_id === "string" ? service.service_category_id : null,
        createdAt: service.createdAt ?? new Date().toISOString().split("T")[0],
      };
    });
  } catch {
    return defaultServices;
  }
}

export function writeServices(services: ServiceItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(services));
}

/** Format turnaround time: under 60 minutes as min, otherwise as hours. */
export function formatServiceTat(minutes: number) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 60) return `${Math.round(value)} min`;

  const hours = value / 60;
  const formatted = Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace(/\.0$/, "");
  return `${formatted} hr${hours === 1 ? "" : "s"}`;
}

/** Format service price in Kenyan shillings with thousand separators. */
export function formatServicePrice(amount: number) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "KES —";
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}
