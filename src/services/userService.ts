import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseClientConfigured } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export function formatAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Google penceresi kapatıldı. Tekrar deneyin.";
      case "auth/popup-blocked":
        return "Tarayıcı açılır pencereyi engelledi. İzin verip yeniden deneyin.";
      case "auth/cancelled-popup-request":
        return "Başka bir giriş işlemi devam ediyor. Biraz bekleyip tekrar deneyin.";
      case "auth/account-exists-with-different-credential":
        return "Bu e-posta farklı bir giriş yöntemiyle kayıtlı. E-posta ile giriş yapmayı deneyin.";
      case "auth/email-already-in-use":
        return "Bu e-posta zaten kullanılıyor.";
      case "auth/invalid-email":
        return "Geçersiz e-posta adresi.";
      case "auth/weak-password":
        return "Şifre çok zayıf.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "E-posta veya şifre hatalı.";
      case "auth/too-many-requests":
        return "Çok fazla deneme yapıldı. Kısa süre sonra tekrar deneyin.";
      default:
        break;
    }
  }
  if (error instanceof Error) return error.message;
  return "Bir hata oluştu.";
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Giris icin .env.local tanimlayin.");
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  phone: string,
): Promise<UserCredential> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Kayit icin .env.local tanimlayin.");
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);

  /* Firebase Auth profiline isim ekle */
  await updateProfile(credential.user, { displayName });

  /* Firestore users koleksiyonuna profil kaydet */
  await setDoc(doc(db, "users", credential.user.uid), {
    displayName,
    email,
    phone,
    createdAt: serverTimestamp(),
  });

  return credential;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Google girisi icin .env.local tanimlayin.");
  }

  return signInWithPopup(auth, googleProvider);
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Sifre sifirlama icin .env.local tanimlayin.");
  }

  await sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  if (!isFirebaseClientConfigured) {
    return;
  }

  return signOut(auth);
}
