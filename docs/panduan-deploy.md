# Panduan Deployment — Internal Ticketing & Reporting

Panduan ini ditujukan untuk tim IT sebagai prosedur awal deployment dan troubleshooting. Ikuti juga [dokumentasi teknis IT](dokumentasi-teknis-it.md), terutama temuan sebelum go-live. Contoh command memakai shell Linux; untuk Windows Server gunakan perintah ekuivalen dan service/web server yang disetujui IT. Kombinasi OS, server, dan database production tetap harus diuji di staging.

## 1. Penyebab yang ditemukan dan cara menghindarinya

Sebelumnya `resources/views/app.blade.php` meminta `resources/js/app.jsx`, sedangkan entry point yang dibangun Vite adalah `resources/js/app.tsx`. Saat menggunakan manifest production, Laravel tidak menemukan `app.jsx` dan dapat mengembalikan error 500. Entry point Blade sekarang telah disesuaikan menjadi `app.tsx`.

Pastikan kode Laravel, manifest, dan asset `public/build` berasal dari **release yang sama**. Error `Access denied` atau HTTP 403 belum tentu berkaitan dengan Vite; lihat bagian troubleshooting untuk membedakan sumbernya.

## 2. Prasyarat

- PHP 8.3 atau lebih baru sesuai `composer.lock`, Composer, dan PHP extensions yang lolos `composer check-platform-reqs --no-dev`; GD dengan JPEG/PNG, ZIP dan PDO driver database yang dipilih diperlukan untuk fitur terkait.
- Node.js dan npm untuk build. Vite pada lockfile membutuhkan Node `^20.19.0` atau `>=22.12.0`; periksa juga kebutuhan dependency lainnya.
- Web server dengan document root mengarah ke direktori `public/`, PHP web/FPM, HTTPS, serta database yang sudah dipilih dan diuji.
- Direktori `storage/` dan `bootstrap/cache/` dapat ditulis oleh akun proses yang membutuhkannya. Foto dan secret harus disimpan persistent di luar artefak yang diganti setiap release.
- Siapkan backup database, foto, dan konfigurasi untuk instalasi existing. Tetapkan prosedur rollback dan jadwal deployment.

SQL Server tersedia pada konfigurasi aplikasi, tetapi konfigurasi saat ini menonaktifkan enkripsi koneksi. Jika digunakan, tim IT perlu menyiapkan dan menguji driver serta TLS/sertifikat sebelum production. SQLite in-memory dipakai test default dan bukan bukti kompatibilitas database production.

## 3. Siapkan konfigurasi

Untuk instalasi baru, siapkan `.env` berdasarkan `.env.example` melalui mekanisme secret yang disetujui. Nilai minimal yang perlu ditentukan:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://nama-host-internal
DB_CONNECTION=driver_yang_dipilih
DB_HOST=host_database
DB_PORT=port_database
DB_DATABASE=nama_database
DB_USERNAME=akun_aplikasi
DB_PASSWORD=isi_melalui_secret_manager
SESSION_SECURE_COOKIE=true
```

Contoh tersebut adalah placeholder, bukan nilai siap pakai. Pilih `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`, logging, dan disk foto sesuai infrastruktur. Jangan membagikan `.env` atau kredensial dalam chat/log. `APP_KEY` dibuat **sekali untuk instalasi baru** dengan `php artisan key:generate`; simpan secara aman. Jangan menggantinya pada deployment ulang tanpa rencana rotasi karena berdampak pada data/sesi terenkripsi.

Seeder utama berisi akun dengan password bawaan. Jangan menjalankan `DatabaseSeeder` atau `UserSeeder` di production tanpa proses provisioning dan penggantian kredensial yang disetujui IT. Seeder Area/Activity dapat menyinkronkan data master; tinjau efeknya sebelum digunakan.

## 4. Build dan validasi release

Pada build environment, gunakan source commit yang disetujui dan lockfile yang sama:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
composer check-platform-reqs --no-dev
npm ci
npm run build
```

`npm ci` pada build membutuhkan dependency frontend, termasuk `devDependencies`, karena Vite berada di sana. Deploy source, `vendor/`, dan `public/build/` hasil build yang sesuai; Node tidak harus menjadi proses runtime web jika aset sudah dibangun.

Di environment CI/staging dengan dependency development PHP terpasang, jalankan:

```bash
php artisan test tests/Feature/ProductionAssetsTest.php
php artisan test
npm run lint
npm run typecheck
```

