# Mengatur Permission dan Role Custom

Role adalah kumpulan izin. Kemampuan operasional ditentukan oleh permission, cakupan data, dan penugasan; bukan oleh nama role Manager, SPV, atau nama role custom.

## Mengubah kemampuan role

Di Pengaturan, pilih role dan ubah permission-nya. Permission berlaku untuk semua pengguna role tersebut. Buat role custom jika hanya kelompok tertentu yang membutuhkan kombinasi kemampuan berbeda.

| Kebutuhan | Permission yang digunakan | Pengaturan tambahan |
|---|---|---|
| Membuat laporan | `reports.create` | Pilih lokasi dan Sub-aktivitas pada form |
| Melihat laporan sendiri | `reports.view.own` | Tidak ada |
| Review Aktivitas tertentu | `reports.review.area` | Mapping Area pengguna, lalu Atur reviewer pada Aktivitas |
| Close sesuai tugas | `reports.solve.own.area` | Mapping Sub-area pengguna, lalu Atur penutup tiket pada Sub-aktivitas |
| Close seluruh ISSUE | `reports.solve.all` | Tidak memerlukan mapping lokasi/kegiatan |
| Ubah laporan sendiri/semua | `reports.edit.own` / `reports.edit.all` | Laporan harus terbuka |
| Hapus laporan sendiri/semua | `reports.delete.own` / `reports.delete.all` | Laporan harus terbuka |
| Lihat seluruh laporan | `reports.view.all` | Tidak ada |
| Ekspor Excel/PDF | `reports.export` | Tetap memerlukan cakupan membaca laporan; permission ini tidak memperluas scope |
| Mengatur kategori Sub-aktivitas | `activities.category.manage` | Juga perlu izin membuat/mengubah Sub-aktivitas |
| Menugaskan reviewer | `activities.assign.manager` | Juga perlu `activities.view` untuk membuka halaman |
| Menugaskan penutup tiket | `activities.assign.supervisor` | Juga perlu `activities.view` untuk membuka halaman |
| Mengatur lokasi pengguna | `users.assign.area` | Juga perlu izin membuat/mengubah pengguna dan akses Pengaturan |
| Melihat semua Area, termasuk arsip | `areas.view.all` | Juga perlu `areas.view` |

Nama permission lama yang menyebut `manager`, `supervisor`, atau `area` dipertahankan agar konfigurasi yang sudah ada tetap cocok. Label di Pengaturan menjelaskan fungsi operasional terbaru.

## Contoh: Manager bisa membuat dan menutup tiket

Untuk mengizinkan Manager membuat laporan, tambahkan `reports.create` pada role Manager.

Untuk menutup sesuai penugasan, tambahkan `reports.solve.own.area`. Isi Sub-area penugasannya pada Pengaturan Pengguna dan tambahkan akun tersebut sebagai penutup pada Sub-aktivitas terkait. Nama role tetap Manager.

Jika Manager memang bertanggung jawab atas semua ISSUE, gunakan `reports.solve.all`. Izin ini juga memberi akses membaca seluruh laporan agar tindakan dapat dijalankan dari daftar dan detail. Jangan memilih cakupan seluruh data jika kebutuhan hanya penugasan tertentu.

## Contoh: role custom Koordinator

1. Buat role Koordinator.
2. Beri `reports.review.area`, `reports.solve.own.area`, dan `reports.create` sesuai kebutuhan.
3. Buat/ubah akun pengguna dan pilih Koordinator.
4. Isi Area serta Sub-area yang muncul berdasarkan permission role tersebut.
5. Tetapkan pengguna pada Atur reviewer dan Atur penutup tiket di halaman Aktivitas.

Permission review dan close dapat digabung. Daftar, dashboard internal, detail, dan ekspor mengikuti gabungan cakupan yang diperbolehkan.

## Aturan akses membaca

- Izin `*.all` untuk melihat, mengubah, menghapus, atau menutup laporan mencakup akses membaca seluruh laporan.
- Izin membuat atau mengelola laporan sendiri mencakup akses membaca laporan sendiri.
- Review memberi akses membaca laporan pada Aktivitas yang ditugaskan.
- Close sesuai penugasan memberi akses membaca laporan Sub-area tugasnya. Close tetap memerlukan penugasan Sub-aktivitas yang cocok.
- Tidak memiliki permission laporan berarti tidak memperoleh data laporan internal, meskipun akun dapat membuka dashboard internal.
- Ekspor memerlukan `reports.export` secara eksplisit; akses membaca saja tidak cukup untuk mengunduh.

## Mencabut permission

Penugasan yang sudah tersimpan tidak otomatis dihapus ketika role/permission berubah. Penugasan tetap tercatat, tetapi tidak memberikan akses tanpa permission yang diperlukan. Ini mencegah perubahan role menghapus konfigurasi penugasan secara diam-diam.

Pengelola dapat mengubah atau mengosongkan penugasan. Pemberian permission kembali dapat mengaktifkan kembali akses pada penugasan yang masih tersimpan; periksa penugasan saat mengubah kewenangan pengguna.

## Batas yang tetap berlaku

- REPORT tidak dapat ditutup, termasuk oleh pengguna dengan izin close seluruh data.
- ISSUE hanya dapat ditutup ketika terbuka.
- Laporan selesai tidak dapat diubah atau dihapus lewat CRUD saat ini.
- Pengelola penugasan memerlukan permission assign khusus; permission edit Aktivitas tidak mencukupi.
- Perlindungan akun dan role Super Admin serta larangan menghapus role sistem tetap berlaku. Ini adalah perlindungan administrasi, bukan batas kemampuan operasional role custom.
- Fitur baru yang belum ada tetap memerlukan implementasi dan permission baru. Menggabungkan kemampuan yang sudah tersedia dapat dilakukan dari Pengaturan.

## Pemeliharaan

Seeder Role menambahkan katalog permission tanpa menyetel ulang mapping role yang sudah ada. Role template dengan daftar `*` memperoleh permission yang baru diperkenalkan; permission lama yang telah dicabut tidak diberikan ulang oleh proses ini. Template role di konfigurasi digunakan saat role pertama dibuat.

Untuk database lama yang sebelumnya mengandalkan bypass nama Admin pada halaman Area, pindahkan hak efektif tersebut menjadi permission eksplisit `areas.view.all` pada role terkait satu kali. Setelah itu pencabutan permission benar-benar membatasi akses, termasuk pada role Admin.

Lihat [dataset dan checklist pengujian RBAC](pengujian-rbac.md) untuk command dan akun pengujian terpisah dari production.
