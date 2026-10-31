# Akses Sub-activity berdasarkan role

Fitur ini memiliki dua mode. Default `ACTIVITY_ROLE_ACCESS_ENABLED=false` mempertahankan aturan assignment per user yang lama. Role Sub-activity dapat dikonfigurasi pada menu **Activities → Sub-activity → Manage access roles** oleh pengguna yang memiliki `activities.view` dan `permissions.manage`. Role tersedia dari database, termasuk role custom. Assignment user lama tidak dihapus.

## Matriks saat mode baru aktif

| Aksi | Syarat |
|---|---|
| Buat laporan | `reports.create` dan minimal satu role pengguna diizinkan pada Sub-activity |
| Lihat laporan sendiri | Permission own/create sesuai aturan semula; laporan tetap terlihat setelah role Sub-activity dicabut |
| Review laporan | `reports.review.area` dan role diizinkan pada Sub-activity; tidak lagi memerlukan assignment reviewer per Activity |
| Lihat laporan Sub-area | `reports.solve.own.area` dan assignment Sub-area, seperti sebelumnya |
| Close ISSUE | ISSUE open, role diizinkan pada Sub-activity, dan `reports.solve.all` atau `reports.solve.own.area` dengan assignment Sub-area |
| Lihat semua laporan | Permission all sesuai aturan sebelumnya |

Role Sub-activity tidak memberikan permission. Jika beberapa role dimiliki, satu role yang cocok sudah cukup. Jika tidak ada role yang dipilih, tidak ada role yang dapat membuat atau menutup laporan pada Sub-activity tersebut. Bahkan pengguna dengan `reports.solve.all` harus memiliki role yang diizinkan untuk close. Status closed dan kategori REPORT tetap tidak dapat di-close.

Dengan permission bawaan, matriks per role adalah sebagai berikut. Tanda “role cocok” berarti role tersebut harus dipilih pada Sub-activity; akses aktual mengikuti permission di database.

| Role | Membuat | Review / melihat laporan orang lain | Menutup ISSUE |
|---|---|---|---|
| SUPER_ADMIN | Role cocok | Semua laporan | Role cocok, tanpa assignment lokasi |
| ADMIN | Role cocok | Semua laporan | Role cocok, tanpa assignment lokasi |
| MANAGER | Tidak, kecuali diberi permission create | Role cocok dan permission review | Tidak, kecuali diberi permission close |
| SUPERVISOR | Role cocok | Laporan di Sub-area yang ditugaskan | Role cocok dan PIC Sub-area |
| USER | Role cocok | Tidak secara default | Tidak secara default |
| Custom | Sesuai permission dan role cocok | Sesuai permission dan scope | Sesuai permission, role cocok, dan scope |

Semua role dengan capability own tetap dapat melihat laporan miliknya sendiri. Permission all memberikan visibility semua laporan, termasuk ketika role tidak dipilih pada Sub-activity; pembatasan role tetap berlaku untuk create dan close.

## Peralihan aman

1. Backup database dan uji perubahan pada staging. Jalankan migrasi release; jangan jalankan seeder atau reset database.
2. Biarkan `ACTIVITY_ROLE_ACCESS_ENABLED=false`, deploy build, lalu isi role pada setiap Sub-activity secara manual sesuai matriks yang disetujui client. Excel client bukan sumber yang otomatis diimpor. Periksa mapping role, termasuk apakah `Super User` sama dengan role aplikasi tertentu.
3. Jalankan `php artisan activity-access:audit` untuk menemukan Sub-activity aktif yang belum memiliki role. Hasil lolos hanya memeriksa keberadaan konfigurasi, bukan kebenaran bisnis. Tinjau juga izin dan role custom secara manual.
4. Uji create, review, close, dashboard, detail dan export dengan akun nyata pada staging. Siapkan role pada Sub-activity inactive sebelum mengaktifkannya.
5. Setelah disetujui, set `ACTIVITY_ROLE_ACCESS_ENABLED=true` dan refresh cache konfigurasi Laravel melalui prosedur deployment. Pada mode ini daftar role kosong berarti akses create/close ditolak.
6. Bila perlu kembali ke aturan lama, set nilai menjadi `false` dan refresh cache. Assignment user lama tetap tersedia; perubahan yang dibuat saat mode baru aktif tidak mengubah assignment lama.

Perubahan role berlaku untuk seluruh pengguna dengan role tersebut. Review scope dan agregasi dashboard/export mengikuti perubahan tersebut. Dokumen RBAC lama yang membahas assignment per-user menggambarkan mode lama; bagian ini menjadi acuan ketika mode role diaktifkan.
