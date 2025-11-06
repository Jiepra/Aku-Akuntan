import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { CollectionReference, collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, authenticateFirebase, localAppId } from '../firebaseConfig';
import { initialChartOfAccounts } from '../data/accounts';
import { Account, AccountType, JournalEntryLine, JournalTransaction, ActualFinancialSummary, JournalEntryInput, JournalEntryUI } from '../types/AccountingTypes';

// Existing Interfaces (dipertahankan seperti sebelumnya)
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier?: string;
  created_at?: string;
  user_id?: string;
}

export interface Transaction {
  id: string;
  date: string;
  customer: string;
  type: 'Penjualan' | 'Pembelian';
  amount: number;
  description: string;
  status: 'Lunas' | 'Belum Lunas';
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cost?: number;
  }[];
  paymentMethod?: 'Tunai' | 'Transfer' | 'Kredit';
  cashReceived?: number;
  change?: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  amount: number;
  description: string;
  status: 'Lunas' | 'Belum Lunas';
  items: {
    productId: string;
    productName: string;
    quantity: number;
    cost: number;
  }[];
  paymentMethod?: 'Tunai' | 'Transfer' | 'Kredit';
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: 'Operasional' | 'Administrasi' | 'Penjualan' | 'Lainnya';
  status: 'Lunas' | 'Belum Lunas';
}

