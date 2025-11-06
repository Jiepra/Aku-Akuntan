import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/components/ui/sonner';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    supplier: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price || !formData.cost || !formData.stock) {
      toast.error("Mohon lengkapi semua field yang wajib diisi", {
        description: "Error",
      });
      return;
    }

    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost);
    const stock = parseInt(formData.stock);
    const minStock = parseInt(formData.minStock) || 5;

    if (price <= 0 || cost <= 0 || stock < 0) {
      toast.error("Harga, biaya, dan stok harus berupa angka yang valid", {
        description: "Error",
      });
      return;
    }

    addProduct({
      name: formData.name,
      category: formData.category,
      price,
      cost,
      stock,
      minStock,
      supplier: formData.supplier || undefined
    });

    toast.success("Produk berhasil ditambahkan", {
      description: "Berhasil",
    });

    setFormData({
      name: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      supplier: ''
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama Produk
            </Label>
            <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategori
            </Label>
            <Select onValueChange={(value) => setFormData({ ...formData, category: value })} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Makanan">Makanan</SelectItem>
                <SelectItem value="Minuman">Minuman</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Harga Jual
            </Label>
            <Input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Harga Pokok
            </Label>
            <Input type="number" id="cost" name="cost" value={formData.cost} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Stok
            </Label>
            <Input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right">
              Stok Minimal
            </Label>
            <Input type="number" id="minStock" name="minStock" value={formData.minStock} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Supplier
            </Label>
            <Input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Tambah Produk</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
