import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { MadrasaInspection, SelectOption } from '../../types';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { Select } from '../../components/ui/Select';

const formatDate = (dateString?: string): string => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
const formatCurrency = (amount?: number): string => amount != null ? `${amount.toLocaleString('bn-BD')} ৳` : 'N/A';

const fetchExamsForSelection = async (): Promise<SelectOption[]> => {
    const { data, error } = await supabase
      .from('exams')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
        console.error("Supabase error fetching exams for selection:", error);
        throw new Error(error.message || 'পরীক্ষা তালিকা আনতে সমস্যা হয়েছে');
    }
    return data.map(exam => ({ value: exam.id, label: exam.name })) || [];
};

const InspectionListPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [itemToDelete, setItemToDelete] = useState<MadrasaInspection | null>(null);

    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);
    
    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, selectedExamId, startDate, endDate]);

    const queryParams = { 
        p_page: currentPage, 
        p_limit: itemsPerPage, 
        p_search_term: debouncedSearchTerm || null,
        p_exam_id: selectedExamId || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
    };

    const { data: inspectionData, isLoading, error } = useQuery({
        queryKey: ['madrasaInspections', queryParams],
        queryFn: async () => {
            const { data: rpcData, error } = await supabase.rpc('get_madrasa_inspections_list', queryParams);
            if (error) throw error;
            
            const rawData = rpcData as { items: any[], totalItems: number };
    
            const mappedItems: MadrasaInspection[] = (rawData.items || []).map((item: any) => ({
                id: item.id,
                madrasaId: item.madrasa_id,
                madrasaNameBn: item.madrasa_name_bn,
                madrasaCode: item.madrasa_code,
                examName: item.exam_name,
                inspectionDate: item.inspection_date,
                inspectorName: item.inspector_name,
                totalFee: item.total_fee,
                createdAt: item.created_at,
                fees: [], 
                comments: undefined,
            }));
            
            return { items: mappedItems, totalItems: rawData.totalItems || 0 };
        },
        placeholderData: keepPreviousData,
    });

    const { data: examOptions, isLoading: isLoadingExams } = useQuery<SelectOption[], Error>({
        queryKey: ['examsForInspectionFilter'],
        queryFn: fetchExamsForSelection,
    });
    
    const inspections = inspectionData?.items || [];
    const totalItems = inspectionData?.totalItems || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.rpc('delete_madrasa_inspection', { p_inspection_id: id });
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('পরিদর্শন রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে।', 'success');
            queryClient.invalidateQueries({ queryKey: ['madrasaInspections'] });
            setItemToDelete(null);
        },
        onError: (err: any) => {
            addToast(`রিপোর্ট মুছতে সমস্যা: ${err.message}`, 'error');
            setItemToDelete(null);
        }
    });
    
    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete.id);
        }
    };
    
    if (error) {
        addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-gray-800">পরিদর্শন রিপোর্ট তালিকা</h2>
                <Button onClick={() => navigate('/inspection/create')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>নতুন রিপোর্ট</Button>
            </div>
            <Card>
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input placeholder="মাদ্রাসার নাম, কোড বা পরিদর্শকের নাম দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} wrapperClassName="mb-0 md:col-span-2"/>
                    <Select
                        id="examId"
                        options={examOptions || []}
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        placeholder="পরীক্ষা নির্বাচন করুন"
                        disabled={isLoadingExams}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <CustomDatePicker id="startDate" label="শুরুর তারিখ" value={startDate} onChange={setStartDate} />
                        <CustomDatePicker id="endDate" label="শেষ তারিখ" value={endDate} onChange={setEndDate} />
                    </div>
                </div>
                {isLoading && <div className="p-4 text-center"><ArrowPathIcon className="animate-spin w-6 h-6 inline-block mr-2" /> লোড হচ্ছে...</div>}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['মাদ্রাসার নাম (কোড)', 'পরীক্ষার নাম', 'পরিদর্শকের নাম', 'পরিদর্শনের তারিখ', 'মোট ফি', 'কার্যক্রম'].map(h => 
                                    <th key={h} className={`px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase ${h === 'কার্যক্রম' ? 'text-center' : ''}`}>{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inspections.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-800">{item.madrasaNameBn} ({item.madrasaCode})</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">{item.examName || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">{item.inspectorName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">{formatDate(item.inspectionDate)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-emerald-700">{formatCurrency(item.totalFee)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/inspection/edit/${item.id}`)} title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setItemToDelete(item)} title="মুছে ফেলুন"><TrashIcon className="w-5 h-5"/></Button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && inspections.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">কোনো রিপোর্ট পাওয়া যায়নি।</td></tr>
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
            {itemToDelete && (
                <AlertDialog 
                    isOpen={!!itemToDelete} 
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title="রিপোর্ট মুছে ফেলুন"
                    description={`আপনি কি "${itemToDelete.madrasaNameBn}" এর এই পরিদর্শন রিপোর্টটি (${formatDate(itemToDelete.inspectionDate)}) মুছে ফেলতে চান?`}
                    confirmButtonText={deleteMutation.isPending ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছুন'}
                />
            )}
        </div>
    );
};
export default InspectionListPage;