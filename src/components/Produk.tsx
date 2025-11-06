import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useApp, Product } from '@/contexts/AppContext';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import { toast } from '@/components/ui/sonner';

const Produk: React.FC = () => {
  const { products, deleteProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = (product: Product) => {
    deleteProduct(product.id);
    toast.success("Berhasil", {
      description: `Produk "${product.name}" berhasil dihapus!`,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 h-8 w-8" />
            Manajemen Produk
          </h1>
          <p className="text-gray-600 mt-2">Kelola inventori dan produk Anda</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card><CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-gray-600">Total Produk</p>
          <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
        </CardContent></Card>

        <Card><CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
          <p className={`text-2xl font-bold ${lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockProducts}</p>
        </CardContent></Card>

        <Card><CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-gray-600">Nilai Inventori</p>
          <p className="text-2xl font-bold text-green-600">Rp {totalValue.toLocaleString('id-ID')}</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <Card className="mb-6"><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardContent></Card>

      {/* Products Grid */}
      {totalProducts === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Produk</h3>
          <p className="text-gray-500 mb-6">Mulai dengan menambahkan produk pertama Anda</p>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk Pertama
          </Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const margin = product.price - product.cost;
            const marginLabel = margin < 0 ? 'Rugi' : 'Untung';

            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    {product.stock < product.minStock && <p className="text-sm text-red-500 mt-1">⚠️ Stok di bawah minimal</p>}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Harga:</span>
                      <span className="font-medium">Rp {product.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stok:</span>
                      <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>{product.stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nilai:</span>
                      <span className="font-medium">Rp {(product.cost * product.stock).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className={`font-medium ${margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rp {margin.toLocaleString('id-ID')} ({marginLabel})
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Yakin ingin menghapus produk?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Produk <strong>{product.name}</strong> akan dihapus secara permanen. 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(product)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredProducts.length === 0 && totalProducts > 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada produk yang ditemukan</p>
        </div>
      )}

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditProductModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} product={selectedProduct} />
    </div>
  );
};

export default Produk;
