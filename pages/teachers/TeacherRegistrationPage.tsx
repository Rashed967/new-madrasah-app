
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { FileUpload } from '../../components/ui/FileUpload';
import { Stepper } from '../../components/ui/Stepper';
import { Textarea } from '../../components/ui/Textarea';
import { TeacherDbRow, Marhala, Kitab, SelectOption, DistrictOption, MarhalaApiResponse, KitabApiResponse, GenderType, PaymentInfo, TeacherAddress, Division } from '../../types'; 
import { UserPlusIcon, ArrowPathIcon, UserCircleIcon, BookOpenIcon, CreditCardIcon, MapPinIcon, PaperClipIcon, CheckCircleIcon as ReviewIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, DIVISIONS_BD } from '../../constants';
import type { PostgrestError } from '@supabase/supabase-js';


interface TeacherFormData { 
  nameBn: string;
  nameEn?: string;
  mobile: string;
  nidNumber: string; 
  email?: string;
  dateOfBirth: string;
  gender: GenderType | '';
  photoFile?: File | null;
  
  addressDetails?: Partial<TeacherAddress>;

  educationalQualification: string; 
  kitabiQualification: string[]; 
  expertiseAreas?: string; // Comma-separated for textarea
  notes?: string;

  paymentType: 'mobile' | 'bank' | '';
  mobilePaymentProvider?: string;
  mobilePaymentAccountNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranchName?: string;
}

const initialFormData: TeacherFormData = { 
  nameBn: '',
  nameEn: '',
  mobile: '',
  nidNumber: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  photoFile: null,
  addressDetails: { division: '', district: '', upazila: '', village: '', postOffice: '', holding: '' },
  educationalQualification: '',
  kitabiQualification: [],
  expertiseAreas: '',
  notes: '',
  paymentType: '',
  mobilePaymentProvider: '',
  mobilePaymentAccountNumber: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
  bankBranchName: '',
};

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

const genderOptions: SelectOption[] = [ { value: 'male', label: 'পুরুষ' }, { value: 'female', label: 'মহিলা' }, { value: 'other', label: 'অন্যান্য' }];
const paymentTypeOptions: SelectOption[] = [ { value: 'mobile', label: 'মোবাইল ব্যাংকিং' }, { value: 'bank', label: 'ব্যাংক একাউন্ট' }];
const mobilePaymentProviderOptions: SelectOption[] = [
    { value: 'bkash', label: 'বিকাশ' },
    { value: 'nagad', label: 'নগদ' },
    { value: 'rocket', label: 'রকেট' },
];


