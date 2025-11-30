
import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  FileText,
  ArrowDownCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produk', label: 'Produk', icon: Package },
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'pembelian', label: 'Pembelian', icon: ShoppingBag },
    { id: 'beban', label: 'Beban & Pengeluaran', icon: ArrowDownCircle },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  return (
    <>
      <div className="w-64 bg-white shadow-lg h-full flex flex-col md:flex hidden">
        <div className="p-6 border-b border-gray-200 flex items-center">
          <img src="/Finsera.svg" alt="Finsera Logo" className="h-8 w-auto mr-2" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">Finsera</h2>
            <p className="text-sm text-gray-600 mt-1">Kelompok 3</p>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      activeTab === item.id ? 'text-blue-700' : 'text-gray-500'
                    }`} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">© 2024 Sistem Akuntansi</p>
            <p className="text-xs text-gray-400">Indonesia v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