interface FinancialSummary {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  totalCOGS: number;
  grossProfit: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

interface AccountsData {
  kas: number;
  piutang: number;
  persediaan: number;
  peralatan: number;
  hutangUsaha: number;
  hutangBank: number;
  modal: number;
}


interface AppContextType {
  userId: string | null;
  accounts: Account[];
  products: Product[];
  transactions: Transaction[];
  purchases: Purchase[];
  journalEntries: JournalEntryUI[];
  expenses: Expense[];
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStock: (id: string, quantity: number, type?: 'sale' | 'purchase') => void;
  updateMultipleProductStocks: (items: { id: string; quantity: number; type?: 'sale' | 'purchase' }[]) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  deletePurchase: (id: string) => void;
  addJournalEntry: (entry: JournalEntryInput) => Promise<void>;
  updateJournalEntry: (id: string, entry: JournalEntryInput) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getFinancialSummary: () => ActualFinancialSummary;
  getFinancialSummaryByPeriod: (startDate: string, endDate: string) => ActualFinancialSummary;
  getAccountsData: () => AccountsData;
}

const getScopedKey = (key: string, user: string) => `${user}_${key}`;
function saveLocal<T>(key: string, data: T, user: string): void {
  localStorage.setItem(getScopedKey(key, user), JSON.stringify(data));
}
function loadLocal<T>(key: string, user: string): T {
  const raw = localStorage.getItem(getScopedKey(key, user));
  try {
    return raw ? (JSON.parse(raw) as T) : ([] as unknown as T);
  } catch {
    return [] as unknown as T;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

declare const __app_id: string;


// Helper function to calculate account balances from journal entries
const calculateAccountBalances = (
  journalEntries: JournalEntryUI[],
  accounts: Account[]
): Map<string, number> => {
  const balances = new Map<string, number>();

  // Inisialisasi saldo awal dari chart of accounts
  accounts.forEach(account => {
    balances.set(account.id, account.initialBalance || 0);
  });

  // Iterasi jurnal untuk memperbarui saldo
  journalEntries.forEach(entry => {
    entry.debit.forEach(line => {
      const account = accounts.find(acc => acc.name === line.account);
      if (account) {
        let currentBalance = balances.get(account.id) || 0;
        currentBalance += line.amount;
        balances.set(account.id, currentBalance);
      } else {
        console.warn(`Akun debit dengan nama "${line.account}" (ID: ${line.account}) tidak ditemukan saat menghitung saldo.`);
      }
    });

    entry.credit.forEach(line => {
      const account = accounts.find(acc => acc.name === line.account);
      if (account) {
        let currentBalance = balances.get(account.id) || 0;
        currentBalance -= line.amount;
        balances.set(account.id, currentBalance);
      } else {
        console.warn(`Akun kredit dengan nama "${line.account}" (ID: ${line.account}) tidak ditemukan saat menghitung saldo.`);
      }
    });
  });

  return balances;
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [journalEntries, setJournalEntries] = useState<JournalEntryUI[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(initialChartOfAccounts);

  useEffect(() => {
    let unsubscribeJournal: () => void;

    authenticateFirebase().then(id => {
      if (id) {
        setUserId(id);

        setProducts(loadLocal<Product[]>("products", id));
        setTransactions(loadLocal<Transaction[]>("transactions", id));
        setPurchases(loadLocal<Purchase[]>("purchases", id));
        setExpenses(loadLocal<Expense[]>("expenses", id));

        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : localAppId;
        console.log("Current App ID for Firestore:", currentAppId);

        const transactionsCollectionRef = collection(db, `artifacts/${currentAppId}/users/${id}/journalTransactions`) as CollectionReference<JournalTransaction>;
        // Perubahan di sini: Urutkan berdasarkan createdAt (timestamp pembuatan) dan kemudian date (tanggal transaksi)
        const q = query(transactionsCollectionRef, orderBy('createdAt', 'desc'), orderBy('date', 'desc'));

        unsubscribeJournal = onSnapshot(q, (snapshot) => {
          const fetchedTransactions: JournalEntryUI[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as JournalTransaction;

            const transactionDate = data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : '';

            const debitLines: { account: string; amount: number }[] = [];
            const creditLines: { account: string; amount: number }[] = [];

            data.lines.forEach(line => {
              const accountName = accounts.find(acc => acc.id === line.accountId)?.name || `Akun Tidak Dikenal (${line.accountId})`;
              if (line.type === 'debit') {
                debitLines.push({ account: accountName, amount: line.amount });
              } else {
                creditLines.push({ account: accountName, amount: line.amount });
              }
            });

            fetchedTransactions.push({
              id: doc.id,
              date: transactionDate,
              description: data.description,
              reference: data.reference,
              type: data.type,
              debit: debitLines,
              credit: creditLines
            });
          });
          setJournalEntries(fetchedTransactions);
          console.log("Transaksi Jurnal diambil dari Firestore:", fetchedTransactions);
        }, (error) => {
          console.error("Error mengambil transaksi jurnal dari Firestore:", error);
        });
      } else {
        console.log("ID Pengguna tidak tersedia setelah autentikasi.");
      }
    });

    return () => {
      if (unsubscribeJournal) {
        unsubscribeJournal();
      }
    };
  }, [userId, accounts]);

  const addProduct = async (product: Omit<Product, 'id' | 'user_id' | 'created_at'>): Promise<string> => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return ''; }
    const newProductId = 'PRD' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4);
    const newProduct: Product = {
      id: newProductId,
      ...product,
      stock: product.stock || 0,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveLocal("products", updated, userId);
    console.log("Produk baru ditambahkan:", newProduct);
    return newProductId;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updatedList = products.map(p => p.id === id ? { ...p, ...updated } : p);
    setProducts(updatedList);
    saveLocal("products", updatedList, userId);
    console.log(`Produk ${id} diperbarui:`, updated);
  };

  const deleteProduct = async (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveLocal("products", updated, userId);
  };

  const updateProductStock = (id: string, quantity: number, type: 'sale' | 'purchase' = 'sale') => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updatedList = products.map(p =>
      p.id === id
        ? { ...p, stock: type === 'sale' ? Math.max(0, p.stock - quantity) : p.stock + quantity }
        : p
    );
    setProducts(updatedList);
    saveLocal("products", updatedList, userId);
    console.log(`Stok produk ${id} diupdate: Jumlah ${quantity}, Tipe: ${type}`);
  };

  const updateMultipleProductStocks = (items: { id: string; quantity: number; type?: 'sale' | 'purchase' }[]) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    
    const updatedList = products.map(product => {
      const item = items.find(i => i.id === product.id);
      if (item) {
        const type = item.type || 'sale';
        return {
          ...product,
          stock: type === 'sale' ? Math.max(0, product.stock - item.quantity) : product.stock + item.quantity
        };
      }
      return product;
    });
    
