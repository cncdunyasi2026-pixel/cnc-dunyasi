export const CNC_MACHINE_CATEGORIES = [
  "CNC Dik İşleme",
  "CNC Torna",
  "CNC Lazer / Plazma",
  "EDM",
  "Diğer",
] as const;

export const PRODUCTION_YEAR_MIN = 1990;
export const PRODUCTION_YEAR_MAX = 2045;

/** Üretim yılı dropdown — yeniden eskiye */
export const PRODUCTION_YEARS = Array.from(
  { length: PRODUCTION_YEAR_MAX - PRODUCTION_YEAR_MIN + 1 },
  (_, index) => PRODUCTION_YEAR_MAX - index,
);

export function formatTableSizeMm(width?: number, length?: number): string | null {
  if (!width || !length || width <= 0 || length <= 0) {
    return null;
  }
  return `${width}x${length} mm`;
}

export function formatPowerKw(powerKw?: number): string | null {
  if (powerKw == null || powerKw < 0 || !Number.isFinite(powerKw)) {
    return null;
  }
  if (powerKw > 100) {
    return "100+ kW";
  }
  return `${powerKw} kW`;
}

export function parseTableSizeInput(
  input: string,
): { tableWidthMm: number; tableLengthMm: number } | null {
  const normalized = input.trim().replace(/\s*mm\s*$/i, "").replace(/\s+/g, "");
  const match = normalized.match(/^(\d+)\s*[xX×]\s*(\d+)$/);
  if (!match) return null;

  const tableWidthMm = Number(match[1]);
  const tableLengthMm = Number(match[2]);
  if (!Number.isFinite(tableWidthMm) || !Number.isFinite(tableLengthMm)) return null;
  if (tableWidthMm <= 0 || tableLengthMm <= 0) return null;

  return { tableWidthMm: Math.round(tableWidthMm), tableLengthMm: Math.round(tableLengthMm) };
}
