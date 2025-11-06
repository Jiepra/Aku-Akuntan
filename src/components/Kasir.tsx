import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Calculator, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import PaymentModal from './PaymentModal';
import { toast } from '@/components/ui/sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Kasir: React.FC = () => {
  const { products, addTransaction, updateProductStock, updateMultipleProductStocks } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: typeof products[0]) => {
    if (product.stock <= 0) {
      toast({
        title: "Stok Habis",
        description: `Stok ${product.name} sudah habis!`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Stok Tidak Mencukupi",
          description: `Stok ${product.name} hanya tersisa ${product.stock}`,
          variant: "destructive"
        });
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    toast.success(`${product.name} berhasil ditambahkan ke keranjang`, {
      description: "Produk Ditambahkan",
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const product = products.find(p => p.id === id);
    if (product && newQuantity > product.stock) {
      toast.error(`Stok ${product.name} hanya tersisa ${product.stock}`, {
        description: "Stok Tidak Mencukupi",
      });
      return;
    }

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePayment = (paymentData: {
    method: 'Tunai' | 'Transfer' | 'Kredit';
    cashReceived?: number;
    change?: number;
  }) => {
    if (cart.length === 0) return;
    
    // Create transaction
    const transaction = {
      date: new Date().toISOString().split('T')[0],
      customer: 'Pelanggan Umum',
      type: 'Penjualan' as const,
      amount: total,
      description: cart.map(item => `${item.name} (${item.quantity})`).join(', '),
      status: 'Lunas' as const,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      paymentMethod: paymentData.method,
      cashReceived: paymentData.cashReceived,
      change: paymentData.change
    };

    addTransaction(transaction);

    // Update stock - use batch update to ensure all products are updated in a single state update
    updateMultipleProductStocks(cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      type: 'sale' as const
    })));

    // Show success notification
    toast.success(`Total: Rp ${total.toLocaleString('id-ID')}${paymentData.change ? ` | Kembalian: Rp ${paymentData.change.toLocaleString('id-ID')}` : ''}`, {
      description: "Transaksi Berhasil!",
    });
    
    // Reset form
    setCart([]);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Top Section - Products */}
      <div className="flex-1 md:w-2/3 p-6 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-4">
            <Calculator className="mr-3 h-8 w-8" />
            Point of Sale
          </h1>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto h-[calc(100vh-200px)]">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 h-fit transform hover:scale-105 ${
                product.stock <= 0 ? 'opacity-50' : ''
              }`}
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{product.category}</p>
                  <p className="text-xs text-gray-500 mb-3">Stok: {product.stock}</p>
                  <div className="text-lg font-bold text-green-600 mb-3">
                    Rp {product.price.toLocaleString('id-ID')}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={product.stock <= 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {product.stock <= 0 ? 'Habis' : 'Tambah'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Cart Section - Stacked on Mobile, Side-by-Side on Desktop */}
      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Keranjang
          </h2>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-bold text-green-600">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total and Checkout */}
          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                onClick={() => setShowPaymentModal(true)}
              >
                Proses Pembayaran
              </Button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onPayment={handlePayment}
      />
    </div>
  );
};

export default Kasir;
