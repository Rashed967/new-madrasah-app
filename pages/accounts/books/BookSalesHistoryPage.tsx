import React, { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { SearchableSelect, SearchableSelectOption } from '../../../components/ui/SearchableSelect';
import { BookSale, Book } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { ArrowPathIcon } from '../../../components/ui/Icon';

const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
const formatCurrency = (amount: number) => `${amount.toLocaleString('bn-BD')} ৳`;

const BookSalesHistoryPage: React.FC = () => {
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    bookId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: booksForFilter = [], isLoading: isLoadingBooks } = useQuery<Book[], Error>({
    queryKey: ['booksForSaleHistoryFilter'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_books');
      if (error) throw error;
      return data || [];
    },
  });

  const bookOptions = useMemo<SearchableSelectOption[]>(() =>
    [{ value: '', label: 'সকল বই' }, ...booksForFilter.map(book => ({ value: book.id, label: book.title }))]
  , [booksForFilter]);

  const queryParams = {
    p_page: currentPage,
    p_limit: itemsPerPage,
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
    p_book_id: filters.bookId || null,
  };

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['bookSalesHistory', queryParams],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_book_sales_history', queryParams);
      if (rpcError) throw rpcError;
      return data as { items: BookSale[], totalItems: number };
    },
    placeholderData: keepPreviousData,
  });

  const salesHistory = salesData?.items || [];
  const totalItems = salesData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (error) {
    addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');
  }

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
    setCurrentPage(1); // Reset page on filter change
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">বই বিক্রয়ের তালিকা</h2>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <CustomDatePicker id="start_date" label="শুরুর তারিখ" value={filters.startDate} onChange={date => handleFilterChange('startDate', date)} />
            <CustomDatePicker id="end_date" label="শেষ তারিখ" value={filters.endDate} onChange={date => handleFilterChange('endDate', date)} />
            <SearchableSelect
                id="book-filter"
                label="বই অনুযায়ী ফিল্টার"
                options={bookOptions}
                value={filters.bookId}
                onChange={(value) => handleFilterChange('bookId', value || '')}
                placeholder="বই নির্বাচন করুন..."
                disabled={isLoadingBooks}
                wrapperClassName="mb-0"
            />
        </div>
      </Card>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">তারিখ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">বইয়ের নাম</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">পরিমাণ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">একক মূল্য</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">মোট মূল্য</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ক্রেতার নাম</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">নোট</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center p-6"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block"/> লোড হচ্ছে...</td></tr>
              ) : salesHistory.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500">কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।</td></tr>
              ) : (
                salesHistory.map(sale => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(sale.sale_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{sale.book_title}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{sale.quantity_sold.toLocaleString('bn-BD')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(sale.price_per_unit)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-700 text-right">{formatCurrency(sale.total_amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{sale.customer_name || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{sale.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="py-3 px-4 flex items-center justify-between border-t">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button>
            <span className="text-sm">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button>
          </div>
        )}
      </Card>
    </div>
  );
};
export default BookSalesHistoryPage;