// src/types/AccountingTypes.ts

import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Enum untuk jenis akun dalam akuntansi
export enum AccountType {
  ASSET = 'Aset',
  LIABILITY = 'Kewajiban',
  EQUITY = 'Ekuitas', // atau Modal
  REVENUE = 'Pendapatan',
  EXPENSE = 'Beban',
  OTHER_INCOME = 'Pendapatan Lain-lain',
  OTHER_EXPENSE = 'Beban Lain-lain'
}

// Interface untuk struktur akun
export interface Account {
  id: string; // ID unik akun (misal: "101", "201", "401")
  name: string; // Nama akun (misal: "Kas", "Piutang Usaha", "Penjualan")
  type: AccountType; // Tipe akun berdasarkan enum AccountType
  initialBalance?: number; // Saldo awal akun (opsional, relevan untuk neraca awal)
}

// Interface untuk setiap baris debit atau kredit dalam sebuah transaksi jurnal
export interface JournalEntryLine {
  accountId: string; // ID akun yang terpengaruh
  amount: number;    // Jumlah debit atau kredit
  type: 'debit' | 'kredit'; // Menandakan apakah ini debit atau kredit
}

// Interface untuk struktur transaksi jurnal lengkap yang disimpan di Firestore
export interface JournalTransaction {
  id?: string; // ID unik transaksi jurnal (opsional karena Firestore akan generate)
  date: Timestamp; // Tanggal transaksi
  createdAt?: Timestamp; // <-- BARIS INI DITAMBAHKAN: Timestamp saat jurnal dibuat
  description: string; // Deskripsi singkat transaksi
  reference: string; // Properti referensi
  type: 'Manual' | 'Automatic'; // Menandakan apakah jurnal dibuat manual atau otomatis
  lines: JournalEntryLine[]; // Baris-baris debit/kredit dalam transaksi ini
}

// Interface untuk data jurnal yang diterima dari input komponen UI
// Tanggal masih dalam format string sebelum dikonversi ke Timestamp
export interface JournalEntryInput {
  date: string; // Tanggal sebagai string (dari input form)
  description: string;
  reference: string;
  type: 'Manual' | 'Automatic';
  lines: JournalEntryLine[];
}

// Interface untuk representasi jurnal di UI (sudah diubah dari JournalTransaction mentah)
// Ini digunakan untuk menampilkan jurnal di komponen Jurnal.tsx
export interface JournalEntryUI {
  id: string;
  date: string; // Tanggal dalam format string yang mudah dibaca
  description: string;
  reference: string;
  type: 'Manual' | 'Automatic';
  debit: { account: string; amount: number }[];
  credit: { account: string; amount: number }[];
}

// Interface untuk ringkasan keuangan yang akan dihitung dan digunakan di Laporan.tsx
// Ini akan menjadi hasil dari perhitungan akuntansi yang sebenarnya
export interface ActualFinancialSummary {
  // Laba Rugi
  totalPendapatan: number;
  hargaPokokPenjualan: number; // Penting untuk laba kotor
  bebanOperasional: number;
  bebanLainLain: number;
  labaKotor: number;
  labaBersih: number;

  // Neraca
  totalAsetLancar: number;
  totalAsetTetap: number;
  totalAset: number;
  totalKewajibanJangkaPendek: number;
  totalKewajibanJangkaPanjang: number;
  totalKewajiban: number;
  totalEkuitas: number;

  // Arus Kas (Sangat Sederhanakan untuk saat ini)
  arusKasOperasiBersih: number;
  arusKasInvestasiBersih: number;
  arusKasPendanaanBersih: number;
  kenaikanPenurunanKas: number;
  kasAwalPeriode: number;
  kasAkhirPeriode: number;
}
