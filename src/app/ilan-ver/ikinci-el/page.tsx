"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageFilePicker from "@/components/listing/ImageFilePicker";
import VideoFilePicker from "@/components/listing/VideoFilePicker";
import ListingPublishShell from "@/components/listing/ListingPublishShell";
import { CNC_MACHINE_CATEGORIES } from "@/lib/constants/listingOptions";
import { useAuth } from "@/hooks/useAuth";
import { createAd } from "@/services/adService";
import { uploadUserImagesWithPaths, uploadUserVideoWithPath } from "@/services/storageUpload";
import { DEFAULT_AD_DESCRIPTION } from "@/lib/constants/adDescription";
import type { Currency } from "@/types/ad";
import { getBrandsWithModels, type BrandWithModels } from "@/services/brandModelService";
import { getCategories } from "@/services/categoryService";
import { CURRENCY_OPTIONS, formatPriceInput } from "@/lib/utils/format";
import LocationSelectFields from "@/components/ui/LocationSelectFields";
import type { LocationSelection } from "@/lib/locations/types";

const inputClass =
  "h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15";

const labelClass = "mb-1 block text-xs font-semibold text-[#61748f]";

function IkinciElForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [priceRaw, setPriceRaw] = useState(""); // sadece rakamlar: "3850000"
  const [currency, setCurrency] = useState<Currency>("TRY");
  const [categories, setCategories] = useState<string[]>([...CNC_MACHINE_CATEGORIES]);
  const [category, setCategory] = useState<string>(CNC_MACHINE_CATEGORIES[0]);
  const [condition, setCondition] = useState("İkinci El");
  const [year, setYear] = useState("");
  const [axisCount, setAxisCount] = useState("");
  const [sellerType, setSellerType] = useState("Satıcıdan");
  const [trade, setTrade] = useState("Değerlendirilebilir");
  const [delivery, setDelivery] = useState("Hazır");
  const [location, setLocation] = useState<LocationSelection>({
    city: "",
    district: "",
    neighborhood: "",
  });
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [labelMissing, setLabelMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [brandsData, setBrandsData] = useState<BrandWithModels[]>([]);
  const [brandSelect, setBrandSelect] = useState(""); // dropdown seçimi
  const [modelSelect, setModelSelect] = useState(""); // dropdown seçimi
  const availableModels = brandsData.find((b) => b.name === brandSelect)?.models ?? [];
  const brandIsOther = brandSelect === "__other__";
  const modelIsOther = modelSelect === "__other__";

  useEffect(() => {
    void getBrandsWithModels().then(setBrandsData);
    void getCategories().then((cats) => {
      if (cats.length > 0) {
        const names = cats.map((c) => c.name);
        setCategories(names);
        setCategory(names[0]);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Oturum bulunamadı.");
      return;
    }

    const priceNum = parseInt(priceRaw, 10);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }

    if (!title.trim()) {
      setError("İlan başlığı girin.");
      return;
    }

    if (!brand.trim() || !model.trim()) {
      setError("Marka ve model girin.");
      return;
    }

    if (!location.city.trim() || !location.district.trim() || !location.neighborhood.trim()) {
      setError("İl, ilçe ve mahalle/köy seçin.");
      return;
    }

    if (files.length === 0) {
      setError("En az bir görsel ekleyin.");
      return;
    }

    setLoading(true);
    try {
      const now = Date.now();
      const uploaded = await uploadUserImagesWithPaths(files, `ad-images/${user.uid}`);
      const uploadedVideo = videoFile
        ? await uploadUserVideoWithPath(videoFile, `ad-videos/${user.uid}`)
        : null;
      const ref = await createAd({
        title: title.trim(),
        brand: brand.trim(),
        model: model.trim(),
        price: Math.round(priceNum),
        currency,
        city: location.city.trim(),
        district: location.district.trim(),
        neighborhood: location.neighborhood.trim(),
        category,
        condition,
        ...(year.trim() && Number(year) > 0 ? { year: Number(year) } : {}),
        axisCount: axisCount || undefined,
        sellerType,
        trade,
        delivery,
        description: description.trim(),
        images: uploaded.map((item) => item.url),
        imagePaths: uploaded.map((item) => item.path),
        ...(uploadedVideo
          ? { video: uploadedVideo.url, videoPath: uploadedVideo.path }
          : {}),
        ...(labelMissing ? { machineLabelMissing: true } : {}),
        ownerId: user.uid,
        userName: user.displayName ?? user.email?.split("@")[0] ?? "Kullanıcı",
        status: "pending",
        isPaid: true,
        listingFee: 2500,
        discountedFee: 0,
        paymentStartedAt: now,
        paymentDueAt: now + 24 * 60 * 60 * 1000,
      });
      router.push(`/odeme?listingId=${encodeURIComponent(ref.id)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="ad-title" className={labelClass}>
          İlan başlığı
        </label>
        <input
          id="ad-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. DOOSAN DNM 4500 - 2020"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── Marka ── */}
        <div className="space-y-2">
          <label htmlFor="ad-brand" className={labelClass}>Marka</label>
          {brandsData.length > 0 ? (
            <select
              id="ad-brand"
              className={inputClass}
              value={brandSelect}
              onChange={(e) => {
                const val = e.target.value;
                setBrandSelect(val);
                setModelSelect("");
                setBrand(val === "__other__" ? "" : val);
                setModel("");
              }}
              required={!brandIsOther}
            >
              <option value="">Marka seçin</option>
              {brandsData.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
              <option value="__other__">Diğer</option>
            </select>
          ) : null}
          {(brandIsOther || brandsData.length === 0) && (
            <input
              className={inputClass}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marka adını yazın"
              required
            />
          )}
        </div>

        {/* ── Model ── */}
        <div className="space-y-2">
          <label htmlFor="ad-model" className={labelClass}>Model</label>
          {availableModels.length > 0 && !brandIsOther ? (
            <select
              id="ad-model"
              className={inputClass}
              value={modelSelect}
              onChange={(e) => {
                const val = e.target.value;
                setModelSelect(val);
                setModel(val === "__other__" ? "" : val);
              }}
              required={!modelIsOther}
            >
              <option value="">Model seçin</option>
              {availableModels.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
              <option value="__other__">Diğer</option>
            </select>
          ) : null}
          {(modelIsOther || brandIsOther || (brandsData.length > 0 && availableModels.length === 0 && !brandIsOther && brandSelect && brandSelect !== "") || brandsData.length === 0) && (
            <input
              className={inputClass}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model adını yazın"
              required
            />
          )}
          {!brandSelect && brandsData.length > 0 && (
            <p className="text-[11px] text-[#7A8CA5]">Önce marka seçin</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-price" className={labelClass}>Fiyat</label>
          <div className="flex h-11 overflow-hidden rounded-xl border border-[#d3dcea] bg-white transition focus-within:border-[#0F2A4A] focus-within:ring-2 focus-within:ring-[#0F2A4A]/15">
            {/* Para birimi seçici */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="shrink-0 border-r border-[#d3dcea] bg-[#f4f7fb] px-3 text-sm font-semibold text-[#0F2A4A] outline-none"
              aria-label="Para birimi"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Fiyat alanı — anlık formatlamalı */}
            <input
              id="ad-price"
              type="text"
              inputMode="numeric"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#0F2A4A] outline-none"
              value={formatPriceInput(priceRaw, currency)}
              onChange={(e) => {
                // Sadece rakamları sakla
                const digits = e.target.value.replace(/\D/g, "");
                setPriceRaw(digits);
              }}
              placeholder={currency === "TRY" || currency === "EUR" ? "3.850.000" : "3,850,000"}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="ad-category" className={labelClass}>
            Kategori
          </label>
          <select
            id="ad-category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Durum · Model Yılı ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-condition" className={labelClass}>Durum</label>
          <select id="ad-condition" className={inputClass} value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option>İkinci El</option>
            <option>Sıfır</option>
          </select>
        </div>
        <div>
          <label htmlFor="ad-year" className={labelClass}>Model Yılı</label>
          <input
            id="ad-year"
            type="number"
            min={1950}
            max={new Date().getFullYear() + 1}
            className={inputClass}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Örn. 2018"
          />
        </div>
      </div>

      {/* ── Eksen · Kimden ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-axis" className={labelClass}>Eksen Sayısı</label>
          <select id="ad-axis" className={inputClass} value={axisCount} onChange={(e) => setAxisCount(e.target.value)}>
            <option value="">Seçin</option>
            <option>2 Eksen</option>
            <option>3 Eksen</option>
            <option>4 Eksen</option>
            <option>5 Eksen</option>
            <option>6+ Eksen</option>
          </select>
        </div>
        <div>
          <label htmlFor="ad-seller" className={labelClass}>Kimden</label>
          <select id="ad-seller" className={inputClass} value={sellerType} onChange={(e) => setSellerType(e.target.value)}>
            <option>Satıcıdan</option>
            <option>Mağazadan</option>
          </select>
        </div>
      </div>

      {/* ── Takas · Teslimat ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-trade" className={labelClass}>Takas</label>
          <select id="ad-trade" className={inputClass} value={trade} onChange={(e) => setTrade(e.target.value)}>
            <option>Değerlendirilebilir</option>
            <option>Yok</option>
          </select>
        </div>
        <div>
          <label htmlFor="ad-delivery" className={labelClass}>Teslimat</label>
          <select id="ad-delivery" className={inputClass} value={delivery} onChange={(e) => setDelivery(e.target.value)}>
            <option>Hazır</option>
            <option>Belirli tarihlerde hazır olacak</option>
          </select>
        </div>
      </div>

      <LocationSelectFields value={location} onChange={setLocation} inputClass={inputClass} labelClass={labelClass} />

      <div>
        <ImageFilePicker value={files} onChange={setFiles} maxFiles={8} />
        <div className="mt-4">
          <VideoFilePicker value={videoFile} onChange={setVideoFile} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dbe2ea] bg-[#f8fafc] px-3 py-2.5">
          <p className="text-xs text-[#61748f]">
            <span className="font-semibold text-[#0F2A4A]">🏷️ Lütfen tezgah etiketini de yükleyiniz.</span>
            {" "}Tezgahtaki seri no ve model bilgilerini gösteren etiketi görsellere ekleyin.
          </p>
          <button
            type="button"
            onClick={() => setLabelMissing((v) => !v)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              labelMissing
                ? "border-[#0F2A4A] bg-[#0F2A4A] text-white"
                : "border-[#d3dcea] bg-white text-[#61748f] hover:border-[#0F2A4A]/50 hover:text-[#0F2A4A]"
            }`}
          >
            {labelMissing ? "✓ Etiket yok olarak işaretlendi" : "Tezgah etiketi yoktur"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="ad-description" className={labelClass}>
          Açıklama
        </label>
        <textarea
          id="ad-description"
          className={`${inputClass} min-h-[120px] resize-y py-3`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="İlan açıklaması"
          required
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(15,42,74,0.25)] transition hover:translate-y-[-1px] disabled:opacity-60"
      >
        {loading ? "Yükleniyor..." : "İlanı yayınla"}
      </button>

      <p className="text-center text-xs text-[#7A8CA5]">Yalnızca doğru ve güncel bilgi paylaştığınızdan emin olun.</p>
    </form>
  );
}

export default function IkinciElIlanVerPage() {
  return (
    <ListingPublishShell
      eyebrow="İKİNCİ EL CNC"
      title="Tezgah ilanı oluştur"
      subtitle="Başlık, fiyat, konum, fotoğraf ve opsiyonel video ile ilanını oluştur."
    >
      <IkinciElForm />
    </ListingPublishShell>
  );
}
