# CNC Dunyasi - Firebase Backend Omurga Plani

Bu belge; mevcut proje kodu temel alinarak Firestore + Storage uzerinde guvenli, yonetilebilir ve buyuyebilir bir backend omurgasi kurmak icin hazirlanmistir.

Hedef: **Kullanici giris yapmadan ilanlari gorur, ama hicbir kategoride ilan veremez.**

---

## 1) Hedefler ve Ana Kurallar

- **Acik erisim (read):** Ziyaretciler giris yapmadan ilanlari/liste sayfalarini gorebilir.
- **Yetkili islem (write):** Ilan olusturma, guncelleme, silme islemleri sadece giris yapmis kullanicida.
- **Sahiplik kurali:** Ilani olusturan kullanici (`ownerId`) disinda kimse ilanin cekirdek alanlarini degistiremez.
- **Rol bazli yonetim:** Admin/Moderator yetkisi Firebase Custom Claims ile verilir; `users/{uid}` dokumani daha cok UI ve profil amacli kullanilir.
- **Server timestamp:** Tarih alanlari client `Date.now()` yerine `serverTimestamp()` ile yazilir.
- **Modelleme disiplini:** Tum ana varliklarda `status`, `createdAt`, `updatedAt`, `ownerId` benzeri standart alanlar zorunlu.
- **Soft delete:** Silme islemlerinde once `status = archived` (veya `deletedAt`) kullanilir.
- **Storage guvenlik:** Dosya yukleme yalnizca kimligi dogrulanmis kullanicinin kendi klasorune.
- **Referans veri yonetimi:** CNC marka/model, sehir/ilce, kategori gibi listeler merkezi koleksiyonlardan gelir.

### 1.1 Kesinlestirilen Is Kararlari

- **Ilan yayin modeli:** Tum ilan tipleri ilk asamada `pending` acilir. Admin/Moderator `published`, `rejected` veya `needs_revision` durumuna cekebilir.
- **Yetki modeli:** Admin/Moderator hesaplari Firebase Custom Claims ile verilir. Bu hesaplar tum veritabani yonetim operasyonlarini yapabilir.
- **Read politikasi:** Public sadece `published` gorur. Ilan sahibi kendi `draft`, `pending`, `needs_revision`, `rejected`, `archived` kayitlarini `Ilanlarim` sayfasinda gorur.
- **Revizyon akisi:** Admin `needs_revision` notu birakirsa ilan sahibi ayni ilani duzenleyip tekrar `pending`e gonderebilir.

---

## 2) Mevcut Proje Durumu (Kod Incelemesi Ozeti)

- Auth akislari var:
  - `/hesap/giris`, `/hesap/kayit`, Google + email/password
- Ilan verme ekranlari var:
  - `/ilan-ver/ikinci-el`
  - `/ilan-ver/teknik-servis`
  - `/ilan-ver/yedek-parca`
  - `/kariyer/is-ilani-ver`
- Firestore yazimlari mevcut:
  - `ads`
  - `technical_service_listings`
  - `spare_part_listings`
  - `job_listings`
- Storage yukleme mevcut (image upload servisi)
- Bazi liste/detay ekranlari halen mock veya hardcoded veriye bagli
- Guvenlik kurallari (Firestore/Storage rules) repoda tanimli degil

Bu nedenle: frontend akislar mevcut, ama backend guvenlik ve veri tutarliligi katmani simdi standartlastirilmali.

---

## 3) Hedef Mimari (Katmanlar)

- **UI Katmani (Next.js Pages/Components)**
  - Formlar
  - Liste/filtre ekranlari
- **Application Service Katmani (`src/services/*`)**
  - Veri dogrulama
  - DTO donusumleri
  - Firestore/Storage adapter cagrilari
- **Data Access Katmani (`src/lib/firestore/*`)**
  - Koleksiyon bazli query/write fonksiyonlari
- **Security Katmani (Firebase Rules)**
  - Kimlik + sahiplik + rol kontrolleri
- **Ops Katmani (Cloud Functions + Logging + Backups)**
  - Audit
  - Data cleanup
  - Denormalization / index yardimcilari

