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

        // Tambahkan delay awal untuk mencegah permintaan yang terlalu cepat
        if (attempt > 0) { // Hanya pada retry, bukan pada attempt pertama
          const initialDelay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
          await new Promise(resolve => setTimeout(resolve, initialDelay));
        }

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
          // Coba baca body error sebagai JSON jika memungkinkan, jika tidak ambil sebagai text
          let errorText = '';
          try {
            const errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
          } catch (e) {
            errorText = await response.text();
          }
          
          console.error('Error dari API:', errorText);
          // Tambahkan delay sebelum mencoba kembali untuk kasus error
          if (response.status === 503 || response.status >= 500) {
            // Server sedang sibuk, beri delay tambahan
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
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
          // Gunakan delay yang lebih konservatif dan tambahan randomisasi untuk menghindari throttling
          const baseDelay = Math.pow(2, attempt) * 1000;
          const randomDelay = Math.floor(Math.random() * 1000); // Tambahkan delay acak
          const delay = baseDelay + randomDelay;
          console.log(`Mencoba kembali dalam ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Jika semua percobaan gagal, lempar error terakhir
    if (lastError) {
      console.error('Semua percobaan gagal. Error terakhir:', lastError);
      if (lastError instanceof Error) {
        // Jika error adalah "The model is overloaded", berikan pesan yang lebih ramah
        if (lastError.message.includes('The model is overloaded')) {
          return { 
            text: 'Maaf, saat ini asisten AI sedang sibuk. Silakan coba beberapa saat lagi. Anda tetap dapat menggunakan fitur lain dari aplikasi.' 
          };
        }
        return { text: `Maaf, terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti.` };
      }
    }
    
    return { text: 'Maaf, terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti.' };
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
      `Nama: ${p.name}, Kategori: ${p.category}, Harga: ${p.price}, Harga Pokok: ${p.cost}, Stok: ${p.stock}`
    ).join('\n');

    // Include today's date for better context
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    const formattedTransactions = transactions.map(t => 
      `Tanggal: ${t.date}, Pelanggan: ${t.customer}, Jumlah: ${t.amount}, Status: ${t.status}, Tipe: ${t.type}, Item: ${t.items.map(item => `${item.productName} (${item.quantity} x ${item.price})`).join(', ')}`
    ).join('\n');

    const formattedPurchases = purchases.map(p => 
      `Tanggal: ${p.date}, Supplier: ${p.supplier}, Jumlah: ${p.amount}, Status: ${p.status}, Item: ${p.items.map(item => `${item.productName} (${item.quantity} x ${item.cost})`).join(', ')}`
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
    
    // Format data dalam bentuk naratif yang lebih alami
    const dataNarrative = [];
    
    if (totalProducts > 0) {
      dataNarrative.push(`Saat ini Anda memiliki ${totalProducts} produk.`);
      if (products.length > 0) {
        dataNarrative.push(`Beberapa produk yang tersedia: ${products.slice(0, 3).map(p => p.name).join(', ')}.`);
      }
    } else {
      dataNarrative.push('Saat ini belum ada data produk yang tercatat.');
    }
    
    if (totalTransactions > 0) {
      dataNarrative.push(`Anda telah melakukan ${totalTransactions} transaksi, dengan total pemasukan sebesar ${totalRevenue}.`);
      if (transactions.length > 0) {
        dataNarrative.push(`Beberapa transaksi terakhir: ${transactions.slice(0, 3).map(t => `tanggal ${t.date}, pelanggan ${t.customer} sebesar Rp ${t.amount.toLocaleString()}`).join('; ')}.`);
      }
    } else {
      dataNarrative.push('Belum ada transaksi penjualan yang tercatat.');
    }
    
    if (totalPurchases > 0) {
      dataNarrative.push(`Anda telah melakukan ${totalPurchases} pembelian.`);
      if (purchases.length > 0) {
        dataNarrative.push(`Beberapa pembelian terakhir: ${purchases.slice(0, 3).map(p => `tanggal ${p.date}, supplier ${p.supplier} sebesar Rp ${p.amount.toLocaleString()}`).join('; ')}.`);
      }
    } else {
      dataNarrative.push('Belum ada pembelian yang tercatat.');
    }
    
    if (totalExpenses > 0) {
      dataNarrative.push(`Anda memiliki ${totalExpenses} beban/pengeluaran dengan total pengeluaran sebesar ${totalExpensesAmount}.`);
      if (expenses.length > 0) {
        dataNarrative.push(`Beberapa beban terakhir: ${expenses.slice(0, 3).map(e => `tanggal ${e.date}, ${e.description} sebesar Rp ${e.amount.toLocaleString()}`).join('; ')}.`);
      }
    } else {
      dataNarrative.push('Belum ada beban/pengeluaran yang tercatat.');
    }
    
    const narrativeData = dataNarrative.join(' ');
    
    // Deteksi jenis pertanyaan untuk menyesuaikan respons
    const questionLower = question.toLowerCase();
    const isProductRelated = questionLower.includes('produk') || questionLower.includes('barang') || 
                            questionLower.includes('fashion') || questionLower.includes('pakaian') ||
                            questionLower.includes('menambahkan') || questionLower.includes('buatkan') ||
                            questionLower.includes('harga jual') || questionLower.includes('harga pokok') ||
                            questionLower.includes('kategori');
                            
    const isDateRelated = questionLower.includes('hari ini') || questionLower.includes('tanggal') || 
                         questionLower.includes('minggu ini') || questionLower.includes('bulan ini') ||
                         questionLower.includes('terakhir');

    let additionalInstruction = '';
    if (isProductRelated) {
      additionalInstruction = 'Khusus untuk pertanyaan tentang penambahan produk baru, berikan saran yang spesifik tentang nama produk, kategori, harga jual, dan harga pokok dalam format yang terstruktur.';
    } else if (isDateRelated) {
      additionalInstruction = 'Jika pertanyaan berhubungan dengan tanggal atau waktu tertentu, fokuslah pada data yang sesuai dengan periode waktu yang dimaksud. Gunakan informasi transaksi, pembelian, atau beban yang relevan dengan tanggal tersebut.';
    }

    return `
      Kamu adalah asisten keuangan untuk aplikasi akuntansi. Gunakan data lokal berikut sebagai dasar jawabanmu, namun juga gunakan pengetahuan luasmu untuk memberikan informasi yang relevan dan membantu.
      
      Ringkasan data lokal: ${narrativeData}
      
      Detail Produk (${products.length} dari ${totalProducts}):
      ${formattedProducts || 'Tidak ada data produk lokal'}
      
      Detail Transaksi (${transactions.length} dari ${totalTransactions}):
      ${formattedTransactions || 'Tidak ada data transaksi lokal'}
      
      Detail Pembelian (${purchases.length} dari ${totalPurchases}):
      ${formattedPurchases || 'Tidak ada data pembelian lokal'}
      
      Detail Beban (${expenses.length} dari ${totalExpenses}):
      ${formattedExpenses || 'Tidak ada data beban lokal'}
      
      Pertanyaan Pengguna: ${question}
      
      ${additionalInstruction}
      
      Jawablah secara langsung, ringkas dan padat. Gunakan bahasa Indonesia yang santun. Fokus pada inti pertanyaan dan berikan jawaban yang spesifik. Jika data lokal tidak mencukupi, kamu tetap bisa memberikan informasi umum yang relevan berdasarkan pengetahuanmu. Gunakan format narasi yang ringkas, hindari kalimat pembuka yang tidak perlu. Jika pengguna meminta dalam bentuk poin-poin atau daftar, baru gunakan format poin-poin atau daftar. Jangan gunakan tanda bintang (*) atau tanda hubung (-) dalam format jawabanmu kecuali untuk daftar. Jika memberikan informasi umum, sebutkan bahwa itu berdasarkan pengetahuan umum dan mungkin perlu disesuaikan dengan kondisi lokal.
    `;
  }

  /**
   * Memproses pertanyaan pengguna dan mengembalikan jawaban dari AI
   */
  async processQuestion(question: string, financialData: FinancialData): Promise<string> {
    try {
      const prompt = this.buildPrompt(question, financialData);
      console.log('Prompt yang dikirim:', prompt); // Log untuk debugging
      
      // Tambahkan delay kecil sebelum mengirim permintaan untuk menghindari permintaan terlalu cepat
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await this.callAI(prompt);
      return response.text;
    } catch (error) {
      console.error('Error processing question:', error);
      if (error instanceof Error) {
        // Jika error adalah "The model is overloaded", berikan pesan yang lebih ramah
        if (error.message.includes('The model is overloaded')) {
          return 'Maaf, saat ini asisten AI sedang sibuk. Silakan coba beberapa saat lagi. Anda tetap dapat menggunakan fitur lain dari aplikasi.';
        }
        return 'Maaf, terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti.';
      }
      return 'Maaf, terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti.';
    }
  }
}

// Singleton instance
export const aiService = new AIService();