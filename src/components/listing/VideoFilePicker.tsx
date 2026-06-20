"use client";

import { useEffect, useState } from "react";
import { MAX_VIDEO_DURATION_SEC, MAX_VIDEO_MB, validateVideoFile } from "@/lib/constants/videoUpload";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
};

export default function VideoFilePicker({ value, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleSelect = async (list: FileList | null) => {
    setError(null);
    const file = list?.[0];
    if (!file) return;

    setChecking(true);
    try {
      await validateVideoFile(file);
      onChange(file);
    } catch (err) {
      onChange(null);
      setError(err instanceof Error ? err.message : "Video seçilemedi.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-[#61748f]">
        Video <span className="font-normal text-[#7A8CA5]">(opsiyonel)</span>
      </span>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c8d6e8] bg-[#f8fafc] px-4 py-6 transition hover:border-[#0F2A4A]/40 hover:bg-[#f0f4fa]">
        <span className="text-sm font-semibold text-[#0F2A4A]">
          {checking ? "Video kontrol ediliyor..." : "Video seç veya sürükle"}
        </span>
        <span className="mt-1 text-center text-xs text-[#7A8CA5]">
          MP4, WebM, MOV · en fazla {MAX_VIDEO_DURATION_SEC} sn · max {MAX_VIDEO_MB} MB
        </span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="sr-only"
          disabled={checking}
          onChange={(e) => {
            void handleSelect(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {previewUrl ? (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-[#dbe2ea] bg-black">
          <video src={previewUrl} controls className="max-h-64 w-full object-contain" />
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
            }}
            className="absolute right-2 top-2 rounded-md bg-[#0F2A4A]/85 px-2 py-1 text-[10px] font-bold text-white"
          >
            Kaldır
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}
    </div>
  );
}