---

## 4) Veritabani Mimarisi (Firestore)

Asagida hedef koleksiyon seti yer alir.

### 4.1 Users

`users/{uid}`

- uid (doc id)
- displayName
- email
- phone
- avatarUrl
- roles: `{ admin: boolean, moderator: boolean }`
- isActive
- createdAt
- updatedAt
- lastLoginAt

Kural:
- Kullanici kendi profilini okuyabilir/guncelleyebilir.
- Admin tum profilleri okuyabilir.

---

### 4.2 Ikinci El CNC Ilanlari

`ads/{adId}`

- title
- slug
- categoryId
- brandId
- modelId
- year
- price
- currency (`TRY`)
- cityId
- districtId
- description
- images: `string[]` (download URLs)
- imagePaths: `string[]` (Storage path cleanup icin)
- ownerId
- ownerName
- status (`draft | pending | needs_revision | published | rejected | archived`)
- isFeatured
- viewCount
- createdAt
- updatedAt
- publishedAt

Kural:
- Read: public (`published` olanlar)
- Write: authenticated + `ownerId == request.auth.uid`
- Status degisikligi `pending -> published/rejected` yalniz moderator/admin

---

### 4.3 Teknik Servis Ilanlari

`technical_service_listings/{listingId}`

- slug
- name
- title
- cityId
- districtId
- phone
- yearLabel
- expertiseTags: `string[]`
- description
- images
- imagePaths
- ownerId
- ownerName
- status
- createdAt
- updatedAt
- publishedAt

Kurallar `ads` ile ayni sahiplik modelini izler.

---

### 4.4 Yedek Parca Firma Ilanlari

`spare_part_listings/{listingId}`

- slug
- name
- title
- cityId
- districtId
- phone
- expertiseTags
- description
- images
- imagePaths
- ownerId
- ownerName
- status
- createdAt
- updatedAt
- publishedAt

---

### 4.5 Kariyer / Is Ilanlari

`job_listings/{jobId}`

- slug
- title
- company
- locationText
- cityId
- districtId
- workModel
- level
- salaryMin
- salaryMax
- currency
- description
- responsibilities: `string[]`
- requirements: `string[]`
- images
- imagePaths
- ownerId
- ownerName
- status
- createdAt
- updatedAt
- publishedAt

Not:
- `postedAt` gorunumu UI tarafinda `createdAt/publishedAt` ile formatlanmali; string olarak kalici tutulmamali.

---

### 4.6 CNC Marka / Model Referans Verisi (Admin yonetimli)

> Kullanici istegi: marka-model farkli tablo olmali ve admin paneli ile sonradan yonetilecek.

`machine_brands/{brandId}`

- name
- slug
- isActive
- sortOrder
- createdAt
- updatedAt

`machine_brands/{brandId}/models/{modelId}`

- name
- slug
- isActive
- sortOrder
- createdAt
- updatedAt

Alternatif (query kolayligi):
- `machine_models/{modelId}` global koleksiyon + `brandId` alanı

Kural:
- Read: public
- Write: admin only

---

### 4.7 Kategori ve Lokasyon Referans Verisi

`categories/{categoryId}`
- name, slug, type, isActive, sortOrder

`cities/{cityId}`
- name, plateCode, isActive

`cities/{cityId}/districts/{districtId}`
- name, isActive

Kural:
- Read public, write admin

---

### 4.8 Destekleyici Koleksiyonlar

`favorites/{uid}/items/{listingKey}`
- listingType
- listingId
- createdAt

`reports/{reportId}`
- listingType
- listingId
- reason
- note
- reporterId
- status
- createdAt

`audit_logs/{logId}`
- actorId
- action
- targetType
- targetId
- before
- after
- createdAt

---

## 5) Storage Mimarisi

### 5.1 Bucket klasor yapisi

- `ad-images/{uid}/{adId}/{file}`
- `technical-service-images/{uid}/{listingId}/{file}`
- `spare-part-images/{uid}/{listingId}/{file}`
- `job-listing-images/{uid}/{jobId}/{file}`
- `avatars/{uid}/{file}`

