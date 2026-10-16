# 🌊 Oleh Oleh Khas Jepara Jeha

Aplikasi Web Terpadu: **Marketplace Pelanggan & Point of Sale (PoS) Administrasi Toko** untuk toko fisik dan daring **Oleh Oleh Khas Jepara Jeha**.

---

## 📌 Identitas Resmi Toko
- **Nama Toko:** Oleh Oleh Khas Jepara Jeha
- **Alamat Fisik:** Jl. KH. Moliki, Pengkol VII, Pengkol, Kec. Jepara, Kabupaten Jepara, Jawa Tengah 59415
- **Jam Buka Operasional:** Mulai Pukul 07.00 WIB (Asia/Jakarta)
- **Rekening Resmi Toko:**
  - BCA: `8210987654` a.n. *Oleh Oleh Khas Jepara Jeha*
  - Bank Jateng: `2001099887` a.n. *Oleh Oleh Khas Jepara Jeha*

---

## 🎨 Palet Identitas Visual Jepara
- **Dark Green (`jeha-dark`):** `#0A3323` — Karakter tegas, elegan, dan menenangkan.
- **Moss Green (`jeha-moss`):** `#839958` — Kesegaran alam & rempah tradisional.
- **Beige (`jeha-beige`):** `#F7F4D4` — Nada hangat, ramah khas pesisir Jepara.
- **Rosy Brown (`jeha-rose`):** `#D3968C` — Nuansa kayu ukir dan tanah liat.
- **Midnight Green (`jeha-midnight`):** `#105666` — Kedalaman laut utara Jawa.

---

## 🛠️ Arsitektur & Teknologi
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Bahasa:** TypeScript 5
- **Styling:** Tailwind CSS v4 & Lucide Icons
- **Backend / Database:** Firebase Authentication, Cloud Firestore (Atomic Transactions), Firebase Storage
- **Platform Deployment:** Netlify (via `@netlify/plugin-nextjs`)

---

## 🚀 Fitur Unggulan Sistem

### 1. Marketplace Pelanggan (Publik)
- **Katalog & Navigasi Cerdas:** Filter kategori, pencarian instan nama & SKU, badge ketersediaan stok riil.
- **Detail Produk Otentik:** Galeri gambar, informasi detail, batas pesanan sesuai stok riil.
- **Keranjang & Checkout:**
  - Pilihan metode pemenuhan: *Ambil di Toko (Pickup Gratis)* vs *Ekspedisi Kurir (JNE/J&T/Pos)*.
  - Reservasi stok atomik dengan batas waktu pembayaran **1 Jam** (`expiresAt`).
- **Riwayat & Detail Pesanan:**
  - Countdown timer 1 jam dengan auto-cancel jika kedaluwarsa.
  - Pembatalan mandiri sebelum pembayaran yang otomatis mengembalikan stok produk tepat 1 kali.
- **Upload Bukti Bayar:** Pelanggan dapat mengunggah bukti transfer (BCA/Bank Jateng) atau QRIS.
- **Halaman Informasi Toko:** Alamat lengkap di Pengkol Jepara, jam operasional 07.00 WIB, tombol direct link Google Maps resmi Jeha.

### 2. Dashboard Administrasi & Back-Office
- **Dashboard Ringkasan Eksekutif:** Statistik penjualan, pesanan masuk, nilai inventaris, dan produk stok menipis.
- **Manajemen Produk & Kategori:** CRUD lengkap, upload gambar, arsip status, pencegahan duplikasi SKU.
- **Inventaris & Audit Trail Stok:**
  - Banner peringatan stok menipis (*Low stock alert*).
  - Mutasi stok atomik Firestore (`adjustStockAtomic`) dengan log riwayat lengkap (`inventoryMovements`).
