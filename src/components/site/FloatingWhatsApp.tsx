import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/256700000000"
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 group"
    >
      <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform group-hover:scale-110">
        <MessageCircle className="h-6 w-6" />
      </span>
    </a>
  );
}
