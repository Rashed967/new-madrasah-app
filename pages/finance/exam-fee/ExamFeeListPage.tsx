import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { UnifiedCollectionListEntry, PaymentMethod } from '../../../types';
import { PlusCircleIcon, EyeIcon, ArrowPathIcon } from '../../../components/ui/Icon';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { PAYMENT_METHODS } from '../../../constants';

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return 'অবৈধ তারিখ';
  }
};

const getPaymentMethodLabel = (methodVal?: PaymentMethod | ''): string => {
    if (!methodVal) return 'অজানা';
    return PAYMENT_METHODS.find(pm => pm.value === methodVal)?.label || String(methodVal);
};

// Component to fetch and display details in the modal
const CollectionDetailsModal = ({ collectionId, isOpen, onClose }: { collectionId: string, isOpen: boolean, onClose: () => void }) => {
    const { data: details, isLoading, error } = useQuery({ 
        queryKey: ['collectionDetails', collectionId], 
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_collection_details', { p_collection_id: collectionId });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: isOpen, // Only fetch when the modal is open
    });

    const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className }) => (
        <div className={`py-1 ${className || ''}`}><p className="text-sm text-gray-600">{label}</p><p className="text-md font-medium text-black break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`ফি সংগ্রহের বিবরণ`} size="4xl">
            {isLoading && <div className="p-8 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline mr-2"/> বিবরণ লোড হচ্ছে...</div>}
            {error && <div className="p-4 text-center text-red-500">বিস্তারিত তথ্য আনতে সমস্যা হয়েছে: {error.message}</div>}
            {details && (
                 <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-black border-b pb-2 mb-2">সাধারণ তথ্য</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                        <ViewDetailItem label="পরীক্ষা" value={details.exam?.name} />
                        <ViewDetailItem label="মাদরাসা" value={`${details.madrasa?.name_bn} (কোড: ${details.madrasa?.madrasa_code})`} />
                        <ViewDetailItem label="গ্রহণের তারিখ" value={formatDate(details.collection?.collection_date)} />
                        <ViewDetailItem label="বিলম্ব ফি" value={details.collection?.apply_late_fee ? 'হ্যাঁ' : 'না'} />
                    </div>

                    <h4 className="text-lg font-semibold text-black border-b pb-2 mb-2 pt-3">পরীক্ষার্থীর বিবরণ</h4>
                    <div className="max-h-48 overflow-y-auto pr-2">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100"><tr>
                                <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">রেজি. নং</th>
                                <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">রোল নং</th>
                                <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">নাম</th>
                                <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">প্রদত্ত ফি (৳)</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-200">
                            {details.exam_details?.map((d: any, i: number) => (
                                <tr key={i}>
                                    <td className="p-2 text-right">{d.registrationNumber.toLocaleString('bn-BD')}</td>
                                    <td className="p-2 text-right">{d.rollNumber?.toLocaleString('bn-BD') || 'N/A'}</td>
                                    <td className="p-2 text-right">{d.examineeNameBn}</td>
                                    <td className="p-2 text-right font-semibold text-emerald-700">{d.paidFee.toLocaleString('bn-BD')}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="text-lg font-semibold text-black border-b pb-2 mb-2 pt-3">পেমেন্টের বিবরণ</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {details.payments?.map((p: any) => (
                            <div key={p.receipt_no} className="border rounded-md p-3 bg-gray-50 text-sm text-black">
                                <p className="font-medium text-black">রিসিপ্ট নং: {p.receipt_no.toLocaleString('bn-BD')} - {getPaymentMethodLabel(p.method)} - <span className="text-emerald-700">{Number(p.amount).toLocaleString('bn-BD')} ৳</span> <span className="text-gray-500">({formatDate(p.payment_date)})</span></p>
                                {p.transaction_id && <p><span className="text-gray-500">ট্রানজেকশন আইডি:</span> {p.transaction_id}</p>}
                                {p.check_number && <p><span className="text-gray-500">চেক নম্বর:</span> {p.check_number}</p>}
                                {p.bank_name && <p><span className="text-gray-500">ব্যাংক:</span> {p.bank_name} {p.branch_name && `(${p.branch_name})`}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

const ExamFeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, itemsPerPage]);

  const { data: collectionsData, isLoading, error, refetch } = useQuery<{
    items: UnifiedCollectionListEntry[], 
    totalItems: number
  }, Error>({
    queryKey: ['collectionsList', 'exam_fee', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_collections_list', {
        p_page: currentPage,
        p_limit: itemsPerPage,
        p_search_term: debouncedSearchTerm.trim() || null,
        p_collection_type: 'exam_fee'
      });

      if (error) throw error;

      // The data from the RPC function is now a JSON object with items and totalItems.
      // We need to parse it correctly.
      const responseData = data as { items: any[], totalItems: number };

      const items = (responseData.items || []).map((item: any) => ({
          ...item,
          totalPaidAmount: Number(item.totalPaidAmount) || 0,
          totalCalculatedFee: Number(item.totalCalculatedFee) || 0,
          balanceAmount: Number(item.balanceAmount) || 0,
      }));
      
      const totalItems = responseData.totalItems || 0;

      return { items, totalItems };
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => { if (error) { addToast(error.message || 'পরীক্ষার ফি তালিকা আনতে সমস্যা হয়েছে।', 'error'); } }, [error, addToast]);
  
  const collections = collectionsData?.items || [];
  const totalItems = collectionsData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleViewClick = (collection: UnifiedCollectionListEntry) => { 
      setSelectedCollectionId(collection.id); 
      setIsViewModalOpen(true); 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">পরীক্ষার ফি তালিকা</h2>
        <Button onClick={() => navigate('/finance/exam-fee/collect')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>নতুন পরীক্ষার ফি</Button>
      </div>
      <Card>
        <div className="p-4"><Input placeholder="অনুসন্ধান (রিসিপ্ট নং, পরীক্ষা, মাদরাসা)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} wrapperClassName="mb-0"/></div>
        {isLoading && !collectionsData ? (<div className="flex justify-center items-center p-8 text-gray-500"><ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />তালিকা লোড হচ্ছে...</div>) :
         error ? (<div className="p-4 text-center text-red-500">তথ্য আনতে সমস্যা হয়েছে: {error.message}</div>) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
                {['রিসিপ্ট নং', 'পরীক্ষা', 'মাদরাসা (কোড)', 'মোট ফি', 'মোট জমা', 'অবশিষ্ট', 'গ্রহণের তারিখ', 'কার্যক্রম'].map(h => 
                    <th key={h} className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">{h}</th>
                )}</tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collections.map((col) => (<tr key={col.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{col.receipts?.map(r => r.receiptNo).join(', ') || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{col.examName || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{col.madrasaNameBn || 'N/A'} ({col.madrasaCode || 'N/A'})</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{(col.totalCalculatedFee).toLocaleString('bn-BD')} ৳</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 text-right">{(col.totalPaidAmount).toLocaleString('bn-BD')} ৳</td>
                      <td className={`px-3 py-4 whitespace-nowrap text-sm text-right font-medium ${col.balanceAmount >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{(col.balanceAmount).toLocaleString('bn-BD')} ৳</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(col.collectionDate)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center"><Button variant="ghost" size="sm" onClick={() => handleViewClick(col)} title="বিস্তারিত দেখুন"><EyeIcon className="w-5 h-5"/></Button></td></tr>))}
                  {collections.length === 0 && !isLoading && (<tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">কোনো পরীক্ষার ফি সংগ্রহের তথ্য পাওয়া যায়নি। <Button variant="ghost" onClick={() => refetch()}>পুনরায় চেষ্টা করুন</Button></td></tr>)}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (<div className="py-3 px-4 flex items-center justify-between border-t border-gray-200"><div className="flex-1 flex justify-between sm:hidden"><Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button><Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button></div><div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-gray-700"> মোট <span className="font-medium">{(totalItems).toLocaleString('bn-BD')}</span> টি থেকে <span className="font-medium">{((currentPage - 1) * itemsPerPage + 1).toLocaleString('bn-BD')}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems).toLocaleString('bn-BD')}</span> টি দেখানো হচ্ছে </p></div><div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"><Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} variant="secondary" size="sm" className="rounded-r-none">পূর্ববর্তী</Button><span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"> {(currentPage).toLocaleString('bn-BD')} / {(totalPages).toLocaleString('bn-BD')} </span><Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading} variant="secondary" size="sm" className="rounded-l-none">পরবর্তী</Button></nav></div></div></div>)}
          </>
        )}
      </Card>
      {isViewModalOpen && selectedCollectionId && (
        <CollectionDetailsModal 
            collectionId={selectedCollectionId} 
            isOpen={isViewModalOpen} 
            onClose={() => {
                setIsViewModalOpen(false);
                setSelectedCollectionId(null);
            }} 
        />
      )}
    </div>
  );
};

export default ExamFeeListPage;