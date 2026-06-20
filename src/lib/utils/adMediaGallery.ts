import type { Ad } from "@/types/ad";

export type AdMediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

export function buildAdMediaGallery(ad: Pick<Ad, "images" | "video">): AdMediaItem[] {
  const images = ad.images?.filter(Boolean) ?? [];
  if (images.length === 0) {
    images.push("/banner_1.jpg");
  }

  const items: AdMediaItem[] = [{ type: "image", src: images[0] }];

  if (ad.video?.trim()) {
    items.push({ type: "video", src: ad.video.trim() });
  }

  for (const src of images.slice(1)) {
    items.push({ type: "image", src });
  }

  return items;
}
