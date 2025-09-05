import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Switch } from '../../components/ui/Switch'; 
import { Select } from '../../components/ui/Select';
import { mockMarhalas } from '../../data/mockMarhalas';
import { Exam, ExamFeeDetail, Marhala, MarhalaSpecificType, ExamStatus, SelectOption, MarhalaApiResponse } from '../../types';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon, Cog6ToothIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';


const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
    id: apiMarhala.id,
    marhala_code: apiMarhala.marhala_code,
    nameBn: apiMarhala.name_bn,
    nameAr: apiMarhala.name_ar || undefined,
    type: apiMarhala.type,
    category: apiMarhala.category,
    kitabIds: apiMarhala.kitab_ids || [],
    marhala_order: apiMarhala.marhala_order,
    requiresPhoto: apiMarhala.requires_photo || false,
    createdAt: apiMarhala.created_at,
    updatedAt: apiMarhala.updated_at,
});


// Form-specific type for ExamFeeDetail allowing string for numeric inputs
type ExamFeeDetailForm = {
  marhalaId: string;
  marhalaName?: string; // For display
  startingRollNumber: number | string;
  regularFee: number | string;
  irregularFee: number | string;
  lateRegularFee: number | string;
  lateIrregularFee: number | string;
};

const getMarhalaNameAndTypeById = (id: string, allMarhalas: Marhala[]): string => {
  const marhala = allMarhalas.find(m => m.id === id);
  if (!marhala) return 'অজানা মারহালা';
  const typeLabel = marhala.type === 'boys' ? 'বালক' : 'বালিকা';
  return `${marhala.nameBn} (${typeLabel} - ${marhala.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const getExamStatusLabel = (status: ExamStatus): string => {
  switch (status) {
    case 'pending': return 'প্রক্রিয়াধীন';
    case 'preparatory': return 'প্রস্তুতি পর্ব';
    case 'ongoing': return 'চলমান';
    case 'completed': return 'সম্পন্ন';
    case 'cancelled': return 'বাতিল';
    default: return 'অজানা';
  }
};

const examStatusOptions: SelectOption[] = [
    { value: '', label: 'সকল স্ট্যাটাস' },
    { value: 'pending', label: 'প্রক্রিয়াধীন' },
    { value: 'preparatory', label: 'প্রস্তুতি পর্ব' },
    { value: 'ongoing', label: 'চলমান' },
    { value: 'completed', label: 'সম্পন্ন' },
    { value: 'cancelled', label: 'বাতিল' },
];

const activeFilterOptions: SelectOption[] = [
    { value: '', label: 'সকল পরীক্ষা (সক্রিয়/নিষ্ক্রিয়)' },
    { value: 'true', label: 'শুধুমাত্র সক্রিয় পরীক্ষা' },
    { value: 'false', label: 'শুধুমাত্র নিষ্ক্রিয় পরীক্ষা' },
];


const ExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [filterIsActive, setFilterIsActive] = useState<string>(''); // Changed to string for Select
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExamForView, setSelectedExamForView] = useState<Exam | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState<Partial<Exam>>({});
  const [editExamFees, setEditExamFees] = useState<ExamFeeDetailForm[]>([]);
  const [editErrors, setEditErrors] = useState<any>({});

  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [examForStatusChange, setExamForStatusChange] = useState<Exam | null>(null);
  const [newStatusForChange, setNewStatusForChange] = useState<ExamStatus | ''>('');


  const { data: examData, isLoading: isLoadingExams, error: examsError, refetch } = useQuery<{ items: Exam[], totalItems: number }, Error>({
    queryKey: ['exams', currentPage, itemsPerPage, searchTerm, filterIsActive, filterStatus],
    queryFn: async () => {
        const isActiveBoolean = filterIsActive === '' ? null : filterIsActive === 'true';
        const { data, error } = await supabase.rpc('get_exams_list', {
            p_page: currentPage, p_limit: itemsPerPage, p_search_term: searchTerm || null,
            p_is_active: isActiveBoolean, p_status: filterStatus || null
        });
        if (error) throw error;
        return data as { items: Exam[], totalItems: number };
    },
    placeholderData: keepPreviousData,
  });

  const exams = examData?.items || [];
  const totalItems = examData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const { data: allMarhalasFromApi = [], isLoading: isLoadingMarhalas } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForExamList'],
    queryFn: async () => {
        const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order', { ascending: true });
        if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।');
        return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend);
    },
    staleTime: Infinity,
  });


  useEffect(() => { if (examsError) addToast(examsError.message, 'error'); }, [examsError, addToast]);

  const toggleExamActiveMutation = useMutation({
    mutationFn: async (params: { examId: string; newStatus: boolean }) => {
      const { data, error } = await supabase.rpc('update_exam_with_fees', {
        p_exam_id: params.examId,
        p_exam_details_updates: { is_active: params.newStatus },
        p_exam_fees_updates: null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      addToast(`পরীক্ষা সফলভাবে ${variables.newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে!`, 'success');
      refetch();
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`পরীক্ষার স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    }
  });

  const changeExamStatusMutation = useMutation({
    mutationFn: async (params: { examId: string; newStatus: ExamStatus }) => {
      const { data, error } = await supabase.rpc('update_exam_with_fees', {
        p_exam_id: params.examId,
        p_exam_details_updates: { status: params.newStatus },
        p_exam_fees_updates: null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      addToast(`পরীক্ষার স্ট্যাটাস সফলভাবে "${getExamStatusLabel(variables.newStatus)}" এ পরিবর্তন করা হয়েছে।`, 'success');
      setIsChangeStatusModalOpen(false);
      refetch();
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`পরীক্ষার স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    }
  });

  const handleViewClick = (exam: Exam) => { setSelectedExamForView(exam); setIsViewModalOpen(true); };

  const marhalaOptionsForEdit: SelectOption[] = useMemo(() =>
    allMarhalasFromApi
      .filter(m => !editExamFees.some(smf => smf.marhalaId === m.id))
      .map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` })),
  [allMarhalasFromApi, editExamFees]);

  const handleEditClick = (exam: Exam) => {
    setEditingExam(exam);
    setEditForm({
      name: exam.name,
      registrationDeadline: exam.registrationDeadline.split('T')[0],
      startingRegistrationNumber: exam.startingRegistrationNumber,
      registrationFeeRegular: exam.registrationFeeRegular,
      registrationFeeIrregular: exam.registrationFeeIrregular,
      lateRegistrationFeeRegular: exam.lateRegistrationFeeRegular,
      lateRegistrationFeeIrregular: exam.lateRegistrationFeeIrregular,
      isActive: exam.isActive,
      status: exam.status,
    });
    setEditExamFees(exam.examFees.map(ef => ({
        ...ef,
        marhalaName: getMarhalaNameAndTypeById(ef.marhalaId, allMarhalasFromApi)
    })));
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setEditForm(prev => ({ ...prev, [name]: val }));
    if(editErrors[name]) setEditErrors(prev => ({...prev, [name]: undefined}));
  };

  const handleEditMarhalaFeeChange = (marhalaId: string, field: keyof ExamFeeDetailForm, value: string) => {
    setEditExamFees(prevFees =>
      prevFees.map(feeDetail =>
        feeDetail.marhalaId === marhalaId
          ? { ...feeDetail, [field]: value }
          : feeDetail
      )
    );
     if(editErrors.examFees && editErrors.examFees[marhalaId] && editErrors.examFees[marhalaId][field]) {
        setEditErrors(prev => {
            const newExamFeeErrors = {...prev.examFees};
            if(newExamFeeErrors[marhalaId]) delete newExamFeeErrors[marhalaId][field];
            if(newExamFeeErrors[marhalaId] && Object.keys(newExamFeeErrors[marhalaId]).length === 0) delete newExamFeeErrors[marhalaId];
            return {...prev, examFees: Object.keys(newExamFeeErrors).length > 0 ? newExamFeeErrors : undefined };
        });
    }
  };

  const handleEditAddMarhalaFee = (marhalaId: string) => {
    if (!marhalaId) return;
    const marhala = allMarhalasFromApi.find(m => m.id === marhalaId);
    if (marhala && !editExamFees.some(mf => mf.marhalaId === marhalaId)) {
      setEditExamFees(prev => [
        ...prev,
        {
          marhalaId: marhala.id,
          marhalaName: `${marhala.nameBn} (${marhala.type === 'boys' ? 'বালক' : 'বালিকা'})`,
          startingRollNumber: '', regularFee: '', irregularFee: '',
          lateRegularFee: '', lateIrregularFee: ''
        }
      ]);
    }
  };

  const handleEditRemoveMarhalaFee = (marhalaId: string) => {
    setEditExamFees(prev => prev.filter(mf => mf.marhalaId !== marhalaId));
  };

  const validateEditForm = (): boolean => {
    const newErrors: any = {};
    if (!editForm.name?.trim()) newErrors.name = 'পরীক্ষার নাম আবশ্যক';
    
    // Only validate these if status is 'pending'
    if (editingExam?.status === 'pending') {
        if (!editForm.registrationDeadline) newErrors.registrationDeadline = 'নিবন্ধনের শেষ তারিখ আবশ্যক';
        const regStartNum = Number(editForm.startingRegistrationNumber);
        if (isNaN(regStartNum) || regStartNum <= 0) newErrors.startingRegistrationNumber = 'ধনাত্মক সংখ্যা হতে হবে';
        if (Number(editForm.registrationFeeRegular) < 0) newErrors.registrationFeeRegular = 'অঋণাত্মক সংখ্যা';
        if (Number(editForm.registrationFeeIrregular) < 0) newErrors.registrationFeeIrregular = 'অঋণাত্মক সংখ্যা';
        if (Number(editForm.lateRegistrationFeeRegular) < 0) newErrors.lateRegistrationFeeRegular = 'অঋণাত্মক সংখ্যা';
        if (Number(editForm.lateRegistrationFeeIrregular) < 0) newErrors.lateRegistrationFeeIrregular = 'অঋণাত্মক সংখ্যা';
    
        const feeErrors: any = {};
        editExamFees.forEach((fee) => {
            const marhalaErrorForFee: any = {};
            if (fee.startingRollNumber === '' || Number(fee.startingRollNumber) <= 0) marhalaErrorForFee.startingRollNumber = `ধনাত্মক সংখ্যা`;
            if (fee.regularFee === '' || Number(fee.regularFee) < 0) marhalaErrorForFee.regularFee = `অঋণাত্মক সংখ্যা`;
            if (fee.irregularFee === '' || Number(fee.irregularFee) < 0) marhalaErrorForFee.irregularFee = `অঋণাত্মক সংখ্যা`;
            if (fee.lateRegularFee === '' || Number(fee.lateRegularFee) < 0) marhalaErrorForFee.lateRegularFee = `অঋণাত্মক সংখ্যা`;
            if (fee.lateIrregularFee === '' || Number(fee.lateIrregularFee) < 0) marhalaErrorForFee.lateIrregularFee = `অঋণাত্মক সংখ্যা`;
            if (Object.keys(marhalaErrorForFee).length > 0) feeErrors[fee.marhalaId] = marhalaErrorForFee;
        });
        if(Object.keys(feeErrors).length > 0) newErrors.examFees = feeErrors;
    }


    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateExamMutation = useMutation({
    mutationFn: async (params: { examId: string, examDetails: any, examFees: any[] | null}) => {
        const { data, error } = await supabase.rpc('update_exam_with_fees', {
            p_exam_id: params.examId,
            p_exam_details_updates: params.examDetails,
            p_exam_fees_updates: params.examFees
        });
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        addToast('পরীক্ষা সফলভাবে আপডেট করা হয়েছে!', 'success');
        setIsEditModalOpen(false);
        refetch();
    },
    onError: (error: PostgrestError | Error) => {
        const pgError = error as PostgrestError;
        let userMessage = `পরীক্ষা আপডেট করতে সমস্যা হয়েছে: ${pgError.message || error.message}`;
       if (pgError.code === '23505' && pgError.message.includes('exams_name_key')) {
          userMessage = `এই নামে (${editForm.name}) একটি পরীক্ষা ইতিমধ্যে বিদ্যমান।`;
          setEditErrors(prev => ({ ...prev, name: userMessage, apiError: undefined }));
      } else {
          setEditErrors(prev => ({ ...prev, apiError: userMessage }));
      }
      addToast(userMessage, 'error');
    }
  });


  const handleSaveChanges = () => {
    if (!editingExam || !validateEditForm()) { addToast('ফর্মটিতে ত্রুটি রয়েছে।', 'error'); return; }

    const examDetailsUpdates: any = { name: editForm.name }; // Name can always be updated unless locked by another logic later

    if (editingExam.status === 'pending') {
        examDetailsUpdates.registration_deadline = new Date(editForm.registrationDeadline!).toISOString();
        examDetailsUpdates.starting_registration_number = Number(editForm.startingRegistrationNumber);
        examDetailsUpdates.registration_fee_regular = Number(editForm.registrationFeeRegular);
        examDetailsUpdates.registration_fee_irregular = Number(editForm.registrationFeeIrregular);
        examDetailsUpdates.late_registration_fee_regular = Number(editForm.lateRegistrationFeeRegular);
        examDetailsUpdates.late_registration_fee_irregular = Number(editForm.lateRegistrationFeeIrregular);
    }

    let examFeesUpdatesPayload: any[] | null = null;
    if (editingExam.status === 'pending') {
        examFeesUpdatesPayload = editExamFees.map(fee => ({
            marhalaId: fee.marhalaId,
            startingRollNumber: Number(fee.startingRollNumber),
            regularFee: Number(fee.regularFee),
            irregularFee: Number(fee.irregularFee),
            lateRegularFee: Number(fee.lateRegularFee),
            lateIrregularFee: Number(fee.lateIrregularFee),
        }));
    }

    updateExamMutation.mutate({ examId: editingExam.id, examDetails: examDetailsUpdates, examFees: examFeesUpdatesPayload });
  };

  const handleChangeStatusClick = (exam: Exam) => {
    setExamForStatusChange(exam);
    setNewStatusForChange(exam.status);
    setIsChangeStatusModalOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (examForStatusChange && newStatusForChange && newStatusForChange !== examForStatusChange.status) {
      changeExamStatusMutation.mutate({ examId: examForStatusChange.id, newStatus: newStatusForChange });
    } else if (newStatusForChange === examForStatusChange?.status) {
      setIsChangeStatusModalOpen(false);
    } else {
      addToast('একটি নতুন স্ট্যাটাস নির্বাচন করুন।', 'warning');
    }
  };

  const getStatusChangeOptions = (currentStatus: ExamStatus): SelectOption[] => {
    let options: ExamStatus[] = [];
    switch (currentStatus) {
      case 'pending': options = ['pending', 'preparatory', 'cancelled']; break;
      case 'preparatory': options = ['preparatory', 'ongoing', 'cancelled']; break;
      case 'ongoing': options = ['ongoing', 'completed', 'cancelled']; break;
      case 'completed': options = ['completed']; break; // Cannot be changed
      case 'cancelled': options = ['cancelled']; break; // Cannot be changed
      default: options = [currentStatus]; break;
    }
    return options.map(s => ({ value: s, label: getExamStatusLabel(s) }));
  };

  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className="" }) => (
    <div className={`py-1 ${className}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-md font-medium text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
  );
  if (isLoadingExams || isLoadingMarhalas) return <p>লোড হচ্ছে...</p>;

  const currentEditExamStatus = editingExam?.status;
  const isNameLocked = !(currentEditExamStatus === 'pending' || currentEditExamStatus === 'cancelled');
  const isRegInfoLocked = currentEditExamStatus !== 'pending';
  const isMarhalaFeesLocked = currentEditExamStatus !== 'pending';
  const isFullyLockedForEditing = ['completed', 'cancelled'].includes(currentEditExamStatus || '');


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">পরীক্ষার তালিকা</h2>
        <Button onClick={() => navigate('/exam/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>নতুন পরীক্ষা</Button>
      </div>
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="অনুসন্ধান করুন" placeholder="পরীক্ষার নাম দিয়ে খুঁজুন..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} wrapperClassName="mb-0 md:col-span-1"/>
            <Select label="স্ট্যাটাস অনুযায়ী ফিল্টার" value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value as ExamStatus | ''); setCurrentPage(1);}} options={examStatusOptions} wrapperClassName="mb-0 md:col-span-1"/>
            <Select label="সক্রিয়তার ভিত্তিতে ফিল্টার" value={filterIsActive} onChange={(e) => {setFilterIsActive(e.target.value); setCurrentPage(1);}} options={activeFilterOptions} wrapperClassName="mb-0 md:col-span-1"/>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">নাম</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">নিবন্ধনের শেষ তারিখ</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">নিবন্ধন শুরুর নং</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">সক্রিয়</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">কার্যক্রম</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (<tr key={exam.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{exam.name}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(exam.registrationDeadline)}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{exam.startingRegistrationNumber.toLocaleString('bn-BD')}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-right"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${exam.status === 'completed' ? 'bg-green-100 text-green-800' : exam.status === 'cancelled' ? 'bg-red-100 text-red-800' : exam.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{getExamStatusLabel(exam.status)}</span></td>
              <td className="px-3 py-4 whitespace-nowrap text-center"><Switch id={`exam-active-${exam.id}`} checked={exam.isActive} onChange={(checked) => toggleExamActiveMutation.mutate({ examId: exam.id, newStatus: checked })} size="sm" srOnlyLabel={`${exam.name} স্ট্যাটাস`}/></td>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center">
                <button onClick={() => handleViewClick(exam)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত"><EyeIcon className="w-5 h-5"/></button>
                <button onClick={() => handleEditClick(exam)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-1" title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></button>
                <button onClick={() => handleChangeStatusClick(exam)} className="text-blue-500 hover:text-blue-700 p-1 ml-1" title="স্ট্যাটাস পরিবর্তন"><Cog6ToothIcon className="w-5 h-5"/></button>
              </td></tr>))}
            {exams.length === 0 && !isLoadingExams && (<tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">কোনো পরীক্ষা পাওয়া যায়নি।</td></tr>)}
          </tbody></table>
        </div>
        {totalPages > 1 && (<div className="py-3 px-4 flex items-center justify-between border-t"><Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoadingExams} size="sm" variant="secondary">পূর্ববর্তী</Button><span className="text-sm">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span><Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoadingExams} size="sm" variant="secondary">পরবর্তী</Button></div>)}
      </Card>

      {isViewModalOpen && selectedExamForView && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`বিবরণ: ${selectedExamForView.name}`} size="2xl">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto p-1">
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1">সাধারণ তথ্য</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                <ViewDetailItem label="নাম" value={selectedExamForView.name} />
                <ViewDetailItem label="নিবন্ধনের শেষ তারিখ" value={formatDate(selectedExamForView.registrationDeadline)} />
                <ViewDetailItem label="নিবন্ধন শুরুর নং" value={selectedExamForView.startingRegistrationNumber.toLocaleString('bn-BD')} />
                <ViewDetailItem label="স্ট্যাটাস" value={getExamStatusLabel(selectedExamForView.status)} />
                <ViewDetailItem label="সক্রিয়" value={selectedExamForView.isActive ? 'হ্যাঁ' : 'না'} />
                <ViewDetailItem label="তৈরির তারিখ" value={formatDate(selectedExamForView.createdAt)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                <ViewDetailItem label="নিবন্ধন ফি (নিয়মিত)" value={`${selectedExamForView.registrationFeeRegular.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="নিবন্ধন ফি (অনিয়মিত)" value={`${selectedExamForView.registrationFeeIrregular.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="বিলম্ব ফি (নিয়মিত)" value={`${selectedExamForView.lateRegistrationFeeRegular.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="বিলম্ব ফি (অনিয়মিত)" value={`${selectedExamForView.lateRegistrationFeeIrregular.toLocaleString('bn-BD')} ৳`} />
            </div>
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1 mt-3">মারহালা ভিত্তিক ফি</h4>
            {selectedExamForView.examFees.length > 0 ? selectedExamForView.examFees.map(fee => (<details key={fee.marhalaId} className="border rounded-md text-sm mb-1"><summary className="font-medium text-gray-700 bg-gray-50 p-2 cursor-pointer hover:bg-gray-100">{getMarhalaNameAndTypeById(fee.marhalaId, allMarhalasFromApi)}</summary><div className="p-2 bg-white grid grid-cols-2 gap-x-4 gap-y-0.5">
                <ViewDetailItem label="শুরুর রোল" value={fee.startingRollNumber.toLocaleString('bn-BD')} />
                <ViewDetailItem label="ফি (নিয়মিত)" value={`${fee.regularFee.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="ফি (অনিয়মিত)" value={`${fee.irregularFee.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="বিলম্ব ফি (নিয়মিত)" value={`${fee.lateRegularFee.toLocaleString('bn-BD')} ৳`} />
                <ViewDetailItem label="বিলম্ব ফি (অনিয়মিত)" value={`${fee.lateIrregularFee.toLocaleString('bn-BD')} ৳`} />
            </div></details>)) : <p className="text-sm text-gray-500 italic">কোনো মারহালা ভিত্তিক ফি যোগ করা হয়নি।</p>}
          </div>
        </Modal>
      )}

      {isEditModalOpen && editingExam && editForm && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`সম্পাদনা: ${editingExam.name}`} size="3xl"
            footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>বাতিল</Button><Button onClick={handleSaveChanges} disabled={updateExamMutation.isPending || isLoadingMarhalas || isFullyLockedForEditing}>সংরক্ষণ করুন</Button></>}>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <fieldset className="border p-3 rounded-md"><legend className="text-md font-medium text-gray-600 px-1">সাধারণ তথ্য</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2 mt-1">
                        <Input label="পরীক্ষার নাম" name="name" value={editForm.name || ''} onChange={handleEditFormChange} error={editErrors.name} required wrapperClassName="mb-0 text-xs" disabled={isNameLocked}/>
                        <Input label="নিবন্ধনের শেষ তারিখ" name="registrationDeadline" type="date" value={editForm.registrationDeadline || ''} onChange={handleEditFormChange} error={editErrors.registrationDeadline} required wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                        <Input label="নিবন্ধন শুরুর নং" name="startingRegistrationNumber" type="number" value={String(editForm.startingRegistrationNumber || '')} onChange={handleEditFormChange} error={editErrors.startingRegistrationNumber} required min="1" wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                        <Input label="নিবন্ধন ফি (নিয়মিত)" name="registrationFeeRegular" type="number" value={String(editForm.registrationFeeRegular || '')} onChange={handleEditFormChange} error={editErrors.registrationFeeRegular} required min="0" wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                        <Input label="নিবন্ধন ফি (অনিয়মিত)" name="registrationFeeIrregular" type="number" value={String(editForm.registrationFeeIrregular || '')} onChange={handleEditFormChange} error={editErrors.registrationFeeIrregular} required min="0" wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                        <Input label="বিলম্ব ফি (নিয়মিত)" name="lateRegistrationFeeRegular" type="number" value={String(editForm.lateRegistrationFeeRegular || '')} onChange={handleEditFormChange} error={editErrors.lateRegistrationFeeRegular} required min="0" wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                        <Input label="বিলম্ব ফি (অনিয়মিত)" name="lateRegistrationFeeIrregular" type="number" value={String(editForm.lateRegistrationFeeIrregular || '')} onChange={handleEditFormChange} error={editErrors.lateRegistrationFeeIrregular} required min="0" wrapperClassName="mb-0 text-xs" disabled={isRegInfoLocked}/>
                    </div>
                </fieldset>
                <fieldset className="border p-3 rounded-md"><legend className="text-md font-medium text-gray-600 px-1">মারহালা ভিত্তিক পরীক্ষার ফি</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                        <Select label="ফি নির্ধারণের জন্য মারহালা যোগ করুন" options={marhalaOptionsForEdit} onChange={(e) => handleEditAddMarhalaFee(e.target.value)} placeholderOption="মারহালা নির্বাচন..." value="" disabled={isLoadingMarhalas || marhalaOptionsForEdit.length === 0 || isMarhalaFeesLocked} wrapperClassName="mb-0 text-xs"/>
                    </div>
                    <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                        {editExamFees.map(fee => {
                            const marhalaErr = editErrors.examFees?.[fee.marhalaId] || {};
                            return (
                            <fieldset key={fee.marhalaId} className="border p-2 rounded bg-gray-50/50 relative"><legend className="text-xs font-semibold text-gray-500 px-1">{fee.marhalaName}</legend><Button type="button" variant="ghost" size="sm" onClick={() => handleEditRemoveMarhalaFee(fee.marhalaId)} className="absolute top-0.5 right-0.5 p-0 text-red-400 hover:text-red-600" disabled={isMarhalaFeesLocked}><XCircleIcon className="w-3.5 h-3.5"/></Button>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-x-2 gap-y-1 mt-0.5">
                                    <Input label="শুরুর রোল" type="number" value={String(fee.startingRollNumber)} onChange={e => handleEditMarhalaFeeChange(fee.marhalaId, 'startingRollNumber', e.target.value)} error={marhalaErr.startingRollNumber} required min="1" wrapperClassName="mb-0 text-xs" className="h-7 text-xs py-1" disabled={isMarhalaFeesLocked}/>
                                    <Input label="ফি (নিয়মিত)" type="number" value={String(fee.regularFee)} onChange={e => handleEditMarhalaFeeChange(fee.marhalaId, 'regularFee', e.target.value)} error={marhalaErr.regularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-7 text-xs py-1" disabled={isMarhalaFeesLocked}/>
                                    <Input label="ফি (অনিয়মিত)" type="number" value={String(fee.irregularFee)} onChange={e => handleEditMarhalaFeeChange(fee.marhalaId, 'irregularFee', e.target.value)} error={marhalaErr.irregularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-7 text-xs py-1" disabled={isMarhalaFeesLocked}/>
                                    <Input label="বিলম্ব ফি (নিয়মিত)" type="number" value={String(fee.lateRegularFee)} onChange={e => handleEditMarhalaFeeChange(fee.marhalaId, 'lateRegularFee', e.target.value)} error={marhalaErr.lateRegularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-7 text-xs py-1" disabled={isMarhalaFeesLocked}/>
                                    <Input label="বিলম্ব ফি (অনিয়মিত)" type="number" value={String(fee.lateIrregularFee)} onChange={e => handleEditMarhalaFeeChange(fee.marhalaId, 'lateIrregularFee', e.target.value)} error={marhalaErr.lateIrregularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-7 text-xs py-1" disabled={isMarhalaFeesLocked}/>
                                </div>
                            </fieldset>);
                        })}
                    </div>
                    {editExamFees.length === 0 && <p className="text-center text-gray-400 text-xs py-2">কোনো মারহালা ফি যোগ করা হয়নি।</p>}
                </fieldset>
                {editErrors.apiError && <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">{editErrors.apiError}</p>}
            </div>
        </Modal>
      )}

    {isChangeStatusModalOpen && examForStatusChange && (
        <Modal isOpen={isChangeStatusModalOpen} onClose={() => setIsChangeStatusModalOpen(false)} title={`"${examForStatusChange.name}" পরীক্ষার স্ট্যাটাস পরিবর্তন`} size="md"
            footer={<><Button variant="secondary" onClick={() => setIsChangeStatusModalOpen(false)}>বাতিল</Button><Button onClick={handleConfirmStatusChange} disabled={changeExamStatusMutation.isPending || newStatusForChange === ''}>{changeExamStatusMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</Button></>}>
            <p className="text-sm text-gray-600 mb-1">বর্তমান স্ট্যাটাস: <span className="font-semibold">{getExamStatusLabel(examForStatusChange.status)}</span></p>
            <Select label="নতুন স্ট্যাটাস নির্বাচন করুন" value={newStatusForChange} onChange={e => setNewStatusForChange(e.target.value as ExamStatus)} options={getStatusChangeOptions(examForStatusChange.status)} required/>
            {changeExamStatusMutation.error && <p className="text-red-500 text-sm mt-2">{changeExamStatusMutation.error.message}</p>}
        </Modal>
    )}
    </div>
  );
};
export default ExamListPage;