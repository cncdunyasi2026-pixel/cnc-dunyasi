"use client";

import { useEffect, useState } from "react";

type ImageFilePickerProps = {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  label?: string;
};

export default function ImageFilePicker({
  value,
  onChange,
  maxFiles = 6,
  label = "Görseller",
}: ImageFilePickerProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const merged = [...value, ...incoming].slice(0, maxFiles);
    onChange(merged);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-[#61748f]">{label}</span>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c8d6e8] bg-[#f8fafc] px-4 py-8 transition hover:border-[#0F2A4A]/40 hover:bg-[#f0f4fa]">
        <span className="text-sm font-semibold text-[#0F2A4A]">Dosya seç veya sürükle</span>
        <span className="mt-1 text-xs text-[#7A8CA5]">PNG, JPG · en fazla {maxFiles} görsel · dosya başına max 5 MB</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {previewUrls.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previewUrls.map((url, index) => (
            <li key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-[#dbe2ea] bg-[#f4f6f9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 rounded-md bg-[#0F2A4A]/85 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
