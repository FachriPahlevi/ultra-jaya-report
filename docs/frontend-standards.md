# Standar frontend

## Struktur dan tanggung jawab

- `Components` berisi komponen UI yang dapat dipakai lintas fitur.
- `lib` berisi utilitas lintas aplikasi yang tidak merender UI, termasuk HTTP client, pengelola layer, dan modal stack.
- `Pages/<domain>/api` hanya berisi fungsi request HTTP untuk domain tersebut.
- `Pages/<domain>/hooks` mengelola state aksi asinkron untuk domain tersebut.
- `Pages/<domain>/utils` hanya berisi fungsi murni tanpa React atau request HTTP.
- `Pages/<domain>/types.ts` menyimpan tipe yang hanya relevan untuk domain tersebut.
- Halaman Inertia mengatur data halaman, navigasi, dan komposisi komponen.
- Komponen yang hanya dipakai satu domain berada di `Pages/<domain>/components`, bukan di `Components` global.

## Request data

- Gunakan `@/lib/http`; jangan mengimpor `axios` langsung.
- Gunakan Inertia untuk navigasi, form dengan redirect, dan data props halaman.
- Gunakan API dan hook domain untuk aksi JSON dari modal atau interaksi tanpa navigasi.
- Pesan error ditampilkan melalui `getRequestErrorMessage` agar detail teknis tidak sampai ke pengguna.

## Modal dan layer

- Semua modal harus menggunakan `ModalOverlay`, yang merender melalui React Portal.
- Modal teratas saja yang dapat ditutup melalui backdrop atau tombol Escape.
- Gunakan token dari `@/lib/layers`; angka `z-index` tidak boleh ditulis langsung di komponen.
- Urutan layer: sticky `10`, dropdown `20`, overlay sidebar `40`, sidebar `50`, modal `100`, dan status modal `200`.

## Komponen

- Handler diberi nama `handle...` dan dibuat di luar JSX bila memiliki logika.
- Hindari callback ref dan manipulasi DOM pada JSX. Gunakan state React atau komponen khusus.
- Pecah bagian UI yang memiliki state atau tanggung jawab sendiri menjadi komponen privat di file yang sama; pindahkan ke file lain saat dipakai lintas fitur.
- Gunakan bahasa Indonesia untuk teks yang dilihat pengguna.
