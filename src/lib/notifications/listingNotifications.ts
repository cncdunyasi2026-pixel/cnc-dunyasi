import type { NotificationItem } from "@/services/notificationService";
import {
  listingEditHref,
  listingLabel,
  type ListingCollection,
} from "@/lib/notifications/listingNotify";
import { getDismissedNotificationIds } from "@/lib/notifications/notificationDismissal";

export const VIRTUAL_NOTIFICATION_PREFIX = "virtual:";

export type NeedsRevisionListing = {
  collection: ListingCollection;
  id: string;
  title: string;
  updatedAt: number;
};

export function isVirtualNotificationId(id: string): boolean {
  return id.startsWith(VIRTUAL_NOTIFICATION_PREFIX);
}

export function buildNeedsRevisionNotifications(
  listings: NeedsRevisionListing[],
): NotificationItem[] {
  return listings.map((listing) => ({
    id: `${VIRTUAL_NOTIFICATION_PREFIX}needs_revision:${listing.collection}:${listing.id}`,
    type: "moderation",
    action: "listing_needs_revision",
    title: "İlanınız revizyona gönderildi",
    body: `${listingLabel(listing.collection)} "${listing.title}" için düzenleme istendi.`,
    href: listingEditHref(listing.collection, listing.id),
    read: false,
    createdAt: listing.updatedAt || Date.now(),
    listingId: listing.id,
  }));
}

function revisionListingIdsFromStored(stored: NotificationItem[]): Set<string> {
  const ids = new Set<string>();
  for (const item of stored) {
    if (item.listingId && item.action === "listing_needs_revision") {
      ids.add(item.listingId);
    }
    if (item.eventKey?.includes("needs_revision")) {
      const parts = item.eventKey.split(":");
      const listingId = parts[2];
      if (listingId) ids.add(listingId);
    }
  }
  return ids;
}

export function mergeNotificationFeed(
  stored: NotificationItem[],
  revisionListings: NeedsRevisionListing[],
  userId?: string,
): NotificationItem[] {
  const covered = revisionListingIdsFromStored(stored);
  const dismissed = userId ? getDismissedNotificationIds(userId) : new Set<string>();
  const virtual = buildNeedsRevisionNotifications(
    revisionListings.filter((listing) => !covered.has(listing.id)),
  ).map((item) => ({
    ...item,
    read: dismissed.has(item.id),
  }));

  return [...stored, ...virtual].sort((a, b) => b.createdAt - a.createdAt);
}
