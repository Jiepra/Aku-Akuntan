import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import Produk from '@/components/Produk';
import Kasir from '@/components/Kasir';
import Transaksi from '@/components/Transaksi';
import Pembelian from '@/components/Pembelian';
import Beban from '@/components/Beban';
import Jurnal from '@/components/Jurnal';
import Laporan from '@/components/Laporan';
import { AIChatDialog } from '@/components/AIChatDialog';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("current_user");
    if (!user) {
      console.log("Belum login, redirect ke /auth");
      navigate("/auth");
    } else {
      console.log("User login:", user);
      setCurrentUser(user);
    }
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'produk':
        return <Produk />;
      case 'kasir':
        return <Kasir />;
      case 'transaksi':
        return <Transaksi />;
      case 'pembelian':
        return <Pembelian />;
      case 'beban':
        return <Beban />;
      case 'jurnal':
        return <Jurnal />;
      case 'laporan':
        return <Laporan />;
      default:
        return <Dashboard />;
    }
  };

  // ⛔ Tunda render sampai currentUser terbaca
  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-50 w-full">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {renderContent()}
        <Button 
          onClick={() => setChatOpen(true)} 
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full"
          size="sm"
        >
          <Bot className="h-4 w-4" />
          AI
        </Button>
        <AIChatDialog open={chatOpen} onOpenChange={setChatOpen} />
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
