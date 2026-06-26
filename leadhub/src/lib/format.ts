// Kleine deutsche Formatierungs-Helfer.

const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const kmFormatter = new Intl.NumberFormat("de-DE");

export function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return eurFormatter.format(value);
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${kmFormatter.format(value)} km`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `vor ${diffD} Tag${diffD === 1 ? "" : "en"}`;
  return formatDate(iso);
}
