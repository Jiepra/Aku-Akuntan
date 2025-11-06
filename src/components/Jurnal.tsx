import React, { useState } from 'react';
import { FileText, Plus, Eye, Edit3, Trash2, Calendar } from 'lucide-react'; // Tambahkan Edit3 icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import AddJournalModal from './AddJournalModal';
import { toast } from '@/components/ui/sonner';
import { JournalEntryUI } from '@/types/AccountingTypes'; // Import JournalEntryUI

const Jurnal: React.FC = () => {
  const { journalEntries, getAccountsData, deleteJournalEntry } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('bulan-ini');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntryUI | null>(null); // State untuk jurnal yang sedang diedit

  // Filter jurnal berdasarkan periode yang dipilih (contoh sederhana)
  const filteredJournalEntries = journalEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    
    // Perbaikan kecil untuk filter: pastikan membandingkan tahun juga
    if (selectedPeriod === 'bulan-ini') {
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    } else if (selectedPeriod === 'bulan-lalu') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return entryDate.getMonth() === lastMonth.getMonth() && entryDate.getFullYear() === lastMonth.getFullYear();
    } else if (selectedPeriod === 'tahun-ini') {
        return entryDate.getFullYear() === now.getFullYear();
    } else if (selectedPeriod === 'triwulan') {
        // Logika triwulan (misal: Q1=Jan-Mar, Q2=Apr-Jun, dst.)
        const currentMonth = now.getMonth(); // 0-11
        const currentQuarter = Math.floor(currentMonth / 3); // 0, 1, 2, 3
        const entryQuarter = Math.floor(entryDate.getMonth() / 3);
        return entryQuarter === currentQuarter && entryDate.getFullYear() === now.getFullYear();
    }
    return true; // Default to showing all if 'all' selected or no specific filter
  });

  const totalDebitFiltered = filteredJournalEntries.reduce((sum, entry) => 
    sum + entry.debit.reduce((lineSum, line) => lineSum + line.amount, 0), 0
  );
  // Perbaikan di baris ini: Ganti 'lineSum' menjadi 'sum'
  const totalCreditFiltered = filteredJournalEntries.reduce((sum, entry) => 
    sum + entry.credit.reduce((lineSum, line) => lineSum + line.amount, 0), 0
  );

  const formatCurrency = (amount: number) => {
    return `Rp ${Math.floor(amount).toLocaleString('id-ID')}`;
  };

  const handleDeleteJournal = async (journalId: string) => {
    try {
      await deleteJournalEntry(journalId);
      toast.success("Entri jurnal berhasil dihapus.", {
        description: "Jurnal Dihapus",
      });
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus entri jurnal.", {
        description: "Gagal Menghapus Jurnal",
      });
      console.error("Error deleting journal:", error);
    }
  };

  const handleEditJournal = (journal: JournalEntryUI) => {
    setEditingJournal(journal); // Set jurnal yang akan diedit
    setShowAddModal(true); // Buka modal
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingJournal(null); // Reset editingJournal saat modal ditutup
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 h-8 w-8" />
              Jurnal Umum
            </h1>
            <p className="text-gray-600 mt-2">Pencatatan jurnal akuntansi berdasarkan transaksi</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                <SelectItem value="bulan-lalu">Bulan Lalu</SelectItem>
                <SelectItem value="triwulan">Triwulan</SelectItem>
                <SelectItem value="tahun-ini">Tahun Ini</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
              onClick={() => {
                setEditingJournal(null); // Pastikan mode tambah
                setShowAddModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurnal
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Total Entri Jurnal</p>
            <p className="text-2xl font-bold text-blue-600">{filteredJournalEntries.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Total Debit</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDebitFiltered)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Total Kredit</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCreditFiltered)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-6">
        {filteredJournalEntries.length > 0 ? (
          filteredJournalEntries.map((entry) => {
            const totalEntryDebit = entry.debit.reduce((sum, line) => sum + line.amount, 0);
            const totalEntryCredit = entry.credit.reduce((sum, line) => sum + line.amount, 0); // Perbaikan di sini
            const isEntryBalanced = totalEntryDebit === totalEntryCredit;

            return (
              <Card key={entry.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Entri Jurnal {entry.id}</h3>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Edit Jurnal"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditJournal(entry)} // Menambahkan fungsi edit
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            title="Hapus Jurnal"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Yakin ingin menghapus jurnal ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Entri jurnal akan dihapus secara permanen. 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteJournal(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    {entry.description} • {entry.date} • {entry.type} • Ref: {entry.reference}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">DEBIT</h4>
                      {entry.debit.map((line, index) => (
                        <div key={index} className="flex justify-between py-1 border-b last:border-b-0">
                          <span>{line.account}</span>
                          <span className="font-medium text-green-600">{formatCurrency(line.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">KREDIT</h4>
                      {entry.credit.map((line, index) => (
                        <div key={index} className="flex justify-between py-1 border-b last:border-b-0">
                          <span>{line.account}</span>
                          <span className="font-medium text-red-600">{formatCurrency(line.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <div className="font-semibold">Total Debit: {formatCurrency(totalEntryDebit)}</div>
                    <div className="font-semibold">Total Kredit: {formatCurrency(totalEntryCredit)}</div>
                    <span className={`text-sm font-medium ${isEntryBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {isEntryBalanced ? '✓ Jurnal Balance' : '⚠ Tidak Balance'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada entri jurnal untuk periode ini.</p>
            <p>Klik "Tambah Jurnal" untuk memulai.</p>
          </div>
        )}
      </div>

      <AddJournalModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        initialData={editingJournal}
      />
    </div>
  );
};

export default Jurnal;
