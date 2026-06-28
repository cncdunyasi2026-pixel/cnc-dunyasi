"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mergeNotificationFeed } from "@/lib/notifications/listingNotifications";
import { getDismissedNotificationIds } from "@/lib/notifications/notificationDismissal";
import {
  countUnreadNotifications,
  subscribeToNeedsRevisionListings,
  subscribeToNotifications,
  type NotificationItem,
} from "@/services/notificationService";

export function useNotificationFeed(userId: string | undefined) {
  const [stored, setStored] = useState<NotificationItem[]>([]);
  const [revisionListings, setRevisionListings] = useState<
    import("@/lib/notifications/listingNotifications").NeedsRevisionListing[]
  >([]);
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDismissed = useCallback(() => {
    setDismissedVersion((v) => v + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gd:notifications-dismissed"));
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setStored([]);
      setRevisionListings([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubNotifications = subscribeToNotifications(
      userId,
      (items) => {
        setStored(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Bildirimler yüklenemedi.");
        setLoading(false);
      },
    );

    const unsubRevisions = subscribeToNeedsRevisionListings(userId, setRevisionListings);

    return () => {
      unsubNotifications();
      unsubRevisions();
    };
  }, [userId]);

  const items = useMemo(() => {
    void dismissedVersion;
    return mergeNotificationFeed(stored, revisionListings, userId);
  }, [stored, revisionListings, userId, dismissedVersion]);

  const unreadCount = useMemo(() => countUnreadNotifications(items), [items]);

  return { items, unreadCount, loading, error, refreshDismissed };
}

export function getDismissedIdsForUser(userId: string): Set<string> {
  return getDismissedNotificationIds(userId);
}
