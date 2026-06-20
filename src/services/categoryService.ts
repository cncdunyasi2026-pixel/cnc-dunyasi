import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type MachineCategory = { id: string; name: string; order?: number };

const COL = "machine_categories";

export async function getCategories(): Promise<MachineCategory[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("order", "asc")));
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name as string,
    order: typeof d.data().order === "number" ? (d.data().order as number) : undefined,
  }));
}

export async function addCategory(name: string): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    name: name.trim(),
    order: Date.now(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { name: name.trim() });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
