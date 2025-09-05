
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { FileUpload } from '../../components/ui/FileUpload';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker'; // Added CustomDatePicker
import { Madrasa, MadrasaType, SelectOption, MadrasaPerson, MadrasaAddress, Marhala, Zone as ZoneType, Division, MarhalaApiResponse, ZoneApiResponse, MadrasaDbRow, DispatchMethod } from '../../types';
import { PlusCircleIcon, BuildingOffice2Icon, MapPinIcon, UserCircleIcon, CheckCircleIcon as ReviewIcon, ChevronLeftIcon, ChevronRightIcon, PaperClipIcon, ChevronDownIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { DIVISIONS_BD, MADRASA_TYPE_OPTIONS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, DISPATCH_METHOD_OPTIONS } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


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

const initialFormData: Partial<Madrasa> & { contactEmail?: string, notes?: string, ilhakFormFile?: File | null } = {
  nameBn: '',
  nameAr: '',
  nameEn: '',
  address: { village: '', postOffice: '', upazila: '', district: '', division: '', holding: '', contactPersonName: '' },
  zoneId: '',
  mobile1: '',
  mobile2: '',
  type: '',
  dispatchMethod: null,
  highestMarhalaBoysId: '',
  highestMarhalaGirlsId: '',
  muhtamim: { name: '', mobile: '', nidNumber: '', qualification: '' },
  educationSecretary: { name: '', mobile: '', nidNumber: '', qualification: '' },
  mutawalli: { name: '', mobile: '', nidNumber: '' },
  registrationDate: new Date().toISOString().split('T')[0], // Default to today
  ilhakFormFile: null,
  ilhakFormUrl: '', 
};


const MadrasaRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<Partial<Madrasa> & { contactEmail?: string; notes?: string; ilhakFormFile?: File | null }>(initialFormData);
  const [errors, setErrors] = useState<any>({});
  
  const [isEduSecOpen, setIsEduSecOpen] = useState(false);
  const [isMutawalliOpen, setIsMutawalliOpen] = useState(false);

  const [availableDistricts, setAvailableDistricts] = useState<SelectOption[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<SelectOption[]>([]);
  
  const [availableMarhalasBoys, setAvailableMarhalasBoys] = useState<SelectOption[]>([]);
  const [availableMarhalasGirls, setAvailableMarhalasGirls] = useState<SelectOption[]>([]);

  // Fetch Zones
  const { data: allApiZones = [], isLoading: isLoadingZones, error: zonesError } = useQuery<ZoneApiResponse[], Error>({
    queryKey: ['allZonesForMadrasaReg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts');
      if (error) throw new Error(error.message || 'জোন তালিকা আনতে সমস্যা হয়েছে।');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Marhalas (raw API data)
  const { data: rawMarhalasData = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<MarhalaApiResponse[], Error>({
    queryKey: ['allMarhalasForMadrasaReg'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marhalas')
        .select('id, marhala_code, name_bn, name_ar, type, category, kitab_ids, created_at, marhala_order');
      if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Transform raw marhala data to frontend Marhala type
  const allApiMarhalas: Marhala[] = useMemo(() => {
    return rawMarhalasData.map(mapApiMarhalaToFrontend);
  }, [rawMarhalasData]);
  
  const filteredMadrasaTypeOptions = useMemo(() => {
    return MADRASA_TYPE_OPTIONS.filter(option => option.value !== 'both');
  }, []);

  useEffect(() => {
    if (zonesError) addToast(zonesError.message, 'error');
    if (marhalasError) addToast(marhalasError.message, 'error');
  }, [zonesError, marhalasError, addToast]);


  const zoneOptions: SelectOption[] = useMemo(() => 
    allApiZones
      .slice()
      .sort((a, b) => {
        const numA = parseInt(a.zone_code.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.zone_code.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
      })
      .map(zone => ({ value: zone.id, label: `${zone.name_bn} (${zone.zone_code})` })), 
  [allApiZones]);

  const divisionOptions: SelectOption[] = useMemo(() => 
    DIVISIONS_BD.map(div => ({ value: div.value, label: div.label })),
  []);

  useEffect(() => {
    if (formData.address?.division) {
      const selectedDivision = DIVISIONS_BD.find(div => div.value === formData.address!.division);
      setAvailableDistricts(selectedDivision ? selectedDivision.districts.map(d => ({value: d.value, label: d.label})) : []);
      if(!selectedDivision?.districts.some(d => d.value === formData.address?.district)) {
          setFormData(prev => ({...prev, address: {...prev.address!, district: '', upazila: ''}}));
          setAvailableUpazilas([]);
      }
    } else {
      setAvailableDistricts([]);
      setAvailableUpazilas([]);
    }
  }, [formData.address?.division]);

  useEffect(() => {
    if (formData.address?.district) {
      const selectedDivisionData = DIVISIONS_BD.find(div => div.value === formData.address!.division);
      const selectedDistrictData = selectedDivisionData?.districts.find(d => d.value === formData.address!.district);
      setAvailableUpazilas(selectedDistrictData ? selectedDistrictData.upazilas.map(u => ({value: u.value, label: u.label})) : []);
       if (!selectedDistrictData?.upazilas.some(u => u.value === formData.address?.upazila)) {
          setFormData(prev => ({...prev, address: {...prev.address!, upazila: ''}}));
      }
    } else {
      setAvailableUpazilas([]);
    }
  }, [formData.address?.district]);

  useEffect(() => {
    const madrasaType = formData.type;
    const boyMarhalas = allApiMarhalas // This allApiMarhalas is now Marhala[]
      .filter(marhala => marhala.type === 'boys')
      .map(m => ({ value: m.id, label: `${m.nameBn} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'}` }));
    const girlMarhalas = allApiMarhalas // This allApiMarhalas is now Marhala[]
      .filter(marhala => marhala.type === 'girls')
      .map(m => ({ value: m.id, label: `${m.nameBn} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'}` }));

    if (madrasaType === 'boys') {
      setAvailableMarhalasBoys(boyMarhalas);
      setAvailableMarhalasGirls([]);
      setFormData(prev => ({ ...prev, highestMarhalaBoysId: prev.highestMarhalaBoysId || '', highestMarhalaGirlsId: '' }));
    } else if (madrasaType === 'girls') {
      setAvailableMarhalasBoys([]);
      setAvailableMarhalasGirls(girlMarhalas);
      setFormData(prev => ({ ...prev, highestMarhalaBoysId: '', highestMarhalaGirlsId: prev.highestMarhalaGirlsId || '' }));
    } else if (madrasaType === 'both') {
      setAvailableMarhalasBoys(boyMarhalas);
      setAvailableMarhalasGirls(girlMarhalas);
      setFormData(prev => ({ ...prev, highestMarhalaBoysId: prev.highestMarhalaBoysId || '', highestMarhalaGirlsId: prev.highestMarhalaGirlsId || '' }));
    } else {
      setAvailableMarhalasBoys([]);
      setAvailableMarhalasGirls([]);
      setFormData(prev => ({ ...prev, highestMarhalaBoysId: '', highestMarhalaGirlsId: '' }));
    }
  }, [formData.type, allApiMarhalas]);


  const steps = [
    { id: 'general', label: 'সাধারণ তথ্য', icon: <BuildingOffice2Icon className="w-5 h-5" /> },
    { id: 'address', label: 'ঠিকানা ও যোগাযোগ', icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'authorities', label: 'কর্তৃপক্ষের তথ্য', icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: 'ilhakForm', label: 'ইলহাক ফর্ম', icon: <PaperClipIcon className="w-5 h-5" /> },
    { id: 'review', label: 'পর্যালোচনা ও জমা দিন', icon: <ReviewIcon className="w-5 h-5" /> }
  ];

 const handleInputChange = (
    e: React.ChangeEvent<any>,
    section?: string,
    field?: string
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const updated = { ...prev };
        if (section) {
            (updated as any)[section] = {
                ...(updated as any)[section],
                [field || name]: value,
            };
        } else {
            (updated as any)[name] = value;
        }
        return updated;
    });

    const errorKey = section ? `${section}.${field || name}` : name;
    if (errors[errorKey]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    }
  };
  
  const handleDateChange = (dateString: string) => {
    setFormData(prev => ({...prev, registrationDate: dateString }));
    if(errors.registrationDate) setErrors((prev:any) => ({...prev, registrationDate: undefined}));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, ilhakFormFile: file, ilhakFormUrl: '' })); // Clear existing URL if new file selected
    if (errors.ilhakFormFile) {
        setErrors((prev:any) => ({...prev, ilhakFormFile: undefined}));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const newStepErrors: any = {};
    const stepId = steps[stepIndex].id;

    if (stepId === 'general') {
      if (!formData.nameBn?.trim()) newStepErrors.nameBn = 'মাদ্রাসার বাংলা নাম আবশ্যক';
      if (!formData.nameAr?.trim()) newStepErrors.nameAr = 'মাদ্রাসার আরবী নাম আবশ্যক';
      if (!formData.type) newStepErrors.type = 'মাদ্রাসার ধরণ নির্বাচন করুন';
      if (formData.type === 'boys' && !formData.highestMarhalaBoysId) newStepErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
      if (formData.type === 'girls' && !formData.highestMarhalaGirlsId) newStepErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
      if (formData.type === 'both' && !formData.highestMarhalaBoysId) newStepErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
      if (formData.type === 'both' && !formData.highestMarhalaGirlsId) newStepErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
      if (!formData.zoneId) newStepErrors.zoneId = 'জোন নির্বাচন করুন';
      if (!formData.registrationDate) newStepErrors.registrationDate = 'নিবন্ধনের তারিখ আবশ্যক';
    } else if (stepId === 'address') {
      if (!formData.address?.division) newStepErrors['address.division'] = 'বিভাগ আবশ্যক';
      if (!formData.address?.district) newStepErrors['address.district'] = 'জেলা আবশ্যক';
      if (!formData.address?.upazila) newStepErrors['address.upazila'] = 'উপজেলা/থানা আবশ্যক';
      if (!formData.address?.village?.trim()) newStepErrors['address.village'] = 'গ্রাম/মহল্লার নাম আবশ্যক';
      if (!formData.address?.postOffice?.trim()) newStepErrors['address.postOffice'] = 'পোস্ট অফিসের নাম আবশ্যক';
      if (!formData.address?.contactPersonName?.trim()) newStepErrors['address.contactPersonName'] = 'যোগাযোগকারীর নাম আবশ্যক';
      if (!formData.mobile1?.trim()) newStepErrors.mobile1 = 'প্রথম মোবাইল নম্বর আবশ্যক';
      else if (!/^(01[3-9]\d{8})$/.test(formData.mobile1)) newStepErrors.mobile1 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
      if (formData.mobile2 && formData.mobile2.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.mobile2)) newStepErrors.mobile2 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
    } else if (stepId === 'authorities') {
      if (!formData.muhtamim?.name?.trim()) newStepErrors['muhtamim.name'] = 'মুহতামিমের নাম আবশ্যক';
      if (!formData.muhtamim?.mobile?.trim()) newStepErrors['muhtamim.mobile'] = 'মুহতামিমের মোবাইল নম্বর আবশ্যক';
      else if (formData.muhtamim?.mobile && !/^(01[3-9]\d{8})$/.test(formData.muhtamim.mobile)) newStepErrors['muhtamim.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
      
      const muhtamimNid = formData.muhtamim?.nidNumber?.trim();
      if (!muhtamimNid) {
        newStepErrors['muhtamim.nidNumber'] = 'মুহতামিমের NID আবশ্যক।';
      } else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(muhtamimNid)) {
        newStepErrors['muhtamim.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
      }
      
      if (!formData.muhtamim?.qualification?.trim()) newStepErrors['muhtamim.qualification'] = 'মুহতামিমের শিক্ষাগত যোগ্যতা আবশ্যক';
      
      if (formData.educationSecretary?.mobile && formData.educationSecretary.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.educationSecretary.mobile)) newStepErrors['educationSecretary.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
      const eduSecNid = formData.educationSecretary?.nidNumber?.trim();
      if (eduSecNid && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(eduSecNid)) {
        newStepErrors['educationSecretary.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
      }

      if (formData.mutawalli?.mobile && formData.mutawalli.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.mutawalli.mobile)) newStepErrors['mutawalli.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
      const mutawalliNid = formData.mutawalli?.nidNumber?.trim();
      if (mutawalliNid && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(mutawalliNid)) {
        newStepErrors['mutawalli.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
      }
    } else if (stepId === 'ilhakForm') {
       if (formData.ilhakFormFile && formData.ilhakFormFile.type !== 'application/pdf') {
           newStepErrors.ilhakFormFile = 'শুধুমাত্র পিডিএফ ফাইল আপলোড করুন।';
       } else if (formData.ilhakFormFile && formData.ilhakFormFile.size > 5 * 1024 * 1024) { // 5MB
           newStepErrors.ilhakFormFile = 'ফাইলের সর্বোচ্চ সাইজ ৫ মেগাবাইট।';
       }
    }
    
    setErrors(prev => ({ ...prev, ...newStepErrors }));
    const currentStepSpecificErrors = Object.keys(newStepErrors).length;
     if (currentStepSpecificErrors > 0) {
        const firstErrorKey = Object.keys(newStepErrors)[0];
        const firstErrorFieldId = stepId === 'fees' && firstErrorKey === 'examFees' 
          ? Object.keys(newStepErrors.examFees)[0] + '.' + Object.keys(newStepErrors.examFees[Object.keys(newStepErrors.examFees)[0]])[0] 
          : firstErrorKey;
        const el = document.getElementById(firstErrorFieldId) || document.getElementsByName(firstErrorKey)[0];
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return currentStepSpecificErrors === 0;
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
  }

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
  
 const fullFormValidation = () : boolean => {
    let allValid = true;
    const allErrors:any = {};
    for(let i=0; i < steps.length - 1; i++){ // Validate all steps except review
        const { id: stepId } = steps[i];
        if (stepId === 'general') {
            if (!formData.nameBn?.trim()) allErrors.nameBn = 'মাদ্রাসার বাংলা নাম আবশ্যক';
            if (!formData.nameAr?.trim()) allErrors.nameAr = 'মাদ্রাসার আরবী নাম আবশ্যক';
            if (!formData.type) allErrors.type = 'মাদ্রাসার ধরণ নির্বাচন করুন';
            if (formData.type === 'boys' && !formData.highestMarhalaBoysId) allErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            if (formData.type === 'girls' && !formData.highestMarhalaGirlsId) allErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            if (formData.type === 'both') {
                if(!formData.highestMarhalaBoysId) allErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
                if(!formData.highestMarhalaGirlsId) allErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            }
            if (!formData.zoneId) allErrors.zoneId = 'জোন নির্বাচন করুন';
            if (!formData.registrationDate) allErrors.registrationDate = 'নিবন্ধনের তারিখ আবশ্যক';
        } else if (stepId === 'address') {
            if (!formData.address?.division) allErrors['address.division'] = 'বিভাগ আবশ্যক';
            if (!formData.address?.district) allErrors['address.district'] = 'জেলা আবশ্যক';
            if (!formData.address?.upazila) allErrors['address.upazila'] = 'উপজেলা/থানা আবশ্যক';
            if (!formData.address?.village?.trim()) allErrors['address.village'] = 'গ্রাম/মহল্লার নাম আবশ্যক';
            if (!formData.address?.postOffice?.trim()) allErrors['address.postOffice'] = 'পোস্ট অফিসের নাম আবশ্যক';
            if (!formData.address?.contactPersonName?.trim()) allErrors['address.contactPersonName'] = 'যোগাযোগকারীর নাম আবশ্যক';
            if (!formData.mobile1?.trim()) allErrors.mobile1 = 'প্রথম মোবাইল নম্বর আবশ্যক';
            else if (!/^(01[3-9]\d{8})$/.test(formData.mobile1)) allErrors.mobile1 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
            if (formData.mobile2 && formData.mobile2.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.mobile2)) allErrors.mobile2 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
        } else if (stepId === 'authorities') {
            if (!formData.muhtamim?.name?.trim()) allErrors['muhtamim.name'] = 'মুহতামিমের নাম আবশ্যক';
            if (!formData.muhtamim?.mobile?.trim()) allErrors['muhtamim.mobile'] = 'মুহতামিমের মোবাইল নম্বর আবশ্যক';
            else if (formData.muhtamim?.mobile && !/^(01[3-9]\d{8})$/.test(formData.muhtamim.mobile)) allErrors['muhtamim.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
            
            const muhtamimNid = formData.muhtamim?.nidNumber?.trim();
            if (!muhtamimNid) {
                allErrors['muhtamim.nidNumber'] = 'মুহতামিমের NID আবশ্যক।';
            } else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(muhtamimNid)) {
                allErrors['muhtamim.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
            }
      
            if (!formData.muhtamim?.qualification?.trim()) allErrors['muhtamim.qualification'] = 'মুহতামিমের শিক্ষাগত যোগ্যতা আবশ্যক';
      
            if (formData.educationSecretary?.mobile && formData.educationSecretary.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.educationSecretary.mobile)) allErrors['educationSecretary.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
            const eduSecNid = formData.educationSecretary?.nidNumber?.trim();
            if (eduSecNid && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(eduSecNid)) allErrors['educationSecretary.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';

            if (formData.mutawalli?.mobile && formData.mutawalli.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(formData.mutawalli.mobile)) allErrors['mutawalli.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
            const mutawalliNid = formData.mutawalli?.nidNumber?.trim();
            if (mutawalliNid && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(mutawalliNid)) allErrors['mutawalli.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';

        } else if (stepId === 'ilhakForm') {
            if (formData.ilhakFormFile && formData.ilhakFormFile.type !== 'application/pdf') {
                allErrors.ilhakFormFile = 'ইলহাক ফর্ম শুধুমাত্র পিডিএফ ফাইল হতে হবে।';
            } else if (formData.ilhakFormFile && formData.ilhakFormFile.size > 5 * 1024 * 1024) { // 5MB
                allErrors.ilhakFormFile = 'ইলহাক ফর্ম ফাইলের সর্বোচ্চ সাইজ ৫ মেগাবাইট।';
            }
        }
    }
    setErrors(allErrors);
    if(Object.keys(allErrors).length > 0) allValid = false;
    return allValid;
  }

  const createMadrasaMutation = useMutation({
    mutationFn: async (madrasaPayload: any) => {
      const { data, error } = await supabase.rpc('create_madrasa', madrasaPayload);
      if (error) throw error;
      return data;
    },
    onSuccess: (newMadrasaData) => {
      addToast(`মাদরাসা "${(newMadrasaData as MadrasaDbRow).name_bn}" (কোড: ${(newMadrasaData as MadrasaDbRow).madrasa_code}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
      setFormData(initialFormData);
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setErrors({});
      setIsEduSecOpen(false);
      setIsMutawalliOpen(false);
      window.scrollTo(0, 0);
      queryClient.invalidateQueries({ queryKey: ['madrasas'] }); // For list page
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `মাদরাসা নিবন্ধন করতে সমস্যা হয়েছে: ${error.message}`;
        const fieldErrorsUpdate: any = { apiError: userMessage };

        if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
            const typedRpcError = error as SupabasePostgrestError;
            if (typedRpcError.code === '23505') { 
                if (typedRpcError.message.includes('name_bn')) { 
                    fieldErrorsUpdate.nameBn = 'এই বাংলা নামে একটি মাদরাসা ইতিমধ্যে বিদ্যমান।';
                    fieldErrorsUpdate.apiError = undefined; 
                    setCurrentStep(0); // Go to the step with the error
                }
            } else if (typedRpcError.code === '23503') { 
                if (typedRpcError.message.includes('zone_id')) {
                    fieldErrorsUpdate.zoneId = 'নির্বাচিত জোনটি সঠিক নয়।';
                    fieldErrorsUpdate.apiError = undefined; 
                    setCurrentStep(0);
                } else if (typedRpcError.message.includes('highest_marhala_boys_id') || typedRpcError.message.includes('highest_marhala_girls_id')) {
                    fieldErrorsUpdate.highestMarhalaBoysId = 'নির্বাচিত কোনো মারহালা সঠিক নয়।';
                    fieldErrorsUpdate.apiError = undefined; 
                    setCurrentStep(0);
                }
            } 
        } 
        setErrors(prev => ({ ...prev, ...fieldErrorsUpdate })); 
        addToast(userMessage, 'error', 7000); 
    }
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullFormValidation()) { 
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে প্রতিটি ধাপ চেক করুন।', 'error');
        for (let i = 0; i < steps.length - 1; i++) {
            if (!validateStep(i)) {
                setCurrentStep(i);
                const newCompleted = new Set<number>();
                completedSteps.forEach(cs => { if (cs < i) newCompleted.add(cs); });
                setCompletedSteps(newCompleted);
                window.scrollTo(0,0);
                break;
            }
        }
        return; 
    }
    
    setErrors(prev => ({ ...prev, apiError: undefined }));

    let uploadedIlhakFormUrl = formData.ilhakFormUrl || null;

    if (formData.ilhakFormFile) {
      try {
        if (!CLOUDINARY_CLOUD_NAME) { 
          throw new Error("Cloudinary ক্লাউড নেম অনুগ্রহ করে constants.ts ফাইল আপডেট করুন।");
        }
        if (!CLOUDINARY_UPLOAD_PRESET ) { 
          throw new Error("Cloudinary আপলোড প্রিসেট  অনুগ্রহ করে constants.ts ফাইল আপডেট করুন।");
        }
        uploadedIlhakFormUrl = await uploadToCloudinary(formData.ilhakFormFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      } catch (uploadError: any) {
        setErrors(prev => ({ ...prev, ilhakFormFile: uploadError.message, apiError: uploadError.message }));
        addToast(uploadError.message, 'error');
        setCurrentStep(3); // Go to ilhak form step
        return;
      }
    }
    
    // Prepare address payload with snake_case for contact_person_name
    const dbAddressPayload = formData.address ? {
        holding: formData.address.holding || null,
        village: formData.address.village,
        post_office: formData.address.postOffice || null, // Added post_office
        upazila: formData.address.upazila,
        district: formData.address.district,
        division: formData.address.division,
        contact_person_name: formData.address.contactPersonName, 
    } : null;

    // Helper to map frontend MadrasaPerson to DB person structure (snake_case for nid_number)
    const mapToDbPerson = (person?: MadrasaPerson): ({ name: string; mobile: string; nid_number?: string | null; qualification?: string | null; } | null) => {
        if (!person || !person.name) return null;
        return {
            name: person.name,
            mobile: person.mobile,
            nid_number: person.nidNumber || null,
            qualification: person.qualification || null,
        };
    };
    const mapToDbMutawalli = (person?: MadrasaPerson): ({ name: string; mobile: string; nid_number?: string | null; } | null) => {
        if(!person || !person.name) return null;
        return {
            name: person.name,
            mobile: person.mobile,
            nid_number: person.nidNumber || null,
        }
    }
    
    const dbMuhtamimPayload = mapToDbPerson(formData.muhtamim);
    const dbEducationSecretaryPayload = mapToDbPerson(formData.educationSecretary);
    const dbMutawalliPayload = mapToDbMutawalli(formData.mutawalli);

    const payload = {
      p_name_bn: formData.nameBn!,
      p_name_ar: formData.nameAr!,
      p_name_en: formData.nameEn || null,
      p_address: dbAddressPayload, // Use the snake_case mapped address
      p_zone_id: formData.zoneId!,
      p_mobile1: formData.mobile1!,
      p_mobile2: formData.mobile2 || null,
      p_type: formData.type!,
      p_dispatch_method: formData.dispatchMethod || null,
      p_highest_marhala_boys_id: formData.type === 'girls' ? null : formData.highestMarhalaBoysId || null,
      p_highest_marhala_girls_id: formData.type === 'boys' ? null : formData.highestMarhalaGirlsId || null,
      p_muhtamim: dbMuhtamimPayload!,
      p_education_secretary: dbEducationSecretaryPayload,
      p_mutawalli: dbMutawalliPayload,
      p_registration_date: formData.registrationDate!,
      p_ilhak_form_url: uploadedIlhakFormUrl,
    };
    createMadrasaMutation.mutate(payload);
  };
  
  const ReviewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="py-1.5 grid grid-cols-3 gap-2">
      <p className="text-sm text-gray-600 col-span-1">{label}:</p>
      <p className="text-sm font-medium text-gray-900 col-span-2 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
    </div>
  );

  if (isLoadingZones || isLoadingMarhalas) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
            <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-xl text-gray-700">ফর্মের জন্য তথ্য লোড হচ্ছে...</p>
        </div>
    );
  }

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    switch (stepId) {
      case 'general':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-lg font-medium text-gray-700 mb-4">মাদ্রাসার সাধারণ তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="নাম (বাংলা)" name="nameBn" value={formData.nameBn} onChange={handleInputChange} required error={errors.nameBn}/>
              <Input label="নাম (আরবী)" name="nameAr" value={formData.nameAr} onChange={handleInputChange} style={{ direction: 'rtl', textAlign: 'right' }} required error={errors.nameAr}/>
              <Input label="নাম (ইংরেজি) (ঐচ্ছিক)" name="nameEn" value={formData.nameEn} onChange={handleInputChange} />
              <CustomDatePicker 
                id="registrationDate"
                label="নিবন্ধনের তারিখ"
                value={formData.registrationDate}
                onChange={handleDateChange}
                error={errors.registrationDate}
                required
                placeholder="YYYY-MM-DD"
              />
              <Select label="মাদ্রাসার ধরণ" name="type" value={formData.type} onChange={(e) => handleInputChange(e)} options={filteredMadrasaTypeOptions} error={errors.type} placeholderOption="ধরণ নির্বাচন করুন" required />
              
              {formData.type === 'boys' && (
                <Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={formData.highestMarhalaBoysId} onChange={handleInputChange} options={availableMarhalasBoys} error={errors.highestMarhalaBoysId} placeholderOption="মারহালা নির্বাচন করুন" required={formData.type === 'boys'} disabled={availableMarhalasBoys.length === 0}/>
              )}
              {formData.type === 'girls' && (
                <Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={formData.highestMarhalaGirlsId} onChange={handleInputChange} options={availableMarhalasGirls} error={errors.highestMarhalaGirlsId} placeholderOption="মারহালা নির্বাচন করুন" required={formData.type === 'girls'} disabled={availableMarhalasGirls.length === 0}/>
              )}
              {formData.type === 'both' && (
                <>
                  <Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={formData.highestMarhalaBoysId} onChange={handleInputChange} options={availableMarhalasBoys} error={errors.highestMarhalaBoysId} placeholderOption="বালক মারহালা নির্বাচন" required={formData.type === 'both'} disabled={availableMarhalasBoys.length === 0}/>
                  <Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={formData.highestMarhalaGirlsId} onChange={handleInputChange} options={availableMarhalasGirls} error={errors.highestMarhalaGirlsId} placeholderOption="বালিকা মারহালা নির্বাচন" required={formData.type === 'both'} disabled={availableMarhalasGirls.length === 0}/>
                </>
              )}
              <Select label="জোন" name="zoneId" value={formData.zoneId} onChange={(e) => handleInputChange(e)} options={zoneOptions} error={errors.zoneId} placeholderOption="জোন নির্বাচন করুন" required disabled={zoneOptions.length === 0} />
              <Select 
                label="চিঠি প্রেরণের মাধ্যম" 
                name="dispatchMethod" 
                value={formData.dispatchMethod} 
                onChange={handleInputChange} 
                options={DISPATCH_METHOD_OPTIONS} 
                error={errors.dispatchMethod} 
                placeholderOption="চিঠি প্রেরণের মাধ্যম নির্বাচন করুন"
              />
            </div>
          </Card>
        );
      case 'address':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-lg font-medium text-gray-700 mb-4">ঠিকানা ও যোগাযোগের বিবরণ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="বিভাগ" value={formData.address?.division} onChange={(e) => handleInputChange(e, 'address', 'division')} options={divisionOptions} required error={errors['address.division']} placeholderOption="বিভাগ নির্বাচন করুন" />
              <Select label="জেলা" value={formData.address?.district} onChange={(e) => handleInputChange(e, 'address', 'district')} options={availableDistricts} required disabled={!formData.address?.division} error={errors['address.district']} placeholderOption="জেলা নির্বাচন করুন" />
              <Select label="উপজেলা/থানা" value={formData.address?.upazila} onChange={(e) => handleInputChange(e, 'address', 'upazila')} options={availableUpazilas} required disabled={!formData.address?.district} error={errors['address.upazila']} placeholderOption="উপজেলা/থানা নির্বাচন করুন" />
              <Input label="গ্রাম/মহল্লা" value={formData.address?.village} onChange={(e) => handleInputChange(e, 'address', 'village')} required error={errors['address.village']}/>
              <Input label="পোস্ট অফিস" value={formData.address?.postOffice} onChange={(e) => handleInputChange(e, 'address', 'postOffice')} required error={errors['address.postOffice']}/>
              <Input label="হোল্ডিং নম্বর (ঐচ্ছিক)" value={formData.address?.holding} onChange={(e) => handleInputChange(e, 'address', 'holding')} />
              <Input label="যোগাযোগকারীর নাম" name="contactPersonName" value={formData.address?.contactPersonName} onChange={(e) => handleInputChange(e, 'address', 'contactPersonName')} required error={errors['address.contactPersonName']} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input label="মোবাইল নম্বর ১" name="mobile1" type="tel" value={formData.mobile1} onChange={handleInputChange} required error={errors.mobile1}/>
              <Input label="মোবাইল নম্বর ২ (ঐচ্ছিক)" name="mobile2" type="tel" value={formData.mobile2} onChange={handleInputChange} />
            </div>
          </Card>
        );
      case 'authorities':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
             <h3 className="text-lg font-medium text-gray-700 mb-6">কর্তৃপক্ষের তথ্য</h3>
             <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-1">মুহতামিম এর তথ্য</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Input label="নাম" value={formData.muhtamim?.name} onChange={(e) => handleInputChange(e, 'muhtamim', 'name')} required error={errors['muhtamim.name']}/>
                        <Input label="মোবাইল নম্বর" value={formData.muhtamim?.mobile} onChange={(e) => handleInputChange(e, 'muhtamim', 'mobile')} required error={errors['muhtamim.mobile']}/>
                        <Input label="NID নম্বর" name="nidNumber" value={formData.muhtamim?.nidNumber || ''} onChange={(e) => handleInputChange(e, 'muhtamim', 'nidNumber')} error={errors['muhtamim.nidNumber']} required/>
                        <Input label="সর্বোচ্চ শিক্ষাগত যোগ্যতা" value={formData.muhtamim?.qualification} onChange={(e) => handleInputChange(e, 'muhtamim', 'qualification')} required error={errors['muhtamim.qualification']}/>
                    </div>
                </div>
                
                <div>
                    <button type="button" onClick={() => setIsEduSecOpen(!isEduSecOpen)} className="w-full flex justify-between items-center text-md font-semibold text-gray-600 mb-3 border-b pb-1 focus:outline-none">
                        <span>শিক্ষা সচিব এর তথ্য (ঐচ্ছিক)</span>
                        <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-200 ${isEduSecOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isEduSecOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="নাম" value={formData.educationSecretary?.name} onChange={(e) => handleInputChange(e, 'educationSecretary', 'name')} />
                            <Input label="মোবাইল নম্বর" value={formData.educationSecretary?.mobile} onChange={(e) => handleInputChange(e, 'educationSecretary', 'mobile')} error={errors['educationSecretary.mobile']}/>
                            <Input label="NID নম্বর" name="nidNumber" type="text" value={formData.educationSecretary?.nidNumber} onChange={(e) => handleInputChange(e, 'educationSecretary', 'nidNumber')} error={errors['educationSecretary.nidNumber']}/>
                            <Input label="যোগ্যতা" value={formData.educationSecretary?.qualification} onChange={(e) => handleInputChange(e, 'educationSecretary', 'qualification')} />
                        </div>
                    )}
                </div>

                <div>
                     <button type="button" onClick={() => setIsMutawalliOpen(!isMutawalliOpen)} className="w-full flex justify-between items-center text-md font-semibold text-gray-600 mb-3 border-b pb-1 focus:outline-none">
                        <span>মুতাওয়াল্লী এর তথ্য (ঐচ্ছিক)</span>
                        <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-200 ${isMutawalliOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMutawalliOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="নাম" value={formData.mutawalli?.name} onChange={(e) => handleInputChange(e, 'mutawalli', 'name')} />
                            <Input label="মোবাইল নম্বর" value={formData.mutawalli?.mobile} onChange={(e) => handleInputChange(e, 'mutawalli', 'mobile')} error={errors['mutawalli.mobile']}/>
                            <Input label="NID নম্বর" name="nidNumber" type="text" value={formData.mutawalli?.nidNumber} onChange={(e) => handleInputChange(e, 'mutawalli', 'nidNumber')} error={errors['mutawalli.nidNumber']} />
                        </div>
                    )}
                </div>
             </div>
          </Card>
        );
      case 'ilhakForm':
        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-lg font-medium text-gray-700 mb-4">ইলহাক ফর্ম আপলোড (পিডিএফ)</h3>
            <FileUpload
              id="ilhakForm"
              label="ইলহাক ফর্ম (ঐচ্ছিক, পিডিএফ)"
              onFileChange={handleFileChange}
              acceptedFileTypes=".pdf"
              fileNameDisplay={formData.ilhakFormFile?.name}
              error={errors.ilhakFormFile} 
            />
            <p className="text-xs text-gray-500 mt-2">যদি থাকে, মাদ্রাসার ইলহাক ফর্মের পিডিএফ কপি আপলোড করুন। এটি ঐচ্ছিক। সর্বোচ্চ ফাইল সাইজ: ৫ মেগাবাইট।</p>
          </Card>
        );
      case 'review':
        let highestMarhalaDisplay = 'N/A';
        if (formData.type === 'boys' && formData.highestMarhalaBoysId) {
            highestMarhalaDisplay = availableMarhalasBoys.find(m => m.value === formData.highestMarhalaBoysId)?.label || formData.highestMarhalaBoysId;
        } else if (formData.type === 'girls' && formData.highestMarhalaGirlsId) {
            highestMarhalaDisplay = availableMarhalasGirls.find(m => m.value === formData.highestMarhalaGirlsId)?.label || formData.highestMarhalaGirlsId;
        } else if (formData.type === 'both') {
            const boys = formData.highestMarhalaBoysId ? (availableMarhalasBoys.find(m => m.value === formData.highestMarhalaBoysId)?.label || formData.highestMarhalaBoysId) : 'নেই';
            const girls = formData.highestMarhalaGirlsId ? (availableMarhalasGirls.find(m => m.value === formData.highestMarhalaGirlsId)?.label || formData.highestMarhalaGirlsId) : 'নেই';
            highestMarhalaDisplay = `বালক: ${boys}, বালিকা: ${girls}`;
        }

        return (
          <Card className="border-none shadow-none" bodyClassName="p-0">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">পর্যালোচনা ও জমা দিন</h3>
            <div className="space-y-2 bg-gray-50 p-3 rounded-md shadow-inner max-h-[60vh] overflow-y-auto">
                <h4 className="text-md font-semibold text-gray-600 border-b pb-1">সাধারণ তথ্য</h4>
                <ReviewDetailItem label="নাম (বাংলা)" value={formData.nameBn} />
                <ReviewDetailItem label="নাম (আরবী)" value={formData.nameAr} />
                <ReviewDetailItem label="নাম (ইংরেজি)" value={formData.nameEn} />
                <ReviewDetailItem label="নিবন্ধনের তারিখ" value={formData.registrationDate ? new Date(formData.registrationDate).toLocaleDateString('bn-BD') : 'নেই'} />
                <ReviewDetailItem label="ধরণ" value={MADRASA_TYPE_OPTIONS.find(o=>o.value === formData.type)?.label} />
                <ReviewDetailItem label="চিঠি প্রেরণের মাধ্যম" value={DISPATCH_METHOD_OPTIONS.find(o => o.value === formData.dispatchMethod)?.label} />
                <ReviewDetailItem label="সর্বোচ্চ মারহালা" value={highestMarhalaDisplay} />
                <ReviewDetailItem label="জোন" value={zoneOptions.find(z => z.value === formData.zoneId)?.label || formData.zoneId} />

                <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-3">ঠিকানা ও যোগাযোগ</h4>
                <ReviewDetailItem label="বিভাগ" value={formData.address?.division} />
                <ReviewDetailItem label="জেলা" value={formData.address?.district} />
                <ReviewDetailItem label="উপজেলা/থানা" value={formData.address?.upazila} />
                <ReviewDetailItem label="গ্রাম/মহল্লা" value={formData.address?.village} />
                <ReviewDetailItem label="পোস্ট অফিস" value={formData.address?.postOffice} />
                <ReviewDetailItem label="হোল্ডিং" value={formData.address?.holding} />
                <ReviewDetailItem label="যোগাযোগকারী" value={formData.address?.contactPersonName} />
                <ReviewDetailItem label="মোবাইল ১" value={formData.mobile1} />
                <ReviewDetailItem label="মোবাইল ২" value={formData.mobile2} />
                
                <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-3">মুহতামিম</h4>
                <ReviewDetailItem label="নাম" value={formData.muhtamim?.name} />
                <ReviewDetailItem label="মোবাইল" value={formData.muhtamim?.mobile} />
                <ReviewDetailItem label="NID" value={formData.muhtamim?.nidNumber} />
                <ReviewDetailItem label="যোগ্যতা" value={formData.muhtamim?.qualification} />

                {formData.educationSecretary?.name && (
                    <>
                        <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-3">শিক্ষা সচিব</h4>
                        <ReviewDetailItem label="নাম" value={formData.educationSecretary?.name} />
                        <ReviewDetailItem label="মোবাইল" value={formData.educationSecretary?.mobile} />
                        <ReviewDetailItem label="NID" value={formData.educationSecretary?.nidNumber} />
                        <ReviewDetailItem label="যোগ্যতা" value={formData.educationSecretary?.qualification} />
                    </>
                )}
                {formData.mutawalli?.name && (
                    <>
                        <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-3">মুতাওয়াল্লী</h4>
                        <ReviewDetailItem label="নাম" value={formData.mutawalli?.name} />
                        <ReviewDetailItem label="মোবাইল" value={formData.mutawalli?.mobile} />
                        <ReviewDetailItem label="NID" value={formData.mutawalli?.nidNumber} />
                    </>
                )}
                 <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-3">ইলহাক ফর্ম</h4>
                 <ReviewDetailItem label="ফাইলের নাম" value={formData.ilhakFormFile?.name || <span className="text-gray-400 italic">আপলোড করা হয়নি</span>} />
                 {errors.apiError && <p className="text-sm text-red-500 mt-2 col-span-3">{errors.apiError}</p>}

            </div>
          </Card>
        );
      default: return null;
    }
  };
  
   const isLoadingData = isLoadingZones || isLoadingMarhalas;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নতুন মাদরাসা নিবন্ধন</h2> 
      <Card className="shadow-xl">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps}/>
        <div className="p-6 min-h-[350px]"> 
          {isLoadingData ? <div className="flex items-center justify-center p-10"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-2"/> ডেটা লোড হচ্ছে...</div> : renderStepContent()}
        </div>
      </Card>
      <div className="flex justify-between items-center mt-8">
        <Button 
            type="button" 
            variant="secondary" 
            onClick={handlePreviousStep} 
            disabled={currentStep === 0 || createMadrasaMutation.isPending || isLoadingZones || isLoadingMarhalas}
            leftIcon={<ChevronLeftIcon className="w-5 h-5"/>}
        >
          পূর্ববর্তী ধাপ
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button 
            type="button" 
            onClick={handleNextStep}
            rightIcon={<ChevronRightIcon className="w-5 h-5"/>}
            disabled={createMadrasaMutation.isPending || isLoadingData}
           >
            পরবর্তী ধাপ
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} disabled={createMadrasaMutation.isPending || isLoadingData}>
            {createMadrasaMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন'}
          </Button>
        )}
      </div>
       <div className="flex justify-center mt-4">
          <Button type="button" variant="ghost" onClick={() => { setFormData(initialFormData); setCurrentStep(0); setCompletedSteps(new Set()); setErrors({}); setIsEduSecOpen(false); setIsMutawalliOpen(false); window.scrollTo(0, 0); }} disabled={createMadrasaMutation.isPending || isLoadingData}>
            সম্পূর্ণ ফর্ম রিসেট করুন
          </Button>
        </div>
    </div>
  );
};

export default MadrasaRegistrationPage;
