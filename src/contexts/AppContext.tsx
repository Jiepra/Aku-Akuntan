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
import { Account, AccountType, ActualFinancialSummary } from '../types/AccountingTypes';
import { aiService, FinancialData } from '../lib/aiService';

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
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getFinancialSummary: () => ActualFinancialSummary;
  getFinancialSummaryByPeriod: (startDate: string, endDate: string) => ActualFinancialSummary;
  getAccountsData: () => AccountsData;
  askAI: (question: string) => Promise<string>;
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


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [accounts, setAccounts] = useState<Account[]>(initialChartOfAccounts);

  useEffect(() => {
    authenticateFirebase().then(id => {
      if (id) {
        setUserId(id);

        setProducts(loadLocal<Product[]>("products", id));
        setTransactions(loadLocal<Transaction[]>("transactions", id));
        setPurchases(loadLocal<Purchase[]>("purchases", id));
        setExpenses(loadLocal<Expense[]>("expenses", id));
      } else {
        console.log("ID Pengguna tidak tersedia setelah autentikasi.");
      }
    });
  }, [userId]);

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

    // Update product stock for sales
    if (trx.type === 'Penjualan') {
      updateMultipleProductStocks(trx.items.map(item => ({
        id: item.productId,
        quantity: item.quantity,
        type: 'sale'
      })));
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

    // Update product stock for purchases
    updateMultipleProductStocks(pur.items.map(item => ({
      id: item.productId,
      quantity: item.quantity,
      type: 'purchase'
    })));
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
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updatedList = expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e);
    setExpenses(updatedList);
    saveLocal("expenses", updatedList, userId);
    console.log(`Expense ${id} updated:`, updatedExpense);
  };

  const deleteExpense = (id: string) => {
    if (!userId) { console.error("Pengguna belum diautentikasi."); return; }
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveLocal("expenses", updated, userId);
  };

  // Fungsi untuk mendapatkan ringkasan keuangan langsung dari transaksi
  const getFinancialSummary = (): ActualFinancialSummary => {
    // Calculate sales revenue
    const totalPendapatan = transactions
      .filter(t => t.type === 'Penjualan')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate cost of goods sold (COGS) based on product costs
    let totalHargaPokokPenjualan = 0;
    transactions
      .filter(t => t.type === 'Penjualan')
      .forEach(t => {
        t.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            totalHargaPokokPenjualan += item.quantity * (product.cost || 0);
          }
        });
      });

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate purchases
    const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Calculate net profit/loss
    const labaKotor = totalPendapatan - totalHargaPokokPenjualan;
    const labaBersih = labaKotor - totalExpenses;

    // Calculate cash flow
    const cashSales = transactions
      .filter(t => t.type === 'Penjualan' && t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = expenses
      .filter(e => e.status === 'Lunas')
      .reduce((sum, e) => sum + e.amount, 0);

    const cashPurchases = purchases
      .filter(p => p.status === 'Lunas' || p.paymentMethod === 'Tunai')
      .reduce((sum, p) => sum + p.amount, 0);

    const arusKasOperasiBersih = cashSales - cashExpenses - cashPurchases;

    // Calculate assets based on transactions and purchases
    const kas = cashSales - cashExpenses - cashPurchases; // Simplified calculation
    const totalAset = kas + totalPurchases; // Simplified calculation

    // For liabilities and equity, we'll use simpler metrics since we're not using journal entries
    const totalKewajiban = expenses.filter(e => e.status !== 'Lunas').reduce((sum, e) => sum + e.amount, 0) +
                          purchases.filter(p => p.status !== 'Lunas').reduce((sum, p) => sum + p.amount, 0);

    const totalEkuitas = totalPendapatan - totalExpenses - totalPurchases + totalKewajiban; // Simplified calculation

    // Calculate other metrics
    const bebanOperasional = expenses
      .filter(e => e.category === 'Operasional')
      .reduce((sum, e) => sum + e.amount, 0);

    const bebanLainLain = expenses
      .filter(e => e.category === 'Lainnya')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalPendapatan,
      hargaPokokPenjualan: totalHargaPokokPenjualan,
      bebanOperasional,
      bebanLainLain,
      labaKotor,
      labaBersih,

      totalAsetLancar: kas, // Simplified
      totalAsetTetap: totalPurchases, // Simplified
      totalAset,
      totalKewajibanJangkaPendek: totalKewajiban,
      totalKewajibanJangkaPanjang: 0, // Simplified
      totalKewajiban,
      totalEkuitas,

      arusKasOperasiBersih,
      arusKasInvestasiBersih: 0,
      arusKasPendanaanBersih: 0,
      kenaikanPenurunanKas: arusKasOperasiBersih, // Simplified
      kasAwalPeriode: 0, // Simplified
      kasAkhirPeriode: kas
    };
  };

  const getFinancialSummaryByPeriod = (startDate: string, endDate: string): ActualFinancialSummary => {
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of the day for proper comparison
      end.setHours(23, 59, 59, 999);
      return transactionDate >= start && transactionDate <= end;
    });

    // Filter expenses by date range
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return expenseDate >= start && expenseDate <= end;
    });

    // Filter purchases by date range
    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return purchaseDate >= start && purchaseDate <= end;
    });

    // Calculate sales revenue in the period
    const totalPendapatan = filteredTransactions
      .filter(t => t.type === 'Penjualan')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate cost of goods sold (COGS) based on product costs in the period
    let totalHargaPokokPenjualan = 0;
    filteredTransactions
      .filter(t => t.type === 'Penjualan')
      .forEach(t => {
        t.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            totalHargaPokokPenjualan += item.quantity * (product.cost || 0);
          }
        });
      });

    // Calculate expenses in the period
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate purchases in the period
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);

    // Calculate net profit/loss in the period
    const labaKotor = totalPendapatan - totalHargaPokokPenjualan;
    const labaBersih = labaKotor - totalExpenses;

    // Calculate cash flow in the period
    const cashSales = filteredTransactions
      .filter(t => t.type === 'Penjualan' && t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = filteredExpenses
      .filter(e => e.status === 'Lunas')
      .reduce((sum, e) => sum + e.amount, 0);

    const cashPurchases = filteredPurchases
      .filter(p => p.status === 'Lunas' || p.paymentMethod === 'Tunai')
      .reduce((sum, p) => sum + p.amount, 0);

    const arusKasOperasiBersih = cashSales - cashExpenses - cashPurchases;

    // Calculate assets based on transactions and purchases in the period
    const kas = cashSales - cashExpenses - cashPurchases; // Simplified calculation
    const totalAset = kas + totalPurchases; // Simplified calculation

    // For liabilities and equity, use simplified metrics
    const totalKewajiban = filteredExpenses.filter(e => e.status !== 'Lunas').reduce((sum, e) => sum + e.amount, 0) +
                          filteredPurchases.filter(p => p.status !== 'Lunas').reduce((sum, p) => sum + p.amount, 0);

    const totalEkuitas = totalPendapatan - totalExpenses - totalPurchases + totalKewajiban; // Simplified calculation

    // Calculate other metrics in the period
    const bebanOperasional = filteredExpenses
      .filter(e => e.category === 'Operasional')
      .reduce((sum, e) => sum + e.amount, 0);

    const bebanLainLain = filteredExpenses
      .filter(e => e.category === 'Lainnya')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalPendapatan,
      hargaPokokPenjualan: totalHargaPokokPenjualan,
      bebanOperasional,
      bebanLainLain,
      labaKotor,
      labaBersih,

      totalAsetLancar: kas, // Simplified
      totalAsetTetap: totalPurchases, // Simplified
      totalAset,
      totalKewajibanJangkaPendek: totalKewajiban,
      totalKewajibanJangkaPanjang: 0, // Simplified
      totalKewajiban,
      totalEkuitas,

      arusKasOperasiBersih,
      arusKasInvestasiBersih: 0,
      arusKasPendanaanBersih: 0,
      kenaikanPenurunanKas: arusKasOperasiBersih, // Simplified
      kasAwalPeriode: 0, // Simplified
      kasAkhirPeriode: kas
    };
  };

  const getAccountsData = (): AccountsData => {
    // Calculate cash directly from transactions
    const cashSales = transactions
      .filter(t => t.type === 'Penjualan' && t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = expenses
      .filter(e => e.status === 'Lunas')
      .reduce((sum, e) => sum + e.amount, 0);

    const cashPurchases = purchases
      .filter(p => p.status === 'Lunas' || p.paymentMethod === 'Tunai')
      .reduce((sum, p) => sum + p.amount, 0);

    const kas = cashSales - cashExpenses - cashPurchases;

    // Simplified account data based on transactions
    const summary = getFinancialSummary();

    return {
      kas: kas,
      piutang: 0, // Simplified - in a real system you'd track accounts receivable
      persediaan: purchases.reduce((sum, p) => sum + p.amount, 0), // Simplified calculation
      peralatan: 0, // Simplified - in a real system you'd track fixed assets separately
      hutangUsaha: expenses.filter(e => e.status !== 'Lunas').reduce((sum, e) => sum + e.amount, 0),
      hutangBank: 0, // Simplified - in a real system you'd track bank loans
      modal: summary.totalEkuitas
    };
  };


  const askAI = async (question: string): Promise<string> => {
    if (!userId) {
      return "Anda harus login terlebih dahulu untuk menggunakan fitur AI.";
    }
    
    const financialData: FinancialData = {
      products,
      transactions,
      purchases,
      expenses
    };
    
    return await aiService.processQuestion(question, financialData);
  };

  const value: AppContextType = {
    userId,
    accounts,
    products,
    transactions,
    purchases,
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
    addExpense,
    updateExpense,
    deleteExpense,
    getFinancialSummary,
    getFinancialSummaryByPeriod,
    getAccountsData,
    askAI
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
