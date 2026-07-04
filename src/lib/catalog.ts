export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_kes: number;
  unit: string;
  requires_prescription: boolean;
  in_stock: boolean;
  image_url?: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
  description: string;
};

export const catalogStorageKeys = {
  products: "nuno-dashboard-products",
  categories: "nuno-dashboard-categories",
};

export const defaultCatalogProducts: CatalogProduct[] = [
  {
    id: "prod-1",
    name: "Vitamin C 1000mg",
    category: "Wellness",
    description: "Daily immunity support",
    price_kes: 1200,
    unit: "pack",
    requires_prescription: false,
    in_stock: true,
  },
  {
    id: "prod-2",
    name: "Hydrating Face Cream",
    category: "Skincare",
    description: "Moisturizing cream for smooth skin",
    price_kes: 2400,
    unit: "tube",
    requires_prescription: false,
    in_stock: true,
  },
  {
    id: "prod-3",
    name: "Amoxicillin Capsules",
    category: "Prescription",
    description: "Antibiotic treatment support",
    price_kes: 1800,
    unit: "pack",
    requires_prescription: true,
    in_stock: true,
  },
];

export const defaultCatalogCategories: CatalogCategory[] = [
  { id: "cat-1", name: "Wellness", description: "Vitamins and wellness essentials" },
  { id: "cat-2", name: "Skincare", description: "Skincare and beauty products" },
  { id: "cat-3", name: "Prescription", description: "Doctor-prescribed medicines" },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readCatalogProducts() {
  return readStorage<CatalogProduct[]>(catalogStorageKeys.products, defaultCatalogProducts);
}

export function readCatalogCategories() {
  return readStorage<CatalogCategory[]>(catalogStorageKeys.categories, defaultCatalogCategories);
}

export function writeCatalogProducts(products: CatalogProduct[]) {
  writeStorage(catalogStorageKeys.products, products);
}

export function writeCatalogCategories(categories: CatalogCategory[]) {
  writeStorage(catalogStorageKeys.categories, categories);
}
