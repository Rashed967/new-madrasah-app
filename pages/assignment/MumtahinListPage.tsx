
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Exam, SelectOption } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ArrowPathIcon, UserCircleIcon, EyeIcon, TrashIcon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AlertDialog } from '../../components/ui/AlertDialog';
import type { PostgrestError } from '@supabase/supabase-js';

interface MumtahinAssignmentDetailFromRPC {
  assignment_id: string;
  personnel_id: string;
  personnel_name_bn: string;
  personnel_code: string;
  personnel_mobile?: string;
  personnel_nid_number?: string; 
  personnel_email?: string; 
  educational_qualification_name_bn?: string;
  kitabi_qualification_names?: string[];
}

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

const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className="" }) => (
  <div className={`py-1 ${className}`}>
    <p className="text-sm text-gray-600">{label}:</p>
    <p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
  </div>
);

const ITEMS_PER_PAGE = 15; // Number of items to fetch per page

const MumtahinListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMumtahinForView, setSelectedMumtahinForView] = useState<MumtahinAssignmentDetailFromRPC | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{id: string, name: string} | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data: exams = [], isLoading: isLoadingExams, error: examsError } = useQuery<Exam[], Error>({
    queryKey: ['activeExamsForMumtahinList'],
    queryFn: async () => {
        const { data, error } = await supabase.from('exams').select('*, exam_marhala_fees!inner(*)').eq('is_active', true).order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(mapExamDbToFrontend);
    }
  });

  const fetchMumtahinsPaginated = async (examId: string, pageParam: number) => {
    const { data, error } = await supabase.rpc('get_all_mumtahins_for_exam', {
      p_exam_id: examId,
      p_page: pageParam,
      p_limit: ITEMS_PER_PAGE,
    });
    if (error) throw error;
    return data as { items: MumtahinAssignmentDetailFromRPC[], totalItems: number, currentPage: number };
  };

  const {
    data: mumtahinInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMumtahins,
    error: mumtahinsError,
    refetch: refetchMumtahinList,
  } = useInfiniteQuery({
    queryKey: ['allMumtahinsForExamPaginated', selectedExamId],
    queryFn: ({ pageParam = 1 }) => fetchMumtahinsPaginated(selectedExamId, pageParam),
    getNextPageParam: (lastPage) => {
      const totalFetched = lastPage.currentPage * ITEMS_PER_PAGE;
      if (totalFetched < lastPage.totalItems) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedExamId,
  });
  
  const mumtahinList = useMemo(() => 
    mumtahinInfiniteData?.pages.flatMap(page => page.items) || [], 
  [mumtahinInfiniteData]);

  const totalMumtahins = mumtahinInfiniteData?.pages[0]?.totalItems || 0;

  useEffect(() => {
    if (examsError) addToast(`পরীক্ষা তালিকা আনতে সমস্যা: ${examsError.message}`, 'error');
    if (mumtahinsError) addToast(`মুমতাহিন তালিকা আনতে সমস্যা: ${mumtahinsError.message}`, 'error');
  }, [examsError, mumtahinsError, addToast]);

  const examOptions: SelectOption[] = useMemo(() => exams.map(ex => ({ value: ex.id, label: ex.name })), [exams]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver);
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);


  const handleViewMumtahinDetails = (mumtahin: MumtahinAssignmentDetailFromRPC) => {
    setSelectedMumtahinForView(mumtahin);
    setIsViewModalOpen(true);
  };

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => { const { error } = await supabase.rpc('remove_exam_personnel_assignment', { p_assignment_id: assignmentId }); if (error) throw error; },
    onSuccess: () => { addToast('নিয়োগ সফলভাবে বাতিল করা হয়েছে।', 'success'); refetchMumtahinList(); queryClient.invalidateQueries({queryKey: ['availableTeachersForAssignment']}); },
    onError: (error: PostgrestError | Error) => { addToast(`বাতিল করতে সমস্যা: ${error.message}`, 'error');}
  });

  const handleDeleteAssignmentClick = (assignmentId: string, mumtahinName: string) => {
    setAssignmentToDelete({id: assignmentId, name: mumtahinName});
    setIsDeleteConfirmOpen(true);
  };
  const confirmDeleteAssignment = () => { if(assignmentToDelete) { removeAssignmentMutation.mutate(assignmentToDelete.id); setIsDeleteConfirmOpen(false); setAssignmentToDelete(null);}};


  if (isLoadingExams) {
    return <div className="flex items-center justify-center h-full p-8"><ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mr-3" /><p className="text-xl text-gray-700">পরীক্ষার তথ্য লোড হচ্ছে...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নিয়োগকৃত মুমতাহিন তালিকা</h2>
      <Card>
        <div className="p-4">
          <Select label="পরীক্ষা নির্বাচন করুন" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="-- পরীক্ষা নির্বাচন করুন --" required />
        </div>
      </Card>

      {isLoadingMumtahins && selectedExamId && mumtahinList.length === 0 && (
        <div className="flex items-center justify-center p-8"><ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-3" /><p className="text-lg text-gray-700">মুমতাহিনদের তালিকা লোড হচ্ছে...</p></div>
      )}

      {!isLoadingMumtahins && selectedExamId && mumtahinList && mumtahinList.length === 0 && (
        <Card><p className="p-6 text-center text-gray-500">এই পরীক্ষার জন্য কোনো মুমতাহিন নিয়োগ করা হয়নি।</p></Card>
      )}

      {!isLoadingMumtahins && selectedExamId && mumtahinList && mumtahinList.length > 0 && (
        <Card title={`নিয়োগকৃত মুমতাহিনগণ (${totalMumtahins.toLocaleString('bn-BD')} জন)`} className="shadow-lg">
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ক্রমিক</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">নাম (কোড)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">মোবাইল</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">এনআইডি</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">ইমেইল</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">কার্যক্রম</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {mumtahinList.map((mumtahin, index) => (
                        <tr key={mumtahin.assignment_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{(index + 1).toLocaleString('bn-BD')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 text-right">
                                {mumtahin.personnel_name_bn} <span className="text-xs text-gray-500">({mumtahin.personnel_code})</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{mumtahin.personnel_mobile || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right hidden md:table-cell">{mumtahin.personnel_nid_number || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right hidden lg:table-cell">{mumtahin.personnel_email || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleViewMumtahinDetails(mumtahin)} className="p-1 text-emerald-600 hover:text-emerald-800" title="বিস্তারিত দেখুন">
                                    <EyeIcon className="w-5 h-5"/>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignmentClick(mumtahin.assignment_id, mumtahin.personnel_name_bn)} className="p-1 ml-2 text-red-500 hover:text-red-700" title="নিয়োগ বাতিল করুন" disabled={removeAssignmentMutation.isPending && assignmentToDelete?.id === mumtahin.assignment_id}>
                                    <TrashIcon className="w-5 h-5"/>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>
            <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
                {isFetchingNextPage && <ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500" />}
                {!hasNextPage && mumtahinList.length > 0 && totalMumtahins > ITEMS_PER_PAGE && <p className="text-sm text-gray-500">সবকিছু লোড হয়েছে।</p>}
            </div>
        </Card>
      )}

      {selectedMumtahinForView && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`মুমতাহিনের বিবরণ: ${selectedMumtahinForView.personnel_name_bn}`} size="lg">
            <div className="space-y-2">
                <ViewDetailItem label="নাম" value={selectedMumtahinForView.personnel_name_bn} />
                <ViewDetailItem label="কোড" value={selectedMumtahinForView.personnel_code} />
                <ViewDetailItem label="মোবাইল" value={selectedMumtahinForView.personnel_mobile} />
                <ViewDetailItem label="এনআইডি" value={selectedMumtahinForView.personnel_nid_number} />
                <ViewDetailItem label="ইমেইল" value={selectedMumtahinForView.personnel_email} />
                <ViewDetailItem label="শিক্ষাগত যোগ্যতা" value={selectedMumtahinForView.educational_qualification_name_bn} />
                <ViewDetailItem label="কিতাবী দক্ষতা" value={selectedMumtahinForView.kitabi_qualification_names?.join(', ')} />
            </div>
        </Modal>
      )}

      {isDeleteConfirmOpen && assignmentToDelete && (
        <AlertDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteAssignment}
          title="নিয়োগ বাতিল নিশ্চিত করুন"
          description={`আপনি কি "${assignmentToDelete.name}" এর মুমতাহিন নিয়োগটি বাতিল করতে চান?`}
          confirmButtonText={removeAssignmentMutation.isPending ? "বাতিল হচ্ছে..." : "হ্যাঁ, বাতিল করুন"}
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default MumtahinListPage;
