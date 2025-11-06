import React, { useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { transactions, products, purchases, expenses, getFinancialSummary, getAccountsData } = useApp();
  const navigate = useNavigate();
  const summary = getFinancialSummary();
  const accounts = getAccountsData();

  useEffect(() => {
    const user = localStorage.getItem("current_user");
    if (!user) navigate("/auth");
  }, [navigate]);

  const handleLogout = () => {
    toast.error("Klik tombol di bawah untuk konfirmasi.", {
      description: "Yakin ingin logout?",
      action: (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            toast.success("Sampai jumpa kembali 👋", {
              description: "Logout berhasil",
            });
            setTimeout(() => {
              localStorage.removeItem("current_user");
              window.location.href = "/auth";
            }, 1000);
          }}
        >
          Keluar
        </Button>
      ),
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  const todayRevenue = todayTransactions.filter(t => t.type === 'Penjualan').reduce((sum, t) => sum + t.amount, 0);
  const todayPurchases = purchases.filter(p => p.date === today);
  const todayExpenses = expenses.filter(e => e.date === today);
  const todayPurchaseAmount = todayPurchases.reduce((sum, p) => sum + p.amount, 0);
  const todayExpenseAmount = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const lowStockProducts = products.filter(p => p.stock < p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  const stats = [
    {
      title: 'PEMASUKAN Hari Ini',
      value: `Rp ${todayRevenue.toLocaleString('id-ID')}`,
      change: `${todayTransactions.filter(t => t.type === 'Penjualan').length} transaksi`,
      icon: ArrowUpCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'PENGELUARAN Hari Ini',
      value: `Rp ${(todayPurchaseAmount + todayExpenseAmount).toLocaleString('id-ID')}`,
      change: `${todayPurchases.length + todayExpenses.length} transaksi`,
      icon: ArrowDownCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Total Produk',
      value: products.length.toString(),
      change: lowStockProducts.length > 0 ? `${lowStockProducts.length} stok rendah` : 'Stok aman',
      icon: Package,
      color: lowStockProducts.length > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: lowStockProducts.length > 0 ? 'bg-orange-100' : 'bg-green-100',
    },
    {
      title: 'Laba Bersih',
      value: `Rp ${(summary.netIncome || 0).toLocaleString('id-ID')}`,
      change: summary.netIncome >= 0 ? 'Profit' : 'Loss',
      icon: DollarSign,
      color: summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: summary.netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100',
    },
  ];

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const revenue = transactions.filter(t => t.type === 'Penjualan' && t.date === date).reduce((s, t) => s + t.amount, 0);
    const expense = purchases.filter(p => p.date === date).reduce((s, p) => s + p.amount, 0) +
                    expenses.filter(e => e.date === date).reduce((s, e) => s + e.amount, 0);
    return { date, revenue, expense };
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:shadow-lg transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}><Icon className={`w-6 h-6 ${stat.color}`} /></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Grafik Penjualan & Pengeluaran (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={v => `Rp ${v.toLocaleString('id-ID')}`} />
              <ChartTooltip formatter={v => `Rp ${v.toLocaleString('id-ID')}`} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Penjualan" />
              <Line type="monotone" dataKey="expense" stroke="#dc2626" name="Pengeluaran" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>📑 Transaksi Terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
            ) : recentTransactions.map(t => (
              <div key={t.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium text-gray-700">{t.customer} - {t.type}</p>
                  <p className="text-xs text-gray-500">{t.date} • {t.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">Rp {t.amount.toLocaleString('id-ID')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📘 Ringkasan Keuangan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">Penjualan</span>
                <span className="text-green-600 font-bold">Rp {(summary.totalRevenue || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Pembelian</span>
                <span className="text-red-600 font-bold">Rp {(summary.totalPurchases || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Beban</span>
                <span className="text-red-600 font-bold">Rp {(summary.totalExpenses || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Laba Kotor</span>
                <span className="text-blue-600 font-bold">Rp {(summary.grossProfit || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-purple-700 font-semibold">Laba Bersih</span>
                <span className="text-purple-600 font-bold text-lg">Rp {(summary.netIncome || 0).toLocaleString('id-ID')}</span>
            </div>
            {summary.netIncome > 0 && summary.totalRevenue > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium text-center">
                  <strong>Margin Laba:</strong> {((summary.netIncome / summary.totalRevenue) * 100).toFixed(1)}% - {
                    (summary.netIncome / summary.totalRevenue) * 100 > 15 ? 'Sangat Baik!' :
                    (summary.netIncome / summary.totalRevenue) * 100 > 10 ? 'Baik' : 'Perlu Perbaikan'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