### 5.2 Storage kurallari (mantik)

- Read: public image alanlari icin acik (veya tokenli URL tercihine gore kisitli)
- Write:
  - `request.auth != null`
  - path icindeki `uid == request.auth.uid`
  - `contentType` `image/*`
  - dosya boyutu limiti (or. 5MB)

### 5.3 Operasyon

- Ilan silindiginde Firestore dokumandaki `imagePaths` uzerinden dosyalar temizlenir (Cloud Function/cron).
- Kullanici silme talebi fiziksel delete yerine `status = archived` + `deletedAt` ile isaretlenir.
- `archived` kayitlar **6 ay** sonra zamanlanmis cleanup goreviyle fiziksel olarak silinir.
- Upload tarafinda gorseller yukleme oncesi optimize edilir (boyut dusurme + max dimension), kalite kaybi minimumda tutulur.

---

### 5.4 Kimlik ve Rol Notu

- Firestore Rules tarafinda admin kontrolu icin yalnizca `users/{uid}` belgesine guvenmek risklidir.
- Oneri: admin/moderator yetkileri Firebase Custom Claims ile verilsin.
- `users/{uid}.roles` alani UI goruntuleme amacli tutulabilir; yetki karari icin tek kaynak Custom Claims olsun.

---

## 6) Guvenlik Kurallari (Firestore Rule Mantigi)

Temel prensipler:

- Public read sadece `status == "published"` belgelerde
- Authenticated users:
  - create: kendi `ownerId`
  - update/delete: yalnizca `resource.data.ownerId == request.auth.uid`
  - own read: kullanici kendi ilanlarini status fark etmeksizin okuyabilir (`ownerId == request.auth.uid`)
- Admin/Mediator (Custom Claims):
  - tum listing koleksiyonlarinda tam yonetim
  - status moderation (`pending -> published | rejected | needs_revision`)
  - referans data yonetimi

Ornek pseudo-rule yaklasimi:

- `isSignedIn()`
- `isOwner(resource)`
- `isAdmin()`
- `isPublished(resource)`
- `validAdCreate(request.resource.data)`
- `validAdUpdate(request.resource.data, resource.data)`

---

## 7) Akislar (End-to-End)

### 7.1 Ilan Gorme Akisi (Giris gerekmez)

1. Kullanici liste sayfasina girer.
2. Query `status = published` + filtreler ile cekilir.
3. Detay sayfasi sadece yayinlanmis belgeyi gosterir.
4. Goruntulenme sayisi gerekiyorsa aggregate/queue ile artirilir.

### 7.2 Ilan Verme Akisi (Giris zorunlu)

1. Kullanici forma gider.
2. Oturum yoksa login/kayit ekranina yonlendirme.
3. Form dogrulama (zorunlu alan, tip/limit kontrolleri).
4. Gorseller Storage'a yuklenir.
5. Firestore kaydi varsayilan olarak `status = pending` ile olusur.
6. Basari: `Ilanlarim` ve detay/yonetim ekranina donus.

### 7.3 Admin Moderasyon Akisi

1. Admin panel `status = pending` olanlari listeler.
2. Inceleme -> `published` / `rejected` / `needs_revision`.
3. `needs_revision` seceneginde admin duzeltme notu birakir.
4. Islem `audit_logs` a yazilir.

### 7.4 Marka/Model Yonetim Akisi

1. Admin yeni marka ekler (`machine_brands`).
2. Markaya bagli model ekler (`models` subcollection).
3. Ilan formunda secilebilir listeler olarak gelir.

---
### 7.5 Ilanlarim ve Revizyon Akisi

1. Kullanici `Ilanlarim` ekraninda kendi tum ilanlarini status bazli gorur.
2. `needs_revision` ilanda admin notu gorulur.
3. Kullanici alanlari gunceller ve tekrar `pending`e gonderir.
4. Admin tekrar inceleyip `published` veya `rejected` karari verir.

---

## 8) Index ve Query Plani

Ornek composite index ihtiyaclari:

