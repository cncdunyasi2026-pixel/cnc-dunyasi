import Link from "next/link";
import { imageLoadHints } from "@/lib/utils/imageLoading";
import type { JobListing } from "@/types/job";

type Props = {
  item: JobListing;
  viewMode: "card" | "list";
  imageIndex?: number;
};

export default function JobCard({ item, viewMode, imageIndex = 99 }: Props) {
  const mainHints = imageLoadHints(imageIndex);

  return (
    <Link
      href={`/kariyer/${item.slug}`}
      className={`overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white shadow-sm transition hover:shadow-md ${
        viewMode === "list" ? "flex gap-2 p-2 sm:gap-3 sm:p-3" : "mx-auto block w-full max-w-[282px] p-2"
      }`}
    >
      <div className={viewMode === "list" ? "w-28 shrink-0 sm:w-36 md:w-48" : "space-y-2"}>
        <img
          src={item.images[0]}
          alt={item.title}
          className={`w-full rounded-[8px] bg-[#f4f6f9] ${viewMode === "list" ? "h-20 object-cover sm:h-24 md:h-32" : "h-28 object-cover sm:h-36 md:h-44"}`}
          {...mainHints}
        />
      </div>

      <div className={viewMode === "list" ? "flex min-w-0 flex-1 flex-col justify-between" : "pt-2"}>
        <div>
          <h3 className="line-clamp-2 text-base font-black leading-tight text-[#0F2A4A]">{item.title}</h3>
          <p className="mt-1 text-xs font-semibold text-[#1f334e] sm:text-sm">{item.company}</p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#7A8CA5] sm:gap-2 sm:text-xs">
            <span className="rounded-full bg-[#edf1f6] px-2 py-1">{item.location}</span>
            <span className="rounded-full bg-[#edf1f6] px-2 py-1">{item.workModel}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-xs font-extrabold text-[#0F2A4A] sm:text-sm">{item.salary}</p>
          <span className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
            İNCELE
          </span>
        </div>
      </div>
    </Link>
  );
}
