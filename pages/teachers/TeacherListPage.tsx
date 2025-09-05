
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Switch } from '../../components/ui/Switch';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { FileUpload } from '../../components/ui/FileUpload';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { Tabs } from '../../components/ui/Tabs';
import { Checkbox } from '../../components/ui/Checkbox'; 
import { Teacher, TeacherDbRow, SelectOption, TeacherAddress, Marhala, Kitab, MarhalaApiResponse, KitabApiResponse, DistrictOption, GenderType, PaymentInfo } from '../../types'; 
import { TEACHER_STATUS_OPTIONS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../constants'; 
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, CheckCircleIcon as ActivateIcon, XCircleIcon as DeactivateIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, ArrowsUpDownIcon, UserCircleIcon, BookOpenIcon, MapPinIcon, CameraIcon, CreditCardIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import type { PostgrestError } from '@supabase/supabase-js';

// Mappers (assuming they correctly map all fields including new ones)
const mapTeacherDbRowToFrontend = (dbRow: TeacherDbRow): Teacher => ({
  id: dbRow.id, teacherCode: dbRow.teacher_code, nameBn: dbRow.name_bn, nameEn: dbRow.name_en || undefined,
  mobile: dbRow.mobile, nidNumber: dbRow.nid_number, email: dbRow.email || undefined,
  dateOfBirth: dbRow.date_of_birth, gender: dbRow.gender, photoUrl: dbRow.photo_url || undefined,
  paymentInfo: dbRow.payment_info || undefined,
  addressDetails: dbRow.address_details || undefined, 
  educationalQualification: dbRow.educational_qualification, 
  kitabiQualification: dbRow.kitabi_qualification || [], 
  expertiseAreas: dbRow.expertise_areas || undefined,
  notes: dbRow.notes || undefined, isActive: dbRow.is_active, registeredBy: dbRow.registered_by || undefined,
  createdAt: dbRow.created_at, updatedAt: dbRow.updated_at,
});

const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn,
  nameAr: apiMarhala.name_ar || undefined, type: apiMarhala.type, category: apiMarhala.category,
  kitabIds: apiMarhala.kitab_ids || [], marhala_order: apiMarhala.marhala_order,
  requiresPhoto: apiMarhala.requires_photo || false, createdAt: apiMarhala.created_at, updatedAt: apiMarhala.updated_at,
});

const mapApiKitabToFrontend = (apiKitab: KitabApiResponse): Kitab => ({
    id: apiKitab.id, kitabCode: apiKitab.kitab_code, nameBn: apiKitab.name_bn,
    nameAr: apiKitab.name_ar || undefined, fullMarks: apiKitab.full_marks,
    createdAt: apiKitab.created_at, updatedAt: apiKitab.updated_at,
});

const formatDate = (dateString?: string): string => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
const formatDateTime = (dateString?: string): string => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const genderOptions: SelectOption[] = [ { value: 'male', label: 'পুরুষ' }, { value: 'female', label: 'মহিলা' }, { value: 'other', label: 'অন্যান্য' }];
const paymentTypeOptions: SelectOption[] = [ { value: 'mobile', label: 'মোবাইল ব্যাংকিং' }, { value: 'bank', label: 'ব্যাংক একাউন্ট' }];