- `ads`: `(status ASC, createdAt DESC)`
- `ads`: `(status ASC, cityId ASC, createdAt DESC)`
- `ads`: `(status ASC, categoryId ASC, createdAt DESC)`
- `technical_service_listings`: `(status ASC, cityId ASC, createdAt DESC)`
- `spare_part_listings`: `(status ASC, cityId ASC, createdAt DESC)`
- `job_listings`: `(status ASC, cityId ASC, createdAt DESC)`
- `job_listings`: `(status ASC, level ASC, createdAt DESC)`

Not: Firestore hata mesajlarindan cikan index linkleriyle tamamlanir.

---

## 9) Operasyonel Backend Yapisi

- **Cloud Functions (onerilen)**
  - `onCreate listing`: slug uniq kontrolu / normalize
  - `onDelete listing`: storage cleanup
  - `scheduled cleanup`: archived/deleted belgeler
  - `moderation hooks`: (opsiyonel) otomatik spam kontrol
- **Logging ve Audit**
  - Her kritik state degisimi `audit_logs`
- **Backups**
  - Firestore export schedule
- **Error Monitoring**
  - Frontend + function hatalari (Sentry vb.)

---

## 10) Kod Mimarisi Onerisi (Proje Icinde)

- `src/services/` icinde domain bazli servisler:
  - `adService`, `marketplaceListingService`, `jobListingService`, `brandModelService`
- `src/lib/firestore/` yalniz CRUD/query adapter
- `src/lib/validators/` zod schema
- `src/lib/auth/roles.ts` rol yardimcilari
- `src/lib/constants/` referans enumlar

---

## 10.1 Firebase Baslangic Dosyalari (Omurga Cekirdegi)

Asagidaki 3 dosya omurganin teknik baslangic setidir ve Firebase baglanti asamasinda ilk olusturulacak dosyalardir:

- `firestore.rules`
  - Public read + owner write + admin/moderator full yönetim mantigi
  - `published` / `pending` / `needs_revision` akisina gore kural ayrimi
  - `ownerId` degistirme korumasi
- `storage.rules`
  - Sadece authenticated yukleme
  - Path-uid eslesmesi (`uid == request.auth.uid`)
  - `image/*` ve boyut limiti kontrolu
- `firestore.indexes.json`
  - Listeleme ve filtre queryleri icin gerekli composite indexlerin kaynak dosyasi

Not: Bu 3 dosya olmadan production guvenligi ve query performansi garanti edilemez.

---

## 10.2 Firebase Hosting (Next.js / SSR)

Bu repo klasik statik `public/` Hosting ile degil, **`hosting.source` + web frameworks** akisi ile yayinlanir (Firebase CLI Next build ve SSR backend hazirlar).

### Onceden gerekenler

- Firebase projesi (`cnc-dunyam`) secili (`.firebaserc`).
- Genelde **Blaze** faturalama ve SSR/backend kotasi (Hosting frameworks gerektirir).
- Firebase Console’da **Authentication**, **Firestore**, **Storage** ihtiyaca gore acilmis olmali.

### Tek seferlik CLI ayari

```bash
npm run firebase:enable-webframeworks
```

(`webframeworks` deneyi acilmadan deploy hata verir.)

### Production ortam degiskenleri

