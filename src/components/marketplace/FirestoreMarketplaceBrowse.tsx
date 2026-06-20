"use client";

import MarketplaceBrowsePanel from "@/components/marketplace/MarketplaceBrowsePanel";
import { useMarketplaceBrowse } from "@/hooks/useMarketplaceBrowse";

type Props = {
  variant: "technical" | "spare";
  basePath: string;
  searchPlaceholder: string;
  singleImage?: boolean;
};

export default function FirestoreMarketplaceBrowse({ variant, basePath, searchPlaceholder, singleImage }: Props) {
  const { items, loading, loadingMore, hasMore, loadMore, error } = useMarketplaceBrowse(variant);

  if (loading) {
    return (
      <p className="rounded-xl border border-[#dbe2ea] bg-white px-4 py-6 text-center text-sm font-semibold text-[#7A8CA5]">
        İlanlar yükleniyor...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
    );
  }

  return (
    <>
      <MarketplaceBrowsePanel
        items={items}
        basePath={basePath}
        searchPlaceholder={searchPlaceholder}
        singleImage={singleImage}
      />
      {hasMore && (
        <LoadMoreButton
          count={items.length}
          loading={loadingMore}
          onClick={loadMore}
        />
      )}
    </>
  );
}

function LoadMoreButton({
  count,
  loading,
  onClick,
}: {
  count: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={loading}
        className="rounded-xl border border-[#0F2A4A] bg-white px-6 py-3 text-sm font-bold text-[#0F2A4A] transition hover:bg-[#0F2A4A] hover:text-white disabled:opacity-60"
      >
        {loading ? "Yükleniyor..." : "Daha fazla ilan göster"}
      </button>
      <p className="text-xs text-[#7A8CA5]">{count} ilan yüklendi · sayfa başına 24 kayıt</p>
    </div>
  );
}
