"use client";

import { useEffect, useState } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { DEFAULT_FOOTER_SETTINGS } from "@/lib/constants/footerDefaults";
import { getFooterSettings, saveFooterSettings } from "@/services/footerService";
import type { FooterLink, FooterSettings } from "@/types/footer";

type Props = {
  adminCode: string;
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {description ? <p className="mt-1 text-xs text-white/45">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/55">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 8,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/55">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-6 text-white placeholder-white/20 outline-none focus:border-blue-500/50"
      />
    </label>
  );
}

function LinkEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  const updateLink = (index: number, patch: Partial<FooterLink>) => {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const addLink = () => {
    onChange([...links, { label: "", href: "", enabled: true }]);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-white/35">{title}</p>
        <button
          type="button"
          onClick={addLink}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06]"
        >
          Link ekle
        </button>
      </div>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${title}-${index}`} className="grid gap-2 rounded-lg border border-white/[0.05] p-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={link.label}
              onChange={(e) => updateLink(index, { label: e.target.value })}
              placeholder="Etiket"
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            />
            <input
              value={link.href}
              onChange={(e) => updateLink(index, { href: e.target.value })}
              placeholder="/kvkk veya https://..."
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            />
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={link.enabled}
                onChange={(e) => updateLink(index, { enabled: e.target.checked })}
              />
              Aktif
            </label>
            <button
              type="button"
              onClick={() => removeLink(index)}
              className="h-9 rounded-lg px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FooterManagementScreen({ adminCode }: Props) {
  const [draft, setDraft] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const data = await getFooterSettings();
      if (!data.kvkk.body.trim() || !data.userAgreement.body.trim()) {
        try {
          const res = await fetch("/api/legal/defaults");
          if (res.ok) {
            const defaults = (await res.json()) as {
              kvkk: { title: string; body: string };
              userAgreement: { title: string; body: string };
            };
            setDraft({
              ...data,
              kvkk: {
                title: data.kvkk.title.trim() || defaults.kvkk.title,
                body: data.kvkk.body.trim() || defaults.kvkk.body,
              },
              userAgreement: {
                title: data.userAgreement.title.trim() || defaults.userAgreement.title,
                body: data.userAgreement.body.trim() || defaults.userAgreement.body,
              },
            });
            return;
          }
        } catch {
          // md varsayılanları yüklenemezse mevcut veriyi kullan
        }
      }
      setDraft(data);
    })().finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveFooterSettings(draft);
      setMessage("Alt alan kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Alt Alan"
        subtitle="Footer metinleri, linkler, sosyal medya ve yasal sayfa içerikleri"
      >
        {loading ? (
          <p className="text-sm text-white/50">Yükleniyor…</p>
        ) : (
          <div className="space-y-5">
            <SectionCard title="Genel Bilgiler" description="Logo altı açıklama ve iletişim alanı">
              <TextField
                label="Kısa açıklama"
                value={draft.tagline}
                onChange={(tagline) => setDraft((prev) => ({ ...prev, tagline }))}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="İletişim e-postası"
                  value={draft.contactEmail}
                  onChange={(contactEmail) => setDraft((prev) => ({ ...prev, contactEmail }))}
                />
                <TextField
                  label="İletişim notu"
                  value={draft.contactNote}
                  onChange={(contactNote) => setDraft((prev) => ({ ...prev, contactNote }))}
                />
              </div>
            </SectionCard>

            <SectionCard title="Sosyal Medya" description="Instagram ve LinkedIn bağlantıları">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Instagram URL"
                  value={draft.instagramUrl}
                  onChange={(instagramUrl) => setDraft((prev) => ({ ...prev, instagramUrl }))}
                  placeholder="https://instagram.com/..."
                />
                <TextField
                  label="LinkedIn URL"
                  value={draft.linkedinUrl}
                  onChange={(linkedinUrl) => setDraft((prev) => ({ ...prev, linkedinUrl }))}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </SectionCard>

            <SectionCard title="Footer Linkleri" description="Platform, hesap, kurumsal ve alt çubuk linkleri">
              <LinkEditor
                title="Platform"
                links={draft.platformLinks}
                onChange={(platformLinks) => setDraft((prev) => ({ ...prev, platformLinks }))}
              />
              <LinkEditor
                title="Hesap"
                links={draft.accountLinks}
                onChange={(accountLinks) => setDraft((prev) => ({ ...prev, accountLinks }))}
              />
              <LinkEditor
                title="Kurumsal"
                links={draft.corporateLinks}
                onChange={(corporateLinks) => setDraft((prev) => ({ ...prev, corporateLinks }))}
              />
              <LinkEditor
                title="Alt Çubuk"
                links={draft.bottomLinks}
                onChange={(bottomLinks) => setDraft((prev) => ({ ...prev, bottomLinks }))}
              />
            </SectionCard>

            <SectionCard title="KVKK" description="/kvkk sayfasında gösterilir">
              <TextField
                label="Başlık"
                value={draft.kvkk.title}
                onChange={(title) => setDraft((prev) => ({ ...prev, kvkk: { ...prev.kvkk, title } }))}
              />
              <TextAreaField
                label="İçerik"
                value={draft.kvkk.body}
                onChange={(body) => setDraft((prev) => ({ ...prev, kvkk: { ...prev.kvkk, body } }))}
                rows={12}
              />
            </SectionCard>

            <SectionCard title="Kullanıcı Sözleşmesi" description="/kullanici-sozlesmesi sayfasında gösterilir">
              <TextField
                label="Başlık"
                value={draft.userAgreement.title}
                onChange={(title) => setDraft((prev) => ({ ...prev, userAgreement: { ...prev.userAgreement, title } }))}
              />
              <TextAreaField
                label="İçerik"
                value={draft.userAgreement.body}
                onChange={(body) => setDraft((prev) => ({ ...prev, userAgreement: { ...prev.userAgreement, body } }))}
                rows={12}
              />
            </SectionCard>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              {message ? <p className="text-sm text-white/60">{message}</p> : null}
            </div>
          </div>
        )}
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}
