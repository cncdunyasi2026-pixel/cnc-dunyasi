"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdDetailContent from "@/components/ad/AdDetailContent";
import JobDetailContent from "@/components/jobs/JobDetailContent";
import MarketplaceDetailContent from "@/components/marketplace/MarketplaceDetailContent";
import { db } from "@/lib/firebase";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { uploadUserImagesWithPaths } from "@/services/storageUpload";

type ListingCollection = "ads" | "technical_service_listings" | "spare_part_listings" | "job_listings";

type Props = {
  adminCode: string;
  collectionName: ListingCollection;
  listingId: string;
};

type FieldDef = { key: string; label: string };
type EditableField = FieldDef & { value: string | number | string[] };

export default function ModerationDetailScreen({ adminCode, collectionName, listingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [rejectModal, setRejectModal] = useState<{ key: string; label: string } | null>(null);
  const [rejectDraft, setRejectDraft] = useState("");
  const [editModal, setEditModal] = useState<EditableField | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [imageEditUrls, setImageEditUrls] = useState<string[]>([]);
  const [imageEditPaths, setImageEditPaths] = useState<string[]>([]);
  const [pendingDeleteImageIndex, setPendingDeleteImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getDoc(doc(db, collectionName, listingId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setError("Ilan bulunamadi.");
          setData(null);
          return;
        }
        const raw = snap.data() as Record<string, unknown>;
        setData(raw);
        const existing = raw.revisionFields;
        if (existing && typeof existing === "object") {
          setRejectNotes(existing as Record<string, string>);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Detay yuklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [collectionName, listingId]);

  const listPathByCollection: Record<ListingCollection, string> = {
    ads: "/ilanlar",
    technical_service_listings: "/kategori/teknik-servis",
    spare_part_listings: "/kategori/yedek-parca",
    job_listings: "/kariyer",
  };
  const mappedAd = useMemo(() => {
    if (!data || collectionName !== "ads") return null;
    return mapAdSnapshotToAd(listingId, data);
  }, [data, collectionName, listingId]);

  const changedFields = useMemo((): string[] => {
    if (!data) return [];
    const raw = data.changedFields;
    if (!Array.isArray(raw)) return [];
    return raw.filter((v): v is string => typeof v === "string");
  }, [data]);

  // Kullanıcı revize sonrası gönderdi ama hiçbir şeyi değiştirmemiş mi?
  const noChangesAfterRevision = useMemo(() => {
    if (!data) return false;
    const status = data.status as string;
    if (status !== "revision_resubmitted") return false;
    return changedFields.length === 0;
  }, [data, changedFields]);

  // Reddedilen alanlar var ama bunlar changedFields'ta yer almıyor mu?
  const unresolvedRevisionFields = useMemo(() => {
    if (!data) return [];
    const rejected = data.revisionFields;
    if (!rejected || typeof rejected !== "object" || changedFields.length === 0) return [];
    return Object.keys(rejected as Record<string, unknown>).filter(
      (k) => !changedFields.includes(k),
    );
  }, [data, changedFields]);
  const mappedMarketplace = useMemo(() => {
    if (!data || (collectionName !== "technical_service_listings" && collectionName !== "spare_part_listings")) {
      return null;
    }
    return mapMarketplaceDocToProfile(listingId, data);
  }, [data, collectionName, listingId]);
  const mappedJob = useMemo(() => {
    if (!data || collectionName !== "job_listings") return null;
    return mapJobListingFromFirestore(listingId, data);
  }, [data, collectionName, listingId]);
  const hasRejects = useMemo(
    () => Object.values(rejectNotes).some((v) => v.trim().length > 0),
    [rejectNotes],
  );

  const writeAudit = async (action: string, detail: string) => {
    await addDoc(collection(db, "audit_logs"), {
      listingType: collectionName,
      listingId,
      action,
      detail,
      createdAt: serverTimestamp(),
    });
  };

  const approve = async () => {
    setSaving(true);
    try {
      const sourceListingId = typeof data?.sourceListingId === "string" ? data.sourceListingId : null;

      // Kopyayı yayınla
      await updateDoc(doc(db, collectionName, listingId), {
        status: "published",
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        revisionNote: "",
        revisionFields: {},
      });

      // Eğer bu bir güncelleme kopyasıysa (update_pending / revision_resubmitted),
      // orijinal ilanı arşivle — aksi hâlde sitede iki ayrı yayın görünür.
      if (sourceListingId) {
        await updateDoc(doc(db, collectionName, sourceListingId), {
          status: "archived",
          removalReason: "Güncel versiyonu yayınlandı",
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await writeAudit(
          "archive_original_on_approve",
          `Güncelleme onaylandı; orijinal ilan arşivlendi (${sourceListingId})`,
        );
      }

      await writeAudit("approve_listing", "Alan bazli red notu olmadan yayina alindi");
      router.push(`/${adminCode}/admin/moderasyon`);
    } finally {
      setSaving(false);
    }
  };

  const requestRevision = async () => {
    if (!hasRejects) {
      setError("Revizyon icin en az bir alan aciklamasi girmelisin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(rejectNotes).filter(([, v]) => v.trim().length > 0),
      );
      const summary = Object.entries(cleaned)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      await updateDoc(doc(db, collectionName, listingId), {
        status: "needs_revision",
        revisionNote: summary,
        revisionFields: cleaned,
        updatedAt: serverTimestamp(),
      });
      await writeAudit("needs_revision", summary);
      router.push(`/${adminCode}/admin/moderasyon`);
    } finally {
      setSaving(false);
    }
  };

  const openRejectModal = (field: FieldDef) => {
    setRejectModal({ key: field.key, label: field.label });
    setRejectDraft(rejectNotes[field.key] ?? "");
  };

  const applyRejectNote = () => {
    if (!rejectModal) return;
    setRejectNotes((prev) => ({ ...prev, [rejectModal.key]: rejectDraft.trim() }));
    setRejectModal(null);
    setRejectDraft("");
  };

  const openEditModal = (field: EditableField) => {
    setEditModal(field);
    if (field.key === "images") {
      const currentUrls = Array.isArray(field.value) ? field.value.map((v) => String(v)) : [];
      const currentPaths = Array.isArray(data?.imagePaths)
        ? (data?.imagePaths as unknown[]).map((v) => String(v))
        : [];
      setImageEditUrls(currentUrls);
      setImageEditPaths(currentPaths);
      setEditDraft("");
      return;
    }
    setEditDraft(Array.isArray(field.value) ? field.value.join("\n") : String(field.value ?? ""));
  };

  const applyFieldEdit = async () => {
    if (!editModal) return;
    let nextValue: string | number | string[];
    if (editModal.key === "images") {
      nextValue = imageEditUrls;
    } else {
      const nextRaw = editDraft.trim();
      if (Array.isArray(editModal.value)) {
        nextValue = nextRaw
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      } else if (typeof editModal.value === "number") {
        nextValue = Number(nextRaw || "0");
      } else {
        nextValue = nextRaw;
      }
      if (typeof nextValue === "number" && Number.isNaN(nextValue)) {
        setError("Sayisal alan icin gecerli bir deger gir.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      if (editModal.key === "images") {
        await updateDoc(doc(db, collectionName, listingId), {
          images: imageEditUrls,
          imagePaths: imageEditPaths,
          updatedAt: serverTimestamp(),
        });
        setData((prev) =>
          prev
            ? {
                ...prev,
                images: imageEditUrls,
                imagePaths: imageEditPaths,
              }
            : prev,
        );
        await writeAudit("edit_field", `images: ${imageEditUrls.length} adet`);
      } else {
        await updateDoc(doc(db, collectionName, listingId), {
          [editModal.key]: nextValue,
          updatedAt: serverTimestamp(),
        });
        setData((prev) => (prev ? { ...prev, [editModal.key]: nextValue } : prev));
        await writeAudit("edit_field", `${editModal.key}: ${String(nextValue)}`);
      }
      setEditModal(null);
      setEditDraft("");
      setImageEditUrls([]);
      setImageEditPaths([]);
    } finally {
      setSaving(false);
    }
  };

  const removeImageAt = (index: number) => {
    setImageEditUrls((prev) => prev.filter((_, i) => i !== index));
    setImageEditPaths((prev) => prev.filter((_, i) => i !== index));
    setPendingDeleteImageIndex(null);
  };

  const uploadImagesFromComputer = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const ownerId = typeof data?.ownerId === "string" ? data.ownerId : "admin";
    setSaving(true);
    setError(null);
    try {
      const uploaded = await uploadUserImagesWithPaths(Array.from(files), `ad-images/${ownerId}`);
      setImageEditUrls((prev) => [...prev, ...uploaded.map((i) => i.url)]);
      setImageEditPaths((prev) => [...prev, ...uploaded.map((i) => i.path)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gorsel yukleme basarisiz.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const moderationProps = {
    rejectNotes,
    onRejectField: openRejectModal,
    onEditField: openEditModal,
  };

  return (
    <AdminAuthGate adminCode={adminCode}>
      <div className="bg-[#0a1222] pb-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pt-4">
          <Link href={`/${adminCode}/admin/moderasyon`} className="text-sm font-semibold text-blue-100 hover:underline">
            ← Moderasyon listesine don
          </Link>
          <span className="text-xs text-blue-100/70">
            {collectionName} / {listingId}
          </span>
        </div>

        {error ? (
          <div className="mx-auto mt-3 w-full max-w-7xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        {noChangesAfterRevision ? (
          <div className="mx-auto mt-3 w-full max-w-7xl rounded-xl border border-orange-400/30 bg-orange-950/40 px-4 py-3">
            <p className="text-sm font-bold text-orange-300">⚠️ Kullanıcı hiçbir alan değiştirmeden yeniden gönderdi</p>
            <p className="mt-0.5 text-xs text-orange-200/70">
              Bu ilan revize sonrası gönderildi ancak herhangi bir değişiklik tespit edilmedi.
            </p>
          </div>
        ) : unresolvedRevisionFields.length > 0 ? (
          <div className="mx-auto mt-3 w-full max-w-7xl rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3">
            <p className="text-sm font-bold text-amber-300">⚠️ Bazı revize istenen alanlar hâlâ güncellenmedi</p>
            <p className="mt-1 text-xs text-amber-200/70">
              Değiştirilmeyen alanlar:{" "}
              <span className="font-semibold text-amber-200">{unresolvedRevisionFields.join(", ")}</span>
            </p>
          </div>
        ) : null}
        {loading ? (
          <div className="mx-auto mt-3 w-full max-w-7xl rounded-xl border border-[#dbe2ea] bg-white px-4 py-3 text-sm text-[#61748f]">
            Yukleniyor...
          </div>
        ) : null}

        <div className="relative">
          {mappedAd ? (
            <AdDetailContent
              ad={mappedAd}
              moderation={moderationProps}
              changedFields={changedFields.length > 0 ? changedFields : undefined}
            />
          ) : null}
          {mappedMarketplace ? (
            <MarketplaceDetailContent
              item={mappedMarketplace}
              listPath={listPathByCollection[collectionName]}
              moderation={moderationProps}
            />
          ) : null}
          {mappedJob ? <JobDetailContent job={mappedJob} moderation={moderationProps} /> : null}
        </div>

        {data ? (
          <div className="mx-auto mt-4 w-full max-w-7xl px-4 space-y-3">
            {/* Orphan kopya uyarısı: sourceListingId olan ama published olan listing */}
            {typeof data.sourceListingId === "string" && data.status === "published" ? (
              <div className="rounded-xl border border-red-400/40 bg-red-900/30 p-3">
                <p className="text-sm font-bold text-red-300">
                  ⚠️ Bu ilan bir güncelleme kopyası — orijinali arşivlendi ama bu kopya hâlâ yayında.
                </p>
                <p className="mt-1 text-xs text-red-200/70">
                  Orijinal ilan ID: <span className="font-mono">{data.sourceListingId as string}</span>
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await updateDoc(doc(db, collectionName, listingId), {
                        status: "archived",
                        removalReason: "Admin tarafından temizlendi (orphan kopya)",
                        deletedAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                      });
                      await writeAudit("admin_archive", "Orphan yayın kopyası arşivlendi");
                      router.push(`/${adminCode}/admin/moderasyon`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="mt-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  Bu Kopyayı Arşivle
                </button>
              </div>
            ) : null}

            {/* Moderasyon butonları — sadece inceleme gerektiren statüsler için */}
            {(data.status === "pending" ||
              data.status === "update_pending" ||
              data.status === "needs_revision" ||
              data.status === "revision_resubmitted") ? (
              <div className="rounded-xl border border-white/10 bg-[#101d39] p-3">
                <p className="text-xs text-blue-100/80">Reddetmek istedigin alanin yanindaki ✕ butonunu kullan.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void requestRevision()}
                    className="flex-1 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-60"
                  >
                    Revizyona Gonder
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void approve()}
                    className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-black disabled:opacity-60"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {rejectModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101d39] p-4">
              <h4 className="text-sm font-extrabold text-white">{rejectModal.label} alanini reddet</h4>
              <p className="mt-1 text-xs text-blue-100/70">Reddetme nedenini yaz. Bos birakirsan bu alan icin red notu silinir.</p>
              <textarea
                value={rejectDraft}
                onChange={(e) => setRejectDraft(e.target.value)}
                placeholder="Reddetme nedeni"
                className="mt-3 h-28 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none placeholder:text-blue-100/50"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white"
                >
                  Vazgec
                </button>
                <button
                  type="button"
                  onClick={applyRejectNote}
                  className="flex-1 rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {editModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101d39] p-4">
              <h4 className="text-sm font-extrabold text-white">{editModal.label} alanini duzenle</h4>
              {editModal.key === "images" ? (
                <>
                  <p className="mt-1 text-xs text-blue-100/70">
                    Gorsele tiklayarak sil. Bilgisayardan yeni gorsel eklemek icin asagidaki butonu kullan.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imageEditUrls.map((url, idx) => (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => setPendingDeleteImageIndex(idx)}
                        className="group relative overflow-hidden rounded-lg border border-white/15"
                        title="Tiklayarak sil"
                      >
                        <img src={url} alt={`Gorsel ${idx + 1}`} className="h-20 w-full object-cover" />
                        <span className="absolute inset-0 hidden items-center justify-center bg-black/55 text-xs font-bold text-white group-hover:flex">
                          Sil
                        </span>
                      </button>
                    ))}
                  </div>
                  {pendingDeleteImageIndex !== null ? (
                    <div className="mt-2 rounded-lg border border-rose-300/40 bg-rose-500/10 p-2">
                      <p className="text-[11px] text-rose-100">Bu gorseli silmek istiyor musun?</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteImageIndex(null)}
                          className="flex-1 rounded-md border border-white/20 px-2 py-1 text-[11px] font-bold text-white"
                        >
                          Vazgec
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImageAt(pendingDeleteImageIndex)}
                          className="flex-1 rounded-md bg-rose-500 px-2 py-1 text-[11px] font-bold text-white"
                        >
                          Evet, sil
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => void uploadImagesFromComputer(e.target.files)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-lg border border-cyan-300 bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-100 disabled:opacity-60"
                    >
                      Bilgisayardan gorsel ekle
                    </button>
                  </div>
                </>
              ) : editDraft.length > 80 ? (
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="mt-3 h-28 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none placeholder:text-blue-100/50"
                />
              ) : (
                <input
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="mt-3 h-10 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none placeholder:text-blue-100/50"
                />
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white"
                >
                  Vazgec
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void applyFieldEdit()}
                  className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-60"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminAuthGate>
  );
}
