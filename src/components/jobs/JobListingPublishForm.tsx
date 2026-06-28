"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageFilePicker from "@/components/listing/ImageFilePicker";
import ListingPublishShell from "@/components/listing/ListingPublishShell";
import { useEffect } from "react";
import { JOB_WORK_MODELS, JOB_EXPERIENCE_LEVELS } from "@/lib/constants/jobOptions";
import { uniqueSlugFromName } from "@/lib/utils/slugify";
import { useAuth } from "@/hooks/useAuth";
import { submitJobListing } from "@/services/jobListingService";
import { uploadUserImagesWithPaths } from "@/services/storageUpload";
import { positionService } from "@/services/siteDataService";

function splitBulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15";

const labelClass = "mb-1 block text-xs font-semibold text-[#61748f]";

function JobFormInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [workModel, setWorkModel] = useState<string>(JOB_WORK_MODELS[0]);
  const [position, setPosition] = useState<string>("");
  const [positions, setPositions] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>(JOB_EXPERIENCE_LEVELS[0]);
  const [salary, setSalary] = useState("");

  useEffect(() => {
    void positionService.getAll().then((list) => {
      const names = list.map((p) => p.name);
      setPositions(names);
      if (names.length > 0) setPosition(names[0]);
    });
  }, []);
  const [description, setDescription] = useState("");
  const [responsibilitiesText, setResponsibilitiesText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Oturum bulunamadı.");
      return;
    }

    const responsibilities = splitBulletLines(responsibilitiesText);
    const requirements = splitBulletLines(requirementsText);

    if (!title.trim() || !company.trim() || !location.trim()) {
      setError("Pozisyon başlığı, firma ve lokasyon zorunludur.");
      return;
    }
    if (!salary.trim()) {
      setError("Ücret aralığı veya bilgisi girin.");
      return;
    }
    if (!description.trim()) {
      setError("Pozisyon açıklaması girin.");
      return;
    }
    if (responsibilities.length === 0 || requirements.length === 0) {
      setError("Sorumluluklar ve aranan nitelikler için en az bir madde ekleyin (her satır bir madde).");
      return;
    }
    if (files.length === 0) {
      setError("En az bir görsel ekleyin (işyeri veya ekip fotoğrafı).");
      return;
    }

    const slug = uniqueSlugFromName(title.trim());
    const postedAt = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    setLoading(true);
    try {
      const uploaded = await uploadUserImagesWithPaths(files, `job-listing-images/${user.uid}`);
      const ref = await submitJobListing({
        slug,
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        workModel,
        level: position,
        position,
        experienceLevel,
        salary: salary.trim(),
        postedAt,
        description: description.trim(),
        responsibilities,
        requirements,
        images: uploaded.map((item) => item.url),
        imagePaths: uploaded.map((item) => item.path),
        ownerId: user.uid,
        userName: user.displayName ?? user.email?.split("@")[0] ?? "Kullanıcı",
        status: "draft",
      });
      router.push(
        `/odeme?listingId=${encodeURIComponent(ref.id)}&kind=job&slug=${encodeURIComponent(slug)}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan kaydedilemedi.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="job-title" className={labelClass}>
          Pozisyon başlığı
        </label>
        <input
          id="job-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. CNC operatörü"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="job-company" className={labelClass}>
            Firma adı
          </label>
          <input
            id="job-company"
            className={inputClass}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Örn. Marmara Makina"
            required
          />
        </div>
        <div>
          <label htmlFor="job-location" className={labelClass}>
            Lokasyon
          </label>
          <input
            id="job-location"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Örn. İstanbul / Tuzla"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="job-position" className={labelClass}>Pozisyon</label>
          {positions.length > 0 ? (
            <select id="job-position" className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)}>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <input
              id="job-position"
              className={inputClass}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Örn. CNC Operatörü"
              required
            />
          )}
        </div>
        <div>
          <label htmlFor="job-model" className={labelClass}>Çalışma modeli</label>
          <select id="job-model" className={inputClass} value={workModel} onChange={(e) => setWorkModel(e.target.value)}>
            {JOB_WORK_MODELS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="job-exp" className={labelClass}>Deneyim</label>
        <select id="job-exp" className={inputClass} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
          {JOB_EXPERIENCE_LEVELS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="job-salary" className={labelClass}>
          Ücret / paket bilgisi
        </label>
        <input
          id="job-salary"
          className={inputClass}
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="Örn. 45.000 - 60.000 TL"
          required
        />
      </div>

      <div>
        <label htmlFor="job-desc" className={labelClass}>
          Pozisyon açıklaması
        </label>
        <textarea
          id="job-desc"
          className={`${inputClass} min-h-[100px] resize-y py-3`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rolün özeti ve ekip hakkında kısa bilgi..."
          required
        />
      </div>

      <div>
        <label htmlFor="job-resp" className={labelClass}>
          Sorumluluklar
        </label>
        <textarea
          id="job-resp"
          className={`${inputClass} min-h-[90px] resize-y py-3`}
          value={responsibilitiesText}
          onChange={(e) => setResponsibilitiesText(e.target.value)}
          placeholder={"Her satıra bir madde yazın.\nÖrn. Üretim hattında operasyon"}
          required
        />
      </div>

      <div>
        <label htmlFor="job-req" className={labelClass}>
          Aranan nitelikler
        </label>
        <textarea
          id="job-req"
          className={`${inputClass} min-h-[90px] resize-y py-3`}
          value={requirementsText}
          onChange={(e) => setRequirementsText(e.target.value)}
          placeholder={"Her satıra bir şart yazın.\nÖrn. Teknik resim okuyabilmek"}
          required
        />
      </div>

      <ImageFilePicker value={files} onChange={setFiles} maxFiles={6} label="Görseller (işyeri / ekip)" />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(15,42,74,0.25)] transition hover:translate-y-[-1px] disabled:opacity-60"
      >
        {loading ? "Yükleniyor..." : "Ödemeye devam et"}
      </button>

      <p className="text-center text-xs text-[#7A8CA5]">
        İlanınız ödeme onayından sonra incelemeye gönderilir.
      </p>
    </form>
  );
}

export default function JobListingPublishForm() {
  return (
    <ListingPublishShell
      eyebrow="KARİYER"
      title="İş ilanı ver"
      subtitle="Aradığınız pozisyonu tanımlayın; adaylar CNC Dünyam üzerinden ilanınıza ulaşsın."
      footer={{
        href: "/kariyer",
        authenticatedLabel: "← Kariyer vitrinine dön",
        guestLabel: "← Kariyer vitrinine dön",
      }}
    >
      <JobFormInner />
    </ListingPublishShell>
  );
}
