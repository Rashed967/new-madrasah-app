
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FileUpload } from '../components/ui/FileUpload';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { BoardProfile, BoardProfileAddress, BoardOfficial, BoardProfileDbRow, Division, SelectOption } from '../types';
import { APP_TITLE_BN, APP_TITLE_EN, DIVISIONS_BD, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants';
import { PencilIcon, ArrowPathIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon, MapPinIcon, CalendarDaysIcon, UserCircleIcon } from '../components/ui/Icon';
import Logo from '../assets/Logo';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import type { PostgrestError } from '@supabase/supabase-js';


const mapDbRowToFrontend = (dbRow: BoardProfileDbRow): BoardProfile => ({
  id: dbRow.id,
  boardNameBn: dbRow.board_name_bn,
  boardNameEn: dbRow.board_name_en,
  address: {
    holding: dbRow.address.holding || undefined,
    villageArea: dbRow.address.village_area,
    postOffice: dbRow.address.post_office,
    upazila: dbRow.address.upazila,
    district: dbRow.address.district,
    division: dbRow.address.division,
  },
  primaryPhone: dbRow.primary_phone,
  secondaryPhone: dbRow.secondary_phone || undefined,
  email: dbRow.email,
  website: dbRow.website || undefined,
  logoUrl: dbRow.logo_url || undefined,
  establishmentDate: dbRow.establishment_date,
  chairman: {
    name: dbRow.chairman.name,
    mobile: dbRow.chairman.mobile,
    email: dbRow.chairman.email || undefined,
  },
  secretary: {
    name: dbRow.secretary.name,
    mobile: dbRow.secretary.mobile,
    email: dbRow.secretary.email || undefined,
  },
  updatedAt: dbRow.updated_at,
});


const ProfilePage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<BoardProfile>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [availableDistricts, setAvailableDistricts] = useState<SelectOption[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<SelectOption[]>([]);

  const { data: boardProfile, isLoading, error } = useQuery<BoardProfile, Error>({
    queryKey: ['boardProfile'],
    queryFn: async () => {
      const { data, error: dbError } = await supabase
        .from('board_profile')
        .select('*')
        .eq('id', 'MAIN_PROFILE') // Assuming a fixed ID for the single profile row
        .single();
      if (dbError && dbError.code !== 'PGRST116') { // PGRST116: row not found, which is fine for initial setup
        throw new Error(dbError.message);
      }
      return data ? mapDbRowToFrontend(data as BoardProfileDbRow) : {
        id: 'MAIN_PROFILE', boardNameBn: APP_TITLE_BN, boardNameEn: APP_TITLE_EN,
        address: { villageArea: '', postOffice: '', upazila: '', district: '', division: ''},
        primaryPhone: '', email: '', establishmentDate: '', 
        chairman: {name: '', mobile: ''}, secretary: {name: '', mobile: ''}
      } as BoardProfile;
    },
  });

  useEffect(() => {
    if (boardProfile) {
      setFormData(boardProfile);
    }
  }, [boardProfile]);


  useEffect(() => {
    if (formData.address?.division) {
      const selectedDivision = DIVISIONS_BD.find(div => div.value === formData.address!.division);
      setAvailableDistricts(selectedDivision ? selectedDivision.districts.map(d => ({value: d.value, label: d.label})) : []);
      if (!selectedDivision?.districts.some(d => d.value === formData.address?.district)) {
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
  }, [formData.address?.district, formData.address?.division]);

  const divisionOptions: SelectOption[] = useMemo(() => 
    DIVISIONS_BD.map(div => ({ value: div.value, label: div.label })),
  []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, section?: keyof BoardProfile, field?: string) => {
    const { name, value } = e.target;
    
    if (section === 'address') {
      setFormData(prev => ({ ...prev, address: { ...prev.address!, [field || name]: value } as BoardProfileAddress }));
    } else if (section === 'chairman' || section === 'secretary') {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section]!, [field || name]: value } as BoardOfficial }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[section ? `${section}.${field || name}` : name]) {
        setErrors((prevErr:any) => {
            const newErr = {...prevErr};
            delete newErr[section ? `${section}.${field || name}` : name];
            return newErr;
        });
    }
  };

  const handleDateChange = (dateString: string, field: 'establishmentDate') => {
    setFormData(prev => ({ ...prev, [field]: dateString }));
    if (errors[field]) setErrors((prevErr: any) => ({...prevErr, [field]: undefined }));
  };
  
  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (errors.logoFile) setErrors((prevErr: any) => ({...prevErr, logoFile: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    if (!formData.boardNameBn?.trim()) newErrors.boardNameBn = 'বোর্ডের বাংলা নাম আবশ্যক';
    if (!formData.boardNameEn?.trim()) newErrors.boardNameEn = 'বোর্ডের ইংরেজি নাম আবশ্যক';
    if (!formData.address?.division) newErrors['address.division'] = 'বিভাগ আবশ্যক';
    if (!formData.address?.district) newErrors['address.district'] = 'জেলা আবশ্যক';
    if (!formData.address?.upazila) newErrors['address.upazila'] = 'উপজেলা আবশ্যক';
    if (!formData.address?.postOffice?.trim()) newErrors['address.postOffice'] = 'পোস্ট অফিস আবশ্যক';
    if (!formData.address?.villageArea?.trim()) newErrors['address.villageArea'] = 'গ্রাম/এলাকা আবশ্যক';
    if (!formData.primaryPhone?.trim()) newErrors.primaryPhone = 'প্রাথমিক ফোন নম্বর আবশ্যক';
    else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.primaryPhone.trim())) newErrors.primaryPhone = 'সঠিক বাংলাদেশী ফোন নম্বর দিন';
    if (formData.secondaryPhone?.trim() && !/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.secondaryPhone.trim())) newErrors.secondaryPhone = 'সঠিক বাংলাদেশী ফোন নম্বর দিন';
    if (!formData.email?.trim()) newErrors.email = 'ইমেইল আবশ্যক';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'সঠিক ইমেইল ফরম্যাট দিন';
    if (formData.website?.trim() && !/^https?:\/\/.+\..+/.test(formData.website.trim())) newErrors.website = 'সঠিক ওয়েবসাইট ইউআরএল দিন (http:// or https://)';
    if (!formData.establishmentDate) newErrors.establishmentDate = 'প্রতিষ্ঠা সাল আবশ্যক';
    if (!formData.chairman?.name?.trim()) newErrors['chairman.name'] = 'চেয়ারম্যানের নাম আবশ্যক';
    if (!formData.chairman?.mobile?.trim()) newErrors['chairman.mobile'] = 'চেয়ারম্যানের মোবাইল আবশ্যক';
    else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.chairman.mobile.trim())) newErrors['chairman.mobile'] = 'সঠিক বাংলাদেশী ফোন নম্বর দিন';
    if (!formData.secretary?.name?.trim()) newErrors['secretary.name'] = 'সচিবের নাম আবশ্যক';
    if (!formData.secretary?.mobile?.trim()) newErrors['secretary.mobile'] = 'সচিবের মোবাইল আবশ্যক';
    else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.secretary.mobile.trim())) newErrors['secretary.mobile'] = 'সঠিক বাংলাদেশী ফোন নম্বর দিন';
    
    if (logoFile && logoFile.size > 2 * 1024 * 1024) { // 2MB limit
        newErrors.logoFile = 'লোগো ফাইলের সর্বোচ্চ সাইজ ২ মেগাবাইট।';
    }
    if (logoFile && !['image/jpeg', 'image/png', 'image/gif'].includes(logoFile.type)) {
        newErrors.logoFile = 'লোগো ফাইল অবশ্যই JPG, PNG, অথবা GIF ফরম্যাটে হতে হবে।';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<BoardProfileDbRow>) => {
        const { data, error } = await supabase.rpc('upsert_board_profile', { p_profile_data: profileData });
        if (error) throw error;
        return data;
    },
    onSuccess: (data) => {
        addToast('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', 'success');
        queryClient.setQueryData(['boardProfile'], mapDbRowToFrontend(data as BoardProfileDbRow));
        setIsEditMode(false);
        setLogoFile(null);
    },
    onError: (error: PostgrestError | Error) => {
        addToast(`প্রোফাইল আপডেট করতে সমস্যা: ${error.message}`, 'error');
    }
  });

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
      return;
    }

    let uploadedLogoUrl = formData.logoUrl;
    if (logoFile) {
      try {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration missing.");
        uploadedLogoUrl = await uploadToCloudinary(logoFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      } catch (uploadError: any) {
        setErrors((prev:any) => ({ ...prev, logoFile: uploadError.message }));
        addToast(uploadError.message, 'error');
        return;
      }
    }
    
    const dbPayload: Partial<BoardProfileDbRow> = {
        id: 'MAIN_PROFILE', // Fixed ID
        board_name_bn: formData.boardNameBn,
        board_name_en: formData.boardNameEn,
        address: formData.address ? {
            holding: formData.address.holding || null,
            village_area: formData.address.villageArea,
            post_office: formData.address.postOffice,
            upazila: formData.address.upazila,
            district: formData.address.district,
            division: formData.address.division,
        } : undefined,
        primary_phone: formData.primaryPhone,
        secondary_phone: formData.secondaryPhone || null,
        email: formData.email,
        website: formData.website || null,
        logo_url: uploadedLogoUrl || null,
        establishment_date: formData.establishmentDate,
        chairman: formData.chairman ? {
            name: formData.chairman.name,
            mobile: formData.chairman.mobile,
            email: formData.chairman.email || null,
        } : undefined,
        secretary: formData.secretary ? {
            name: formData.secretary.name,
            mobile: formData.secretary.mobile,
            email: formData.secretary.email || null,
        } : undefined,
    };
    updateProfileMutation.mutate(dbPayload);
  };

  if (isLoading && !boardProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-2" />
        <p className="text-xl text-gray-700">প্রোফাইল তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }
  if (error) return <div className="text-red-500 p-4">ত্রুটি: {error.message}</div>;
  
  const displayData = isEditMode ? formData : boardProfile;

  const DetailItem: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start py-1.5">
      {icon && <span className="mr-2 text-emerald-600 mt-0.5">{icon}</span>}
      <span className="text-sm text-gray-600 w-32 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-800 break-words">{value || <span className="italic text-gray-400">নেই</span>}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">প্রতিষ্ঠানের পরিচিতি</h2>
        {!isEditMode && (
          <Button onClick={() => setIsEditMode(true)} leftIcon={<PencilIcon className="w-4 h-4"/>} variant="primary">
            তথ্য সম্পাদনা করুন
          </Button>
        )}
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
          {/* Logo and Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start p-6 border-b">
            {isEditMode ? (
              <div className="w-full md:w-1/3 mb-4 md:mb-0 md:mr-6">
                 <FileUpload 
                    id="logoUpload" 
                    label="বোর্ডের লোগো" 
                    onFileChange={handleLogoChange} 
                    acceptedFileTypes="image/png, image/jpeg, image/gif"
                    fileNameDisplay={logoFile?.name || formData.logoUrl?.split('/').pop()}
                    buttonText="নতুন লোগো নির্বাচন"
                    error={errors.logoFile}
                />
                {formData.logoUrl && !logoFile && <img src={formData.logoUrl} alt="Current Logo" className="mt-2 w-32 h-32 object-contain rounded border p-1"/>}
              </div>
            ) : (
              displayData?.logoUrl ? (
                <img src={displayData.logoUrl} alt="Board Logo" className="w-32 h-32 object-contain rounded-md shadow-md mb-4 md:mb-0 md:mr-6" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-sm mb-4 md:mb-0 md:mr-6">লোগো নেই</div>
              )
            )}
            <div className="flex-1 space-y-1">
              {isEditMode ? (
                <>
                  <Input label="বোর্ডের নাম (বাংলা)" name="boardNameBn" value={formData.boardNameBn || ''} onChange={handleInputChange} error={errors.boardNameBn} required />
                  <Input label="বোর্ডের নাম (ইংরেজি)" name="boardNameEn" value={formData.boardNameEn || ''} onChange={handleInputChange} error={errors.boardNameEn} required />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-emerald-700">{displayData?.boardNameBn || APP_TITLE_BN}</h1>
                  <p className="text-lg text-gray-600">{displayData?.boardNameEn || APP_TITLE_EN}</p>
                </>
              )}
              {isEditMode ? (
                <CustomDatePicker id="establishmentDate" label="প্রতিষ্ঠা সাল" value={formData.establishmentDate} onChange={(dateStr) => handleDateChange(dateStr, 'establishmentDate')} error={errors.establishmentDate} required/>
              ) : (
                <DetailItem label="প্রতিষ্ঠা সাল" value={displayData?.establishmentDate ? new Date(displayData.establishmentDate).toLocaleDateString('bn-BD', {year: 'numeric', month:'long', day:'numeric'}) : 'N/A'} icon={<CalendarDaysIcon className="w-4 h-4"/>} />
              )}
            </div>
          </div>

          {/* Contact & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b">
            <div className="space-y-2">
              <h3 className="text-md font-semibold text-gray-700 mb-1">যোগাযোগের তথ্য</h3>
              {isEditMode ? (
                <>
                  <Input label="প্রাথমিক ফোন" name="primaryPhone" value={formData.primaryPhone || ''} onChange={handleInputChange} error={errors.primaryPhone} required icon={<PhoneIcon className="w-4 h-4"/>}/>
                  <Input label="দ্বিতীয় ফোন (ঐচ্ছিক)" name="secondaryPhone" value={formData.secondaryPhone || ''} onChange={handleInputChange} error={errors.secondaryPhone} icon={<PhoneIcon className="w-4 h-4"/>}/>
                  <Input label="ইমেইল" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} error={errors.email} required icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                  <Input label="ওয়েবসাইট (ঐচ্ছিক)" name="website" value={formData.website || ''} onChange={handleInputChange} error={errors.website} icon={<GlobeAltIcon className="w-4 h-4"/>}/>
                </>
              ) : (
                <>
                  <DetailItem label="প্রাথমিক ফোন" value={displayData?.primaryPhone} icon={<PhoneIcon className="w-4 h-4"/>}/>
                  <DetailItem label="দ্বিতীয় ফোন" value={displayData?.secondaryPhone} icon={<PhoneIcon className="w-4 h-4"/>}/>
                  <DetailItem label="ইমেইল" value={displayData?.email} icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                  <DetailItem label="ওয়েবসাইট" value={displayData?.website} icon={<GlobeAltIcon className="w-4 h-4"/>}/>
                </>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-md font-semibold text-gray-700 mb-1">ঠিকানা</h3>
              {isEditMode ? (
                <>
                  <Input label="হোল্ডিং/রোড (ঐচ্ছিক)" value={formData.address?.holding || ''} onChange={(e) => handleInputChange(e, 'address', 'holding')} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <Input label="গ্রাম/এলাকা" value={formData.address?.villageArea || ''} onChange={(e) => handleInputChange(e, 'address', 'villageArea')} error={errors['address.villageArea']} required icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <Input label="পোস্ট অফিস" value={formData.address?.postOffice || ''} onChange={(e) => handleInputChange(e, 'address', 'postOffice')} error={errors['address.postOffice']} required icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <Select label="বিভাগ" value={formData.address?.division || ''} onChange={(e) => handleInputChange(e, 'address', 'division')} options={divisionOptions} error={errors['address.division']} placeholderOption="বিভাগ নির্বাচন" required/>
                  <Select label="জেলা" value={formData.address?.district || ''} onChange={(e) => handleInputChange(e, 'address', 'district')} options={availableDistricts} error={errors['address.district']} placeholderOption="জেলা নির্বাচন" required disabled={!formData.address?.division || availableDistricts.length === 0}/>
                  <Select label="উপজেলা" value={formData.address?.upazila || ''} onChange={(e) => handleInputChange(e, 'address', 'upazila')} options={availableUpazilas} error={errors['address.upazila']} placeholderOption="উপজেলা নির্বাচন" required disabled={!formData.address?.district || availableUpazilas.length === 0}/>
                </>
              ) : (
                <>
                  <DetailItem label="হোল্ডিং/রোড" value={displayData?.address?.holding} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <DetailItem label="গ্রাম/এলাকা" value={displayData?.address?.villageArea} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <DetailItem label="পোস্ট অফিস" value={displayData?.address?.postOffice} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <DetailItem label="উপজেলা" value={displayData?.address?.upazila} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <DetailItem label="জেলা" value={displayData?.address?.district} icon={<MapPinIcon className="w-4 h-4"/>}/>
                  <DetailItem label="বিভাগ" value={displayData?.address?.division} icon={<MapPinIcon className="w-4 h-4"/>}/>
                </>
              )}
            </div>
          </div>

          {/* Officials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
             <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-700 mb-1">চেয়ারম্যান</h3>
                {isEditMode ? (
                    <>
                        <Input label="নাম" value={formData.chairman?.name || ''} onChange={e => handleInputChange(e, 'chairman', 'name')} error={errors['chairman.name']} required icon={<UserCircleIcon className="w-4 h-4"/>}/>
                        <Input label="মোবাইল" value={formData.chairman?.mobile || ''} onChange={e => handleInputChange(e, 'chairman', 'mobile')} error={errors['chairman.mobile']} required icon={<PhoneIcon className="w-4 h-4"/>}/>
                        <Input label="ইমেইল (ঐচ্ছিক)" type="email" value={formData.chairman?.email || ''} onChange={e => handleInputChange(e, 'chairman', 'email')} icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                    </>
                ) : (
                    <>
                        <DetailItem label="নাম" value={displayData?.chairman?.name} icon={<UserCircleIcon className="w-4 h-4"/>}/>
                        <DetailItem label="মোবাইল" value={displayData?.chairman?.mobile} icon={<PhoneIcon className="w-4 h-4"/>}/>
                        <DetailItem label="ইমেইল" value={displayData?.chairman?.email} icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                    </>
                )}
             </div>
             <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-700 mb-1">সচিব</h3>
                 {isEditMode ? (
                    <>
                        <Input label="নাম" value={formData.secretary?.name || ''} onChange={e => handleInputChange(e, 'secretary', 'name')} error={errors['secretary.name']} required icon={<UserCircleIcon className="w-4 h-4"/>}/>
                        <Input label="মোবাইল" value={formData.secretary?.mobile || ''} onChange={e => handleInputChange(e, 'secretary', 'mobile')} error={errors['secretary.mobile']} required icon={<PhoneIcon className="w-4 h-4"/>}/>
                        <Input label="ইমেইল (ঐচ্ছিক)" type="email" value={formData.secretary?.email || ''} onChange={e => handleInputChange(e, 'secretary', 'email')} icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                    </>
                ) : (
                    <>
                        <DetailItem label="নাম" value={displayData?.secretary?.name} icon={<UserCircleIcon className="w-4 h-4"/>}/>
                        <DetailItem label="মোবাইল" value={displayData?.secretary?.mobile} icon={<PhoneIcon className="w-4 h-4"/>}/>
                        <DetailItem label="ইমেইল" value={displayData?.secretary?.email} icon={<EnvelopeIcon className="w-4 h-4"/>}/>
                    </>
                )}
             </div>
          </div>
          
          {errors.apiError && <p className="text-sm text-red-500 p-4">{errors.apiError}</p>}

          {isEditMode && (
            <div className="p-6 border-t flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => { setIsEditMode(false); setFormData(boardProfile || {}); setErrors({}); setLogoFile(null); }}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
