"use client";

import { useEffect, useState } from "react";
import { mergeNotificationFeed } from "@/lib/notifications/listingNotifications";
import { subscribeToConversations } from "@/services/messagingService";
import {
  countUnreadNotifications,
  subscribeToNeedsRevisionCount,
  subscribeToNeedsRevisionListings,
  subscribeToNotifications,
} from "@/services/notificationService";

export type AccountBadges = {
  unreadNotifications: number;
  unreadMessages: number;
  listingActions: number;
};

const EMPTY_BADGES: AccountBadges = {
  unreadNotifications: 0,
  unreadMessages: 0,
  listingActions: 0,
};

const DISMISSAL_EVENT = "gd:notifications-dismissed";

export function useAccountBadges(userId: string | undefined): AccountBadges {
  const [badges, setBadges] = useState<AccountBadges>(EMPTY_BADGES);
  const [storedNotifications, setStoredNotifications] = useState<
    import("@/services/notificationService").NotificationItem[]
  >([]);
  const [revisionListings, setRevisionListings] = useState<
    import("@/lib/notifications/listingNotifications").NeedsRevisionListing[]
  >([]);
  const [dismissedVersion, setDismissedVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setBadges(EMPTY_BADGES);
      setStoredNotifications([]);
      setRevisionListings([]);
      return;
    }

    const unsubNotifications = subscribeToNotifications(userId, setStoredNotifications);
    const unsubRevisions = subscribeToNeedsRevisionListings(userId, setRevisionListings);

    const unsubMessages = subscribeToConversations(userId, (conversations) => {
      const unreadMessages = conversations.reduce(
        (sum, conv) => sum + (conv.unread[userId] ?? 0),
        0,
      );
      setBadges((prev) => ({ ...prev, unreadMessages }));
    });

    const unsubListings = subscribeToNeedsRevisionCount(userId, (listingActions) => {
      setBadges((prev) => ({ ...prev, listingActions }));
    });

    const onDismissed = () => setDismissedVersion((v) => v + 1);
    window.addEventListener(DISMISSAL_EVENT, onDismissed);

    return () => {
      unsubNotifications();
      unsubRevisions();
      unsubMessages();
      unsubListings();
      window.removeEventListener(DISMISSAL_EVENT, onDismissed);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void dismissedVersion;
    const merged = mergeNotificationFeed(storedNotifications, revisionListings, userId);
    const unreadNotifications = countUnreadNotifications(merged);
    setBadges((prev) => ({ ...prev, unreadNotifications }));
  }, [storedNotifications, revisionListings, userId, dismissedVersion]);

  return badges;
}
