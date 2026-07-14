import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, LogOut, ShieldCheck, ShoppingCart, Tags, PencilLine, AlertCircle, Search, Loader2, ImageIcon, Gift, CalendarDays, FileText, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { readCatalogCategories, readCatalogProducts, type CatalogCategory, type CatalogProduct } from "../lib/catalog";
import { listOffers, removeOffer, upsertOffer } from "../lib/offers.functions";
import { listServices, removeService, upsertService, uploadServiceImage } from "../lib/services.functions";
import { listBookings, updateBooking } from "../lib/bookings.functions";
import { listPrescriptions } from "../lib/prescriptions.functions";
import { listBrands, listProductCategories, listProducts, removeBrand, removeCategory, removeProduct, uploadProductImage, upsertBrand, upsertCategory, upsertProduct } from "../lib/shop.functions";
import { formatServicePrice, formatServiceTat, readServices, writeServices, type ServiceItem } from "../lib/services";
import type { BookingItem, BookingStatus } from "../lib/bookings";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";


type ProductItem = CatalogProduct;

type CategoryItem = CatalogCategory;

type BrandItem = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean | null;
};

type OfferItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  discount: string | null;
  discount_percent?: number | null;
  original_price?: number | null;
  sale_price?: number | null;
  product_id?: string | null;
  expires_at: string | null;
  image: string | null;
  created_at?: string;
};

type OrderItem = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
};

type PrescriptionItem = {
  id: string;
  customer_name: string;
  customer_phone: string;
  prescription_url: string;
  prescription_path?: string | null;
  uploaded_at: string;
  created_at?: string | null;
};

type ProductForm = Omit<ProductItem, "id">;

type CategoryForm = Omit<CategoryItem, "id">;

type OfferForm = {
  title: string;
  description: string;
  badge: string;
  discount: string;
  original_price?: string;
  sale_price?: string;
  expires_at: string;
  image: string;
};

type ServiceForm = {
  name: string;
  price_kes: number;
  duration_minutes: number;
  icon_url: string | null;
};
type AdminView = "dashboard" | "products" | "categories" | "brands" | "offers" | "services" | "bookings" | "orders" | "prescriptions" | "security";

const defaultOrders: OrderItem[] = [
  {
    id: "ORD-1001",
    customerName: "Jane Njeri",
    customerEmail: "jane@example.com",
    total: 3600,
    status: "Pending",
    createdAt: "2026-07-04 09:30",
    items: [
      { name: "Vitamin C 1000mg", quantity: 2, price: 1200 },
      { name: "Hydrating Face Cream", quantity: 1, price: 2400 },
    ],
  },
  {
    id: "ORD-1002",
    customerName: "Brian Kibet",
    customerEmail: "brian@example.com",
    total: 1200,
    status: "Completed",
    createdAt: "2026-07-03 18:45",
    items: [{ name: "Vitamin C 1000mg", quantity: 1, price: 1200 }],
  },
];

