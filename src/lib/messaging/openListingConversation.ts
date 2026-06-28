import { getOrCreateConversation, sendMessage } from "@/services/messagingService";
import { buildPublicUrl } from "@/lib/utils/publicUrl";

type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
};

export type OpenListingConversationInput = {
  user: AuthUser | null;
  ownerId?: string;
  ownerName: string;
  listingId: string;
  listingTitle: string;
  listingPath: string;
  listingImageUrl?: string;
  loginRedirectPath: string;
};

export async function openListingConversation(
  input: OpenListingConversationInput,
  navigate: (path: string) => void,
): Promise<void> {
  if (!input.user) {
    navigate(`/hesap/giris?redirect=${encodeURIComponent(input.loginRedirectPath)}`);
    return;
  }
  if (!input.ownerId || input.ownerId === input.user.uid) return;

  const displayName = input.user.displayName ?? input.user.email ?? "Kullanıcı";
  const listingUrl = buildPublicUrl(input.listingPath);

  const { conversationId, isNew } = await getOrCreateConversation(
    { uid: input.user.uid, displayName },
    { uid: input.ownerId, displayName: input.ownerName },
    {
      id: input.listingId,
      title: input.listingTitle,
      url: listingUrl,
      imageUrl: input.listingImageUrl,
    },
  );

  if (isNew) {
    await sendMessage(
      conversationId,
      { uid: input.user.uid, displayName },
      listingUrl,
      "listing",
    );
  }

  navigate(`/hesap/mesajlar/${conversationId}`);
}
