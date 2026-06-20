/** UI profil formu (Firestore `displayName` ile eslestirilir). */
export type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
};
