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
    icon: "h-9 w-9",
    text: "text-lg leading-none",
    gap: "gap-1.5",
  },
  md: {
    icon: "h-10 w-10",
    text: "text-base",
    gap: "gap-2",
  },
  lg: {
    icon: "h-11 w-11 sm:h-12 sm:w-12",
    text: "text-xl sm:text-2xl",
    gap: "gap-2.5 sm:gap-3",
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
      className={`${frameClass} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#0F2A4A]/15 shadow-[0_2px_8px_rgba(15,42,74,0.12)]`}
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
      cnc<span className={secondary}>dünyam</span>.com
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