const storageKeys = {
  orders: "nuno-dashboard-orders",
  session: "nuno-dashboard-session",
  password: "nuno-dashboard-admin-password",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to persist ${key} to localStorage`, error);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function sanitizeProductForStorage(product: ProductItem) {
  const imageUrls = Array.isArray(product.image_urls)
    ? product.image_urls.filter((url): url is string => typeof url === "string" && !url.startsWith("data:"))
    : [];

  return {
    ...product,
    image_urls: imageUrls,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@nuno.com";
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin1234";
  const [storedAdminPassword, setStoredAdminPassword] = useState<string>(adminPassword);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const saveProductFn = useServerFn(upsertProduct);
  const saveCategoryFn = useServerFn(upsertCategory);
  const saveBrandFn = useServerFn(upsertBrand);
  const deleteProductFn = useServerFn(removeProduct);
  const deleteCategoryFn = useServerFn(removeCategory);
  const deleteBrandFn = useServerFn(removeBrand);
  const saveOfferFn = useServerFn(upsertOffer);
  const deleteOfferFn = useServerFn(removeOffer);
  const listServicesFn = useServerFn(listServices);
  const saveServiceFn = useServerFn(upsertService);
  const deleteServiceFn = useServerFn(removeService);
  const listBookingsFn = useServerFn(listBookings);
  const updateBookingFn = useServerFn(updateBooking);
  const listPrescriptionsFn = useServerFn(listPrescriptions);
  const uploadImageFn = useServerFn(uploadProductImage);
  const uploadServiceImageFn = useServerFn(uploadServiceImage);

  const [products, setProducts] = useState<ProductItem[]>(() => readCatalogProducts());
  const [categories, setCategories] = useState<CategoryItem[]>(() => readCatalogCategories());
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>(() => readStorage(storageKeys.orders, defaultOrders));
  const [productForm, setProductForm] = useState<ProductForm>({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [], brand_id: null });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", description: "" });
  const [brandForm, setBrandForm] = useState({ name: "", description: "", logo_url: "", slug: "", is_active: true });
  const [offerForm, setOfferForm] = useState<OfferForm>({ title: "", description: "", badge: "", discount: "", original_price: "", sale_price: "", expires_at: "", image: "" });
  const [offerProductSearch, setOfferProductSearch] = useState("");
  const [offerSelectedProductId, setOfferSelectedProductId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name: "",
    price_kes: 0,
    duration_minutes: 30,
    icon_url: null,
  });
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | "all">("all");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingServiceImages, setUploadingServiceImages] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productRows, categoryRows, offerRows, brandRows] = await Promise.all([listProducts(), listProductCategories(), listOffers(), listBrands()]);
        setProducts(productRows as ProductItem[]);
        setCategories(categoryRows as CategoryItem[]);
        setOffers(offerRows as unknown as OfferItem[]);
        setBrands(brandRows as BrandItem[]);
      } catch (error) {
        console.error("Failed to load catalog", error);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const rows = await listServicesFn();
        if (Array.isArray(rows) && rows.length > 0) {
          setServices(rows);
        }
      } catch (error) {
        console.error("Failed to load services", error);
      }
    };
    loadServices();
  }, [listServicesFn]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const rows = await listBookingsFn();
        if (Array.isArray(rows)) {
          setBookings(rows);
        }
      } catch (error) {
        console.error("Failed to load bookings", error);
      }
    };
    loadBookings();
  }, [listBookingsFn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadPrescriptions = async () => {
      try {
        const rows = await listPrescriptionsFn();
        setPrescriptions(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Failed to load prescriptions", error);
      }
    };

    loadPrescriptions();
  }, [isLoggedIn, listPrescriptionsFn]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compactProducts = products.map(sanitizeProductForStorage);
    writeStorage("nuno-dashboard-products", compactProducts);
    writeStorage("nuno-dashboard-categories", categories);
  }, [products, categories]);

  useEffect(() => {
    writeServices(services);
  }, [services]);

  useEffect(() => {
    writeStorage(storageKeys.orders, orders);
  }, [orders]);

  useEffect(() => {
    const session = readStorage<{ email: string } | null>(storageKeys.session, null);
    if (session?.email) {
      setEmail(session.email);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedPassword = readStorage<string>(storageKeys.password, adminPassword);
    setStoredAdminPassword(storedPassword);
  }, [adminPassword]);

  const productCategories = useMemo(() => categories.map((cat) => cat.name), [categories]);
  const stats = useMemo(() => {
    const medicineCount = products.filter((product) => !["Perfumes", "Skincare"].includes(product.category)).length;
    const perfumeCount = products.filter((product) => product.category === "Perfumes").length;
    const skincareCount = products.filter((product) => product.category === "Skincare").length;
    return [
      { label: "Medicines", value: medicineCount, accent: "text-primary" },
      { label: "Perfumes", value: perfumeCount, accent: "text-gold" },
      { label: "Skincare", value: skincareCount, accent: "text-primary" },
      { label: "Services", value: services.length, accent: "text-primary" },
      { label: "Bookings", value: bookings.length, accent: "text-sky" },
      { label: "Prescriptions", value: prescriptions.length, accent: "text-cyan" },
      { label: "Orders", value: orders.length, accent: "text-foreground" },
    ];
  }, [products, services.length, bookings.length, orders.length]);

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = bookingStatusFilter === "all" || booking.status === bookingStatusFilter;
      const matchesSearch =
        !query ||
        booking.booking_number.toLowerCase().includes(query) ||
        booking.customer_name.toLowerCase().includes(query) ||
        booking.customer_phone.toLowerCase().includes(query) ||
        booking.customer_email?.toLowerCase().includes(query) ||
        booking.service.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, productSearch]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) => {
      const haystack = `${category.name} ${category.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [categories, categorySearch]);

  function formatOfferExpiryValue(value: string | null | undefined) {
    if (!value) return "";
    const normalized = value.split(" ")[0];
    return normalized.includes("T") ? normalized.split("T")[0] : normalized;
  }

  function findProductForOfferImage(image: string | null | undefined) {
    if (!image) return null;
    return products.find((product) => Array.isArray(product.image_urls) && product.image_urls.some((url) => url === image)) ?? null;
  }

  function resetOfferForm() {
    setEditingOfferId(null);
    setOfferForm({ title: "", description: "", badge: "", discount: "", original_price: "", sale_price: "", expires_at: "", image: "" });
    setOfferProductSearch("");
    setOfferSelectedProductId(null);
  }

  function openOfferDialog(offer?: OfferItem) {
    if (offer) {
      const matchedProduct = findProductForOfferImage(offer.image);
      setEditingOfferId(offer.id);
      setOfferForm({
        title: offer.title,
        description: offer.description ?? "",
        badge: offer.badge ?? "",
        discount: (() => {
          const pct = offer.discount_percent ?? (offer.original_price && offer.sale_price && offer.original_price > offer.sale_price
            ? Math.round(((offer.original_price - offer.sale_price) / offer.original_price) * 100)
            : null);
          return pct != null ? String(pct) : "";
        })(),
        original_price: offer.original_price != null ? String(offer.original_price) : "",
        sale_price: offer.sale_price != null ? String(offer.sale_price) : "",
        expires_at: formatOfferExpiryValue(offer.expires_at),
        image: offer.image ?? matchedProduct?.image_urls?.[0] ?? "",
      });
      setOfferProductSearch(matchedProduct?.name ?? "");
      setOfferSelectedProductId(matchedProduct?.id ?? null);
    } else {
      resetOfferForm();
    }
    setOfferDialogOpen(true);
  }

  function handleOfferProductSelection(nextValue: string) {
    setOfferProductSearch(nextValue);

    const normalized = nextValue.trim().toLowerCase();
    const selectedProduct = products.find((product) => product.id === nextValue || product.name.toLowerCase() === normalized);

    if (!selectedProduct) {
      if (!normalized) {
        setOfferSelectedProductId(null);
        setOfferForm((prev) => ({ ...prev, image: "", original_price: "", sale_price: "" }));
      }
      return;
    }

    setOfferSelectedProductId(selectedProduct.id);
    setOfferProductSearch(selectedProduct.name);
    const firstImage = Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "";
    const discountPct = (() => {
      const parsed = Number(offerForm.discount);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
    })();
    const computedSale = discountPct != null ? Math.max(0, Math.round(selectedProduct.price_kes * (100 - discountPct) / 100)) : "";
    setOfferForm((prev) => ({ ...prev, image: firstImage, original_price: String(selectedProduct.price_kes), sale_price: computedSale ? String(computedSale) : prev.sale_price }));
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      toast.error("Please add an offer title.");
      return;
    }

    setSavingOffer(true);
    try {
      const selectedProduct = offerSelectedProductId ? products.find((product) => product.id === offerSelectedProductId) ?? null : null;
      const resolvedImage = selectedProduct
        ? (Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "")
        : offerForm.image.trim();

      const savedOffer = (await saveOfferFn({
        data: {
          id: editingOfferId ?? undefined,
          title: offerForm.title.trim(),
          description: offerForm.description.trim(),
          badge: offerForm.badge.trim(),
          discount_percent: (() => {
            const parsed = Number(offerForm.discount.trim());
            const orig = offerForm.original_price?.trim() ? Number(offerForm.original_price) : null;
            const sale = offerForm.sale_price?.trim() ? Number(offerForm.sale_price) : null;
            let pct = Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
            if (pct == null && orig != null && sale != null && orig > 0 && sale < orig) {
              pct = Math.round(((orig - sale) / orig) * 100);
            }
            return pct;
          })(),
          original_price: offerForm.original_price?.trim() ? Number(offerForm.original_price) : null,
          sale_price: offerForm.sale_price?.trim() ? Number(offerForm.sale_price) : null,
          product_id: offerSelectedProductId ?? null,
          expires_at: offerForm.expires_at || "",
          image: resolvedImage,
        },
      })) as unknown as OfferItem;

      setOffers((current) => {
        if (editingOfferId) {
          return current.map((offer) => (offer.id === editingOfferId ? savedOffer : offer));
        }
        return [savedOffer, ...current];
      });

      toast.success(editingOfferId ? "Offer updated." : "Offer created.");
      setOfferDialogOpen(false);
      resetOfferForm();
    } catch (error) {
      console.error("Failed to save offer", error);
      toast.error("Unable to save offer right now.");
    } finally {
      setSavingOffer(false);
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await deleteOfferFn({ data: { id } });
      setOffers((current) => current.filter((offer) => offer.id !== id));
      toast.success("Offer deleted.");
    } catch (error) {
      console.error("Failed to delete offer", error);
      toast.error("Unable to delete offer right now.");
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setError("");
    // brief delay for UX feedback
    setTimeout(() => {
      if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === storedAdminPassword) {
        setIsLoggedIn(true);
        writeStorage(storageKeys.session, { email: email.trim() });
        toast.success("Welcome back, admin!");
      } else {
        const msg = "Invalid admin credentials.";
        setError(msg);
        toast.error(msg);
      }
      setLoginLoading(false);
    }, 400);
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setPassword("");
    writeStorage(storageKeys.session, null);
    toast.success("Signed out");
  }

  function changeAdminPassword(newPassword: string) {
    setStoredAdminPassword(newPassword);
    writeStorage(storageKeys.password, newPassword);
  }

  function resetAdminPasswordOverride() {
    setStoredAdminPassword(adminPassword);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeys.password);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeLoading(true);
    try {
      if (currentPassword !== storedAdminPassword) {
        setPasswordChangeError("Current password is incorrect.");
        return;
      }
      if (!newPassword.trim()) {
        setPasswordChangeError("Enter a new password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordChangeError("New passwords do not match.");
        return;
      }
      changeAdminPassword(newPassword.trim());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Admin password updated.");
    } catch (error) {
      console.error("Failed to update password", error);
      setPasswordChangeError("Unable to update password right now.");
    } finally {
      setPasswordChangeLoading(false);
    }
  }

  function resetProductForm() {
    setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [], brand_id: null });
    setEditingProductId(null);
    setProductDialogOpen(false);
  }

  function openProductDialog(product?: ProductItem) {
    if (product) {
      setEditingProductId(product.id);
      setProductForm({
        name: product.name,
        category: product.category,
        description: product.description,
        price_kes: product.price_kes,
        unit: product.unit,
        requires_prescription: product.requires_prescription,
        in_stock: product.in_stock,
        image_urls: product.image_urls ?? [],
        brand_id: product.brand_id ?? null,
      });
    } else {
      setEditingProductId(null);
      setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [], brand_id: null });
    }
    setProductDialogOpen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetCategoryForm() {
    setCategoryForm({ name: "", description: "" });
    setEditingCategoryId(null);
    setCategoryDialogOpen(false);
  }

  function openCategoryDialog(category?: CategoryItem) {
    if (category) {
      setEditingCategoryId(category.id);
      setCategoryForm({ name: category.name, description: category.description });
    } else {
      setEditingCategoryId(null);
      setCategoryForm({ name: "", description: "" });
    }
    setCategoryDialogOpen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetServiceForm() {
    setServiceForm({
      name: "",
      price_kes: 0,
      duration_minutes: 30,
      icon_url: null,
    });
    setEditingServiceId(null);
    setServiceDialogOpen(false);
  }

  function openServiceDialog(service?: ServiceItem) {
    if (service) {
      setEditingServiceId(service.id);
      setServiceForm({
        name: service.name,
        price_kes: service.price_kes,
        duration_minutes: service.duration_minutes,
        icon_url: service.icon_url ?? null,
      });
    } else {
      resetServiceForm();
    }
    setServiceDialogOpen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditService(service: ServiceItem) {
    openServiceDialog(service);
  }

  async function handleDeleteService(id: string) {
    if (!window.confirm("Delete this service? This action cannot be undone.")) return;
    try {
      await deleteServiceFn({ data: { id } });
      setServices((current) => current.filter((item) => item.id !== id));
      toast.success("Service deleted.");
    } catch (error) {
      console.error("Failed to delete service", error);
      toast.error("Unable to delete service right now.");
    }
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      toast.error("Please add a service name.");
      return;
    }

    try {
      const savedService = (await saveServiceFn({
        data: {
          id: editingServiceId ?? undefined,
          name: serviceForm.name.trim(),
          price_kes: serviceForm.price_kes,
          duration_minutes: serviceForm.duration_minutes,
          icon_url: serviceForm.icon_url,
        },
      })) as ServiceItem;

      setServices((current) => {
        if (editingServiceId) {
          return current.map((item) => (item.id === editingServiceId ? savedService : item));
        }
        return [savedService, ...current];
      });

      toast.success(editingServiceId ? "Service updated." : "Service created.");
      resetServiceForm();
    } catch (error) {
      console.error("Failed to save service", error);
      toast.error("Unable to save service right now.");
    }
  }

  async function handleServiceImageChange(files: FileList | File | null | undefined) {
    const file = files instanceof File ? files : files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon is too large. Please choose a file under 2MB.");
      return;
    }

    setUploadingServiceImages(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
        reader.readAsDataURL(file);
      });

      if (!dataUrl) return;

      const uploaded = (await uploadServiceImageFn({
        data: { data_url: dataUrl, filename: file.name },
      })) as { url?: string } | null;

      if (uploaded?.url) {
        setServiceForm((prev) => ({ ...prev, icon_url: uploaded.url! }));
        toast.success("Service icon uploaded.");
      }
    } catch (error) {
      toast.error(`Could not upload service icon: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingServiceImages(false);
    }
  }

  function handleRemoveServiceImage() {
    setServiceForm((prev) => ({
      ...prev,
      icon_url: null,
    }));
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category.trim()) {
      toast.error("Please fill in product name and category.");
      return;
    }

    setSavingProduct(true);
    try {
      const imageUrls = productForm.image_urls?.length ? productForm.image_urls : [];
      const savedProduct = (await saveProductFn({
        data: {
          id: editingProductId ?? undefined,
          name: productForm.name,
          category: productForm.category,
          description: productForm.description,
          price_kes: productForm.price_kes,
          unit: productForm.unit,
          requires_prescription: productForm.requires_prescription,
          in_stock: productForm.in_stock,
          image_urls: imageUrls.length ? imageUrls : null,
          brand_id: productForm.brand_id ?? null,
        },
      })) as unknown as ProductItem;

      setProducts((prev) => {
        if (editingProductId) {
          return prev.map((p) => (p.id === editingProductId ? savedProduct : p));
        }
        return [savedProduct, ...prev];
      });
      resetProductForm();
      toast.success(editingProductId ? "Product updated" : "Product created");
    } catch (error) {
      console.error("Failed to save product", error);
      toast.error(`Could not save product: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSavingProduct(false);
    }
  }

  function handleEditProduct(product: ProductItem) {
    openProductDialog(product);
  }

  async function handleDeleteProduct(id: string) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteProductFn({ data: { id } });
      setProducts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Product deleted");
    } catch (error) {
      console.error("Failed to delete product", error);
      toast.error(`Could not delete product: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleProductImageChange(files: FileList | File | null | undefined) {
    const fileList = files instanceof File ? [files] : files;
    if (!fileList?.length) return;
    const newImages: string[] = [];
    setUploadingImage(true);

    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error("One or more images are too large. Please choose files under 2MB.");
          continue;
        }
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
          reader.readAsDataURL(file);
        });
        if (!dataUrl) continue;

        const uploaded = (await uploadImageFn({
          data: { data_url: dataUrl, filename: file.name },
        })) as { url?: string } | null;

        if (uploaded?.url) {
          newImages.push(uploaded.url);
        }
      }
      if (newImages.length > 0) {
        setProductForm((prev) => ({
          ...prev,
          image_urls: [...(prev.image_urls ?? []), ...newImages],
        }));
        toast.success("Images uploaded and attached to the product.");
      }
    } catch (error) {
      toast.error(`Could not upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleBrandLogoChange(files: FileList | File | null | undefined) {
    const fileList = files instanceof File ? [files] : files;
    if (!fileList?.length) return;
    const file = fileList[0];
    setUploadingBrandLogo(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      const uploaded = (await uploadImageFn({ data: { data_url: dataUrl, filename: file.name } })) as { url?: string } | null;
      if (uploaded?.url) {
        setBrandForm((prev) => ({ ...prev, logo_url: uploaded.url ?? prev.logo_url }));
        toast.success("Brand logo uploaded.");
      }
    } catch (error) {
      toast.error(`Could not upload brand logo: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingBrandLogo(false);
    }
  }

  function resetBrandForm() {
    setBrandForm({ name: "", description: "", logo_url: "", slug: "", is_active: true });
    setEditingBrandId(null);
    setBrandDialogOpen(false);
  }

  function openBrandDialog(brand?: BrandItem) {
    if (brand) {
      setEditingBrandId(brand.id);
      setBrandForm({
        name: brand.name,
        description: brand.description ?? "",
        logo_url: brand.logo_url ?? "",
        slug: brand.slug ?? "",
        is_active: brand.is_active ?? true,
      });
    } else {
      setEditingBrandId(null);
      setBrandForm({ name: "", description: "", logo_url: "", slug: "", is_active: true });
    }
    setBrandDialogOpen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!brandForm.name.trim()) {
      toast.error("Please enter a brand name.");
      return;
    }

    try {
      const savedBrand = (await saveBrandFn({
        data: {
          id: editingBrandId ?? undefined,
          name: brandForm.name.trim(),
          slug: brandForm.slug.trim() || undefined,
          description: brandForm.description.trim(),
          logo_url: brandForm.logo_url.trim() || null,
          is_active: brandForm.is_active,
        },
      })) as unknown as BrandItem;

      setBrands((prev) => {
        if (editingBrandId) {
          return prev.map((brand) => (brand.id === editingBrandId ? savedBrand : brand));
        }
        return [savedBrand, ...prev];
      });
      resetBrandForm();
      toast.success(editingBrandId ? "Brand updated." : "Brand created.");
    } catch (error) {
      console.error("Failed to save brand", error);
      toast.error("Could not save brand.");
    }
  }

  async function handleDeleteBrand(id: string) {
    if (!window.confirm("Delete this brand? Products using it will lose their brand association.")) return;
    try {
      await deleteBrandFn({ data: { id } });
      setBrands((prev) => prev.filter((brand) => brand.id !== id));
      setProducts((prev) => prev.map((product) => (product.brand_id === id ? { ...product, brand_id: null } : product)));
      toast.success("Brand deleted.");
    } catch (error) {
      console.error("Failed to delete brand", error);
      toast.error("Could not delete brand.");
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    setSavingCategory(true);
    try {
      const savedCategory = (await saveCategoryFn({
        data: {
          id: editingCategoryId ?? undefined,
          name: categoryForm.name,
          description: categoryForm.description,
        },
      })) as unknown as CategoryItem;

      setCategories((prev) => {
        if (editingCategoryId) {
          return prev.map((c) => (c.id === editingCategoryId ? savedCategory : c));
        }
        return [savedCategory, ...prev];
      });
      resetCategoryForm();
      toast.success(editingCategoryId ? "Category updated" : "Category created");
    } catch (error) {
      console.error("Failed to save category", error);
      toast.error(`Could not save category: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSavingCategory(false);
    }
  }

  function handleEditCategory(category: CategoryItem) {
    openCategoryDialog(category);
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Delete this category? Products in it will move to Uncategorized.")) return;
    const deletedCategoryName = categories.find((c) => c.id === id)?.name;
    setDeletingId(id);
    try {
      await deleteCategoryFn({ data: { id } });
      setCategories((prev) => prev.filter((item) => item.id !== id));
      if (deletedCategoryName) {
        setProducts((prev) => prev.map((item) => (item.category === deletedCategoryName ? { ...item, category: "Uncategorized" } : item)));
      }
      toast.success("Category deleted");
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error(`Could not delete category: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  }

  function openBookingDialog(booking: BookingItem) {
    setEditingBooking(booking);
    setRescheduleDate(booking.appointment_date ?? "");
    setRescheduleTime(booking.appointment_time ?? "");
    setBookingNote(booking.notes ?? "");
    setBookingDialogOpen(true);
  }

  function closeBookingDialog() {
    setBookingDialogOpen(false);
    setEditingBooking(null);
    setRescheduleDate("");
    setRescheduleTime("");
    setBookingNote("");
  }

  async function updateBookingStatus(bookingId: string, status: BookingStatus, data: { appointment_date?: string; appointment_time?: string; notes?: string } = {}) {
    setBookingActionLoading(true);
    try {
      const updatedBooking = await updateBookingFn({ data: { id: bookingId, status, ...data } });
      setBookings((prev) => prev.map((item) => (item.id === bookingId ? updatedBooking : item)));
      toast.success(`Booking ${status === "confirmed" ? "confirmed" : status === "canceled" ? "canceled" : "rescheduled"}`);
      closeBookingDialog();
    } catch (error) {
      console.error("Failed to update booking", error);
      toast.error(`Could not update booking: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setBookingActionLoading(false);
    }
  }

  async function handleConfirmBooking(booking: BookingItem) {
    await updateBookingStatus(booking.id, "confirmed");
  }

  async function handleCancelBooking(booking: BookingItem) {
    if (!window.confirm("Cancel this booking?")) return;
    await updateBookingStatus(booking.id, "canceled");
  }

  async function handleSaveReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBooking) return;
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please select both date and time.");
      return;
    }
    await updateBookingStatus(editingBooking.id, "rescheduled", {
      appointment_date: rescheduleDate,
      appointment_time: rescheduleTime,
      notes: bookingNote,
    });
  }

  function handleOpenReschedule(booking: BookingItem) {
    openBookingDialog(booking);
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,139,109,0.16),transparent_50%)] px-4 py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 rounded-4xl border border-border bg-background/90 p-8 shadow-elegant backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" /> Admin Access
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold md:text-5xl">Manage products, categories and orders</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Sign in to update your shop inventory, organize categories and review incoming orders.</p>
          </div>

          <form onSubmit={handleLogin} className="flex-1 rounded-4xl border border-border bg-card p-8 shadow-elegant">
            <h2 className="font-display text-2xl font-semibold">Administrator Login</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none ring-0 focus:border-primary" />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none ring-0 focus:border-primary" />
              </label>
            </div>
            {error ? (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}
            <button type="submit" disabled={loginLoading} className="mt-6 inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed">
              {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Log in to dashboard"}
            </button>
            <Link to="/" className="mt-4 block text-sm text-primary hover:underline">Back to the site</Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 rounded-4xl border border-border bg-background/90 p-6 shadow-elegant backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" /> Admin Dashboard
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Store management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create and update products, organize categories, and review orders placed by your customers.</p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>




        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold">Navigate</h3>
              <p className="mt-2 text-sm text-muted-foreground">Jump to a specific admin area.</p>
              <div className="mt-4 flex flex-col gap-3">
                <button onClick={() => setActiveView("dashboard")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "dashboard" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <ShieldCheck className="h-4 w-4" /> Overview
                </button>
                <button onClick={() => setActiveView("security")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "security" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <ShieldCheck className="h-4 w-4" /> Security
                </button>
                <button onClick={() => setActiveView("products")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "products" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Package className="h-4 w-4" /> Products
                </button>
                <button onClick={() => setActiveView("categories")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "categories" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Tags className="h-4 w-4" /> Categories
                </button>
                <button onClick={() => setActiveView("brands")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "brands" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <ImageIcon className="h-4 w-4" /> Brands
                </button>
                <button onClick={() => setActiveView("offers")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "offers" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Gift className="h-4 w-4" /> Offers
                </button>
                <button onClick={() => setActiveView("services")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "services" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Package className="h-4 w-4" /> Services
                </button>
                <button onClick={() => setActiveView("bookings")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "bookings" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <CalendarDays className="h-4 w-4" /> Bookings
                </button>
                <button onClick={() => setActiveView("prescriptions")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "prescriptions" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <FileText className="h-4 w-4" /> Prescriptions
                </button>
                <button onClick={() => setActiveView("orders")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "orders" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <ShoppingCart className="h-4 w-4" /> Orders
                </button>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {activeView === "dashboard" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-4xl border border-border bg-card p-5 shadow-soft">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`mt-2 font-display text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="font-semibold">Dashboard overview</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Choose an option from the sidebar to manage products, categories, offers, or orders.</p>
                </div>
              </>
            ) : null}

            {activeView === "security" ? (
              <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Security</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Update the admin password used to sign in to this dashboard.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium">
                    Current password
                    <input
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      type="password"
                      required
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none ring-0 focus:border-primary"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    New password
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      required
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none ring-0 focus:border-primary"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Confirm new password
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      required
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none ring-0 focus:border-primary"
                    />
                  </label>
                  {passwordChangeError ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{passwordChangeError}</div>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={passwordChangeLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {passwordChangeLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
                    </button>
                    <button
                      type="button"
                      onClick={resetAdminPasswordOverride}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:border-primary hover:text-primary"
                    >
                      Reset to default
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {activeView === "products" ? (
              <>
                <section id="products" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-primary">
                        <Package className="h-5 w-5" />
                        <h2 className="font-display text-2xl font-semibold">Products</h2>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Add, edit, and remove products for the shop.</p>
                    </div>
                    <button onClick={() => openProductDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                      <Plus className="h-4 w-4" /> New product
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    Create or edit products from the popup form opened by the button above.
                  </div>

                  <label className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                    <Search className="h-4 w-4 text-primary" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </label>

                  <div className="mt-6 space-y-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-background px-4 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          {(product.image_urls && product.image_urls.length ? product.image_urls[0] : null) ? (
                            <img
                              src={(product.image_urls && product.image_urls.length ? product.image_urls[0] : null) as string}
                              alt={product.name}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{product.name}</h3>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{product.category}</span>
                              {product.brand_id ? <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">{brands.find((brand) => brand.id === product.brand_id)?.name ?? "Brand"}</span> : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{formatCurrency(product.price_kes)} · {product.unit} · {product.in_stock ? "In stock" : "Out of stock"} · {product.requires_prescription ? "Rx" : "OTC"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openProductDialog(product)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                            <PencilLine className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingId === product.id} className="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60">
                            {deletingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <Dialog open={productDialogOpen} onOpenChange={(open) => (open ? setProductDialogOpen(true) : resetProductForm())}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>{editingProductId ? "Edit product" : "New product"}</DialogTitle>
                      <DialogDescription>Manage a shop product and save it to your inventory.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex h-[calc(90vh-170px)] flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto pr-2">
                        <form id="product-form" onSubmit={handleSaveProduct} className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
                          <label className="text-sm font-medium md:col-span-2">
                            Product name
                            <input value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                          </label>
                          <label className="text-sm font-medium">
                            Category
                            <select value={productForm.category} onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required>
                              <option value="">Select category</option>
                              {productCategories.map((name) => <option key={name} value={name}>{name}</option>)}
                              <option value="Uncategorized">Uncategorized</option>
                            </select>
                          </label>
                          <label className="text-sm font-medium">
                            Price (KES)
                            <input type="number" value={productForm.price_kes} onChange={(e) => setProductForm((prev) => ({ ...prev, price_kes: Number(e.target.value) }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required min="0" />
                          </label>
                          <label className="text-sm font-medium">
                            Brand
                            <select value={productForm.brand_id ?? ""} onChange={(e) => setProductForm((prev) => ({ ...prev, brand_id: e.target.value || null }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3">
                              <option value="">No brand</option>
                              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                            </select>
                          </label>
                          <label className="text-sm font-medium">
                            Unit
                            <input value={productForm.unit} onChange={(e) => setProductForm((prev) => ({ ...prev, unit: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                          </label>
                          <div className="space-y-4">
                            <label className="text-sm font-medium">
                              Description
                              <textarea value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="flex items-center gap-3 text-sm font-medium">
                                <input type="checkbox" checked={productForm.requires_prescription} onChange={(e) => setProductForm((prev) => ({ ...prev, requires_prescription: e.target.checked }))} />
                                Requires prescription
                              </label>
                              <label className="flex items-center gap-3 text-sm font-medium">
                                <input type="checkbox" checked={productForm.in_stock} onChange={(e) => setProductForm((prev) => ({ ...prev, in_stock: e.target.checked }))} />
                                In stock
                              </label>
                            </div>
                            <label className="text-sm font-medium">
                              Product images
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploadingImage}
                                onChange={(event) => {
                                  handleProductImageChange(event.target.files);
                                  event.target.value = "";
                                }}
                                className="mt-3 block w-full rounded-2xl border border-border bg-background px-4 py-3"
                              />
                            </label>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3 max-h-60 overflow-y-auto">
                              {productForm.image_urls && productForm.image_urls.length > 0 ? (
                                productForm.image_urls.map((src, index) => (
                                  <div key={src + index} className="group relative overflow-hidden rounded-2xl border border-border">
                                    <img src={src} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setProductForm((prev) => ({
                                        ...prev,
                                        image_urls: prev.image_urls?.filter((_, idx) => idx !== index) ?? [],
                                      }))}
                                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                                      aria-label="Remove image"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                  No images selected yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>
                      <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={resetProductForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
                        <button type="submit" form="product-form" disabled={savingProduct} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                          {savingProduct ? <svg className="inline-block h-4 w-4 animate-spin align-middle" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> : null}
                          <span className="align-middle">{editingProductId ? (savingProduct ? "Saving..." : "Save product") : (savingProduct ? "Creating..." : "Create product")}</span>
                        </button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}

            {activeView === "categories" ? (
              <div id="categories" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <Tags className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Categories</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Group products by category.</p>
                  </div>
                  <button onClick={() => openCategoryDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                    <Plus className="h-4 w-4" /> New
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Create or edit categories from the popup form opened by the button above.
                </div>

                <label className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                  <Search className="h-4 w-4 text-primary" />
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>

                <div className="mt-6 space-y-3">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openCategoryDialog(category)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary">
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteCategory(category.id)} disabled={deletingId === category.id} className="rounded-full border border-destructive/20 p-2 text-destructive hover:bg-destructive/10 disabled:opacity-60">
                            {deletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeView === "brands" ? (
              <div id="brands" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <ImageIcon className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Brands</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Upload brand logos and link them to products.</p>
                  </div>
                  <button onClick={() => openBrandDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                    <Plus className="h-4 w-4" /> New brand
                  </button>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {brands.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground md:col-span-2">
                      No brands added yet.
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <div key={brand.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
                              {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{brand.name}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">{brand.description || "No description yet."}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openBrandDialog(brand)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary">
                              <PencilLine className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteBrand(brand.id)} disabled={deletingId === brand.id} className="rounded-full border border-destructive/20 p-2 text-destructive hover:bg-destructive/10 disabled:opacity-60">
                              {deletingId === brand.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeView === "offers" ? (
              <div id="offers" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <Gift className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Offers</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Create promotions that appear on the storefront offers page.</p>
                  </div>
                  <button onClick={() => openOfferDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                    <Plus className="h-4 w-4" /> New offer
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Use the popup form to create offers and keep the offers view updated.
                </div>

                <div className="mt-6 space-y-3">
                  {offers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      No offers created yet.
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <div key={offer.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{offer.title}</h3>
                              {offer.badge ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{offer.badge}</span> : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{offer.description ?? "No description provided."}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              {offer.discount ? <span>{offer.discount}</span> : null}
                              {offer.expires_at ? <span>Ends {offer.expires_at}</span> : null}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openOfferDialog(offer)} className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                              <PencilLine className="h-4 w-4" /> Edit
                            </button>
                            <button onClick={() => handleDeleteOffer(offer.id)} disabled={deletingId === offer.id} className="rounded-full border border-destructive/20 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60">
                              {deletingId === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeView === "services" ? (
              <div id="services" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <Package className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Services</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Add or update service offerings that appear on the services page.</p>
                  </div>
                  <button onClick={() => openServiceDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                    <Plus className="h-4 w-4" /> New service
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto">
                  {services.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      No services added yet.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Icon</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Price</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Duration</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {services.map((service) => (
                          <tr key={service.id} className="bg-background">
                            <td className="px-4 py-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary">
                                {service.icon_url ? (
                                  <img src={service.icon_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <FlaskConical className="h-4 w-4" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold">{service.name}</div>
                            </td>
                            <td className="px-4 py-3">{formatServicePrice(service.price_kes)}</td>
                            <td className="px-4 py-3">{formatServiceTat(service.duration_minutes)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => openServiceDialog(service)} className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                                  <PencilLine className="h-4 w-4" /> Edit
                                </button>
                                <button onClick={() => handleDeleteService(service.id)} className="rounded-full border border-destructive/20 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}

            {activeView === "bookings" ? (
              <div id="bookings" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <CalendarDays className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Bookings</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Review and manage appointment bookings from customers.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px]">
                  <label className="block text-sm font-medium">
                    Search bookings
                    <input
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Booking number, customer, or service"
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Filter status
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value as BookingStatus | "all")}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 overflow-x-auto">
                  {filteredBookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      No bookings match your search.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Booking</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Service</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Appointment</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="bg-background">
                            <td className="px-4 py-3">
                              <div className="font-semibold">{booking.booking_number}</div>
                              <div className="mt-1 text-xs text-muted-foreground">Created {booking.createdAt?.split("T")[0] ?? "-"}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{booking.customer_name}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{booking.customer_phone} · {booking.customer_email}</div>
                            </td>
                            <td className="px-4 py-3">{booking.service}</td>
                            <td className="px-4 py-3 uppercase tracking-[0.2em] text-xs text-primary">{booking.booking_type}</td>
                            <td className="px-4 py-3">
                              <div>{booking.appointment_date}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{booking.appointment_time}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : booking.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleConfirmBooking(booking)} disabled={bookingActionLoading || booking.status === "confirmed"} className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-70 disabled:cursor-not-allowed">
                                  Confirm
                                </button>
                                <button onClick={() => handleOpenReschedule(booking)} className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                                  Reschedule
                                </button>
                                <button onClick={() => handleCancelBooking(booking)} disabled={bookingActionLoading || booking.status === "canceled"} className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-70 disabled:cursor-not-allowed">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}

            {activeView === "prescriptions" ? (
              <div id="prescriptions" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-5 w-5" />
                      <h2 className="font-display text-2xl font-semibold">Prescriptions</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">View uploaded prescriptions from customers and open prescription files.</p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  {prescriptions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      No prescription uploads are available yet.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Phone</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Uploaded</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {prescriptions.map((prescription) => (
                          <tr key={prescription.id} className="bg-background">
                            <td className="px-4 py-3 font-semibold text-foreground">{prescription.customer_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{prescription.customer_phone}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(prescription.uploaded_at).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <a href={prescription.prescription_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary">
                                Open file
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}

            {activeView === "orders" ? (
              <div id="orders" className="rounded-4xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-display text-2xl font-semibold">Placed orders</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Track the latest orders placed through the storefront.</p>
                <div className="mt-6 space-y-3">
                  {orders.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" /> No orders yet.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{order.id}</h3>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{order.status}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{order.customerName} · {order.customerEmail}</p>
                          </div>
                          <div className="text-sm font-semibold">{formatCurrency(order.total)}</div>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Placed {order.createdAt}</p>
                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                          {order.items.map((item) => <li key={`${order.id}-${item.name}`} className="flex justify-between gap-3"><span>{item.quantity} × {item.name}</span><span>{formatCurrency(item.price * item.quantity)}</span></li>)}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <>
        <Dialog open={serviceDialogOpen} onOpenChange={(open) => (open ? setServiceDialogOpen(true) : resetServiceForm())}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingServiceId ? "Edit service" : "New service"}</DialogTitle>
              <DialogDescription>Add or update a service offering for the services page.</DialogDescription>
            </DialogHeader>
            <form id="service-form" onSubmit={handleSaveService} className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Service name
                <input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Price (KES)
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.price_kes}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, price_kes: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Service icon
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingServiceImages || Boolean(serviceForm.icon_url)}
                  onChange={(event) => {
                    handleServiceImageChange(event.target.files);
                    event.target.value = "";
                  }}
                  className="mt-2 block w-full rounded-2xl border border-border bg-background px-4 py-3"
                />
                <p className="mt-2 text-xs text-muted-foreground">Upload one icon. It appears in a circle on service cards.</p>
              </label>

              {serviceForm.icon_url ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/40">
                    <img src={serviceForm.icon_url} alt="Service icon preview" className="h-full w-full object-cover" />
                  </div>
                  <button type="button" onClick={handleRemoveServiceImage} className="text-sm font-semibold text-destructive">
                    Remove icon
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  Default laboratory icon will be used
                </div>
              )}
            </form>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetServiceForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" form="service-form" className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold">
                {editingServiceId ? "Save service" : "Create service"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={offerDialogOpen} onOpenChange={(open) => (open ? setOfferDialogOpen(true) : (setOfferDialogOpen(false), resetOfferForm()))}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOfferId ? "Edit offer" : "New offer"}</DialogTitle>
              <DialogDescription>Create a promotion and make it appear on the offers page.</DialogDescription>
            </DialogHeader>
            <form id="offer-form" onSubmit={handleSaveOffer} className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Offer title
                <input value={offerForm.title} onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
              </label>
              <label className="block text-sm font-medium">
                Description
                <textarea value={offerForm.description} onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium">
                  Badge
                  <select value={offerForm.badge} onChange={(e) => setOfferForm((prev) => ({ ...prev, badge: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3">
                    <option value="">Select badge</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Discounted">Discounted</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Original price (KES)
                  <input value={offerForm.original_price} onChange={(e) => setOfferForm((prev) => ({ ...prev, original_price: e.target.value }))} type="number" className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="Auto-filled from product" />
                </label>
                <label className="block text-sm font-medium">
                  Discount (%)
                  <input value={offerForm.discount} onChange={(e) => setOfferForm((prev) => ({ ...prev, discount: e.target.value }))} type="number" min="0" max="100" className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="e.g. 15" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium">
                  Expires at
                  <input type="date" value={offerForm.expires_at} onChange={(e) => setOfferForm((prev) => ({ ...prev, expires_at: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                </label>
                <label className="block text-sm font-medium">
                  Sale price (KES)
                  <input value={offerForm.sale_price} onChange={(e) => setOfferForm((prev) => ({ ...prev, sale_price: e.target.value }))} type="number" className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="Auto-calculated" />
                </label>
                <label className="block text-sm font-medium">
                  Product on offer
                  <input
                    list="offer-product-options"
                    value={offerProductSearch}
                    onChange={(event) => handleOfferProductSelection(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    placeholder="Search products"
                  />
                  <datalist id="offer-product-options">
                    {products.map((product) => (
                      <option key={product.id} value={product.name}>
                        {product.name}
                      </option>
                    ))}
                  </datalist>
                  <span className="mt-2 block text-xs text-muted-foreground">The offer card image will use the selected product image.</span>
                </label>
              </div>
              {offerForm.image ? (
                <div className="overflow-hidden rounded-2xl border border-border">
                  <img src={offerForm.image} alt="Offer preview" className="h-40 w-full object-cover" />
                </div>
              ) : null}
            </form>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => (setOfferDialogOpen(false), resetOfferForm())} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" form="offer-form" disabled={savingOffer} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                {savingOffer ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editingOfferId ? "Save offer" : "Create offer"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={brandDialogOpen} onOpenChange={(open) => (open ? setBrandDialogOpen(true) : resetBrandForm())}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBrandId ? "Edit brand" : "New brand"}</DialogTitle>
              <DialogDescription>Save a brand logo and description for the navbar dropdown.</DialogDescription>
            </DialogHeader>
            <form id="brand-form" onSubmit={handleSaveBrand} className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Brand name
                <input value={brandForm.name} onChange={(e) => setBrandForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Slug
                  <input value={brandForm.slug} onChange={(e) => setBrandForm((prev) => ({ ...prev, slug: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="optional" />
                </label>
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" checked={brandForm.is_active} onChange={(e) => setBrandForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
                  Show on navbar
                </label>
              </div>
              <label className="block text-sm font-medium">
                Description
                <textarea value={brandForm.description} onChange={(e) => setBrandForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
              <label className="block text-sm font-medium">
                Brand logo
                <input type="file" accept="image/*" disabled={uploadingBrandLogo} onChange={(event) => { handleBrandLogoChange(event.target.files); event.target.value = ""; }} className="mt-2 block w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
              {brandForm.logo_url ? (
                <div className="overflow-hidden rounded-2xl border border-border">
                  <img src={brandForm.logo_url} alt="Brand preview" className="h-40 w-full object-contain bg-white" />
                </div>
              ) : null}
            </form>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetBrandForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" form="brand-form" className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                {editingBrandId ? "Save brand" : "Create brand"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={categoryDialogOpen} onOpenChange={(open) => (open ? setCategoryDialogOpen(true) : resetCategoryForm())}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategoryId ? "Edit category" : "New category"}</DialogTitle>
              <DialogDescription>Save a category and keep your catalog organized.</DialogDescription>
            </DialogHeader>
            <form id="category-form" onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Category name
                <input value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
              </label>
              <label className="block text-sm font-medium">
                Description
                <textarea value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
            </form>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetCategoryForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" form="category-form" disabled={savingCategory} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                {savingCategory ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editingCategoryId ? "Save category" : "Create category"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={bookingDialogOpen} onOpenChange={(open) => (open ? setBookingDialogOpen(true) : closeBookingDialog())}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reschedule booking</DialogTitle>
              <DialogDescription>Update the appointment slot or notes for this booking.</DialogDescription>
            </DialogHeader>
            <form id="booking-reschedule-form" onSubmit={handleSaveReschedule} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Appointment date
                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                </label>
                <label className="block text-sm font-medium">
                  Appointment time
                  <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Notes
                <textarea value={bookingNote} onChange={(e) => setBookingNote(e.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
            </form>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeBookingDialog} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" form="booking-reschedule-form" disabled={bookingActionLoading} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                {bookingActionLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
}
