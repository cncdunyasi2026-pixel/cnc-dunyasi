/** Anasayfa ilan bölümü yüklenirken gösterilen hafif iskelet (ayrı chunk, SSR uyumlu). */
export default function HomepageSectionsPlaceholder() {
  return (
    <>
      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <div className="mb-3 h-7 w-48 animate-pulse rounded-lg bg-[#dbe2ea]" />
        <div className="flex flex-wrap justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 w-full max-w-[320px] animate-pulse rounded-[4px] bg-[#e5eaf0]"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <div className="mb-3 h-7 w-36 animate-pulse rounded-lg bg-[#dbe2ea]" />
        <div className="space-y-6">
          {[1, 2].map((s) => (
            <div key={s}>
              <div className="mb-2 h-5 w-24 animate-pulse rounded bg-[#dbe2ea]" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-52 animate-pulse rounded-[10px] bg-[#e5eaf0]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
