# 🌿 Website Profil Desa Sungai Jaga A - Bengkayang

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Vanilla_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Security](https://img.shields.io/badge/Security-RLS_%26_XSS_Protected-green?style=for-the-badge&logo=shield)

Website Profil Modern Desa Sungai Jaga A, Kecamatan Sungai Raya Kepulauan, Kabupaten Bengkayang, Kalimantan Barat. Didesain dengan estetika modern Gen-Z (Glassmorphism, Bento Grid Layout, Tropical Emerald Theme) serta dilengkapi dengan Portal Admin dinamis yang terhubung ke **Supabase Backend (Database PostgreSQL, Supabase Auth, & Cloud Storage)**.

---

## 📌 Fitur Utama Website

### 🌐 1. Halaman Publik (`index.html`)
* **Hero Banner Dinamis**: Menampilkan lanskap keindahan sungai tropis Kalimantan yang dikelola langsung dari Portal Admin.
* **Kilas Sejarah & Peran**: Narasi nilai historis sungai sebagai urat nadi perikanan, pertanian, dan kehidupan masyarakat.
* **4 Pilar Utama Desa (Bento Grid)**: Visualisasi potensi utama desa (Perikanan & Kelautan, Pertanian & Perkebunan, UMKM Olahan Laut, dan Pariwisata Pesisir).
* **Galeri Foto Interaktif**: Dokumentasi foto beresolusi tinggi lengkap dengan fitur Lightbox zoom visual.
* **Integrasi WhatsApp Langsung**: Tombol kontak resmi ke WhatsApp Kepala Desa yang selalu tersinkronisasi secara real-time.

---

## 🔐 2. Portal Admin & Pengelolaan Profil (`admin/index.html`)

Untuk mengakses panel pengelola desa, buka jalur URL `/admin/` atau `admin/index.html`.

### 👨‍💼 Fitur-Fitur di Dalam Dashboard Admin:
1. **⚙️ Pengaturan Umum & Identitas Profil Desa**:
   - **Nama Kepala Desa**: Mengubah nama resmi Kepala Desa (misal: *Bpk. Supriadi*) yang ditampilkan di footer & bagian informasi website.
   - **Nomor WhatsApp Resmi**: Mengubah nomor kontak WhatsApp tujuan (format internasional: `628xxxxxxxx`). Seluruh tombol kontak WhatsApp di website publik otomatis terhubung ke nomor baru ini.
2. **🖼️ Pengelola Gambar Utama (Hero Section)**:
   - Mengunggah foto beranda baru secara langsung via *Drag & Drop*.
   - Foto otomatis diunggah ke **Supabase Cloud Storage** dan memperbarui tampilan beranda secara *real-time*.
   - Fitur *Reset* ke gambar bawaan desa jika ingin mengembalikan foto semula.
3. **📸 Koleksi Galeri Dokumentasi Foto**:
   - Menambahkan foto dokumentasi baru beserta judul/deskripsi foto.
   - Melihat daftar koleksi foto aktif dengan thumbnail pratinjau.
   - Menghapus foto dari galeri publik dengan konfirmasi aman.

---

## 🛡️ Fitur Keamanan Terintegrasi (*Security Architecture*)

Website ini dibangun dengan standar keamanan modern untuk mencegah peretasan dan pembobolan data:

| Komponen Keamanan | Mekanisme Perlindungan |
| :--- | :--- |
| **Supabase Auth** | Autentikasi aman berbasis JWT Token. Kata sandi di-hash di server Supabase (tidak ada password tertulis di kode JS). |
| **Row Level Security (RLS)** | Kebijakan akses PostgreSQL: Publik hanya bisa membaca (`SELECT`), hanya Admin terautentikasi yang bisa `INSERT/UPDATE/DELETE`. |
| **Proteksi Brute-Force Rate Limiting** | Otomatis mengunci (*lockout*) percobaan login selama 5 menit jika terjadi 5 kali kesalahan login berturut-turut. |
| **Pembersihan XSS (Sanitasi Input)** | Menggunakan helper `escapeHtml()` dan `sanitizeUrl()` untuk mencegah serangan script injection pada input judul foto / URL. |
| **Sanitasi File Upload** | Pembatasan tipe berkas (hanya JPG, PNG, WEBP) dan batas ukuran file maksimal 5 MB. |
| **Session Expiration** | Penanganan sesi otomatis yang meminta login ulang jika masa berlaku sesi telah berakhir. |
| **Content Security Policy (CSP)** | Header HTTP CSP ketat untuk membatasi eksekusi skrip pihak ketiga yang tak dikenal. |

---

## 🗄️ Struktur Database Supabase

Website ini menggunakan dua tabel utama di PostgreSQL Supabase:

### 1. Tabel `settings`
Menyimpan konfigurasi profil global desa:
* `key` (TEXT, Primary Key) - Contoh: `sj_kades_name`, `sj_whatsapp`, `sj_hero_image`
* `value` (TEXT) - Nilai dari konfigurasi

### 2. Tabel `gallery`
Menyimpan daftar foto galeri desa:
* `id` (UUID, Primary Key)
* `created_at` (TIMESTAMP WITH TIME ZONE)
* `title` (TEXT) - Judul / Deskripsi foto
* `src` (TEXT) - URL Publik foto dari Cloud Storage

---

## 🛠️ Cara Menjalankan Secara Lokal

1. **Clone Repository**:
   ```bash
   git clone https://github.com/autumsov/sungaijagaa.git
   cd sungaijagaa
   ```
2. **Jalankan Web Server**:
   - Menggunakan **Laragon** / **XAMPP** (letakkan di `www` atau `htdocs`).
   - Atau gunakan ekstensi **Live Server** di VS Code.
3. **Konfigurasi Supabase**:
   - Buka `js/supabase-config.js`.
   - Masukkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari dashboard Supabase Anda.
   - Eksekusi script SQL yang ada di panduan setup untuk mengaktifkan tabel & RLS.

---

## 📄 Hak Cipta & Lisensi

&copy; 2026 Pemerintah Desa Sungai Jaga A, Kecamatan Sungai Raya Kepulauan, Kabupaten Bengkayang, Kalimantan Barat.