- **Manajemen Pesanan:** Pemantauan status multi-kanal, verifikasi pesanan, input nomor resi pengiriman kurir.
- **Verifikasi Pembayaran 1-Klik:** Galeri bukti transfer, preview foto bukti bayar resolusi tinggi, tombol setujui/tolak dengan alasan.
- **Point of Sale (Kasir Digital):**
  - Pencarian cepat nama produk / barcode / SKU.
  - Kalkulator uang tunai & kembalian otomatis.
  - Pilihan pembayaran: Tunai, QRIS, Transfer Langsung.
  - Pemotongan stok toko seketika dan cetak struk kasir termal resmi (`window.print()`).
- **Laporan Penjualan & Analitik:**
  - Hanya menghitung omzet dari transaksi yang benar-benar terealisasi (`COMPLETED`).
  - Pemisahan data omzet: Kasir Fisik (PoS) vs Marketplace Online.
  - Ekspor laporan pembukuan ke format CSV.
- **Data Pelanggan:** Daftar profil akun terdaftar beserta histori belanja.
- **Pengaturan Toko:** Konfigurasi alamat, Google Maps, jam operasional, rekening bank resmi, dan ambang batas stok.

---

## 💻 Panduan Menjalankan Secara Lokal

### 1. Kloning & Instalasi Dependensi
```bash
git clone <repository-url>
cd oleh-oleh-jpr-app
npm install
```

### 2. Konfigurasi Kunci Lingkungan (Environment Variables)
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Isi variabel dengan kredensial proyek Firebase Console Anda:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

### 4. Akun Demo & Uji Coba Cepat (1-Click)
Pada halaman login ([`/login`](http://localhost:3000/login)), tersedia fitur **Akses Cepat Demo (1-Klik)** yang dapat langsung digunakan tanpa mengetik:
- 👑 **Administrator:** `admin.demo@jeha.id` (Kata Sandi: `password123`) &rarr; Dashboard Admin, Manajemen Stok & Verifikasi Bayar
- 🏪 **Kasir Toko (PoS):** `kasir.demo@jeha.id` (Kata Sandi: `password123`) &rarr; Kasir Digital PoS & Cetak Struk
- 🛍️ **Pelanggan:** `pelanggan.demo@jeha.id` (Kata Sandi: `password123`) &rarr; Belanja Marketplace & Checkout

*Catatan: Sistem secara otomatis mendaftarkan akun ke Firebase Auth dan Firestore (self-seeding) jika akun demo belum ada.*

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## 🔒 Aturan Keamanan Database & Penyimpanan

Aturan keamanan telah dirancang secara khusus untuk mencegah modifikasi tidak sah dan menjamin integritas buku besar:
- **`firestore.rules`:** Menjamin isolasi data pesanan antar-pelanggan, read-only katalog bagi publik, akses mutasi stok & pesanan hanya untuk staf/admin, serta status *immutable* bagi riwayat mutasi stok (`inventoryMovements`) dan jurnal kas (`transactions`).
- **`storage.rules`:** Membatasi unggahan berkas bukti transfer hanya untuk format gambar dengan ukuran maksimum 5MB.

---

## 🌐 Panduan Deployment ke Netlify

1. Proyek ini sudah dilengkapi dengan berkas [netlify.toml](file:///c:/Users/ASUS/Documents/Bootcamp%20Web%20Pro%20PLAN/oleh-oleh-jpr-app/oleh-oleh-jpr-app/netlify.toml) yang telah dikonfigurasi untuk Next.js App Router.
2. Hubungkan repositori GitHub ini ke dashboard [Netlify](https://app.netlify.com/).
3. Pada menu **Site Configuration > Environment Variables**, tambahkan seluruh variabel dari `.env.example`.
4. Netlify akan secara otomatis mengeksekusi build dan menyajikan aplikasi secara global dengan plugin `@netlify/plugin-nextjs`.

---

© 2026 **Oleh Oleh Khas Jepara Jeha**. Hak Cipta Dilindungi Undang-Undang.
