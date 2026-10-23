<?php

return [
    'permissions' => [
        'menu.dashboard' => ['group' => 'Legacy', 'label' => 'Menu dashboard (lama)', 'description' => 'Tidak lagi mengatur menu; akses halaman ditentukan oleh route.'],
        'menu.reports' => ['group' => 'Legacy', 'label' => 'Menu laporan (lama)', 'description' => 'Tidak lagi mengatur menu; gunakan permission melihat laporan.'],
        'menu.areas' => ['group' => 'Legacy', 'label' => 'Menu area (lama)', 'description' => 'Tidak lagi mengatur menu; gunakan areas.view.'],
        'menu.activities' => ['group' => 'Legacy', 'label' => 'Menu aktivitas (lama)', 'description' => 'Tidak lagi mengatur menu; gunakan activities.view.'],
        'menu.settings' => ['group' => 'Legacy', 'label' => 'Menu pengaturan (lama)', 'description' => 'Tidak lagi mengatur menu; gunakan settings.view.'],

        'reports.view.own' => ['group' => 'Laporan', 'label' => 'Melihat laporan sendiri', 'description' => 'Melihat laporan yang dibuat oleh pengguna sendiri.'],
        'reports.view.all' => ['group' => 'Laporan', 'label' => 'Melihat seluruh laporan', 'description' => 'Melihat laporan dari seluruh area dan pengguna.'],
        'reports.create' => ['group' => 'Laporan', 'label' => 'Membuat laporan', 'description' => 'Membuat laporan temuan baru.'],
        'reports.edit.own' => ['group' => 'Laporan', 'label' => 'Mengubah laporan sendiri', 'description' => 'Mengubah laporan terbuka yang dibuat sendiri.'],
        'reports.edit.all' => ['group' => 'Laporan', 'label' => 'Mengubah seluruh laporan', 'description' => 'Mengubah laporan terbuka dari seluruh pengguna.'],
        'reports.delete.own' => ['group' => 'Laporan', 'label' => 'Menghapus laporan sendiri', 'description' => 'Menghapus laporan terbuka yang dibuat sendiri.'],
        'reports.delete.all' => ['group' => 'Laporan', 'label' => 'Menghapus seluruh laporan', 'description' => 'Menghapus laporan terbuka dari seluruh pengguna.'],
        'reports.solve.own.area' => ['group' => 'Laporan', 'label' => 'Menyelesaikan laporan area PIC', 'description' => 'Menutup laporan pada area yang menjadi tanggung jawab PIC.'],
        'reports.solve.all' => ['group' => 'Laporan', 'label' => 'Menyelesaikan seluruh laporan', 'description' => 'Menutup laporan pada seluruh area.'],
        'reports.review.area' => ['group' => 'Laporan', 'label' => 'Review laporan area', 'description' => 'Melihat laporan pada area yang ditugaskan tanpa mengubahnya.'],

        'areas.view' => ['group' => 'Area', 'label' => 'Melihat area', 'description' => 'Melihat daftar area yang dapat diakses.'],
        'areas.view.all' => ['group' => 'Area', 'label' => 'Melihat seluruh area', 'description' => 'Melihat termasuk area yang diarsipkan.'],
        'areas.create' => ['group' => 'Area', 'label' => 'Membuat area', 'description' => 'Menambahkan area baru.'],
        'areas.edit' => ['group' => 'Area', 'label' => 'Mengubah area', 'description' => 'Mengubah nama, status, dan PIC area.'],
        'areas.delete' => ['group' => 'Area', 'label' => 'Menghapus area', 'description' => 'Mengarsipkan, memulihkan, atau menghapus area permanen bila tidak memiliki riwayat laporan.'],
        'areas.assign.supervisor' => ['group' => 'Legacy', 'label' => 'Mapping PIC area (lama)', 'description' => 'Tidak digunakan. Scope Manager dan Supervisor diatur dari Pengaturan Pengguna.'],

        'activities.view' => ['group' => 'Aktivitas', 'label' => 'Melihat aktivitas', 'description' => 'Melihat aktivitas utama dan subaktivitas.'],
        'activities.create' => ['group' => 'Aktivitas', 'label' => 'Membuat aktivitas', 'description' => 'Menambahkan aktivitas utama atau subaktivitas.'],
        'activities.edit' => ['group' => 'Aktivitas', 'label' => 'Mengubah aktivitas', 'description' => 'Mengubah aktivitas dan statusnya.'],
        'activities.delete' => ['group' => 'Aktivitas', 'label' => 'Menghapus aktivitas', 'description' => 'Menghapus aktivitas yang belum digunakan dalam laporan.'],

        'users.view' => ['group' => 'Pengguna', 'label' => 'Melihat pengguna', 'description' => 'Melihat daftar pengguna.'],
        'users.create' => ['group' => 'Pengguna', 'label' => 'Membuat pengguna', 'description' => 'Menambahkan pengguna baru.'],
        'users.edit' => ['group' => 'Pengguna', 'label' => 'Mengubah pengguna', 'description' => 'Mengubah data dan role pengguna.'],
        'users.delete' => ['group' => 'Pengguna', 'label' => 'Menghapus pengguna', 'description' => 'Menghapus pengguna selain akun sendiri dan SUPER_ADMIN.'],
        'users.assign.area' => ['group' => 'Pengguna', 'label' => 'Menetapkan area pengguna', 'description' => 'Menetapkan pengguna sebagai PIC area.'],
        'users.promote' => ['group' => 'Pengguna', 'label' => 'Mengubah role pengguna', 'description' => 'Menetapkan role kepada pengguna.'],

        'settings.view' => ['group' => 'Pengaturan', 'label' => 'Melihat pengaturan', 'description' => 'Membuka halaman pengaturan pengguna dan role.'],
        'settings.manage' => ['group' => 'Pengaturan', 'label' => 'Mengelola pengaturan', 'description' => 'Permission legacy untuk kompatibilitas konfigurasi yang ada.'],
        'roles.view' => ['group' => 'Role & Permission', 'label' => 'Melihat role', 'description' => 'Melihat daftar role.'],
        'roles.create' => ['group' => 'Role & Permission', 'label' => 'Membuat role', 'description' => 'Membuat role custom.'],
        'roles.edit' => ['group' => 'Role & Permission', 'label' => 'Mengubah role', 'description' => 'Mengubah nama role custom.'],
        'roles.delete' => ['group' => 'Role & Permission', 'label' => 'Menghapus role', 'description' => 'Menghapus role custom yang tidak digunakan.'],
        'permissions.manage' => ['group' => 'Role & Permission', 'label' => 'Mengatur permission role', 'description' => 'Mengubah mapping permission pada role.'],
    ],

    'roles' => [
        'SUPER_ADMIN' => ['label' => 'Super Admin', 'description' => 'Mengelola seluruh konfigurasi aplikasi dan RBAC.', 'permissions' => ['*']],
        'ADMIN' => ['label' => 'Admin', 'description' => 'Mengelola operasional pengguna, area, aktivitas, dan laporan.', 'permissions' => [
            'areas.view', 'areas.create', 'areas.edit', 'areas.delete',
            'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign.area', 'users.promote',
            'reports.view.all', 'reports.create', 'reports.delete.all', 'reports.solve.all', 'settings.view',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'permissions.manage',
        ]],
        'MANAGER' => ['label' => 'Manager', 'description' => 'Memantau dan menangani seluruh laporan tanpa mengelola konfigurasi.', 'permissions' => [
            'areas.view', 'activities.view',
            'reports.review.area',
        ]],
        'SUPERVISOR' => ['label' => 'Supervisor', 'description' => 'Membuat laporan dan menangani laporan pada area PIC.', 'permissions' => [
            'reports.view.own', 'reports.create', 'reports.edit.own', 'reports.delete.own', 'reports.solve.own.area', 'areas.view', 'activities.view',
        ]],
        'USER' => ['label' => 'User', 'description' => 'Membuat dan mengelola laporan miliknya sendiri.', 'permissions' => [
            'reports.view.own', 'reports.create', 'reports.edit.own', 'reports.delete.own',
        ]],
    ],
];
