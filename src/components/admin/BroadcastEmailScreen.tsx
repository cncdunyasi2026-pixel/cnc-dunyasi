"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getIdToken } from "firebase/auth";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { useAuth } from "@/hooks/useAuth";
import { MAIL_FROM_ADDRESS } from "@/lib/constants/mail";
import { buildBroadcastEmailHtml } from "@/lib/mail/broadcastEmailTemplate";
import { uploadUserImages } from "@/services/storageUpload";
import {
  addMailContact,
  deleteMailContact,
  fetchMailContacts,
  parseEmailList,
  type MailContact,
} from "@/services/mailContactService";

type Props = {
  adminCode: string;
};

export default function BroadcastEmailScreen({ adminCode }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [toUsers, setToUsers] = useState(true);
  const [toContacts, setToContacts] = useState(false);
  const [manualEmails, setManualEmails] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contacts, setContacts] = useState<MailContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [contactLabel, setContactLabel] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const parsedManual = useMemo(() => parseEmailList(manualEmails), [manualEmails]);

  const previewHtml = useMemo(
    () =>
      buildBroadcastEmailHtml({
        subject: subject.trim() || "Konu başlığı burada görünür",
        message:
          message.trim() ||
          "Mesaj metniniz burada yer alacak.\n\nBoş satır ile yeni paragraf oluşturabilirsiniz.",
        imageUrl: imageUrl.trim() || null,
      }),
    [subject, message, imageUrl],
  );

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      setContacts(await fetchMailContacts());
    } catch (e) {
      setContactError(e instanceof Error ? e.message : "Kayıtlı mailler yüklenemedi.");
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    (toUsers || toContacts || parsedManual.length > 0) &&
    !sending &&
    !imageUploading;

  const recipientSummary = () => {
    const parts: string[] = [];
    if (toUsers) parts.push("site kullanıcıları");
    if (toContacts) parts.push(`kayıtlı kişiler (${contacts.length})`);
    if (parsedManual.length > 0) parts.push(`elle yazılan (${parsedManual.length})`);
    return parts.join(" + ") || "alıcı yok";
  };

  const handleImageUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !user) return;
    setImageUploading(true);
    setError(null);
    try {
      const [url] = await uploadUserImages([file], `page-content/${user.uid}/mail-broadcast`);
      setImageUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddContact = async () => {
    if (!user) return;
    setContactBusy(true);
    setContactError(null);
    try {
      const created = await addMailContact({
        email: contactEmail,
        label: contactLabel,
        createdBy: user.uid,
      });
      setContacts((prev) => [created, ...prev]);
      setContactEmail("");
      setContactLabel("");
    } catch (e) {
      setContactError(e instanceof Error ? e.message : "Eklenemedi.");
    } finally {
      setContactBusy(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setContactBusy(true);
    setContactError(null);
    try {
      await deleteMailContact(id);
      setContacts((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setContactError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setContactBusy(false);
    }
  };

  const handleSend = async () => {
    if (!canSend || !user) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getIdToken(user, true);
      const res = await fetch("/api/admin/broadcast-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          imageUrl: imageUrl.trim() || undefined,
          toUsers,
          toContacts,
          extraEmails: parsedManual,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        sentCount?: number;
        recipientCount?: number;
        failureCount?: number;
      };

      if (!res.ok) {
        throw new Error(data.error || "E-posta gönderilemedi.");
      }

      const sent = data.sentCount ?? 0;
      const total = data.recipientCount ?? 0;
      const failed = data.failureCount ?? 0;
      setSuccess(
        failed > 0
          ? `${sent}/${total} kişiye gönderildi. ${failed} adreste hata oluştu.`
          : `${sent} kişiye e-posta gönderildi.`,
      );
      setSubject("");
      setMessage("");
      setImageUrl("");
      setManualEmails("");
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "E-posta gönderilemedi.");
      setConfirmOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Toplu E-posta"
        subtitle={`${MAIL_FROM_ADDRESS} adresinden duyuru gönder`}
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              Kayıtlı mailler ({contacts.length})
            </button>
          </div>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold text-white">Yeni e-posta</h2>
            <p className="mt-1 text-xs text-white/45">
              Gönderen: <span className="font-semibold text-white/70">{MAIL_FROM_ADDRESS}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-white/55">Alıcılar</p>
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/10 p-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={toUsers}
                      onChange={(e) => setToUsers(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">Kullanıcılara mail gönder</span>
                      <span className="text-xs text-white/45">Sitede kayıtlı tüm üyelerin e-postaları</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={toContacts}
                      onChange={(e) => setToContacts(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">Kayıtlı kişilere mail gönder</span>
                      <span className="text-xs text-white/45">
                        Sağ üstteki listede tuttuğunuz adresler ({contacts.length})
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-white/55">
                  Elle e-posta ekle <span className="font-normal text-white/30">(opsiyonel)</span>
                </span>
                <textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder={"ornek@firma.com\nbaska@mail.com"}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-6 text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
                <span className="mt-1 block text-[11px] text-white/30">
                  Virgül veya satır ile ayırın
                  {parsedManual.length > 0 ? ` · ${parsedManual.length} geçerli adres` : ""}
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-white/55">Konu</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn. CNC Dünyam’dan önemli duyuru"
                  maxLength={150}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-white/55">Mesaj</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"Merhaba,\n\nYeni duyurumuzu paylaşmak istedik.\n\nİyi çalışmalar."}
                  rows={8}
                  maxLength={5000}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-6 text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
                <span className="mt-1 block text-[11px] text-white/30">
                  {message.length}/5000 · Boş satır = yeni paragraf
                </span>
              </label>

              <div className="space-y-2">
                <span className="block text-xs font-semibold text-white/55">
                  Görsel <span className="font-normal text-white/30">(opsiyonel)</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10">
                    {imageUploading ? "Yükleniyor…" : "Dosyadan yükle"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={imageUploading || !user}
                      onChange={(e) => {
                        void handleImageUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-bold text-rose-200"
                    >
                      Görseli kaldır
                    </button>
                  ) : null}
                </div>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="veya görsel URL yapıştır (https://…)"
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="E-posta görseli önizleme"
                    className="mt-1 max-h-40 w-full rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <p className="text-[11px] text-white/30">
                    Konu ile mesaj arasında görünür. JPG/PNG önerilir; public https linki olmalı.
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white/55">E-posta önizleme</span>
                  <span className="text-[11px] text-white/30">CNC Dünyam şablonu</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#E9EEF3]">
                  <iframe
                    title="E-posta önizleme"
                    srcDoc={previewHtml}
                    sandbox=""
                    className="h-[480px] w-full border-0 bg-[#E9EEF3]"
                  />
                </div>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {success}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/40">Alıcılar: {recipientSummary()}</p>
              <button
                type="button"
                disabled={!canSend}
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                E-posta gönder
              </button>
            </div>
          </section>
        </div>

        {contactsOpen ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/55">
            <button
              type="button"
              className="h-full flex-1"
              aria-label="Kapat"
              onClick={() => setContactsOpen(false)}
            />
            <aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b1729] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-white">Kayıtlı mailler</h3>
                  <p className="mt-1 text-xs text-white/45">
                    Buraya eklediğiniz adreslere ayrıca mail gönderebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactsOpen(false)}
                  className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-bold text-white/70"
                >
                  Kapat
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
                <input
                  value={contactLabel}
                  onChange={(e) => setContactLabel(e.target.value)}
                  placeholder="İsim / not (opsiyonel)"
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
                />
                <button
                  type="button"
                  disabled={contactBusy || !contactEmail.trim()}
                  onClick={() => void handleAddContact()}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {contactBusy ? "Kaydediliyor…" : "Listeye ekle"}
                </button>
              </div>

              {contactError ? (
                <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {contactError}
                </p>
              ) : null}

              <div className="mt-4 flex-1 overflow-y-auto">
                {contactsLoading ? (
                  <p className="text-sm text-white/40">Yükleniyor…</p>
                ) : contacts.length === 0 ? (
                  <p className="text-sm text-white/40">Henüz kayıtlı mail yok.</p>
                ) : (
                  <ul className="space-y-2">
                    {contacts.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{item.email}</p>
                          {item.label ? (
                            <p className="truncate text-xs text-white/40">{item.label}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={contactBusy}
                          onClick={() => void handleDeleteContact(item.id)}
                          className="shrink-0 rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-200 disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        ) : null}

        {confirmOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101d39] p-5">
              <h3 className="text-base font-extrabold text-white">E-posta gönderilsin mi?</h3>
              <p className="mt-2 text-sm text-white/60">
                Mail <span className="font-semibold text-white/80">{MAIL_FROM_ADDRESS}</span> adresinden
                şu alıcılara gidecek: <span className="text-white/80">{recipientSummary()}</span>
              </p>
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/40">Konu</p>
                <p className="text-sm font-bold text-white">{subject.trim()}</p>
                <p className="mt-2 text-xs text-white/40">Mesaj</p>
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-white/65">
                  {message.trim()}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void handleSend()}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {sending ? "Gönderiliyor…" : "Evet, gönder"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}
