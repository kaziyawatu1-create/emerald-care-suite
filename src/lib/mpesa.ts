// Client-safe helpers for M-Pesa formatting.
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Accept 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX, +2547..., 7XXXXXXXX
  if (/^254(7|1)\d{8}$/.test(digits)) return digits;
  if (/^(0)(7|1)\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^(7|1)\d{8}$/.test(digits)) return "254" + digits;
  return null;
}
