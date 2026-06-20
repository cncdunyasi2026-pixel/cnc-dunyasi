"use client";

import { useState } from "react";

export type FilterOption = {
  label: string;
  count?: number;
};

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  /** İlk açılışta kapalı başlasın mı? */
  defaultCollapsed?: boolean;
  /** Bu grup dışarıdan kontrol edilmeyecekse (sadece görsel/mock) */
  readOnly?: boolean;
};

export type RangeFilter = {
  id: string;
  label: string;
  min: number;
  max: number;
  unit: string;
  /** "auto" → K/M kısaltması, "number" → tam sayı (varsayılan: "auto") */
  formatPreset?: "auto" | "number";
};

type Props = {
  groups: FilterGroup[];
  ranges?: RangeFilter[];
  className?: string;
  /** Kontrollü mod: hangi değerlerin seçili olduğu (groupId → string[]) */
  activeGroupValues?: Record<string, string[]>;
  onGroupToggle?: (groupId: string, label: string) => void;
  /** Kontrollü mod: aralık değerleri (rangeId → {min, max}) */
  rangeValues?: Record<string, { min: number; max: number }>;
  onRangeChange?: (rangeId: string, min: number, max: number) => void;
  onClear?: () => void;
  /** Sidebar'ın en altına eklenen içerik (örn. Filtrele butonu) */
  footer?: React.ReactNode;
};

/* ── Tek grup bileşeni ──────────────────────────────────────── */

function FilterGroupBlock({
  group,
  activeValues,
  onToggle,
}: {
  group: FilterGroup;
  activeValues?: string[];
  onToggle?: (label: string) => void;
}) {
  const [open, setOpen] = useState(!group.defaultCollapsed);
  const [internalChecked, setInternalChecked] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? group.options : group.options.slice(0, 6);
  const hasMore = group.options.length > 6;

  const isChecked = (label: string) =>
    group.readOnly || !activeValues
      ? !!internalChecked[label]
      : activeValues.includes(label);

  const handleToggle = (label: string) => {
    if (group.readOnly || !onToggle) {
      setInternalChecked((prev) => ({ ...prev, [label]: !prev[label] }));
    } else {
      onToggle(label);
    }
  };

  return (
    <div className="border-b border-[#e8edf3] pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-sm font-bold text-[#0F2A4A]">{group.label}</span>
        <svg
          className={`h-4 w-4 text-[#7A8CA5] transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {visible.map((opt) => {
            const id = `${group.id}-${opt.label}`;
            return (
              <label
                key={opt.label}
                htmlFor={id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-0.5 hover:bg-[#f4f7fb]"
              >
                <div className="flex items-center gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    checked={isChecked(opt.label)}
                    onChange={() => handleToggle(opt.label)}
                    className="h-4 w-4 rounded border-[#c8d3e2] accent-[#0F2A4A]"
                  />
                  <span className="text-sm text-[#38506e]">{opt.label}</span>
                </div>
                {opt.count != null && (
                  <span className="text-xs font-semibold text-[#7A8CA5]">{opt.count}</span>
                )}
              </label>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-1 text-xs font-semibold text-[#F26A1B] hover:underline"
            >
              {showAll ? "Daha az göster" : `+${group.options.length - 6} daha göster`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Aralık filtresi ────────────────────────────────────────── */

function RangeBlock({
  range,
  value,
  onChange,
}: {
  range: RangeFilter;
  value?: { min: number; max: number };
  onChange?: (min: number, max: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [internalMin, setInternalMin] = useState(range.min);
  const [internalMax, setInternalMax] = useState(range.max);

  const minVal = value?.min ?? internalMin;
  const maxVal = value?.max ?? internalMax;

  const setMin = (v: number) => {
    if (onChange) onChange(v, maxVal);
    else setInternalMin(v);
  };
  const setMax = (v: number) => {
    if (onChange) onChange(minVal, v);
    else setInternalMax(v);
  };

  const fmt = (v: number): string => {
    if (range.formatPreset === "number") return v.toLocaleString("tr-TR");
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  return (
    <div className="border-b border-[#e8edf3] pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-sm font-bold text-[#0F2A4A]">{range.label}</span>
        <svg
          className={`h-4 w-4 text-[#7A8CA5] transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-1 text-xs font-semibold text-[#0F2A4A]">
            <span>{fmt(minVal)} {range.unit}</span>
            <span>{fmt(maxVal)} {range.unit}</span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={Math.round((range.max - range.min) / 100)}
              value={minVal}
              onChange={(e) => setMin(Math.min(Number(e.target.value), maxVal - 1))}
              className="w-full accent-[#0F2A4A]"
            />
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={Math.round((range.max - range.min) / 100)}
              value={maxVal}
              onChange={(e) => setMax(Math.max(Number(e.target.value), minVal + 1))}
              className="w-full accent-[#0F2A4A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={minVal}
              onChange={(e) => setMin(Math.min(Number(e.target.value), maxVal - 1))}
              className="h-9 w-full rounded-lg border border-[#d3dcea] px-2 text-xs text-[#0F2A4A] outline-none focus:border-[#0F2A4A]"
              placeholder="Min"
            />
            <input
              type="number"
              value={maxVal}
              onChange={(e) => setMax(Math.max(Number(e.target.value), minVal + 1))}
              className="h-9 w-full rounded-lg border border-[#d3dcea] px-2 text-xs text-[#0F2A4A] outline-none focus:border-[#0F2A4A]"
              placeholder="Max"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Ana bileşen ────────────────────────────────────────────── */

export default function FilterSidebar({
  groups,
  ranges,
  className = "",
  activeGroupValues,
  onGroupToggle,
  rangeValues,
  onRangeChange,
  onClear,
  footer,
}: Props) {
  const hasActive =
    Object.values(activeGroupValues ?? {}).some((v) => v.length > 0) ||
    Object.keys(rangeValues ?? {}).length > 0;

  return (
    <aside
      className={`w-full rounded-2xl border border-[#dbe2ea] bg-white p-4 shadow-sm lg:sticky lg:top-4 ${className}`}
    >
      {/* Başlık */}
      <div className="mb-4 flex items-center justify-between border-b border-[#e8edf3] pb-3">
        <h2 className="text-sm font-extrabold text-[#0F2A4A]">Filtreler</h2>
        {hasActive && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#F26A1B] hover:underline"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Aralık filtreleri */}
        {ranges?.map((r) => (
          <RangeBlock
            key={r.id}
            range={r}
            value={rangeValues?.[r.id]}
            onChange={onRangeChange ? (mn, mx) => onRangeChange(r.id, mn, mx) : undefined}
          />
        ))}

        {/* Checkbox grupları */}
        {groups.map((g) => (
          <FilterGroupBlock
            key={g.id}
            group={g}
            activeValues={activeGroupValues?.[g.id]}
            onToggle={onGroupToggle ? (label) => onGroupToggle(g.id, label) : undefined}
          />
        ))}
      </div>

      {/* Alt alan (Filtrele butonu vb.) */}
      {footer && <div className="mt-4 border-t border-[#e8edf3] pt-4">{footer}</div>}
    </aside>
  );
}
