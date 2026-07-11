import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronDown, Gift, Info, Mail, Menu, Phone, ShoppingBag, Sparkles, UserRound, X,Headset } from "lucide-react";
import { useCart } from "@/lib/cart";
import { listBrands } from "@/lib/shop.functions";
import logoImage from "@/assets/LOGO.jpg";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop by category" },
  { to: "/services", label: "Services" },
] as const;

type NavbarBrand = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [brands, setBrands] = useState<NavbarBrand[]>([]);
  const { count } = useCart();
  const loadBrandsFn = useServerFn(listBrands);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadBrandsFn()
      .then((rows) => {
        if (!mounted) return;
        setBrands(Array.isArray(rows) ? (rows as NavbarBrand[]) : []);
      })
      .catch(() => {
        if (mounted) setBrands([]);
      });

    return () => {
      mounted = false;
    };
  }, [loadBrandsFn]);

  return (
    <header className={`sticky top-0 z-50 glass-nav transition-all ${scrolled ? "shadow-soft" : ""}`}>
      <div className="border-b border-white/20 bg-linear-to-r from-primary via-primary/90 to-gold/90 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm font-medium md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Free delivery for orders within Nairobi
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="tel:+254703244711" className="inline-flex items-center gap-1.5 hover:opacity-90">
              <Phone className="h-3.5 w-3.5" /> +254 703 244 711
            </a>|
             <a href="tel:+254703244711" className="inline-flex items-center gap-1.5 hover:opacity-90">
              <Headset className="h-3.5 w-3.5" /> 0111121500
            </a>|
            <a href="mailto:nunopharmacy@gmail.com" className="inline-flex items-center gap-1.5 hover:opacity-90">
              <Mail className="h-3.5 w-3.5" /> nunopharmacy@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="w-full bg-background/75 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center rounded-2xl p-2">
            <Link to="/" className="flex items-center gap-2.5 group lg:min-w-60">
              <img src={logoImage} alt="Nuno Pharmacy logo" className="h-26 w-26 object-cover transition group-hover:scale-105" />
              <span className="font-display text-lg font-bold tracking-tight"><span className="text-primary">Pharmacy</span></span>
            </Link>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-end gap-2">
                <Link to="/offers" aria-label="Offers" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"><Gift className="h-4.5 w-4.5" /></Link>
                <Link to="/about" aria-label="About" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"><Info className="h-4.5 w-4.5" /></Link>
                <Link to="/contact" aria-label="Contact" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"><Mail className="h-4.5 w-4.5" /></Link>
                <Link to="/dashboard" aria-label="Sign in" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"><UserRound className="h-4.5 w-4.5" /></Link>
                <Link to="/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition">
                  <ShoppingBag className="h-4.5 w-4.5" />
                  {count > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}
                </Link>
                <button aria-label="Toggle menu" onClick={() => setOpen((v) => !v)} className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-background">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
              </div>

              <nav className="hidden lg:flex items-center justify-end gap-1 flex-wrap rounded-full bg-[#0047AB]/90 backdrop-blur px-2 py-1 border border-[#0047AB]/40 text-white">
                {links.map((l) => {
                  const iconMap: Record<string, React.ReactElement> = {
                    "/": <Sparkles className="h-4 w-4" />,
                    "/shop": <ShoppingBag className="h-4 w-4" />,
                    "/services": <Gift className="h-4 w-4" />,
                  };

                  return (
                    <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/" }} activeProps={{ className: "text-white bg-white/15 shadow-soft" }} inactiveProps={{ className: "text-white/80 hover:text-white hover:bg-white/10" }} className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors">{iconMap[l.to]}{l.label}</Link>
                  );
                })}
                <div className="group relative">
                  <button type="button" className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white">
                    Shop by brands
                    <ChevronDown className="h-4 w-4 text-white/70 transition group-hover:text-white" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 min-w-[34rem] max-w-[min(90vw,42rem)] rounded-2xl border border-border bg-background/95 p-3 opacity-0 shadow-xl transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Popular brands</div>
                    {brands.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {brands.map((brand) => (
                          <Link key={brand.id} to="/shop" search={{ brand: brand.slug || brand.id }} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2 transition hover:border-primary hover:bg-primary/5">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
                              {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" /> : <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Brand</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{brand.name}</p>
                              {brand.description ? <p className="truncate text-xs text-muted-foreground">{brand.description}</p> : null}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">New brand logos will appear here soon.</p>
                    )}
                  </div>
                </div>
                <Link to="/laboratory" className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-white/15 font-display">Book Appointment</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 grid gap-1">
            {links.map((l) => {
              const iconMap: Record<string, React.ReactElement> = {
                "/": <Sparkles className="h-4 w-4" />,
                "/about": <UserRound className="h-4 w-4" />,
                "/shop": <ShoppingBag className="h-4 w-4" />,
                "/services": <Gift className="h-4 w-4" />,
                "/contact": <Mail className="h-4 w-4" />,
              };

              return (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} activeOptions={{ exact: l.to === "/" }} activeProps={{ className: "text-primary bg-primary/10" }} inactiveProps={{ className: "text-foreground/80" }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium">{iconMap[l.to]}{l.label}</Link>
              );
            })}
            <div className="mt-2 rounded-2xl border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Brands</p>
              <div className="mt-2 grid gap-2">
                {brands.length > 0 ? brands.map((brand) => (
                  <Link key={brand.id} to="/shop" search={{ brand: brand.slug || brand.id }} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
                      {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" /> : <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Brand</span>}
                    </div>
                    <span className="text-sm font-medium text-foreground">{brand.name}</span>
                  </Link>
                )) : <p className="text-sm text-muted-foreground">Brand logos will appear here once added from the dashboard.</p>}
              </div>
            </div>
            <Link to="/shop" onClick={() => setOpen(false)} className="mt-2 rounded-full btn-gradient px-5 py-3 text-center text-sm font-semibold font-display">Shop Medicine</Link>
            <Link to="/laboratory" onClick={() => setOpen(false)} className="rounded-full border border-primary/20 bg-background/80 px-5 py-3 text-center text-sm font-semibold font-display text-primary">Book a Test</Link>
          </div>
        </div>
      )}
    </header>
  );
}
