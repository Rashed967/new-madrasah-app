import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchableSelect, SearchableSelectOption } from '../../../components/ui/SearchableSelect';
import { Book } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { ArrowPathIcon, CurrencyBangladeshiIcon, ListBulletIcon } from '../../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

const formatCurrency = (amount: number) => `${amount.toLocaleString('bn-BD')} ৳`;

const BookSalesPage: React.FC = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number | string>('');
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<any>({});

    const { data: books = [], isLoading: isLoadingBooks, error } = useQuery<Book[], Error>({
        queryKey: ['booksForSale'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_all_books');
            if (error) throw error;
            return data;
        },
    });

    const bookOptions = useMemo<SearchableSelectOption[]>(() =>
        books.map(book => ({
            value: book.id,
            label: `${book.title} (${formatCurrency(book.price)}) - স্টক: ${book.current_stock.toLocaleString('bn-BD')}`
        })),
    [books]);

    const selectedBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);

    const totalAmount = useMemo(() => {
        if (selectedBook && quantity) {
            return selectedBook.price * Number(quantity);
        }
        return 0;
    }, [selectedBook, quantity]);
    
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
            queryClient.invalidateQueries({ queryKey: ['booksForSale'] });
            setSelectedBookId(null);
            setQuantity('');
            setCustomerName('');
            setNotes('');
            setErrors({});
        },
        onError: (error: PostgrestError) => {
            addToast(`বিক্রয় রেকর্ডে সমস্যা: ${error.message}`, 'error');
        }
    });

    const validate = () => {
        const newErrors: any = {};
        if (!selectedBookId) newErrors.selectedBookId = 'একটি বই নির্বাচন করুন।';
        if (Number(quantity) <= 0) newErrors.quantity = 'পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে।';
        if (selectedBook && Number(quantity) > selectedBook.current_stock) {
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

    if (error) addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 text-center">বই বিক্রয় রেকর্ড করুন</h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <SearchableSelect
                        id="book-select"
                        label="বই নির্বাচন করুন"
                        options={bookOptions}
                        value={selectedBookId}
                        onChange={setSelectedBookId}
                        placeholder="বই খুঁজুন বা নির্বাচন করুন..."
                        disabled={isLoadingBooks}
                        error={errors.selectedBookId}
                        required
                    />
                    
                    <Input
                        label="পরিমাণ"
                        type="number"
                        value={String(quantity)}
                        onChange={e => setQuantity(e.target.value)}
                        error={errors.quantity}
                        min="1"
                        required
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
                        rows={3}
                    />

                    {totalAmount > 0 && (
                        <div className="p-4 bg-emerald-50 rounded-lg text-center">
                            <p className="text-lg text-gray-800">মোট মূল্য:</p>
                            <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={recordSaleMutation.isPending || !selectedBookId || !quantity} leftIcon={<CurrencyBangladeshiIcon className="w-5 h-5"/>}>
                            {recordSaleMutation.isPending ? 'প্রসেসিং...' : 'বিক্রয় রেকর্ড করুন'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
export default BookSalesPage;
