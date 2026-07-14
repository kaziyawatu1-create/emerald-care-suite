export type ServiceType = "inhouse" | "at-home" | "hybrid";
export type ServiceStatus = "active" | "inactive" | "pending";
export type ServiceLocation = "lab-only" | "office" | "home";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  price_kes: number;
  duration_minutes: number;
  test_results: string;
  status: ServiceStatus;
  location: ServiceLocation;
  createdAt: string;
  image_urls: string[];
}

const storageKey = "nuno-services";

const defaultServices: ServiceItem[] = [
  {
    id: "service-home-sample-collection",
    name: "Home Sample Collection",
    description: "Professional sample collection at your residence or workplace for fast lab processing.",
    type: "at-home",
    price_kes: 2500,
    duration_minutes: 60,
    test_results: "Sample handling, lab coordination, and result delivery.",
    status: "active",
    location: "home",
    createdAt: "2026-07-04",
    image_urls: [],
  },
  {
    id: "service-clinic-consultation",
    name: "In-clinic Consultation",
    description: "Personalized consultations with our pharmacists and healthcare professionals.",
    type: "inhouse",
    price_kes: 1500,
    duration_minutes: 45,
    test_results: "Clinical evaluation and treatment recommendations.",
    status: "active",
    location: "lab-only",
    createdAt: "2026-07-04",
    image_urls: [],
  },
];

export function readServices(): ServiceItem[] {
  if (typeof window === "undefined") return defaultServices;

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<ServiceItem>[]) : defaultServices;

    const normalized = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultServices;

    return normalized.map((service) => ({
      id: service.id ?? crypto.randomUUID(),
      name: service.name ?? "",
      description: service.description ?? "",
      type: service.type ?? "inhouse",
      price_kes: service.price_kes ?? 0,
      duration_minutes: service.duration_minutes ?? 30,
      test_results: service.test_results ?? "",
      status: service.status ?? "active",
      location: service.location ?? "lab-only",
      createdAt: service.createdAt ?? new Date().toISOString().split("T")[0],
      image_urls: Array.isArray(service.image_urls)
        ? service.image_urls.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
        : [],
    }));
  } catch {
    return defaultServices;
  }
}

export function writeServices(services: ServiceItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(services));
}

export function formatServiceType(type: ServiceType) {
  if (type === "at-home") return "At home";
  if (type === "hybrid") return "Hybrid";
  return "In-house";
}

export function formatServiceLocation(location: ServiceLocation) {
  if (location === "office") return "Office visit";
  if (location === "home") return "Home visit";
  return "Lab only";
}
