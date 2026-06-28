/** Firestore Timestamp / Admin SDK nesnelerini JSON'a güvenle çevirir. */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val == null) return val;
      if (typeof val === "object") {
        if (typeof (val as { toMillis?: () => number }).toMillis === "function") {
          return (val as { toMillis: () => number }).toMillis();
        }
        if (typeof (val as { toDate?: () => Date }).toDate === "function") {
          return (val as { toDate: () => Date }).toDate().getTime();
        }
      }
      return val;
    }),
  ) as T;
}
