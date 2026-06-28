"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageFilePicker from "@/components/listing/ImageFilePicker";
import { uniqueSlugFromName } from "@/lib/utils/slugify";
import { uploadUserImagesWithPaths } from "@/services/storageUpload";
import type { MarketplaceListingRecord } from "@/types/marketplaceListing";
import { useAuth } from "@/hooks/useAuth";
import { serviceTypeService, sparePartCategoryService, sparePartBrandService } from "@/services/siteDataService";
import { getBrands, type Brand } from "@/services/brandModelService";
import LocationSelectFields from "@/components/ui/LocationSelectFields";
import type { LocationSelection } from "@/lib/locations/types";

type MarketplaceListingFormProps = {
  category: string;
  storageFolder: string;
  submitListing: (data: MarketplaceListingRecord) => Promise<{ id: string }>;
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15";

const labelClass = "mb-1 block text-xs font-semibold text-[#61748f]";

export default function MarketplaceListingForm({
  category,
  storageFolder,
  submitListing,
}: MarketplaceListingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState<LocationSelection>({
    city: "",
    district: "",
    neighborhood: "",
  });
  const [phone, setPhone] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [expertise, setExpertise] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Teknik Servis
  const [serviceType, setServiceType] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [expertiseBrand, setExpertiseBrand] = useState("");
  const [cncBrands, setCncBrands] = useState<Brand[]>([]);
  // Yedek Parça
  const [partCategory, setPartCategory] = useState("");
  const [partCategories, setPartCategories] = useState<string[]>([]);
  const [brandCompat, setBrandCompat] = useState("");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState("Stokta Var");
  // Yedek Parça: uzmanlık alanı (firmaya ait genel CNC uzmanlığı)
  const [expertiseOptions, setExpertiseOptions] = useState<string[]>([]);

  useEffect(() => {
    if (category === "Teknik Servis") {
      void serviceTypeService.getAll().then((list) => {
        const names = list.map((i) => i.name);
        setServiceTypes(names);
        if (names.length > 0) setServiceType(names[0]);
      });
      void getBrands().then(setCncBrands);
    }
    if (category === "Yedek Parca") {
      void sparePartCategoryService.getAll().then((list) => {
        const names = list.map((i) => i.name);
        setPartCategories(names);
        if (names.length > 0) setPartCategory(names[0]);
      });
      void sparePartBrandService.getAll().then((list) => {
        const names = list.map((i) => i.name);
        setBrandOptions(names);
        setExpertiseOptions(names);
        if (names.length > 0) setBrandCompat(names[0]);
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Oturum bulunamadı.");
      return;
    }
    if (!name.trim() || !title.trim()) {
      setError("Firma adı ve tanıtım başlığı zorunludur.");
      return;
    }
    if (!location.city.trim() || !location.district.trim() || !location.neighborhood.trim()) {
      setError("İl, ilçe ve mahalle/köy seçin.");
      return;
    }
    if (!phone.trim()) {
      setError("Telefon girin.");
      return;
    }
    if (!yearLabel.trim() || !expertise.trim()) {
      setError("Deneyim etiketi ve uzmanlık alanlarını doldurun.");
      return;
    }
    if (!description.trim()) {
      setError("Açıklama girin.");
      return;
    }
    if (files.length === 0) {
      setError("En az bir görsel ekleyin.");
      return;
    }

    setLoading(true);
    try {
      const slug = uniqueSlugFromName(name.trim());
      const uploaded = await uploadUserImagesWithPaths(files, `${storageFolder}/${user.uid}`);
      const record: MarketplaceListingRecord = {
        slug,
        name: name.trim(),
        title: title.trim(),
        city: location.city.trim(),
        district: location.district.trim(),
        neighborhood: location.neighborhood.trim(),
        category,
        phone: phone.trim(),
        yearLabel: yearLabel.trim(),
        expertise: expertise.trim(),
        description: description.trim(),
        images: uploaded.map((item) => item.url),
        imagePaths: uploaded.map((item) => item.path),
        ownerId: user.uid,
        userName: user.displayName ?? user.email?.split("@")[0] ?? "Kullanıcı",
        status: "draft",
        ...(category === "Teknik Servis" && serviceType    ? { serviceType }    : {}),
        ...(category === "Teknik Servis" && expertiseBrand ? { expertiseBrand } : {}),
        ...(category === "Yedek Parca" ? {
          ...(partCategory ? { partCategory } : {}),
          ...(brandCompat ? { brandCompat } : {}),
          stockStatus,
        } : {}),
      };
      const ref = await submitListing(record);
      const kind = category === "Teknik Servis" ? "technical" : "spare";
      router.push(
        `/odeme?listingId=${encodeURIComponent(ref.id)}&kind=${kind}&slug=${encodeURIComponent(slug)}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="ml-name" className={labelClass}>
          Firma / servis adı
        </label>
        <input
          id="ml-name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. CNC Usta Servis"
          required
        />
      </div>
      <div>
        <label htmlFor="ml-title" className={labelClass}>
          Kısa tanıtım
        </label>
        <input
          id="ml-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Fanuc ve Siemens teknik servis"
          required
        />
      </div>
      <LocationSelectFields value={location} onChange={setLocation} inputClass={inputClass} labelClass={labelClass} />
      <div>
        <label htmlFor="ml-phone" className={labelClass}>
          Telefon
        </label>
        <input
          id="ml-phone"
          className={inputClass}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0 (5xx) xxx xx xx"
          required
        />
      </div>
      <div>
        <label htmlFor="ml-year" className={labelClass}>
          Deneyim / öne çıkan etiket
        </label>
        <input
          id="ml-year"
          className={inputClass}
          value={yearLabel}
          onChange={(e) => setYearLabel(e.target.value)}
          placeholder="Örn. 12 yıldır hizmet"
          required
        />
      </div>
      {/* Teknik Servis: Hizmet Tipi + Uzman Markası */}
      {category === "Teknik Servis" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ml-service-type" className={labelClass}>Hizmet Tipi</label>
            {serviceTypes.length > 0 ? (
              <select id="ml-service-type" className={inputClass} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input id="ml-service-type" className={inputClass} value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Örn. Periyodik Bakım" />
            )}
          </div>
          <div>
            <label htmlFor="ml-expertise-brand" className={labelClass}>Uzman Markası</label>
            <select id="ml-expertise-brand" className={inputClass} value={expertiseBrand} onChange={(e) => setExpertiseBrand(e.target.value)}>
              <option value="">Seçin (opsiyonel)</option>
              {cncBrands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Yedek Parça: Parça Kategorisi + Marka Uyumu + Stok */}
      {category === "Yedek Parca" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ml-part-cat" className={labelClass}>Parça Kategorisi</label>
              {partCategories.length > 0 ? (
                <select id="ml-part-cat" className={inputClass} value={partCategory} onChange={(e) => setPartCategory(e.target.value)}>
                  {partCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input id="ml-part-cat" className={inputClass} value={partCategory} onChange={(e) => setPartCategory(e.target.value)} placeholder="Örn. Elektronik Kart" />
              )}
            </div>
            <div>
              <label htmlFor="ml-brand-compat" className={labelClass}>Marka Uyumu</label>
              {brandOptions.length > 0 ? (
                <select id="ml-brand-compat" className={inputClass} value={brandCompat} onChange={(e) => setBrandCompat(e.target.value)}>
                  <option value="">Seçin (opsiyonel)</option>
                  {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input id="ml-brand-compat" className={inputClass} value={brandCompat} onChange={(e) => setBrandCompat(e.target.value)} placeholder="Örn. Fanuc, Siemens" />
              )}
            </div>
          </div>
          <div>
            <label htmlFor="ml-stock" className={labelClass}>Stok Durumu</label>
            <select id="ml-stock" className={inputClass} value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
              <option>Stokta Var</option>
              <option>Sipariş Üzerine</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label htmlFor="ml-expertise" className={labelClass}>
          Uzmanlık alanları
        </label>
        {category === "Yedek Parca" && expertiseOptions.length > 0 ? (
          <select
            id="ml-expertise"
            className={inputClass}
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          >
            <option value="">Seçin (opsiyonel)</option>
            {expertiseOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
        <input
          id="ml-expertise"
          className={inputClass}
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="Örn. Elektronik arıza, spindle, geometri"
          required
        />
        )}
      </div>
      <div>
        <label htmlFor="ml-desc" className={labelClass}>
          Açıklama
        </label>
        <textarea
          id="ml-desc"
          className={`${inputClass} min-h-[120px] resize-y py-3`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Hizmet kapsamınızı ve iletişim tercihinizi yazın."
          required
        />
      </div>

      <ImageFilePicker value={files} onChange={setFiles} maxFiles={6} />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#F26A1B] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(242,106,27,0.28)] transition hover:bg-[#dd5f15] disabled:opacity-60"
      >
        {loading ? "Yükleniyor..." : "Ödemeye devam et"}
      </button>
    </form>
  );
}
