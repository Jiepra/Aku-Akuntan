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

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  // Include all important menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produk', label: 'Produk', icon: Package },
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'beban', label: 'Beban', icon: ArrowDownCircle },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  // Show all items on mobile
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
        <div className="flex items-center w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-w-[50px] rounded-lg transition-all duration-200 flex-shrink-0 ${
                  activeTab === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon 
                  className={`h-5 w-5 ${
                    activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                  }`} 
                />
                <span 
                  className={`text-[10px] mt-1 ${
                    activeTab === item.id ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;