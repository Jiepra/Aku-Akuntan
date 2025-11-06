import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/components/ui/sonner';
import { ArrowDownCircle } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense } = useApp();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    status: 'Lunas' as 'Lunas' | 'Belum Lunas',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Mohon lengkapi semua field yang wajib diisi", {
        description: "Error",
      });
      return;
    }

    // Parse and validate the amount
    const amountStr = formData.amount.trim();
    if (amountStr === '') {
      toast.error("Jumlah tidak boleh kosong", {
        description: "Error",
      });
      return;
    }

    // Clean the input - remove any non-numeric characters except decimal point
    const cleanedAmountStr = amountStr.replace(/[^\d.]/g, '');
    
    const amount = parseFloat(cleanedAmountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah harus berupa angka yang valid dan lebih dari 0", {
        description: "Error",
      });
      return;
    }

    addExpense({
      description: formData.description,
      amount: amount, // Ensure the full amount is passed
      category: formData.category as 'Operasional' | 'Administrasi' | 'Penjualan' | 'Lainnya',
      status: formData.status,
      date: formData.date
    });

    toast.success(`Pengeluaran ${formData.category} sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`, {
      description: "✅ Berhasil",
    });

    setFormData({
      description: '',
      amount: '',
      category: '',
      status: 'Lunas',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For amount field, we might want to sanitize the input
    if (name === 'amount') {
      // Allow only numeric values, and optionally a single decimal point
      // Since the input type is number, this should already be handled by the browser
      setFormData({
        ...formData,
        [name]: value
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-700">
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Tambah Pengeluaran/Beban
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right font-medium">
              Tanggal
            </Label>
            <Input 
              type="date" 
              id="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              className="col-span-3" 
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right font-medium">
              Kategori
            </Label>
            <Select onValueChange={(value) => setFormData({ ...formData, category: value })} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Kategori Beban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operasional">Beban Operasional</SelectItem>
                <SelectItem value="Administrasi">Beban Administrasi</SelectItem>
                <SelectItem value="Penjualan">Beban Penjualan</SelectItem>
                <SelectItem value="Lainnya">Beban Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right font-medium">
              Deskripsi
            </Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="col-span-3 resize-none" 
              placeholder="Contoh: Bayar listrik bulanan, Biaya transportasi, dll."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-medium">
              Jumlah (Rp)
            </Label>
            <Input 
              type="number" 
              id="amount" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} 
              className="col-span-3" 
              placeholder="0"
              min="1"
              required
              step="1"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right font-medium">
              Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'Lunas' | 'Belum Lunas') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lunas">Lunas</SelectItem>
                <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Catat Pengeluaran
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;