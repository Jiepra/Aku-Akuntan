import React, { useState, useEffect, useRef } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Printer, Clock, Package, Receipt, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/components/ui/sonner';

const Laporan: React.FC = () => {
  const { getFinancialSummary, getFinancialSummaryByPeriod } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('bulan-ini');
  const [laporanData, setLaporanData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const formatCurrency = (amount: number) => {
    return `Rp ${Math.floor(amount).toLocaleString('id-ID')}`;
  };

  // Function to get start and end dates based on selected period
  const getPeriodDates = (period: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (period) {
      case 'bulan-ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'bulan-lalu':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'triwulan':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'tahun-ini':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    if (selectedPeriod === 'all-time') {
      setLaporanData(getFinancialSummary());
    } else {
      const { startDate, endDate } = getPeriodDates(selectedPeriod);
      setLaporanData(getFinancialSummaryByPeriod(startDate, endDate));
    }
  }, [selectedPeriod]);

  // Improved PDF export functionality using print-friendly approach
  const handleExportPDF = () => {
    if (!reportRef.current || !laporanData) {
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
          selectedPeriod === 'bulan-ini' ? 'Bulan Ini' :
          selectedPeriod === 'bulan-lalu' ? 'Bulan Lalu' :
          selectedPeriod === 'triwulan' ? 'Triwulan' :
          selectedPeriod === 'tahun-ini' ? 'Tahun Ini' : 'Semua Waktu';

        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Laporan Keuangan - ${periodText} | AkuAkuntan</title>
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
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
              }
              .summary-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
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
              }
              .line-item.total {
                font-weight: bold;
                border-top: 1px solid #e2e8f0;
                margin-top: 5px;
                padding-top: 5px;
              }
              .financial-ratio {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 6px;
                padding: 12px;
                margin-top: 15px;
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
                  grid-template-columns: repeat(3, 1fr);
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
              <h1>LAPORAN KEUANGAN</h1>
              <h2>Periode: ${periodText}</h2>
              <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <h3>Total Pendapatan</h3>
                <div class="amount" style="color: #16a34a;">${formatCurrency(laporanData.totalPendapatan)}</div>
              </div>
              <div class="summary-card">
                <h3>Total Beban</h3>
                <div class="amount" style="color: #dc2626;">${formatCurrency(laporanData.bebanOperasional + laporanData.bebanLainLain)}</div>
              </div>
              <div class="summary-card">
                <h3>Laba Bersih</h3>
                <div class="amount" style="${laporanData.labaBersih >= 0 ? 'color: #2563eb;' : 'color: #dc2626;'}">${formatCurrency(laporanData.labaBersih)}</div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Laporan Laba Rugi</h3>
              </div>
              <div class="card-content">
                <div class="report-section">
                  <div class="section-header">PENDAPATAN</div>
                  <div class="line-item">
                    <span>Penjualan Barang/Jasa</span>
                    <span>${formatCurrency(laporanData.totalPendapatan)}</span>
                  </div>
                  <div class="line-item">
                    <span>Harga Pokok Penjualan (HPP)</span>
                    <span style="color: #dc2626;">-${formatCurrency(laporanData.hargaPokokPenjualan)}</span>
                  </div>
                  <div class="line-item total">
                    <span>Laba (Rugi) Kotor</span>
                    <span style="${laporanData.labaKotor >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(laporanData.labaKotor)}</span>
                  </div>
                </div>
                
                <div class="report-section" style="margin-top: 20px;">
                  <div class="section-header">BEBAN</div>
                  <div class="line-item">
                    <span>Beban Operasional</span>
                    <span>${formatCurrency(laporanData.bebanOperasional)}</span>
                  </div>
                  <div class="line-item">
                    <span>Beban Lain-lain</span>
                    <span>${formatCurrency(laporanData.bebanLainLain)}</span>
                  </div>
                  <div class="line-item total">
                    <span>Total Beban</span>
                    <span>${formatCurrency(laporanData.bebanOperasional + laporanData.bebanLainLain)}</span>
                  </div>
                </div>
                
                <div class="financial-ratio">
                  <div class="line-item total">
                    <span>LABA BERSIH</span>
                    <span style="${laporanData.labaBersih >= 0 ? 'color: #2563eb; font-weight: bold;' : 'color: #dc2626; font-weight: bold;'}">${formatCurrency(laporanData.labaBersih)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Neraca (Laporan Posisi Keuangan)</h3>
              </div>
              <div class="card-content">
                <div class="report-section">
                  <div class="section-header">ASET</div>
                  <div class="line-item">
                    <span>Aset Lancar</span>
                    <span>${formatCurrency(laporanData.totalAsetLancar)}</span>
                  </div>
                  <div class="line-item">
                    <span>Aset Tetap</span>
                    <span>${formatCurrency(laporanData.totalAsetTetap)}</span>
                  </div>
                  <div class="line-item total">
                    <span>Total Aset</span>
                    <span>${formatCurrency(laporanData.totalAset)}</span>
                  </div>
                </div>
                
                <div class="report-section" style="margin-top: 20px;">
                  <div class="section-header">KEWAJIBAN</div>
                  <div class="line-item">
                    <span>Kewajiban Jangka Pendek</span>
                    <span>${formatCurrency(laporanData.totalKewajibanJangkaPendek)}</span>
                  </div>
                  <div class="line-item">
                    <span>Kewajiban Jangka Panjang</span>
                    <span>${formatCurrency(laporanData.totalKewajibanJangkaPanjang)}</span>
                  </div>
                  <div class="line-item total">
                    <span>Total Kewajiban</span>
                    <span>${formatCurrency(laporanData.totalKewajiban)}</span>
                  </div>
                </div>
                
                <div class="report-section" style="margin-top: 20px;">
                  <div class="section-header">MODAL</div>
                  <div class="line-item total">
                    <span>Total Ekuitas</span>
                    <span style="color: #16a34a; font-weight: bold;">${formatCurrency(laporanData.totalEkuitas)}</span>
                  </div>
                </div>
                
                <div class="financial-ratio" style="margin-top: 15px;">
                  <div class="line-item total">
                    <span>TOTAL KEWAJIBAN & MODAL</span>
                    <span style="${(laporanData.totalKewajiban + laporanData.totalEkuitas === laporanData.totalAset) ? 'color: #2563eb;' : 'color: #dc2626;'}">${formatCurrency(laporanData.totalKewajiban + laporanData.totalEkuitas)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Laporan Arus Kas</h3>
              </div>
              <div class="card-content">
                <div class="summary-grid">
                  <div class="summary-card">
                    <h3>Arus Kas Operasi</h3>
                    <div class="amount" style="${laporanData.arusKasOperasiBersih >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(laporanData.arusKasOperasiBersih)}</div>
                  </div>
                  <div class="summary-card">
                    <h3>Arus Kas Investasi</h3>
                    <div class="amount" style="${laporanData.arusKasInvestasiBersih >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(laporanData.arusKasInvestasiBersih)}</div>
                  </div>
                  <div class="summary-card">
                    <h3>Arus Kas Pendanaan</h3>
                    <div class="amount" style="${laporanData.arusKasPendanaanBersih >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(laporanData.arusKasPendanaanBersih)}</div>
                  </div>
                </div>
                
                <div class="financial-ratio" style="margin-top: 15px;">
                  <div class="line-item">
                    <span>Kas Awal Periode</span>
                    <span>${formatCurrency(laporanData.kasAwalPeriode)}</span>
                  </div>
                  <div class="line-item">
                    <span>Kenaikan (Penurunan) Kas</span>
                    <span style="${laporanData.kenaikanPenurunanKas >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(laporanData.kenaikanPenurunanKas)}</span>
                  </div>
                  <div class="line-item total" style="margin-top: 10px;">
                    <span>Kas Akhir Periode</span>
                    <span style="color: #2563eb; font-weight: bold;">${formatCurrency(laporanData.kasAkhirPeriode)}</span>
                  </div>
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
              <FileBarChart className="mr-3 h-8 w-8 text-blue-600" />
              Laporan Keuangan
            </h1>
            <p className="text-gray-600 mt-2">Laporan sesuai Standar Akuntansi Indonesia</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 focus:ring-offset-0 h-auto font-medium">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                  <SelectItem value="bulan-lalu">Bulan Lalu</SelectItem>
                  <SelectItem value="triwulan">Triwulan</SelectItem>
                  <SelectItem value="tahun-ini">Tahun Ini</SelectItem>
                  <SelectItem value="all-time">Semua Waktu</SelectItem>
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
      
      {laporanData ? (
        <div ref={reportRef} className="print:hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(laporanData.totalPendapatan)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Beban</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(laporanData.bebanOperasional + laporanData.bebanLainLain)}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Laba Bersih</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(laporanData.labaBersih)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Laporan Laba Rugi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Laporan Laba Rugi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      PENDAPATAN
                    </h3>
                    <div className="flex justify-between mb-2">
                      <span>Penjualan Barang/Jasa</span>
                      <span className="font-medium">{formatCurrency(laporanData.totalPendapatan)}</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span>Harga Pokok Penjualan (HPP)</span>
                      <span className="font-medium text-red-600">-{formatCurrency(laporanData.hargaPokokPenjualan)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 border-gray-200">
                      <span>Laba (Rugi) Kotor</span>
                      <span className={laporanData.labaKotor >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(laporanData.labaKotor)}</span>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      BEBAN
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Beban Operasional</span>
                        <span className="font-medium">{formatCurrency(laporanData.bebanOperasional)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beban Lain-lain</span>
                        <span className="font-medium">{formatCurrency(laporanData.bebanLainLain)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2 border-gray-200">
                        <span>Total Beban</span>
                        <span>{formatCurrency(laporanData.bebanOperasional + laporanData.bebanLainLain)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between text-lg font-bold">
                      <span>LABA BERSIH</span>
                      <span className={laporanData.labaBersih >= 0 ? "text-blue-600" : "text-red-600"}>{formatCurrency(laporanData.labaBersih)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Neraca */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-blue-600" />
                  Neraca (Laporan Posisi Keuangan)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      ASET
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Aset Lancar</span>
                        <span className="font-medium">{formatCurrency(laporanData.totalAsetLancar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aset Tetap</span>
                        <span className="font-medium">{formatCurrency(laporanData.totalAsetTetap)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2 border-gray-200">
                        <span>Total Aset</span>
                        <span>{formatCurrency(laporanData.totalAset)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      KEWAJIBAN
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Kewajiban Jangka Pendek</span>
                        <span className="font-medium">{formatCurrency(laporanData.totalKewajibanJangkaPendek)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kewajiban Jangka Panjang</span>
                        <span className="font-medium">{formatCurrency(laporanData.totalKewajibanJangkaPanjang)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2 border-gray-200">
                        <span>Total Kewajiban</span>
                        <span>{formatCurrency(laporanData.totalKewajiban)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between text-lg font-bold">
                      <span>MODAL</span>
                      <span className="text-green-600">{formatCurrency(laporanData.totalEkuitas)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL KEWAJIBAN & MODAL</span>
                      <span className={laporanData.totalKewajiban + laporanData.totalEkuitas === laporanData.totalAset ? "text-blue-600" : "text-red-600"}>
                        {formatCurrency(laporanData.totalKewajiban + laporanData.totalEkuitas)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Laporan Arus Kas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Laporan Arus Kas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-lg mb-2 text-center">Arus Kas Operasi</h3>
                    <div className="text-center">
                      <span className={laporanData.arusKasOperasiBersih >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                        {formatCurrency(laporanData.arusKasOperasiBersih)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-lg mb-2 text-center">Arus Kas Investasi</h3>
                    <div className="text-center">
                      <span className={laporanData.arusKasInvestasiBersih >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                        {formatCurrency(laporanData.arusKasInvestasiBersih)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-lg mb-2 text-center">Arus Kas Pendanaan</h3>
                    <div className="text-center">
                      <span className={laporanData.arusKasPendanaanBersih >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                        {formatCurrency(laporanData.arusKasPendanaanBersih)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="font-semibold">Kas Awal Periode</div>
                      <div className="font-medium">{formatCurrency(laporanData.kasAwalPeriode)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Kenaikan (Penurunan) Kas</div>
                      <div className={laporanData.kenaikanPenurunanKas >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                        {formatCurrency(laporanData.kenaikanPenurunanKas)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">Kas Akhir Periode</div>
                      <div className="text-blue-600 font-bold text-lg">{formatCurrency(laporanData.kasAkhirPeriode)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Memuat laporan keuangan...</p>
        </div>
      )}
    </div>
  );
};

export default Laporan;