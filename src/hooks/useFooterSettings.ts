"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FOOTER_SETTINGS } from "@/lib/constants/footerDefaults";
import { getFooterSettings } from "@/services/footerService";
import type { FooterSettings } from "@/types/footer";

export function useFooterSettings() {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getFooterSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
