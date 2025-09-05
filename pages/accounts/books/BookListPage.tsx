import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { AlertDialog } from '../../../components/ui/AlertDialog';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect, SearchableSelectOption } from '../../../components/ui/SearchableSelect';
import { Book } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, CurrencyBangladeshiIcon } from '../../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

const formatCurrency = (amount: number) => `${amount.toLocaleString('bn-BD')} ৳`;

// Component for Add/Edit Modal
const BookFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingBook: Book | null;
}> = ({ isOpen, onClose, editingBook }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!editingBook;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    initial_stock: '', // For new books
    stock_adjustment: '' // For editing books
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title,
        author: editingBook.author || '',
        price: String(editingBook.price),
        initial_stock: String(editingBook.initial_stock),
        stock_adjustment: ''
      });
    } else {
      setFormData({ title: '', author: '', price: '', initial_stock: '', stock_adjustment: '' });
    }
    setErrors({});
  }, [editingBook, isOpen]);

  const mutation = useMutation({
    mutationFn: async (bookData: any) => {
      const rpcName = isEditMode ? 'update_book' : 'create_book';
      const rpcPayload = isEditMode
        ? { p_book_id: editingBook!.id, p_title: bookData.title, p_author: bookData.author, p_price: bookData.price, p_stock_adjustment: bookData.stock_adjustment }
        : { p_title: bookData.title, p_author: bookData.author, p_price: bookData.price, p_initial_stock: bookData.initial_stock };

      const { error } = await supabase.rpc(rpcName, rpcPayload);
      if (error) throw error;
    },
    onSuccess: () => {
      addToast(`বই সফলভাবে ${isEditMode ? 'আপডেট' : 'তৈরি'} হয়েছে!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      onClose();
    },
    onError: (error: PostgrestError) => {
      addToast(`সংরক্ষণে ত্রুটি: ${error.message}`, 'error');
    }
  });

  const validate = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = 'শিরোনাম আবশ্যক।';
    if (Number(formData.price) <= 0) newErrors.price = 'মূল্য একটি ধনাত্মক সংখ্যা হতে হবে।';
    if (!isEditMode && Number(formData.initial_stock) < 0) newErrors.initial_stock = 'প্রারম্ভিক স্টক ঋণাত্মক হতে পারবে না।';
    if (isEditMode && formData.stock_adjustment !== '' && isNaN(Number(formData.stock_adjustment))) newErrors.stock_adjustment = 'একটি সঠিক সংখ্যা দিন।';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
        title: formData.title.trim(),
        author: formData.author.trim() || null,
        price: Number(formData.price),
        initial_stock: Number(formData.initial_stock) || 0,
        stock_adjustment: Number(formData.stock_adjustment) || 0
    };
    mutation.mutate(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'বই সম্পাদনা' : 'নতুন বই যোগ করুন'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="শিরোনাম" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} error={errors.title} required />
        <Input label="লেখক (ঐচ্ছিক)" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
        <Input label="মূল্য (৳)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} error={errors.price} required />
        {isEditMode ? (
          <Input label="স্টক অ্যাডজাস্টমেন্ট" type="number" value={formData.stock_adjustment} onChange={e => setFormData({...formData, stock_adjustment: e.target.value})} error={errors.stock_adjustment} placeholder="যেমন: 5 (যোগ করতে) or -3 (বিয়োগ করতে)" />
        ) : (
          <Input label="প্রারম্ভিক স্টক" type="number" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} error={errors.initial_stock} required />
        )}
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const BookSaleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
}> = ({ isOpen, onClose, books }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<any>({});

  const bookOptions = useMemo<SearchableSelectOption[]>(() => 
      books
        .filter(b => b.current_stock > 0)
        .map(book => ({
            value: book.id,
            label: `${book.title} (স্টক: ${book.current_stock.toLocaleString('bn-BD')})`
        })), 
    [books]);
  
  const selectedBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);

  const totalAmount = useMemo(() => {
    if (selectedBook && quantity) {
        return selectedBook.price * Number(quantity);
    }
    return 0;
  }, [selectedBook, quantity]);

  useEffect(() => {
    if (isOpen) {
        setSelectedBookId(null);
        setQuantity('');
        setCustomerName('');
        setNotes('');
        setErrors({});
    }
  }, [isOpen]);
  
  useEffect(() => {
    setQuantity('');
  }, [selectedBookId]);


  const recordSaleMutation = useMutation({
    mutationFn: async (saleData: { bookId: string; quantity: number; customerName: string; notes: string }) => {
      const { error } = await supabase.rpc('record_book_sale', {
        p_book_id: saleData.bookId,
        p_quantity_sold: saleData.quantity,
        p_customer_name: saleData.customerName || null,
        p_notes: saleData.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('বিক্রয় সফলভাবে রেকর্ড করা হয়েছে!', 'success');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['bookSalesHistory'] });
      onClose();
    },
    onError: (error: PostgrestError) => {
      addToast(`বিক্রয় রেকর্ডে সমস্যা: ${error.message}`, 'error');
    }
  });

  const validate = () => {
    const newErrors: any = {};
    if (!selectedBookId) newErrors.selectedBookId = 'একটি বই নির্বাচন করুন।';
    const numQuantity = Number(quantity);
    if (!quantity || numQuantity <= 0) {
        newErrors.quantity = 'পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে।';
    } else if (selectedBook && numQuantity > selectedBook.current_stock) {
        newErrors.quantity = `অপর্যাপ্ত স্টক। সর্বোচ্চ ${selectedBook.current_stock.toLocaleString('bn-BD')} টি বিক্রি করা সম্ভব।`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    recordSaleMutation.mutate({
      bookId: selectedBookId!,
      quantity: Number(quantity),
      customerName: customerName,
      notes: notes
    });
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="বই বিক্রয় করুন">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect
          id="sale-book-select"
          label="বই নির্বাচন করুন"
          options={bookOptions}
          value={selectedBookId}
          onChange={setSelectedBookId}
          placeholder="বই খুঁজুন..."
          error={errors.selectedBookId}
          required
        />
         {selectedBook && (
            <Input 
                value={`বর্তমান স্টক: ${selectedBook.current_stock.toLocaleString('bn-BD')} টি, একক মূল্য: ${formatCurrency(selectedBook.price)}`} 
                disabled 
                wrapperClassName='mb-0 -mt-2' 
                className="!text-black disabled:opacity-100 disabled:bg-gray-100 text-center"
            />
        )}
        <Input
          label="পরিমাণ"
          type="number"
          value={String(quantity)}
          onChange={e => setQuantity(e.target.value)}
          error={errors.quantity}
          min="1"
          max={selectedBook?.current_stock}
          required
          disabled={!selectedBookId}
        />
        <Input
          label="ক্রেতার নাম (ঐচ্ছিক)"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
        <Textarea
          label="নোট (ঐচ্ছিক)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
         {totalAmount > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <p className="text-md text-gray-800">মোট মূল্য:</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
            </div>
        )}
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={recordSaleMutation.isPending}>বাতিল</Button>
          <Button type="submit" disabled={recordSaleMutation.isPending || !selectedBookId || !quantity}>
            {recordSaleMutation.isPending ? 'প্রসেসিং...' : 'বিক্রয় রেকর্ড করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


// Main Page Component
const BookListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const { data: books = [], isLoading, error } = useQuery<Book[], Error>({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_books');
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
        const { error } = await supabase.rpc('delete_book', { p_book_id: bookId });
        if (error) throw error;
    },
    onSuccess: () => {
      addToast('বই সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setBookToDelete(null);
    },
    onError: (error: PostgrestError) => {
      addToast(`মুছতে সমস্যা: ${error.message}`, 'error');
    }
  });

  const handleAddNew = () => { setEditingBook(null); setIsFormModalOpen(true); };
  const handleEdit = (book: Book) => { setEditingBook(book); setIsFormModalOpen(true); };
  const handleDelete = (book: Book) => setBookToDelete(book);
  const confirmDelete = () => { if (bookToDelete) deleteMutation.mutate(bookToDelete.id); };
  
  if (error) addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">বই ম্যানেজমেন্ট</h2>
        <div className="flex space-x-2">
            <Button onClick={() => setIsSaleModalOpen(true)} leftIcon={<CurrencyBangladeshiIcon className="w-5 h-5"/>}>
                বই বিক্রি করুন
            </Button>
            <Button onClick={handleAddNew} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
                নতুন বই যোগ করুন
            </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">শিরোনাম</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">লেখক</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">মূল্য</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">প্রাথমিক স্টক</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">বর্তমান স্টক</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-6"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block"/> লোড হচ্ছে...</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-500">কোনো বই যোগ করা হয়নি।</td></tr>
              ) : (
                books.map(book => (
                  <tr key={book.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{book.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{book.author || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(book.price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{book.initial_stock.toLocaleString('bn-BD')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-700 text-right">{book.current_stock.toLocaleString('bn-BD')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(book)} className="ml-1"><PencilSquareIcon className="w-5 h-5"/></Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 ml-1" onClick={() => handleDelete(book)}><TrashIcon className="w-5 h-5"/></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BookFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} editingBook={editingBook} />
      <BookSaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} books={books} />
      
      {bookToDelete && (
        <AlertDialog
          isOpen={!!bookToDelete}
          onClose={() => setBookToDelete(null)}
          onConfirm={confirmDelete}
          title="বই মুছে ফেলা নিশ্চিত করুন"
          description={`আপনি কি "${bookToDelete.title}" বইটি মুছে ফেলতে চান?`}
          confirmButtonText={deleteMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"}
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};
export default BookListPage;
