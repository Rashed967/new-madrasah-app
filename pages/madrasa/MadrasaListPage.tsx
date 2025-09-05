
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData, QueryKey } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileUpload } from '../../components/ui/FileUpload';
import { Madrasa, MadrasaType, MadrasaPerson, MadrasaAddress, SelectOption, MarhalaApiResponse, ZoneApiResponse as FrontendZoneApiResponse, MadrasaDbRow, Division as DivisionType, District as DistrictType, Upazila as UpazilaType, Marhala } from '../../types';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, ChevronDownIcon, PaperClipIcon, XMarkIcon, ChevronUpIcon, ArrowsUpDownIcon, BuildingOffice2Icon, MapPinIcon, UserCircleIcon, CheckCircleIcon as ReviewIcon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../contexts/ToastContext';
import { DIVISIONS_BD, MADRASA_TYPE_OPTIONS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, DISPATCH_METHOD_OPTIONS } from '../../constants';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const mapMadrasaDbRowToFrontend = (dbRow: MadrasaDbRow): Madrasa => ({
    id: dbRow.id, madrasaCode: dbRow.madrasa_code, nameBn: dbRow.name_bn, nameAr: dbRow.name_ar, nameEn: dbRow.name_en || undefined,
    address: { 
        holding: dbRow.address?.holding || undefined, 
        village: dbRow.address.village, 
        postOffice: dbRow.address?.post_office || undefined, // Map post_office
        upazila: dbRow.address.upazila, 
        district: dbRow.address.district, 
        division: dbRow.address.division, 
        contactPersonName: dbRow.address.contact_person_name, 
    },
    zoneId: dbRow.zone_id, mobile1: dbRow.mobile1, mobile2: dbRow.mobile2 || undefined, type: dbRow.type,
    dispatchMethod: dbRow.dispatch_method, // Added dispatchMethod
    highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined, highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
    muhtamim: { name: dbRow.muhtamim.name, mobile: dbRow.muhtamim.mobile, nidNumber: dbRow.muhtamim.nid_number || undefined, qualification: dbRow.muhtamim.qualification || undefined, },
    educationSecretary: dbRow.education_secretary ? { name: dbRow.education_secretary.name, mobile: dbRow.education_secretary.mobile, nidNumber: dbRow.education_secretary.nid_number || undefined, qualification: dbRow.education_secretary.qualification || undefined, } : undefined,
    mutawalli: dbRow.mutawalli ? { name: dbRow.mutawalli.name, mobile: dbRow.mutawalli.mobile, nidNumber: dbRow.mutawalli.nid_number || undefined, } : undefined,
    registrationDate: dbRow.registration_date, ilhakFormUrl: dbRow.ilhak_form_url || undefined,
    userId: dbRow.user_id || undefined,
});

interface FetchMadrasasParams {
  page: number;
  limit: number;
  searchTerm: string;
  filters: {
    division?: string;
    district?: string;
    upazila?: string;
    type?: MadrasaType | '';
    zoneId?: string;
  };
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
}

const fetchMadrasasFromDB = async ({ page, limit, searchTerm, filters, sort }: FetchMadrasasParams): Promise<{ items: Madrasa[], totalItems: number }> => {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_madrasas_filtered', {
    p_page: page,
    p_limit: limit,
    p_search_term: searchTerm.trim() || null,
    p_division: filters.division || null,
    p_district: filters.district || null,
    p_upazila: filters.upazila || null,
    p_type: filters.type || null,
    p_zone_id: filters.zoneId || null,
    p_sort_field: sort.field,
    p_sort_order: sort.order,
  });

  if (rpcError) {
    console.error('Error fetching madrasas via RPC:', rpcError);
    throw new Error(rpcError.message || 'মাদরাসা তালিকা আনতে সমস্যা হয়েছে।');
  }
  
  const result = rpcData as { items: MadrasaDbRow[], totalItems: number };
  
  return {
    items: (result.items || []).map(mapMadrasaDbRowToFrontend),
    totalItems: result.totalItems || 0,
  };
};


type MadrasasQueryKey = readonly ['madrasas', FetchMadrasasParams];


const MadrasaListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedMadrasaType, setSelectedMadrasaType] = useState<MadrasaType | ''>('');

  const [isFilterSectionVisible, setIsFilterSectionVisible] = useState(false);


  const [sortField, setSortField] = useState('madrasa_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [districtOptions, setDistrictOptions] = useState<SelectOption[]>([]);
  const [upazilaOptions, setUpazilaOptions] = useState<SelectOption[]>([]);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMadrasaForView, setSelectedMadrasaForView] = useState<Madrasa | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMadrasaForEdit, setSelectedMadrasaForEdit] = useState<Madrasa | null>(null);

  const initialEditFormData: Partial<Madrasa> & { ilhakFormFile?: File | null; removeIlhakForm?: boolean } = {
    nameBn: '', nameAr: '', nameEn: '',
    address: { village: '', postOffice: '', upazila: '', district: '', division: '', holding: '', contactPersonName: '' },
    zoneId: '', mobile1: '', mobile2: '', type: '', dispatchMethod: null,
    highestMarhalaBoysId: '', highestMarhalaGirlsId: '',
    muhtamim: { name: '', mobile: '', nidNumber: '', qualification: '' },
    educationSecretary: { name: '', mobile: '', nidNumber: '', qualification: '' },
    mutawalli: { name: '', mobile: '', nidNumber: '' },
    registrationDate: '', ilhakFormFile: null, ilhakFormUrl: '', removeIlhakForm: false,
  };
  const [editFormData, setEditFormData] = useState<Partial<Madrasa> & { ilhakFormFile?: File | null; removeIlhakForm?: boolean }>(initialEditFormData);

  const [editActiveTab, setEditActiveTab] = useState<string>('general');
  const [editErrors, setEditErrors] = useState<any>({});

  const [allApiZones, setAllApiZones] = useState<FrontendZoneApiResponse[]>([]);
  const [allApiMarhalas, setAllApiMarhalas] = useState<MarhalaApiResponse[]>([]);
  const [allFrontendMarhalas, setAllFrontendMarhalas] = useState<Marhala[]>([]);


  const [editAvailableDistricts, setEditAvailableDistricts] = useState<SelectOption[]>([]);
  const [editAvailableUpazilas, setEditAvailableUpazilas] = useState<SelectOption[]>([]);
  const [editAvailableMarhalasBoys, setEditAvailableMarhalasBoys] = useState<SelectOption[]>([]);
  const [editAvailableMarhalasGirls, setEditAvailableMarhalasGirls] = useState<SelectOption[]>([]);
  const [isEduSecOpen, setIsEduSecOpen] = useState(false);
  const [isMutawalliOpen, setIsMutawalliOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [madrasaToDelete, setMadrasaToDelete] = useState<Madrasa | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, itemsPerPage, selectedDivision, selectedDistrict, selectedUpazila, selectedMadrasaType, sortField, sortOrder]);

  const queryParams: FetchMadrasasParams = useMemo(() => ({
    page: currentPage, limit: itemsPerPage, searchTerm: debouncedSearchTerm,
    filters: { division: selectedDivision, district: selectedDistrict, upazila: selectedUpazila, type: selectedMadrasaType, zoneId: '', },
    sort: { field: sortField, order: sortOrder },
  }), [currentPage, itemsPerPage, debouncedSearchTerm, selectedDivision, selectedDistrict, selectedUpazila, selectedMadrasaType, sortField, sortOrder]);

  const { data: madrasaData, isLoading, error: fetchMadrasasError, refetch } = useQuery< { items: Madrasa[], totalItems: number }, Error, { items: Madrasa[], totalItems: number }, MadrasasQueryKey >({
    queryKey: ['madrasas', queryParams] as MadrasasQueryKey,
    queryFn: () => fetchMadrasasFromDB(queryParams),
    placeholderData: keepPreviousData,
  });

  const { data: zonesDataResult, isLoading: isLoadingZones, error: zonesError } = useQuery<FrontendZoneApiResponse[], Error>({
    queryKey: ['allZonesForMadrasaListEdit'],
    queryFn: async () => { const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts'); if (error) throw error; return data || []; },
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => { if (zonesDataResult) setAllApiZones(zonesDataResult); }, [zonesDataResult]);

  const { data: marhalasDataResult, isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<MarhalaApiResponse[], Error>({
    queryKey: ['allMarhalasForMadrasaListEdit'],
    queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('id, name_bn, type, category, marhala_code, kitab_ids, created_at, marhala_order'); if (error) throw error; return data || []; },
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (marhalasDataResult) {
        setAllApiMarhalas(marhalasDataResult);
        setAllFrontendMarhalas(marhalasDataResult.map(m => ({ id: m.id, nameBn: m.name_bn, type: m.type, category: m.category, kitabIds: m.kitab_ids, marhala_code: m.marhala_code, marhala_order: m.marhala_order } as Marhala)));
    }
  }, [marhalasDataResult]);

  useEffect(() => {
    if (fetchMadrasasError) addToast(fetchMadrasasError.message || 'মাদরাসা তালিকা আনতে ত্রুটি হয়েছে।', 'error');
    if (zonesError) addToast(zonesError.message || 'জোন তালিকা আনতে ত্রুটি হয়েছে।', 'error');
    if (marhalasError) addToast(marhalasError.message || 'মারহালা তালিকা আনতে ত্রুটি হয়েছে।', 'error');
  }, [fetchMadrasasError, zonesError, marhalasError, addToast]);

  const madrasaList = madrasaData?.items || [];
  const totalItems = madrasaData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    if (selectedDivision) { const d = DIVISIONS_BD.find(div => div.value === selectedDivision); setDistrictOptions(d ? d.districts.map(dist => ({ value: dist.value, label: dist.label })) : []); setSelectedDistrict(''); setSelectedUpazila(''); setUpazilaOptions([]); }
    else { setDistrictOptions([]); setSelectedDistrict(''); setSelectedUpazila(''); setUpazilaOptions([]); }
  }, [selectedDivision]);

  useEffect(() => {
    if (selectedDistrict && selectedDivision) { const divD = DIVISIONS_BD.find(d => d.value === selectedDivision); const distD = divD?.districts.find(d => d.value === selectedDistrict); setUpazilaOptions(distD ? distD.upazilas.map(up => ({ value: up.value, label: up.label })) : []); setSelectedUpazila('');}
    else { setUpazilaOptions([]); setSelectedUpazila('');}
  }, [selectedDistrict, selectedDivision]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const divisionFilterOptions = useMemo(() => [{value: '', label: 'সকল বিভাগ'}, ...DIVISIONS_BD.map(d => ({value: d.value, label: d.label}))], []);
  const districtFilterOptions = useMemo(() => [{value: '', label: 'সকল জেলা'}, ...districtOptions], [districtOptions]);
  const upazilaFilterOptions = useMemo(() => [{value: '', label: 'সকল উপজেলা/থানা'}, ...upazilaOptions], [upazilaOptions]);
  const typeFilterOptions = useMemo(() => [{value: '', label: 'সকল ধরণ'}, ...MADRASA_TYPE_OPTIONS], []);

  const getMarhalaName = useCallback((marhalaId?: string): string => allFrontendMarhalas.find(m => m.id === marhalaId)?.nameBn || 'N/A', [allFrontendMarhalas]);
  const getZoneName = useCallback((zoneId?: string): string => allApiZones.find(z => z.id === zoneId)?.name_bn || 'N/A', [allApiZones]);

  const zoneOptionsForEdit: SelectOption[] = useMemo(() => allApiZones.map(zone => ({ value: zone.id, label: `${zone.name_bn} (${zone.zone_code})` })), [allApiZones]);
  const divisionOptionsForEdit: SelectOption[] = useMemo(() => DIVISIONS_BD.map(div => ({ value: div.value, label: div.label })),[]);

  useEffect(() => {
    if (isEditModalOpen && editFormData.address?.division) {
        const selectedDiv = DIVISIONS_BD.find(d => d.value === editFormData.address!.division);
        setEditAvailableDistricts(selectedDiv ? selectedDiv.districts.map(d => ({value: d.value, label: d.label})) : []);
        if (editFormData.address && editFormData.address.district && !selectedDiv?.districts.find(d => d.value === editFormData.address!.district)) {
            setEditFormData(prev => ({...prev, address: {...prev.address!, district: '', upazila: ''}}));
        }
        setEditAvailableUpazilas([]);
    } else if (isEditModalOpen) {
        setEditAvailableDistricts([]);
        setEditAvailableUpazilas([]);
    }
  }, [isEditModalOpen, editFormData.address?.division]);

  useEffect(() => {
    if (isEditModalOpen && editFormData.address?.district) {
        const selectedDivData = DIVISIONS_BD.find(d => d.value === editFormData.address!.division);
        const selectedDistData = selectedDivData?.districts.find(d => d.value === editFormData.address!.district);
        setEditAvailableUpazilas(selectedDistData ? selectedDistData.upazilas.map(u => ({value: u.value, label: u.label})) : []);
        if (editFormData.address && editFormData.address.upazila && !selectedDistData?.upazilas.find(u => u.value === editFormData.address!.upazila)) {
            setEditFormData(prev => ({...prev, address: {...prev.address!, upazila: ''}}));
        }
    } else if (isEditModalOpen) {
        setEditAvailableUpazilas([]);
    }
  }, [isEditModalOpen, editFormData.address?.district, editFormData.address?.division]);

  useEffect(() => {
    if (isEditModalOpen && editFormData.type) {
        const boyMarhalas = allFrontendMarhalas.filter(m => m.type === 'boys').map(m => ({ value: m.id, label: `${m.nameBn} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'}` }));
        const girlMarhalas = allFrontendMarhalas.filter(m => m.type === 'girls').map(m => ({ value: m.id, label: `${m.nameBn} - ${m.category === 'darsiyat' ? 'দরসিয়াত' : 'হিফজ'}` }));
        if (editFormData.type === 'boys') { setEditAvailableMarhalasBoys(boyMarhalas); setEditAvailableMarhalasGirls([]); if(editFormData.highestMarhalaGirlsId) setEditFormData(prev => ({...prev, highestMarhalaGirlsId: ''})); }
        else if (editFormData.type === 'girls') { setEditAvailableMarhalasBoys([]); setEditAvailableMarhalasGirls(girlMarhalas); if(editFormData.highestMarhalaBoysId) setEditFormData(prev => ({...prev, highestMarhalaBoysId: ''})); }
        else if (editFormData.type === 'both') { setEditAvailableMarhalasBoys(boyMarhalas); setEditAvailableMarhalasGirls(girlMarhalas); }
        else { setEditAvailableMarhalasBoys([]); setEditAvailableMarhalasGirls([]); }
    }
  }, [isEditModalOpen, editFormData.type, allFrontendMarhalas]);

  const handleViewClick = (madrasa: Madrasa) => { setSelectedMadrasaForView(madrasa); setIsViewModalOpen(true); };

  const handleEditClick = (madrasa: Madrasa) => {
    setSelectedMadrasaForEdit(madrasa);
    setEditFormData({
        ...madrasa,
        address: { ...madrasa.address },
        muhtamim: { ...madrasa.muhtamim },
        educationSecretary: madrasa.educationSecretary ? { ...madrasa.educationSecretary } : undefined,
        mutawalli: madrasa.mutawalli ? { ...madrasa.mutawalli } : undefined,
        ilhakFormFile: null,
        removeIlhakForm: false,
    });
    setIsEduSecOpen(!!madrasa.educationSecretary?.name);
    setIsMutawalliOpen(!!madrasa.mutawalli?.name);
    setEditActiveTab('general');
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    section?: keyof Omit<Madrasa, 'address'|'muhtamim'|'educationSecretary'|'mutawalli'> | 'address' | 'muhtamim' | 'educationSecretary' | 'mutawalli',
    field?: string
  ) => {
    const { name, value } = e.target;
    let updatedFormData = { ...editFormData };

    if (section === 'address') {
      updatedFormData.address = { ...(updatedFormData.address as MadrasaAddress), [field || name]: value };
    } else if (section === 'muhtamim' || section === 'educationSecretary' || section === 'mutawalli') {
      updatedFormData[section] = { ...(updatedFormData[section] as MadrasaPerson | undefined), [field || name]: value };
    } else {
      (updatedFormData as any)[name] = value;
    }
    setEditFormData(updatedFormData);

    const targetElement = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const fieldNameForError = section ? (field || name) : name;
    const errorKey = section === 'address' ? `address.${fieldNameForError}` :
                     section === 'muhtamim' ? `muhtamim.${fieldNameForError}` :
                     section === 'educationSecretary' ? `educationSecretary.${fieldNameForError}` :
                     section === 'mutawalli' ? `mutawalli.${fieldNameForError}` :
                     name;

    if (value.trim() === '' && targetElement.required) {
        setEditErrors((prev: any) => ({ ...prev, [errorKey]: 'এই ফিল্ডটি আবশ্যক।' }));
    } else if ((name === 'mobile1' || name === 'mobile2' || (section && field ==='mobile')) && value && !/^(01[3-9]\d{8})$/.test(value)) {
        setEditErrors((prev: any) => ({ ...prev, [errorKey]: 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)।' }));
    } else if ((name === 'nidNumber' || (section && field ==='nidNumber')) && value && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(value)) {
        setEditErrors((prev: any) => ({ ...prev, [errorKey]: 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।' }));
    } else {
        setEditErrors((prev: any) => { const newErrors = { ...prev }; delete newErrors[errorKey]; return newErrors; });
    }
  };

  const handleEditFileChange = (file: File | null) => {
    setEditFormData(prev => ({ ...prev, ilhakFormFile: file, removeIlhakForm: false }));
    if (editErrors.ilhakFormFile) setEditErrors((prev:any) => ({...prev, ilhakFormFile: undefined}));
  };

  const handleRemoveIlhakFormToggle = () => {
    setEditFormData(prev => ({...prev, removeIlhakForm: !prev.removeIlhakForm, ilhakFormFile: prev.removeIlhakForm ? prev.ilhakFormFile : null}));
  };

  const validateEditForm = (): boolean => {
    const newErrors: any = {};
    if (!editFormData.nameBn?.trim()) newErrors.nameBn = 'মাদ্রাসার বাংলা নাম আবশ্যক';
    if (!editFormData.nameAr?.trim()) newErrors.nameAr = 'মাদ্রাসার আরবী নাম আবশ্যক';
    if (!editFormData.type) newErrors.type = 'মাদ্রাসার ধরণ নির্বাচন করুন';
    if (editFormData.type === 'boys' && !editFormData.highestMarhalaBoysId) newErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
    if (editFormData.type === 'girls' && !editFormData.highestMarhalaGirlsId) newErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
    if (editFormData.type === 'both') {
        if(!editFormData.highestMarhalaBoysId) newErrors.highestMarhalaBoysId = 'বালকদের সর্বোচ্চ মারহালা নির্বাচন করুন';
        if(!editFormData.highestMarhalaGirlsId) newErrors.highestMarhalaGirlsId = 'বালিকাদের সর্বোচ্চ মারহালা নির্বাচন করুন';
    }
    if (!editFormData.zoneId) newErrors.zoneId = 'জোন নির্বাচন করুন';
    if (!editFormData.registrationDate) newErrors.registrationDate = 'নিবন্ধনের তারিখ আবশ্যক';

    if (!editFormData.address?.division) newErrors['address.division'] = 'বিভাগ আবশ্যক';
    if (!editFormData.address?.district) newErrors['address.district'] = 'জেলা আবশ্যক';
    if (!editFormData.address?.upazila) newErrors['address.upazila'] = 'উপজেলা/থানা আবশ্যক';
    if (!editFormData.address?.village?.trim()) newErrors['address.village'] = 'গ্রাম/মহল্লার নাম আবশ্যক';
    if (!editFormData.address?.postOffice?.trim()) newErrors['address.postOffice'] = 'পোস্ট অফিসের নাম আবশ্যক';
    if (!editFormData.address?.contactPersonName?.trim()) newErrors['address.contactPersonName'] = 'যোগাযোগকারীর নাম আবশ্যক';
    if (!editFormData.mobile1?.trim()) newErrors.mobile1 = 'প্রথম মোবাইল নম্বর আবশ্যক';
    else if (!/^(01[3-9]\d{8})$/.test(editFormData.mobile1)) newErrors.mobile1 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
    if (editFormData.mobile2 && editFormData.mobile2.trim() !== '' && !/^(01[3-9]\d{8})$/.test(editFormData.mobile2)) newErrors.mobile2 = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';

    if (!editFormData.muhtamim?.name?.trim()) newErrors['muhtamim.name'] = 'মুহতামিমের নাম আবশ্যক';
    if (!editFormData.muhtamim?.mobile?.trim()) newErrors['muhtamim.mobile'] = 'মুহতামিমের মোবাইল নম্বর আবশ্যক';
    else if (editFormData.muhtamim?.mobile && !/^(01[3-9]\d{8})$/.test(editFormData.muhtamim.mobile)) newErrors['muhtamim.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
    if (editFormData.muhtamim?.nidNumber && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(editFormData.muhtamim.nidNumber)) newErrors['muhtamim.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
    if (!editFormData.muhtamim?.qualification?.trim()) newErrors['muhtamim.qualification'] = 'মুহতামিমের শিক্ষাগত যোগ্যতা আবশ্যক';

    if (editFormData.educationSecretary?.mobile && editFormData.educationSecretary.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(editFormData.educationSecretary.mobile)) newErrors['educationSecretary.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
    if (editFormData.educationSecretary?.nidNumber && editFormData.educationSecretary.nidNumber.trim() !== '' && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(editFormData.educationSecretary.nidNumber)) newErrors['educationSecretary.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';
    if (editFormData.mutawalli?.mobile && editFormData.mutawalli.mobile.trim() !== '' && !/^(01[3-9]\d{8})$/.test(editFormData.mutawalli.mobile)) newErrors['mutawalli.mobile'] = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)';
    if (editFormData.mutawalli?.nidNumber && editFormData.mutawalli.nidNumber.trim() !== '' && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(editFormData.mutawalli.nidNumber)) newErrors['mutawalli.nidNumber'] = 'সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যার)।';

    if (editFormData.ilhakFormFile && editFormData.ilhakFormFile.type !== 'application/pdf') newErrors.ilhakFormFile = 'শুধুমাত্র পিডিএফ ফাইল আপলোড করুন।';
    else if (editFormData.ilhakFormFile && editFormData.ilhakFormFile.size > 5 * 1024 * 1024) newErrors.ilhakFormFile = 'ফাইলের সর্বোচ্চ সাইজ ৫ মেগাবাইট।';

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMadrasaMutation = useMutation({
    mutationFn: async (updatedData: { id: string, payload: any}) => {
      const { data, error } = await supabase.rpc('update_madrasa', { p_madrasa_id: updatedData.id, p_updates: updatedData.payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['madrasas', queryParams] });
      setIsEditModalOpen(false);
      addToast('মাদরাসার তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `মাদরাসা আপডেট করতে সমস্যা হয়েছে: ${error.message}`;
        if (error && typeof error === 'object' && 'code' in error) {
            const typedError = error as SupabasePostgrestError;
            if (typedError.code === '23505' && typedError.message.includes('name_bn')) { 
                setEditErrors(prev => ({ ...prev, nameBn: 'এই বাংলা নামে একটি মাদরাসা ইতিমধ্যে বিদ্যমান।', apiError: undefined }));
                userMessage = 'এই বাংলা নামে একটি মাদরাসা ইতিমধ্যে বিদ্যমান।';
            } else if (typedError.code === '23505' && typedError.message.includes('name_ar')) {
                 setEditErrors(prev => ({ ...prev, nameAr: 'এই আরবী নামে একটি মাদরাসা ইতিমধ্যে বিদ্যমান।', apiError: undefined }));
                userMessage = 'এই আরবী নামে একটি মাদরাসা ইতিমধ্যে বিদ্যমান।';
            }
            else {
                setEditErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else {
             setEditErrors(prev => ({ ...prev, apiError: userMessage }));
        }
      addToast(userMessage, 'error');
    },
  });

  const handleSaveChanges = async () => {
    if (!selectedMadrasaForEdit || !validateEditForm()) { addToast('ফর্মটিতে ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error'); return; }
    setEditErrors(prev => ({ ...prev, apiError: undefined }));

    let newIlhakFormUrl = editFormData.ilhakFormUrl;
    if(editFormData.removeIlhakForm) newIlhakFormUrl = undefined;

    if (editFormData.ilhakFormFile) {
        try {
            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration missing.");
            newIlhakFormUrl = await uploadToCloudinary(editFormData.ilhakFormFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
        } catch (uploadError: any) {
            setEditErrors(prev => ({ ...prev, ilhakFormFile: uploadError.message, apiError: uploadError.message }));
            addToast(uploadError.message, 'error');
            setEditActiveTab('ilhakForm');
            return;
        }
    }

    const dbAddressPayload = editFormData.address ? {
        holding: editFormData.address.holding || null, village: editFormData.address.village, 
        post_office: editFormData.address.postOffice || null, 
        upazila: editFormData.address.upazila,
        district: editFormData.address.district, division: editFormData.address.division, contact_person_name: editFormData.address.contactPersonName,
    } : null;

    const mapToDbPerson = (person?: MadrasaPerson): any => person && person.name ? ({ name: person.name, mobile: person.mobile, nid_number: person.nidNumber || null, qualification: person.qualification || null }) : null;
    const mapToDbMutawalli = (person?: MadrasaPerson): any => person && person.name ? ({ name: person.name, mobile: person.mobile, nid_number: person.nidNumber || null }) : null;

    const payload = {
      name_bn: editFormData.nameBn!, name_ar: editFormData.nameAr!, name_en: editFormData.nameEn || null, address: dbAddressPayload,
      zone_id: editFormData.zoneId!, mobile1: editFormData.mobile1!, mobile2: editFormData.mobile2 || null, type: editFormData.type!,
      dispatch_method: editFormData.dispatchMethod || null,
      highest_marhala_boys_id: editFormData.type === 'girls' ? null : editFormData.highestMarhalaBoysId || null,
      highest_marhala_girls_id: editFormData.type === 'boys' ? null : editFormData.highestMarhalaGirlsId || null,
      muhtamim: mapToDbPerson(editFormData.muhtamim)!, education_secretary: mapToDbPerson(editFormData.educationSecretary),
      mutawalli: mapToDbMutawalli(editFormData.mutawalli), registration_date: editFormData.registrationDate!, ilhak_form_url: newIlhakFormUrl,
    };
    updateMadrasaMutation.mutate({ id: selectedMadrasaForEdit.id, payload });
  };

  const deleteMadrasaMutation = useMutation({
    mutationFn: async (madrasaId: string) => {
      const { error } = await supabase.rpc('delete_madrasa', { p_madrasa_id: madrasaId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['madrasas', queryParams] });
      setIsDeleteAlertOpen(false);
      addToast('মাদরাসা সফলভাবে মুছে ফেলা হয়েছে।', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
      addToast(`মাদরাসা মুছে ফেলতে সমস্যা হয়েছে: ${error.message}`, 'error');
      setIsDeleteAlertOpen(false);
    },
  });

  const handleDeleteClick = (madrasa: Madrasa) => { setMadrasaToDelete(madrasa); setIsDeleteAlertOpen(true); };
  const confirmDelete = () => { if (madrasaToDelete) deleteMadrasaMutation.mutate(madrasaToDelete.id); };

  const getMadrasaTypeLabel = (type?: MadrasaType) => MADRASA_TYPE_OPTIONS.find(o => o.value === type)?.label || 'অজানা';

  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (<div><p className="text-sm text-gray-500">{label}</p><p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>);

  const editMadrasaTabs = selectedMadrasaForEdit && editFormData ? [
    { id: 'general', label: 'সাধারণ তথ্য', icon: <BuildingOffice2Icon className="w-4 h-4"/>, content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <Input label="নাম (বাংলা)" name="nameBn" value={editFormData.nameBn} onChange={handleEditFormChange} error={editErrors.nameBn} required />
            <Input label="নাম (আরবী)" name="nameAr" value={editFormData.nameAr} onChange={handleEditFormChange} error={editErrors.nameAr} style={{ direction: 'rtl', textAlign: 'right' }} required />
            <Input label="নাম (ইংরেজি) (ঐচ্ছিক)" name="nameEn" value={editFormData.nameEn} onChange={handleEditFormChange} />
            <Input label="নিবন্ধনের তারিখ" name="registrationDate" type="date" value={editFormData.registrationDate?.split('T')[0]} onChange={handleEditFormChange} error={editErrors.registrationDate} required />
            <Select label="মাদ্রাসার ধরণ" name="type" value={editFormData.type} onChange={(e) => handleEditFormChange(e)} options={MADRASA_TYPE_OPTIONS} error={editErrors.type} placeholderOption="ধরণ নির্বাচন করুন" required />
            {editFormData.type === 'boys' && <Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={editFormData.highestMarhalaBoysId} onChange={(e) => handleEditFormChange(e)} options={editAvailableMarhalasBoys} error={editErrors.highestMarhalaBoysId} placeholderOption="মারহালা নির্বাচন করুন" required={editFormData.type === 'boys'} disabled={editAvailableMarhalasBoys.length === 0}/>}
            {editFormData.type === 'girls' && <Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={editFormData.highestMarhalaGirlsId} onChange={(e) => handleEditFormChange(e)} options={editAvailableMarhalasGirls} error={editErrors.highestMarhalaGirlsId} placeholderOption="মারহালা নির্বাচন করুন" required={editFormData.type === 'girls'} disabled={editAvailableMarhalasGirls.length === 0}/>}
            {editFormData.type === 'both' && (<><Select label="বালকদের সর্বোচ্চ মারহালা" name="highestMarhalaBoysId" value={editFormData.highestMarhalaBoysId} onChange={(e) => handleEditFormChange(e)} options={editAvailableMarhalasBoys} error={editErrors.highestMarhalaBoysId} placeholderOption="বালক মারহালা" required={editFormData.type === 'both'} disabled={editAvailableMarhalasBoys.length === 0}/><Select label="বালিকাদের সর্বোচ্চ মারহালা" name="highestMarhalaGirlsId" value={editFormData.highestMarhalaGirlsId} onChange={(e) => handleEditFormChange(e)} options={editAvailableMarhalasGirls} error={editErrors.highestMarhalaGirlsId} placeholderOption="বালিকা মারহালা" required={editFormData.type === 'both'} disabled={editAvailableMarhalasGirls.length === 0}/></>)}
            <Select label="জোন" name="zoneId" value={editFormData.zoneId} onChange={(e) => handleEditFormChange(e)} options={zoneOptionsForEdit} error={editErrors.zoneId} placeholderOption="জোন নির্বাচন করুন" required disabled={zoneOptionsForEdit.length === 0} />
            <Select label="চিঠি প্রেরণের মাধ্যম" name="dispatchMethod" value={editFormData.dispatchMethod} onChange={handleEditFormChange} options={DISPATCH_METHOD_OPTIONS} error={editErrors.dispatchMethod} placeholderOption="চিঠি প্রেরণের মাধ্যম নির্বাচন করুন"/>
        </div>
    )},
    { id: 'address', label: 'ঠিকানা', icon: <MapPinIcon className="w-4 h-4"/>, content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <Select label="বিভাগ" name="division" value={editFormData.address?.division} onChange={(e) => handleEditFormChange(e, 'address', 'division')} options={divisionOptionsForEdit} error={editErrors['address.division']} placeholderOption="বিভাগ নির্বাচন" required />
            <Select label="জেলা" name="district" value={editFormData.address?.district} onChange={(e) => handleEditFormChange(e, 'address', 'district')} options={editAvailableDistricts} error={editErrors['address.district']} placeholderOption="জেলা নির্বাচন" required disabled={!editFormData.address?.division || editAvailableDistricts.length === 0} />
            <Select label="উপজেলা/থানা" name="upazila" value={editFormData.address?.upazila} onChange={(e) => handleEditFormChange(e, 'address', 'upazila')} options={editAvailableUpazilas} error={editErrors['address.upazila']} placeholderOption="উপজেলা/থানা নির্বাচন" required disabled={!editFormData.address?.district || editAvailableUpazilas.length === 0} />
            <Input label="গ্রাম/মহল্লা" name="village" value={editFormData.address?.village} onChange={(e) => handleEditFormChange(e, 'address', 'village')} error={editErrors['address.village']} required />
            <Input label="পোস্ট অফিস" name="postOffice" value={editFormData.address?.postOffice || ''} onChange={(e) => handleEditFormChange(e, 'address', 'postOffice')} error={editErrors['address.postOffice']} required />
            <Input label="হোল্ডিং (ঐচ্ছিক)" name="holding" value={editFormData.address?.holding} onChange={(e) => handleEditFormChange(e, 'address', 'holding')} />
            <Input label="যোগাযোগকারীর নাম" name="contactPersonName" value={editFormData.address?.contactPersonName} onChange={(e) => handleEditFormChange(e, 'address', 'contactPersonName')} error={editErrors['address.contactPersonName']} required />
            <Input label="মোবাইল ১" name="mobile1" type="tel" value={editFormData.mobile1} onChange={handleEditFormChange} error={editErrors.mobile1} placeholder="01XXXXXXXXX" required />
            <Input label="মোবাইল ২ (ঐচ্ছিক)" name="mobile2" type="tel" value={editFormData.mobile2} onChange={handleEditFormChange} error={editErrors.mobile2} placeholder="01XXXXXXXXX" />
        </div>
    )},
    { id: 'authorities', label: 'কর্তৃপক্ষ', icon: <UserCircleIcon className="w-4 h-4"/>, content: (
        <div className="space-y-4 pt-4">
            <div> <h4 className="text-md font-semibold text-gray-600 mb-2 border-b pb-1">মুহতামিম</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input label="নাম" name="name" value={editFormData.muhtamim?.name} onChange={(e) => handleEditFormChange(e, 'muhtamim', 'name')} error={editErrors['muhtamim.name']} required />
                    <Input label="মোবাইল" name="mobile" type="tel" value={editFormData.muhtamim?.mobile} onChange={(e) => handleEditFormChange(e, 'muhtamim', 'mobile')} error={editErrors['muhtamim.mobile']} placeholder="01XXXXXXXXX" required />
                    <Input label="NID (ঐচ্ছিক)" name="nidNumber" type="text" value={editFormData.muhtamim?.nidNumber} onChange={(e) => handleEditFormChange(e, 'muhtamim', 'nidNumber')} error={editErrors['muhtamim.nidNumber']} />
                    <Input label="যোগ্যতা" name="qualification" value={editFormData.muhtamim?.qualification} onChange={(e) => handleEditFormChange(e, 'muhtamim', 'qualification')} error={editErrors['muhtamim.qualification']} required/>
                </div>
            </div>
            <div><button type="button" onClick={() => setIsEduSecOpen(!isEduSecOpen)} className="w-full flex justify-between items-center text-md font-semibold text-gray-600 mb-2 border-b pb-1 focus:outline-none"><span>শিক্ষা সচিব (ঐচ্ছিক)</span><ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isEduSecOpen ? 'rotate-180' : ''}`} /></button>
                {isEduSecOpen && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><Input label="নাম" name="name" value={editFormData.educationSecretary?.name} onChange={(e) => handleEditFormChange(e, 'educationSecretary', 'name')} /><Input label="মোবাইল" name="mobile" type="tel" value={editFormData.educationSecretary?.mobile} onChange={(e) => handleEditFormChange(e, 'educationSecretary', 'mobile')} error={editErrors['educationSecretary.mobile']} placeholder="01XXXXXXXXX"/><Input label="NID" name="nidNumber" type="text" value={editFormData.educationSecretary?.nidNumber} onChange={(e) => handleEditFormChange(e, 'educationSecretary', 'nidNumber')} error={editErrors['educationSecretary.nidNumber']}/><Input label="যোগ্যতা" name="qualification" value={editFormData.educationSecretary?.qualification} onChange={(e) => handleEditFormChange(e, 'educationSecretary', 'qualification')} /></div>)}
            </div>
            <div><button type="button" onClick={() => setIsMutawalliOpen(!isMutawalliOpen)} className="w-full flex justify-between items-center text-md font-semibold text-gray-600 mb-2 border-b pb-1 focus:outline-none"><span>মুতাওয়াল্লী (ঐচ্ছিক)</span><ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isMutawalliOpen ? 'rotate-180' : ''}`} /></button>
                {isMutawalliOpen && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><Input label="নাম" name="name" value={editFormData.mutawalli?.name} onChange={(e) => handleEditFormChange(e, 'mutawalli', 'name')} /><Input label="মোবাইল" name="mobile" type="tel" value={editFormData.mutawalli?.mobile} onChange={(e) => handleEditFormChange(e, 'mutawalli', 'mobile')} error={editErrors['mutawalli.mobile']} placeholder="01XXXXXXXXX"/><Input label="NID" name="nidNumber" type="text" value={editFormData.mutawalli?.nidNumber} onChange={(e) => handleEditFormChange(e, 'mutawalli', 'nidNumber')} error={editErrors['mutawalli.nidNumber']} /></div>)}
            </div>
        </div>
    )},
    { id: 'ilhakForm', label: 'ইলহাক ফর্ম', icon: <PaperClipIcon className="w-4 h-4"/>, content: (
        <div className="pt-4">
            <FileUpload id="editIlhakForm" label="নতুন ইলহাক ফর্ম আপলোড করুন (পিডিএফ)" onFileChange={handleEditFileChange} acceptedFileTypes=".pdf" fileNameDisplay={editFormData.ilhakFormFile?.name} buttonText="নতুন পিডিএফ নির্বাচন করুন" error={editErrors.ilhakFormFile} />
            {editFormData.ilhakFormUrl && !editFormData.removeIlhakForm && (<div className="mt-2 text-sm">বর্তমান ফাইল: <a href={editFormData.ilhakFormUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{editFormData.ilhakFormUrl.split('/').pop()}</a>
             <label className="ml-4 flex items-center"><input type="checkbox" checked={editFormData.removeIlhakForm || false} onChange={handleRemoveIlhakFormToggle} className="mr-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/> বর্তমান ফাইল মুছে ফেলুন</label>
            </div>)}
             {editFormData.ilhakFormFile && (<p className="text-xs text-gray-500 mt-1">নতুন ফাইল আপলোড করলে আগের ফাইল (যদি থাকে) মুছে যাবে।</p>)}
        </div>
    )},
  ] : [];

  const handleResetFilters = () => {
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMadrasaType('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নিবন্ধিত মাদরাসাসমূহ</h2>

      <div className="bg-white py-3 shadow rounded-lg mb-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <Input
            placeholder="অনুসন্ধান (কোড, বাংলা/আরবী নাম, মোবাইল নম্বর)..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
            wrapperClassName="flex-grow w-full sm:w-auto mb-0"
            className="h-10"
          />
          <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsFilterSectionVisible(prev => !prev)}
              leftIcon={isFilterSectionVisible ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
              size="md"
              className="whitespace-nowrap"
              aria-expanded={isFilterSectionVisible}
              aria-controls="filter-section-content"
            >
              {isFilterSectionVisible ? 'ফিল্টার লুকান' : 'ফিল্টার দেখান'}
            </Button>
            <Button
              onClick={() => navigate('/madrasa/registration')}
              leftIcon={<PlusCircleIcon className="w-5 h-5"/>}
              size="md"
              className="whitespace-nowrap"
            >
              নতুন মাদরাসা
            </Button>
          </div>
        </div>
      </div>

      {isFilterSectionVisible && (
        <div id="filter-section-content" className="bg-white p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out -mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            <Select label="বিভাগ" value={selectedDivision} onChange={(e) => { setSelectedDivision(e.target.value); setSelectedDistrict(''); setSelectedUpazila(''); setCurrentPage(1); }} options={divisionFilterOptions} wrapperClassName="mb-0"/>
            <Select label="জেলা" value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedUpazila(''); setCurrentPage(1); }} options={districtFilterOptions} disabled={!selectedDivision || districtOptions.length === 0} wrapperClassName="mb-0"/>
            <Select label="উপজেলা/থানা" value={selectedUpazila} onChange={(e) => { setSelectedUpazila(e.target.value); setCurrentPage(1); }} options={upazilaFilterOptions} disabled={!selectedDistrict || upazilaOptions.length === 0} wrapperClassName="mb-0"/>
            <Select label="মাদ্রাসার ধরণ" value={selectedMadrasaType} onChange={(e) => { setSelectedMadrasaType(e.target.value as MadrasaType | ''); setCurrentPage(1); }} options={typeFilterOptions} wrapperClassName="mb-0"/>
            <div className="xl:col-span-1 flex items-end">
              <Button onClick={handleResetFilters} variant="secondary" className="w-full">ফিল্টার রিসেট করুন</Button>
            </div>
          </div>
        </div>
      )}


      <Card className={`${isFilterSectionVisible ? 'mt-4' : ''} bg-white`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-100"><tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  <button onClick={() => handleSort('madrasa_code')} className="flex items-center w-full focus:outline-none">
                    কোড
                    {sortField === 'madrasa_code' && (sortOrder === 'asc' ? <ChevronUpIcon className="w-4 h-4 ml-1"/> : <ChevronDownIcon className="w-4 h-4 ml-1"/>)}
                    {sortField !== 'madrasa_code' && <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-400"/>}
                  </button>
                </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ width: '210px' }}>
                  <button onClick={() => handleSort('name_bn')} className="flex items-center w-full focus:outline-none">
                    নাম (বাংলা)
                    {sortField === 'name_bn' && (sortOrder === 'asc' ? <ChevronUpIcon className="w-4 h-4 ml-1"/> : <ChevronDownIcon className="w-4 h-4 ml-1"/>)}
                    {sortField !== 'name_bn' && <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-400"/>}
                  </button>
                </th>
                {['ঠিকানা ', 'মুহতামিম', 'ধরণ'].map(header => (<th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ width: header === 'ঠিকানা ' ? '190px' : undefined }}>{header}</th>))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">কার্যক্রম</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && Array.from({length: itemsPerPage}).map((_, idx) => (
                <tr key={`loader-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap text-center"><div className="flex justify-center space-x-2"><div className="h-5 w-5 bg-gray-200 rounded-full"></div><div className="h-5 w-5 bg-gray-200 rounded-full"></div><div className="h-5 w-5 bg-gray-200 rounded-full"></div></div></td>
                </tr>
            ))}
            {!isLoading && madrasaList.map((madrasa) => (<tr key={madrasa.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{madrasa.madrasaCode}</td>
              <td className="px-4 py-4 whitespace-normal text-sm text-gray-700 text-left" style={{ width: '210px', wordBreak: 'break-word' }}>{madrasa.nameBn}</td>
                            <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 text-left" style={{ width: '190px', wordBreak: 'break-word' }}>{
                [
                  madrasa.address.holding,
                  madrasa.address.village,
                  madrasa.address.postOffice,
                  madrasa.address.upazila,
                  madrasa.address.district,
                ]
                  .filter(Boolean)
                  .join(', ')
              }</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{`${madrasa.muhtamim.name} - ${madrasa.muhtamim.mobile}`}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-left"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${madrasa.type === 'boys' ? 'bg-blue-100 text-blue-800' : madrasa.type === 'girls' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'}`}>{getMadrasaTypeLabel(madrasa.type)}</span></td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                <button onClick={() => handleViewClick(madrasa)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত"><EyeIcon className="w-5 h-5"/></button>
                <button onClick={() => handleEditClick(madrasa)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></button>
              </td></tr>))}
            {!isLoading && madrasaList.length === 0 && (<tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">কোনো মাদরাসা পাওয়া যায়নি। <Button variant="ghost" onClick={() => refetch()} className="text-sm">পুনরায় চেষ্টা করুন</Button></td></tr>)}
          </tbody></table>
        </div>
        <div className="py-2 px-3 flex items-center justify-between border-t">
            <div>
                <span className="text-sm text-gray-700 mr-2">প্রতি পৃষ্ঠায়:</span>
                <Select value={itemsPerPage.toString()} onChange={e => setItemsPerPage(Number(e.target.value))}
                    options={[{value:'10', label:'১০'}, {value:'20', label:'২০'}, {value:'50', label:'৫০'}, {value:'100', label:'১০০'}]}
                    wrapperClassName="mb-0 inline-block w-20" className="h-8 text-sm"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button>
                <span className="text-sm text-gray-700">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages > 0 ? totalPages.toLocaleString('bn-BD') : (1).toLocaleString('bn-BD')}</span>
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage === totalPages || isLoading || totalPages === 0} size="sm" variant="secondary">পরবর্তী</Button>
            </div>
        </div>
      </Card>

      {selectedMadrasaForView && (<Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`বিবরণ: ${selectedMadrasaForView.nameBn}`} size="3xl">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto p-2">
            <h4 className="text-md font-semibold text-gray-600 border-b pb-1">সাধারণ তথ্য</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ViewDetailItem label="কোড" value={selectedMadrasaForView.madrasaCode} /> <ViewDetailItem label="নিবন্ধন তারিখ" value={formatDate(selectedMadrasaForView.registrationDate)} />
              <ViewDetailItem label="নাম (বাংলা)" value={selectedMadrasaForView.nameBn} /> <ViewDetailItem label="নাম (আরবী)" value={selectedMadrasaForView.nameAr} />
              <ViewDetailItem label="নাম (ইংরেজি)" value={selectedMadrasaForView.nameEn} /> <ViewDetailItem label="ধরণ" value={getMadrasaTypeLabel(selectedMadrasaForView.type)} />
              <ViewDetailItem label="চিঠি প্রেরণের মাধ্যম" value={DISPATCH_METHOD_OPTIONS.find(o => o.value === selectedMadrasaForView.dispatchMethod)?.label || 'অজানা'} />
              <ViewDetailItem label="বালক সর্বোচ্চ মারহালা" value={getMarhalaName(selectedMadrasaForView.highestMarhalaBoysId)} /> <ViewDetailItem label="বালিকা সর্বোচ্চ মারহালা" value={getMarhalaName(selectedMadrasaForView.highestMarhalaGirlsId)} />
              <ViewDetailItem label="জোন" value={getZoneName(selectedMadrasaForView.zoneId)} />
            </div>
            <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">ঠিকানা ও যোগাযোগ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ViewDetailItem label="বিভাগ" value={selectedMadrasaForView.address.division} /> <ViewDetailItem label="জেলা" value={selectedMadrasaForView.address.district} />
                <ViewDetailItem label="উপজেলা/থানা" value={selectedMadrasaForView.address.upazila} /> <ViewDetailItem label="গ্রাম/মহল্লা" value={selectedMadrasaForView.address.village} />
                <ViewDetailItem label="পোস্ট অফিস" value={selectedMadrasaForView.address.postOffice} /> 
                <ViewDetailItem label="হোল্ডিং" value={selectedMadrasaForView.address.holding} /> <ViewDetailItem label="যোগাযোগকারী" value={selectedMadrasaForView.address.contactPersonName} />
                <ViewDetailItem label="মোবাইল ১" value={selectedMadrasaForView.mobile1} /> <ViewDetailItem label="মোবাইল ২" value={selectedMadrasaForView.mobile2} />
            </div>
            <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">মুহতামিম</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ViewDetailItem label="নাম" value={selectedMadrasaForView.muhtamim.name} /> <ViewDetailItem label="মোবাইল" value={selectedMadrasaForView.muhtamim.mobile} />
                <ViewDetailItem label="NID" value={selectedMadrasaForView.muhtamim.nidNumber} /> <ViewDetailItem label="যোগ্যতা" value={selectedMadrasaForView.muhtamim.qualification} />
            </div>
            {selectedMadrasaForView.educationSecretary?.name && (<><h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">শিক্ষা সচিব</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ViewDetailItem label="নাম" value={selectedMadrasaForView.educationSecretary.name} /> <ViewDetailItem label="মোবাইল" value={selectedMadrasaForView.educationSecretary.mobile} />
                <ViewDetailItem label="NID" value={selectedMadrasaForView.educationSecretary.nidNumber} /> <ViewDetailItem label="যোগ্যতা" value={selectedMadrasaForView.educationSecretary.qualification} />
            </div></>)}
            {selectedMadrasaForView.mutawalli?.name && (<><h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">মুতাওয়াল্লী</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ViewDetailItem label="নাম" value={selectedMadrasaForView.mutawalli.name} /> <ViewDetailItem label="মোবাইল" value={selectedMadrasaForView.mutawalli.mobile} /> <ViewDetailItem label="NID" value={selectedMadrasaForView.mutawalli.nidNumber} />
            </div></>)}
             <h4 className="text-md font-semibold text-gray-600 border-b pb-1 pt-2">ইলহাক ফর্ম</h4>
             <ViewDetailItem label="URL" value={selectedMadrasaForView.ilhakFormUrl ? (<a href={selectedMadrasaForView.ilhakFormUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline break-all">{selectedMadrasaForView.ilhakFormUrl.split('/').pop()}</a>) : 'নেই'} />
        </div></Modal>)}

      {isEditModalOpen && selectedMadrasaForEdit && editFormData && (<Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`সম্পাদনা: ${selectedMadrasaForEdit.nameBn}`} size="3xl" footer={<><Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditErrors({}); }}>বাতিল</Button><Button variant="primary" onClick={handleSaveChanges} disabled={updateMadrasaMutation.isPending}>সংরক্ষণ</Button></>}>
          <Tabs tabs={editMadrasaTabs} activeTabId={editActiveTab} onTabChange={setEditActiveTab} />
          {editErrors.apiError && <p className="text-sm text-red-500 mt-2 p-2">{editErrors.apiError}</p>}
      </Modal>)}

      {isDeleteAlertOpen && madrasaToDelete && (<AlertDialog isOpen={isDeleteAlertOpen} onClose={() => setIsDeleteAlertOpen(false)} onConfirm={confirmDelete} title="নিশ্চিতকরণ" description={`আপনি কি "${madrasaToDelete.nameBn}" মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।`} confirmButtonText={deleteMadrasaMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"}/>)}
    </div>
  );
};
export default MadrasaListPage;
