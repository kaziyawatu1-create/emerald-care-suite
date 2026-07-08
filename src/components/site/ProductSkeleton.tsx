export function ProductCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 space-y-2 flex-1">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-11/12 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-9 w-28 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function ProductImageCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft animate-pulse">
      <div className="aspect-[4/3] w-full bg-muted" />
      <div className="flex flex-1 flex-col p-6 space-y-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-11/12 rounded bg-muted" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-20 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
          </div>
          <div className="h-9 w-24 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover opacity-0 transition-opacity duration-500"
          onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
          onError={(e) => e.currentTarget.classList.remove("opacity-0")}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </div>
  );
}