interface SortableHeaderProps { field: string; label: string; currentSortField: string; currentSortOrder: 'asc' | 'desc'; onSort: (field: string) => void; }
const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, currentSortField, currentSortOrder, onSort }) => ( <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> <button onClick={() => onSort(field)} className="flex items-center justify-end w-full focus:outline-none"> {label} {currentSortField === field && (currentSortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1"/> : <ChevronDownIcon className="w-3 h-3 ml-1"/>)} {currentSortField !== field && <ArrowsUpDownIcon className="w-3 h-3 ml-1 text-gray-400"/>} </button> </th> );
const camelToSnakeCase: (str: string) => string = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);


interface EditFormData extends Partial<Teacher> {
  photoFile?: File | null;
  removeCurrentPhoto?: boolean;
  paymentType?: 'mobile' | 'bank' | '';
  mobilePaymentProvider?: string;
  mobilePaymentAccountNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranchName?: string;
}


const TeacherListPage: React.FC = (): JSX.Element => { 
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterIsActive, setFilterIsActive] = useState<string>(''); 
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterSectionVisible, setIsFilterSectionVisible] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<Teacher | null>(null); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<Teacher | null>(null); 
  const [editFormData, setEditFormData] = useState<EditFormData>({}); 
  const [editErrors, setEditErrors] = useState<any>({});
  const [editActiveTab, setEditActiveTab] = useState('general');
  const [teacherToToggleStatus, setTeacherToToggleStatus] = useState<Teacher | null>(null); 
  const [isToggleStatusAlertOpen, setIsToggleStatusAlertOpen] = useState(false);

  useEffect(() => { const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500); return () => clearTimeout(handler); }, [searchTerm]);
  
  const queryParams = useMemo(() => ({
    page: currentPage, limit: itemsPerPage, searchTerm: debouncedSearchTerm,
    filters: { isActive: filterIsActive === '' ? null : filterIsActive === 'true' },
    sort: { field: sortField, order: sortOrder },
  }), [currentPage, itemsPerPage, debouncedSearchTerm, filterIsActive, sortField, sortOrder]);

  const { data: teacherData, isLoading, error: fetchError, refetch } = useQuery<{ items: Teacher[], totalItems: number }, Error>({ 
    queryKey: ['teachers_list', queryParams], 
    queryFn: async () => {
      const rpcParams = { p_is_active: queryParams.filters.isActive, p_limit: queryParams.limit, p_page: queryParams.page, p_search_term: queryParams.searchTerm || null, p_sort_field: queryParams.sort.field, p_sort_order: queryParams.sort.order };
      const { data, error } = await supabase.rpc('get_teachers_list', rpcParams); 
      if (error) throw error;
      const result = data as { items: TeacherDbRow[], totalItems: number };
      return { items: (result.items || []).map(mapTeacherDbRowToFrontend), totalItems: result.totalItems || 0 };
    },
    placeholderData: keepPreviousData,
  });
  const teacherList = teacherData?.items || []; 
  const totalItems = teacherData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const { data: allMarhalas = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForTeacherEdit'], 
    queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order'); if (error) throw error; return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend); },
  });

  const { data: allKitabs = [], isLoading: isLoadingKitabs, error: kitabsError } = useQuery<Kitab[], Error>({
    queryKey: ['allKitabsForTeacherEdit'], 
    queryFn: async () => { const { data, error } = await supabase.from('kitabs').select('*').order('name_bn'); if (error) throw error; return (data as KitabApiResponse[]).map(mapApiKitabToFrontend); },
  });

  const marhalaOptionsForSelect: SelectOption[] = useMemo(() => allMarhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` })), [allMarhalas]);
  const kitabOptionsForMultiSelect: DistrictOption[] = useMemo(() => allKitabs.map(k => ({ value: k.id, label: `${k.nameBn} (কোড: ${k.kitabCode})` })), [allKitabs]);
  const getMarhalaName = useCallback((marhalaId?: string): string => allMarhalas.find(m => m.id === marhalaId)?.nameBn || marhalaId || 'N/A', [allMarhalas]);
  const getKitabNames = useCallback((kitabIds?: string[]): string => { if (!kitabIds || kitabIds.length === 0) return 'N/A'; return kitabIds.map(id => allKitabs.find(k => k.id === id)?.nameBn || id).join(', '); }, [allKitabs]);

  useEffect(() => { if (fetchError) addToast(fetchError.message, 'error'); if (marhalasError) addToast(`মারহালা তালিকা লোডে সমস্যা: ${marhalasError.message}`, 'error'); if (kitabsError) addToast(`কিতাব তালিকা লোডে সমস্যা: ${kitabsError.message}`, 'error'); }, [fetchError, marhalasError, kitabsError, addToast]);

  const handleSort = (field: string) => { if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortOrder('asc'); }};
  const handleViewClick = (person: Teacher) => { setSelectedTeacherForView(person); setIsViewModalOpen(true); }; 

  const handleEditClick = (person: Teacher) => { 
    setSelectedTeacherForEdit(person); 
    let paymentType: 'mobile' | 'bank' | '' = '';
    let mobilePaymentProvider, mobilePaymentAccountNumber, bankAccountName, bankAccountNumber, bankName, bankBranchName;

    if (person.paymentInfo) {
        paymentType = person.paymentInfo.type;
        if (person.paymentInfo.type === 'mobile') {
            mobilePaymentProvider = person.paymentInfo.provider;
            mobilePaymentAccountNumber = person.paymentInfo.account_number;
        } else if (person.paymentInfo.type === 'bank') {
            bankAccountName = person.paymentInfo.account_name;
            bankAccountNumber = person.paymentInfo.account_number;
            bankName = person.paymentInfo.bank_name;
            bankBranchName = person.paymentInfo.branch_name;
        }
    }

    setEditFormData({
      ...person,
      dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
      kitabiQualification: Array.isArray(person.kitabiQualification) ? person.kitabiQualification : [],
      photoFile: null, removeCurrentPhoto: false,
      paymentType, mobilePaymentProvider, mobilePaymentAccountNumber,
      bankAccountName, bankAccountNumber, bankName, bankBranchName,
    });
    setEditErrors({});
    setEditActiveTab('general');
    setIsEditModalOpen(true);
  };

  const handleEditFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors((prevErr: any) => { const newErr = { ...prevErr }; delete newErr[name]; return newErr; }); 
    if (name === 'paymentType') { 
        setEditFormData(prev => ({
            ...prev, mobilePaymentProvider: '', mobilePaymentAccountNumber: '',
            bankAccountName: '', bankAccountNumber: '', bankName: '', bankBranchName: ''
        }));
    }
  };
  const handleEditDateChange = (dateString: string) => { setEditFormData(prev => ({...prev, dateOfBirth: dateString })); if(editErrors.dateOfBirth) setEditErrors((prev:any) => ({...prev, dateOfBirth: undefined})); }; 
  const handleEditPhotoFileChange = (file: File | null) => { setEditFormData(prev => ({ ...prev, photoFile: file, removeCurrentPhoto: false })); if (editErrors.photoFile) setEditErrors((prev: any) => ({ ...prev, photoFile: undefined })); };
  const handleEditKitabiQualificationChange = (selectedKitabIds: string[]) => { setEditFormData(prev => ({ ...prev, kitabiQualification: selectedKitabIds })); if (editErrors.kitabiQualification) setEditErrors(prev => ({ ...prev, kitabiQualification: undefined })); };
  
  const validateEditForm = (): boolean => {
    const newErrors: any = {};
    if (!editFormData.nameBn?.trim()) newErrors.nameBn = 'বাংলা নাম আবশ্যক';
    if (!editFormData.mobile?.trim()) newErrors.mobile = 'মোবাইল নম্বর আবশ্যক';
    else if (!/^(01[3-9]\d{8})$/.test(editFormData.mobile.trim())) newErrors.mobile = 'সঠিক মোবাইল নম্বর দিন';
    if (!editFormData.nidNumber?.trim()) newErrors.nidNumber = 'NID নম্বর আবশ্যক।';
    else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(editFormData.nidNumber.trim())) newErrors.nidNumber = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)';
    if (!editFormData.dateOfBirth) newErrors.dateOfBirth = 'জন্ম তারিখ আবশ্যক।';
    if (!editFormData.gender) newErrors.gender = 'লিঙ্গ নির্বাচন করুন।';
    if (!editFormData.educationalQualification) newErrors.educationalQualification = 'শিক্ষাগত যোগ্যতা (মারহালা) নির্বাচন করুন।';
    if (!editFormData.kitabiQualification || editFormData.kitabiQualification.length === 0) newErrors.kitabiQualification = 'অন্তত একটি কিতাবী যোগ্যতা নির্বাচন করুন।';
    if (editFormData.email && editFormData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email.trim())) newErrors.email = 'সঠিক ইমেইল ঠিকানা দিন';
    
    if (editFormData.photoFile) {
        if (editFormData.photoFile.size > 1 * 1024 * 1024) newErrors.photoFile = 'ছবির ফাইল সাইজ সর্বোচ্চ ১ মেগাবাইট।';
        else if (!['image/jpeg', 'image/png'].includes(editFormData.photoFile.type)) newErrors.photoFile = 'ছবি অবশ্যই JPG অথবা PNG ফরম্যাটে হতে হবে।';
    }

    if (!editFormData.paymentType) newErrors.paymentType = 'পেমেন্টের ধরণ নির্বাচন করুন।';
    else if (editFormData.paymentType === 'mobile') {
        if (!editFormData.mobilePaymentProvider?.trim()) newErrors.mobilePaymentProvider = 'মোবাইল ব্যাংকিং সেবাদাতার নাম আবশ্যক।';
        if (!editFormData.mobilePaymentAccountNumber?.trim()) newErrors.mobilePaymentAccountNumber = 'একাউন্ট নম্বর আবশ্যক।';
        else if (!/^(01[3-9]\d{8})$/.test(editFormData.mobilePaymentAccountNumber.trim())) newErrors.mobilePaymentAccountNumber = 'সঠিক মোবাইল একাউন্ট নম্বর দিন।';
    } else if (editFormData.paymentType === 'bank') {
        if (!editFormData.bankAccountName?.trim()) newErrors.bankAccountName = 'একাউন্টের নাম আবশ্যক।';
        if (!editFormData.bankAccountNumber?.trim()) newErrors.bankAccountNumber = 'একাউন্ট নম্বর আবশ্যক।';
        if (!editFormData.bankName?.trim()) newErrors.bankName = 'ব্যাংকের নাম আবশ্যক।';
        if (!editFormData.bankBranchName?.trim()) newErrors.bankBranchName = 'ব্রাঞ্চের নাম আবশ্যক।';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateTeacherMutation = useMutation({ 
    mutationFn: async (payload: { p_teacher_id: string, p_updates: any }) => { const { data, error } = await supabase.rpc('update_teacher', payload); if (error) throw error; return data; }, 
    onSuccess: () => { addToast('তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success'); refetch(); setIsEditModalOpen(false); setEditFormData({}); setEditErrors({});},
    onError: (error: PostgrestError | Error) => { addToast(`আপডেটে সমস্যা: ${error.message}`, 'error'); setEditErrors((prev: any) => ({...prev, apiError: error.message}));}
  });

  const handleSaveChanges = async () => {
    if (!selectedTeacherForEdit || !validateEditForm()) { addToast('ফর্মটিতে ত্রুটি রয়েছে।', 'error'); return; } 
    
    let uploadedPhotoUrl = editFormData.photoUrl;
    if (editFormData.photoFile) {
      try {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration is missing.");
        uploadedPhotoUrl = await uploadToCloudinary(editFormData.photoFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      } catch (uploadError: any) {
        setEditErrors((prev: any) => ({ ...prev, photoFile: uploadError.message, apiError: `ছবি আপলোডে সমস্যা: ${uploadError.message}`}));
        addToast(`ছবি আপলোডে সমস্যা: ${uploadError.message}`, 'error');
        return;
      }
    } else if (editFormData.removeCurrentPhoto) {
      uploadedPhotoUrl = undefined; 
    }

    let paymentInfoPayload: PaymentInfo | null = null;
    if (editFormData.paymentType === 'mobile') {
        paymentInfoPayload = { type: 'mobile', provider: editFormData.mobilePaymentProvider!, account_number: editFormData.mobilePaymentAccountNumber! };
    } else if (editFormData.paymentType === 'bank') {
        paymentInfoPayload = { type: 'bank', account_name: editFormData.bankAccountName!, account_number: editFormData.bankAccountNumber!, bank_name: editFormData.bankName!, branch_name: editFormData.bankBranchName! };
    }

    const updatesToSend: any = {
        name_bn: editFormData.nameBn, name_en: editFormData.nameEn || null, mobile: editFormData.mobile,
        nid_number: editFormData.nidNumber, email: editFormData.email || null,
        date_of_birth: editFormData.dateOfBirth, gender: editFormData.gender,
        photo_url: uploadedPhotoUrl, payment_info: paymentInfoPayload,
        address_details: editFormData.addressDetails, 
        educational_qualification: editFormData.educationalQualification,
        kitabi_qualification: editFormData.kitabiQualification,
        expertise_areas: editFormData.expertiseAreas, 
        notes: editFormData.notes, 
        is_active: editFormData.isActive,
    };
    
    updateTeacherMutation.mutate({ p_teacher_id: selectedTeacherForEdit.id, p_updates: updatesToSend }); 
  };
  
  const toggleTeacherStatus = (person: Teacher) => { setTeacherToToggleStatus(person); setIsToggleStatusAlertOpen(true);}; 
  const confirmToggleStatus = () => { if (!teacherToToggleStatus) return; const newStatus = !teacherToToggleStatus.isActive; updateTeacherMutation.mutate({ p_teacher_id: teacherToToggleStatus.id, p_updates: { is_active: newStatus } }); setIsToggleStatusAlertOpen(false); setTeacherToToggleStatus(null);}; 
  
  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => ( <div className="py-1"><p className="text-sm text-gray-500">{label}:</p><p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div> );

  const editModalTabs = selectedTeacherForEdit ? [ 
    { id: 'general', label: 'সাধারণ তথ্য', icon: <UserCircleIcon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            <Input label="নাম (বাংলা)" name="nameBn" value={editFormData.nameBn || ''} onChange={handleEditFormInputChange} error={editErrors.nameBn} required />
            <Input label="মোবাইল" name="mobile" value={editFormData.mobile || ''} onChange={handleEditFormInputChange} error={editErrors.mobile} required/>
            <Input label="NID নম্বর" name="nidNumber" value={editFormData.nidNumber || ''} onChange={handleEditFormInputChange} error={editErrors.nidNumber} required/>
            <Input label="ইমেইল (ঐচ্ছিক)" name="email" type="email" value={editFormData.email || ''} onChange={handleEditFormInputChange} error={editErrors.email}/>
             <CustomDatePicker id="editDateOfBirth" label="জন্ম তারিখ" value={editFormData.dateOfBirth} onChange={handleEditDateChange} error={editErrors.dateOfBirth} required disabled={updateTeacherMutation.isPending}/>
            <Select label="লিঙ্গ" name="gender" value={editFormData.gender || ''} onChange={handleEditFormInputChange} options={genderOptions} error={editErrors.gender} placeholderOption="লিঙ্গ নির্বাচন করুন" required disabled={updateTeacherMutation.isPending}/> 
        </div>
    )},
    { id: 'academic', label: 'একাডেমিক তথ্য', icon: <BookOpenIcon className="w-4 h-4"/>, content: (
         <div className="space-y-3 pt-2">
            <Select label="শিক্ষাগত যোগ্যতা (মারহালা)" name="educationalQualification" value={editFormData.educationalQualification || ''} onChange={handleEditFormInputChange} options={marhalaOptionsForSelect} error={editErrors.educationalQualification} placeholderOption="মারহালা নির্বাচন করুন" required disabled={isLoadingMarhalas}/>
            <MultiSelectGrid label="কিতাবী যোগ্যতা" options={kitabOptionsForMultiSelect} selectedValues={editFormData.kitabiQualification || []} onChange={handleEditKitabiQualificationChange} error={editErrors.kitabiQualification} gridCols={2} visibleRows={4} itemHeight={40} required wrapperClassName={isLoadingKitabs ? 'opacity-70' : ''}/>
        </div>
    )},
     { id: 'photoPayment', label: 'ছবি ও পেমেন্ট', icon: <CreditCardIcon className="w-4 h-4"/>, content: (
        <div className="space-y-3 pt-2">
            {editFormData.photoUrl && !editFormData.photoFile && !editFormData.removeCurrentPhoto && (
                <div className="mb-2"> <p className="text-xs text-gray-600 mb-1">বর্তমান ছবি:</p> <img src={editFormData.photoUrl} alt="শিক্ষকের ছবি" className="w-24 h-24 object-cover rounded border p-0.5" /> <Checkbox id="removeCurrentPhotoEdit" label="বর্তমান ছবি মুছে ফেলুন" checked={editFormData.removeCurrentPhoto || false} onChange={e => setEditFormData(prev => ({ ...prev, removeCurrentPhoto: e.target.checked, photoFile: e.target.checked ? null : prev.photoFile }))} wrapperClassName="mt-1"/> </div> 
            )}
            <FileUpload id="editTeacherPhoto" label="নতুন ছবি (ঐচ্ছিক)" onFileChange={handleEditPhotoFileChange} acceptedFileTypes="image/jpeg, image/png" fileNameDisplay={editFormData.photoFile?.name} error={editErrors.photoFile} />
            <Select label="পেমেন্টের ধরণ" name="paymentType" value={editFormData.paymentType || ''} onChange={handleEditFormInputChange} options={paymentTypeOptions} error={editErrors.paymentType} placeholderOption="ধরণ নির্বাচন করুন" required/>
            {editFormData.paymentType === 'mobile' && (<> <Input label="মোবাইল ব্যাংকিং সেবাদাতা" name="mobilePaymentProvider" value={editFormData.mobilePaymentProvider || ''} onChange={handleEditFormInputChange} error={editErrors.mobilePaymentProvider} required /><Input label="একাউন্ট নম্বর" name="mobilePaymentAccountNumber" type="tel" value={editFormData.mobilePaymentAccountNumber || ''} onChange={handleEditFormInputChange} error={editErrors.mobilePaymentAccountNumber} required /> </>)}
            {editFormData.paymentType === 'bank' && (<> <Input label="একাউন্টের নাম" name="bankAccountName" value={editFormData.bankAccountName || ''} onChange={handleEditFormInputChange} error={editErrors.bankAccountName} required /><Input label="একাউন্ট নম্বর" name="bankAccountNumber" value={editFormData.bankAccountNumber || ''} onChange={handleEditFormInputChange} error={editErrors.bankAccountNumber} required /><Input label="ব্যাংকের নাম" name="bankName" value={editFormData.bankName || ''} onChange={handleEditFormInputChange} error={editErrors.bankName} required /><Input label="ব্রাঞ্চের নাম" name="bankBranchName" value={editFormData.bankBranchName || ''} onChange={handleEditFormInputChange} error={editErrors.bankBranchName} required /> </>)}
        </div>
    )},
  ] : [];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"> <h2 className="text-3xl font-semibold text-gray-800">নিবন্ধিত শিক্ষক তালিকা</h2> <Button onClick={() => navigate('/teachers/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>নতুন নিবন্ধন</Button> </div> 
      <div className="sticky top-[calc(5rem+1px)] z-10 bg-white py-3 shadow rounded-lg mb-3"> <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1"> <Input placeholder="নাম, কোড, মোবাইল, NID বা ইমেইল দিয়ে খুঁজুন..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}} wrapperClassName="flex-grow w-full sm:w-auto mb-0" className="h-10"/> <Button variant="outline" onClick={() => setIsFilterSectionVisible(prev => !prev)} leftIcon={isFilterSectionVisible ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>} size="md" className="whitespace-nowrap self-end sm:self-center">ফিল্টার</Button> </div> </div>
      {isFilterSectionVisible && ( <Card bodyClassName="p-3 -mt-1"> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end"> 
      <Select label="স্ট্যাটাস" value={filterIsActive} onChange={(e) => setFilterIsActive(e.target.value)} options={TEACHER_STATUS_OPTIONS} wrapperClassName="mb-0 text-xs"/>  
      </div> </Card>)}
      <Card bodyClassName="p-0">
        <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr> <SortableHeader field="teacher_code" label="কোড" currentSortField={sortField} currentSortOrder={sortOrder} onSort={handleSort}/> <SortableHeader field="name_bn" label="নাম" currentSortField={sortField} currentSortOrder={sortOrder} onSort={handleSort}/> <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">মোবাইল</th> <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">NID</th> <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">শিক্ষাগত যোগ্যতা</th> <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th> <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">কার্যক্রম</th> </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && Array.from({length: itemsPerPage}).map((_, idx) => ( <tr key={`skel-${idx}`} className="animate-pulse"> {Array.from({length: 7}).map((_, cellIdx) => <td key={cellIdx} className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>)} </tr> ))}
            {!isLoading && teacherList.map((person) => (<tr key={person.id} className="hover:bg-gray-50"> <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{person.teacherCode}</td> <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{person.nameBn}</td> <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{person.mobile}</td> <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{person.nidNumber}</td> <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{getMarhalaName(person.educationalQualification)}</td> <td className="px-3 py-4 whitespace-nowrap text-center"><Switch id={`status-${person.id}`} checked={person.isActive} onChange={() => toggleTeacherStatus(person)} size="sm" srOnlyLabel={`${person.nameBn} স্ট্যাটাস`}/></td> <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center space-x-1"> <Button variant="ghost" size="sm" onClick={() => handleViewClick(person)} className="p-1"><EyeIcon className="w-4 h-4"/></Button> <Button variant="ghost" size="sm" onClick={() => handleEditClick(person)} className="p-1"><PencilSquareIcon className="w-4 h-4"/></Button></td></tr>))}
            {!isLoading && teacherList.length === 0 && (<tr><td colSpan={7} className="p-6 text-center text-gray-500">কোনো নিবন্ধিত শিক্ষক পাওয়া যায়নি।</td></tr>)} 
          </tbody>
        </table></div>
        {totalPages > 0 && (<div className="py-2 px-3 flex items-center justify-between border-t"><div><span className="text-sm text-gray-700 mr-2">প্রতি পৃষ্ঠায়:</span><Select value={itemsPerPage.toString()} onChange={e => setItemsPerPage(Number(e.target.value))} options={[{value:'10', label:'১০'}, {value:'20', label:'২০'}, {value:'50', label:'৫০'}]} wrapperClassName="mb-0 inline-block w-20" className="h-8 text-xs"/></div><div><Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm">পূর্ববর্তী</Button><span className="text-sm text-gray-700 mx-2">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span><Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm">পরবর্তী</Button></div></div>)}
      </Card>
      {isViewModalOpen && selectedTeacherForView && ( <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`বিবরণ: ${selectedTeacherForView.nameBn}`} size="2xl"> <div className="space-y-2 max-h-[75vh] overflow-y-auto p-1"> 
        {selectedTeacherForView.photoUrl && <img src={selectedTeacherForView.photoUrl} alt="শিক্ষকের ছবি" className="w-24 h-24 object-cover rounded-md border mx-auto mb-2"/>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5"> 
            <ViewDetailItem label="কোড" value={selectedTeacherForView.teacherCode} /> 
            <ViewDetailItem label="নাম (বাংলা)" value={selectedTeacherForView.nameBn} /> 
            <ViewDetailItem label="মোবাইল" value={selectedTeacherForView.mobile} /> 
            <ViewDetailItem label="NID" value={selectedTeacherForView.nidNumber} /> 
            <ViewDetailItem label="জন্ম তারিখ" value={formatDate(selectedTeacherForView.dateOfBirth)} />
            <ViewDetailItem label="লিঙ্গ" value={selectedTeacherForView.gender === 'male' ? 'পুরুষ' : selectedTeacherForView.gender === 'female' ? 'মহিলা' : 'অন্যান্য'} />
            <ViewDetailItem label="ইমেইল" value={selectedTeacherForView.email} /> 
            <ViewDetailItem label="শিক্ষাগত যোগ্যতা" value={getMarhalaName(selectedTeacherForView.educationalQualification)} /> 
            <ViewDetailItem label="স্ট্যাটাস" value={selectedTeacherForView.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} /> 
            <ViewDetailItem label="নিবন্ধনের তারিখ" value={formatDateTime(selectedTeacherForView.createdAt)} /> 
        </div>
        <ViewDetailItem label="কিতাবী যোগ্যতা" value={getKitabNames(selectedTeacherForView.kitabiQualification)} /> 
        {selectedTeacherForView.paymentInfo && (<>
            <h4 className="text-sm font-semibold text-gray-600 border-t pt-2 mt-2">পেমেন্টের তথ্য</h4>
            <ViewDetailItem label="পেমেন্টের ধরণ" value={selectedTeacherForView.paymentInfo.type === 'mobile' ? 'মোবাইল ব্যাংকিং' : 'ব্যাংক একাউন্ট'} />
            {selectedTeacherForView.paymentInfo.type === 'mobile' && (<>
                <ViewDetailItem label="সেবাদাতা" value={selectedTeacherForView.paymentInfo.provider} />
                <ViewDetailItem label="একাউন্ট নম্বর" value={selectedTeacherForView.paymentInfo.account_number} />
            </>)}
            {selectedTeacherForView.paymentInfo.type === 'bank' && (<>
                <ViewDetailItem label="একাউন্টের নাম" value={selectedTeacherForView.paymentInfo.account_name} />
                <ViewDetailItem label="একাউন্ট নম্বর" value={selectedTeacherForView.paymentInfo.account_number} />
                <ViewDetailItem label="ব্যাংকের নাম" value={selectedTeacherForView.paymentInfo.bank_name} />
                <ViewDetailItem label="ব্রাঞ্চের নাম" value={selectedTeacherForView.paymentInfo.branch_name} />
            </>)}
        </>)}
      </div> </Modal> )} 
      {isEditModalOpen && selectedTeacherForEdit && editFormData && editModalTabs && ( <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`সম্পাদনা: ${selectedTeacherForEdit.nameBn}`} size="2xl" footer={<><Button variant="secondary" onClick={() => {setIsEditModalOpen(false); setEditErrors({});}}>বাতিল</Button><Button onClick={handleSaveChanges} disabled={updateTeacherMutation.isPending || isLoadingMarhalas || isLoadingKitabs}>{updateTeacherMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</Button></>}> 
        <Tabs tabs={editModalTabs} activeTabId={editActiveTab} onTabChange={setEditActiveTab} />
        {editErrors.apiError && <p className="text-sm text-red-500 pt-2 text-center">{editErrors.apiError}</p>}
      </Modal>)}
      {isToggleStatusAlertOpen && teacherToToggleStatus && (<AlertDialog isOpen={isToggleStatusAlertOpen} onClose={() => setIsToggleStatusAlertOpen(false)} onConfirm={confirmToggleStatus} title="স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ" description={`আপনি কি "${teacherToToggleStatus.nameBn}" এর স্ট্যাটাস (${teacherToToggleStatus.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}) পরিবর্তন করতে চান?`} confirmButtonText={updateTeacherMutation.isPending ? "প্রসেসিং..." : "হ্যাঁ, পরিবর্তন করুন"} confirmButtonVariant={teacherToToggleStatus.isActive ? "danger" : "primary"} />)} 
    </div>
  );
};
export default TeacherListPage;
