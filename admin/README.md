# Admin Panel

Bu klasor ana uygulamadan ayri calisan admin uygulamasidir.

## Kurulum

1. `npm --prefix admin install`
2. `admin/.env.local` dosyasina Firebase `NEXT_PUBLIC_FIREBASE_*` degiskenlerini ekle.
3. Admin girisine izin verilecek e-postalari ekle:

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin1@mail.com,admin2@mail.com
```

## Calistirma

- Repo kokunden: `npm run dev:admin`
- Veya admin klasorunden: `npm run dev`

Varsayilan port: `3001`
