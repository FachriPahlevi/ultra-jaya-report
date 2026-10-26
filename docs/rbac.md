# Menambah akses halaman dan komponen

Untuk panduan operasional dan matriks role bawaan, lihat [Panduan Sistem dan Hak Akses Pengguna](panduan-sistem-pengguna.md). Dokumen ini ditujukan untuk pengembang.

Untuk role custom, permission penugasan dan kategori, serta perubahan kemampuan Manager/SPV, lihat [RBAC dinamis](rbac-dinamis.md). Pemeriksaan kemampuan operasional menggunakan permission; nama role hanya digunakan untuk template dan perlindungan administrasi akun/role sistem.

Permission menjelaskan tindakan yang diizinkan. Role adalah kumpulan permission yang dapat diubah melalui halaman Pengaturan. Backend selalu memutuskan apakah request boleh dijalankan; frontend memakai hasilnya untuk menampilkan menu dan komponen.

`<Can>` dapat membungkus komponen React apa pun: tombol, tautan, tab, kolom tabel, form, atau seluruh panel. Gunakan `permission`, `any`, atau `all` sesuai kebutuhan. `useAuthorization()` tersedia jika izin menentukan logika di dalam komponen. Untuk komponen yang berkaitan dengan satu record, pakai hasil policy dari backend (`record.can.update`, dan seterusnya), karena izin umum belum tentu cukup untuk record tersebut.

Role custom dapat dibuat dan permission yang sudah ada dapat dipilih dari halaman Pengaturan tanpa mengubah kode. Role baru dimulai tanpa permission. Saat permission/fitur baru dibuat oleh developer, jalankan seeder agar permission muncul di Pengaturan, lalu admin dapat memberikan permission itu ke role yang sesuai. Seeder tidak mengubah mapping role yang sudah ada.

Saat menambah halaman baru:

1. Tambahkan permission, label, dan deskripsi pada `config/rbac.php`. Tambahkan ke template role hanya untuk role baru yang memang perlu akses awal. Seeder tidak mengubah role yang sudah disesuaikan melalui UI.
2. Daftarkan route bernama di `routes/web.php` dan beri middleware `can:<permission>`. Untuk tindakan terhadap satu model, buat policy dan gunakan `can:<aksi>,<parameter-route>`.
3. Jika halaman perlu muncul di sidebar, tambahkan nama route, ikon, dan permission pembukanya pada `config/navigation.php`. Sidebar menerima daftar yang sudah difilter dari Laravel.
4. Pada komponen React, gunakan `useAuthorization()` atau `<Can permission="inventory.create">...</Can>` untuk komponen umum. Untuk tindakan terhadap satu record, kirim hasil policy sebagai `can` pada record, lalu gunakan `record.can.update` dan sejenisnya.
5. Tambahkan feature test untuk route yang boleh dan ditolak, serta aturan policy yang bergantung pada pemilik/status/area.

Contoh: halaman inventaris memakai `inventory.view`; panel tambah memakai `inventory.create`; aksi ubah memakai `InventoryPolicy::update`. Menyembunyikan komponen tidak menggantikan pemeriksaan route.

`menu.*` masih disimpan sebagai permission legacy agar data lama tetap dapat dibaca. Permission tersebut tidak lagi mengatur sidebar. Role bawaan yang sudah ada tidak otomatis mendapat permission baru: atur lewat halaman Pengaturan setelah deploy bila role tersebut perlu mengakses fitur baru.

Saat deploy perubahan ini, jalankan `php artisan migrate --force` untuk memindahkan akses role lama dari `permissions.manage` ke permission `roles.view/create/edit/delete`. Seeder aman dijalankan ulang karena mapping role yang sudah ada dipertahankan.
