import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'; 
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Checkbox } from '../../components/ui/Checkbox';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { FileUpload } from '../../components/ui/FileUpload';
import { Tabs } from '../../components/ui/Tabs';
import { Examinee, StudentType, SelectOption, Exam, Madrasa, Marhala, MarhalaApiResponse, MarhalaSpecificType } from '../../types';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, ArrowsUpDownIcon, Cog6ToothIcon, PaperClipIcon, UserCircleIcon as UserIcon, BuildingOffice2Icon, XMarkIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../constants';
import type { PostgrestError } from '@supabase/supabase-js';


// Helper Functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getExamineeStatusLabel = (status?: Examinee['status']): string => {
  if (!status) return 'অজানা';
  switch (status) {
    case 'fee_pending': return 'ফি প্রদানের অপেক্ষায়';
    case 'fee_paid': return 'ফি পরিশোধিত';
    case 'roll_assigned': return 'রোল নির্ধারিত';
    case 'script_distributed': return 'খাতা বিতরণকৃত';
    case 'correction_requested': return 'সংশোধনের অনুরোধকৃত';
    default: return status;
  }
};

const studentTypeOptions: SelectOption[] = [
  { value: 'regular', label: 'নিয়মিত' },
  { value: 'irregular', label: 'অনিয়মিত' },
];

const examineeStatusOptions: SelectOption[] = [
    { value: '', label: 'সকল স্ট্যাটাস'},
    { value: 'fee_pending', label: 'ফি প্রদানের অপেক্ষায়' },
    { value: 'fee_paid', label: 'ফি পরিশোধিত' },
    { value: 'roll_assigned', label: 'রোল নির্ধারিত' },
    { value: 'script_distributed', label: 'খাতা বিতরণকৃত' },
    { value: 'correction_requested', label: 'সংশোধনের অনুরোধকৃত' },
];

interface FetchExamineesParams {
  pageParam?: number; 
  limit: number; searchTerm: string;
  filters: { examId?: string; madrasaId?: string; marhalaId?: string; status?: string; regNoStart?: number | null; regNoEnd?: number | null; };
  sort: { field: string; order: 'asc' | 'desc'; };
}

const mapDbToFrontendExaminee = (dbEx: any): Examinee => ({
  id: dbEx.id,
  registrationFeeCollectionId: dbEx.registration_fee_collection_id,
  examId: dbEx.exam_id,
  madrasaId: dbEx.madrasa_id,
  marhalaId: dbEx.marhala_id,
  registrationNumber: dbEx.registration_number,
  studentType: dbEx.student_type as StudentType,
  nameBn: dbEx.name_bn,
  nameAr: dbEx.name_ar,
  nameEn: dbEx.name_en,
  fatherNameBn: dbEx.father_name_bn,
  fatherNameAr: dbEx.father_name_ar,
  fatherNameEn: dbEx.father_name_en,
  motherNameBn: dbEx.mother_name_bn,
  motherNameAr: dbEx.mother_name_ar,
  motherNameEn: dbEx.mother_name_en,
  dateOfBirth: dbEx.date_of_birth,
  nidOrBirthCert: dbEx.nid_or_birth_cert,
  photoUrl: dbEx.photo_url,
  status: dbEx.status as Examinee['status'],
  rollNumber: dbEx.roll_number,
  registrationInputDate: dbEx.registration_input_date,
  examName: dbEx.exam_name,
  madrasaNameBn: dbEx.madrasa_name_bn,
  madrasaCode: dbEx.madrasa_code,
  marhalaNameBn: dbEx.marhala_name_bn,
  marhalaType: dbEx.marhala_type as MarhalaSpecificType,
});


const fetchExamineesList = async ({ pageParam = 1, limit, searchTerm, filters, sort }: FetchExamineesParams) => {
  const { data, error } = await supabase.rpc('get_examinees_list_with_details', {
    p_page: pageParam, p_limit: limit, p_search_term: searchTerm || null,
    p_exam_id_filter: filters.examId || null, p_madrasa_id_filter: filters.madrasaId || null,
    p_marhala_id_filter: filters.marhalaId || null, p_status_filter: filters.status || null,
    p_reg_no_start_filter: filters.regNoStart, p_reg_no_end_filter: filters.regNoEnd,
    p_sort_field: sort.field, p_sort_order: sort.order,
  });
  if (error) throw error;
  
  const rpcResult = data as { items: any[], totalItems: number }; 
  return {
    items: (rpcResult.items || []).map(mapDbToFrontendExaminee),
    totalItems: rpcResult.totalItems,
    currentPage: pageParam,
    limit: limit
  };
};

