"use client";

import { useEffect, useState } from "react";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import {
  getBrands,
  getModels,
  addBrand,
  deleteBrand,
  addModel,
  deleteModel,
  type Brand,
  type BrandModel,
} from "@/services/brandModelService";
import {
  getCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  type MachineCategory,
} from "@/services/categoryService";
import {
  positionService,
  serviceTypeService,
  sparePartCategoryService,
  sparePartBrandService,
  type SiteDataItem,
} from "@/services/siteDataService";

/* ─────────────────────────── küçük araçlar ─────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-400">
      {children}
    </span>
  );
}

function AddInput({
  placeholder,
  onAdd,
  loading,
}: {
  placeholder: string;
  onAdd: (val: string) => Promise<void>;
  loading: boolean;
}) {
  const [val, setVal] = useState("");
  const handle = async () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setVal("");
  };
  return (
    <div className="flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void handle()}
        placeholder={placeholder}
        className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => void handle()}
        disabled={loading || !val.trim()}
        className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-40"
      >
        Ekle
      </button>
    </div>
  );
}

/* ─────────────────────── Sekme: Marka & Modeller ───────────────── */

function ModelList({ brandId, brandName }: { brandId: string; brandName: string }) {
  const [models, setModels] = useState<BrandModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    void getModels(brandId).then((m) => { setModels(m); setLoading(false); });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [brandId]);

  const handleAdd = async (name: string) => {
    setAdding(true);
    try { await addModel(brandId, name); load(); } finally { setAdding(false); }
  };
  const handleDelete = async (modelId: string) => {
    setDeletingId(modelId);
    try { await deleteModel(brandId, modelId); setModels((p) => p.filter((m) => m.id !== modelId)); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">
        {brandName} Modelleri
      </p>
      <AddInput placeholder="Yeni model adı (Enter)" onAdd={handleAdd} loading={adding} />
      {loading ? (
        <p className="mt-3 text-xs text-white/30">Yükleniyor…</p>
      ) : models.length === 0 ? (
        <p className="mt-3 text-xs text-white/30">Henüz model eklenmedi.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {models.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/[0.04]">
              <span>{m.name}</span>
              <button
                type="button"
                onClick={() => void handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="text-rose-400/50 transition hover:text-rose-400 disabled:opacity-30"
                title="Sil"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BrandRow({ brand, onDelete }: { brand: Brand; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1e36] transition">
      <div className="flex items-center gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen((p) => !p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <svg className={`h-4 w-4 shrink-0 text-blue-400/50 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-bold text-white">{brand.name}</span>
        </button>
        <button type="button" onClick={onDelete} className="text-rose-400/40 transition hover:text-rose-400" title="Markayı sil">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-white/[0.06] px-5 pb-5">
          <ModelList brandId={brand.id} brandName={brand.name} />
        </div>
      )}
    </div>
  );
}

function BrandsTab() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    void getBrands().then((b) => { setBrands(b); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleAddBrand = async (name: string) => {
    setAdding(true);
    try { await addBrand(name); load(); } finally { setAdding(false); }
  };
  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm("Bu markayı ve tüm modellerini silmek istediğinizden emin misiniz?")) return;
    setDeletingId(brandId);
    try { await deleteBrand(brandId); setBrands((p) => p.filter((b) => b.id !== brandId)); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1e36] p-5">
        <p className="mb-3 text-sm font-bold text-white">Yeni Marka Ekle</p>
        <AddInput placeholder="Marka adı (örn. HAAS, Fanuc, DMG Mori)" onAdd={handleAddBrand} loading={adding} />
        <p className="mt-2 text-xs text-white/25">Markayı ekledikten sonra üzerine tıklayarak model ekleyebilirsiniz.</p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">Markalar</p>
          {!loading && <Badge>{brands.length} marka</Badge>}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="text-sm text-white/30">Henüz marka eklenmedi.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand.id} className={deletingId === brand.id ? "opacity-40" : ""}>
                <BrandRow brand={brand} onDelete={() => void handleDeleteBrand(brand.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Sekme: Kategoriler ────────────────────── */

function CategoriesTab() {
  const [cats, setCats] = useState<MachineCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const load = () => {
    setLoading(true);
    void getCategories().then((c) => { setCats(c); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (name: string) => {
    setAdding(true);
    try { await addCategory(name); load(); } finally { setAdding(false); }
  };

  const handleStartEdit = (cat: MachineCategory) => {
    setEditingId(cat.id);
    setEditVal(cat.name);
  };
  const handleSaveEdit = async (id: string) => {
    if (!editVal.trim()) return;
    await renameCategory(id, editVal);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    try { await deleteCategory(id); setCats((p) => p.filter((c) => c.id !== id)); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1e36] p-5">
        <p className="mb-3 text-sm font-bold text-white">Yeni Kategori Ekle</p>
        <AddInput placeholder="Kategori adı (örn. CNC Dik İşleme, EDM)" onAdd={handleAdd} loading={adding} />
        <p className="mt-2 text-xs text-white/25">
          Eklenen kategoriler ilan formundaki kategori listesinde görünür.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">Kategoriler</p>
          {!loading && <Badge>{cats.length} kategori</Badge>}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
        ) : cats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="text-sm text-white/30">Henüz kategori eklenmedi.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cats.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0d1e36] px-5 py-3.5 transition ${
                  deletingId === cat.id ? "opacity-40" : ""
                }`}
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit(cat.id)}
                      autoFocus
                      className="h-8 flex-1 rounded-lg border border-blue-500/50 bg-white/5 px-3 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit(cat.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-500"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-white/30 transition hover:text-white/60"
                    >
                      İptal
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-white">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="text-blue-400/40 transition hover:text-blue-400"
                      title="Düzenle"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(cat.id)}
                      className="text-rose-400/40 transition hover:text-rose-400"
                      title="Sil"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Evrensel CRUD sekme (pozisyon, hizmet tipi, vb.) ─── */

type SimpleService = {
  getAll: () => Promise<SiteDataItem[]>;
  add: (name: string) => Promise<string>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function SimpleListTab({
  service,
  addPlaceholder,
  emptyText,
}: {
  service: SimpleService;
  addPlaceholder: string;
  emptyText: string;
}) {
  const [items, setItems] = useState<SiteDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const load = () => {
    setLoading(true);
    void service.getAll().then((d) => { setItems(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (name: string) => {
    setAdding(true);
    try { await service.add(name); load(); } finally { setAdding(false); }
  };
  const handleStartEdit = (item: SiteDataItem) => { setEditingId(item.id); setEditVal(item.name); };
  const handleSaveEdit = async (id: string) => {
    if (!editVal.trim()) return;
    await service.rename(id, editVal);
    setEditingId(null);
    load();
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Bu öğeyi silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    try { await service.remove(id); setItems((p) => p.filter((i) => i.id !== id)); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1e36] p-5">
        <AddInput placeholder={addPlaceholder} onAdd={handleAdd} loading={adding} />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">Liste</p>
          {!loading && <Badge>{items.length} öğe</Badge>}
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="text-sm text-white/30">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0d1e36] px-5 py-3.5 transition ${deletingId === item.id ? "opacity-40" : ""}`}>
                {editingId === item.id ? (
                  <>
                    <input value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit(item.id)} autoFocus className="h-8 flex-1 rounded-lg border border-blue-500/50 bg-white/5 px-3 text-sm text-white outline-none" />
                    <button type="button" onClick={() => void handleSaveEdit(item.id)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-500">Kaydet</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-white/30 transition hover:text-white/60">İptal</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-white">{item.name}</span>
                    <button type="button" onClick={() => handleStartEdit(item)} className="text-blue-400/40 transition hover:text-blue-400" title="Düzenle">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button type="button" onClick={() => void handleDelete(item.id)} className="text-rose-400/40 transition hover:text-rose-400" title="Sil">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Ana ekran ─────────────────────────── */

type Tab = "brands" | "categories" | "positions" | "serviceTypes" | "spareParts";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "brands",       label: "Marka & Model",        icon: "🏷️" },
  { key: "categories",   label: "CNC Kategorileri",      icon: "📂" },
  { key: "positions",    label: "Kariyer Pozisyonları",  icon: "👔" },
  { key: "serviceTypes", label: "Teknik Servis Tipleri", icon: "🔧" },
  { key: "spareParts",   label: "Yedek Parça",           icon: "⚙️" },
];

function CncDataContent({ adminCode }: { adminCode: string }) {
  const [tab, setTab] = useState<Tab>("brands");

  return (
    <AdminSectionLayout
      adminCode={adminCode}
      title="Site Verileri"
      subtitle="Tüm kategoriler için açılır liste seçeneklerini buradan yönetin."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Sekme seçici */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0d1e36] p-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "brands"       && <BrandsTab />}
        {tab === "categories"   && <CategoriesTab />}
        {tab === "positions"    && (
          <SimpleListTab
            service={positionService}
            addPlaceholder="Pozisyon adı (örn. CNC Operatörü, Satış Mühendisi)"
            emptyText="Henüz pozisyon eklenmedi."
          />
        )}
        {tab === "serviceTypes" && (
          <SimpleListTab
            service={serviceTypeService}
            addPlaceholder="Hizmet tipi (örn. Periyodik Bakım, Retrofit)"
            emptyText="Henüz hizmet tipi eklenmedi."
          />
        )}
        {tab === "spareParts"   && (
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">Parça Kategorileri</p>
              <SimpleListTab
                service={sparePartCategoryService}
                addPlaceholder="Kategori (örn. Elektronik Kart, Servo Motor)"
                emptyText="Henüz kategori eklenmedi."
              />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">Marka Uyumu Seçenekleri</p>
              <SimpleListTab
                service={sparePartBrandService}
                addPlaceholder="Marka (örn. Fanuc, Siemens, Mitsubishi)"
                emptyText="Henüz marka eklenmedi."
              />
            </div>
          </div>
        )}
      </div>
    </AdminSectionLayout>
  );
}

export default function BrandsScreen({ adminCode }: { adminCode: string }) {
  return (
    <AdminAuthGate adminCode={adminCode}>
      <CncDataContent adminCode={adminCode} />
    </AdminAuthGate>
  );
}