const TeacherRegistrationPage: React.FC = () => { 
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<TeacherFormData>(initialFormData); 
  const [errors, setErrors] = useState<any>({});
  
  const [availableDistricts, setAvailableDistricts] = useState<SelectOption[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<SelectOption[]>([]);


  const { data: marhalas = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForTeacherReg'], 
    queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order'); if (error) throw error; return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend);},
  });

  const { data: kitabs = [], isLoading: isLoadingKitabs, error: kitabsError } = useQuery<Kitab[], Error>({
    queryKey: ['allKitabsForTeacherReg'], 
    queryFn: async () => { const { data, error } = await supabase.from('kitabs').select('*').order('name_bn'); if (error) throw error; return (data as KitabApiResponse[]).map(mapApiKitabToFrontend);},
  });
  
  useEffect(() => { if (marhalasError) addToast(`মারহালা তালিকা আনতে সমস্যা: ${marhalasError.message}`, 'error'); if (kitabsError) addToast(`কিতাব তালিকা আনতে সমস্যা: ${kitabsError.message}`, 'error'); }, [marhalasError, kitabsError, addToast]);

  const marhalaOptions: SelectOption[] = useMemo(() => marhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` })), [marhalas]);
  const kitabOptions: DistrictOption[] = useMemo(() => kitabs.map(k => ({ value: k.id, label: `${k.nameBn} (কোড: ${k.kitabCode})` })), [kitabs]);
  const divisionOptions: SelectOption[] = useMemo(() => DIVISIONS_BD.map(div => ({ value: div.value, label: div.label })),[]);

  useEffect(() => {
    if (formData.addressDetails?.division) {
      const selectedDivisionData = DIVISIONS_BD.find(div => div.value === formData.addressDetails!.division);
      setAvailableDistricts(selectedDivisionData ? selectedDivisionData.districts.map(d => ({value: d.value, label: d.label})) : []);
      if (!selectedDivisionData?.districts.some(d => d.value === formData.addressDetails?.district)) {
        setFormData(prev => ({...prev, addressDetails: {...prev.addressDetails!, district: '', upazila: ''}}));
        setAvailableUpazilas([]);
      }
    } else {
      setAvailableDistricts([]);
      setAvailableUpazilas([]);
    }
  }, [formData.addressDetails?.division]);

  useEffect(() => {
    if (formData.addressDetails?.district) {
      const selectedDivisionData = DIVISIONS_BD.find(div => div.value === formData.addressDetails!.division);
      const selectedDistrictData = selectedDivisionData?.districts.find(d => d.value === formData.addressDetails!.district);
      setAvailableUpazilas(selectedDistrictData ? selectedDistrictData.upazilas.map(u => ({value: u.value, label: u.label})) : []);
       if (!selectedDistrictData?.upazilas.some(u => u.value === formData.addressDetails?.upazila)) {
        setFormData(prev => ({...prev, addressDetails: {...prev.addressDetails!, upazila: ''}}));
      }
    } else {
      setAvailableUpazilas([]);
    }
  }, [formData.addressDetails?.district, formData.addressDetails?.division]);


  const steps = [
    { id: 'basicInfo', label: 'মৌলিক তথ্য', icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: 'addressOther', label: 'ঠিকানা ও অন্যান্য', icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'qualifications', label: 'যোগ্যতা', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'payment', label: 'পেমেন্ট তথ্য', icon: <CreditCardIcon className="w-5 h-5" /> },
    { id: 'review', label: 'পর্যালোচনা', icon: <ReviewIcon className="w-5 h-5" /> }
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, section?: 'addressDetails', field?: keyof TeacherAddress) => {
    const { name, value } = e.target;
    if (section === 'addressDetails' && field) {
        setFormData(prev => ({ ...prev, addressDetails: { ...(prev.addressDetails || {}), [field]: value } }));
        const errorKey = `addressDetails.${field}`;
        if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value as any }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'paymentType') { 
        setFormData(prev => ({
            ...prev, mobilePaymentProvider: '', mobilePaymentAccountNumber: '',
            bankAccountName: '', bankAccountNumber: '', bankName: '', bankBranchName: ''
        }));
    }
  };

  const handleDateChange = (dateString: string) => { setFormData(prev => ({...prev, dateOfBirth: dateString })); if(errors.dateOfBirth) setErrors((prev:any) => ({...prev, dateOfBirth: undefined})); };
  const handlePhotoFileChange = (file: File | null) => { setFormData(prev => ({ ...prev, photoFile: file })); if (errors.photoFile) setErrors((prev: any) => ({ ...prev, photoFile: undefined })); };
  const handleKitabiQualificationChange = (selectedKitabIds: string[]) => { setFormData(prev => ({ ...prev, kitabiQualification: selectedKitabIds })); if (errors.kitabiQualification) setErrors(prev => ({ ...prev, kitabiQualification: undefined })); };

  const validateStep = (stepIndex: number): boolean => {
    const newStepErrors: any = {};
    const stepId = steps[stepIndex].id;

    if (stepId === 'basicInfo') {
        if (!formData.nameBn?.trim()) newStepErrors.nameBn = 'বাংলা নাম আবশ্যক';
        if (!formData.mobile?.trim()) newStepErrors.mobile = 'মোবাইল নম্বর আবশ্যক';
        else if (!/^(01[3-9]\d{8})$/.test(formData.mobile.trim())) newStepErrors.mobile = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
        if (!formData.nidNumber?.trim()) newStepErrors.nidNumber = 'NID নম্বর আবশ্যক';
        else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(formData.nidNumber.trim())) newStepErrors.nidNumber = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)';
        if (!formData.dateOfBirth) newStepErrors.dateOfBirth = 'জন্ম তারিখ আবশ্যক';
        if (!formData.gender) newStepErrors.gender = 'লিঙ্গ নির্বাচন করুন';
        if (formData.email && formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newStepErrors.email = 'সঠিক ইমেইল ঠিকানা দিন';
        if (formData.photoFile) {
            if (formData.photoFile.size > 1 * 1024 * 1024) newStepErrors.photoFile = 'ছবির ফাইল সাইজ সর্বোচ্চ ১ মেগাবাইট।';
            else if (!['image/jpeg', 'image/png'].includes(formData.photoFile.type)) newStepErrors.photoFile = 'ছবি JPG/PNG ফরম্যাটে হতে হবে।';
        }
    } else if (stepId === 'addressOther') {
        // Address fields are optional at the RPC level for p_address_details if the whole object is null.
    } else if (stepId === 'qualifications') {
        if (!formData.educationalQualification) newStepErrors.educationalQualification = 'শিক্ষাগত যোগ্যতা (মারহালা) নির্বাচন করুন';
        if (formData.kitabiQualification.length === 0) newStepErrors.kitabiQualification = 'অন্তত একটি কিতাবী যোগ্যতা নির্বাচন করুন';
    } else if (stepId === 'payment') {
        if (!formData.paymentType) newStepErrors.paymentType = 'পেমেন্টের ধরণ নির্বাচন করুন।';
        else if (formData.paymentType === 'mobile') {
            if (!formData.mobilePaymentProvider?.trim()) newStepErrors.mobilePaymentProvider = 'মোবাইল ব্যাংকিং সেবাদাতার নাম আবশ্যক।';
            if (!formData.mobilePaymentAccountNumber?.trim()) newStepErrors.mobilePaymentAccountNumber = 'একাউন্ট নম্বর আবশ্যক।';
            else if (!/^(01[3-9]\d{8})$/.test(formData.mobilePaymentAccountNumber.trim())) newStepErrors.mobilePaymentAccountNumber = 'সঠিক মোবাইল একাউন্ট নম্বর দিন।';
        } else if (formData.paymentType === 'bank') {
            if (!formData.bankAccountName?.trim()) newStepErrors.bankAccountName = 'একাউন্টের নাম আবশ্যক।';
            if (!formData.bankAccountNumber?.trim()) newStepErrors.bankAccountNumber = 'একাউন্ট নম্বর আবশ্যক।';
            if (!formData.bankName?.trim()) newStepErrors.bankName = 'ব্যাংকের নাম আবশ্যক।';
            if (!formData.bankBranchName?.trim()) newStepErrors.bankBranchName = 'ব্রাঞ্চের নাম আবশ্যক।';
        }
    }
    
    setErrors(prev => ({ ...prev, ...newStepErrors }));
    if (Object.keys(newStepErrors).length > 0) {
        const firstErrorKey = Object.keys(newStepErrors)[0];
        const el = document.getElementsByName(firstErrorKey)[0] || document.getElementById(firstErrorKey);
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(newStepErrors).length === 0;
  };
  
  const handleNextStep = () => { if (validateStep(currentStep)) { setCompletedSteps(prev => new Set(prev).add(currentStep)); if (currentStep < steps.length - 1) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); } } else { addToast('এই ধাপের কিছু তথ্য সঠিক নয়। অনুগ্রহ করে சரி করুন।', 'error'); } };
  const handlePreviousStep = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); }};
  const handleStepClick = (index: number) => { if (index === currentStep) return; if (index < currentStep || completedSteps.has(index) || (index === currentStep + 1 && validateStep(currentStep))) { setCurrentStep(index); window.scrollTo(0, 0); } else if (index > currentStep && validateStep(currentStep)) { setCompletedSteps(prev => new Set(prev).add(currentStep)); setCurrentStep(index); window.scrollTo(0,0); } else { addToast('অনুগ্রহ করে বর্তমান ধাপের তথ্যগুলো সঠিক ভাবে পূরণ করুন।', 'warning'); }};

  const createTeacherMutation = useMutation({ 
    mutationFn: async (teacherPayload: any) => { const { data, error } = await supabase.rpc('create_teacher', teacherPayload); if (error) throw error; return data; },
    onSuccess: (newTeacherData) => { addToast(`"${(newTeacherData as TeacherDbRow).name_bn}" (কোড: ${(newTeacherData as TeacherDbRow).teacher_code}) সফলভাবে নিবন্ধিত হয়েছেন!`, 'success'); queryClient.invalidateQueries({ queryKey: ['teachers_list'] }); navigate('/teachers/list'); },
    onError: (error: PostgrestError | Error) => { 
        let userMessage = `নিবন্ধনে সমস্যা হয়েছে: ${error.message}`; 
        const fieldErrorsUpdate: any = { apiError: userMessage }; 
        if (error && typeof error === 'object' && 'code' in error) { 
            const pgError = error as PostgrestError; 
            if (pgError.code === '23505') { 
                if (pgError.message.includes('mobile')) fieldErrorsUpdate.mobile = 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে।'; 
                else if (pgError.message.includes('nid_number')) fieldErrorsUpdate.nidNumber = 'এই NID নম্বর দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে।'; 
                else if (pgError.message.includes('email')) fieldErrorsUpdate.email = 'এই ইমেইল দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে।'; 
                userMessage = fieldErrorsUpdate.mobile || fieldErrorsUpdate.nidNumber || fieldErrorsUpdate.email || userMessage; 
                fieldErrorsUpdate.apiError = undefined; setCurrentStep(0); 
            } else if (pgError.code === '23503') { 
                if (pgError.message.includes('educational_qualification')) {
                    fieldErrorsUpdate.educationalQualification = 'নির্বাচিত মারহালাটি সঠিক নয়।'; 
                    setCurrentStep(2);
                } else if (pgError.message.includes('kitabi_qualification')) {
                    fieldErrorsUpdate.kitabiQualification = 'নির্বাচিত কিতাবগুলোর মধ্যে কোনোটি সঠিক নয়।'; 
                    setCurrentStep(2);
                }
                if (fieldErrorsUpdate.educationalQualification || fieldErrorsUpdate.kitabiQualification) {
                    userMessage = fieldErrorsUpdate.educationalQualification || fieldErrorsUpdate.kitabiQualification || userMessage;
                    fieldErrorsUpdate.apiError = undefined;
                }
            } 
        } 
        setErrors(prev => ({ ...prev, ...fieldErrorsUpdate })); 
        addToast(userMessage, 'error', 7000); 
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let allValid = true;
    for (let i = 0; i < steps.length -1; i++){ // Validate all steps except review step itself
        if(!validateStep(i)) { allValid = false; }
    }
    if (!allValid) { addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে প্রতিটি ধাপ চেক করুন।', 'error'); 
      for (let i = 0; i < steps.length - 1; i++) { if(!validateStep(i)){ setCurrentStep(i); const newCompleted = new Set<number>(); completedSteps.forEach(cs => { if(cs < i) newCompleted.add(cs); }); setCompletedSteps(newCompleted); window.scrollTo(0,0); break; } else { setCompletedSteps(prev => new Set(prev).add(i)); }}
      return; 
    }
    setErrors(prev => ({ ...prev, apiError: undefined }));

    let uploadedPhotoUrl: string | undefined = undefined;
    if (formData.photoFile) { try { if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration missing."); uploadedPhotoUrl = await uploadToCloudinary(formData.photoFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET); } catch (uploadError: any) { setErrors(prev => ({ ...prev, photoFile: uploadError.message, apiError: uploadError.message })); addToast(`ছবি আপলোডে সমস্যা: ${uploadError.message}`, 'error'); setCurrentStep(0); return; } }
    
    let paymentInfoPayload: PaymentInfo | null = null;
    if(formData.paymentType === 'mobile') { paymentInfoPayload = { type: 'mobile', provider: formData.mobilePaymentProvider!, account_number: formData.mobilePaymentAccountNumber! }; } 
    else if (formData.paymentType === 'bank') { paymentInfoPayload = { type: 'bank', account_name: formData.bankAccountName!, account_number: formData.bankAccountNumber!, bank_name: formData.bankName!, branch_name: formData.bankBranchName! }; }
    
    const addressToSubmit = (formData.addressDetails && Object.values(formData.addressDetails).some(v => v && v.trim() !== '')) ? formData.addressDetails : null;
    const expertiseArray = formData.expertiseAreas?.split(',').map(s => s.trim()).filter(s => s) || null;

    createTeacherMutation.mutate({ 
        p_name_bn: formData.nameBn, p_name_en: formData.nameEn || null, p_mobile: formData.mobile,
        p_nid_number: formData.nidNumber, p_email: formData.email || null, p_date_of_birth: formData.dateOfBirth,
        p_gender: formData.gender, p_photo_url: uploadedPhotoUrl, p_payment_info: paymentInfoPayload,
        p_address_details: addressToSubmit, 
        p_educational_qualification_marhala_id: formData.educationalQualification,
        p_kitabi_qualification_kitab_ids: formData.kitabiQualification,
        p_expertise_areas: expertiseArray, p_notes: formData.notes || null
    });
  };
  
  const ReviewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="py-1.5 grid grid-cols-3 gap-2">
      <p className="text-sm text-gray-600 col-span-1">{label}:</p>
      <p className="text-sm font-medium text-gray-900 col-span-2 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
    </div>
  );

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    switch (stepId) {
      case 'basicInfo':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0"> <h3 className="text-lg font-medium text-gray-700 mb-4">মৌলিক তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <Input label="নাম (বাংলা)" name="nameBn" value={formData.nameBn} onChange={handleInputChange} error={errors.nameBn} required />
              <Input label="নাম (ইংরেজি) (ঐচ্ছিক)" name="nameEn" value={formData.nameEn || ''} onChange={handleInputChange} error={errors.nameEn} />
              <Input label="মোবাইল নম্বর" name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} error={errors.mobile} required placeholder="01XXXXXXXXX" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 mt-4">
              <Input label="NID নম্বর" name="nidNumber" value={formData.nidNumber} onChange={handleInputChange} error={errors.nidNumber} placeholder="১০, ১৩ বা ১৭ সংখ্যার" required />
              <Input label="ইমেইল (ঐচ্ছিক)" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} error={errors.email} />
              <CustomDatePicker id="dateOfBirth" label="জন্ম তারিখ" value={formData.dateOfBirth} onChange={handleDateChange} error={errors.dateOfBirth} required placeholder="YYYY-MM-DD" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 mt-4">
              <Select label="লিঙ্গ" name="gender" value={formData.gender} onChange={handleInputChange} options={genderOptions} error={errors.gender} placeholderOption="লিঙ্গ নির্বাচন করুন" required />
              <FileUpload id="teacherPhoto" label="ছবি (ঐচ্ছিক)" onFileChange={handlePhotoFileChange} acceptedFileTypes="image/jpeg, image/png" fileNameDisplay={formData.photoFile?.name} error={errors.photoFile} wrapperClassName="md:col-span-2" />
            </div>
          </Card>
        );
      case 'addressOther':
        return (
           <Card className="border-none shadow-none" bodyClassName="p-0"> <h3 className="text-lg font-medium text-gray-700 mb-4">ঠিকানা ও অন্যান্য তথ্য (ঐচ্ছিক)</h3>
             <fieldset className="border p-3 rounded-md mb-4">
                <legend className="text-sm font-medium text-gray-600 px-1">বর্তমান ঠিকানা</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 mt-1">
                    <Select label="বিভাগ" value={formData.addressDetails?.division || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'division')} options={divisionOptions} error={errors['addressDetails.division']} placeholderOption="বিভাগ নির্বাচন"/>
                    <Select label="জেলা" value={formData.addressDetails?.district || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'district')} options={availableDistricts} error={errors['addressDetails.district']} placeholderOption="জেলা নির্বাচন" disabled={!formData.addressDetails?.division || availableDistricts.length === 0}/>
                    <Select label="উপজেলা/থানা" value={formData.addressDetails?.upazila || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'upazila')} options={availableUpazilas} error={errors['addressDetails.upazila']} placeholderOption="উপজেলা নির্বাচন" disabled={!formData.addressDetails?.district || availableUpazilas.length === 0}/>
                    <Input label="পোস্ট অফিস" value={formData.addressDetails?.postOffice || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'postOffice')} error={errors['addressDetails.postOffice']} wrapperClassName="mt-4"/>
                    <Input label="গ্রাম/মহল্লা" value={formData.addressDetails?.village || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'village')} error={errors['addressDetails.village']} wrapperClassName="mt-4"/>
                    <Input label="হোল্ডিং নম্বর" value={formData.addressDetails?.holding || ''} onChange={(e) => handleInputChange(e, 'addressDetails', 'holding')} error={errors['addressDetails.holding']} wrapperClassName="mt-4"/>
                </div>
             </fieldset>
             <Textarea label="বিশেষ দক্ষতা (একাধিক হলে কমা দিয়ে লিখুন)" name="expertiseAreas" value={formData.expertiseAreas || ''} onChange={handleInputChange} rows={2} placeholder="যেমন: আরবি ব্যকরণ, হাদিস গবেষণা"/>
             <Textarea label="অন্যান্য নোট" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} placeholder="প্রয়োজনীয় অন্য কোনো তথ্য"/>
           </Card>
        );
      case 'qualifications':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0"> <h3 className="text-lg font-medium text-gray-700 mb-4">শিক্ষাগত ও কিতাবী যোগ্যতা</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Select label="শিক্ষাগত যোগ্যতা (সর্বোচ্চ মারহালা)" name="educationalQualification" value={formData.educationalQualification} onChange={handleInputChange} options={marhalaOptions} error={errors.educationalQualification} placeholderOption="মারহালা নির্বাচন করুন" required disabled={isLoadingMarhalas}/>
            </div>
            <div className="mt-4">
              <MultiSelectGrid label="কিতাবী যোগ্যতা (একাধিক নির্বাচন করুন)" options={kitabOptions} selectedValues={formData.kitabiQualification} onChange={handleKitabiQualificationChange} error={errors.kitabiQualification} gridCols={3} visibleRows={4} itemHeight={40} required wrapperClassName={isLoadingKitabs ? 'opacity-70' : ''}/>
            </div>
          </Card>
        );
      case 'payment':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0"> <h3 className="text-lg font-medium text-gray-700 mb-4">পেমেন্টের তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <Select label="পেমেন্টের ধরণ" name="paymentType" value={formData.paymentType} onChange={handleInputChange} options={paymentTypeOptions} error={errors.paymentType} placeholderOption="ধরণ নির্বাচন করুন" required/>
                {formData.paymentType === 'mobile' && (<>
                    <Select label="মোবাইল ব্যাংকিং সেবাদাতা" name="mobilePaymentProvider" value={formData.mobilePaymentProvider || ''} onChange={handleInputChange} options={mobilePaymentProviderOptions} error={errors.mobilePaymentProvider} placeholderOption="সেবাদাতা নির্বাচন করুন" required/>
                    <Input label="একাউন্ট নম্বর" name="mobilePaymentAccountNumber" type="tel" value={formData.mobilePaymentAccountNumber || ''} onChange={handleInputChange} error={errors.mobilePaymentAccountNumber} placeholder="01XXXXXXXXX" required/>
                </>)}
                {formData.paymentType === 'bank' && (<>
                   <Input label="একাউন্টের নাম" name="bankAccountName" value={formData.bankAccountName || ''} onChange={handleInputChange} error={errors.bankAccountName} required />
                   <Input label="একাউন্ট নম্বর" name="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleInputChange} error={errors.bankAccountNumber} required />
                   <Input label="ব্যাংকের নাম" name="bankName" value={formData.bankName || ''} onChange={handleInputChange} error={errors.bankName} required />
                   <Input label="ব্রাঞ্চের নাম" name="bankBranchName" value={formData.bankBranchName || ''} onChange={handleInputChange} error={errors.bankBranchName} required />
                </>)}
            </div>
          </Card>
        );
      case 'review':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0"> <h3 className="text-xl font-semibold text-gray-700 mb-4">পর্যালোচনা ও জমা দিন</h3>
            <div className="space-y-2 bg-gray-50 p-3 rounded-md shadow-inner max-h-[60vh] overflow-y-auto">
                <h4 className="text-md font-semibold text-gray-600 border-b pb-1">মৌলিক তথ্য</h4>
                <ReviewDetailItem label="নাম (বাংলা)" value={formData.nameBn} />
                <ReviewDetailItem label="নাম (ইংরেজি)" value={formData.nameEn} />
                <ReviewDetailItem label="মোবাইল" value={formData.mobile} />
                <ReviewDetailItem label="NID" value={formData.nidNumber} />
                <ReviewDetailItem label="ইমেইল" value={formData.email} />
                <ReviewDetailItem label="জন্ম তারিখ" value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('bn-BD') : 'N/A'} />
                <ReviewDetailItem label="লিঙ্গ" value={genderOptions.find(o => o.value === formData.gender)?.label} />
                <ReviewDetailItem label="ছবি" value={formData.photoFile?.name || (formData.photoFile ? 'ফাইল নির্বাচিত' : 'নেই')} />
                
                <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">ঠিকানা ও অন্যান্য</h4>
                <ReviewDetailItem label="বিভাগ" value={formData.addressDetails?.division} />
                <ReviewDetailItem label="জেলা" value={formData.addressDetails?.district} />
                <ReviewDetailItem label="উপজেলা" value={formData.addressDetails?.upazila} />
                <ReviewDetailItem label="পোস্ট অফিস" value={formData.addressDetails?.postOffice} />
                <ReviewDetailItem label="গ্রাম/মহল্লা" value={formData.addressDetails?.village} />
                <ReviewDetailItem label="হোল্ডিং" value={formData.addressDetails?.holding} />
                <ReviewDetailItem label="বিশেষ দক্ষতা" value={formData.expertiseAreas || 'নেই'} />
                <ReviewDetailItem label="নোট" value={formData.notes || 'নেই'} />


                <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">যোগ্যতা</h4>
                <ReviewDetailItem label="শিক্ষাগত যোগ্যতা" value={marhalaOptions.find(o => o.value === formData.educationalQualification)?.label} />
                <ReviewDetailItem label="কিতাবী যোগ্যতা" value={formData.kitabiQualification.map(id => kitabOptions.find(k=>k.value === id)?.label).join(', ') || 'নেই'} />
            
                <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">পেমেন্টের তথ্য</h4>
                <ReviewDetailItem label="পেমেন্টের ধরণ" value={paymentTypeOptions.find(o=> o.value === formData.paymentType)?.label} />
                {formData.paymentType === 'mobile' && (<>
                    <ReviewDetailItem label="সেবাদাতা" value={mobilePaymentProviderOptions.find(o => o.value === formData.mobilePaymentProvider)?.label || formData.mobilePaymentProvider} />
                    <ReviewDetailItem label="একাউন্ট নম্বর" value={formData.mobilePaymentAccountNumber} />
                </>)}
                 {formData.paymentType === 'bank' && (<>
                    <ReviewDetailItem label="একাউন্টের নাম" value={formData.bankAccountName} />
                    <ReviewDetailItem label="একাউন্ট নম্বর" value={formData.bankAccountNumber} />
                    <ReviewDetailItem label="ব্যাংকের নাম" value={formData.bankName} />
                    <ReviewDetailItem label="ব্রাঞ্চের নাম" value={formData.bankBranchName} />
                </>)}
                {errors.apiError && <p className="text-sm text-red-500 mt-2 col-span-full">{errors.apiError}</p>}
            </div>
          </Card>
        );
      default: return null;
    }
  };
  
   const isLoadingData = isLoadingMarhalas || isLoadingKitabs;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নতুন শিক্ষক নিবন্ধন</h2> 
      <Card className="shadow-xl">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps}/>
        <div className="p-6 min-h-[350px]"> 
          {isLoadingData ? <div className="flex items-center justify-center p-10"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-2"/> ডেটা লোড হচ্ছে...</div> : renderStepContent()}
        </div>
      </Card>
      <div className="flex justify-between items-center mt-8">
        <Button type="button" variant="secondary" onClick={handlePreviousStep} disabled={currentStep === 0 || createTeacherMutation.isPending} leftIcon={<ChevronLeftIcon className="w-5 h-5"/>}>পূর্ববর্তী ধাপ</Button>
        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNextStep} rightIcon={<ChevronRightIcon className="w-5 h-5"/>} disabled={createTeacherMutation.isPending || isLoadingData}>পরবর্তী ধাপ</Button>
        ) : (
          <Button type="button" onClick={handleSubmit} leftIcon={<UserPlusIcon className="w-5 h-5"/>} disabled={createTeacherMutation.isPending || isLoadingData}>
            {createTeacherMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন'}
          </Button>
        )}
      </div>
      <div className="flex justify-center mt-4">
          <Button type="button" variant="ghost" onClick={() => { setFormData(initialFormData); setCurrentStep(0); setCompletedSteps(new Set()); setErrors({}); window.scrollTo(0, 0); }} disabled={createTeacherMutation.isPending || isLoadingData}>ফর্ম রিসেট করুন</Button>
      </div>
    </div>
  );
};

export default TeacherRegistrationPage;
