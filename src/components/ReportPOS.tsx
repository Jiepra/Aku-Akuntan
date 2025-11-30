import React, { useState, useEffect, useRef } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Printer, Package, BarChart3, ShoppingCart, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/components/ui/sonner';

const ReportPOS: React.FC = () => {
  const { transactions, products, purchases, expenses } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [reportData, setReportData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Function to get start and end dates based on selected period
  const getPeriodDates = (period: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'this-week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7);
        break;
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    generateReport(startDate, endDate);
  }, [selectedPeriod, transactions, purchases, expenses]);

  const generateReport = (startDate: string, endDate: string) => {
    // Filter data based on selected period
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const periodPurchases = purchases.filter(p => {
      const date = new Date(p.date);
      return date >= start && date <= end;
    });

    const periodExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= start && date <= end;
    });

    // Calculate sales revenue
    const totalSales = periodTransactions
      .filter(t => t.type === 'Penjualan')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate purchases
    const totalPurchases = periodPurchases.reduce((sum, p) => sum + p.amount, 0);

    // Calculate cost of goods sold (COGS) based on product costs
    let totalCOGS = 0;
    periodTransactions
      .filter(t => t.type === 'Penjualan')
      .forEach(t => {
        t.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            totalCOGS += item.quantity * (product.cost || 0);
          }
        });
      });

    // Calculate expenses
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate key metrics
    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    // Calculate additional insights
    const totalTransactions = periodTransactions.length;
    const totalPurchasesCount = periodPurchases.length;
    const totalExpensesCount = periodExpenses.length;

    // Calculate top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    periodTransactions
      .filter(t => t.type === 'Penjualan')
      .forEach(t => {
        t.items.forEach(item => {
          if (productSales[item.productId]) {
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.quantity * item.price;
          } else {
            const product = products.find(p => p.id === item.productId);
            productSales[item.productId] = {
              name: product ? product.name : item.productName,
              quantity: item.quantity,
              revenue: item.quantity * item.price
            };
          }
        });
      });

    const topSellingProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setReportData({
      totalSales,
      totalPurchases,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      totalTransactions,
      totalPurchasesCount,
      totalExpensesCount,
      topSellingProducts
    });
  };

  // Improved PDF export functionality using print-friendly approach
  const handleExportPDF = () => {
    if (!reportRef.current || !reportData) {
      toast.error('Data laporan belum siap. Harap tunggu sebentar.', {
        description: "Error",
      });
      return;
    }

    // Temporarily show loading state on button
    const button = exportButtonRef.current;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Mempersiapkan...';
      button.disabled = true;

      setTimeout(() => {
        // Create a print-friendly window
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Mohon izinkan popup untuk mengekspor PDF', {
            description: "Error",
          });
          button.textContent = originalText;
          button.disabled = false;
          return;
        }

        // Prepare the report content with clean formatting
        const periodText =
          selectedPeriod === 'today' ? 'Hari Ini' :
          selectedPeriod === 'this-week' ? 'Minggu Ini' :
          selectedPeriod === 'this-month' ? 'Bulan Ini' :
          selectedPeriod === 'this-year' ? 'Tahun Ini' : 'Kustom';

        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Laporan POS - ${periodText} | AkuAkuntan</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white !important;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #2563eb;
              }
              .header h1 {
                font-size: 24px;
                margin-bottom: 5px;
                color: #1e40af;
              }
              .header h2 {
                font-size: 18px;
                color: #64748b;
                margin-bottom: 5px;
              }
              .header p {
                font-size: 14px;
                color: #94a3b8;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
              }
              .summary-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
              }
              .summary-card h3 {
                font-size: 14px;
                color: #64748b;
                margin-bottom: 8px;
              }
              .summary-card .amount {
                font-size: 20px;
                font-weight: bold;
              }
              .card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 20px;
                overflow: hidden;
              }
              .card-header {
                background: #f1f5f9;
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
              }
              .card-header h3 {
                font-size: 16px;
                font-weight: 600;
              }
              .card-content {
                padding: 16px;
              }
              .report-section {
                margin-bottom: 10px;
              }
              .section-header {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e2e8f0;
              }
              .line-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid #f1f5f9;
              }
              .line-item.total {
                font-weight: bold;
                border-top: 1px solid #e2e8f0;
                margin-top: 5px;
                padding-top: 5px;
                border-bottom: none;
              }
              .no-print {
                display: none !important;
              }
              @media print {
                body {
                  padding: 10px;
                  font-size: 12px;
                }
                .summary-grid {
                  grid-template-columns: repeat(2, 1fr);
                }
                .summary-card .amount {
                  font-size: 16px;
                }
                .card-header {
                  font-size: 14px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>LAPORAN POS</h1>
              <h2>Periode: ${periodText}</h2>
              <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <h3>Total Penjualan</h3>
                <div class="amount" style="color: #16a34a;">${formatCurrency(reportData.totalSales)}</div>
              </div>
              <div class="summary-card">
                <h3>Harga Pokok Penjualan</h3>
                <div class="amount" style="color: #dc2626;">${formatCurrency(reportData.totalCOGS)}</div>
              </div>
              <div class="summary-card">
                <h3>Laba Kotor</h3>
                <div class="amount" style="${reportData.grossProfit >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(reportData.grossProfit)}</div>
              </div>
              <div class="summary-card">
                <h3>Laba Bersih</h3>
                <div class="amount" style="${reportData.netProfit >= 0 ? 'color: #2563eb;' : 'color: #dc2626;'}">${formatCurrency(reportData.netProfit)}</div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Detail Transaksi</h3>
              </div>
              <div class="card-content">
                <div class="line-item">
                  <span>Total Penjualan</span>
                  <span>${formatCurrency(reportData.totalSales)}</span>
                </div>
                <div class="line-item">
                  <span>Harga Pokok Penjualan</span>
                  <span style="color: #dc2626;">-${formatCurrency(reportData.totalCOGS)}</span>
                </div>
                <div class="line-item total">
                  <span>Laba Kotor</span>
                  <span style="${reportData.grossProfit >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(reportData.grossProfit)}</span>
                </div>
                <div class="line-item" style="margin-top: 15px;">
                  <span>Total Beban</span>
                  <span>${formatCurrency(reportData.totalExpenses)}</span>
                </div>
                <div class="line-item total">
                  <span>Laba Bersih</span>
                  <span style="${reportData.netProfit >= 0 ? 'color: #2563eb;' : 'color: #dc2626;'}">${formatCurrency(reportData.netProfit)}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Produk Terlaris</h3>
              </div>
              <div class="card-content">
                ${reportData.topSellingProducts.length > 0 ? 
                  reportData.topSellingProducts.map((product: any) => `
                    <div class="line-item">
                      <span>${product.name}</span>
                      <span>${product.quantity} pcs - ${formatCurrency(product.revenue)}</span>
                    </div>
                  `).join('') : 
                  '<p>Tidak ada data penjualan</p>'
                }
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Ringkasan</h3>
              </div>
              <div class="card-content">
                <div class="line-item">
                  <span>Total Transaksi</span>
                  <span>${reportData.totalTransactions}</span>
                </div>
                <div class="line-item">
                  <span>Total Pembelian</span>
                  <span>${reportData.totalPurchasesCount}</span>
                </div>
                <div class="line-item">
                  <span>Total Beban</span>
                  <span>${reportData.totalExpensesCount}</span>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Restore button state after a delay
        setTimeout(() => {
          if (button) {
            button.textContent = originalText;
            button.disabled = false;
          }
        }, 2000);

        // Auto-print after content loads
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }, 300);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
              Finsera Report
            </h1>
            <p className="text-gray-600 mt-2">Laporan penjualan</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 focus:ring-offset-0 h-auto font-medium">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="this-week">Minggu Ini</SelectItem>
                  <SelectItem value="this-month">Bulan Ini</SelectItem>
                  <SelectItem value="this-year">Tahun Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                ref={exportButtonRef}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                onClick={handleExportPDF}
              >
                <Printer className="h-4 w-4" />
                Cetak PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {reportData ? (
        <div ref={reportRef} className="print:hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalSales)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Harga Pokok Penjualan</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalCOGS)}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Laba Kotor</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.grossProfit)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Laba Bersih</p>
                    <p className="text-2xl font-bold" style={{color: reportData.netProfit >= 0 ? '#2563eb' : '#dc2626'}}>{formatCurrency(reportData.netProfit)}</p>
                  </div>
                  <div className="p-3 rounded-full" style={{background: reportData.netProfit >= 0 ? '#dbeafe' : '#fee2e2'}}>
                    <DollarSign className="h-6 w-6" style={{color: reportData.netProfit >= 0 ? '#2563eb' : '#dc2626'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Detail Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Penjualan</span>
                      <span className="font-medium">{formatCurrency(reportData.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harga Pokok Penjualan</span>
                      <span className="font-medium text-red-600">-{formatCurrency(reportData.totalCOGS)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 border-gray-200">
                      <span>Laba Kotor</span>
                      <span className={reportData.grossProfit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(reportData.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span>Total Beban</span>
                      <span className="font-medium">{formatCurrency(reportData.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 border-gray-200 text-lg">
                      <span>Laba Bersih</span>
                      <span className={reportData.netProfit >= 0 ? "text-blue-600" : "text-red-600"}>{formatCurrency(reportData.netProfit)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Produk Terlaris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topSellingProducts.length > 0 ? (
                    reportData.topSellingProducts.map((product: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.quantity} pcs terjual</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Tidak ada data penjualan</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Ringkasan Statistik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{reportData.totalTransactions}</p>
                    <p className="text-gray-600">Total Transaksi</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{reportData.totalPurchasesCount}</p>
                    <p className="text-gray-600">Total Pembelian</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{reportData.totalExpensesCount}</p>
                    <p className="text-gray-600">Total Beban</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Memuat laporan POS...</p>
        </div>
      )}
    </div>
  );
};

export default ReportPOS;