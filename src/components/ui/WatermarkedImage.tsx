type WatermarkSize = "sm" | "md" | "lg";

type WatermarkedImageProps = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  watermarkSize?: WatermarkSize;
};

const WATERMARK_TEXT = "cncdunyam.com";

const WATERMARK_CONFIG: Record<
  WatermarkSize,
  { count: number; textClass: string; gapClass: string; opacityClass: string }
> = {
  sm: {
    count: 10,
    textClass: "text-[9px] sm:text-[10px]",
    gapClass: "gap-x-5 gap-y-3",
    opacityClass: "opacity-[0.34]",
  },
  md: {
    count: 16,
    textClass: "text-xs sm:text-sm",
    gapClass: "gap-x-8 gap-y-5",
    opacityClass: "opacity-[0.32]",
  },
  lg: {
    count: 24,
    textClass: "text-base sm:text-xl",
    gapClass: "gap-x-12 gap-y-8",
    opacityClass: "opacity-[0.3]",
  },
};

function WatermarkOverlay({ size = "md" }: { size?: WatermarkSize }) {
  const config = WATERMARK_CONFIG[size];

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${config.opacityClass}`}
    >
      <div
        className={`absolute left-1/2 top-1/2 flex w-[220%] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] flex-wrap content-center justify-center ${config.gapClass}`}
      >
        {Array.from({ length: config.count }).map((_, index) => (
          <span
            key={index}
            className={`whitespace-nowrap font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] ${config.textClass}`}
          >
            {WATERMARK_TEXT}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WatermarkedImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  watermarkSize = "md",
}: WatermarkedImageProps) {
  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={className} draggable={false} />
      <WatermarkOverlay size={watermarkSize} />
    </div>
  );
}

export function WatermarkOverlayLayer({ size = "lg" }: { size?: WatermarkSize }) {
  return <WatermarkOverlay size={size} />;
}
