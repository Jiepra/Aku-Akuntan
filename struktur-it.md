# Dokumentasi Struktur IT Proyek Akuakuntan

## Gambaran Umum

Proyek "Akuakuntan" adalah aplikasi web berbasis React yang dirancang sebagai sistem akuntansi sederhana untuk membantu pengguna mengelola keuangan bisnis kecil. Aplikasi ini menggunakan teknologi modern dan arsitektur frontend yang terstruktur dengan baik.

## Arsitektur Teknologi

### Stack Teknologi Utama
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Firebase (Firestore Database + Authentication)
- **Routing**: React Router DOM
- **State Management**: React Context API + React Query
- **Package Manager**: Bun

### Struktur Folder

```
akuakuntan/
├── public/                 # File statis
├── src/                    # Source code utama
│   ├── components/         # Komponen UI bisnis
│   ├── components/ui/      # Komponen UI primitif (shadcn/ui)
│   ├── contexts/           # Manajemen state global
│   ├── data/               # Data statis dan konfigurasi
│   ├── hooks/              # Custom hooks (jika ada)
│   ├── lib/                # Utilitas dan fungsi bantuan
│   ├── pages/              # Komponen halaman utama
│   ├── types/              # Definisi tipe TypeScript
│   └── firebaseConfig.ts   # Konfigurasi Firebase
├── package.json            # Dependencies dan scripts
├── vite.config.ts          # Konfigurasi Vite
├── tailwind.config.ts      # Konfigurasi Tailwind CSS
└── tsconfig.json           # Konfigurasi TypeScript
```

## Detail Struktur File dan Fungsi

### Folder `src/`
- **`components/`**: Berisi komponen UI spesifik untuk fitur-fitur aplikasi seperti:
  - `Beban.tsx`: Manajemen beban dan pengeluaran
  - `Dashboard.tsx`: Ringkasan data keuangan
  - `Produk.tsx`: Manajemen produk
  - `Kasir.tsx`: Sistem point of sale
  - `Transaksi.tsx`: Manajemen transaksi penjualan
  - `Pembelian.tsx`: Manajemen pembelian
  - `Jurnal.tsx`: Jurnal akuntansi
  - `Laporan.tsx`: Laporan keuangan
  - `Sidebar.tsx`: Navigasi sisi kiri
  - `BottomNav.tsx`: Navigasi bawah mobile
  - `AddExpenseModal.tsx`: Modal form untuk menambah beban

- **`components/ui/`**: Komponen UI dari shadcn/ui yang telah digenerated:
  - Komponen-komponen primitif seperti `button.tsx`, `input.tsx`, `card.tsx`, dll
  - Semua komponen ini dibangun di atas Radix UI untuk aksesibilitas dan fungsionalitas

- **`contexts/`**:
  - `AppContext.tsx`: Centralized state management untuk seluruh data aplikasi (produk, transaksi, jurnal, beban, dll)

- **`data/`**:
  - `accounts.ts`: Chart of accounts awal untuk sistem akuntansi

- **`pages/`**:
  - `Index.tsx`: Root layout untuk area dashboard yang menyatukan sidebar, konten utama, dan bottom navigation
  - `Auth.tsx`: Halaman otentikasi (diduga)

- **`types/`**:
  - `AccountingTypes.ts`: Definisi tipe TypeScript untuk struktur data akuntansi

- **File Utama**:
  - `App.tsx`: Entry point utama yang menyediakan routing, state management, dan layanan global
  - `main.tsx`: Titik masuk awal aplikasi
  - `firebaseConfig.ts`: Konfigurasi dan integrasi Firebase

## Arsitektur Aplikasi

### 1. State Management
- **Global State**: Menggunakan React Context API melalui `AppContext` untuk menyimpan data aplikasi seperti produk, transaksi, jurnal, dan pengeluaran
- **Local State**: Digunakan untuk state komponen individual
- **Server State**: Dikelola oleh React Query untuk caching dan sinkronisasi data dari Firebase

### 2. Data Flow
1. **Otentikasi**: Firebase menyediakan user ID yang digunakan sebagai namespace untuk data pengguna
2. **Data Lokal**: Disimpan di `localStorage` dengan scope berdasarkan user ID
3. **Data Persisten**: Disimpan di Firebase Firestore dalam collections terorganisir
4. **Sinkronisasi**: Data disinkronkan secara real-time antara client dan server

