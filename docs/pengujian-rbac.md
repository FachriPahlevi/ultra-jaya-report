# Seeder Laporan Pengujian

Seeder pengujian hanya menyiapkan laporan dan foto contoh. Pengguna, role, permission, Area, Sub-area, Aktivitas, Sub-aktivitas, kategori, kapasitas, password, dan penugasan yang sudah ada tidak dibuat, diubah, atau dihapus.

## Command terpisah

```bash
php artisan app:seed-rbac-test
```

Default: 30 laporan uji untuk setiap pengguna yang sudah ada. Untuk jumlah lain:

```bash
php artisan app:seed-rbac-test --reports-per-user=50
```

Jumlah valid adalah 30–365 per pengguna. Akun yang dipakai login dan password mengikuti data pengguna yang sudah tersedia; seeder ini tidak membuat akun QA atau mereset password.

## Prasyarat

Siapkan pengguna dan master sesuai data riil yang ingin diuji:

- Minimal satu pengguna.
- Area aktif yang memiliki Sub-area aktif.
- Aktivitas aktif yang memiliki Sub-aktivitas.

Jika belum tersedia, command berhenti tanpa menambahkan data master. Untuk database pengembangan baru, jalankan migrasi dan seeder aplikasi biasa terlebih dahulu sesuai kebutuhan. Command laporan tidak menjalankan `DatabaseSeeder` atau seeder pengguna/master secara otomatis.

## Perilaku data uji

- Semua laporan menggunakan ID lokasi dan kegiatan yang sudah ada.
- Laporan disebarkan bergiliran ke seluruh Sub-area aktif pada Area aktif dan seluruh Sub-aktivitas pada Aktivitas aktif. Dengan demikian, semua Area dan Aktivitas yang memiliki anak yang dapat dipilih mendapat laporan. Jika diperlukan untuk cakupan ini, jumlah laporan per pengguna dapat melebihi minimum yang diminta. Master tanpa anak yang valid perlu dilengkapi terlebih dahulu, bukan dibuat otomatis oleh seeder. Pembatasan visibilitas tetap mengikuti permission dan penugasan pengguna.
- Kategori mengikuti Sub-aktivitas asli. Jika semua Sub-aktivitas masih ISSUE, laporan uji juga semuanya ISSUE. Atur kategori REPORT sendiri pada data riil jika ingin menguji REPORT.
- Sebagian ISSUE dibuat selesai hanya jika tersedia pengguna aktif dengan izin close seluruh data atau penugasan close yang sesuai. Jika tidak ada penutup yang memenuhi syarat, laporan tetap terbuka.
- REPORT selalu terbuka dan tidak diberi data penutupan.
- Tanggal tersebar dari hari ini hingga sekitar 110 hari lalu.
- Dokumentasi mencakup foto landscape, portrait, persegi, tanpa foto, serta kombinasi foto awal/akhir bila tersedia ISSUE selesai.

Isi laporan menggunakan kalimat natural tanpa kode fixture yang terlihat pengguna. Penanda internal disimpan terpisah di `storage/app/private/testing/report-fixtures-<hash-koneksi>.json`; pertahankan file ini agar eksekusi ulang tidak membuat duplikasi. Foto fasilitas sungguhan yang dipakai sebagai ilustrasi tersimpan di `storage/app/public/reports/testing/commons/`. Foto tersebut berasal dari Wikimedia Commons dengan lisensi CC0; dokumentasi sumber ada di `database/seeders/Testing/assets/README.md`. Lokasi dan kejadian pada isi laporan adalah simulasi uji, bukan dokumentasi kondisi nyata PT Ultrajaya. Jika diperlukan, aktifkan tautan storage publik dengan `php artisan storage:link`.

Seeder membuat riwayat laporan untuk setiap akun, termasuk akun yang saat ini tidak boleh membuat laporan. Ini membantu menguji perubahan role dan kepemilikan; tidak memberikan permission baru pada akun tersebut.

## Menjalankan ulang

Laporan uji dengan pengguna dan nomor yang sama diperbarui, bukan digandakan. Identifikasi menggunakan manifest privat dengan pemeriksaan ID, isi, dan waktu pembuatan. Laporan biasa atau laporan yang sudah diedit manual tidak ditimpa. Fixture lama dengan awalan kode diadopsi dan ditulis ulang tanpa awalan. Isi dan snapshot kategori fixture dikembalikan mengikuti master yang tersedia saat seeding.

## Isolasi production

- Command: `app/Console/Commands/SeedRbacTestData.php`.
- Seeder: `database/seeders/Testing/RbacAcceptanceSeeder.php`.
- Keduanya hanya menerima environment `local` atau `testing`.
- Seeder tidak dipanggil oleh `DatabaseSeeder`, sehingga `php artisan db:seed` normal tidak menambahkan laporan uji.
- Pemanggilan langsung kelas seeder di production juga ditolak.

## Checklist RBAC

| Pengujian | Hasil yang diharapkan |
|---|---|
| Pengguna dengan akses sendiri | Hanya melihat/mengekspor laporannya sendiri |
| Reviewer Aktivitas | Melihat laporan pada Aktivitas yang ditugaskan |
| Penutup sesuai penugasan | Close ISSUE terbuka hanya jika Sub-area dan Sub-aktivitas cocok |
| Pengguna dengan gabungan permission | Mendapat gabungan cakupan akses |
| Pengguna tanpa akses laporan | Tidak memperoleh data laporan internal |
| Akses ekspor tanpa `reports.export` | Ditolak; tombol ekspor tidak tampil |
| URL detail atau ID form di luar cakupan | Ditolak oleh backend |
| Close REPORT atau mengubah laporan selesai | Ditolak |
| Filter/sort/ekspor | Mengolah data yang dapat diakses, tidak memperluas scope |
| Mengubah permission role bawaan/custom | Kemampuan mengikuti permission pada request berikutnya |

Penugasan harus disiapkan sendiri mengikuti skenario riil. Seeder tidak otomatis menugaskan pengguna agar hasil pengujian mencerminkan konfigurasi yang sedang dirancang.
