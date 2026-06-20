import type { Currency } from "@/types/ad";

const CURRENCY_META: Record<Currency, { symbol: string; locale: string; iso: Currency }> = {
  TRY: { symbol: "₺", locale: "tr-TR", iso: "TRY" },
  USD: { symbol: "$", locale: "en-US", iso: "USD" },
  EUR: { symbol: "€", locale: "de-DE", iso: "EUR" },
  GBP: { symbol: "£", locale: "en-GB", iso: "GBP" },
};

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "TRY", label: "₺ TL" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
];

/**
 * Ham rakam stringini (örn. "3850000") girilen para birimine göre
 * anlık olarak formatlar. Input'ta yazarken kullanılır.
 */
export function formatPriceInput(raw: string, currency: Currency): string {
  // Sadece rakamları al
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  // TRY ve EUR: nokta ayracı (Türkçe/Almanca)
  if (currency === "TRY" || currency === "EUR") {
    return num.toLocaleString("tr-TR");
  }
  // USD ve GBP: virgül ayracı (İngilizce)
  return num.toLocaleString("en-US");
}

export function formatPrice(value: number, currency?: Currency | string): string {
  const cur = (currency as Currency) ?? "TRY";
  const meta = CURRENCY_META[cur] ?? CURRENCY_META.TRY;
  const formatted = value.toLocaleString(meta.locale);
  return cur === "TRY"
    ? `${formatted} ₺`
    : `${meta.symbol}${formatted}`;
}

/** @deprecated Yeni kodda formatPrice(value, currency) kullan */
export function formatTryPrice(value: number) {
  return formatPrice(value, "TRY");
}

/** Vitrin / kartlarda yayın veya oluşturma tarihi gösterimi */
export function formatListingPostedDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
