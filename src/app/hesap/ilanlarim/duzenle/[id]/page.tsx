"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AdDetailContent from "@/components/ad/AdDetailContent";
import { useAuth } from "@/hooks/useAuth";
import { getAdById, submitAdUpdateForReview } from "@/services/adService";
import { getPendingCopyForAd } from "@/lib/firestore/ads";
import { uploadUserImagesWithPaths } from "@/services/storageUpload";
import { DEFAULT_AD_DESCRIPTION } from "@/lib/constants/adDescription";
import type { Ad } from "@/types/ad";

type Props = { params: Promise<{ id: string }> };
type EditableField =
  | "title"
  | "brand"
  | "model"
  | "price"
  | "city"
  | "district"
  | "category"
  | "condition"
  | "trade"
  | "delivery"
  | "userName"
  | "description";
type ConfirmAction = { type: "removeKeptImage"; index: number } | { type: "removeNewImage"; index: number };

export default function EditListingPage({ params }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [id, setId] = useState<string>("");
  const [source, setSource] = useState<Ad | null>(null);
  // Orijinal ilanın güncelleme kopyasındaki revizyon notları
  const [pendingRevisionFields, setPendingRevisionFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [keptImagePaths, setKeptImagePaths] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    action: ConfirmAction | null;
  }>({ open: false, message: "", action: null });

  // Revize istenen ama değiştirilmemiş alanlar için uyarı
  const [revisionWarning, setRevisionWarning] = useState<{
    open: boolean;
    unchangedLabels: string[];
  }>({ open: false, unchangedLabels: [] });

  const [editModal, setEditModal] = useState<{ key: EditableField | "images"; label: string } | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pendingDeleteImageIndex, setPendingDeleteImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    price: "",
    city: "",
    district: "",
    category: "",
    condition: "",
    trade: "",
    delivery: "",
    userName: "",
    description: "",
  });

  // pendingRevisionFields: kopyadan (needs_revision) alınan alan bazlı admin notları
  const revisionFields = pendingRevisionFields;
  const previewUrls = useMemo(
    () => (newFiles.length > 0 ? newFiles.map((f) => URL.createObjectURL(f)) : []),
    [newFiles],
  );

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  useEffect(() => {
    if (authLoading || !id) return;
    if (!user) {
      router.replace(`/hesap/giris?redirect=${encodeURIComponent(`/hesap/ilanlarim/duzenle/${id}`)}`);
      return;
    }

    let cancelled = false;
    setError(null);
    void getAdById(id)
      .then((ad) => {
        if (cancelled) return;
        if (!ad) {
          setError("İlan bulunamadı.");
          return;
        }
        if (ad.ownerId !== user.uid) {
          setError("Bu ilanı düzenleme yetkin yok.");
          return;
        }
        setSource(ad);
        setKeptImages(ad.images ?? []);
        setKeptImagePaths(Array.isArray(ad.imagePaths) ? ad.imagePaths : []);
        setForm({
          title: ad.title,
          brand: ad.brand ?? ad.title.split(" ").slice(0, 2).join(" "),
          model: ad.model ?? ad.title.split(" ").slice(2).join(" "),
          price: String(ad.price),
          city: ad.city,
          district: ad.district,
          category: ad.category,
          condition: ad.condition ?? "Ekspertiz Onayli",
          trade: ad.trade ?? "Degerlendirilebilir",
          delivery: ad.delivery ?? "Hazir",
          userName: ad.userName,
          description: ad.description?.trim() ? ad.description : DEFAULT_AD_DESCRIPTION,
        });

        // Orijinal ilanın kopyasındaki revizyon alanlarını çek (kırmızı vurgu için)
        if (ad.status === "published" || ad.status === "update_pending" || ad.status === "revision_resubmitted") {
          void getPendingCopyForAd(ad.id).then((copy) => {
            if (copy?.revisionFields && Object.keys(copy.revisionFields).length > 0) {
              setPendingRevisionFields(copy.revisionFields);
            } else if (ad.revisionFields) {
              setPendingRevisionFields(ad.revisionFields);
            }
          });
        } else if (ad.revisionFields) {
          setPendingRevisionFields(ad.revisionFields);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "İlan yüklenemedi.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading, router]);

  if (authLoading || !id) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-[#7A8CA5]">Yükleniyor...</div>;
  }
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
      </div>
    );
  }
  if (!source) return null;

  const gallery = [...keptImages, ...previewUrls];
  const normalizedImageIndex = Math.min(selectedImageIndex, Math.max(0, gallery.length - 1));
  const cover = gallery[normalizedImageIndex] ?? source.images[0] ?? "/banner_1.jpg";

  const revisionNoteFor = (field: EditableField) => {
    const map: Record<EditableField, string[]> = {
      title: ["title"],
      brand: ["brand", "name", "company"],
      model: ["model"],
      price: ["price", "salary"],
      city: ["city", "location"],
      district: ["district"],
      category: ["category", "expertise", "workModel", "level"],
      condition: ["condition"],
      trade: ["trade"],
      delivery: ["delivery"],
      userName: ["userName"],
      description: ["description", "requirements", "responsibilities"],
    };
    const notes = map[field]
      .map((key) => revisionFields[key])
      .filter((value): value is string => Boolean(value?.trim()));
    return notes.length > 0 ? notes.join(" | ") : undefined;
  };

  const previewAd: Ad = {
    ...source,
    title: form.title,
    brand: form.brand,
    model: form.model,
    price: Number(form.price) || source.price,
    city: form.city,
    district: form.district,
    category: form.category,
    condition: form.condition,
    trade: form.trade,
    delivery: form.delivery,
    userName: form.userName,
    description: form.description,
    images: gallery.length > 0 ? gallery : source.images,
  };

  const revisionNotesForDetail: Record<string, string> = {
    brand: revisionNoteFor("brand") ?? "",
    model: revisionNoteFor("model") ?? "",
    title: revisionNoteFor("title") ?? "",
    price: revisionNoteFor("price") ?? "",
    city: revisionNoteFor("city") ?? "",
    district: revisionNoteFor("district") ?? "",
    category: revisionNoteFor("category") ?? "",
    condition: revisionNoteFor("condition") ?? "",
    trade: revisionNoteFor("trade") ?? "",
    delivery: revisionNoteFor("delivery") ?? "",
    userName: revisionNoteFor("userName") ?? "",
    description: revisionNoteFor("description") ?? "",
  };

  const openEditModal = (key: EditableField | "images", label: string) => {
    setPendingDeleteImageIndex(null);
    setEditModal({ key, label });
    if (key === "images") {
      setEditDraft("");
      return;
    }
    setEditDraft(form[key]);
  };

  const applyInlineEdit = () => {
    if (!editModal || editModal.key === "images") return;
    setForm((prev) => ({ ...prev, [editModal.key]: editDraft.trim() }));
    setEditModal(null);
    setEditDraft("");
  };

  const askConfirm = (message: string, action: ConfirmAction) => {
    setConfirmState({ open: true, message, action });
  };

  const applyConfirmedAction = () => {
    const action = confirmState.action;
    if (!action) return;
    if (action.type === "removeKeptImage") {
      setKeptImages((s) => s.filter((_, idx) => idx !== action.index));
      setKeptImagePaths((s) => s.filter((_, idx) => idx !== action.index));
      setSelectedImageIndex((curr) => Math.max(0, curr - (curr >= action.index ? 1 : 0)));
    } else {
      const absoluteIndex = keptImages.length + action.index;
      setNewFiles((s) => s.filter((_, idx) => idx !== action.index));
      setSelectedImageIndex((curr) => Math.max(0, curr - (curr >= absoluteIndex ? 1 : 0)));
    }
    setConfirmState({ open: false, message: "", action: null });
  };

  const uploadImagesFromComputer = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setNewFiles((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Revize istenen bir alanın kullanıcı tarafından değiştirilip değiştirilmediğini kontrol eder.
  // fieldKey: form anahtar adı, revisionKeys: o alana karşılık gelen Firestore field adları
  const hasFieldChanged = (
    fieldKey: EditableField,
    revisionKeys: string[],
    formValue: string,
  ): boolean => {
    const hasRevisionNote = revisionKeys.some((k) => revisionFields[k]?.trim());
    if (!hasRevisionNote) return true; // Admin bu alanı reddetmedi, değişmese de sorun yok
    const originalValue = String((source as Record<string, unknown>)[fieldKey] ?? "").trim();
    return formValue.trim() !== originalValue;
  };

  const doSubmit = async () => {
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let uploaded: Awaited<ReturnType<typeof uploadUserImagesWithPaths>> = [];
      if (newFiles.length > 0) {
        uploaded = await uploadUserImagesWithPaths(newFiles, `ad-images/${user?.uid ?? source.ownerId}`);
      }
      const finalImages = [...keptImages, ...uploaded.map((x) => x.url)];
      const finalImagePaths = [...keptImagePaths, ...uploaded.map((x) => x.path)];

      const patch = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        price: Math.round(priceNum),
        city: form.city.trim(),
        district: form.district.trim(),
        category: form.category.trim(),
        condition: form.condition.trim(),
        trade: form.trade.trim(),
        delivery: form.delivery.trim(),
        userName: form.userName.trim(),
        description: form.description.trim(),
        images: finalImages.length > 0 ? finalImages : undefined,
        imagePaths: finalImagePaths.length > 0 ? finalImagePaths : undefined,
      } as Parameters<typeof submitAdUpdateForReview>[1];
      await submitAdUpdateForReview(source.id, patch);
      router.push("/hesap/ilanlarim");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revizyon gönderilemedi.");
    } finally {
      setSaving(false);
      setRevisionWarning({ open: false, unchangedLabels: [] });
    }
  };

  const submit = () => {
    // Eğer revize notları varsa, değiştirilmemiş alanları tespit et
    const hasAnyRevision = Object.keys(revisionFields).length > 0;
    if (hasAnyRevision) {
      const fieldChecks: Array<{ key: EditableField; label: string; revisionKeys: string[] }> = [
        { key: "title", label: "Başlık", revisionKeys: ["title"] },
        { key: "brand", label: "Marka", revisionKeys: ["brand", "name", "company"] },
        { key: "model", label: "Model", revisionKeys: ["model"] },
        { key: "price", label: "Fiyat", revisionKeys: ["price", "salary"] },
        { key: "city", label: "İl", revisionKeys: ["city", "location"] },
        { key: "district", label: "İlçe", revisionKeys: ["district"] },
        { key: "category", label: "Kategori", revisionKeys: ["category"] },
        { key: "condition", label: "Durum", revisionKeys: ["condition"] },
        { key: "trade", label: "Takas", revisionKeys: ["trade"] },
        { key: "delivery", label: "Teslimat", revisionKeys: ["delivery"] },
        { key: "userName", label: "Satıcı adı", revisionKeys: ["userName"] },
        { key: "description", label: "Açıklama", revisionKeys: ["description"] },
      ];

      const unchangedLabels = fieldChecks
        .filter(({ key, revisionKeys }) => !hasFieldChanged(key, revisionKeys, form[key]))
        .map(({ label }) => label);

      if (unchangedLabels.length > 0) {
        setRevisionWarning({ open: true, unchangedLabels });
        return;
      }
    }
    void doSubmit();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#0F2A4A]">İlan düzenle</h1>
        <Link href="/hesap/ilanlarim" className="text-sm font-semibold text-[#0F2A4A] hover:text-[#F26A1B]">
          ← İlanlarıma dön
        </Link>
      </div>

      <AdDetailContent
        ad={previewAd}
        revisionNotes={revisionNotesForDetail}
        moderation={{
          rejectNotes: {},
          onEditField: (field) => {
            const map: Record<string, { key: EditableField | "images"; label: string }> = {
              title: { key: "title", label: "Baslik" },
              brand: { key: "brand", label: "Marka" },
              model: { key: "model", label: "Model" },
              price: { key: "price", label: "Fiyat" },
              city: { key: "city", label: "Il" },
              district: { key: "district", label: "Ilce" },
              category: { key: "category", label: "Kategori" },
              condition: { key: "condition", label: "Durum" },
              trade: { key: "trade", label: "Takas" },
              delivery: { key: "delivery", label: "Teslimat" },
              userName: { key: "userName", label: "Satici" },
              description: { key: "description", label: "Aciklama" },
              images: { key: "images", label: "Gorseller" },
            };
            const target = map[field.key];
            if (!target) return;
            openEditModal(target.key, target.label);
          },
        }}
      />

      <div className="mt-5 flex justify-end gap-2">
        <Link
          href={`/ilan/${source.id}`}
          className="rounded-xl border border-[#d3dcea] px-4 py-2 text-sm font-semibold text-[#0F2A4A]"
        >
          Yayındaki ilanı görüntüle
        </Link>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-xl bg-[#F26A1B] px-4 py-2 text-sm font-bold text-white"
        >
          {saving ? "Gönderiliyor..." : "İncelemeye gönder"}
        </button>
      </div>

      {editModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#0F2A4A]">{editModal.label} düzenle</h3>
            {editModal.key === "images" ? (
              <>
                <p className="mt-1 text-xs text-[#5f6f86]">Gorsele tikla, silme onayi ciksin. Bilgisayardan da yeni gorsel ekle.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {gallery.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setPendingDeleteImageIndex(i)}
                      className="relative overflow-hidden rounded-md border border-[#dbe2ea]"
                    >
                      <img src={img} alt="" className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
                {pendingDeleteImageIndex !== null ? (
                  <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-2 py-2 text-xs text-red-800">
                    <p>Bu gorseli silmek istiyor musun?</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteImageIndex(null)}
                        className="flex-1 rounded-md border border-[#d3dcea] px-2 py-1 font-semibold text-[#0F2A4A]"
                      >
                        Vazgec
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (pendingDeleteImageIndex < keptImages.length) {
                            askConfirm("Bu görseli silmek istediğinize emin misiniz?", {
                              type: "removeKeptImage",
                              index: pendingDeleteImageIndex,
                            });
                          } else {
                            askConfirm("Bu görseli silmek istediğinize emin misiniz?", {
                              type: "removeNewImage",
                              index: pendingDeleteImageIndex - keptImages.length,
                            });
                          }
                          setPendingDeleteImageIndex(null);
                        }}
                        className="flex-1 rounded-md bg-red-600 px-2 py-1 font-bold text-white"
                      >
                        Evet, sil
                      </button>
                    </div>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void uploadImagesFromComputer(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full rounded-lg border border-[#d3dcea] px-3 py-2 text-sm font-semibold text-[#0F2A4A]"
                >
                  Bilgisayardan görsel ekle
                </button>
              </>
            ) : editModal.key === "description" ? (
              <textarea
                className="mt-3 min-h-[120px] w-full rounded-lg border border-[#d3dcea] px-3 py-2 text-sm"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
              />
            ) : (
              <input
                className="mt-3 h-10 w-full rounded-lg border border-[#d3dcea] px-3 text-sm"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
              />
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[#d3dcea] px-4 py-2 text-sm font-semibold text-[#0F2A4A]"
                onClick={() => setEditModal(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#0F2A4A] px-4 py-2 text-sm font-bold text-white"
                onClick={() => {
                  if (editModal.key === "images") {
                    setEditModal(null);
                  } else {
                    applyInlineEdit();
                  }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmState.open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#0F2A4A]">Emin misiniz?</h3>
            <p className="mt-2 text-sm text-[#5f6f86]">{confirmState.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#d3dcea] px-4 py-2 text-sm font-semibold text-[#0F2A4A]"
                onClick={() => setConfirmState({ open: false, message: "", action: null })}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#0F2A4A] px-4 py-2 text-sm font-bold text-white"
                onClick={applyConfirmedAction}
              >
                Evet, devam et
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {revisionWarning.open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2A4A]">Bazı alanlar hâlâ güncellenmedi</h3>
                <p className="mt-1 text-sm text-[#5f6f86]">
                  Admin aşağıdaki alanları revize etmeni istedi, ancak bunlarda henüz bir değişiklik yapılmadı:
                </p>
                <ul className="mt-3 space-y-1">
                  {revisionWarning.unchangedLabels.map((label) => (
                    <li key={label} className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-[#7A8CA5]">
                  Yine de göndermek istiyorsan "Yine de gönder"e tıkla. Admin tekrar inceleyecektir.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[#d3dcea] px-4 py-2 text-sm font-semibold text-[#0F2A4A]"
                onClick={() => setRevisionWarning({ open: false, unchangedLabels: [] })}
              >
                Geri dön, düzelteceğim
              </button>
              <button
                type="button"
                disabled={saving}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                onClick={() => void doSubmit()}
              >
                {saving ? "Gönderiliyor..." : "Yine de gönder"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
