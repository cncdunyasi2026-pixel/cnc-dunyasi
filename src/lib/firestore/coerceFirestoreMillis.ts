/** Istemci Timestamp, Admin SDK Timestamp veya eski sayisal kayitlar. */
export function coerceFirestoreMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === "object") {
    const asMillis = value as { toMillis?: () => number };
    if (typeof asMillis.toMillis === "function") {
      return asMillis.toMillis();
    }
    const v = value as { seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number };
    const sec = typeof v.seconds === "number" ? v.seconds : typeof v._seconds === "number" ? v._seconds : undefined;
    const nano =
      typeof v.nanoseconds === "number"
        ? v.nanoseconds
        : typeof v._nanoseconds === "number"
          ? v._nanoseconds
          : 0;
    if (typeof sec === "number") {
      return sec * 1000 + nano / 1e6;
    }
  }
  return 0;
}
