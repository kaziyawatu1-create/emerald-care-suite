import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, LayoutDashboard } from "lucide-react";
import { useCart } from "@/lib/cart";
import logoImage from "@/assets/Logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/laboratory", label: "Laboratory" },
  { to: "/pharmacy", label: "Pharmacy" },
  { to: "/shop", label: "Shop" },
  { to: "/skincare", label: "Skincare" },
  { to: "/perfumes", label: "Perfumes" },
  { to: "/contact", label: "Contact" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={logoImage}
            alt="Nuno Pharmacy logo"
            className="h-10 w-10"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-primary"> Pharmacy</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-primary bg-primary/8" }}
              inactiveProps={{ className: "text-foreground/75 hover:text-primary hover:bg-primary/5" }}
              className="rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
          <Link
            to="/dashboard"
            aria-label="Dashboard"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:border-primary hover:text-primary transition"
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
          </Link>
          <Link
            to="/shop"
            className="hidden md:inline-flex rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold font-display"
          >
            Shop Medicine
          </Link>
          <Link
            to="/laboratory"
            className="hidden md:inline-flex rounded-full border border-primary/20 bg-background/80 px-5 py-2.5 text-sm font-semibold font-display text-primary transition hover:bg-primary/5"
          >
            Book a Test
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-background"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 grid gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-primary bg-primary/10" }}
                inactiveProps={{ className: "text-foreground/80" }}
                className="rounded-xl px-3 py-2.5 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full btn-gradient px-5 py-3 text-center text-sm font-semibold font-display"
            >
              Shop Medicine
            </Link>
            <Link
              to="/laboratory"
              onClick={() => setOpen(false)}
              className="rounded-full border border-primary/20 bg-background/80 px-5 py-3 text-center text-sm font-semibold font-display text-primary"
            >
              Book a Test
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