interface SortableHeaderProps {
  field: string;
  label: string;
  style?: React.CSSProperties;
}

const ExamineeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filterExamId, setFilterExamId] = useState('');
  const [filterMadrasaId, setFilterMadrasaId] = useState('');
  const [filterMarhalaId, setFilterMarhalaId] = useState('');
  const [filterStatus, setFilterStatus] = useState<Examinee['status'] | ''>('');
  const [regNoFilterStart, setRegNoFilterStart] = useState<string>('');
  const [regNoFilterEnd, setRegNoFilterEnd] = useState<string>('');
  
  const [sortField, setSortField] = useState('registration_input_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isFilterSectionVisible, setIsFilterSectionVisible] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExamineeForView, setSelectedExamineeForView] = useState<Examinee | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExamineeForEdit, setSelectedExamineeForEdit] = useState<Examinee | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Examinee> & { photoFile?: File | null; removeCurrentPhoto?: boolean }>({});
  const [editErrors, setEditErrors] = useState<any>({});
  const [editActiveTab, setEditActiveTab] = useState<string>('personal');

  // Madrasa Search States
  const [madrasaSearchInputTerm, setMadrasaSearchInputTerm] = useState('');
  const [debouncedMadrasaSearchInputTerm, setDebouncedMadrasaSearchInputTerm] = useState('');
  const [selectedMadrasaNameForDisplay, setSelectedMadrasaNameForDisplay] = useState<string | null>(null);
  const [isMadrasaSearchDropdownOpen, setIsMadrasaSearchDropdownOpen] = useState(false);
  const madrasaSearchInputRef = useRef<HTMLInputElement>(null);
  const madrasaDropdownRef = useRef<HTMLUListElement>(null);


  useEffect(() => { const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500); return () => clearTimeout(handler); }, [searchTerm]);
  useEffect(() => { const handler = setTimeout(() => setDebouncedMadrasaSearchInputTerm(madrasaSearchInputTerm), 300); return () => clearTimeout(handler); }, [madrasaSearchInputTerm]);

  const queryParams = useMemo(() => ({
    limit: itemsPerPage, searchTerm: debouncedSearchTerm,
    filters: { examId: filterExamId, madrasaId: filterMadrasaId, marhalaId: filterMarhalaId, status: filterStatus,
               regNoStart: regNoFilterStart ? parseInt(regNoFilterStart, 10) : null,
               regNoEnd: regNoFilterEnd ? parseInt(regNoFilterEnd, 10) : null,
             },
    sort: { field: sortField, order: sortOrder },
  }), [itemsPerPage, debouncedSearchTerm, filterExamId, filterMadrasaId, filterMarhalaId, filterStatus, regNoFilterStart, regNoFilterEnd, sortField, sortOrder]);

  const { 
    data: examineeInfiniteData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    error: fetchError, 
    refetch 
  } = useInfiniteQuery({
    queryKey: ['examineesInfinite', queryParams],
    queryFn: ({ pageParam }) => fetchExamineesList({ ...queryParams, pageParam }),
    getNextPageParam: (lastPage) => {
        if (lastPage.currentPage * lastPage.limit < lastPage.totalItems) {
            return lastPage.currentPage + 1;
        }
        return undefined;
    },
    initialPageParam: 1,
  });
  
  const examinees = useMemo(() => examineeInfiniteData?.pages.flatMap(page => page.items) || [], [examineeInfiniteData]);
  const totalItems = examineeInfiniteData?.pages[0]?.totalItems || 0; 


  const { data: allExamsOptions = [] } = useQuery<SelectOption[], Error>({ 
    queryKey: ['allExamOptionsForExamineeFilter'], 
    queryFn: async () => { 
      const { data, error } = await supabase.from('exams').select('id, name').order('name'); 
      if (error) throw error; 
      return (data || []).map(e => ({ value: e.id, label: e.name })); 
    }
  });

  const { data: madrasaSearchResults, isLoading: isLoadingMadrasaSearch } = useQuery({
    queryKey: ['madrasaSearchForExamineeFilter', debouncedMadrasaSearchInputTerm],
    queryFn: async () => {
      if (debouncedMadrasaSearchInputTerm.trim().length < 2) {
        return { items: [], totalItems: 0 };
      }
      const { data, error } = await supabase.rpc('search_madrasas_for_filter_dropdown', {
        p_search_term: debouncedMadrasaSearchInputTerm,
        p_limit: 5,
        p_page: 1, 
      });
      if (error) {
          console.error('Error searching madrasas for filter dropdown:', error);
          throw new Error(error.message || 'মাদরাসা খুঁজতে সমস্যা হয়েছে।');
      }
      return data as { items: SelectOption[]; totalItems: number };
    },
    enabled: debouncedMadrasaSearchInputTerm.trim().length >= 2 && isMadrasaSearchDropdownOpen && !filterMadrasaId,
  });


  const { data: allMarhalas = [] } = useQuery<Marhala[], Error>({ 
    queryKey: ['allMarhalasForExamineeFilter'], 
    queryFn: async () => { 
        const { data, error } = await supabase.from('marhalas').select('*').order('name_bn'); 
        if (error) throw error; 
        return (data as MarhalaApiResponse[]).map(apiM => ({
            id: apiM.id,
            marhala_code: apiM.marhala_code,
            nameBn: `${apiM.name_bn} (${apiM.type === 'boys' ? 'বালক' : 'বালিকা'})`,
            nameAr: apiM.name_ar || undefined,
            type: apiM.type,
            category: apiM.category,
            kitabIds: apiM.kitab_ids || [],
            marhala_order: apiM.marhala_order,
            requiresPhoto: apiM.requires_photo || false,
            createdAt: apiM.created_at,
            updatedAt: apiM.updated_at,
        })) || []; 
    }
  });


  const examOptions: SelectOption[] = useMemo(() => [{ value: '', label: 'সকল পরীক্ষা' }, ...allExamsOptions], [allExamsOptions]);
  const marhalaOptions: SelectOption[] = useMemo(() => {
    const sortedMarhalas = [...allMarhalas].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'boys' ? -1 : 1;
      }
      return a.marhala_order - b.marhala_order;
    });
    return [{ value: '', label: 'সকল মারহালা' }, ...sortedMarhalas.map(m => ({ value: m.id, label: m.nameBn }))];
  }, [allMarhalas]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        madrasaDropdownRef.current && !madrasaDropdownRef.current.contains(event.target as Node) &&
        madrasaSearchInputRef.current && !madrasaSearchInputRef.current.contains(event.target as Node)
      ) {
        setIsMadrasaSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMadrasaSelect = (option: SelectOption) => {
    setFilterMadrasaId(option.value);
    setSelectedMadrasaNameForDisplay(option.label);
    setMadrasaSearchInputTerm(''); 
    setIsMadrasaSearchDropdownOpen(false);
  };

  const clearMadrasaFilter = () => {
    setFilterMadrasaId('');
    setSelectedMadrasaNameForDisplay(null);
    setMadrasaSearchInputTerm('');
    setIsMadrasaSearchDropdownOpen(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };
  
  

  const handleViewClick = (examinee: Examinee) => { setSelectedExamineeForView(examinee); setIsViewModalOpen(true); };
  
  const handleEditClick = (examinee: Examinee) => {
    setSelectedExamineeForEdit(examinee);
    setEditFormData({
      ...examinee,
      dateOfBirth: examinee.dateOfBirth ? examinee.dateOfBirth.split('T')[0] : '', 
      photoFile: null,
      removeCurrentPhoto: false,
    });
    setEditActiveTab('personal');
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (field: keyof Examinee | 'photoFile' | 'removeCurrentPhoto', value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) setEditErrors((prevErr: any) => { const newErr = { ...prevErr }; delete newErr[field]; return newErr; });
  };

  const validateEditForm = (): boolean => {
    const newErrors: any = {};
    if (!editFormData.nameBn?.trim()) newErrors.nameBn = 'বাংলা নাম আবশ্যক।';
    if (!editFormData.fatherNameBn?.trim()) newErrors.fatherNameBn = 'পিতার বাংলা নাম আবশ্যক।';
    if (!editFormData.motherNameBn?.trim()) newErrors.motherNameBn = 'মাতার বাংলা নাম আবশ্যক।';
    if (!editFormData.dateOfBirth) newErrors.dateOfBirth = 'জন্ম তারিখ আবশ্যক।';
    if (!editFormData.nidOrBirthCert?.trim()) newErrors.nidOrBirthCert = 'NID/জন্ম নিবন্ধন নম্বর আবশ্যক।';
    
    if (editFormData.photoFile) {
      if (editFormData.photoFile.size > 1 * 1024 * 1024) newErrors.photoFile = 'ছবির ফাইল সাইজ সর্বোচ্চ ১ মেগাবাইট।';
      if (!['image/jpeg', 'image/png'].includes(editFormData.photoFile.type)) newErrors.photoFile = 'ছবি অবশ্যই JPG অথবা PNG ফরম্যাটে হতে হবে।';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateExamineeMutation = useMutation({
    mutationFn: async (params: { examineeId: string; updates: any }) => { 
      const { data, error } = await supabase.rpc('update_examinee', {
        p_examinee_id: params.examineeId,
        p_updates: params.updates
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      addToast('পরীক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
      setIsEditModalOpen(false);
      refetch();
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`তথ্য আপডেটে সমস্যা: ${error.message}`, 'error');
      setEditErrors((prev:any) => ({ ...prev, apiError: error.message }));
    }
  });

  const handleSaveChanges = async () => {
    if (!selectedExamineeForEdit || !validateEditForm()) {
      addToast('ফর্মটিতে ত্রুটি রয়েছে। অনুগ্রহ করে ঠিক করুন।', 'error');
      return;
    }
    let photoUrlUpdate: string | null | undefined = undefined; 

    if (editFormData.photoFile) {
      try {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration is missing.");
        photoUrlUpdate = await uploadToCloudinary(editFormData.photoFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      } catch (uploadError: any) {
        addToast(`ছবি আপলোডে সমস্যা: ${uploadError.message}`, 'error');
        setEditErrors((prev:any) => ({ ...prev, photoFile: uploadError.message }));
        return;
      }
    } else if (editFormData.removeCurrentPhoto) {
      photoUrlUpdate = null; 
    }

    const updatesPayload: any = {
      name_bn: editFormData.nameBn, 
      name_ar: editFormData.nameAr || null, 
      name_en: editFormData.nameEn || null,
      father_name_bn: editFormData.fatherNameBn,
      father_name_ar: editFormData.fatherNameAr || null,
      father_name_en: editFormData.fatherNameEn || null,
      mother_name_bn: editFormData.motherNameBn,
      mother_name_ar: editFormData.motherNameAr || null,
      mother_name_en: editFormData.motherNameEn || null,
      date_of_birth: editFormData.dateOfBirth, 
      nid_or_birth_cert: editFormData.nidOrBirthCert,
    };

    if (photoUrlUpdate !== undefined) { 
      updatesPayload.photo_url = photoUrlUpdate;
    }
    
    updateExamineeMutation.mutate({ examineeId: selectedExamineeForEdit.id, updates: updatesPayload });
  };
  
  

  const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, style }) => (
    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" style={style}>
        <button onClick={() => handleSort(field)} className="flex items-center justify-start w-full focus:outline-none">
            {label}
            {sortField === field && (sortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)}
            {sortField !== field && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}
        </button>
    </th>
  );

  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    <div className={`py-1 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <p className="text-xs text-gray-500">{label}:</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
    </div>
  );
  
  const editModalTabs = [
    { id: 'personal', label: 'ব্যক্তিগত তথ্য', icon: <UserIcon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            <Input label="নাম (বাংলা)" name="nameBn" value={editFormData.nameBn || ''} onChange={e => handleEditFormChange('nameBn', e.target.value)} error={editErrors.nameBn} required />
            <Input label="নাম (আরবি)" name="nameAr" value={editFormData.nameAr || ''} onChange={e => handleEditFormChange('nameAr', e.target.value)} style={{direction: 'rtl', textAlign: 'right'}}/>
            <Input label="নাম (ইংরেজি)" name="nameEn" value={editFormData.nameEn || ''} onChange={e => handleEditFormChange('nameEn', e.target.value)} />
            <CustomDatePicker id="editDateOfBirth" label="জন্ম তারিখ" value={editFormData.dateOfBirth} onChange={dateStr => handleEditFormChange('dateOfBirth', dateStr)} error={editErrors.dateOfBirth} required placeholder="YYYY-MM-DD"/>
            <Input label="NID/জন্ম নিবন্ধন নম্বর" name="nidOrBirthCert" value={editFormData.nidOrBirthCert || ''} onChange={e => handleEditFormChange('nidOrBirthCert', e.target.value)} error={editErrors.nidOrBirthCert} required />
        </div>
    )},
    { id: 'family', label: 'পারিবারিক তথ্য', icon: <UserIcon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            <Input label="পিতার নাম (বাংলা)" name="fatherNameBn" value={editFormData.fatherNameBn || ''} onChange={e => handleEditFormChange('fatherNameBn', e.target.value)} error={editErrors.fatherNameBn} required />
            <Input label="পিতার নাম (আরবি)" name="fatherNameAr" value={editFormData.fatherNameAr || ''} onChange={e => handleEditFormChange('fatherNameAr', e.target.value)} style={{direction: 'rtl', textAlign: 'right'}}/>
            <Input label="পিতার নাম (ইংরেজি)" name="fatherNameEn" value={editFormData.fatherNameEn || ''} onChange={e => handleEditFormChange('fatherNameEn', e.target.value)} />
            <Input label="মাতার নাম (বাংলা)" name="motherNameBn" value={editFormData.motherNameBn || ''} onChange={e => handleEditFormChange('motherNameBn', e.target.value)} error={editErrors.motherNameBn} required />
            <Input label="মাতার নাম (আরবি)" name="motherNameAr" value={editFormData.motherNameAr || ''} onChange={e => handleEditFormChange('motherNameAr', e.target.value)} style={{direction: 'rtl', textAlign: 'right'}}/>
            <Input label="মাতার নাম (ইংরেজি)" name="motherNameEn" value={editFormData.motherNameEn || ''} onChange={e => handleEditFormChange('motherNameEn', e.target.value)} />
        </div>
    )},
    { id: 'academic', label: 'একাডেমিক তথ্য', icon: <BuildingOffice2Icon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            <Input label="পরীক্ষা" value={selectedExamineeForEdit?.examName || 'N/A'} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
            <Input label="মাদরাসা" value={selectedExamineeForEdit?.madrasaNameBn || 'N/A'} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
            <Input label="মারহালা" value={`${selectedExamineeForEdit?.marhalaNameBn || 'N/A'} (${selectedExamineeForEdit?.marhalaType === 'boys' ? 'বালক' : 'বালিকা'})`} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
            <Input label="রেজিস্ট্রেশন নম্বর" value={selectedExamineeForEdit?.registrationNumber.toLocaleString('bn-BD') || 'N/A'} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
            <Input label="শিক্ষার্থীর ধরণ" value={selectedExamineeForEdit?.studentType === 'regular' ? 'নিয়মিত' : 'অনিয়মিত'} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
        </div>
    )},
    { id: 'other', label: 'অন্যান্য তথ্য', icon: <PaperClipIcon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            {selectedExamineeForEdit?.photoUrl && !editFormData.photoFile && !editFormData.removeCurrentPhoto && (
                <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">বর্তমান ছবি:</p>
                    <img src={selectedExamineeForEdit.photoUrl} alt={`${selectedExamineeForEdit.nameBn} এর ছবি`} className="w-24 h-24 object-cover rounded border p-0.5" />
                    <Checkbox id="removeCurrentPhoto" label="বর্তমান ছবি মুছে ফেলুন" checked={editFormData.removeCurrentPhoto || false} onChange={e => handleEditFormChange('removeCurrentPhoto', e.target.checked)} wrapperClassName="mt-1"/>
                </div>
            )}
             {selectedExamineeForEdit?.photoUrl && editFormData.removeCurrentPhoto && <p className="text-xs text-orange-600 mb-1">বর্তমান ছবিটি মুছে ফেলা হবে।</p>}
            <FileUpload
                id="editExamineePhoto" label="নতুন ছবি আপলোড করুন (যদি পরিবর্তন করতে চান)"
                onFileChange={file => handleEditFormChange('photoFile', file)}
                acceptedFileTypes="image/jpeg, image/png"
                fileNameDisplay={editFormData.photoFile?.name}
                buttonText="নতুন ছবি নির্বাচন"
                error={editErrors.photoFile}
            />
            <Input label="স্ট্যাটাস" value={getExamineeStatusLabel(selectedExamineeForEdit?.status)} disabled wrapperClassName="mb-0" className="bg-gray-100"/>
        </div>
    )},
  ];


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <h2 className="text-2xl font-semibold text-gray-800">পরীক্ষার্থী তালিকা</h2>
        <Button onClick={() => navigate('/examinee/registration')} leftIcon={<PlusCircleIcon className="w-4 h-4"/>} size="sm">নতুন পরীক্ষার্থী</Button>
      </div>

      <div className="bg-white py-3 shadow-md rounded-lg mb-3">
        <div className="px-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Input placeholder="নাম বা রেজি. নং দিয়ে খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} wrapperClassName="flex-grow w-full sm:w-auto mb-0" className="h-9 text-sm"/>
          <Button variant="outline" onClick={() => setIsFilterSectionVisible(prev => !prev)} leftIcon={isFilterSectionVisible ? <ChevronUpIcon className="w-3 h-3"/> : <ChevronDownIcon className="w-3 h-3"/>} size="sm" className="whitespace-nowrap self-end sm:self-center">{isFilterSectionVisible ? 'ফিল্টার লুকান' : 'ফিল্টার দেখান'}</Button>
        </div>
      </div>
      
      {isFilterSectionVisible && (
        <Card bodyClassName="p-3 -mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end"> {/* Adjusted to lg:grid-cols-8 */}
            {/* Madrasa Search Input - Moved to the beginning and col-span adjusted */}
            <div className="relative text-xs lg:col-span-2"> {/* Changed from lg:col-span-1 to lg:col-span-2 */}
              <label htmlFor="madrasaSearchInputExamineeList" className="block text-xs font-medium text-gray-700 mb-1">মাদরাসা</label>
              {selectedMadrasaNameForDisplay && filterMadrasaId ? (
                <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50 h-9">
                  <span className="truncate text-xs text-black">{selectedMadrasaNameForDisplay}</span>
                  <button type="button" onClick={clearMadrasaFilter} className="ml-2 text-red-500 hover:text-red-700">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Input
                  ref={madrasaSearchInputRef}
                  id="madrasaSearchInputExamineeList"
                  type="text"
                  placeholder="নাম বা কোড..."
                  value={madrasaSearchInputTerm}
                  onChange={(e) => { setMadrasaSearchInputTerm(e.target.value); setIsMadrasaSearchDropdownOpen(true); }}
                  onFocus={() => setIsMadrasaSearchDropdownOpen(true)}
                  wrapperClassName="mb-0"
                  className="h-9 text-xs"
                />
              )}
              {isMadrasaSearchDropdownOpen && !filterMadrasaId && debouncedMadrasaSearchInputTerm.trim().length >= 2 && (
                <ul ref={madrasaDropdownRef} className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                  {isLoadingMadrasaSearch ? (
                    <li className="px-3 py-2 text-xs text-gray-500">অনুসন্ধান করা হচ্ছে...</li>
                  ) : madrasaSearchResults && madrasaSearchResults.items.length > 0 ? (
                    madrasaSearchResults.items.map(option => (
                      <li key={option.value} className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer text-black" onMouseDown={() => handleMadrasaSelect(option)}> {option.label} </li>
                    ))
                  ) : ( <li className="px-3 py-2 text-xs text-gray-500">কোনো মাদরাসা পাওয়া যায়নি।</li> )}
                </ul>
              )}
            </div>

            <Input label="রেজি. নং শুরু" type="number" value={regNoFilterStart} onChange={e => setRegNoFilterStart(e.target.value)} wrapperClassName="mb-0 text-xs lg:col-span-1" className="h-9 text-xs"/>
            <Input label="রেজি. নং শেষ" type="number" value={regNoFilterEnd} onChange={e => setRegNoFilterEnd(e.target.value)} wrapperClassName="mb-0 text-xs lg:col-span-1" className="h-9 text-xs"/>
            <Select label="পরীক্ষা" value={filterExamId} onChange={e => setFilterExamId(e.target.value)} options={examOptions} wrapperClassName="mb-0 text-xs lg:col-span-1" className="h-9 text-xs"/>
            <Select label="মারহালা" value={filterMarhalaId} onChange={e => setFilterMarhalaId(e.target.value)} options={marhalaOptions} wrapperClassName="mb-0 text-xs lg:col-span-1" className="h-9 text-xs"/>
            <Select label="স্ট্যাটাস" value={filterStatus} onChange={e => setFilterStatus(e.target.value as Examinee['status'] | '')} options={examineeStatusOptions} wrapperClassName="mb-0 text-xs lg:col-span-1" className="h-9 text-xs"/>
            
            <div className="lg:col-span-1 flex items-end justify-start"> {/* Reset button container */}
              <Button onClick={() => {setFilterExamId(''); setFilterMadrasaId(''); setSelectedMadrasaNameForDisplay(null); setFilterMarhalaId(''); setFilterStatus(''); setRegNoFilterStart(''); setRegNoFilterEnd(''); setSearchTerm('');}} variant="ghost" size="sm" className="h-9 px-2" title="ফিল্টার রিসেট">
                  <ArrowPathIcon className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card bodyClassName="p-0">
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">ক্রমিক নং</th>
                <SortableHeader field="registration_number" label="রেজি. নং"/>
                <SortableHeader field="roll_number" label="রোল নং"/>
                <SortableHeader field="name_bn" label="নাম"/>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">পিতার নাম</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">জন্ম নিবন্ধন/NID</th>
                <SortableHeader field="madrasa_name_bn" label="মাদরাসা" style={{minWidth: '110px'}}/>
                <SortableHeader field="marhala_name_bn" label="মারহালা" style={{maxWidth: '160px'}}/>
                <SortableHeader field="status" label="স্ট্যাটাস"/>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">কার্যক্রম</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {examinees.map((ex, index) => (<tr key={ex.id} className={`hover:bg-gray-50`}>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-left">{(examineeInfiniteData?.pages[0].currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-left">{ex.registrationNumber?.toLocaleString('bn-BD') ?? 'N/A'}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-left">{ex.rollNumber?.toLocaleString('bn-BD') ?? 'N/A'}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{ex.nameBn}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-left">{ex.fatherNameBn}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-left">{ex.nidOrBirthCert}</td>
              <td className="px-3 py-3 text-sm text-gray-500 text-left" style={{minWidth: '110px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{ex.madrasaNameBn} - {ex.madrasaCode}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-left" style={{maxWidth: '160px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{ex.marhalaNameBn || 'N/A'}</td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-left"><span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${ex.status === 'fee_pending' ? 'bg-yellow-100 text-yellow-800' : ex.status === 'fee_paid' ? 'bg-green-100 text-green-800' : ex.status === 'roll_assigned' ? 'bg-purple-100 text-purple-800' :  'bg-red-100 text-red-800'}`}>{getExamineeStatusLabel(ex.status)}</span></td>
              <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-center"><Button variant="ghost" size="sm" onClick={() => handleViewClick(ex)} className="p-1"><EyeIcon className="w-4 h-4"/></Button><Button variant="ghost" size="sm" onClick={() => handleEditClick(ex)} className="p-1 ml-1"><PencilSquareIcon className="w-4 h-4"/></Button></td>
            </tr>))}
            {isLoading && Array.from({length: 3}).map((_, idx) => ( 
                <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-2 py-3 text-center"><div className="h-4 w-4 bg-gray-200 rounded"></div></td>
                    {Array.from({length: 8}).map((_, cellIdx) => <td key={cellIdx} className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>)}
                </tr>
            ))}
            {!isLoading && examinees.length === 0 && (<tr><td colSpan={10} className="p-6 text-center text-gray-500">কোনো পরীক্ষার্থী পাওয়া যায়নি।</td></tr>)}
          </tbody></table>
        </div>
        
        <div className="py-2 px-3 flex items-center justify-between border-t">
            <div>
                <span className="text-sm text-gray-700 mr-2">প্রতি পৃষ্ঠায়:</span>
                <Select value={itemsPerPage.toString()} onChange={e => setItemsPerPage(Number(e.target.value))} options={[{value:'10', label:'১০'}, {value:'20', label:'২০'}, {value:'50', label:'৫০'}]} wrapperClassName="mb-0 inline-block w-20" className="h-8 text-xs"/>
            </div>
            {hasNextPage && (
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage || isLoading} size="sm" variant="outline" className="text-sm">
                    {isFetchingNextPage ? 'লোড হচ্ছে...' : 'আরও লোড করুন'}
                </Button>
            )}
            {!hasNextPage && examinees.length > 0 && totalItems > itemsPerPage && <span className="text-sm text-gray-500">সবকিছু লোড হয়েছে।</span>}
            <span className="text-sm text-gray-600">মোট: {totalItems.toLocaleString('bn-BD')} জন</span>
        </div>

      </Card>
      
      

      {isViewModalOpen && selectedExamineeForView && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`পরীক্ষার্থীর বিবরণ: ${selectedExamineeForView.nameBn}`} size="2xl">
          <div className="space-y-3 max-h-[75vh] overflow-y-auto p-1">
            {selectedExamineeForView.photoUrl && ( <div className="text-center mb-3"> <img src={selectedExamineeForView.photoUrl} alt={`${selectedExamineeForView.nameBn} এর ছবি`} className="w-28 h-28 object-cover rounded-md inline-block border p-0.5" /> </div> )}
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1">সাধারণ তথ্য</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5"> <ViewDetailItem label="আইডি" value={selectedExamineeForView.id} /> <ViewDetailItem label="পরীক্ষা" value={selectedExamineeForView.examName || 'N/A'} /> <ViewDetailItem label="মাদরাসা" value={selectedExamineeForView.madrasaNameBn || 'N/A'} /> <ViewDetailItem label="মারহালা" value={`${selectedExamineeForView.marhalaNameBn || 'N/A'} (${selectedExamineeForView.marhalaType === 'boys' ? 'বালক' : 'বালিকা'})`} /> <ViewDetailItem label="নিবন্ধন নম্বর" value={selectedExamineeForView.registrationNumber.toLocaleString('bn-BD')} /> <ViewDetailItem label="শিক্ষার্থীর ধরণ" value={selectedExamineeForView.studentType === 'regular' ? 'নিয়মিত' : 'অনিয়মিত'} /> <ViewDetailItem label="স্ট্যাটাস" value={getExamineeStatusLabel(selectedExamineeForView.status)} /> <ViewDetailItem label="রোল নম্বর" value={selectedExamineeForView.rollNumber ? selectedExamineeForView.rollNumber.toLocaleString('bn-BD') : 'নির্ধারিত হয়নি'} /> <ViewDetailItem label="জন্ম তারিখ" value={formatDate(selectedExamineeForView.dateOfBirth)} /> <ViewDetailItem label="NID/জন্ম নিবন্ধন" value={selectedExamineeForView.nidOrBirthCert} /> <ViewDetailItem label="নিবন্ধনের তারিখ" value={formatDate(selectedExamineeForView.registrationInputDate)} /> </div>
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1 mt-2">নামের বিবরণ</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0.5"> <ViewDetailItem label="নাম (বাংলা)" value={selectedExamineeForView.nameBn} /> <ViewDetailItem label="নাম (আরবি)" value={selectedExamineeForView.nameAr} /> <ViewDetailItem label="নাম (ইংরেজি)" value={selectedExamineeForView.nameEn} /> </div>
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1 mt-2">পিতার তথ্য</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0.5"> <ViewDetailItem label="পিতার নাম (বাংলা)" value={selectedExamineeForView.fatherNameBn} /> <ViewDetailItem label="পিতার নাম (আরবি)" value={selectedExamineeForView.fatherNameAr} /> <ViewDetailItem label="পিতার নাম (ইংরেজি)" value={selectedExamineeForView.fatherNameEn} /> </div>
            <h4 className="text-md font-semibold text-gray-700 border-b pb-1 mt-2">মাতার তথ্য</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0.5"> <ViewDetailItem label="মাতার নাম (বাংলা)" value={selectedExamineeForView.motherNameBn} /> <ViewDetailItem label="মাতার নাম (আরবি)" value={selectedExamineeForView.motherNameAr} /> <ViewDetailItem label="মাতার নাম (ইংরেজি)" value={selectedExamineeForView.motherNameEn} /> </div>
          </div>
        </Modal>
      )}

      {isEditModalOpen && selectedExamineeForEdit && editFormData && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`পরীক্ষার্থীর তথ্য সম্পাদনা: ${selectedExamineeForEdit.nameBn}`} size="3xl"
          footer={<><Button variant="secondary" onClick={() => {setIsEditModalOpen(false); setEditErrors({});}}>বাতিল</Button><Button variant="primary" onClick={handleSaveChanges} disabled={updateExamineeMutation.isPending}>{updateExamineeMutation.isPending ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}</Button></>}
        >
          <Tabs tabs={editModalTabs} activeTabId={editActiveTab} onTabChange={setEditActiveTab} />
          {editErrors.apiError && <p className="text-sm text-red-500 pt-2 text-center">{editErrors.apiError}</p>}
        </Modal>
      )}
    </div>
  );
};

export default ExamineeListPage;
