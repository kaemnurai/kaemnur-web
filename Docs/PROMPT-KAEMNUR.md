# Prompt Kaemnur — Edge Functions & Dashboard Integration

Baca docs/API-CONTRACT.md untuk spesifikasi lengkap endpoint.

Saya perlu menambahkan dua Edge Function dan satu integrasi UI di project Kaemnur (Next.js + Supabase) untuk mendukung produk baru KaemForm.

## 1. Edge Function: generate-launch-token

Lokasi: supabase/functions/generate-launch-token/index.ts

- Authenticated endpoint (cek JWT dari header Authorization via Supabase)
- Ambil user data dari auth.users (id, email, user_metadata.name, user_metadata.avatar_url)
- Query tabel licenses: cari row dengan user_id = auth uid, product = 'kaemform' dan product = 'kaemform_storage', yang expires_at > now()
- Tentukan license type: pro > trial > free (lihat logic di docs/API-CONTRACT.md)
- Generate JWT dengan jose library (`https://deno.land/x/jose@v5.2.0/index.ts`):
  - Payload sesuai docs/API-CONTRACT.md "Token payload"
  - Sign HMAC-SHA256 dengan env LAUNCH_TOKEN_SECRET
  - Expiry 60 detik
- Return: `{"token": "...", "redirect_url": "https://form.kaemnur.com/auth/callback"}`
- CORS: allow origin https://kaemnur.com
- Jika tabel licenses belum ada atau strukturnya berbeda dari asumsi (id, user_id, product, type, metadata, expires_at, created_at), sesuaikan query dan tanya saya.

## 2. Edge Function: check-license

Lokasi: supabase/functions/check-license/index.ts

- NOT authenticated via Supabase Auth — ini server-to-server
- Proteksi: header x-api-key harus cocok dengan env KAEMFORM_API_KEY, tolak 401 jika tidak
- Terima query param: email ATAU kaemnur_uid
- Lookup user di auth.users (gunakan supabase service_role client, bypass RLS)
- Jika tidak ditemukan: return `{"found": false}`
- Jika ditemukan: query licenses sama seperti generate-launch-token, return response sesuai docs/API-CONTRACT.md "Check License Response"
- CORS: allow origin https://form.kaemnur.com

## 3. Env Secrets

Set di Supabase Dashboard → Edge Functions → Secrets:
- LAUNCH_TOKEN_SECRET (shared secret, minimal 32 char)
- KAEMFORM_API_KEY (random string, minimal 32 char)

## 4. Dashboard Integration

Di halaman produk KaemForm, tambahkan card Masuk KaemForm:

- Card dengan icon/logo placeholder, deskripsi: "Buat formulir online — absensi, survei, registrasi, dan lainnya."
- Jika user punya lisensi kaemform aktif:
  - Tampilkan status: "Pro — berlaku hingga {tanggal}"
  - Tombol "Buka KaemForm" → panggil `supabase.functions.invoke('generate-launch-token')` → redirect ke `${data.redirect_url}?token=${data.token}`
  - Loading state + error handling (toast)
- Jika tidak punya lisensi:
  - Tombol "Coba Gratis 14 Hari" atau "Beli Lisensi" → arahkan ke halaman pembelian
- Sesuaikan dengan design system Kaemnur yang sudah ada. Jangan ubah komponen lain.
