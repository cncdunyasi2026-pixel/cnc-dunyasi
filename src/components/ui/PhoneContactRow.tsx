"use client";

import { useState } from "react";

function normalizePhoneForTel(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return digits;
}

function isMobileCallDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

type Props = {
  phone: string;
  align?: "center" | "end";
  numberClassName?: string;
};

export default function PhoneContactRow({
  phone,
  align = "center",
  numberClassName = "text-lg font-extrabold text-[#0F2A4A]",
}: Props) {
  const [copied, setCopied] = useState(false);
  const mobile = isMobileCallDevice();

  const handleAction = async () => {
    const tel = normalizePhoneForTel(phone);
    if (mobile && tel) {
      window.location.href = `tel:${tel}`;
      return;
    }
    try {
      await navigator.clipboard.writeText(phone.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div
      className={`flex items-center gap-2 ${align === "end" ? "justify-end" : "justify-center"}`}
    >
      <button
        type="button"
        onClick={() => void handleAction()}
        className={`${numberClassName} transition hover:text-[#F26A1B]`}
        title={mobile ? "Ara" : "Numarayı kopyala"}
      >
        {phone}
      </button>
      <button
        type="button"
        onClick={() => void handleAction()}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d3dcea] bg-white text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:bg-[#f4f7fb]"
        aria-label={mobile ? "Telefonu ara" : "Numarayı kopyala"}
        title={copied ? "Kopyalandı" : mobile ? "Ara" : "Kopyala"}
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        )}
      </button>
      {copied ? (
        <span className="text-[10px] font-semibold text-emerald-700">Kopyalandı</span>
      ) : null}
    </div>
  );
}
