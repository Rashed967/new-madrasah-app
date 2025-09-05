

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { FileUpload } from '../../components/ui/FileUpload';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { Madrasa, MadrasaType, SelectOption, MadrasaPerson, MadrasaAddress, Marhala, Zone as ZoneType, Division, MarhalaApiResponse, ZoneApiResponse } from '../../types';
import { PlusCircleIcon, BuildingOffice2Icon, MapPinIcon, UserCircleIcon, CheckCircleIcon as ReviewIcon, ChevronLeftIcon, ChevronRightIcon, PaperClipIcon, ChevronDownIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { DIVISIONS_BD, MADRASA_TYPE_OPTIONS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


const initialFormData: Partial<Madrasa> & { contactEmail?: string, notes?: string, ilhakFormFile?: File | null } = {
  nameBn: '',
  nameAr: '',
  nameEn: '',
  address: { village: '', postOffice: '', upazila: '', district: '', division: '', holding: '', contactPersonName: '' },
  mobile1: '',
  mobile2: '',
  type: '',
  highestMarhalaBoysId: '',
  highestMarhalaGirlsId: '',
  muhtamim: { name: '', mobile: '', nidNumber: '', qualification: '' },
  educationSecretary: { name: '', mobile: '', nidNumber: '', qualification: '' },
  mutawalli: { name: '', mobile: '', nidNumber: '' },
  registrationDate: new Date().toISOString().split('T')[0],
  contactEmail: '', 
  notes: '',
  ilhakFormFile: null,
  ilhakFormUrl: '', 
};


const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn,
  nameAr: apiMarhala.name_ar || undefined, type: apiMarhala.type, category: apiMarhala.category,
  kitabIds: apiMarhala.kitab_ids || [], marhala_order: apiMarhala.marhala_order,
  createdAt: apiMarhala.created_at,
});


