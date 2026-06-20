/**
 * Site Verileri — admin panelinden yönetilen tüm açılır liste seçenekleri.
 * Her koleksiyon aynı yapıyı paylaşır: { id, name, order, createdAt }
 */
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

export type SiteDataItem = { id: string; name: string; order?: number };

/* ── Genel CRUD fabrikası ────────────────────────────────────── */

function makeService(colName: string) {
  return {
    async getAll(): Promise<SiteDataItem[]> {
      const snap = await getDocs(query(collection(db, colName), orderBy("order", "asc")));
      return snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name as string,
        order: typeof d.data().order === "number" ? (d.data().order as number) : undefined,
      }));
    },

    async add(name: string): Promise<string> {
      const ref = await addDoc(collection(db, colName), {
        name: name.trim(),
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },

    async rename(id: string, name: string): Promise<void> {
      await updateDoc(doc(db, colName, id), { name: name.trim() });
    },

    async remove(id: string): Promise<void> {
      await deleteDoc(doc(db, colName, id));
    },
  };
}

/* ── Kariyer: pozisyonlar ───────────────────────────────────── */
export const positionService = makeService("career_positions");

/* ── Teknik Servis: hizmet tipleri ─────────────────────────── */
export const serviceTypeService = makeService("service_types");

/* ── Yedek Parça: parça kategorileri ───────────────────────── */
export const sparePartCategoryService = makeService("spare_part_categories");

/* ── Yedek Parça: marka uyumu seçenekleri ──────────────────── */
export const sparePartBrandService = makeService("spare_part_brands");