### 3. Integrasi Firebase
- **Firestore**: Struktur data disimpan dalam collection nested berdasarkan `artifacts/{app_id}/users/{user_id}/`
- **Authentication**: Otentikasi anonim digunakan untuk kemudahan akses
- **Real-time Updates**: Gunakan listeners untuk memperbarui UI secara otomatis

### 4. Pola Desain
- **Component-Based Architecture**: Setiap fitur disajikan sebagai komponen mandiri
- **Separation of Concerns**: Pemisahan antara UI, logika bisnis, dan manajemen data
- **Container-Component Pattern**: Komponen kontainer (seperti `Beban.tsx`) mengelola logika dan data, sementara komponen UI hanya menangani presentasi

## Teknologi Spesifik

### UI dan Styling
- **Tailwind CSS**: Framework CSS utility-first untuk styling cepat dan konsisten
- **shadcn/ui**: Library komponen UI yang dapat disesuaikan dengan tema
- **Radix UI**: Primitif UI tanpa gaya untuk komponen yang dapat diakses dan fleksibel

### Fungsionalitas Aplikasi
- **Sistem Akuntansi**: Implementasi konsep akuntansi seperti jurnal umum, chart of accounts, dan laporan keuangan
- **Manajemen Produk**: CRUD produk dengan stok tracking
- **Sistem POS**: Penjualan langsung dengan perhitungan otomatis
- **Jurnal Akuntansi**: Pencatatan transaksi akuntansi berdasarkan prinsip debit-kredit
- **Laporan Keuangan**: Perhitungan otomatis berdasarkan transaksi jurnal

## Pattern dan Praktik Terbaik

1. **Type Safety**: Penggunaan TypeScript untuk memastikan type safety di seluruh aplikasi
2. **Responsive Design**: Antarmuka yang beradaptasi dengan ukuran layar berkat Tailwind CSS
3. **Reusability**: Komponen UI yang dapat digunakan kembali untuk mengurangi duplikasi kode
4. **Separation of Concerns**: Pembagian yang jelas antara logika bisnis, tampilan, dan manajemen state
5. **Error Handling**: Penanganan error yang baik dalam operasi Firebase dan logika aplikasi

## Fitur AI Integration

Aplikasi "Akuakuntan" juga dilengkapi dengan fitur kecerdasan buatan (AI) yang dapat menjawab pertanyaan-pertanyaan terkait data keuangan. Berikut adalah komponen-komponen dari fitur AI:

### 1. AI Service Layer
- **File**: `src/lib/aiService.ts`
- **Fungsi**: Mengelola koneksi ke Google AI API (Gemini 2.5 Flash)
- **Fungsionalitas**: Mengambil data keuangan dari aplikasi dan mengirimkan ke API AI untuk mendapatkan jawaban

### 2. AI Configuration
- **File**: `src/lib/aiConfig.ts`
- **Fungsi**: Mengelola konfigurasi API seperti URL, model, dan retry logic
- **Fungsionalitas**: Menyediakan konfigurasi terpusat untuk layanan AI

### 3. Integrasi dengan AppContext
- **Fungsi**: `askAI(question: string)`
- **Fungsionalitas**: Mengakses data keuangan (produk, transaksi, pembelian, beban) dari context dan mengirimkannya ke AI untuk diproses

### 4. UI Component
- **File**: `src/components/AIAssistant.tsx`
- **Fungsi**: Menyediakan antarmuka chatting untuk berinteraksi dengan AI
- **Fitur**: Riwayat percakapan, tampilan real-time, dan respons otomatis

## Cara Mengatur API Key

Untuk menggunakan fitur AI, Anda perlu mengatur API key Google AI Studio:

1. Buat file `.env` di root direktori proyek Anda
2. Tambahkan baris berikut:
   ```
   VITE_GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```
3. Jangan pernah mengunggah file `.env` ke repository karena berisi informasi sensitif
4. Saat ini API key disimpan di file sebagai fallback, tetapi sebaiknya gunakan environment variable

API yang digunakan: `gemini-2.5-flash` dengan retry logic dan timeout untuk penanganan error yang lebih baik.

## Kesimpulan

Aplikasi "Akuakuntan" menggabungkan teknologi modern dalam satu stack yang efisien dan terstruktur dengan baik. Arsitektur yang digunakan memungkinkan pengembangan aplikasi yang mudah dipelihara dan diperluas, sambil menyediakan pengalaman pengguna yang responsif dan intuitif untuk manajemen keuangan sederhana. Dengan integrasi AI, aplikasi ini juga menyediakan asisten keuangan pintar yang dapat membantu pengguna dalam menganalisis dan memahami data keuangan mereka.