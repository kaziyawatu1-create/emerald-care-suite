import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle, Phone, Mail, MapPin, Clock } from "lucide-react";
import logoImage from "@/assets/Logo.png";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoImage}
              alt="Nuno Pharmacy logo"
              className="h-10 w-10 rounded-xl object-cover"
            />
            <span className="font-display text-lg font-bold">Nuno Pharmacy</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Welness starts here — genuine medicines, certified laboratory services and professional pharmaceutical care.
          </p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" aria-label="social"
                 className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {[['/about','About Us'],['/laboratory','Laboratory'],['/pharmacy','Pharmacy'],['/skincare','Skincare'],['/perfumes','Perfumes'],['/home-services','Home Services'],['/contact','Contact'],['/dashboard','Dashboard']].map(([to,label]) => (
              <li key={to}><Link to={to} className="hover:text-primary">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5"><Phone className="h-4 w-4 text-primary mt-0.5" /> 0703244711</li>
            <li className="flex gap-2.5"><Mail className="h-4 w-4 text-primary mt-0.5" /> nunopharmaceutical@gmail.com</li>
            <li className="flex gap-2.5"><MessageCircle className="h-4 w-4 text-primary mt-0.5" /> <a href="https://www.tiktok.com/@nunopharma" target="_blank" rel="noreferrer" className="hover:text-primary">@nunopharma</a></li>
            <li className="flex gap-2.5"><MapPin className="h-4 w-4 text-primary mt-0.5" /> Kenya, Nairobi, South C, opposite Midad Academy, off Popo Road</li>
            <li className="flex gap-2.5"><Clock className="h-4 w-4 text-primary mt-0.5" /> Mon–Sun · 7:00 — 22:00</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-4">Health tips, new arrivals and promotions, monthly.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button className="rounded-full btn-gradient px-4 py-2.5 text-sm font-semibold font-display">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Nuno Pharmacy. All rights reserved.</span>
          <span>Licensed pharmaceutical provider · NDA Reg.</span>
        </div>
      </div>
    </footer>
  );
}
