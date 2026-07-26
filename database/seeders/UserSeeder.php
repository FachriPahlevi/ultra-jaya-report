<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $managementUsers = [
            ['name' => 'Super Admin Ultra Jaya', 'email' => 'super.admin@ultrajaya.local', 'password' => 'password', 'role' => 'SUPER_ADMIN'],
            ['name' => 'Aulia Pratama', 'email' => 'aulia.pratama@ultrajaya.local', 'password' => 'password', 'role' => 'ADMIN'],
            ['name' => 'Rizky Adinata', 'email' => 'rizky.adinata@ultrajaya.local', 'password' => 'password', 'role' => 'MANAGER'],
        ];

        $supervisorUsers = [
            ['name' => 'Yudi Setiawan', 'email' => 'yudi.setiawan@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Deni Kurniawan', 'email' => 'deni.kurniawan@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Fajar Nugraha', 'email' => 'fajar.nugraha@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Lukman Hakim', 'email' => 'lukman.hakim@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Hendra Saputra', 'email' => 'hendra.saputra@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Rina Kartikasari', 'email' => 'rina.kartikasari@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Bima Arya', 'email' => 'bima.arya@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Agus Salim', 'email' => 'agus.salim@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Mira Puspita', 'email' => 'mira.puspita@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
            ['name' => 'Tomi Wijaya', 'email' => 'tomi.wijaya@ultrajaya.local', 'password' => 'password', 'role' => 'SUPERVISOR'],
        ];

        $operationalUsers = [
            ['name' => 'Nadia Putri', 'email' => 'nadia.putri@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Andri Saputra', 'email' => 'andri.saputra@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Siska Lestari', 'email' => 'siska.lestari@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Bagas Ramadhan', 'email' => 'bagas.ramadhan@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Rafi Maulana', 'email' => 'rafi.maulana@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'M. Iqbal Saputra', 'email' => 'm.iqbal.saputra@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Yoga Prasetyo', 'email' => 'yoga.prasetyo@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Febriansyah Putra', 'email' => 'febriansyah.putra@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Galih Permana', 'email' => 'galih.permana@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Teguh Santoso', 'email' => 'teguh.santoso@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Reza Pahlevi', 'email' => 'reza.pahlevi@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Arif Hidayat', 'email' => 'arif.hidayat@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Ilham Kurnia', 'email' => 'ilham.kurnia@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Yusuf Firmansyah', 'email' => 'yusuf.firmansyah@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Asep Gunawan', 'email' => 'asep.gunawan@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Dimas Saprudin', 'email' => 'dimas.saprudin@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Wahyu Nugroho', 'email' => 'wahyu.nugroho@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Akbar Maulana', 'email' => 'akbar.maulana@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Putra Mahendra', 'email' => 'putra.mahendra@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Moch. Ridwan', 'email' => 'moch.ridwan@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Farhan Hidayat', 'email' => 'farhan.hidayat@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Taufik Akbar', 'email' => 'taufik.akbar@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Rizal Firmansyah', 'email' => 'rizal.firmansyah@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Nurul Aisyah', 'email' => 'nurul.aisyah@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Fitri Handayani', 'email' => 'fitri.handayani@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Anisa Rahmawati', 'email' => 'anisa.rahmawati@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Dewi Lestari', 'email' => 'dewi.lestari@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Intan Permatasari', 'email' => 'intan.permatasari@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Putri Ayuningtyas', 'email' => 'putri.ayuningtyas@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Rina Oktaviani', 'email' => 'rina.oktaviani@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Nabila Azzahra', 'email' => 'nabila.azzahra@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Sari Wulandari', 'email' => 'sari.wulandari@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Lia Kartika', 'email' => 'lia.kartika@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Ayu Safitri', 'email' => 'ayu.safitri@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Maya Puspitasari', 'email' => 'maya.puspitasari@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Rizka Amelia', 'email' => 'rizka.amelia@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Nina Marlina', 'email' => 'nina.marlina@ultrajaya.local', 'role' => 'USER'],
            ['name' => 'Sri Wahyuni', 'email' => 'sri.wahyuni@ultrajaya.local', 'role' => 'USER'],
        ];

        $users = collect($managementUsers)
            ->concat($supervisorUsers)
            ->concat(
                collect($operationalUsers)->map(fn(array $user) => [
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'password' => 'password',
                    'role' => $user['role'],
                ])
            )
            ->all();

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'is_active' => true,
                ]
            );

            $user->syncRoles([$userData['role']]);
        }

        $this->command->info(count($users) . ' users seeded successfully.');
    }
}
