/** Catalog prices are stored as USD cents. */

export function phpPerUsd() {
  const raw = Number(process.env.PHP_PER_USD ?? "58");
  return Number.isFinite(raw) && raw > 0 ? raw : 58;
}

/** Convert USD cents → PHP centavos (PayMongo amounts). */
export function usdCentsToPhpCentavos(usdCents: number) {
  return Math.max(100, Math.round(usdCents * phpPerUsd()));
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatPhpFromUsdCents(usdCents: number) {
  const centavos = usdCentsToPhpCentavos(usdCents);
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);
}