- Yerel makineden deploy ederken `next build` sirasinda degiskenler gerekir.
- Ornek sablon: `.env.production.example` → kopyala `.env.production` (gitignore’da, commitlenmez).
- `NEXT_PUBLIC_*` istemci Firebase SDK icin zorunlu.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` sunucu tarafi okumalari icin gerekiyorsa (Admin SDK) deploy ortamina da verilmeli.

### Deploy

```bash
npm run deploy:hosting
```

Ilk deney acik ise sadece:

```bash
npm run deploy
```

### Bolge

`firebase.json` icinde `frameworksBackend.region` su an `europe-west1`. Degistirmek icin bu dosyayi duzenle.

### Kontrol

Yayin sonrasi: Firebase Console → Hosting → URL (`*.web.app` / ozel domain).

### Deploy sorun giderme

**Node surumu (`firebase-frameworks` EBADENGINE / beklenmedik hatalar)**

- Yerel Node **24+** ise framework paketi resmen desteklemiyor (`^16 || ^18 || ^20 || ^22`). **`Failed to list functions`** hatasini da tetikleyebilir; deploy bu surumlerden biriyle yapilmali.
- Repoda `.nvmrc` → **22**. `nvm` yoksa (Mac + Homebrew ornegi):

```bash
brew install fnm
eval "$(fnm env)"
cd /path/to/galeri-dunyasi
fnm install
fnm use
node -v   # v22.x olmali
npm install
npm run deploy
```

  Kabukta kalici icin `fnm env` satirini `~/.zshrc` icine eklemen gerekir (`brew info fnm` metnine bak).

- `package.json` icinde `engines.node` uyari icin sinirlidir.

**esbuild uyarısı (`Global esbuild version ... does not match ^0.19.2`)**

- Projede `esbuild` **^0.19.2** ile sabitlendi; `npm install` sonrasi uyari azalmali. Hâlâ “global esbuild” diyorsa PATH’te global paket var demektir; deploy icin projede `node_modules/.bin` oncelikli calissin yeter.

**`Error: Failed to list functions for <proje>`**

1. Yukaridaki gibi **Node 22** ile tekrar dene.
2. Firebase projesi **Blaze** olmali (Console → Project settings → Usage and billing).
3. Ayni GCP projesinde (`cnc-dunyam`) suralari **Enable** et (dogrudan linkler; giris sonrasi “Enable”):
   - [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=cnc-dunyam)
   - [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=cnc-dunyam)
   - [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=cnc-dunyam)
4. Kimlik: `firebase logout` → `firebase login` (projeye yetkili hesap).
5. Tanı koymak icin: `npx firebase functions:list --debug` — HTTP status / govde genelde eksik API veya billing’i gosterir.
6. Deploy log’u: `npx firebase deploy --only hosting --debug`.

**`webframeworks is not enabled`**

- `npm run firebase:enable-webframeworks` veya dogrudan `npm run deploy` (script icinde deney acilir).

---

## 11) Fazli Uygulama Plani (Roadmap)

### Faz 1 - Guvenlik ve Veri Standardi
- [x] `firestore.rules`, `storage.rules`, `firestore.indexes.json` dosyalari (repoda)
- [x] Firestore rules (userId/sahiplik, status akisi, custom claims admin/mod)
- [x] Storage rules (auth + path uid + image/* + 5MB)
- Tum create/update akislari `ownerId`, `status`, `serverTimestamp` ile standardize et
- `users/{uid}` profilini auth sonrasi otomatik upsert et

### Faz 2 - Listelemeleri Gercek Veriye Baglama
- `/ilanlar` -> `ads`
- `/kategori/teknik-servis` -> `technical_service_listings`
- `/kategori/yedek-parca` -> `spare_part_listings`
- `/kariyer` -> `job_listings`
- Mock fallbackleri sadece local/dev moduna indir

### Faz 3 - Referans Veri ve Marka/Model
- `machine_brands` + `models` koleksiyonlarini ac
- Formlarda dinamik marka/model secimi
- Admin role mantigi (Custom Claims) altyapisi

### Faz 4 - Moderasyon + Operasyon
- pending/published/rejected/needs_revision akisini aktiflestir
- audit log + report + favorites
- Cloud Functions cleanup

---

## 12) Yapilacaklar Listesi (Checklist)

> Bu liste omurga takip listesi olarak kullanilabilir. `[x]` yapildi, `[ ]` bekliyor.

### 12.1 Simdiye kadar yapilanlar

- [x] Firebase Hosting framework yapilandirmasi (`firebase.json`, `.firebaserc`, deploy scriptleri)
- [x] Auth sayfalari (giris/kayit) ve Google sign-in entegrasyonu
- [x] Ikinci el / teknik servis / yedek parca / kariyer ilan form ekranlari
- [x] Firestore write servisleri (temel seviyede)
- [x] Storage image upload servisi (temel seviyede)
- [x] Yukleme oncesi istemci tarafi gorsel optimizasyonu (max dimension + kalite odakli sikistirma)
- [x] Ilan-ver akislari icin rota yapisi
- [x] Ilk `firestore.rules` / `storage.rules` / `firestore.indexes.json`; ilanlar `status: pending` ile olusur; `/ilanlar` sorgusu `status == published`

### 12.2 Kritik bekleyenler (omurga)

- [x] Rules dosyalari repoda guncel; deploy komutu tanimli (`npm run firebase:deploy:rules`)
- [ ] Firestore rules icin dev/prod projesi ayri mi karari (simdilik tek proje)
- [ ] Tum listing koleksiyonlarina `publishedAt` ve tam status yonetimi (moderasyon / yayin ani) - alanlar var, admin UI bekleniyor
- [x] Yeni ilan yazimlarinda `createdAt` + `updatedAt` icin `serverTimestamp()` (ads, marketplace, job_listings)
- [x] `users/{uid}` otomatik upsert (`useAuth` + Auth kullanici bilgisi; giris/oturum yenilemede `lastLoginAt`)
- [x] `Ilanlarim` sayfasi (owner bazli tum statuslar)
- [ ] `needs_revision` admin notu + ilan duzeltme/tekrar gonderme akisi (not gosterimi var; tam edit-submit UI bekleniyor)
- [x] Semayi dokumandaki `ownerId` ile hizala (rules + yazim ownerId, eski userId icin backward-compat)
- [ ] Eski kayitlar icin `ownerId` migration scriptini calistir (`npm run ops:migrate-ownerid`)
- [x] `/ilanlar` sayfasini hardcoded yerine Firestore listesine bagla
- [x] Teknik servis/yedek parca liste+detay sayfalarini Firestore'a bagla
- [x] Kariyer liste sayfasini Firestore'a bagla
- [x] `postedAt` string yerine tarih tabanli formatlama (createdAt fallback)

### 12.3 Marka/Model altyapisi

- [ ] `machine_brands` koleksiyonunu olustur
- [ ] `machine_brands/{brandId}/models` alt koleksiyonunu olustur
- [ ] Formlarda marka secimine gore model dropdown akisi
- [ ] Admin-only write kurali (simdilik backend mantigi)

### 12.4 Operasyon ve kalite

- [x] Composite indexler tanimli (`firestore.indexes.json`) + deploy komutu mevcut
- [x] Soft delete + archive akisi (`status = archived`, `deletedAt`, kullanici “Sil (6 ay sonra)”)
- [x] Cloud Function: listing silinince Storage temizligi
- [ ] Audit log kaydi
- [ ] Raporlama/sikayet mekanizmasi (`reports`)
- [ ] Favorites altyapisi
- [ ] Test plani (unit + integration + rule tests)
- [x] Ops cekirdegi: `functions/` altinda 6 ay arsiv cleanup + hard-delete storage cleanup triggerlari

---

## 13) Net Is Kurali Ozeti (Senin verdigin onceliklere gore)

- **Kural 1:** Giris yapmadan herkes ilanlari gorur.
- **Kural 2:** Giris yapmadan hic kimse ilan veremez (tum kategorilerde gecerlidir).
- **Kural 3:** CNC marka/model referans verisi ayri koleksiyondadir ve yalniz admin tarafindan yonetilir.
- **Kural 4:** Tum listing tipleri ortak guvenlik standardina baglidir (owner + status + timestamp).
- **Kural 5:** Bu belgeye gore ilerleyen tum backend degisiklikleri checklist ile takip edilir.
- **Kural 6:** Admin/Moderator tum DB yonetim islemlerini Custom Claims uzerinden yapar; `needs_revision` akisi zorunlu olarak desteklenir.

---

## 14) Son Not

Bu plan, mevcut frontend akislarini bozmadan Firebase uzerinde adim adim saglam bir backend omurgasi kurman icin hazirlandi. Bir sonraki adim olarak onerim:

1. Rules dosyalarini yazmak,
2. `/ilanlar` + `/kategori/*` + `/kariyer` sayfalarini gercek Firestore listelerine baglamak,
3. Marka/model referans koleksiyonlarini acmak.

Bu 3 adimdan sonra proje "tasarim prototipi"nden "uretim mimarisine" gecmis olur.
