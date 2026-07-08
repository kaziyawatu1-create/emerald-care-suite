import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, LogOut, ShieldCheck, ShoppingCart, Tags, PencilLine, AlertCircle, Search, Loader2, ImageIcon, Gift } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { readCatalogCategories, readCatalogProducts, type CatalogCategory, type CatalogProduct } from "../lib/catalog";
import { listProductCategories, listProducts, removeCategory, removeProduct, upsertCategory, upsertProduct } from "../lib/shop.functions";
import { formatServiceType, readServices, writeServices, type ServiceItem, type ServiceType } from "../lib/services";
import { createOffer, deleteOffer, listOffers, updateOffer } from "../lib/offers.functions";


type ProductItem = CatalogProduct;

type CategoryItem = CatalogCategory;

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

type ServiceForm = { name: string; description: string; type: ServiceType };

type OfferForm = {
  title: string;
  description: string;
  discount: string;
  badge: string;
  image: string;
  expiresAt: string;
};

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
  window.localStorage.setItem(key, JSON.stringify(value));
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
  const saveProductFn = useServerFn(upsertProduct);
  const saveCategoryFn = useServerFn(upsertCategory);
  const deleteProductFn = useServerFn(removeProduct);
  const deleteCategoryFn = useServerFn(removeCategory);
  const saveOfferFn = useServerFn(createOffer);
  const updateOfferFn = useServerFn(updateOffer);
  const deleteOfferFn = useServerFn(deleteOffer);
  const loadOffersFn = useServerFn(listOffers);
  const [products, setProducts] = useState<ProductItem[]>(() => readCatalogProducts());
  const [categories, setCategories] = useState<CategoryItem[]>(() => readCatalogCategories());
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());
  const [orders, setOrders] = useState<OrderItem[]>(() => readStorage(storageKeys.orders, defaultOrders));
  const [productForm, setProductForm] = useState<ProductForm>({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_url: null, image_urls: [] });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", description: "" });
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ name: "", description: "", type: "inhouse" });
  const [offers, setOffers] = useState<any[]>([]);
  const [offerForm, setOfferForm] = useState<OfferForm>({ title: "", description: "", discount: "", badge: "", image: "", expiresAt: "" });
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [offerSaving, setOfferSaving] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productRows, categoryRows] = await Promise.all([listProducts(), listProductCategories()]);
        setProducts(productRows as ProductItem[]);
        setCategories(categoryRows as CategoryItem[]);
      } catch (error) {
        console.error("Failed to load catalog", error);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await loadOffersFn();
        if (!mounted) return;
        setOffers(Array.isArray(rows) ? (rows as any[]) : []);
      } catch (error) {
        console.error("Failed to load offers", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadOffersFn]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nuno-dashboard-products", JSON.stringify(products));
      window.localStorage.setItem("nuno-dashboard-categories", JSON.stringify(categories));
    }
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
    setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_url: null, image_urls: [] });
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
        image_url: product.image_url ?? null,
        image_urls: product.image_urls ?? (product.image_url ? [product.image_url] : []),
      });
    } else {
      setEditingProductId(null);
      setProductForm({ name: "", category: "", description: "", price_kes: 0, unit: "pack", requires_prescription: false, in_stock: true, image_url: null, image_urls: [] });
    }
    setProductDialogOpen(true);
  }

  function showFeedback(message: string, type: "success" | "error" = "success") {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback((prev) => (prev?.message === message ? null : prev)), 3500);
  }

  function fileToDataUrl(file: File) {
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
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
  }

  function resetServiceForm() {
    setServiceForm({ name: "", description: "", type: "inhouse" });
    setEditingServiceId(null);
    setServiceDialogOpen(false);
  }

  function openServiceDialog(service?: ServiceItem) {
    if (service) {
      setEditingServiceId(service.id);
      setServiceForm({ name: service.name, description: service.description, type: service.type });
    } else {
      setEditingServiceId(null);
      setServiceForm({ name: "", description: "", type: "inhouse" });
    }
    setServiceDialogOpen(true);
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.description.trim()) {
      toast.error("Please enter the service name and description.");
      return;
    }

    setServiceSaving(true);
    try {
      const savedService: ServiceItem = {
        id: editingServiceId ?? `service-${Date.now()}`,
        name: serviceForm.name,
        description: serviceForm.description,
        type: serviceForm.type,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setServices((prev) => {
        if (editingServiceId) {
          return prev.map((service) => (service.id === editingServiceId ? savedService : service));
        }
        return [savedService, ...prev];
      });
      resetServiceForm();
      showFeedback(editingServiceId ? "Service updated" : "Service created");
      toast.success(editingServiceId ? "Service updated" : "Service created");
    } catch (error) {
      console.error("Failed to save service", error);
      showFeedback(`Could not save service: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast.error(`Could not save service: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setServiceSaving(false);
    }
  }

  async function handleDeleteService(id: string) {
    if (!window.confirm("Delete this service?")) return;
    setDeletingServiceId(id);
    try {
      setServices((prev) => prev.filter((service) => service.id !== id));
      showFeedback("Service deleted");
      toast.success("Service deleted");
    } catch (error) {
      console.error("Failed to delete service", error);
      showFeedback(`Could not delete service: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast.error(`Could not delete service: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingServiceId(null);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category.trim()) {
      toast.error("Please fill in product name and category.");
      return;
    }

    setProductSaving(true);
    try {
      const imageUrls = productForm.image_urls?.length ? productForm.image_urls : productForm.image_url ? [productForm.image_url] : [];
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
          image_url: imageUrls.length ? imageUrls[0] : null,
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
      setProductSaving(false);
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

  async function handleProductImageChange(files: FileList | null) {
    if (!files?.length) return;
    const newImages: string[] = [];
    setUploadingImage(true);

    try {
      for (const file of Array.from(files)) {
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
        if (dataUrl) {
          newImages.push(dataUrl);
        }
      }
      if (newImages.length > 0) {
        setProductForm((prev) => ({
          ...prev,
          image_urls: [...(prev.image_urls ?? []), ...newImages],
          image_url: prev.image_url ?? newImages[0] ?? null,
        }));
        toast.success("Image(s) ready. Save the product to keep them.");
      }
    } catch (error) {
      toast.error(`Could not read image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingImage(false);
    }
  }

  function resetOfferForm() {
    setOfferForm({ title: "", description: "", discount: "", badge: "", image: "", expiresAt: "" });
    setEditingOfferId(null);
    setOfferDialogOpen(false);
  }

  function openOfferDialog(offer?: any) {
    if (offer) {
      setEditingOfferId(offer.id);
      setOfferForm({
        title: offer.title ?? "",
        description: offer.description ?? "",
        discount: offer.discount ?? "",
        badge: offer.badge ?? "",
        image: offer.image ?? "",
        expiresAt: offer.expires_at ? new Date(offer.expires_at).toISOString().slice(0, 16) : "",
      });
    } else {
      setEditingOfferId(null);
      setOfferForm({ title: "", description: "", discount: "", badge: "", image: "", expiresAt: "" });
    }
    setOfferDialogOpen(true);
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      toast.error("Please enter an offer title.");
      return;
    }

    setOfferSaving(true);
    try {
      const payload = {
        title: offerForm.title,
        description: offerForm.description || null,
        discount: offerForm.discount || null,
        badge: offerForm.badge || null,
        image: offerForm.image || null,
        expiresAt: offerForm.expiresAt || null,
      };

      const savedOffer = editingOfferId
        ? ((await updateOfferFn({ data: { id: editingOfferId, ...payload } })) as any)
        : ((await saveOfferFn({ data: payload })) as any);

      setOffers((prev) => {
        if (editingOfferId) {
          return prev.map((offer) => (offer.id === editingOfferId ? savedOffer : offer));
        }
        return [savedOffer, ...prev];
      });
      resetOfferForm();
      showFeedback(editingOfferId ? "Offer updated" : "Offer created");
      toast.success(editingOfferId ? "Offer updated" : "Offer created");
    } catch (error) {
      console.error("Failed to save offer", error);
      showFeedback(`Could not save offer: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast.error(`Could not save offer: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setOfferSaving(false);
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await deleteOfferFn({ data: { id } });
      setOffers((prev) => prev.filter((offer) => offer.id !== id));
      toast.success("Offer deleted");
    } catch (error) {
      console.error("Failed to delete offer", error);
      toast.error(`Could not delete offer: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    setCategorySaving(true);
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
      setCategorySaving(false);
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

        {feedback ? (
          <div className="fixed right-4 top-4 z-50 w-80">
            <Alert className={feedback.type === "error" ? "border-destructive/40 bg-destructive/10" : "border-primary/30 bg-primary/10"}>
              <AlertTitle>{feedback.type === "error" ? "Action failed" : "Success"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-4xl border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className={`mt-2 font-display text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-4xl border border-border bg-card p-6 shadow-soft">
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
                    {(product.image_urls && product.image_urls.length ? product.image_urls[0] : product.image_url) ? (
                      <img
                        src={(product.image_urls && product.image_urls.length ? product.image_urls[0] : product.image_url) as string}
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
                    </div>
                    <div className="rounded-3xl border border-border bg-background p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Product images</p>
                          <p className="text-xs text-muted-foreground">Upload up to 6 images, then save.</p>
                        </div>
                        {uploadingImage ? <span className="text-xs text-muted-foreground">Preparing…</span> : null}
                      </div>
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
                        ) : productForm.image_url ? (
                          <img src={productForm.image_url} alt="Preview" className="h-24 w-full rounded-2xl object-cover" />
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
                  <button type="submit" form="product-form" disabled={productSaving} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                    {productSaving ? <svg className="inline-block h-4 w-4 animate-spin align-middle" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> : null}
                    <span className="align-middle">{editingProductId ? (productSaving ? "Saving..." : "Save product") : (productSaving ? "Creating..." : "Create product")}</span>
                  </button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <section className="space-y-6">
            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Gift className="h-5 w-5" />
                    <h2 className="font-display text-2xl font-semibold">Offers</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Create promotional offers that will appear on the public offers page.</p>
                </div>
                <button onClick={() => openOfferDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                  <Plus className="h-4 w-4" /> New offer
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {offers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground">No offers created yet.</div>
                ) : (
                  offers.map((offer) => (
                    <div key={offer.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-semibold">{offer.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{offer.description || "No description"}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {offer.discount ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{offer.discount}</span> : null}
                            {offer.badge ? <span className="rounded-full bg-muted px-2.5 py-1">{offer.badge}</span> : null}
                            {offer.expires_at ? <span className="rounded-full bg-muted px-2.5 py-1">Expires {new Date(offer.expires_at).toLocaleString()}</span> : null}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openOfferDialog(offer)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary">
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteOffer(offer.id)} className="rounded-full border border-destructive/20 p-2 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Dialog open={offerDialogOpen} onOpenChange={(open) => (open ? setOfferDialogOpen(true) : resetOfferForm())}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingOfferId ? "Edit offer" : "New offer"}</DialogTitle>
                  <DialogDescription>Create or update a promotional offer for the public offers page.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveOffer} className="mt-4 grid gap-4">
                  <label className="block text-sm font-medium">
                    Offer title
                    <input value={offerForm.title} onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <textarea value={offerForm.description} onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Discount
                      <input value={offerForm.discount} onChange={(e) => setOfferForm((prev) => ({ ...prev, discount: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="15%" />
                    </label>
                    <label className="block text-sm font-medium">
                      Badge
                      <input value={offerForm.badge} onChange={(e) => setOfferForm((prev) => ({ ...prev, badge: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="Limited time" />
                    </label>
                  </div>
                  <label className="block text-sm font-medium">
                    Image URL
                    <input value={offerForm.image} onChange={(e) => setOfferForm((prev) => ({ ...prev, image: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" placeholder="/assets/hero.jpg" />
                  </label>
                  <label className="block text-sm font-medium">
                    Expires at
                    <input type="datetime-local" value={offerForm.expiresAt} onChange={(e) => setOfferForm((prev) => ({ ...prev, expiresAt: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                  </label>
                  <DialogFooter>
                    <button type="button" onClick={resetOfferForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
                    <button type="submit" disabled={offerSaving} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                      {offerSaving ? (editingOfferId ? "Saving..." : "Creating...") : (editingOfferId ? "Save offer" : "Create offer")}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Package className="h-5 w-5" />
                    <h2 className="font-display text-2xl font-semibold">Services</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Add clinic and at-home services that appear on the public Services page.</p>
                </div>
                <button onClick={() => openServiceDialog()} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                  <Plus className="h-4 w-4" /> New service
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{formatServiceType(service.type)}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openServiceDialog(service)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary">
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteService(service.id)} disabled={deletingServiceId === service.id} className="rounded-full border border-destructive/20 p-2 text-destructive hover:bg-destructive/10 disabled:opacity-60">
                          {deletingServiceId === service.id ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Dialog open={serviceDialogOpen} onOpenChange={(open) => (open ? setServiceDialogOpen(true) : resetServiceForm())}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingServiceId ? "Edit service" : "New service"}</DialogTitle>
                  <DialogDescription>Create a service that should appear on the public Services page.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveService} className="mt-4 space-y-4">
                  <label className="block text-sm font-medium">
                    Service name
                    <input value={serviceForm.name} onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                  </label>
                  <label className="block text-sm font-medium">
                    Type
                    <select value={serviceForm.type} onChange={(e) => setServiceForm((prev) => ({ ...prev, type: e.target.value as ServiceType }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3">
                      <option value="inhouse">In-house</option>
                      <option value="at-home">At home</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <textarea value={serviceForm.description} onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                  </label>
                  <DialogFooter>
                    <button type="button" onClick={resetServiceForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
                    <button type="submit" disabled={serviceSaving} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{serviceSaving ? (editingServiceId ? "Saving..." : "Creating...") : (editingServiceId ? "Save service" : "Create service")}</button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
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

            <Dialog open={categoryDialogOpen} onOpenChange={(open) => (open ? setCategoryDialogOpen(true) : resetCategoryForm())}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategoryId ? "Edit category" : "New category"}</DialogTitle>
                  <DialogDescription>Manage the product category name and description.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
                  <label className="block text-sm font-medium">
                    Category name
                    <input value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <textarea value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                  </label>
                  <DialogFooter>
                    <button type="button" onClick={resetCategoryForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
                    <button type="submit" disabled={categorySaving} className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{categorySaving ? (editingCategoryId ? "Saving..." : "Creating...") : (editingCategoryId ? "Save category" : "Create category")}</button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
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
          </section>
        </div>
      </div>
    </div>
  );
}
