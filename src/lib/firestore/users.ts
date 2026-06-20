import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";

/** Auth oturumu acildiginda veya yenilendiginde `users/{uid}` upsert. */
export async function syncAuthUserToFirestore(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const patch = {
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    avatarUrl: user.photoURL ?? null,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(userRef, {
      ...patch,
      roles: { admin: false, moderator: false },
      isActive: true,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, patch);
  }
}

export async function upsertUserDoc(userId: string, data: UserProfile) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      displayName: data.name,
      email: data.email,
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserDoc(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const d = userSnap.data();
  return {
    name: typeof d.displayName === "string" ? d.displayName : "",
    email: typeof d.email === "string" ? d.email : "",
    phone: typeof d.phone === "string" ? d.phone : undefined,
    avatarUrl: typeof d.avatarUrl === "string" ? d.avatarUrl : undefined,
  };
}
