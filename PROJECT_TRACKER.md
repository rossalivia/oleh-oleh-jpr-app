# PROJECT TRACKER: OLEH OLEH KHAS JEPARA JEHA

**Sistem Terpadu Marketplace & Point of Sale (PoS)**

---

## 📌 Ringkasan Status Proyek

- **Status Saat Ini:** ✅ SELESAI (100% Completed & Siap Rilis)
- **Checkpoint Aktif:** Checkpoint 9 — Pengujian Akhir & Deployment
- **Zona Waktu Sistem:** Asia/Jakarta (WIB)
- **Identitas Toko:** Oleh Oleh Khas Jepara Jeha (Jl. KH. Moliki, Pengkol VII, Pengkol, Kec. Jepara, Jawa Tengah 59415)

---

## 🗺️ Matriks Pelacak Checkpoint (Checklist Utama)

| No             | Checkpoint                           |          Status          | Keterangan & Modul Utama                                                                                                                                 |
| -------------- | ------------------------------------ | :----------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CP-1** | **Analisis dan Perencanaan**   |        ✅ Selesai        | Analisis kebutuhan, RBAC, state machine, aturan stok, 18 skenario pengujian, kesepakatan timeout 1 jam & pengiriman.                                     |
| **CP-2** | **Fondasi Proyek**             |        ✅ Selesai        | Setup Next.js App Router, TypeScript, Tailwind CSS tema Jepara, modul Firebase (Auth, Firestore, Storage), Context RBAC, layout Navbar/Footer & Sidebar. |
| **CP-3** | **Produk dan Kategori**        |        ✅ Selesai        | CRUD produk & kategori, integrasi upload Firebase Storage, pencegahan SKU duplikat, validasi harga & stok, seed 12 produk khas Jepara.                   |
| **CP-4** | **Inventaris & Mutasi Stok**   |        ✅ Selesai        | Pelacakan stok real-time, audit trail mutasi (`inventoryMovements`), peringatan stok menipis (*low stock alert*).                                    |
| **CP-5** | **Marketplace & Alur Pesanan** |        ✅ Selesai        | Halaman Beranda, Katalog, Detail Produk, Keranjang, Checkout dengan validasi sisi server, status pesanan, pembatalan pelanggan & timeout.                |
| **CP-6** | **Pembayaran & Verifikasi**    |        ✅ Selesai        | Instruksi transfer bank/QRIS toko, upload slip transfer pelanggan, antarmuka 1-klik verifikasi/penolakan oleh Admin.                                     |
| **CP-7** | **Point of Sale (Kasir)**      |        ✅ Selesai        | Pencarian cepat produk, kalkulator kasir, transaksi instan, cetak/simpan struk belanja, integrasi stok langsung.                                         |
| **CP-8** | **Laporan & Pengaturan Toko**  |        ✅ Selesai        | Dashboard statistik riil, grafik omzet harian/mingguan, laporan transaksi (PoS vs Online), panel Pengaturan Toko Jeha.                                   |
| **CP-9** | **Pengujian & Deployment**     |        ✅ Selesai        | Eksekusi seluruh uji skenario bisnis, audit keamanan Firestore Rules, validasi build produksi, konfigurasi deployment Netlify.                           |

---

## 📋 Rincian Tugas Checkpoint 9 (Pengujian Akhir & Deployment)

- [x] **CP9.1 Audit & Pengetatan Aturan Keamanan Database (`firestore.rules`)**
  - [x] Proteksi role RBAC (`isAdmin()`, `isStaff()`, `isOwner()`).
  - [x] Akses katalog publik terbuka (read-only untuk pengunjung umum).
  - [x] Isolasi kepemilikan pesanan (pelanggan hanya dapat melihat pesanannya sendiri).
  - [x] Buku besar/jurnal transaksi (`transactions`) dan audit mutasi stok (`inventoryMovements`) berstatus *immutable* (tidak dapat diubah/dihapus siapapun).
