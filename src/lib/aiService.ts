import { Product, Transaction, Purchase, Expense } from '../contexts/AppContext';
import { getAIConfig, getAIUrl } from './aiConfig';

interface AIResponse {
  text: string;
}

export interface FinancialData {
  products: Product[];
  transactions: Transaction[];
  purchases: Purchase[];
  expenses: Expense[];
}

class AIService {
  private config = getAIConfig();
  private apiUrl: string;

  constructor() {
    this.apiUrl = getAIUrl();
  }

  /**
   * Mengirim permintaan ke Google AI API
   */
  private async callAI(prompt: string): Promise<AIResponse> {
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        // Validasi API key
        if (!this.config.apiKey) {
          throw new Error('API key tidak ditemukan. Harap atur VITE_GOOGLE_AI_API_KEY di file .env');
        }

        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        };

        console.log(`Mengirim permintaan ke AI API (attempt ${attempt + 1}):`, requestBody); // Log untuk debugging

        // Gunakan URL yang sudah dibuat dengan API key di dalamnya
        const apiUrlWithKey = getAIUrl();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(apiUrlWithKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Status respons:', response.status); // Log status respons

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error dari API:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Respons dari AI API:', data); // Log respons lengkap
        
        if (data.candidates && data.candidates.length > 0) {
          const text = data.candidates[0].content.parts[0].text;
          return { text };
        } else {
          // Cek apakah ada error dalam respons
          if (data.promptFeedback?.blockReason) {
            throw new Error(`Permintaan diblokir: ${data.promptFeedback.blockReason}`);
          }
          throw new Error('Tidak ada respons dari AI');
        }
      } catch (error: any) {
        console.error(`Error calling AI API (attempt ${attempt + 1}):`, error);
        lastError = error;

        // Jika ini bukan attempt terakhir, tunggu sebentar sebelum mencoba lagi
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Mencoba kembali dalam ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Jika semua percobaan gagal, lempar error terakhir
    if (lastError) {
      console.error('Semua percobaan gagal. Error terakhir:', lastError);
      if (lastError instanceof Error) {
        return { text: `Maaf, terjadi kesalahan saat memproses permintaan: ${lastError.message}` };
      }
    }
    
    return { text: 'Maaf, terjadi kesalahan saat memproses permintaan.' };
  }

  /**
   * Membuat prompt untuk AI berdasarkan pertanyaan dan data keuangan
   */
  private buildPrompt(question: string, financialData: FinancialData): string {
    // Format data keuangan untuk dikirim ke AI (dengan batas jumlah data untuk menghindari permintaan terlalu besar)
    const products = financialData.products.slice(0, 10); // Batasi jumlah produk
    const transactions = financialData.transactions.slice(0, 10); // Batasi jumlah transaksi
    const purchases = financialData.purchases.slice(0, 10); // Batasi jumlah pembelian
    const expenses = financialData.expenses.slice(0, 10); // Batasi jumlah beban
    
    const formattedProducts = products.map(p => 
      `Nama: ${p.name}, Kategori: ${p.category}, Harga: ${p.price}, Stok: ${p.stock}`
    ).join('\n');

    const formattedTransactions = transactions.map(t => 
      `Tanggal: ${t.date}, Pelanggan: ${t.customer}, Jumlah: ${t.amount}, Status: ${t.status}`
    ).join('\n');

    const formattedPurchases = purchases.map(p => 
      `Tanggal: ${p.date}, Supplier: ${p.supplier}, Jumlah: ${p.amount}, Status: ${p.status}`
    ).join('\n');

    const formattedExpenses = expenses.map(e => 
      `Tanggal: ${e.date}, Deskripsi: ${e.description}, Jumlah: ${e.amount}, Kategori: ${e.category}, Status: ${e.status}`
    ).join('\n');

    // Hitung ringkasan data
    const totalProducts = financialData.products.length;
    const totalTransactions = financialData.transactions.length;
    const totalPurchases = financialData.purchases.length;
    const totalExpenses = financialData.expenses.length;

    const totalRevenue = financialData.transactions
      .filter(t => t.status === 'Lunas')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpensesAmount = financialData.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return `
      Kamu adalah asisten keuangan untuk aplikasi akuntansi. Gunakan data berikut untuk menjawab pertanyaan pengguna secara akurat.
      
      Ringkasan Data:
      - Jumlah Produk: ${totalProducts}
      - Jumlah Transaksi: ${totalTransactions}
      - Jumlah Pembelian: ${totalPurchases}
      - Jumlah Beban: ${totalExpenses}
      - Total Pemasukan (Lunas): ${totalRevenue}
      - Total Pengeluaran: ${totalExpensesAmount}
      
      Detail Produk (${products.length} dari ${totalProducts}):
      ${formattedProducts || 'Tidak ada data produk'}
      
      Detail Transaksi (${transactions.length} dari ${totalTransactions}):
      ${formattedTransactions || 'Tidak ada data transaksi'}
      
      Detail Pembelian (${purchases.length} dari ${totalPurchases}):
      ${formattedPurchases || 'Tidak ada data pembelian'}
      
      Detail Beban (${expenses.length} dari ${totalExpenses}):
      ${formattedExpenses || 'Tidak ada data beban'}
      
      Pertanyaan Pengguna: ${question}
      
      Jawab secara ringkas, akurat, dan profesional. Gunakan bahasa Indonesia. Jika data tidak mencukupi, beri tahu pengguna bahwa informasi tidak ditemukan.
    `;
  }

  /**
   * Memproses pertanyaan pengguna dan mengembalikan jawaban dari AI
   */
  async processQuestion(question: string, financialData: FinancialData): Promise<string> {
    try {
      const prompt = this.buildPrompt(question, financialData);
      console.log('Prompt yang dikirim:', prompt); // Log untuk debugging
      const response = await this.callAI(prompt);
      return response.text;
    } catch (error) {
      console.error('Error processing question:', error);
      if (error instanceof Error) {
        return `Maaf, terjadi kesalahan saat memproses pertanyaan Anda: ${error.message}`;
      }
      return 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda.';
    }
  }
}

// Singleton instance
export const aiService = new AIService();