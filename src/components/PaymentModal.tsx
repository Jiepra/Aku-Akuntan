
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calculator, CreditCard, Banknote } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPayment: (paymentData: {
    method: 'Tunai' | 'Transfer' | 'Kredit';
    cashReceived?: number;
    change?: number;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, onPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'Kredit'>('Tunai');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  const handleCashReceivedChange = (value: string) => {
    setCashReceived(value);
    const receivedAmount = parseFloat(value) || 0;
    const calculatedChange = receivedAmount - total;
    setChange(calculatedChange >= 0 ? calculatedChange : 0);
  };

  const handlePayment = () => {
    if (paymentMethod === 'Tunai') {
      const receivedAmount = parseFloat(cashReceived) || 0;
      if (receivedAmount < total) {
        toast.error("Jumlah uang yang diterima kurang dari total pembelian", {
          description: "Pembayaran Tidak Cukup",
        });
        return;
      }
      onPayment({
        method: paymentMethod,
        cashReceived: receivedAmount,
        change: change
      });
    } else {
      onPayment({
        method: paymentMethod
      });
    }
    
    onClose();
    setCashReceived('');
    setChange(0);
    setPaymentMethod('Tunai');
  };

  const quickAmounts = [
    { label: 'Pas', amount: total },
    { label: '50rb', amount: 50000 },
    { label: '100rb', amount: 100000 },
    { label: '200rb', amount: 200000 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Pembayaran
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Pembayaran</p>
              <p className="text-2xl font-bold text-blue-600">
                Rp {total.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Metode Pembayaran</label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tunai">
                  <div className="flex items-center">
                    <Banknote className="mr-2 h-4 w-4" />
                    Tunai
                  </div>
                </SelectItem>
                <SelectItem value="Transfer">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Transfer Bank
                  </div>
                </SelectItem>
                <SelectItem value="Kredit">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Kartu Kredit
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'Tunai' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Uang Diterima</label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah uang diterima"
                  value={cashReceived}
                  onChange={(e) => handleCashReceivedChange(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((quick) => (
                  <Button
                    key={quick.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCashReceivedChange(quick.amount.toString())}
                  >
                    {quick.label}
                  </Button>
                ))}
              </div>

              {/* Change */}
              {cashReceived && (
                <div className={`p-3 rounded-lg ${change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Kembalian:</span>
                    <span className={`font-bold text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rp {Math.abs(change).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {change < 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Uang diterima kurang Rp {Math.abs(change).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={paymentMethod === 'Tunai' && (!cashReceived || change < 0)}
            >
              Proses Pembayaran
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;
