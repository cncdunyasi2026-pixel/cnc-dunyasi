import Image from "next/image";
import Link from "next/link";

type SiteLogoProps = {
  variant?: "default" | "white";
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const ICON = {
  src: "/android-chrome-512x512.png",
  width: 512,
  height: 512,
} as const;

const SIZE = {
  sm: {
    icon: "h-11 w-11",
    text: "text-xl",
    gap: "gap-2.5",
  },
  md: {
    icon: "h-12 w-12",
    text: "text-lg",
    gap: "gap-3",
  },
  lg: {
    icon: "h-14 w-14 sm:h-16 sm:w-16",
    text: "text-2xl sm:text-3xl",
    gap: "gap-3 sm:gap-3.5",
  },
} as const;

function LogoIcon({
  frameClass,
  priority,
}: {
  frameClass: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`${frameClass} shrink-0 overflow-hidden rounded-full ring-2 ring-[#0F2A4A]/15 shadow-[0_4px_14px_rgba(15,42,74,0.18)]`}
    >
      <Image
        src={ICON.src}
        alt=""
        aria-hidden
        width={ICON.width}
        height={ICON.height}
        className="h-full w-full object-cover"
        priority={priority}
      />
    </span>
  );
}

function LogoWordmark({
  variant,
  textClass,
}: {
  variant: "default" | "white";
  textClass: string;
}) {
  const primary = variant === "white" ? "text-white" : "text-[#0F2A4A]";
  const secondary = "text-[#7A8CA5]";

  return (
    <span className={`font-extrabold tracking-tight ${textClass} ${primary}`}>
      cnc<span className={secondary}>dunyam</span>.com
    </span>
  );
}

export default function SiteLogo({
  variant = "default",
  href = "/",
  className = "",
  size = "md",
  priority = false,
}: SiteLogoProps) {
  const s = SIZE[size];

  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <LogoIcon frameClass={s.icon} priority={priority} />
      <LogoWordmark variant={variant} textClass={s.text} />
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}
