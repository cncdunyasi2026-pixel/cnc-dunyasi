import Image from "next/image";
import Link from "next/link";
import type { Ad } from "@/types/ad";

export default function AdCard({ ad }: { ad: Ad }) {
  return (
    <Link href={`/ilan/${ad.id}`} className="block rounded border bg-white p-3 shadow-sm">
      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded bg-gray-100">
        <Image
          src={ad.images[0] ?? "https://placehold.co/600x400?text=No+Image"}
          alt={ad.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <h2 className="line-clamp-1 text-base font-semibold">{ad.title}</h2>
      <p className="text-sm text-gray-500">
        {ad.city} / {ad.district}
      </p>
      <p className="mt-2 text-lg font-bold">{ad.price.toLocaleString("tr-TR")} TL</p>
    </Link>
  );
}
