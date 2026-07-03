import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, LogOut, ShieldCheck, ShoppingCart, Tags, PencilLine, AlertCircle } from "lucide-react";

type ProductItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  stock: number;
  active: boolean;
};

type CategoryItem = {
  id: string;
  name: string;
  description: string;
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

const defaultProducts: ProductItem[] = [
  {
    id: "prod-1",
    name: "Vitamin C 1000mg",
    category: "Wellness",
    price: 1200,
    description: "Daily immunity support",
    stock: 25,
    active: true,
  },
  {
    id: "prod-2",
    name: "Hydrating Face Cream",
    category: "Skincare",
    price: 2400,
    description: "Moisturizing cream for smooth skin",
    stock: 12,
    active: true,
  },
];

const defaultCategories: CategoryItem[] = [
  { id: "cat-1", name: "Wellness", description: "Vitamins and wellness essentials" },
  { id: "cat-2", name: "Skincare", description: "Skincare and beauty products" },
];

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
  products: "nuno-dashboard-products",
  categories: "nuno-dashboard-categories",
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
  const [products, setProducts] = useState<ProductItem[]>(() => readStorage(storageKeys.products, defaultProducts));
  const [categories, setCategories] = useState<CategoryItem[]>(() => readStorage(storageKeys.categories, defaultCategories));
  const [orders, setOrders] = useState<OrderItem[]>(() => readStorage(storageKeys.orders, defaultOrders));
  const [productForm, setProductForm] = useState<ProductForm>({ name: "", category: "", price: 0, description: "", stock: 0, active: true });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", description: "" });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  useEffect(() => {
    writeStorage(storageKeys.products, products);
  }, [products]);

  useEffect(() => {
    writeStorage(storageKeys.categories, categories);
  }, [categories]);

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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      setIsLoggedIn(true);
      setError("");
      writeStorage(storageKeys.session, { email: email.trim() });
      return;
    }
    setError("Invalid admin credentials. Try the default admin login details.");
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setPassword("");
    writeStorage(storageKeys.session, null);
  }

  function resetProductForm() {
    setProductForm({ name: "", category: "", price: 0, description: "", stock: 0, active: true });
    setEditingProductId(null);
  }

  function resetCategoryForm() {
    setCategoryForm({ name: "", description: "" });
    setEditingCategoryId(null);
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category.trim()) return;

    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...p, ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) } : p)));
    } else {
      const newProduct: ProductItem = {
        id: `prod-${Date.now()}`,
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };
      setProducts((prev) => [newProduct, ...prev]);
    }

    resetProductForm();
  }

  function handleEditProduct(product: ProductItem) {
    setEditingProductId(product.id);
    setProductForm({ name: product.name, category: product.category, price: product.price, description: product.description, stock: product.stock, active: product.active });
  }

  function handleDeleteProduct(id: string) {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    if (editingCategoryId) {
      setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? { ...c, ...categoryForm } : c)));
    } else {
      const newCategory: CategoryItem = {
        id: `cat-${Date.now()}`,
        ...categoryForm,
      };
      setCategories((prev) => [newCategory, ...prev]);
    }

    resetCategoryForm();
  }

  function handleEditCategory(category: CategoryItem) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, description: category.description });
  }

  function handleDeleteCategory(id: string) {
    setCategories((prev) => prev.filter((item) => item.id !== id));
    setProducts((prev) => prev.map((item) => (item.category === categories.find((c) => c.id === id)?.name ? { ...item, category: "Uncategorized" } : item)));
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
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            <button type="submit" className="mt-6 inline-flex rounded-full btn-gradient px-6 py-3 text-sm font-semibold">Log in to dashboard</button>
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
              <button onClick={resetProductForm} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                <Plus className="h-4 w-4" /> New product
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-6 grid gap-4 md:grid-cols-2">
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
                <input type="number" value={productForm.price} onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required min="0" />
              </label>
              <label className="text-sm font-medium">
                Stock
                <input type="number" value={productForm.stock} onChange={(e) => setProductForm((prev) => ({ ...prev, stock: Number(e.target.value) }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required min="0" />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Description
                <textarea value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
              </label>
              <label className="flex items-center gap-3 text-sm font-medium md:col-span-2">
                <input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm((prev) => ({ ...prev, active: e.target.checked }))} />
                Visible in shop
              </label>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold">{editingProductId ? "Save product" : "Create product"}</button>
                {editingProductId ? <button type="button" onClick={resetProductForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button> : null}
              </div>
            </form>

            <div className="mt-8 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-background px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{product.category}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{formatCurrency(product.price)} · Stock {product.stock} · {product.active ? "Visible" : "Hidden"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditProduct(product)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                      <PencilLine className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Tags className="h-5 w-5" />
                    <h2 className="font-display text-2xl font-semibold">Categories</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Group products by category.</p>
                </div>
                <button onClick={resetCategoryForm} className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-semibold">
                  <Plus className="h-4 w-4" /> New
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="mt-6 space-y-4">
                <label className="block text-sm font-medium">
                  Category name
                  <input value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3" required />
                </label>
                <label className="block text-sm font-medium">
                  Description
                  <textarea value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3" />
                </label>
                <div className="flex gap-3">
                  <button type="submit" className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold">{editingCategoryId ? "Save category" : "Create category"}</button>
                  {editingCategoryId ? <button type="button" onClick={resetCategoryForm} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button> : null}
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCategory(category)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary">
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="rounded-full border border-destructive/20 p-2 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
