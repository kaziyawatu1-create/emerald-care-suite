import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, LogOut, ShieldCheck, ShoppingCart, Tags, PencilLine, AlertCircle, Search, Loader2, ImageIcon, Gift } from "lucide-react";
import { toast } from "sonner";
import { readCatalogCategories, readCatalogProducts, type CatalogCategory, type CatalogProduct } from "../lib/catalog";
import { listOffers, removeOffer, upsertOffer } from "../lib/offers.functions";
import { listProductCategories, listProducts, removeCategory, removeProduct, uploadProductImage, upsertCategory, upsertProduct } from "../lib/shop.functions";
import { formatServiceType, readServices, writeServices, type ServiceItem, type ServiceType } from "../lib/services";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";


type ProductItem = CatalogProduct;

type CategoryItem = CatalogCategory;

type OfferItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  discount: string | null;
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

type ProductForm = Omit<ProductItem, "id">;

type CategoryForm = Omit<CategoryItem, "id">;

type OfferForm = {
  title: string;
  description: string;
  badge: string;
  discount: string;
  expires_at: string;
  image: string;
};

type ServiceForm = { name: string; description: string; type: ServiceType };
type AdminView = "dashboard" | "products" | "categories" | "offers" | "orders";

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
};

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const saveProductFn = useServerFn(upsertProduct);
  const saveCategoryFn = useServerFn(upsertCategory);
  const deleteProductFn = useServerFn(removeProduct);
  const deleteCategoryFn = useServerFn(removeCategory);
  const saveOfferFn = useServerFn(upsertOffer);
  const deleteOfferFn = useServerFn(removeOffer);
  const uploadImageFn = useServerFn(uploadProductImage);

  const [products, setProducts] = useState<ProductItem[]>(() => readCatalogProducts());
  const [categories, setCategories] = useState<CategoryItem[]>(() => readCatalogCategories());
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());
  const [orders, setOrders] = useState<OrderItem[]>(() => readStorage(storageKeys.orders, defaultOrders));
  const [productForm, setProductForm] = useState<ProductForm>({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [] });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", description: "" });
  const [offerForm, setOfferForm] = useState<OfferForm>({ title: "", description: "", badge: "", discount: "", expires_at: "", image: "" });
  const [offerProductSearch, setOfferProductSearch] = useState("");
  const [offerSelectedProductId, setOfferSelectedProductId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ name: "", description: "", type: "inhouse" });
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productRows, categoryRows, offerRows] = await Promise.all([listProducts(), listProductCategories(), listOffers()]);
        setProducts(productRows as ProductItem[]);
        setCategories(categoryRows as CategoryItem[]);
        setOffers(offerRows as OfferItem[]);
      } catch (error) {
        console.error("Failed to load catalog", error);
      }
    };

    loadCatalog();
  }, []);

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

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@nuno.com";
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin1234";

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
      { label: "Orders", value: orders.length, accent: "text-foreground" },
    ];
  }, [products, services.length, orders.length]);

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
    setOfferForm({ title: "", description: "", badge: "", discount: "", expires_at: "", image: "" });
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
        discount: offer.discount ?? "",
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
        setOfferForm((prev) => ({ ...prev, image: "" }));
      }
      return;
    }

    setOfferSelectedProductId(selectedProduct.id);
    setOfferProductSearch(selectedProduct.name);
    const firstImage = Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "";
    setOfferForm((prev) => ({ ...prev, image: firstImage }));
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
          discount: offerForm.discount.trim(),
          expires_at: offerForm.expires_at || "",
          image: resolvedImage,
        },
      })) as OfferItem;

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
      if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
        setIsLoggedIn(true);
        writeStorage(storageKeys.session, { email: email.trim() });
        toast.success("Welcome back, admin!");
      } else {
        const msg = "Invalid admin credentials. Use the demo login shown on this page.";
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


  function resetProductForm() {
    setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [] });
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
      });
    } else {
      setEditingProductId(null);
      setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_urls: [] });
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
            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Demo login</p>
              <p>Email: {adminEmail}</p>
              <p>Password: {adminPassword}</p>
            </div>
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
                <button onClick={() => setActiveView("products")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "products" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Package className="h-4 w-4" /> Products
                </button>
                <button onClick={() => setActiveView("categories")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "categories" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Tags className="h-4 w-4" /> Categories
                </button>
                <button onClick={() => setActiveView("offers")} className={`inline-flex items-center justify-start gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeView === "offers" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
                  <Gift className="h-4 w-4" /> Offers
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Badge
                  <select value={offerForm.badge} onChange={(e) => setOfferForm((prev) => ({ ...prev, badge: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3">
                    <option value="">Select badge</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Discounted">Discounted</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Discount label
                  <input value={offerForm.discount} onChange={(e) => setOfferForm((prev) => ({ ...prev, discount: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="15% off" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Expires at
                  <input type="date" value={offerForm.expires_at} onChange={(e) => setOfferForm((prev) => ({ ...prev, expires_at: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" />
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
      </>
    </div>
  );
}
