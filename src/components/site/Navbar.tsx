import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Pill } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/laboratory", label: "Laboratory" },
  { to: "/pharmacy", label: "Pharmacy" },
  { to: "/skincare", label: "Skincare" },
  { to: "/perfumes", label: "Perfumes" },
  { to: "/home-services", label: "Home Services" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
            <Pill className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Nuno<span className="text-primary"> Pharmacy</span>
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
            to="/home-services"
            className="hidden md:inline-flex rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold font-display"
          >
            Book Appointment
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
              to="/home-services"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full btn-gradient px-5 py-3 text-center text-sm font-semibold font-display"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
