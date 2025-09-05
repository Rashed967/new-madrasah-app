
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker'; // Added CustomDatePicker
import { Exam, ExamFeeDetail, Marhala, MarhalaApiResponse, SelectOption } from '../../types';
import { PlusCircleIcon, TrashIcon, BuildingOffice2Icon, ListBulletIcon, CheckCircleIcon as ReviewIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, CurrencyBangladeshiIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
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
    createdAt: apiMarhala.created_at,
});


// Form-specific type for ExamFeeDetail allowing string for numeric inputs
type ExamFeeDetailForm = {
  marhalaId: string;
  marhalaName?: string; // For display purposes in the form
  startingRollNumber: number | string;
  regularFee: number | string;
  irregularFee: number | string;
  lateRegularFee: number | string;
  lateIrregularFee: number | string;
};

const initialGeneralInfo = {
  name: '',
  registrationDeadline: '',
  startingRegistrationNumber: '',
  registrationFeeRegular: '',
  registrationFeeIrregular: '',
  lateRegistrationFeeRegular: '',
  lateRegistrationFeeIrregular: '',
};


const ExamRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [generalInfo, setGeneralInfo] = useState(initialGeneralInfo);
  const [selectedMarhalaFees, setSelectedMarhalaFees] = useState<ExamFeeDetailForm[]>([]);
  
  const [errors, setErrors] = useState<any>({});

  const { data: allMarhalasFromApi = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForExamReg'],
    queryFn: async () => {
        const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order', { ascending: true });
        if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।');
        return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (marhalasError) {
        addToast(marhalasError.message, 'error');
    }
  }, [marhalasError, addToast]);

  const marhalaOptions: SelectOption[] = useMemo(() => 
    allMarhalasFromApi
      .filter(m => !selectedMarhalaFees.some(smf => smf.marhalaId === m.id)) // Filter out already selected marhalas
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'boys' ? -1 : 1;
        }
        return a.marhala_order - b.marhala_order;
      })
      .map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` })),
  [allMarhalasFromApi, selectedMarhalaFees]);


  const steps = [
    { id: 'general', label: 'সাধারণ তথ্য', icon: <BuildingOffice2Icon className="w-5 h-5" /> },
    { id: 'fees', label: 'মারহালা ভিত্তিক ফি', icon: <CurrencyBangladeshiIcon className="w-5 h-5" /> },
    { id: 'review', label: 'পর্যালোচনা ও জমা', icon: <ReviewIcon className="w-5 h-5" /> }
  ];

  const handleGeneralInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralInfo(prev => ({ ...prev, [name]: value }));
    if(errors[name]) setErrors(prev => ({...prev, [name]: undefined}));
  };
  
  const handleRegistrationDeadlineChange = (dateString: string) => {
    setGeneralInfo(prev => ({ ...prev, registrationDeadline: dateString }));
    if (errors.registrationDeadline) setErrors(prev => ({...prev, registrationDeadline: undefined}));
  };


  const handleAddMarhalaFee = (marhalaId: string) => {
    if (!marhalaId) return;
    const marhala = allMarhalasFromApi.find(m => m.id === marhalaId);
    if (marhala && !selectedMarhalaFees.some(mf => mf.marhalaId === marhalaId)) {
      const newFee = {
        marhalaId: marhala.id,
        marhalaName: `${marhala.nameBn} (${marhala.type === 'boys' ? 'বালক' : 'বালিকা'})`,
        startingRollNumber: '', regularFee: '', irregularFee: '',
        lateRegularFee: '', lateIrregularFee: ''
      };

      const updatedFees = [...selectedMarhalaFees, newFee];

      updatedFees.sort((a, b) => {
        const marhalaA = allMarhalasFromApi.find(m => m.id === a.marhalaId);
        const marhalaB = allMarhalasFromApi.find(m => m.id === b.marhalaId);

        if (!marhalaA || !marhalaB) return 0;

        if (marhalaA.type !== marhalaB.type) {
          return marhalaA.type === 'boys' ? -1 : 1;
        }

        return marhalaA.marhala_order - marhalaB.marhala_order;
      });

      setSelectedMarhalaFees(updatedFees);
    }
  };

  const handleRemoveMarhalaFee = (marhalaId: string) => {
    setSelectedMarhalaFees(prev => prev.filter(mf => mf.marhalaId !== marhalaId));
  };

  const handleMarhalaFeeChange = (marhalaId: string, field: keyof ExamFeeDetailForm, value: string) => {
    setSelectedMarhalaFees(prevFees =>
      prevFees.map(feeDetail =>
        feeDetail.marhalaId === marhalaId
          ? { ...feeDetail, [field]: value } // Keep as string for input, convert to number on submit
          : feeDetail
      )
    );
    if(errors.examFees && errors.examFees[marhalaId] && errors.examFees[marhalaId][field]) {
        setErrors(prev => {
            const newExamFeeErrors = {...prev.examFees};
            if(newExamFeeErrors[marhalaId]) delete newExamFeeErrors[marhalaId][field];
            if(newExamFeeErrors[marhalaId] && Object.keys(newExamFeeErrors[marhalaId]).length === 0) delete newExamFeeErrors[marhalaId];
            return {...prev, examFees: Object.keys(newExamFeeErrors).length > 0 ? newExamFeeErrors : undefined };
        });
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const newStepErrors: any = {};
    const stepId = steps[stepIndex].id;

    if (stepId === 'general') {
      if (!generalInfo.name.trim()) newStepErrors.name = 'পরীক্ষার নাম আবশ্যক';
      if (!generalInfo.registrationDeadline) newStepErrors.registrationDeadline = 'নিবন্ধনের শেষ তারিখ আবশ্যক';
      if (generalInfo.startingRegistrationNumber === '' || Number(generalInfo.startingRegistrationNumber) <= 0) newStepErrors.startingRegistrationNumber = 'নিবন্ধন শুরুর নম্বর একটি ধনাত্মক সংখ্যা হতে হবে';
      if (generalInfo.registrationFeeRegular === '' || Number(generalInfo.registrationFeeRegular) < 0) newStepErrors.registrationFeeRegular = 'নিবন্ধন ফি (নিয়মিত) একটি অঋণাত্মক সংখ্যা হতে হবে';
      if (generalInfo.registrationFeeIrregular === '' || Number(generalInfo.registrationFeeIrregular) < 0) newStepErrors.registrationFeeIrregular = 'নিবন্ধন ফি (অনিয়মিত) একটি অঋণাত্মক সংখ্যা হতে হবে';
      if (generalInfo.lateRegistrationFeeRegular === '' || Number(generalInfo.lateRegistrationFeeRegular) < 0) newStepErrors.lateRegistrationFeeRegular = 'বিলম্ব ফি (নিয়মিত) অঋণাত্মক সংখ্যা হতে হবে';
      if (generalInfo.lateRegistrationFeeIrregular === '' || Number(generalInfo.lateRegistrationFeeIrregular) < 0) newStepErrors.lateRegistrationFeeIrregular = 'বিলম্ব ফি (অনিয়মিত) অঋণাত্মক সংখ্যা হতে হবে';
    } else if (stepId === 'fees') {
      if (selectedMarhalaFees.length === 0) {
        newStepErrors.marhalaSelection = 'কমপক্ষে একটি মারহালার জন্য পরীক্ষার ফি নির্ধারণ করুন।';
      }
      const feeErrors: any = {};
      selectedMarhalaFees.forEach((fee) => {
        const marhalaErrorForFee: any = {};
        if (fee.startingRollNumber === '' || Number(fee.startingRollNumber) <= 0) marhalaErrorForFee.startingRollNumber = `শুরুর রোল নম্বর ধনাত্মক সংখ্যা হতে হবে`;
        if (fee.regularFee === '' || Number(fee.regularFee) < 0) marhalaErrorForFee.regularFee = `পরীক্ষার ফি (নিয়মিত) অঋণাত্মক সংখ্যা হতে হবে`;
        if (fee.irregularFee === '' || Number(fee.irregularFee) < 0) marhalaErrorForFee.irregularFee = `পরীক্ষার ফি (অনিয়মিত) অঋণাত্মক সংখ্যা হতে হবে`;
        if (fee.lateRegularFee === '' || Number(fee.lateRegularFee) < 0) marhalaErrorForFee.lateRegularFee = `বিলম্ব ফি (নিয়মিত) অঋণাত্মক সংখ্যা হতে হবে`;
        if (fee.lateIrregularFee === '' || Number(fee.lateIrregularFee) < 0) marhalaErrorForFee.lateIrregularFee = `বিলম্ব ফি (অনিয়মিত) অঋণাত্মক সংখ্যা হতে হবে`;
        if (Object.keys(marhalaErrorForFee).length > 0) feeErrors[fee.marhalaId] = marhalaErrorForFee;
      });
      if(Object.keys(feeErrors).length > 0) newStepErrors.examFees = feeErrors;
    }
    
    setErrors(prev => ({ ...prev, ...newStepErrors }));
    if (Object.keys(newStepErrors).length > 0) {
      const firstErrorKey = Object.keys(newStepErrors)[0];
      const firstErrorFieldId = stepId === 'fees' && firstErrorKey === 'examFees' 
          ? Object.keys(newStepErrors.examFees)[0] + '.' + Object.keys(newStepErrors.examFees[Object.keys(newStepErrors.examFees)[0]])[0] 
          : firstErrorKey;
      const el = document.getElementById(firstErrorFieldId) || document.getElementsByName(firstErrorFieldId)[0];
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(newStepErrors).length === 0;
  };


  const handleStepClick = (index: number) => {
    if (index === currentStep) return;
    if (index < currentStep || completedSteps.has(index) || (index === currentStep + 1 && validateStep(currentStep))) {
      setCurrentStep(index);
      window.scrollTo(0, 0);
    } else if (index > currentStep) {
      if (validateStep(currentStep)) {
        setCompletedSteps(prev => new Set(prev).add(currentStep));
        setCurrentStep(index);
        window.scrollTo(0, 0);
      } else {
         addToast('অনুগ্রহ করে বর্তমান ধাপের তথ্যগুলো সঠিক ভাবে পূরণ করুন।', 'warning');
      }
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    } else {
      addToast('এই ধাপের কিছু তথ্য সঠিক নয়। অনুগ্রহ করে சரி করুন।', 'error');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const createExamMutation = useMutation({
    mutationFn: async (examData: { p_exam_details: any, p_exam_fees: any[]}) => {
        const { data, error } = await supabase.rpc('create_exam_with_fees', examData);
        if (error) throw error;
        return data;
    },
    onSuccess: (data) => {
        addToast(`পরীক্ষা "${(data as any).name}" সফলভাবে তৈরি হয়েছে!`, 'success');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
        navigate('/exam/list');
    },
    onError: (error: PostgrestError | Error) => {
        let userMessage = `পরীক্ষা তৈরি করতে সমস্যা হয়েছে: ${error.message}`;
        const pgError = error as PostgrestError;
        if (pgError.code === '23505' && pgError.message.includes('exams_name_key')) {
            userMessage = `এই নামে (${generalInfo.name}) একটি পরীক্ষা ইতিমধ্যে বিদ্যমান।`;
            setErrors(prev => ({ ...prev, name: userMessage, apiError: undefined }));
            setCurrentStep(0);
        } else if (pgError.code === 'P0001') { // Custom error from DB function (e.g. validation)
             userMessage = pgError.message; // Use the specific message from the DB
             setErrors(prev => ({ ...prev, apiError: userMessage }));
             // Potentially try to set focus to a specific step based on message content
        }
        else {
            setErrors(prev => ({ ...prev, apiError: userMessage }));
        }
        addToast(userMessage, 'error', 7000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let allValid = true;
    for (let i = 0; i < steps.length - 1; i++) { // Validate all steps except review
        if (!validateStep(i)) {
            allValid = false;
        }
    }
    if (!allValid) {
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে প্রতিটি ধাপ চেক করুন।', 'error');
        // Navigate to the first step with an error
        for (let i = 0; i < steps.length - 1; i++) {
            if(!validateStep(i)){ // Re-validate to set errors again if needed
                setCurrentStep(i);
                const newCompleted = new Set<number>();
                completedSteps.forEach(cs => { if(cs < i) newCompleted.add(cs); });
                setCompletedSteps(newCompleted);
                window.scrollTo(0,0);
                break;
            } else {
                setCompletedSteps(prev => new Set(prev).add(i));
            }
        }
        return;
    }
    
    setErrors(prev => ({ ...prev, apiError: undefined }));

    const examDetailsPayload = {
        name: generalInfo.name.trim(),
        registration_deadline: generalInfo.registrationDeadline,
        starting_registration_number: Number(generalInfo.startingRegistrationNumber),
        registration_fee_regular: Number(generalInfo.registrationFeeRegular),
        registration_fee_irregular: Number(generalInfo.registrationFeeIrregular),
        late_registration_fee_regular: Number(generalInfo.lateRegistrationFeeRegular),
        late_registration_fee_irregular: Number(generalInfo.lateRegistrationFeeIrregular),
        is_active: true, // Default to active on creation
    };

    const examFeesPayload = selectedMarhalaFees.map(fee => ({
        marhala_id: fee.marhalaId,
        starting_roll_number: Number(fee.startingRollNumber),
        regular_fee: Number(fee.regularFee),
        irregular_fee: Number(fee.irregularFee),
        late_regular_fee: Number(fee.lateRegularFee),
        late_irregular_fee: Number(fee.lateIrregularFee),
    }));

    createExamMutation.mutate({ p_exam_details: examDetailsPayload, p_exam_fees: examFeesPayload });
  };

  const ReviewDetailItem: React.FC<{ label: string; value?: React.ReactNode; isCurrency?: boolean; className?: string }> = ({ label, value, isCurrency, className = "" }) => (
    <div className={`py-0.5 ${className}`}> {/* Reduced padding, added className prop */}
      <span className="text-xs text-gray-500 mr-1">{label}:</span>
      <span className="text-sm font-medium text-gray-800 break-words">
        {(value === undefined || value === null || String(value).trim() === '') ? 
          <span className="text-gray-400 italic">নেই</span> : 
          value
        }
        {isCurrency && value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '0' && ' ৳'}
      </span>
    </div>
  );


  if (isLoadingMarhalas) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
            <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-xl text-gray-700">মারহালা তালিকা লোড হচ্ছে...</p>
        </div>
    );
  }


  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    switch (stepId) {
      case 'general':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-lg font-medium text-gray-700 mb-4">পরীক্ষার সাধারণ তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input label="পরীক্ষার নাম" name="name" value={generalInfo.name} onChange={handleGeneralInfoChange} error={errors.name} required wrapperClassName="md:col-span-3 lg:col-span-3" />
              <CustomDatePicker
                id="registrationDeadline"
                label="নিবন্ধনের শেষ তারিখ"
                value={generalInfo.registrationDeadline}
                onChange={handleRegistrationDeadlineChange}
                error={errors.registrationDeadline}
                required
                wrapperClassName="md:col-span-2 lg:col-span-2"
                placeholder="YYYY-MM-DD"
              />
              <Input label="নিবন্ধন শুরুর নম্বর" name="startingRegistrationNumber" type="number" value={generalInfo.startingRegistrationNumber} onChange={handleGeneralInfoChange} error={errors.startingRegistrationNumber} required min="1" wrapperClassName="lg:col-span-1"/>
              <Input label="নিবন্ধন ফি (নিয়মিত)" name="registrationFeeRegular" type="number" value={generalInfo.registrationFeeRegular} onChange={handleGeneralInfoChange} error={errors.registrationFeeRegular} required min="0" wrapperClassName="lg:col-span-1"/>
              <Input label="নিবন্ধন ফি (অনিয়মিত)" name="registrationFeeIrregular" type="number" value={generalInfo.registrationFeeIrregular} onChange={handleGeneralInfoChange} error={errors.registrationFeeIrregular} required min="0" wrapperClassName="lg:col-span-1"/>
              <Input label="বিলম্ব ফি (নিয়মিত)" name="lateRegistrationFeeRegular" type="number" value={generalInfo.lateRegistrationFeeRegular} onChange={handleGeneralInfoChange} error={errors.lateRegistrationFeeRegular} required min="0" wrapperClassName="lg:col-span-1"/>
              <Input label="বিলম্ব ফি (অনিয়মিত)" name="lateRegistrationFeeIrregular" type="number" value={generalInfo.lateRegistrationFeeIrregular} onChange={handleGeneralInfoChange} error={errors.lateRegistrationFeeIrregular} required min="0" wrapperClassName="lg:col-span-1"/>
            
            </div>
          </Card>
        );
      case 'fees':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-lg font-medium text-gray-700 mb-4">মারহালা ভিত্তিক পরীক্ষার ফি নির্ধারণ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select 
                    label="ফি নির্ধারণের জন্য মারহালা যোগ করুন" 
                    options={marhalaOptions} 
                    onChange={(e) => handleAddMarhalaFee(e.target.value)}
                    placeholderOption="মারহালা নির্বাচন করুন..."
                    value="" // Always clear after selection
                    disabled={isLoadingMarhalas || marhalaOptions.length === 0}
                />
            </div>
            {errors.marhalaSelection && <p className="text-red-500 text-sm mb-2">{errors.marhalaSelection}</p>}

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {selectedMarhalaFees.map(fee => {
                    const marhalaError = errors.examFees?.[fee.marhalaId] || {};
                    return (
                        <fieldset key={fee.marhalaId} className="border p-3 rounded-md bg-gray-50/70 relative">
                            <legend className="text-md font-semibold text-gray-600 px-1">{fee.marhalaName}</legend>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMarhalaFee(fee.marhalaId)} className="absolute top-1 right-1 p-0.5 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></Button>
                            <div className="grid grid-cols-1  md:grid-cols-5 gap-x-3 gap-y-2 mt-1">
                                <Input label="শুরুর রোল" id={`${fee.marhalaId}.startingRollNumber`} type="number" value={String(fee.startingRollNumber)} onChange={e => handleMarhalaFeeChange(fee.marhalaId, 'startingRollNumber', e.target.value)} error={marhalaError.startingRollNumber} required min="1" wrapperClassName="mb-0 text-xs" className="h-9 text-xs py-1.5"/>
                                <Input label="ফি (নিয়মিত)" id={`${fee.marhalaId}.regularFee`} type="number" value={String(fee.regularFee)} onChange={e => handleMarhalaFeeChange(fee.marhalaId, 'regularFee', e.target.value)} error={marhalaError.regularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-9 text-xs py-1.5"/>
                                <Input label="ফি (অনিয়মিত)" id={`${fee.marhalaId}.irregularFee`} type="number" value={String(fee.irregularFee)} onChange={e => handleMarhalaFeeChange(fee.marhalaId, 'irregularFee', e.target.value)} error={marhalaError.irregularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-9 text-xs py-1.5"/>
                                <Input label="বিলম্ব ফি (নিয়মিত)" id={`${fee.marhalaId}.lateRegularFee`} type="number" value={String(fee.lateRegularFee)} onChange={e => handleMarhalaFeeChange(fee.marhalaId, 'lateRegularFee', e.target.value)} error={marhalaError.lateRegularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-9 text-xs py-1.5"/>
                                <Input label="বিলম্ব ফি (অনিয়মিত)" id={`${fee.marhalaId}.lateIrregularFee`} type="number" value={String(fee.lateIrregularFee)} onChange={e => handleMarhalaFeeChange(fee.marhalaId, 'lateIrregularFee', e.target.value)} error={marhalaError.lateIrregularFee} required min="0" wrapperClassName="mb-0 text-xs" className="h-9 text-xs py-1.5"/>
                            </div>
                        </fieldset>
                    );
                })}
            </div>
            {selectedMarhalaFees.length === 0 && <p className="text-center text-gray-500 py-4">কোনো মারহালা যোগ করা হয়নি।</p>}
          </Card>
        );
      case 'review':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">পর্যালোচনা ও জমা দিন</h3>
            
            <details className="mb-3 border rounded-md overflow-hidden" open>
                <summary className="text-md font-semibold text-gray-700 bg-gray-100 p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-150">সাধারণ তথ্য</summary>
                <div className="p-3 bg-white rounded-b-md space-y-1.5"> {/* Reduced space-y */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <ReviewDetailItem label="পরীক্ষার নাম" value={generalInfo.name} />
                        <ReviewDetailItem label="নিবন্ধনের শেষ তারিখ" value={generalInfo.registrationDeadline ? new Date(generalInfo.registrationDeadline).toLocaleDateString('bn-BD') : 'N/A'} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                        <ReviewDetailItem label="নিবন্ধন শুরুর নম্বর" value={Number(generalInfo.startingRegistrationNumber).toLocaleString('bn-BD')} />
                        <ReviewDetailItem label="নিবন্ধন ফি (নিয়মিত)" value={Number(generalInfo.registrationFeeRegular).toLocaleString('bn-BD')} isCurrency />
                        <ReviewDetailItem label="নিবন্ধন ফি (অনিয়মিত)" value={Number(generalInfo.registrationFeeIrregular).toLocaleString('bn-BD')} isCurrency />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                        <ReviewDetailItem label="বিলম্ব ফি (নিয়মিত)" value={Number(generalInfo.lateRegistrationFeeRegular).toLocaleString('bn-BD')} isCurrency />
                        <ReviewDetailItem label="বিলম্ব ফি (অনিয়মিত)" value={Number(generalInfo.lateRegistrationFeeIrregular).toLocaleString('bn-BD')} isCurrency />
                         {/* Empty div for alignment if needed, or remove if last row has 2 items */}
                    </div>
                </div>
            </details>

            {selectedMarhalaFees.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-md font-semibold text-gray-700 border-b pb-1 pt-1">মারহালা ভিত্তিক ফি</h4>
                  {selectedMarhalaFees.map(fee => (
                    <details key={fee.marhalaId} className="border rounded-md overflow-hidden text-sm" open>
                        <summary className="font-medium text-gray-700 bg-gray-50 p-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150">{fee.marhalaName}</summary>
                        <div className="p-3 bg-white rounded-b-md space-y-1.5">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                                <ReviewDetailItem label="শুরুর রোল" value={Number(fee.startingRollNumber).toLocaleString('bn-BD')} />
                                <ReviewDetailItem label="ফি (নিয়মিত)" value={Number(fee.regularFee).toLocaleString('bn-BD')} isCurrency/>
                                <ReviewDetailItem label="ফি (অনিয়মিত)" value={Number(fee.irregularFee).toLocaleString('bn-BD')} isCurrency/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                                <ReviewDetailItem label="বিলম্ব ফি (নিয়মিত)" value={Number(fee.lateRegularFee).toLocaleString('bn-BD')} isCurrency/>
                                <ReviewDetailItem label="বিলম্ব ফি (অনিয়মিত)" value={Number(fee.lateIrregularFee).toLocaleString('bn-BD')} isCurrency/>
                            </div>
                        </div>
                    </details>
                  ))}
                </div>
            )}
            {errors.apiError && <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">{errors.apiError}</p>}
          </Card>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">নতুন পরীক্ষা তৈরি</h2>
      </div>
      <Card className="shadow-xl">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps}/>
        <div className="p-6 min-h-[300px]"> 
          {renderStepContent()}
        </div>
      </Card>
      <div className="flex justify-between items-center mt-8">
        <Button type="button" variant="secondary" onClick={handlePreviousStep} disabled={currentStep === 0 || createExamMutation.isPending} leftIcon={<ChevronLeftIcon className="w-5 h-5"/>}>পূর্ববর্তী ধাপ</Button>
        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNextStep} rightIcon={<ChevronRightIcon className="w-5 h-5"/>} disabled={createExamMutation.isPending}>পরবর্তী ধাপ</Button>
        ) : (
          <Button type="button" onClick={handleSubmit} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} disabled={createExamMutation.isPending}>
            {createExamMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'পরীক্ষা তৈরি করুন'}
          </Button>
        )}
      </div>
      <div className="flex justify-center mt-4">
          <Button type="button" variant="ghost" onClick={() => {
              setGeneralInfo(initialGeneralInfo);
              setSelectedMarhalaFees([]);
              setCurrentStep(0);
              setCompletedSteps(new Set());
              setErrors({});
              window.scrollTo(0, 0);
          }} disabled={createExamMutation.isPending}>সম্পূর্ণ ফর্ম রিসেট করুন</Button>
      </div>
    </div>
  );
};

export default ExamRegistrationPage;