    setProducts(updatedList);
    saveLocal("products", updatedList, userId);
    console.log(`Stok ${items.length} produk diperbarui sekaligus`);
  };

  const addTransaction = (trx: Omit<Transaction, 'id'>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const id = 'TRX' + Date.now().toString().slice(-6);
    const transaction = { ...trx, id };
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    saveLocal("transactions", updated, userId);

    if (trx.type === 'Penjualan') {
      addJournalEntry({
        date: trx.date,
        description: `Penjualan - ${trx.description}`,
        reference: id,
        type: 'Automatic',
        lines: [
          { accountId: accounts.find(acc => acc.name === 'Kas')?.id || 'UNKNOWN_KAS', amount: trx.amount, type: 'debit' },
          { accountId: accounts.find(acc => acc.name === 'Pendapatan Penjualan Barang')?.id || 'UNKNOWN_PENJUALAN', amount: trx.amount, type: 'kredit' }
        ]
      });

      let totalCostOfGoodsSold = 0;
      trx.items.forEach(item => {
        const productSold = products.find(p => p.id === item.productId);
        const itemCost = productSold ? productSold.cost : (item.cost || 0);
        totalCostOfGoodsSold += item.quantity * itemCost;
      });

      if (totalCostOfGoodsSold > 0) {
        addJournalEntry({
          date: trx.date,
          description: `Harga Pokok Penjualan - ${trx.description}`,
          reference: id,
          type: 'Automatic',
          lines: [
            { accountId: accounts.find(acc => acc.name === 'Harga Pokok Penjualan')?.id || 'UNKNOWN_HPP', amount: totalCostOfGoodsSold, type: 'debit' },
            { accountId: accounts.find(acc => acc.name === 'Persediaan Barang Dagang')?.id || 'UNKNOWN_PERSEDIAAN', amount: totalCostOfGoodsSold, type: 'kredit' }
          ]
        });
      }
    }
  };

  const deleteTransaction = (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveLocal("transactions", updated, userId);
  };

  const addPurchase = (pur: Omit<Purchase, 'id'>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const id = 'PUR' + Date.now().toString().slice(-6);
    const purchase = { ...pur, id };
    const updated = [purchase, ...purchases];
    setPurchases(updated);
    saveLocal("purchases", updated, userId);

    const purchaseAmountForJournal = pur.amount;

    addJournalEntry({
      date: pur.date,
      description: `Pembelian - ${pur.description}`,
      reference: id,
      type: 'Automatic',
      lines: [
        { accountId: accounts.find(acc => acc.name === 'Persediaan Barang Dagang')?.id || 'UNKNOWN_PERSEDIAAN', amount: purchaseAmountForJournal, type: 'debit' },
        { accountId: accounts.find(acc => acc.name === (pur.paymentMethod === 'Tunai' || pur.paymentMethod === 'Transfer' ? 'Kas' : 'Utang Usaha'))?.id || 'UNKNOWN_KAS_UTANG', amount: purchaseAmountForJournal, type: 'kredit' } 
      ]
    });
  };

  const deletePurchase = (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updated = purchases.filter(p => p.id !== id);
    setPurchases(updated);
    saveLocal("purchases", updated, userId);
  };

  const addExpense = (exp: Omit<Expense, 'id'>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const id = 'EXP' + Date.now().toString().slice(-6);
    const expense = { ...exp, id };
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveLocal("expenses", updated, userId);

    let expenseAccountId: string | undefined;
    let contraAccountId: string | undefined;

    const lowerCaseDesc = exp.description.toLowerCase();
    switch (exp.category) {
      case 'Operasional':
        if (lowerCaseDesc.includes('gaji')) {
          expenseAccountId = accounts.find(acc => acc.name === 'Beban Gaji')?.id;
        } else if (lowerCaseDesc.includes('sewa')) {
          expenseAccountId = accounts.find(acc => acc.name === 'Beban Sewa')?.id;
        } else if (lowerCaseDesc.includes('listrik') || lowerCaseDesc.includes('air') || lowerCaseDesc.includes('telepon')) {
          expenseAccountId = accounts.find(acc => acc.name === 'Beban Listrik, Air, Telepon')?.id;
        } else if (lowerCaseDesc.includes('penyusutan')) {
          expenseAccountId = accounts.find(acc => acc.name === 'Beban Penyusutan Peralatan')?.id;
        } else {
          expenseAccountId = accounts.find(acc => acc.name === 'Beban Operasional')?.id || accounts.find(acc => acc.name === 'Beban Lain-lain')?.id;
        }
        break;
      case 'Lainnya':
        expenseAccountId = accounts.find(acc => acc.name === 'Beban Lain-lain')?.id;
        break;
      default:
        expenseAccountId = accounts.find(acc => acc.name === 'Beban Lain-lain')?.id;
        break;
    }
    
    if (!expenseAccountId) {
        expenseAccountId = accounts.find(acc => acc.name === 'Beban Operasional')?.id || accounts.find(acc => acc.name === 'Beban Lain-lain')?.id;
    }


    if (exp.status === 'Lunas') {
      contraAccountId = accounts.find(acc => acc.name === 'Kas')?.id;
    } else {
      contraAccountId = accounts.find(acc => acc.name === 'Utang Usaha')?.id;
    }

    if (!expenseAccountId || !contraAccountId) {
      console.error(`Akun tidak ditemukan saat membuat jurnal beban untuk kategori: ${exp.category}, deskripsi: ${exp.description}, status: ${exp.status}. Expense ID: ${expenseAccountId}, Contra ID: ${contraAccountId}`);
      return;
    }

    addJournalEntry({
      date: exp.date,
      description: `Beban ${exp.category} - ${exp.description}`,
      reference: id,
      type: 'Automatic',
      lines: [
        { accountId: expenseAccountId, amount: exp.amount, type: 'debit' },
        { accountId: contraAccountId, amount: exp.amount, type: 'kredit' }
      ]
    });
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updatedList = expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e);
    setExpenses(updatedList);
    saveLocal("expenses", updatedList, userId);
    
    // If status changed, we might need to update the corresponding journal entry
    // For now, we'll just update the expense record locally
    console.log(`Expense ${id} updated:`, updatedExpense);
  };

  const deleteExpense = (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveLocal("expenses", updated, userId);
  };

  const addJournalEntry = async (entry: JournalEntryInput) => {
    if (!userId) {
      console.error("Pengguna belum diautentikasi. Tidak dapat menambah entri jurnal.");
      return;
    }
    try {
      const journalTransaction: Omit<JournalTransaction, 'id'> = {
        date: Timestamp.fromDate(new Date(entry.date)),
        createdAt: Timestamp.now(), // <-- BARIS INI DITAMBAHKAN
        description: entry.description,
        reference: entry.reference,
        type: entry.type,
        lines: entry.lines
      };

      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : localAppId;

      const docRef = await addDoc(collection(db, `artifacts/${currentAppId}/users/${userId}/journalTransactions`), journalTransaction);
      console.log("Transaksi jurnal ditambahkan ke Firestore dengan ID: ", docRef.id);
    } catch (e) {
      console.error("Error menambah entri jurnal ke Firestore: ", e);
    }
  };

  const updateJournalEntry = async (id: string, entry: JournalEntryInput) => {
    if (!userId) {
      console.error("Pengguna belum diautentikasi.");
      return;
    }
    try {
      const journalTransaction: Omit<JournalTransaction, 'id' | 'createdAt'> = { // createdAt tidak diupdate
        date: Timestamp.fromDate(new Date(entry.date)),
        description: entry.description,
        reference: entry.reference,
        type: entry.type,
        lines: entry.lines
      };

      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : localAppId;
      const journalDocRef = doc(db, `artifacts/${currentAppId}/users/${userId}/journalTransactions`, id);
      
      await updateDoc(journalDocRef, journalTransaction);
      console.log("Transaksi jurnal diupdate di Firestore dengan ID: ", id);
    } catch (e) {
      console.error("Error mengupdate entri jurnal ke Firestore: ", e);
    }
  };


  const deleteJournalEntry = async (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    try {
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : localAppId;
        await deleteDoc(doc(db, `artifacts/${currentAppId}/users/${userId}/journalTransactions`, id));
        console.log("Transaksi jurnal dihapus dari Firestore dengan ID: ", id);
    } catch (e) {
        console.error("Error menghapus entri jurnal dari Firestore: ", e);
    }
  };

  // Fungsi untuk mendapatkan ringkasan keuangan aktual dari jurnal
  const getFinancialSummary = (): ActualFinancialSummary => {
    const accountBalances = calculateAccountBalances(journalEntries, accounts);

    const getBalance = (accountName: string): number => {
      const account = accounts.find(acc => acc.name === accountName);
      if (!account) {
        console.warn(`Akun "${accountName}" tidak ditemukan saat mencoba mendapatkan saldo untuk laporan keuangan.`);
        return 0;
      }
      const balance = accountBalances.get(account.id) || 0;
      
      if (
        account.type === AccountType.LIABILITY ||
        account.type === AccountType.EQUITY ||
        account.type === AccountType.REVENUE ||
        account.type === AccountType.OTHER_INCOME
      ) {
        return Math.abs(balance);
      }
      return balance;
    };

    // --- Perhitungan Laporan Laba Rugi ---
    const totalPendapatan = getBalance('Pendapatan Penjualan Barang') + getBalance('Pendapatan Jasa') + getBalance('Pendapatan Lain-lain');
    
    const hargaPokokPenjualan = getBalance('Harga Pokok Penjualan'); 

    const bebanGaji = getBalance('Beban Gaji');
    const bebanSewa = getBalance('Beban Sewa');
    const bebanListrikAirTelepon = getBalance('Beban Listrik, Air, Telepon');
    const bebanPenyusutanPeralatan = getBalance('Beban Penyusutan Peralatan');
    const bebanLainLain = getBalance('Beban Lain-lain');


    const bebanOperasional = bebanGaji + bebanSewa + bebanListrikAirTelepon + bebanPenyusutanPeralatan;
    const totalBebanLainLain = bebanLainLain;

    const labaKotor = totalPendapatan - hargaPokokPenjualan;
    const labaBersih = labaKotor - bebanOperasional - totalBebanLainLain;

    // --- Perhitungan Neraca (Laporan Posisi Keuangan) ---
    const kas = getBalance('Kas');
    const bank = getBalance('Bank');
    const piutangUsaha = getBalance('Piutang Usaha');
    const persediaanBarangDagang = getBalance('Persediaan Barang Dagang');
    const peralatanKantor = getBalance('Peralatan Kantor');
    const akumulasiPenyusutanPeralatan = getBalance('Akumulasi Penyusutan Peralatan'); 
    
    const utangUsaha = getBalance('Utang Usaha');
    const utangGaji = getBalance('Utang Gaji');
    const utangBankJangkaPanjang = getBalance('Utang Bank Jangka Panjang');

    const modalDisetor = getBalance('Modal Disetor');
    const prive = getBalance('Prive');

    const initialLabaDitahan = (initialChartOfAccounts.find(acc => acc.name === 'Laba Ditahan')?.initialBalance || 0);
    const labaDitahanFinal = initialLabaDitahan + labaBersih - prive;

    const totalAsetLancar = kas + bank + piutangUsaha + persediaanBarangDagang;
    const totalAsetTetap = peralatanKantor - akumulasiPenyusutanPeralatan;
    const totalAset = totalAsetLancar + totalAsetTetap;

    const totalKewajibanJangkaPendek = utangUsaha + utangGaji;
    const totalKewajibanJangkaPanjang = utangBankJangkaPanjang;
    const totalKewajiban = totalKewajibanJangkaPendek + totalKewajibanJangkaPanjang;
    
    const totalEkuitas = modalDisetor + labaDitahanFinal;

    const arusKasOperasiBersih = 0;
    const arusKasInvestasiBersih = 0;
    const arusKasPendanaanBersih = 0;

    const kasAwalPeriode = getBalance('Kas');
    const kasAkhirPeriode = kas;
    const kenaikanPenurunanKas = kasAkhirPeriode - kasAwalPeriode;


    return {
      totalPendapatan,
      hargaPokokPenjualan,
      bebanOperasional,
      bebanLainLain: totalBebanLainLain,
      labaKotor,
      labaBersih,

      totalAsetLancar,
      totalAsetTetap,
      totalAset,
      totalKewajibanJangkaPendek,
      totalKewajibanJangkaPanjang,
      totalKewajiban,
      totalEkuitas,

      arusKasOperasiBersih,
      arusKasInvestasiBersih,
      arusKasPendanaanBersih,
      kenaikanPenurunanKas,
      kasAwalPeriode: getBalance('Kas'),
      kasAkhirPeriode: getBalance('Kas'),
    };
  };

  const getFinancialSummaryByPeriod = (startDate: string, endDate: string): ActualFinancialSummary => {
    // Filter journal entries by date range
    const filteredJournalEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of the day for proper comparison
      end.setHours(23, 59, 59, 999);
      return entryDate >= start && entryDate <= end;
    });

    const accountBalances = calculateAccountBalances(filteredJournalEntries, accounts);

    const getBalance = (accountName: string): number => {
      const account = accounts.find(acc => acc.name === accountName);
      if (!account) {
        console.warn(`Akun "${accountName}" tidak ditemukan saat mencoba mendapatkan saldo untuk laporan keuangan.`);
        return 0;
      }
      const balance = accountBalances.get(account.id) || 0;
      
      if (
        account.type === AccountType.LIABILITY ||
        account.type === AccountType.EQUITY ||
        account.type === AccountType.REVENUE ||
        account.type === AccountType.OTHER_INCOME
      ) {
        return Math.abs(balance);
      }
      return balance;
    };

    // --- Perhitungan Laporan Laba Rugi ---
    const totalPendapatan = getBalance('Pendapatan Penjualan Barang') + getBalance('Pendapatan Jasa') + getBalance('Pendapatan Lain-lain');
    
    const hargaPokokPenjualan = getBalance('Harga Pokok Penjualan'); 

    const bebanGaji = getBalance('Beban Gaji');
    const bebanSewa = getBalance('Beban Sewa');
    const bebanListrikAirTelepon = getBalance('Beban Listrik, Air, Telepon');
    const bebanPenyusutanPeralatan = getBalance('Beban Penyusutan Peralatan');
    const bebanLainLain = getBalance('Beban Lain-lain');


    const bebanOperasional = bebanGaji + bebanSewa + bebanListrikAirTelepon + bebanPenyusutanPeralatan;
    const totalBebanLainLain = bebanLainLain;

    const labaKotor = totalPendapatan - hargaPokokPenjualan;
    const labaBersih = labaKotor - bebanOperasional - totalBebanLainLain;

    // --- Perhitungan Neraca (Laporan Posisi Keuangan) ---
    const kas = getBalance('Kas');
    const bank = getBalance('Bank');
    const piutangUsaha = getBalance('Piutang Usaha');
    const persediaanBarangDagang = getBalance('Persediaan Barang Dagang');
    const peralatanKantor = getBalance('Peralatan Kantor');
    const akumulasiPenyusutanPeralatan = getBalance('Akumulasi Penyusutan Peralatan'); 
    
    const utangUsaha = getBalance('Utang Usaha');
    const utangGaji = getBalance('Utang Gaji');
    const utangBankJangkaPanjang = getBalance('Utang Bank Jangka Panjang');

    const modalDisetor = getBalance('Modal Disetor');
    const prive = getBalance('Prive');

    const initialLabaDitahan = (initialChartOfAccounts.find(acc => acc.name === 'Laba Ditahan')?.initialBalance || 0);
    const labaDitahanFinal = initialLabaDitahan + labaBersih - prive;

    const totalAsetLancar = kas + bank + piutangUsaha + persediaanBarangDagang;
    const totalAsetTetap = peralatanKantor - akumulasiPenyusutanPeralatan;
    const totalAset = totalAsetLancar + totalAsetTetap;

    const totalKewajibanJangkaPendek = utangUsaha + utangGaji;
    const totalKewajibanJangkaPanjang = utangBankJangkaPanjang;
    const totalKewajiban = totalKewajibanJangkaPendek + totalKewajibanJangkaPanjang;
    
    const totalEkuitas = modalDisetor + labaDitahanFinal;

    const arusKasOperasiBersih = 0;
    const arusKasInvestasiBersih = 0;
    const arusKasPendanaanBersih = 0;

    const kasAwalPeriode = getBalance('Kas');
    const kasAkhirPeriode = kas;
    const kenaikanPenurunanKas = kasAkhirPeriode - kasAwalPeriode;


    return {
      totalPendapatan,
      hargaPokokPenjualan,
      bebanOperasional,
      bebanLainLain: totalBebanLainLain,
      labaKotor,
      labaBersih,

      totalAsetLancar,
      totalAsetTetap,
      totalAset,
      totalKewajibanJangkaPendek,
      totalKewajibanJangkaPanjang,
      totalKewajiban,
      totalEkuitas,

      arusKasOperasiBersih,
      arusKasInvestasiBersih,
      arusKasPendanaanBersih,
      kenaikanPenurunanKas,
      kasAwalPeriode: getBalance('Kas'),
      kasAkhirPeriode: getBalance('Kas'),
    };
  };

  const getAccountsData = (): AccountsData => {
    const accountBalances = calculateAccountBalances(journalEntries, accounts);

    const getBalance = (accountName: string) => {
        const account = accounts.find(acc => acc.name === accountName);
        if (!account) {
          console.warn(`Akun "${accountName}" tidak ditemukan saat mencoba mendapatkan saldo untuk data akun.`);
          return 0;
        }
        const balance = accountBalances.get(account.id) || 0;
        
        if (
          account.type === AccountType.LIABILITY ||
          account.type === AccountType.EQUITY ||
          account.type === AccountType.REVENUE ||
          account.type === AccountType.OTHER_INCOME
        ) {
          return Math.abs(balance);
        }
        return balance;
    };

    const kas = getBalance('Kas');
    const piutangUsaha = getBalance('Piutang Usaha');
    const persediaanBarangDagang = getBalance('Persediaan Barang Dagang');
    const peralatanKantor = getBalance('Peralatan Kantor');
    const akumulasiPenyusutanPeralatan = getBalance('Akumulasi Penyusutan Peralatan');
    const hutangUsaha = getBalance('Utang Usaha');
    const hutangBankJangkaPanjang = getBalance('Utang Bank Jangka Panjang');
    const modalDisetor = getBalance('Modal Disetor');
    
    const summary = getFinancialSummary();
    const prive = getBalance('Prive');
    const initialLabaDitahan = (initialChartOfAccounts.find(acc => acc.name === 'Laba Ditahan')?.initialBalance || 0);
    const labaDitahan = initialLabaDitahan + summary.labaBersih - prive;

    const totalModal = modalDisetor + labaDitahan;


    return {
      kas: kas,
      piutang: piutangUsaha,
      persediaan: persediaanBarangDagang,
      peralatan: peralatanKantor - akumulasiPenyusutanPeralatan,
      hutangUsaha: hutangUsaha,
      hutangBank: hutangBankJangkaPanjang,
      modal: totalModal
    };
  };


  const value: AppContextType = {
    userId,
    accounts,
    products,
    transactions,
    purchases,
    journalEntries,
    expenses,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    updateMultipleProductStocks,
    addTransaction,
    deleteTransaction,
    addPurchase,
    deletePurchase,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addExpense,
    updateExpense,
    deleteExpense,
    getFinancialSummary,
    getFinancialSummaryByPeriod,
    getAccountsData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
