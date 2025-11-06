// src/data/accounts.ts

import { Account, AccountType } from '../types/AccountingTypes';

export const initialChartOfAccounts: Account[] = [
  // Aset (100s)
  { id: '101', name: 'Kas', type: AccountType.ASSET, initialBalance: 0 }, // Diubah menjadi 0
  { id: '102', name: 'Bank', type: AccountType.ASSET, initialBalance: 0 }, // Diubah menjadi 0
  { id: '103', name: 'Piutang Usaha', type: AccountType.ASSET, initialBalance: 0 },
  { id: '104', name: 'Persediaan Barang Dagang', type: AccountType.ASSET, initialBalance: 0 }, // Diubah menjadi 0
  { id: '151', name: 'Peralatan Kantor', type: AccountType.ASSET, initialBalance: 0 }, // Diubah menjadi 0
  { id: '152', name: 'Akumulasi Penyusutan Peralatan', type: AccountType.ASSET, initialBalance: 0 },

  // Kewajiban (200s)
  { id: '201', name: 'Utang Usaha', type: AccountType.LIABILITY, initialBalance: 0 },
  { id: '202', name: 'Utang Gaji', type: AccountType.LIABILITY, initialBalance: 0 },
  { id: '251', name: 'Utang Bank Jangka Panjang', type: AccountType.LIABILITY, initialBalance: 0 },

  // Ekuitas/Modal (300s)
  { id: '301', name: 'Modal Disetor', type: AccountType.EQUITY, initialBalance: 0 }, // Diubah menjadi 0
  { id: '302', name: 'Laba Ditahan', type: AccountType.EQUITY, initialBalance: 0 },
  { id: '303', name: 'Prive', type: AccountType.EQUITY, initialBalance: 0 },

  // Pendapatan (400s)
  { id: '401', name: 'Pendapatan Penjualan Barang', type: AccountType.REVENUE, initialBalance: 0 },
  { id: '402', name: 'Pendapatan Jasa', type: AccountType.REVENUE, initialBalance: 0 },
  { id: '499', name: 'Pendapatan Lain-lain', type: AccountType.OTHER_INCOME, initialBalance: 0 },


  // Beban (500s)
  { id: '501', name: 'Harga Pokok Penjualan', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '502', name: 'Beban Gaji', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '503', name: 'Beban Sewa', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '504', name: 'Beban Listrik, Air, Telepon', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '505', name: 'Beban Penyusutan Peralatan', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '510', name: 'Beban Operasional', type: AccountType.EXPENSE, initialBalance: 0 },
  { id: '599', name: 'Beban Lain-lain', type: AccountType.OTHER_EXPENSE, initialBalance: 0 },
];
