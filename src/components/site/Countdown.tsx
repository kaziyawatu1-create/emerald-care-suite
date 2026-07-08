import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = Math.max(new Date(expiresAt).getTime() - Date.now(), 0);
    return diff;
  });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(new Date(expiresAt).getTime() - Date.now(), 0);
      setRemaining(diff);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return <span className="text-sm font-semibold text-red-600">Expired</span>;

  const secs = Math.floor(remaining / 1000);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
      <span className="inline-block">{days}d</span>
      <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </div>
  );
}

export default Countdown;
