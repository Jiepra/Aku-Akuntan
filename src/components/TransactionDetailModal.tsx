
import React from 'react';
import { X, Calendar, User, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/contexts/AppContext';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detail Transaksi</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="mr-2 h-5 w-5" />
                Informasi Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Transaksi</label>
                  <p className="text-lg font-semibold text-blue-600">{transaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal</label>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <p className="text-lg">{new Date(transaction.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Pelanggan/Supplier</label>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    <p className="text-lg">{transaction.customer}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipe Transaksi</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.type === 'Penjualan' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {transaction.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Transaksi</label>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {transaction.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status Pembayaran</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.status === 'Lunas' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Deskripsi</label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{transaction.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items Detail */}
          {transaction.items && transaction.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="mr-2 h-5 w-5" />
                  Detail Barang/Jasa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-gray-600">Produk</th>
                        <th className="text-center py-2 font-medium text-gray-600">Qty</th>
                        <th className="text-right py-2 font-medium text-gray-600">Harga Satuan</th>
                        <th className="text-right py-2 font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">ID: {item.productId}</p>
                          </td>
                          <td className="text-center py-3 font-medium">{item.quantity}</td>
                          <td className="text-right py-3">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="text-right py-3 font-semibold">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={3} className="py-3 text-right font-semibold">Total:</td>
                        <td className="py-3 text-right text-xl font-bold text-green-600">
                          Rp {transaction.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
