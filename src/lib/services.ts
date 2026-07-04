export type ServiceType = "inhouse" | "at-home";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  createdAt: string;
}

const storageKey = "nuno-services";

const defaultServices: ServiceItem[] = [
  {
    id: "service-home-sample-collection",
    name: "Home Sample Collection",
    description: "Professional sample collection at your residence or workplace for fast lab processing.",
    type: "at-home",
    createdAt: "2026-07-04",
  },
  {
    id: "service-clinic-consultation",
    name: "In-clinic Consultation",
    description: "Personalized consultations with our pharmacists and healthcare professionals.",
    type: "inhouse",
    createdAt: "2026-07-04",
  },
];

export function readServices(): ServiceItem[] {
  if (typeof window === "undefined") return defaultServices;

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as ServiceItem[]) : defaultServices;

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultServices;
  } catch {
    return defaultServices;
  }
}

export function writeServices(services: ServiceItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(services));
}

export function formatServiceType(type: ServiceType) {
  return type === "at-home" ? "At home" : "In-house";
}
