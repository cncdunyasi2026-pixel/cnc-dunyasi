"use client";

import AdCard from "@/components/ad/AdCard";
import { useAds } from "@/hooks/useAds";

type AdListProps = {
  city?: string;
  category?: string;
};

export default function AdList({ city, category }: AdListProps) {
  const { ads, loading, loadingMore, hasMore, loadMore } = useAds({ city, category });

  if (loading) {
    return <p>İlanlar yükleniyor...</p>;
  }

  if (ads.length === 0) {
    return <p>Gösterilecek ilan bulunamadı.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="button"
          >
            {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