`ProductionAssetsTest` membutuhkan `npm run build` lebih dahulu. Jika manifest tidak ada, tes tersebut **skip**, bukan lulus. Tes ini mensimulasikan mode manifest production untuk halaman login dan dashboard publik, tanpa memakai `public/hot`. Test suite default memakai SQLite in-memory; tetap lakukan pengujian pada database staging yang sama jenisnya dengan production.

Periksa `public/build/manifest.json` memiliki entry `resources/js/app.tsx`, dan asset yang ditunjuk memang ada. Jangan membuat atau mengedit manifest secara manual.

## 5. Deploy ke server

1. Ambil backup dan verifikasi target host, database, release, dan storage persistent.
2. Pasang artefak release beserta `public/build` yang dibangun bersama. Pastikan `.env`, `APP_KEY`, database dan `storage/app/public` tidak tertimpa oleh release baru.
3. Pastikan `public/hot` **tidak ada pada release production**. File ini hanya dipakai Vite dev server; jika tersalin dari environment development, Laravel dapat mencoba memuat asset dari alamat dev server. Periksa file tersebut pada direktori release yang tepat dan hapus file itu saja bila memang tersisa dari deployment development.
4. Arahkan document root web server ke `public/`; jalankan migrasi yang telah diuji, kemudian buat storage link jika belum ada:

   ```bash
   php artisan migrate --force
   php artisan storage:link
   php artisan optimize:clear
   php artisan optimize
   ```

   Periksa target `public/storage` sebelum membuat/mengubah link; jangan menimpa direktori yang sudah berisi data. Pada Windows, pembuatan symbolic link memerlukan konfigurasi dan hak OS yang sesuai.
5. Reload proses PHP/web server dan restart worker jika environment menggunakan worker, sesuai prosedur service IT. Jangan gunakan `npm run dev` atau `php artisan serve` sebagai server production.
6. Verifikasi smoke test di bagian 6 dan pantau log. Jika gagal, gunakan rollback release yang sudah diuji; rollback kode tidak otomatis mengembalikan perubahan skema atau data.

Jangan menjalankan `migrate:fresh`, `migrate:reset`, atau command reset QA pada database berisi data yang harus dipertahankan. `app:reset-rbac-test` secara khusus menghapus tabel pada koneksi aktif.

## 6. Smoke test setelah deployment

- `/up` merespons; ini hanya health check dasar, bukan bukti database atau storage sehat.
- `/login` memuat halaman tanpa error dan browser berhasil mengambil file JS/CSS dari `public/build`.
- Login sebagai akun yang disediakan dengan aman; buka dashboard internal, Report, dan menu yang sesuai permission.
- Pastikan `/dashboard` publik serta `/storage` hanya dapat diakses sesuai kebijakan jaringan dan data perusahaan. Keduanya memiliki karakteristik akses yang dijelaskan dalam dokumentasi IT.
- Uji create ISSUE/REPORT, assignment SPV, close ISSUE, foto before/after, export PDF/Excel dan scope user pada data staging.
- Periksa console/network browser dan log Laravel/web server untuk error asset, database, permission, atau request.

## 7. Troubleshooting

| Gejala | Pemeriksaan |
|---|---|
| 500 / Vite manifest entry tidak ditemukan | Pastikan versi kode dan `public/build` sama, entry `resources/js/app.tsx` ada, lalu ulangi build dan deployment asset. Jangan aktifkan `APP_DEBUG` untuk pengguna production. |
| Asset diarahkan ke Vite localhost/dev server | Periksa apakah `public/hot` tersisa pada release production; hapus file tersebut hanya setelah dipastikan bukan deployment development. |
| 403 “Akses Ditolak” dari aplikasi | Periksa permission database, policy, scope dan assignment untuk akun dan route terkait; status ini tidak otomatis berarti masalah Vite. |
| 403/Access denied dari web server | Periksa document root, konfigurasi web server, akses baca file dan log web server; jika memakai SELinux/ACL, periksa policy sesuai standar IT. |
| `Permission denied` saat tulis file | Periksa akun proses, hak tulis `storage/` dan `bootstrap/cache/`, akses ke file export sementara, serta SELinux/ACL bila berlaku. Jangan membuat seluruh repository world-writable. |
| Database access denied / koneksi gagal | Periksa host, port, driver, jaringan, kredensial service dan TLS di log yang aman; jangan menyalin secret ke tiket. |
| Foto tidak tampil | Periksa disk foto, path database, file fisik, `public/storage`, URL aplikasi dan izin akses server. |

Untuk investigasi, kumpulkan status HTTP, URL yang gagal, waktu, pesan error yang telah disanitasi, dan log Laravel serta web server yang sesuai. Hindari membagikan data laporan atau rahasia.
