/** Admin revizyon notlarında kullanılan alan anahtarları → kullanıcıya gösterilen etiketler */
const REVISION_FIELD_LABELS: Record<string, string> = {
  title: "Başlık",
  price: "Fiyat",
  salary: "Maaş",
  category: "Kategori",
  city: "İl",
  district: "İlçe",
  neighborhood: "Mahalle / Köy",
  location: "Lokasyon",
  description: "Açıklama",
  name: "Ad / Firma",
  company: "Firma",
  brand: "Marka",
  model: "Model",
  year: "Üretim Yılı",
  powerKw: "Güç (kW)",
  tableSize: "Tezgah Boyutu",
  tableWidthMm: "Tezgah Boyutu",
  tableLengthMm: "Tezgah Boyutu",
  axisCount: "Eksen Sayısı",
  condition: "Durum",
  sellerType: "Kimden",
  trade: "Takas",
  delivery: "Teslimat",
  userName: "Satıcı Adı",
  images: "Görseller",
  expertise: "Uzmanlık",
  phone: "Telefon",
  yearLabel: "Deneyim",
  workModel: "Çalışma Modeli",
  level: "Seviye",
};

export function revisionFieldLabel(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "Alan";
  return REVISION_FIELD_LABELS[trimmed] ?? trimmed;
}
