import { FlaskConical } from "lucide-react";

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
} as const;

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

export function ServiceIcon({
  iconUrl,
  alt = "",
  size = "md",
  className = "",
}: {
  iconUrl?: string | null;
  alt?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary ${sizeClasses[size]} ${className}`}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <FlaskConical className={iconSizeClasses[size]} aria-hidden />
      )}
    </div>
  );
}
