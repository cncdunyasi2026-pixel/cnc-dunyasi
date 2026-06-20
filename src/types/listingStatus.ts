/** Firestore ilan dokumanlari icin omurga status akisi */
export type ListingLifecycleStatus =
  | "draft"
  | "pending"
  | "update_pending"
  | "needs_revision"
  /** Kullanıcı needs_revision sonrası düzeltti ve yeniden gönderdi; admin tekrar inceleyecek. */
  | "revision_resubmitted"
  | "published"
  | "rejected"
  | "archived";
