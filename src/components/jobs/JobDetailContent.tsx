"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobListing } from "@/types/job";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ImageLightbox from "@/components/ui/ImageLightbox";
import WatermarkedImage from "@/components/ui/WatermarkedImage";
import { useAuth } from "@/hooks/useAuth";
import { openListingConversation } from "@/lib/messaging/openListingConversation";

type Props = {
  job: JobListing;
  moderation?: {
    rejectNotes: Record<string, string>;
    onRejectField: (field: { key: string; label: string }) => void;
    onEditField: (field: { key: string; label: string; value: string | number | string[] }) => void;
  };
};

const JOB_HERO_FALLBACK = "https://placehold.co/1200x800/0F2A4A/ffffff?text=Is+Ilanı";

export default function JobDetailContent({ job, moderation }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [msgLoading, setMsgLoading] = useState(false);
  const isOwnerView = Boolean(user?.uid && job.ownerId && user.uid === job.ownerId);
  const listingPath = `/kariyer/${job.slug}`;

  const handleMessage = async () => {
    setMsgLoading(true);
    try {
      await openListingConversation(
        {
          user,
          ownerId: job.ownerId,
          ownerName: job.userName ?? job.company,
          listingId: job.id,
          listingTitle: job.title,
          listingPath,
          listingImageUrl: job.images[0],
          loginRedirectPath: listingPath,
        },
        (path) => router.push(path),
      );
    } finally {
      setMsgLoading(false);
    }
  };

  const gallery = useMemo(() => {
    if (job.images.length > 0) {
      return job.images;
    }
    return [JOB_HERO_FALLBACK];
  }, [job.images]);

  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const specs = [
    { key: "title", label: "Pozisyon", value: job.title },
    { key: "company", label: "Firma", value: job.company },
    { key: "location", label: "Lokasyon", value: job.location },
    { key: "workModel", label: "Çalışma Modeli", value: job.workModel },
    { key: "level", label: "Seviye", value: job.level },
    { key: "salary", label: "Maaş", value: job.salary },
    { key: "postedAt", label: "İlan Tarihi", value: job.postedAt },
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const goNext = () => {
    setLightboxIndex((prev) => (prev + 1) % gallery.length);
  };

  const goPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#7A8CA5] sm:text-sm">
        <Link href="/" className="transition hover:text-[#0F2A4A]">
          Anasayfa
        </Link>
        <span>/</span>
        <Link href="/kariyer" className="transition hover:text-[#0F2A4A]">
          Kariyer
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-[#0F2A4A]">{job.title}</span>
      </div>

      <div className="mb-3 xl:hidden">
        <h1 className="text-xl font-extrabold leading-tight text-[#0F2A4A] sm:text-2xl">{job.title}</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr_0.75fr]">
        <article className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-sm">
            <div className="flex items-center justify-end border-b border-[#e8edf3] px-3 py-2">
              <ActionButtons fieldKey="images" label="Görseller" editValue={job.images} moderation={moderation} />
            </div>
            <button
              type="button"
              className="block w-full"
              onClick={() => openLightbox(Math.max(0, gallery.indexOf(selectedImage)))}
            >
              <WatermarkedImage
                src={selectedImage}
                alt={job.title}
                className="block h-[260px] w-full object-cover sm:h-[380px] lg:h-[460px]"
                wrapperClassName="block w-full"
                watermarkSize="md"
              />
            </button>
          </div>

          {gallery.length > 1 ? (
            <div className="rounded-xl border border-[#dbe2ea] bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold tracking-wide text-[#7A8CA5]">FOTOĞRAF GALERİSİ</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-md border transition ${
                      selectedImage === image ? "border-[#0F2A4A] ring-2 ring-[#0F2A4A]/20" : "border-[#dbe2ea]"
                    }`}
                  >
                    <WatermarkedImage
                      src={image}
                      alt={`${job.title} görsel ${index + 1}`}
                      className="h-14 w-full object-cover sm:h-16"
                      wrapperClassName="h-14 w-full sm:h-16"
                      watermarkSize="sm"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="space-y-3 rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-[#e8edf3] pb-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="hidden text-xl font-extrabold leading-tight text-[#0F2A4A] xl:block xl:text-2xl">{job.title}</h1>
              <ActionButtons fieldKey="title" label="Başlık" editValue={job.title} moderation={moderation} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xl font-bold text-[#0F2A4A]">{job.company}</p>
              <ActionButtons fieldKey="company" label="Sirket" editValue={job.company} moderation={moderation} />
            </div>
            <p className="mt-1 text-sm text-[#5f6f86]">{job.location}</p>
          </div>

          <dl className="divide-y divide-[#eef2f6]">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[1fr_auto] gap-3 py-2.5 text-sm">
                <dt className="font-semibold text-[#61748f]">{spec.label}</dt>
                <dd className="flex items-center justify-end gap-2 text-right font-semibold text-[#0F2A4A]">
                  <span>{spec.value}</span>
                  <ActionButtons fieldKey={spec.key} label={spec.label} editValue={spec.value} moderation={moderation} />
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <aside className="space-y-3">
          <div className="rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">BASVURU</p>
            <p className="mt-1 text-lg font-bold text-[#0F2A4A]">{job.company}</p>
            <div className="mt-3 space-y-2">
              {!isOwnerView ? (
                <button
                  type="button"
                  onClick={() => void handleMessage()}
                  disabled={msgLoading || !job.ownerId}
                  className="w-full rounded-lg bg-[#F26A1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d95b14] disabled:opacity-60"
                >
                  {msgLoading ? "Açılıyor..." : "Mesaj Gönder"}
                </button>
              ) : null}
              <FavoriteButton
                kind="job_listings"
                id={job.id}
                slug={job.slug}
                title={job.title}
                image={job.images[0] ?? "/banner_1.jpg"}
                variant="full"
                className="w-full justify-center"
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-4 rounded-xl border border-[#dbe2ea] bg-white p-4 text-sm leading-7 text-[#38506e] shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#0F2A4A] sm:text-lg">Pozisyon Açıklaması</h2>
          <ActionButtons fieldKey="description" label="Açıklama" editValue={job.description} moderation={moderation} />
        </div>
        <p className="mt-2">{job.description}</p>

        <h3 className="mt-4 text-sm font-bold text-[#0F2A4A] sm:text-base">Sorumluluklar</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {job.responsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-4 text-sm font-bold text-[#0F2A4A] sm:text-base">Aranan Nitelikler</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {job.requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <ImageLightbox
        images={gallery}
        alt={job.title}
        isOpen={isLightboxOpen}
        index={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onPrev={goPrev}
        onNext={goNext}
      />
    </section>
  );
}

function ActionButtons({
  fieldKey,
  label,
  editValue,
  moderation,
}: {
  fieldKey: string;
  label: string;
  editValue?: string | number | string[];
  moderation?: Props["moderation"];
}) {
  if (!moderation) return null;
  const hasNote = Boolean(moderation.rejectNotes[fieldKey]?.trim());
  return (
    <span className="inline-flex items-center gap-1">
      {editValue !== undefined ? (
        <button
          type="button"
          onClick={() => moderation.onEditField({ key: fieldKey, label, value: editValue })}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300 text-[11px] font-bold text-cyan-700"
          title={`${label} alanını düzenle`}
          aria-label={`${label} alanını düzenle`}
        >
          ✎
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => moderation.onRejectField({ key: fieldKey, label })}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          hasNote ? "bg-rose-500 text-white" : "border border-[#c7d2e2] text-[#0F2A4A]"
        }`}
        title={`${label} alanını reddet`}
        aria-label={`${label} alanını reddet`}
      >
        ✕
      </button>
    </span>
  );
}