- [x] **CP9.2 Aturan Keamanan Media Penyimpanan (`storage.rules`)**
  - [x] Upload bukti transfer terbatas bagi pengguna terautentikasi (format gambar saja, ukuran maksimum 5MB).
  - [x] Upload foto produk dibatasi hanya untuk staf/admin toko.
- [x] **CP9.3 Konfigurasi Deployment Netlify (`netlify.toml`)**
  - [x] Konfigurasi build plugin `@netlify/plugin-nextjs` untuk Next.js App Router.
  - [x] Penerapan header keamanan HTTP modern (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- [x] **CP9.5 Matriks Validasi 20 Skenario Pengujian Bisnis (TC-01 s/d TC-20)**
  - [x] Validasi seluruh 20 skenario uji bisnis yang ditetapkan pada Checkpoint 1 (Stok atomik, Timeout 1 jam, POS receipt, RBAC, Laporan Omzet, dsb.).
- [x] **CP9.6 Fitur Akses Cepat Akun Demo (1-Click Fast Login)**
  - [x] Tombol 1-klik di `/login` untuk Administrator, Kasir PoS, dan Pelanggan tanpa perlu mengetik manual.
  - [x] Mekanisme self-seeding otomatis (Firebase Auth & Firestore role synchronization).

---

## 📋 Rincian Tugas Checkpoint 8 (Laporan & Pengaturan Toko)

- [x] **CP8.1 Layanan Agregasi Penjualan & Ekspor CSV (`reportService`)**
  - [x] Agregasi omzet terealisasi (hanya `status: 'COMPLETED'`).
  - [x] Pemisahan omzet & jumlah transaksi: Kasir PoS vs Marketplace Online.
  - [x] Perhitungan rata-rata nilai keranjang (AOV) dan produk terlaris (*Top Selling*).
  - [x] Generator file CSV untuk ekspor rekonsiliasi kas pembukuan.
- [x] **CP8.2 Antarmuka Laporan Penjualan (`/admin/laporan`)**
  - [x] Kartu KPI finansial, filter rentang waktu (Hari ini, 7 hari, 30 hari, semua), tabel produk terlaris, tombol download CSV.
- [x] **CP8.3 Riwayat Transaksi Gabungan (`/admin/transaksi`)**
  - [x] Log transaksi selesai (PoS + Online), filter saluran & metode bayar, modal detail struk transaksi.
- [x] **CP8.4 Data Pelanggan Back-Office (`/admin/pelanggan`)**
  - [x] Tabel akun terdaftar (nama, email, no hp, role, tanggal registrasi).
- [x] **CP8.5 Layanan & Antarmuka Pengaturan Toko (`settingsService` & `/admin/pengaturan`)**
  - [x] Form konfigurasi resmi: Nama toko, Alamat Pengkol Jepara, Google Maps resmi, jam buka 07.00 WIB, rekening transfer resmi toko (BCA & Bank Jateng), kebijakan timeout 1 jam, dan batas stok minimum default.

---

## 📋 Rincian Tugas Checkpoint 6 (Pembayaran & Verifikasi)

- [x] **CP6.1 Layanan Pembayaran & Verifikasi Atomik (`paymentService`)**
  - [x] Fungsi `approvePayment`: Ubah status pembayaran ke `VERIFIED`, order ke `PAID`, buat transaksi omzet di `transactions`.
  - [x] Fungsi `rejectPayment`: Tandai `REJECTED` dengan input alasan penolakan untuk pelanggan.
- [x] **CP6.2 Antarmuka Verifikasi Admin (`/admin/verifikasi-pembayaran`)**
  - [x] Galeri daftar slip transfer masuk, tab Perlu Verifikasi vs Semua Riwayat.
  - [x] Modal perbesar slip transfer, tombol Setujui (Valid) 1-klik dan Tolak Bukti.

---

## 📋 Rincian Tugas Checkpoint 7 (Point of Sale / Kasir Digital)

- [x] **CP7.1 Layanan Transaksi Kasir Atomik (`posService`)**
  - [x] Pemotongan stok fisik toko secara instan via `runTransaction`.
  - [x] Pencatatan audit mutasi stok `type: 'POS_SALE'`.
  - [x] Pembuatan record transaksi kasir `TRX-POS-YYYYMMDD-XXXX`.
- [x] **CP7.2 Antarmuka Kasir Toko Fisik (`/admin/pos`)**
  - [x] Pencarian cepat barcode/SKU/nama produk, filter kategori instan.
  - [x] Keranjang kasir fisik (tambah, atur qty, hapus).
  - [x] Pilihan metode pembayaran: Tunai (Cash), QRIS, Transfer langsung.
  - [x] Kalkulator uang tunai diterima & kembalian otomatis.
  - [x] Pratinjau & Cetak Struk Kasir Termal Resmi Toko (`window.print()`).

---

## 📋 Rincian Tugas Checkpoint 5 (Marketplace & Alur Pesanan)

- [x] **CP5.1 Halaman Katalog Belanja Publik (`/katalog`)**
  - [x] Filter kategori, pencarian teks, pengurutan harga/nama, kartu produk dengan badge stok riil.
- [x] **CP5.2 Halaman Detail Produk Otentik (`/produk/[slug]`)**
  - [x] Foto utama, info SKU, harga, stok fisik, counter kuantitas dengan batas stok, tombol Tambah Keranjang & Beli Sekarang.
- [x] **CP5.3 Keranjang Belanja Dinamis (`/keranjang`)**
  - [x] Pengaturan kuantitas, subtotal instan, kosongkan keranjang, persistensi local storage.
- [x] **CP5.4 Alur Checkout & Pembuatan Pesanan (`/checkout`)**
  - [x] Pilihan Ambil di Toko (Pickup Gratis) vs Ekspedisi Kurir (JNE/J&T/Pos).
  - [x] Penghitungan ulang harga di sisi server (`orderService`), reservasi stok atomik, batas bayar 1 jam (`expiresAt`).
- [x] **CP5.5 Riwayat & Detail Pesanan (`/pesanan` & `/pesanan/[id]`)**
  - [x] Filter status pesanan pelanggan.
  - [x] Countdown timer 1 jam dengan auto-cancel jika habis waktu.
  - [x] Tombol batalkan pesanan mandiri (mengembalikan stok produk tepat 1 kali).
- [x] **CP5.6 Manajemen Pesanan Back-Office Admin (`/admin/pesanan`)**
  - [x] Daftar pesanan masuk, filter kanal & status, modal perbarui status pengemasan / input nomor resi kurir.
- [x] **CP5.7 Halaman Informasi Toko (`/informasi-toko`)**
  - [x] Alamat Pengkol Jepara, jam buka 07.00 WIB, integrasi tombol Google Maps resmi Jeha.

---

## 📋 Rincian Tugas Checkpoint 3 (Produk & Kategori)

- [x] **CP3.1 Seeding Data Awal 12 Produk Khas Jepara**
  - [x] 8 Makanan: Horog-horog, Kacang oven, Kerupuk tengiri, Carang madu, Kopi Tempur, Tape Slagi, Terasi Jepara, Kerupuk kerapu.
  - [x] 4 Kerajinan: Tenun Troso, Miniatur ukiran, Gantungan kunci motif ukir, Suvenir kayu.
  - [x] 3 Kategori awal: Makanan Khas Jepara, Kerajinan & Suvenir, Oleh-Oleh Pilihan.
- [x] **CP3.2 Modul Master Data Kategori**
  - [x] Tabel kategori dengan urutan tampilan (`displayOrder`), status aktif, slug otomatis.
  - [x] Modal tambah dan edit kategori.
- [x] **CP3.3 Modul CRUD Produk & Validasi Ketat**
  - [x] Daftar produk lengkap dengan filter kategori, pencarian teks, dan status stok.
  - [x] Pencegahan SKU duplikat, validasi harga jual > 0, stok >= 0.
  - [x] Mekanisme arsip/nonaktifkan produk untuk menjaga integritas riwayat transaksi.
  - [x] Integrasi upload dan preview gambar (Firebase Storage + fallback).

---

## 📋 Rincian Tugas Checkpoint 4 (Inventaris & Mutasi Stok)

- [x] **CP4.1 Transaksi Atomik Mutasi Stok (`adjustStockAtomic`)**
  - [x] Penggunaan `runTransaction` Firestore untuk menjamin konsistensi stok dan mencegah race condition / stok negatif.
  - [x] Pencatatan otomatis ke koleksi `inventoryMovements`.
- [x] **CP4.2 Banner Peringatan Stok Rendah (*Low Stock Alert*)**
  - [x] Deteksi produk dengan sisa stok <= `lowStockThreshold` (default: 5 unit).
  - [x] Tombol restock langsung dari kartu peringatan.
- [x] **CP4.3 Audit Trail Riwayat Mutasi Stok**
  - [x] Tabel log mutasi: Waktu Asia/Jakarta, Produk & SKU, Tipe Mutasi, Delta Qty (+/-), Stok Sebelum → Sesudah, Alasan, Operator.
- [x] **CP4.4 Penyesuaian Cepat Stok (*Quick Stock Adjustment*)**
  - [x] Modal penyesuaian stok instan dengan input alasan wajib untuk keperluan audit.

---

## 📋 Rincian Tugas Checkpoint 2 (Fondasi Proyek)

- [x] **CP2.1 Scaffolding Next.js App Router**
  - [x] Inisialisasi Next.js 16 dengan TypeScript, Tailwind CSS v4, ESLint, dan App Router (`src/app`).
  - [x] Instalasi dependensi inti: `firebase`, `lucide-react`, `clsx`, `tailwind-merge`.
- [x] **CP2.2 Konfigurasi Desain Sistem & Tema Khas Jepara**
  - [x] Konfigurasi palet warna khusus pada `globals.css`:
    - `jeha-dark`: `#0A3323` (Dark Green)
    - `jeha-moss`: `#839958` (Moss Green)
    - `jeha-beige`: `#F7F4D4` (Beige)
    - `jeha-rose`: `#D3968C` (Rosy Brown)
    - `jeha-midnight`: `#105666` (Midnight Green)
  - [x] Pengaturan tipografi dan utility tokens di `globals.css` & `src/lib/utils.ts`.
- [x] **CP2.3 Konfigurasi Firebase SDK & Environment**
  - [x] Pembuatan `src/lib/firebase/config.ts` untuk inisialisasi Client SDK.
  - [x] Pembuatan `.env.example` dan `.env.local` yang aman (tanpa expose secret di source code).
  - [x] Penyiapan domain model TypeScript komprehensif di `src/types/index.ts`.
- [x] **CP2.4 Sistem Autentikasi & RBAC (Role-Based Access Control)**
  - [x] Pembuatan `AuthContext` dan provider untuk memantau status login dan role (`customer`, `cashier`, `admin`).
  - [x] Hook autentikasi: `useAuth()`.
  - [x] Komponen proteksi rute `ProtectedRoute` dengan verifikasi izin berbasis role.
- [x] **CP2.5 Kerangka Layout Utama**
  - [x] Layout Publik Marketplace (`src/app/(marketplace)/layout.tsx`):
    - Navbar publik (Logo Jeha, Navigasi Beranda, Katalog, Informasi Toko, Keranjang Badge, Tombol Masuk/Profil).
    - Footer publik lengkap dengan identitas resmi Jeha, alamat Pengkol Jepara, jam operasional (07.00 WIB), tombol Maps "Lihat Lokasi".
    - Beranda publik terintegrasi (`src/app/(marketplace)/page.tsx`).
  - [x] Layout Dashboard Administrasi (`src/app/admin/layout.tsx`):
    - Sidebar back-office responsif dengan 11 navigasi menu sesuai spesifikasi prompt.
    - Top header admin dengan info operasional (Asia/Jakarta) dan status toko.
    - Dashboard ringkasan awal (`src/app/admin/dashboard/page.tsx`).
- [x] **CP2.6 Verifikasi & Uji Fondasi**
  - [x] Verifikasi kompilasi dan build produksi (`next build`) berhasil 100% tanpa error.
  - [x] Pembuatan laporan Checkpoint 2 untuk ditinjau oleh pengguna.
