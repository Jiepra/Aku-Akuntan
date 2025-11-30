# User Flow Akuakuntan

Berikut adalah alur penggunaan aplikasi Akuakuntan dari awal hingga akhir:

## 1. Halaman Otentikasi (`/auth`)

- Pengguna membuka aplikasi dan otomatis diarahkan ke halaman otentikasi
- Aplikasi menggunakan otentikasi anonim (tanpa login)
- Setelah otentikasi berhasil, pengguna diarahkan ke halaman dasbor

## 2. Halaman Dasbor (`/dashboard`)

Setelah login, pengguna masuk ke halaman dasbor utama yang terdiri dari beberapa komponen navigasi dan konten:

### 2.1. Navigasi Utama
- **Sidebar (tampil di desktop)**: Berisi daftar menu utama
- **Bottom Navigation (tampil di mobile)**: Versi mobile dari menu sidebar

### 2.2. Daftar Menu
- **Dashboard**: Tampilan utama yang menunjukkan ringkasan keuangan
- **Produk**: Manajemen produk/jasa yang dijual
- **Kasir**: Fitur POS untuk membuat transaksi penjualan
- **Transaksi**: Histori transaksi penjualan dan pembelian
- **Pembelian**: Manajemen pembelian barang/stok
- **Beban**: Manajemen pengeluaran dan beban operasional
- **Laporan**: Laporan keuangan POS (sederhana)

## 3. Alur Penggunaan Berdasarkan Fitur

### 3.1. Manajemen Produk

1. Klik menu **Produk**
2. Pengguna bisa:
   - Melihat daftar produk
   - Menambah produk baru melalui modal "Tambah Produk"
   - Mengedit produk yang ada
   - Menghapus produk
   - Filter produk berdasarkan kategori

### 3.2. Proses Penjualan (POS)

1. Klik menu **Kasir**
2. Pengguna memilih produk dari daftar
3. Menentukan jumlah dan metode pembayaran
4. Sistem menghitung total dan kembalian (jika tunai)
5. Menyimpan transaksi
6. Sistem mencetak struk (jika diperlukan)

### 3.3. Mencatat Pengeluaran/Beban

1. Klik menu **Beban**
2. Klik tombol "Tambah Pengeluaran"
3. Isi detail pengeluaran:
   - Tanggal
   - Kategori (Operasional, Administrasi, Penjualan, Lainnya)
   - Deskripsi
   - Jumlah
   - Status (Lunas/Belum Lunas)
4. Sistem otomatis menghitung dampak ke laporan keuangan

### 3.4. Melihat Laporan Keuangan

1. Klik menu **Laporan**
2. Pilih periode (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini)
3. Lihat ringkasan:
   - Total Penjualan
   - Harga Pokok Penjualan
   - Laba Kotor
   - Laba Bersih
   - Produk Terlaris
4. Cetak atau ekspor ke PDF (jika diperlukan)

### 3.5. Manajemen Pembelian

1. Klik menu **Pembelian**
2. Catat pembelian barang/stok baru
3. Sistem otomatis mengupdate stok produk

## 4. Fitur Tambahan

### 4.1. AI Assistant
- Terdapat tombol AI di kanan bawah
- Menyediakan bantuan keuangan berbasis pertanyaan
- Memberikan informasi berdasarkan data keuangan yang ada

### 4.2. Logout
- Di halaman dashboard, ada tombol logout di kanan atas
- Menggunakan konfirmasi sebelum logout

## 5. Alur Umum Pengguna Harian

1. **Login** → Otentikasi anonim
2. **Cek Dashboard** → Melihat ringkasan harian
3. **Proses Penjualan** → Menggunakan fitur Kasir untuk transaksi
4. **Catat Beban** → Jika ada pengeluaran operasional
5. **Update Produk** → Jika ada perubahan stok atau harga
6. **Lihat Laporan** → Di akhir hari/bulan untuk evaluasi

## 6. Alur Laporan Harian

1. Buka menu **Laporan**
2. Pilih periode "Hari Ini"
3. Cek:
   - Total Penjualan Harian
   - Laba Bersih Harian
   - Produk terlaris hari ini
4. Cetak jika diperlukan untuk arsip

## Catatan

- Semua data disimpan secara lokal dan disinkronkan ke Firebase
- Aplikasi bekerja secara offline-first
- Tampilan responsif untuk desktop dan mobile
- Sistem tidak menggunakan jurnal akuntansi kompleks, melainkan laporan POS sederhana
- Penggunaan notifikasi/Toast kini muncul di pojok kanan atas dengan durasi yang lebih cepat