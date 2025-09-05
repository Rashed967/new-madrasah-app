import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SelectOption } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { EyeIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '../../components/ui/Icon';
import { SearchableSelect, SearchableSelectOption } from '../../components/ui/SearchableSelect';

// Interface for the main distribution list item
interface DistributionListItem {
  distribution_id: string;
  distribution_date: string;
  assigned_total_scripts_count: number;
  examiner_name_bn: string;
  examiner_code: string;
  exam_name: string;
  markaz_name_bn: string;
  kitab_name_bn: string;
  marhala_name_bn: string;
  madrasa_ids: string[];
  madrasa_names: string[];
}

// Interface for the detailed view modal
interface DistributionDetail {
  roll_numbers: { roll_number: number }[];
  madrasa_names: { name_bn: string }[];
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Main Component
const DistributionListPage: React.FC = () => {
    const { addToast } = useToast();
    
    // State for filters and pagination
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedMarhalaId, setSelectedMarhalaId] = useState('');
    const [selectedKitabId, setSelectedKitabId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    const [selectedMadrasaId, setSelectedMadrasaId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // State for modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDistribution, setSelectedDistribution] = useState<DistributionListItem | null>(null);

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset page when search term changes
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedExamId, selectedMarhalaId, selectedKitabId, selectedMarkazId, selectedMadrasaId]);
    
    // Fetch filter options
    const { data: examOptions = [] } = useQuery<SelectOption[], Error>({ queryKey: ['examOptionsForDistList'], queryFn: async () => { const {data,error} = await supabase.rpc('get_exams_for_filter_dropdown', {p_limit: 500}); if(error) throw error; return data.items || []; } });
    const { data: marhalaOptions = [] } = useQuery<SelectOption[], Error>({ queryKey: ['marhalaOptionsForDistList'], queryFn: async () => { const {data,error} = await supabase.rpc('get_marhalas_for_filter_dropdown', {p_limit: 500}); if(error) throw error; return data.items || []; } });
    const { data: kitabOptions = [] } = useQuery<SelectOption[], Error>({ queryKey: ['kitabOptionsForDistList', selectedMarhalaId], queryFn: async () => { if (!selectedMarhalaId) return []; const {data,error} = await supabase.rpc('get_kitabs_by_marhala', {p_marhala_id: selectedMarhalaId}); if(error) throw error; return (data || []).map((k:any)=>({value: k.id, label:k.name_bn})); }, enabled: !!selectedMarhalaId });
    const { data: markazOptions = [] } = useQuery<SearchableSelectOption[], Error>({ queryKey: ['markazOptionsForDistList'], queryFn: async () => { const {data,error} = await supabase.rpc('get_markazes_for_filter_dropdown', {p_limit: 1000}); if(error) throw error; return data.items || []; } });
    const { data: madrasaOptions = [] } = useQuery<SearchableSelectOption[], Error>({ queryKey: ['madrasaOptionsForDistList'], queryFn: async () => { const {data,error} = await supabase.rpc('search_madrasas_for_filter_dropdown', {p_limit: 1000}); if(error) throw error; return data.items || []; } });

    // Fetch main data
    const queryParams = {
        p_page: currentPage,
        p_limit: itemsPerPage,
        p_search_term: debouncedSearchTerm || null,
        p_exam_id_filter: selectedExamId || null,
        p_marhala_id_filter: selectedMarhalaId || null,
        p_kitab_id_filter: selectedKitabId || null,
        p_markaz_id_filter: selectedMarkazId || null,
        p_madrasa_id_filter: selectedMadrasaId || null
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['distributionList', queryParams],
        queryFn: async () => {
            const { data, error: rpcError } = await supabase.rpc('get_script_distribution_list', queryParams);
            if (rpcError) throw rpcError;
            return data as { items: DistributionListItem[], totalItems: number };
        },
        placeholderData: keepPreviousData,
    });
    
    const distributionList = data?.items || [];
    const totalItems = data?.totalItems || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Fetch details for modal
    const { data: distributionDetails, isLoading: isLoadingDetails } = useQuery<DistributionDetail, Error>({
        queryKey: ['distributionDetails', selectedDistribution?.distribution_id],
        queryFn: async () => {
            const { data, error: rpcError } = await supabase.rpc('get_distribution_examinee_details', { p_distribution_id: selectedDistribution!.distribution_id });
            if (rpcError) throw rpcError;
            return data;
        },
        enabled: !!selectedDistribution,
    });

    useEffect(() => { if (error) addToast(`তালিকা আনতে সমস্যা: ${error.message}`, 'error'); }, [error, addToast]);

    const handleViewClick = (dist: DistributionListItem) => {
        setSelectedDistribution(dist);
        setIsViewModalOpen(true);
    };

    const resetFilters = () => {
      setSelectedExamId(''); setSelectedMarhalaId(''); setSelectedKitabId('');
      setSelectedMarkazId(''); setSelectedMadrasaId(''); setSearchTerm('');
    };

    const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
        <div className="py-1"><p className="text-sm text-gray-500">{label}:</p><p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>
    );
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800">উত্তরপত্র বন্টন তালিকা</h2>
            
            <div className="sticky top-[calc(5rem+1px)] z-10 bg-white py-3 shadow-md rounded-lg mb-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3">
                    <Input placeholder="পরীক্ষকের নাম/কোড..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} wrapperClassName="flex-grow w-full sm:w-auto mb-0" className="h-10 text-sm"/>
                    <Button variant="outline" onClick={() => setIsFilterVisible(!isFilterVisible)} leftIcon={isFilterVisible ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>} size="md" className="whitespace-nowrap">
                        {isFilterVisible ? 'ফিল্টার লুকান' : 'ফিল্টার দেখান'}
                    </Button>
                </div>
            </div>

            {isFilterVisible && (
                <div className="bg-white p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out -mt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
                        <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={[{value: '', label: 'সকল পরীক্ষা'}, ...examOptions]} wrapperClassName="mb-0 text-xs" className="h-9 text-xs" />
                        <Select label="মারহালা" value={selectedMarhalaId} onChange={e => setSelectedMarhalaId(e.target.value)} options={[{value: '', label: 'সকল মারহালা'}, ...marhalaOptions]} wrapperClassName="mb-0 text-xs" className="h-9 text-xs" />
                        <Select label="কিতাব" value={selectedKitabId} onChange={e => setSelectedKitabId(e.target.value)} options={[{value: '', label: 'সকল কিতাব'}, ...kitabOptions]} disabled={!selectedMarhalaId} wrapperClassName="mb-0 text-xs" className="h-9 text-xs" />
                        <SearchableSelect id="markazFilter" label="মারকায" options={markazOptions} value={selectedMarkazId} onChange={setSelectedMarkazId} placeholder="মারকায খুঁজুন..." wrapperClassName="mb-0 text-xs" buttonClassName="h-9 text-xs" />
                        <SearchableSelect id="madrasaFilter" label="মাদরাসা" options={madrasaOptions} value={selectedMadrasaId} onChange={setSelectedMadrasaId} placeholder="মাদরাসা খুঁজুন..." wrapperClassName="mb-0 text-xs" buttonClassName="h-9 text-xs" />
                        <div className="flex items-end justify-start">
                            <Button onClick={resetFilters} variant="ghost" size="sm" className="h-9 px-2" title="ফিল্টার রিসেট করুন">
                                <ArrowPathIcon className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <Card className="mt-4">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['পরীক্ষা', 'মারকায', 'মারহালা', 'কিতাব', 'পরীক্ষক', 'খাতা সংখ্যা', 'বন্টনের তারিখ', 'কার্যক্রম'].map(h => 
                                    <th key={h} className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={8}><div className="h-8 bg-gray-200 m-2 rounded"></div></td></tr>)}
                            {!isLoading && distributionList.map(dist => (
                                <tr key={dist.distribution_id}>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{dist.exam_name}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{dist.markaz_name_bn}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{dist.marhala_name_bn}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{dist.kitab_name_bn}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{dist.examiner_name_bn} ({dist.examiner_code})</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{dist.assigned_total_scripts_count.toLocaleString('bn-BD')}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(dist.distribution_date)}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewClick(dist)}><EyeIcon className="w-5 h-5"/></Button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && distributionList.length === 0 && (
                                <tr><td colSpan={8} className="text-center py-10 text-gray-500">কোনো বন্টনের তথ্য পাওয়া যায়নি।</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
                        <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button>
                        <span className="text-sm text-gray-700">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span>
                        <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button>
                    </div>
                )}
            </Card>

            {isViewModalOpen && selectedDistribution && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="বন্টনের বিস্তারিত বিবরণ" size="2xl">
                    {isLoadingDetails ? <div className="flex items-center justify-center p-8"><ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500"/></div> : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            <ViewDetailItem label="পরীক্ষা" value={selectedDistribution.exam_name} />
                            <ViewDetailItem label="মারকায" value={selectedDistribution.markaz_name_bn} />
                            <ViewDetailItem label="মারহালা" value={selectedDistribution.marhala_name_bn} />
                            <ViewDetailItem label="কিতাব" value={selectedDistribution.kitab_name_bn} />
                            <ViewDetailItem label="পরীক্ষক" value={`${selectedDistribution.examiner_name_bn} (${selectedDistribution.examiner_code})`} />
                            <ViewDetailItem label="বন্টনের তারিখ" value={formatDate(selectedDistribution.distribution_date)} />
                            <ViewDetailItem label="মোট খাতা" value={selectedDistribution.assigned_total_scripts_count.toLocaleString('bn-BD')} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 mt-2">অন্তর্ভুক্ত মাদরাসাসমূহ:</h4>
                            <p className="text-sm text-gray-600">{(distributionDetails?.madrasa_names || selectedDistribution.madrasa_names).map(m => m.name_bn).join(', ')}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 mt-2">পরীক্ষার্থীদের রোল নম্বর:</h4>
                            <div className="max-h-48 overflow-y-auto border p-2 rounded-md bg-gray-50">
                                <p className="text-sm text-gray-800" style={{lineHeight: '1.8'}}>
                                    {(distributionDetails?.roll_numbers || []).map(r => r.roll_number.toLocaleString('bn-BD')).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default DistributionListPage;