const MadrasaAffiliationPage: React.FC = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<Madrasa> & { contactEmail?: string; notes?: string; ilhakFormFile?: File | null; }>(initialFormData);
    const [errors, setErrors] = useState<any>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [isEduSecOpen, setIsEduSecOpen] = useState(false);
    const [isMutawalliOpen, setIsMutawalliOpen] = useState(false);
    const [availableDistricts, setAvailableDistricts] = useState<SelectOption[]>([]);
    const [availableUpazilas, setAvailableUpazilas] = useState<SelectOption[]>([]);
    const [availableMarhalasBoys, setAvailableMarhalasBoys] = useState<SelectOption[]>([]);
    const [availableMarhalasGirls, setAvailableMarhalasGirls] = useState<SelectOption[]>([]);

    const { data: allApiMarhalas = [], isLoading: isLoadingMarhalas } = useQuery<Marhala[], Error>({ queryKey: ['allMarhalasForAffiliation'], queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*'); if (error) throw error; return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend); }});

    const divisionOptions: SelectOption[] = useMemo(() => DIVISIONS_BD.map(div => ({ value: div.value, label: div.label })),[]);

    useEffect(() => {
        if (formData.address?.division) {
            const selectedDivision = DIVISIONS_BD.find(div => div.value === formData.address!.division);
            setAvailableDistricts(selectedDivision ? selectedDivision.districts.map(d => ({value: d.value, label: d.label})) : []);
            setFormData(prev => ({...prev, address: {...prev.address!, district: '', upazila: ''}}));
        } else {
            setAvailableDistricts([]);
        }
    }, [formData.address?.division]);

    useEffect(() => {
        if (formData.address?.district) {
            const selectedDivisionData = DIVISIONS_BD.find(div => div.value === formData.address!.division);
            const selectedDistrictData = selectedDivisionData?.districts.find(d => d.value === formData.address!.district);
            setAvailableUpazilas(selectedDistrictData ? selectedDistrictData.upazilas.map(u => ({value: u.value, label: u.label})) : []);
        } else {
            setAvailableUpazilas([]);
        }
    }, [formData.address?.district]);
    
    useEffect(() => {
        const boyMarhalas = allApiMarhalas.filter(m => m.type === 'boys').map(m => ({ value: m.id, label: `${m.nameBn} (${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` }));
        const girlMarhalas = allApiMarhalas.filter(m => m.type === 'girls').map(m => ({ value: m.id, label: `${m.nameBn} (${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'})` }));
        if (formData.type === 'boys') { setAvailableMarhalasBoys(boyMarhalas); setAvailableMarhalasGirls([]); } 
        else if (formData.type === 'girls') { setAvailableMarhalasBoys([]); setAvailableMarhalasGirls(girlMarhalas); } 
        else if (formData.type === 'both') { setAvailableMarhalasBoys(boyMarhalas); setAvailableMarhalasGirls(girlMarhalas); }
        else { setAvailableMarhalasBoys([]); setAvailableMarhalasGirls([]); }
    }, [formData.type, allApiMarhalas]);

    const { mutate, isPending } = useMutation({
        mutationFn: async (payload: {p_application_data: any}) => {
            const { error } = await supabase.rpc('create_madrasa_application', payload);
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('আপনার আবেদনটি সফলভাবে জমা হয়েছে। পর্যালোচনার পর আপনার সাথে যোগাযোগ করা হবে।', 'success');
            navigate('/');
        },
        onError: (err: any) => {
            addToast(`আবেদন জমা দিতে সমস্যা: ${err.message}`, 'error');
            setErrors(prev => ({...prev, apiError: err.message}));
            setCurrentStep(4); // Go to review step to show API error
        }
    });

    const steps = [
        { id: 'general', label: 'সাধারণ তথ্য', icon: <BuildingOffice2Icon /> },
        { id: 'address', label: 'ঠিকানা ও যোগাযোগ', icon: <MapPinIcon /> },
        { id: 'authorities', label: 'কর্তৃপক্ষ', icon: <UserCircleIcon /> },
        { id: 'ilhakForm', label: 'ইলহাক ফর্ম', icon: <PaperClipIcon /> },
        { id: 'review', label: 'পর্যালোচনা', icon: <ReviewIcon /> }
    ];

    const handleInputChange = (e: React.ChangeEvent<any>, section?: string, field?: string) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({ ...prev, [section]: { ...(prev as any)[section], [field || name]: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value}));
        }
    };

    const handleFileChange = (file: File | null) => {
        setFormData(prev => ({ ...prev, ilhakFormFile: file }));
        if (errors.ilhakFormFile) setErrors((prev:any) => ({...prev, ilhakFormFile: undefined}));
    };

     const validateStep = (step: number): boolean => {
        const newErrors: any = {};
        const stepId = steps[step].id;

        if (stepId === 'general') {
            if (!formData.nameBn?.trim()) newErrors.nameBn = 'মাদ্রাসার বাংলা নাম আবশ্যক';
            if (!formData.nameAr?.trim()) newErrors.nameAr = 'মাদ্রাসার আরবী নাম আবশ্যক';
            if (!formData.type) newErrors.type = 'মাদ্রাসার ধরণ নির্বাচন করুন';
            if (formData.type === 'boys' && !formData.highestMarhalaBoysId) newErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            if (formData.type === 'girls' && !formData.highestMarhalaGirlsId) newErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            if (formData.type === 'both' && (!formData.highestMarhalaBoysId || !formData.highestMarhalaGirlsId)) {
                if (!formData.highestMarhalaBoysId) newErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
                if (!formData.highestMarhalaGirlsId) newErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
            }
        } else if (stepId === 'address') {
            if (!formData.address?.division) newErrors.division = 'বিভাগ আবশ্যক';
            if (!formData.address?.district) newErrors.district = 'জেলা আবশ্যক';
            if (!formData.address?.upazila) newErrors.upazila = 'উপজেলা/থানা আবশ্যক';
            if (!formData.address?.village?.trim()) newErrors.village = 'গ্রাম/মহল্লার নাম আবশ্যক';
            if (!formData.address?.postOffice?.trim()) newErrors.postOffice = 'পোস্ট অফিসের নাম আবশ্যক';
            if (!formData.address?.contactPersonName?.trim()) newErrors.contactPersonName = 'যোগাযোগকারীর নাম আবশ্যক';
            if (!formData.contactEmail?.trim()) newErrors.contactEmail = 'যোগাযোগের ইমেইল আবশ্যক';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) newErrors.contactEmail = 'সঠিক ইমেইল ফরম্যাট দিন';
            if (!formData.mobile1?.trim()) newErrors.mobile1 = 'প্রথম মোবাইল নম্বর আবশ্যক';
            else if (!/^(01[3-9]\d{8})$/.test(formData.mobile1)) newErrors.mobile1 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
        } else if (stepId === 'authorities') {
            if (!formData.muhtamim?.name?.trim()) newErrors.muhtamimName = 'মুহতামিমের নাম আবশ্যক';
            if (!formData.muhtamim?.mobile?.trim()) newErrors.muhtamimMobile = 'মুহতামিমের মোবাইল নম্বর আবশ্যক';
            else if (!/^(01[3-9]\d{8})$/.test(formData.muhtamim.mobile)) newErrors.muhtamimMobile = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
        } else if (stepId === 'ilhakForm') {
            if (formData.ilhakFormFile && formData.ilhakFormFile.type !== 'application/pdf') {
                newErrors.ilhakFormFile = 'শুধুমাত্র পিডিএফ ফাইল আপলোড করুন।';
            } else if (formData.ilhakFormFile && formData.ilhakFormFile.size > 5 * 1024 * 1024) { // 5MB
                newErrors.ilhakFormFile = 'ফাইলের সর্বোচ্চ সাইজ ৫ মেগাবাইট।';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCompletedSteps(prev => new Set(prev).add(currentStep));
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            }
        } else {
            addToast('এই ধাপের কিছু তথ্য সঠিক নয়।', 'error');
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let allValid = true;
        for (let i = 0; i < steps.length - 1; i++) {
            if (!validateStep(i)) {
                allValid = false;
                setCurrentStep(i);
                addToast('ফর্মটিতে ত্রুটি রয়েছে। অনুগ্রহ করে প্রতিটি ধাপ চেক করুন।', 'error');
                break;
            }
        }
        if (!allValid) return;

        let uploadedIlhakFormUrl: string | undefined | null = null;
        if (formData.ilhakFormFile) {
            try {
                if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
                    throw new Error("Cloudinary configuration missing.");
                }
                uploadedIlhakFormUrl = await uploadToCloudinary(formData.ilhakFormFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
            } catch (uploadError: any) {
                addToast(`ইলহাক ফর্ম আপলোডে সমস্যা: ${uploadError.message}`, 'error');
                return;
            }
        }

        const { ilhakFormFile, ...restOfData } = formData;
        const payloadData = { ...restOfData, ilhakFormUrl: uploadedIlhakFormUrl };
        mutate({ p_application_data: payloadData });
    };

    const renderStepContent = () => {
        switch(steps[currentStep].id) {
            case 'general': return (
                <div className="space-y-4">
                    <Input label="মাদ্রাসার নাম (বাংলা)" name="nameBn" value={formData.nameBn} onChange={handleInputChange} required error={errors.nameBn}/>
                    <Input label="মাদ্রাসার নাম (আরবী)" name="nameAr" value={formData.nameAr} onChange={handleInputChange} style={{ direction: 'rtl', textAlign: 'right' }} required error={errors.nameAr}/>
                    <Select label="মাদ্রাসার ধরণ" name="type" value={formData.type} onChange={handleInputChange} options={MADRASA_TYPE_OPTIONS} placeholderOption="ধরণ নির্বাচন করুন" required error={errors.type}/>
                    {formData.type === 'boys' && <Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={formData.highestMarhalaBoysId} onChange={handleInputChange} options={availableMarhalasBoys} required error={errors.highestMarhalaBoysId}/>}
                    {formData.type === 'girls' && <Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={formData.highestMarhalaGirlsId} onChange={handleInputChange} options={availableMarhalasGirls} required error={errors.highestMarhalaGirlsId}/>}
                    {formData.type === 'both' && <>
                        <Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={formData.highestMarhalaBoysId} onChange={handleInputChange} options={availableMarhalasBoys} required error={errors.highestMarhalaBoysId}/>
                        <Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={formData.highestMarhalaGirlsId} onChange={handleInputChange} options={availableMarhalasGirls} required error={errors.highestMarhalaGirlsId}/>
                    </>}
                </div>
            );
            case 'address': return (
                 <div className="space-y-4">
                    <Select label="বিভাগ" value={formData.address?.division} onChange={(e) => handleInputChange(e, 'address', 'division')} options={divisionOptions} required error={errors.division} />
                    <Select label="জেলা" value={formData.address?.district} onChange={(e) => handleInputChange(e, 'address', 'district')} options={availableDistricts} required disabled={!formData.address?.division} error={errors.district} />
                    <Select label="উপজেলা/থানা" value={formData.address?.upazila} onChange={(e) => handleInputChange(e, 'address', 'upazila')} options={availableUpazilas} required disabled={!formData.address?.district} error={errors.upazila} />
                    <Input label="গ্রাম/মহল্লা" value={formData.address?.village} onChange={(e) => handleInputChange(e, 'address', 'village')} required error={errors.village}/>
                    <Input label="পোস্ট অফিস" value={formData.address?.postOffice} onChange={(e) => handleInputChange(e, 'address', 'postOffice')} required error={errors.postOffice}/>
                    <Input label="যোগাযোগকারীর নাম" name="contactPersonName" value={formData.address?.contactPersonName} onChange={(e) => handleInputChange(e, 'address', 'contactPersonName')} required error={errors.contactPersonName} />
                    <Input label="যোগাযোগের ইমেইল" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} required error={errors.contactEmail}/>
                     <Input label="মোবাইল নম্বর" name="mobile1" type="tel" value={formData.mobile1} onChange={handleInputChange} required error={errors.mobile1}/>
                </div>
            );
            case 'authorities': return (
                <div className="space-y-4">
                    <Input label="মুহতামিমের নাম" value={formData.muhtamim?.name} onChange={(e) => handleInputChange(e, 'muhtamim', 'name')} required error={errors.muhtamimName}/>
                    <Input label="মুহতামিমের মোবাইল" value={formData.muhtamim?.mobile} onChange={(e) => handleInputChange(e, 'muhtamim', 'mobile')} required error={errors.muhtamimMobile}/>
                    <Input label="মুহতামিমের শিক্ষাগত যোগ্যতা" value={formData.muhtamim?.qualification} onChange={(e) => handleInputChange(e, 'muhtamim', 'qualification')} />
                </div>
            );
            case 'ilhakForm': return (
                <FileUpload id="ilhakForm" label="ইলহাক ফর্ম (ঐচ্ছিক, পিডিএফ)" onFileChange={handleFileChange} acceptedFileTypes=".pdf" fileNameDisplay={formData.ilhakFormFile?.name}/>
            );
            case 'review': return (
                 <div>
                    <h3 className="text-xl font-semibold mb-4">আপনার তথ্য পর্যালোচনা করুন</h3>
                    <p><strong>মাদ্রাসার নাম:</strong> {formData.nameBn}</p>
                    <p><strong>যোগাযোগের ইমেইল:</strong> {formData.contactEmail}</p>
                    <p><strong>মুহতামিম:</strong> {formData.muhtamim?.name}</p>
                    {errors.apiError && <p className="text-red-500 text-sm mt-4">{errors.apiError}</p>}
                 </div>
            );
            default: return null;
        }
    };
    

    return (
        <Card className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-center text-emerald-700 mb-2">অনলাইনে মাদরাসা অন্তর্ভুক্তির আবেদন</h1>
            <Stepper steps={steps} currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleNextStep}/>
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                {renderStepContent()}
                {isPending && <p className="text-center mt-4"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block"/> আবেদন জমা হচ্ছে...</p>}
              </div>
              <div className="p-6 mt-8 flex justify-between border-t">
                  <Button type="button" variant="secondary" onClick={handlePrevStep} disabled={currentStep === 0 || isPending}>পূর্ববর্তী</Button>
                  {currentStep < steps.length - 1 ? (
                      <Button type="button" onClick={handleNextStep} disabled={isPending}>পরবর্তী</Button>
                  ) : (
                      <Button type="submit" disabled={isPending}>{isPending ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}</Button>
                  )}
              </div>
            </form>
        </Card>
    );
};

export default MadrasaAffiliationPage;
