import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchCachedList } from "@/lib/cache/cachedListFetch";

export type Brand = { id: string; name: string };
export type BrandModel = { id: string; name: string };
export type BrandWithModels = Brand & { models: BrandModel[] };

/* ── Markalar ─────────────────────────────────────────────── */

export async function getBrands(): Promise<Brand[]> {
  return fetchCachedList("site:machine-brands", async () => {
    const snap = await getDocs(
      query(collection(db, "machine_brands"), orderBy("name", "asc")),
    );
    return snap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
  });
}

export async function addBrand(name: string): Promise<string> {
  const ref = await addDoc(collection(db, "machine_brands"), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteBrand(brandId: string): Promise<void> {
  /* Önce alt koleksiyondaki modelleri sil */
  const modSnap = await getDocs(collection(db, "machine_brands", brandId, "models"));
  const batch = writeBatch(db);
  modSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "machine_brands", brandId));
  await batch.commit();
}

/* ── Modeller ─────────────────────────────────────────────── */

export async function getModels(brandId: string): Promise<BrandModel[]> {
  const snap = await getDocs(
    query(
      collection(db, "machine_brands", brandId, "models"),
      orderBy("name", "asc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
}

export async function addModel(brandId: string, name: string): Promise<string> {
  const ref = await addDoc(
    collection(db, "machine_brands", brandId, "models"),
    { name: name.trim(), createdAt: serverTimestamp() },
  );
  return ref.id;
}

export async function deleteModel(brandId: string, modelId: string): Promise<void> {
  await deleteDoc(doc(db, "machine_brands", brandId, "models", modelId));
}

/* ── Dropdown için tümü ───────────────────────────────────── */

export async function getBrandsWithModels(): Promise<BrandWithModels[]> {
  const brands = await getBrands();
  const results = await Promise.all(
    brands.map(async (b) => ({
      ...b,
      models: await getModels(b.id),
    })),
  );
  return results;
}
