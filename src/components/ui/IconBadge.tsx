type IconBadgeProps = {
  count: number;
  className?: string;
};

export default function IconBadge({ count, className = "" }: IconBadgeProps) {
  if (count <= 0) return null;

  const label = count > 9 ? "9+" : String(count);

  return (
    <span
      className={`pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F26A1B] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white ${className}`}
      aria-hidden
    >
      {label}
    </span>
  );
}
