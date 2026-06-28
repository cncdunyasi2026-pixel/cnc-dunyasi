export type ImageLoadHints = {
  loading: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding: "async";
};

/** Üstte görünen kart görselleri önce, alttakiler lazy. */
export function imageLoadHints(visibleIndex: number, eagerCount = 6): ImageLoadHints {
  if (visibleIndex < eagerCount) {
    return {
      loading: "eager",
      fetchPriority: visibleIndex < 2 ? "high" : "auto",
      decoding: "async",
    };
  }
  return { loading: "lazy", decoding: "async" };
}

/** Veri geldikten sonra ilk birkaç görseli önceden iste. */
export function prefetchListingImages(urls: string[], limit = 4): void {
  if (typeof document === "undefined") return;
  for (const url of urls.slice(0, limit)) {
    if (!url || url.startsWith("/")) continue;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  }
}
