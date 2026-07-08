import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Home, Info, Mail, Menu, Phone, ShoppingBag, Stethoscope, Truck, UserRound, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import logoImage from "@/assets/LOGO.jpg";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: Info },
  // Services are listed on the main services page and homepage overview.
  { to: "/shop", label: "Our Products", icon: ShoppingBag },
  { to: "/services", label: "Services", icon: Stethoscope },
  { to: "/contact", label: "Contact", icon: Phone },
  // { to: "/pharmacy", label: "Pharmacy" },
  // { to: "/skincare", label: "Skincare" },
  // { to: "/perfumes", label: "Perfumes" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 glass-nav transition-all ${scrolled ? "shadow-soft" : ""}`}>
      <div className="bg-gradient-to-r from-emerald-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="mx-auto flex flex-col gap-2 px-4 py-2 text-sm font-semibold md:px-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 leading-none">
            <Truck className="h-4 w-4" />
            Free delivery on orders across Nairobi.
          </p>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <a href="tel:0703244711" className="inline-flex items-center gap-1.5 leading-none text-white hover:text-slate-100">
              <Phone className="h-4 w-4" />
              0703244711
            </a>
            <a href="mailto:mmuthamacollins90@gmail.com" className="inline-flex items-center gap-1.5 leading-none text-white hover:text-slate-100">
              <Mail className="h-4 w-4" />
              mmuthamacollins90@gmail.com
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <Link to="/" className="flex items-center gap-2.5 group lg:min-w-60">
            <img
              src={logoImage}
              alt="Nuno Pharmacy logo"
              className="h-26 w-26 object-cover transition group-hover:scale-105"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-primary">Pharmacy</span>
            </span>
          </Link>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end gap-2">
              <Link
                to="/offers"
                aria-label="Offers"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"
              >
                <Gift className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/dashboard"
                aria-label="Sign in"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"
              >
                <UserRound className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/cart"
                aria-label="Cart"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
              <button
                aria-label="Toggle menu"
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-background"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <nav className="hidden lg:flex items-center justify-end gap-1 flex-wrap rounded-full border border-primary/15 bg-primary/10 px-2 py-2 shadow-sm backdrop-blur">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    activeOptions={{ exact: l.to === "/" }}
                    activeProps={{ className: "text-primary bg-background/80 shadow-sm" }}
                    inactiveProps={{ className: "text-foreground/75 hover:text-primary hover:bg-background/70" }}
                    className="rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{l.label}</span>
                    </span>
                  </Link>
                );
              })}
              <a
                href="#book-a-test"
                className="rounded-full btn-gradient px-4 py-2.5 text-sm font-semibold font-display"
              >
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Book a Test</span>
                </span>
              </a>
            </nav>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-primary/10/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 grid gap-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: l.to === "/" }}
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  inactiveProps={{ className: "text-foreground/80" }}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{l.label}</span>
                  </span>
                </Link>
              );
            })}
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full btn-gradient px-5 py-3 text-center text-sm font-semibold font-display"
            >
              <span className="flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Shop Medicine</span>
              </span>
            </Link>
            <a
              href="#book-a-test"
              onClick={() => setOpen(false)}
              className="rounded-full border border-primary/20 bg-background/80 px-5 py-3 text-center text-sm font-semibold font-display text-primary"
            >
              <span className="flex items-center justify-center gap-2">
                <Stethoscope className="h-4 w-4" />
                <span>Book a Test</span>
              </span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
