
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Exam, NegranType, SelectOption, Teacher } from '../../types'; 
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { EyeIcon, ArrowPathIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon, UserCircleIcon, TrashIcon } from '../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

interface NegranDetailFromRPC {
  assignment_id: string;
  personnel_id: string;
  personnel_name_bn: string;
  personnel_code: string;
  personnel_mobile?: string;
  negran_type: NegranType;
  educational_qualification_name_bn?: string; 
  kitabi_qualification_names?: string[];    
}
interface MarkazWithNegransFromRPC {
  markaz_id: string;
  markaz_name_bn: string;
  markaz_code: number;
  host_madrasa_name_bn?: string;
  host_madrasa_upazila?: string;
  host_madrasa_district?: string;
  negrans: NegranDetailFromRPC[];
  head_negran_count: number;      // New
  assistant_negran_count: number; // New
}


const ITEMS_PER_PAGE = 10;

const mapExamDbToFrontend = (dbExam: any): Exam => ({
    id: dbExam.id, name: dbExam.name, registrationDeadline: dbExam.registration_deadline,
    startingRegistrationNumber: dbExam.starting_registration_number,
    registrationFeeRegular: dbExam.registration_fee_regular,
    registrationFeeIrregular: dbExam.registration_fee_irregular,
    lateRegistrationFeeRegular: dbExam.late_registration_fee_regular,
    lateRegistrationFeeIrregular: dbExam.late_registration_fee_irregular,
    examFees: (dbExam.exam_marhala_fees || []).map((f: any) => ({
        marhalaId: f.marhala_id, startingRollNumber: f.starting_roll_number,
        regularFee: f.regular_fee, irregularFee: f.irregular_fee,
        lateRegularFee: f.late_regular_fee, lateIrregularFee: f.late_irregular_fee,
    })),
    isActive: dbExam.is_active, status: dbExam.status as Exam['status'],
    createdAt: dbExam.created_at, updatedAt: dbExam.updated_at,
});

const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className = "" }) => (
  <div className={`py-1 ${className}`}> <p className="text-sm text-gray-600">{label}:</p> <p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p> </div>
);

const NegranListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarkazWithNegransFromRPC | 'total_negrans' | 'head_negran_count' | 'assistant_negran_count' | 'host_madrasa_address'; direction: 'ascending' | 'descending' } | null>({ key: 'markaz_code', direction: 'ascending'});

  const [isNegranDetailsModalOpen, setIsNegranDetailsModalOpen] = useState(false);
  const [selectedNegranForDetails, setSelectedNegranForDetails] = useState<NegranDetailFromRPC | null>(null);
  const [currentMarkazNameForModal, setCurrentMarkazNameForModal] = useState<string>('');
  const [currentMarkazNegransForModal, setCurrentMarkazNegransForModal] = useState<NegranDetailFromRPC[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{id: string, name: string} | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data: exams = [], isLoading: isLoadingExams, error: examsError } = useQuery<Exam[], Error>({
    queryKey: ['activeExamsForNegranList'],
    queryFn: async () => { const { data, error } = await supabase.from('exams').select('*, exam_marhala_fees!inner(*)').eq('is_active', true).order('created_at', { ascending: false }); if (error) throw error; return (data || []).map(mapExamDbToFrontend); }
  });

  const {
    data: groupedNegransInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingGroupedNegrans,
    error: groupedNegransError,
    refetch: refetchGroupedNegrans,
  } = useInfiniteQuery({
    queryKey: ['groupedNegransByExamInfinite', selectedExamId, debouncedSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedExamId) return { items: [], totalItems: 0, currentPage: 1 };
      const { data, error } = await supabase.rpc('get_grouped_negrans_by_exam', {
        p_exam_id: selectedExamId,
        p_search_term: debouncedSearchTerm,
        p_page: pageParam,
        p_limit: ITEMS_PER_PAGE,
      });
      if (error) throw error;
      const rpcResponse = data as { items: MarkazWithNegransFromRPC[]; totalItems: number };
      return { ...rpcResponse, currentPage: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.items) return undefined;
      const totalFetched = lastPage.currentPage * ITEMS_PER_PAGE;
      if (totalFetched < lastPage.totalItems) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedExamId,
  });
  
  const allMarkazData = useMemo(() => 
    groupedNegransInfiniteData?.pages.flatMap(page => page.items) || [], 
  [groupedNegransInfiniteData]);
  const totalMarkazes = groupedNegransInfiniteData?.pages[0]?.totalItems || 0;


  useEffect(() => {
    if (examsError) addToast(`পরীক্ষা তালিকা আনতে সমস্যা: ${examsError.message}`, 'error');
    if (groupedNegransError) addToast(`নেগরান তালিকা আনতে সমস্যা: ${groupedNegransError.message}`, 'error');
  }, [examsError, groupedNegransError, addToast]);

  useEffect(() => { const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500); return () => clearTimeout(handler); }, [searchTerm]);
  
  const examOptions: SelectOption[] = useMemo(() => exams.map(ex => ({ value: ex.id, label: ex.name })), [exams]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver);
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }
    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [handleObserver]);

  const handleSort = (key: keyof MarkazWithNegransFromRPC | 'total_negrans' | 'head_negran_count' | 'assistant_negran_count' | 'host_madrasa_address') => { 
    let direction: 'ascending' | 'descending' = 'ascending'; 
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; } 
    setSortConfig({ key, direction }); 
  };

  const sortedPaginatedData = useMemo(() => {
    if (!allMarkazData) return [];
    let sortedData = [...allMarkazData];
    if (sortConfig !== null) {
      sortedData.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'total_negrans') { valA = a.negrans.length; valB = b.negrans.length; } 
        else if (sortConfig.key === 'head_negran_count') { valA = a.head_negran_count; valB = b.head_negran_count; }
        else if (sortConfig.key === 'assistant_negran_count') { valA = a.assistant_negran_count; valB = b.assistant_negran_count; }
        else if (sortConfig.key === 'host_madrasa_address') {
            valA = a.host_madrasa_upazila ? `${a.host_madrasa_upazila}, ${a.host_madrasa_district}` : '';
            valB = b.host_madrasa_upazila ? `${b.host_madrasa_upazila}, ${b.host_madrasa_district}` : '';
        }
        else { valA = a[sortConfig.key as keyof MarkazWithNegransFromRPC]; valB = b[sortConfig.key as keyof MarkazWithNegransFromRPC]; }
        
        if (valA === undefined || valA === null) valA = ''; 
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string' && typeof valB === 'string') { return sortConfig.direction === 'ascending' ? valA.localeCompare(valB, 'bn') : valB.localeCompare(valA, 'bn'); } 
        else if (typeof valA === 'number' && typeof valB === 'number') { return sortConfig.direction === 'ascending' ? valA - valB : valB - valA; }
        return 0;
      });
    }
    return sortedData;
  }, [allMarkazData, sortConfig]);
  

  const handleViewNegranClick = (negran: NegranDetailFromRPC, markazName: string) => {
    setSelectedNegranForDetails(negran);
    setCurrentMarkazNameForModal(markazName); // Keep this if modal title needs markaz name
    setIsNegranDetailsModalOpen(true);
  };

  const handleOpenNegranListModal = (markazName: string, negrans: NegranDetailFromRPC[]) => {
    setCurrentMarkazNameForModal(markazName);
    setCurrentMarkazNegransForModal(negrans);
    setSelectedNegranForDetails(null); // Clear individual selection
    setIsNegranDetailsModalOpen(true);
  };

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => { const { error } = await supabase.rpc('remove_exam_personnel_assignment', { p_assignment_id: assignmentId }); if (error) throw error; },
    onSuccess: () => { addToast('নিয়োগ সফলভাবে বাতিল করা হয়েছে।', 'success'); refetchGroupedNegrans(); },
    onError: (error: PostgrestError | Error) => { addToast(`বাতিল করতে সমস্যা: ${error.message}`, 'error');}
  });

  const handleDeleteAssignmentClick = (assignmentId: string, negranName: string) => {
    setAssignmentToDelete({id: assignmentId, name: negranName});
    setIsDeleteConfirmOpen(true);
  };
  const confirmDeleteAssignment = () => { if(assignmentToDelete) { removeAssignmentMutation.mutate(assignmentToDelete.id); setIsDeleteConfirmOpen(false); setAssignmentToDelete(null);}};


  if (isLoadingExams) return <div className="flex items-center justify-center h-full p-8"><ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mr-3" /><p className="text-xl text-gray-700">পরীক্ষার তথ্য লোড হচ্ছে...</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">মারকায ভিত্তিক নেগরান তালিকা</h2>
      <Card><div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4"><Select label="পরীক্ষা নির্বাচন করুন" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="-- পরীক্ষা নির্বাচন করুন --" required wrapperClassName="mb-0"/><Input icon={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400"/>} label="মারকায অনুসন্ধান" placeholder="নাম বা কোড দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} wrapperClassName="mb-0" disabled={!selectedExamId}/></div></Card>
      {(isLoadingGroupedNegrans && selectedExamId && allMarkazData.length === 0) && <div className="flex items-center justify-center p-8"><ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-3" /><p className="text-lg text-gray-700">নেগরানদের তালিকা লোড হচ্ছে...</p></div>}
      {!isLoadingGroupedNegrans && selectedExamId && allMarkazData && allMarkazData.length === 0 && <Card><p className="p-6 text-center text-gray-500">এই পরীক্ষার জন্য কোনো মারকাযে নেগরান নিয়োগ করা হয়নি অথবা অনুসন্ধানে কিছু পাওয়া যায়নি।</p></Card>}
      {!isLoadingGroupedNegrans && selectedExamId && allMarkazData && allMarkazData.length > 0 && (
        <Card title={`মারকায তালিকা (মোট: ${totalMarkazes.toLocaleString('bn-BD')})`} bodyClassName="p-0"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-100"><tr>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase w-10">#</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase"><button onClick={() => handleSort('markaz_name_bn')} className="flex items-center justify-end w-full focus:outline-none">মারকাযের নাম (কোড){sortConfig?.key === 'markaz_name_bn' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}{sortConfig?.key !== 'markaz_name_bn' && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}</button></th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase"><button onClick={() => handleSort('host_madrasa_address')} className="flex items-center justify-end w-full focus:outline-none">হোস্ট মাদ্রাসার ঠিকানা{sortConfig?.key === 'host_madrasa_address' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}{sortConfig?.key !== 'host_madrasa_address' && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}</button></th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase"><button onClick={() => handleSort('head_negran_count')} className="flex items-center justify-end w-full focus:outline-none">প্রধান নেগরান সংখ্যা{sortConfig?.key === 'head_negran_count' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}{sortConfig?.key !== 'head_negran_count' && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}</button></th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase"><button onClick={() => handleSort('assistant_negran_count')} className="flex items-center justify-end w-full focus:outline-none">সহকারী নেগরান সংখ্যা{sortConfig?.key === 'assistant_negran_count' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}{sortConfig?.key !== 'assistant_negran_count' && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}</button></th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase"><button onClick={() => handleSort('total_negrans')} className="flex items-center justify-end w-full focus:outline-none">মোট নেগরান{sortConfig?.key === 'total_negrans' && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}{sortConfig?.key !== 'total_negrans' && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}</button></th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">তালিকা দেখুন</th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">{sortedPaginatedData.map((markaz, index) => {
              const addressDisplay = (markaz.host_madrasa_upazila && markaz.host_madrasa_district) ? `${markaz.host_madrasa_upazila}, ${markaz.host_madrasa_district}` : (markaz.host_madrasa_name_bn || 'N/A');
              return (<tr key={markaz.markaz_id}><td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{(index + 1).toLocaleString('bn-BD')}.</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{markaz.markaz_name_bn} ({markaz.markaz_code.toLocaleString('bn-BD')})</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{addressDisplay}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{(markaz.head_negran_count || 0).toLocaleString('bn-BD')}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{(markaz.assistant_negran_count || 0).toLocaleString('bn-BD')}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">{markaz.negrans.length.toLocaleString('bn-BD')}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-center"><Button variant="ghost" size="sm" className="p-1 text-emerald-600 hover:text-emerald-800" onClick={() => handleOpenNegranListModal(markaz.markaz_name_bn, markaz.negrans)} title="নেগরানদের তালিকা দেখুন"><EyeIcon className="w-5 h-5"/></Button></td></tr>);})}
          </tbody></table></div>
          <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
            {isFetchingNextPage && <ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500" />}
            {!hasNextPage && allMarkazData.length > 0 && totalMarkazes > ITEMS_PER_PAGE && <p className="text-sm text-gray-500">সবকিছু লোড হয়েছে।</p>}
          </div>
        </Card>
      )}
      {isNegranDetailsModalOpen && (
        <Modal isOpen={isNegranDetailsModalOpen} onClose={() => setIsNegranDetailsModalOpen(false)} title={`${selectedNegranForDetails ? selectedNegranForDetails.personnel_name_bn + ' এর বিবরণ' : currentMarkazNameForModal + '-এর নেগরান তালিকা'}`} size="xl">
          <div className="max-h-[70vh] overflow-y-auto space-y-3 p-1">
             {selectedNegranForDetails ? (
                <div className="space-y-1">
                    <ViewDetailItem label="নাম" value={selectedNegranForDetails.personnel_name_bn} />
                    <ViewDetailItem label="কোড" value={selectedNegranForDetails.personnel_code} />
                    <ViewDetailItem label="মোবাইল" value={selectedNegranForDetails.personnel_mobile} />
                    <ViewDetailItem label="ধরণ" value={selectedNegranForDetails.negran_type === 'head' ? 'প্রধান' : 'সহকারী'} />
                    <ViewDetailItem label="শিক্ষাগত যোগ্যতা" value={selectedNegranForDetails.educational_qualification_name_bn} />
                    <ViewDetailItem label="কিতাবী দক্ষতা" value={selectedNegranForDetails.kitabi_qualification_names?.join(', ')} />
                    <Button variant="outline" size="sm" onClick={() => setSelectedNegranForDetails(null)} className="mt-2">তালিকায় ফিরে যান</Button>
                </div>
             ) : (
                currentMarkazNegransForModal.length > 0 ? (
                    currentMarkazNegransForModal.map(negran => (
                        <div key={negran.personnel_id} className="p-2.5 border rounded-md hover:bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{negran.personnel_name_bn} <span className="text-xs text-gray-500">({negran.personnel_code})</span></p>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full my-0.5 inline-block ${negran.negran_type === 'head' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{negran.negran_type === 'head' ? 'প্রধান' : 'সহকারী'}</span>
                            </div>
                            <div className="space-x-1">
                                <Button variant="ghost" size="sm" className="p-1" onClick={() => handleViewNegranClick(negran, currentMarkazNameForModal)} title="বিস্তারিত দেখুন"><EyeIcon className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="sm" className="p-1 text-red-500 hover:text-red-700" onClick={() => handleDeleteAssignmentClick(negran.assignment_id, negran.personnel_name_bn)} title="দায়িত্ব থেকে অব্যাহতি দিন" disabled={removeAssignmentMutation.isPending && assignmentToDelete?.id === negran.assignment_id}><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    ))
                ) : <p className="text-center text-gray-500 py-4">এই মারকাযে কোনো নেগরান নেই।</p>
            )}
          </div>
        </Modal>
      )}
      {isDeleteConfirmOpen && assignmentToDelete && (
        <AlertDialog isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={confirmDeleteAssignment} title="নেগরান অব্যাহতি নিশ্চিত করুন" description={`আপনি কি "${assignmentToDelete.name}"-কে নেগরানের দায়িত্ব থেকে অব্যাহতি দিতে চান?`} confirmButtonText={removeAssignmentMutation.isPending ? "অব্যাহতি দেওয়া হচ্ছে..." : "হ্যাঁ, অব্যাহতি দিন"} confirmButtonVariant="danger"/>
      )}
    </div>
  );
};
export default NegranListPage;
