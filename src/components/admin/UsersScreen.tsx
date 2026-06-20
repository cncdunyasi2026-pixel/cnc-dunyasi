"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { db } from "@/lib/firebase";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";

type Props = { adminCode: string };

type UserRow = {
  uid: string;
  displayName?: string;
  email?: string;
  createdAt: number;
  lastLoginAt?: number;
  isAdmin: boolean;
  isModerator: boolean;
  avatarUrl?: string;
};

const PAGE_SIZE = 20;

function fmtDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(ms: number) {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} gün önce`;
  return fmtDate(ms);
}

function initials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export default function UsersScreen({ adminCode }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [search, setSearch] = useState("");
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mapDoc = (d: QueryDocumentSnapshot): UserRow => {
    const data = d.data() as Record<string, unknown>;
    const roles = data.roles as Record<string, boolean> | undefined;
    return {
      uid: d.id,
      displayName: typeof data.displayName === "string" ? data.displayName
        : typeof data.name === "string" ? data.name
        : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
      createdAt: data.createdAt != null ? coerceFirestoreMillis(data.createdAt) : 0,
      lastLoginAt: data.lastLoginAt != null ? coerceFirestoreMillis(data.lastLoginAt) : undefined,
      isAdmin: roles?.admin === true,
      isModerator: roles?.moderator === true,
      avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : undefined,
    };
  };

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1)),
      );
      const docs = snap.docs.slice(0, PAGE_SIZE);
      setUsers(docs.map(mapDoc));
      setHasMore(snap.docs.length > PAGE_SIZE);
      setLastDoc(docs[docs.length - 1] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE + 1),
        ),
      );
      const docs = snap.docs.slice(0, PAGE_SIZE);
      setUsers((prev) => [...prev, ...docs.map(mapDoc)]);
      setHasMore(snap.docs.length > PAGE_SIZE);
      setLastDoc(docs[docs.length - 1] ?? null);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  const toggleRole = async (uid: string, role: "admin" | "moderator", current: boolean) => {
    setSavingUid(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        [`roles.${role}`]: !current,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, isAdmin: role === "admin" ? !current : u.isAdmin, isModerator: role === "moderator" ? !current : u.isModerator }
            : u,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setSavingUid(null);
    }
  };

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q)
        );
      })
    : users;

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Kullanıcılar"
        subtitle="Tüm üyeleri görüntüle ve rol yönetimi yap."
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="E-posta, ad veya UID ile ara..."
                className="w-full rounded-xl border border-white/[0.07] bg-[#0f1c33] py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadFirst()}
              className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:text-white"
            >
              <RefreshIcon />
              Yenile
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc]">
                    Kullanıcı
                  </th>
                  <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc] md:table-cell">
                    Kayıt
                  </th>
                  <th className="hidden px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc] lg:table-cell">
                    Son Giriş
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc]">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc]">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-white/10" />
                            <div>
                              <div className="h-3.5 w-28 rounded bg-white/10" />
                              <div className="mt-1 h-3 w-20 rounded bg-white/[0.07]" />
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <div className="h-3.5 w-20 rounded bg-white/10" />
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <div className="h-3.5 w-16 rounded bg-white/10" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 w-14 rounded-full bg-white/10" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-20 rounded-lg bg-white/10" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((u) => (
                      <tr key={u.uid} className="transition hover:bg-white/[0.025]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={u.avatarUrl}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-[11px] font-extrabold text-blue-300">
                                {initials(u.displayName, u.email)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-white">
                                {u.displayName ?? <span className="text-white/40 italic">İsimsiz</span>}
                              </p>
                              <p className="truncate text-[11px] text-[#6a94bc]">{u.email ?? u.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-[12px] text-[#6a94bc] md:table-cell">
                          {fmtDate(u.createdAt)}
                        </td>
                        <td className="hidden px-4 py-3 text-[12px] text-[#6a94bc] lg:table-cell">
                          {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.isAdmin && (
                              <span className="rounded-full bg-blue-500/15 border border-blue-400/25 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                                Admin
                              </span>
                            )}
                            {u.isModerator && (
                              <span className="rounded-full bg-purple-500/15 border border-purple-400/25 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                Moderatör
                              </span>
                            )}
                            {!u.isAdmin && !u.isModerator && (
                              <span className="text-[11px] text-white/25">Üye</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={savingUid === u.uid}
                              onClick={() => void toggleRole(u.uid, "admin", u.isAdmin)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-40 ${
                                u.isAdmin
                                  ? "border-rose-400/30 bg-rose-900/20 text-rose-300 hover:bg-rose-900/40"
                                  : "border-white/[0.07] text-white/60 hover:border-blue-400/30 hover:bg-blue-900/20 hover:text-blue-300"
                              }`}
                            >
                              {u.isAdmin ? "Admin Kaldır" : "Admin Yap"}
                            </button>
                            <button
                              type="button"
                              disabled={savingUid === u.uid}
                              onClick={() => void toggleRole(u.uid, "moderator", u.isModerator)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-40 ${
                                u.isModerator
                                  ? "border-rose-400/30 bg-rose-900/20 text-rose-300 hover:bg-rose-900/40"
                                  : "border-white/[0.07] text-white/60 hover:border-purple-400/30 hover:bg-purple-900/20 hover:text-purple-300"
                              }`}
                            >
                              {u.isModerator ? "Mod Kaldır" : "Mod Yap"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-[#6a94bc]">
                {search ? "Aramanızla eşleşen kullanıcı bulunamadı." : "Kullanıcı bulunamadı."}
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && !search && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                {loadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
              </button>
            </div>
          )}

          {/* Stats */}
          {!loading && (
            <p className="text-center text-xs text-[#4a6a8a]">
              {filtered.length} kullanıcı gösteriliyor
              {search ? ` · "${search}" araması` : ""}
            </p>
          )}
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
