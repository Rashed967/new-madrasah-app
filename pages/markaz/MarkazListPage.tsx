

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select'; 
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Switch } from '../../components/ui/Switch';
import { Markaz, SelectOption, Madrasa, MadrasaDbRow, ZoneApiResponse, MarkazDbRow } from '../../types';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BuildingOffice2Icon, ArrowPathIcon, MapPinIcon, CheckCircleIcon as ActivateIcon, XCircleIcon as DeactivateIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { toBengaliNumber } from '../../lib/utils';
import type { PostgrestError } from '@supabase/supabase-js';

const mapMadrasaDbRowToFrontendList = (dbRow: Partial<MadrasaDbRow>): Madrasa => ({
    id: dbRow.id!, madrasaCode: dbRow.madrasa_code!, nameBn: dbRow.name_bn!, nameAr: dbRow.name_ar || '',
    address: { village: dbRow.address?.village || '', upazila: dbRow.address?.upazila || '', district: dbRow.address?.district || '', division: dbRow.address?.division || '', contactPersonName: dbRow.address?.contact_person_name || '', postOffice: dbRow.address?.post_office, holding: dbRow.address?.holding },
    zoneId: dbRow.zone_id || '', mobile1: dbRow.mobile1 || '', type: dbRow.type || 'boys',
    muhtamim: { name: dbRow.muhtamim?.name || '', mobile: dbRow.muhtamim?.mobile || '' }, registrationDate: dbRow.registration_date || new Date().toISOString(),
    dispatchMethod: dbRow.dispatch_method || 'courier',
    nameEn: dbRow.name_en || undefined,
    mobile2: dbRow.mobile2 || undefined,
    highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined,
    highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
    educationSecretary: dbRow.education_secretary ? { name: dbRow.education_secretary.name, mobile: dbRow.education_secretary.mobile, nidNumber: dbRow.education_secretary.nid_number || undefined, qualification: dbRow.education_secretary.qualification || undefined, } : undefined,
    mutawalli: dbRow.mutawalli ? { name: dbRow.mutawalli.name, mobile: dbRow.mutawalli.mobile, nidNumber: dbRow.mutawalli.nid_number || undefined, } : undefined,
    ilhakFormUrl: dbRow.ilhak_form_url || undefined,
    userId: dbRow.user_id || undefined,
});

const mapMarkazDbRowToFrontend = (dbRow: MarkazDbRow): Markaz => ({
    id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code, // markaz_code is now number
    hostMadrasaId: dbRow.host_madrasa_id, zoneId: dbRow.zone_id,
    examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active,
    createdAt: dbRow.created_at, updatedAt: dbRow.updated_at
});




const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const MarkazListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMarkazForView, setSelectedMarkazForView] = useState<Markaz | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMarkaz, setEditingMarkaz] = useState<Markaz | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Markaz>>({}); 
  
  const [editSelectedHostMadrasaName, setEditSelectedHostMadrasaName] = useState('');
  const [editHostMadrasaSearchInput, setEditHostMadrasaSearchInput] = useState('');
  const [debouncedEditHostSearchTerm, setDebouncedEditHostSearchTerm] = useState('');
  
  const [editErrors, setEditErrors] = useState<any>({});
  


  const { data: markazData, isLoading: isLoadingMarkazes, error: markazesError, refetch } = useQuery<{items: Markaz[], totalItems: number}, Error>({
    queryKey: ['markazes', currentPage, itemsPerPage, searchTerm],
    queryFn: async () => {
        const { data, error } = await supabase.rpc('get_markazes_filtered', {
            p_page: currentPage, p_limit: itemsPerPage, p_search_term: searchTerm || null
        });
        if (error) throw error;
        return { items: (data.items as MarkazDbRow[]).map(mapMarkazDbRowToFrontend), totalItems: data.totalItems };
    },
    placeholderData: keepPreviousData,
  });

  const markazes = markazData?.items || [];
  const totalItems = markazData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);


  const { data: allApiMadrasas = [], isLoading: isLoadingAllMadrasas, error: madrasasLoadingError } = useQuery<Madrasa[], Error>({
    queryKey: ['allMadrasasForMarkazListLookup'], 
    queryFn: async () => {
      const { data, error } = await supabase.from('madrasas').select('*'); 
      if (error) throw new Error(error.message || 'মাদরাসা তালিকা আনতে সমস্যা হয়েছে।');
      return (data as Partial<MadrasaDbRow>[]).map(mapMadrasaDbRowToFrontendList);
    },
    staleTime: Infinity
  });

  const { data: allApiZones = [], isLoading: isLoadingAllZones, error: zonesLoadingError } = useQuery<ZoneApiResponse[], Error>({
    queryKey: ['allZonesForMarkazListLookup'], 
     queryFn: async () => {
        const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts');
        if (error) throw new Error(error.message || 'জোন তালিকা আনতে সমস্যা হয়েছে।');
        return data || [];
    },
    staleTime: Infinity
  });

  useEffect(() => {
      if (markazesError) addToast(markazesError.message, 'error');
      if (madrasasLoadingError) addToast(madrasasLoadingError.message, 'error');
      if (zonesLoadingError) addToast(zonesLoadingError.message, 'error');
  },[markazesError, madrasasLoadingError, zonesLoadingError, addToast]);


  useEffect(() => {
    const handler = setTimeout(() => setDebouncedEditHostSearchTerm(editHostMadrasaSearchInput), 500);
    return () => clearTimeout(handler);
  }, [editHostMadrasaSearchInput]);

  const { data: editFilteredHostMadrasas = [], isLoading: isSearchingEditHost, error: editHostSearchError } = useQuery<Madrasa[], Error>({
    queryKey: ['madrasaSearchEditHostMarkaz', debouncedEditHostSearchTerm],
    queryFn: async () => {
        if (debouncedEditHostSearchTerm.trim().length < 2) return [];
         const { data: markazesData, error: markazesError } = await supabase.from('markazes').select('host_madrasa_id');
        if (markazesError) console.error("Error fetching existing markaz hosts:", markazesError);
        const hostedMadrasaIds = new Set((markazesData || []).map(m => m.host_madrasa_id));
        
        const { data, error } = await supabase.rpc('get_madrasas_filtered', { p_search_term: debouncedEditHostSearchTerm, p_limit: 10 });
        if (error) throw new Error(error.message || `মাদরাসা খুঁজতে সমস্যা হয়েছে`);
        
        const madrasasFromRpc = (data.items as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontendList);
        return madrasasFromRpc.filter(m => m.id === editingMarkaz?.hostMadrasaId || !hostedMadrasaIds.has(m.id));
    },
    enabled: debouncedEditHostSearchTerm.trim().length >= 2 && isEditModalOpen,
  });
   useEffect(() => { if (editHostSearchError) addToast(editHostSearchError.message, 'error'); }, [editHostSearchError, addToast]);

  const getMadrasaNameById = useCallback((id: string): string => allApiMadrasas.find(m => m.id === id)?.nameBn || 'N/A', [allApiMadrasas]);
  const getMadrasaById = useCallback((id: string): Madrasa | undefined => allApiMadrasas.find(m => m.id === id), [allApiMadrasas]);
  const getZoneNameById = useCallback((id: string): string => allApiZones.find(z => z.id === id)?.name_bn || 'N/A', [allApiZones]);

  const zoneOptions: SelectOption[] = useMemo(() => 
    allApiZones.map(z => ({ value: z.id, label: `${z.name_bn} (${z.zone_code})` })), [allApiZones]);

  const handleViewClick = (markaz: Markaz) => { setSelectedMarkazForView(markaz); setIsViewModalOpen(true); };

  const handleEditClick = (markaz: Markaz) => {
    setEditingMarkaz(markaz);
    setEditFormData({ ...markaz });
    const hostMadrasa = allApiMadrasas.find(m => m.id === markaz.hostMadrasaId);
    setEditSelectedHostMadrasaName(hostMadrasa ? `${hostMadrasa.nameBn} (কোড: ${hostMadrasa.madrasaCode})` : '');
    setEditHostMadrasaSearchInput(''); 
    setEditErrors({}); setIsEditModalOpen(true);
  };
  
  const handleEditFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: name === 'examineeCapacity' && value !== '' ? Number(value) : value }));
  };

  const handleEditSelectHostMadrasa = (madrasa: Madrasa) => {
    setEditFormData(prev => ({...prev, hostMadrasaId: madrasa.id, nameBn: madrasa.nameBn + ' কেন্দ্র', zoneId: madrasa.zoneId, markazCode: madrasa.madrasaCode }));
    setEditSelectedHostMadrasaName(`${madrasa.nameBn} (কোড: ${madrasa.madrasaCode})`);
    setEditHostMadrasaSearchInput('');
    if (editErrors.hostMadrasaId) setEditErrors(prev => ({...prev, hostMadrasaId: undefined}));
  };
  const handleEditClearHostMadrasa = () => { setEditFormData(prev => ({...prev, hostMadrasaId: undefined, nameBn: '', markazCode: undefined})); setEditSelectedHostMadrasaName(''); };

  const validateEditForm = (): boolean => { 
    const newErrors: any = {};
    if (!editFormData.hostMadrasaId) newErrors.hostMadrasaId = 'মারকায মাদরাসা আবশ্যক';
    if (!editFormData.nameBn?.trim()) newErrors.nameBn = 'মারকাযের নাম আবশ্যক';
    if (!editFormData.zoneId) newErrors.zoneId = 'জোন আবশ্যক';
    if (editFormData.examineeCapacity === undefined || editFormData.examineeCapacity === null || Number(editFormData.examineeCapacity) <= 0) {
        newErrors.examineeCapacity = 'পরীক্ষার্থী ধারণক্ষমতা একটি ধনাত্মক সংখ্যা হতে হবে';
    }
    if (editFormData.isActive === undefined) newErrors.isActive = "স্ট্যাটাস আবশ্যক";
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const updateMarkazMutation = useMutation({
    mutationFn: async (updatedMarkaz: {id: string, payload: any}) => {
      const { data, error } = await supabase.rpc('update_markaz', {p_markaz_id: updatedMarkaz.id, p_updates: updatedMarkaz.payload});
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      addToast('মারকায সফলভাবে আপডেট করা হয়েছে!', 'success');
      setIsEditModalOpen(false);
      refetch(); 
    },
    onError: (error: PostgrestError | Error) => {
      const pgError = error as PostgrestError;
      let userMessage = `মারকায আপডেট করতে সমস্যা হয়েছে: ${pgError.message || error.message}`;
       if (pgError.code === '23505' && pgError.message.includes('markazes_name_bn_key')) {
          userMessage = `এই নামে (${editFormData.nameBn}) একটি মারকায ইতিমধ্যে বিদ্যমান।`;
          setEditErrors(prev => ({ ...prev, nameBn: userMessage, apiError: undefined }));
      } else if (pgError.code === '23505' && (pgError.message.includes('markazes_host_madrasa_id_key') || pgError.message.includes('markazes_markaz_code_key'))) {
          const hostMadrasa = allApiMadrasas.find(m => m.id === editFormData.hostMadrasaId);
          userMessage = `এই মাদরাসাটি (${hostMadrasa?.nameBn || editFormData.hostMadrasaId} - কোড: ${hostMadrasa?.madrasaCode}) ইতিমধ্যে অন্য একটি মারকাযের হোস্ট অথবা এই মাদরাসা কোড দিয়ে অন্য মারকায বিদ্যমান।`;
          setEditErrors(prev => ({ ...prev, hostMadrasaId: userMessage, apiError: undefined }));
      } else {
          setEditErrors(prev => ({ ...prev, apiError: userMessage }));
      }
      addToast(userMessage, 'error');
    }
  });

  const handleSaveChanges = () => {
    if (!editingMarkaz || !validateEditForm()) { addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে।', 'error'); return; }
    const payload = {
        name_bn: editFormData.nameBn!.trim(), 
        host_madrasa_id: editFormData.hostMadrasaId!, 
        zone_id: editFormData.zoneId!,
        examinee_capacity: Number(editFormData.examineeCapacity), 
        is_active: editFormData.isActive
        // markaz_code is not sent in payload as it's derived from host_madrasa_id in the DB function
    };
    updateMarkazMutation.mutate({ id: editingMarkaz.id, payload });
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async ({id, currentStatus}: {id: string, currentStatus: boolean}) => {
        const { error } = await supabase.rpc('update_markaz', {
            p_markaz_id: id, 
            p_updates: { is_active: !currentStatus }
        });
        if(error) throw error;
        return { id, newStatus: !currentStatus};
    },
    onSuccess: ({newStatus}) => {
        addToast(`মারকাযের স্ট্যাটাস সফলভাবে ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`, 'success');
        refetch();
    },
    onError: (error: PostgrestError | Error) => {
        addToast(`স্ট্যাটাস পরিবর্তন করতে সমস্যা: ${error.message}`, 'error');
    }
  });

  
  
  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="py-1"><p className="text-sm text-gray-500">{label}</p><p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>
  );
  
  if (isLoadingMarkazes || isLoadingAllMadrasas || isLoadingAllZones) {
    return <div className="flex justify-center items-center h-64"><ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-2" /><p className="text-xl text-gray-700">তথ্য লোড হচ্ছে...</p></div>;
  }
  if (markazesError) return <div className="text-center text-red-500 p-4">ত্রুটি: {markazesError.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">মারকায তালিকা</h2>
        <Button onClick={() => navigate('/markaz/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>নতুন মারকায</Button>
      </div>
      <Card>
        <div className="p-4"><Input placeholder="অনুসন্ধান (নাম, কোড, হোস্ট মাদরাসা, জোন)..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} wrapperClassName="mb-0"/></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{maxWidth: '160px'}}>মারকাযের নাম</th>
                
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{maxWidth: '160px'}}>হোস্ট মাদরাসা</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{maxWidth: '60px'}}>জোন</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{maxWidth: '40px'}}>ধারণক্ষমতা</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">কার্যক্রম</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {markazes.map((markaz) => {
                  const hostMadrasa = getMadrasaById(markaz.hostMadrasaId);
                  return (
                  <tr key={markaz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right" style={{maxWidth: '160px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{markaz.nameBn} - {toBengaliNumber(markaz.markazCode)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-right" style={{maxWidth: '160px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{hostMadrasa ? `${hostMadrasa.nameBn} - ${toBengaliNumber(hostMadrasa.madrasaCode)}` : 'প্রযোজ্য নয়'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-right" style={{maxWidth: '60px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{getZoneNameById(markaz.zoneId)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right" style={{maxWidth: '40px'}}>{markaz.examineeCapacity ? toBengaliNumber(markaz.examineeCapacity) : 'প্রযোজ্য নয়'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center"><Switch id={`status-${markaz.id}`} checked={markaz.isActive} onChange={() => toggleActiveMutation.mutate({id: markaz.id, currentStatus: markaz.isActive})} size="sm" srOnlyLabel={`${markaz.nameBn} স্ট্যাটাস`}/></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <button onClick={() => handleViewClick(markaz)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত"><EyeIcon className="w-5 h-5"/></button>
                      <button onClick={() => handleEditClick(markaz)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></button>
                      
                      {!markaz.isActive && <button onClick={() => toggleActiveMutation.mutate({id: markaz.id, currentStatus: markaz.isActive})} className="text-green-500 hover:text-green-700 p-1 ml-2" title="সক্রিয় করুন" disabled={toggleActiveMutation.isPending && markazToDelete?.id === markaz.id}><ActivateIcon className="w-5 h-5"/></button>}
                    </td>
                  </tr>
              )})}
              {markazes.length === 0 && !isLoadingMarkazes && (<tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">কোনো মারকায নেই।</td></tr>)}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="py-3 px-4 flex items-center justify-between border-t"><Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoadingMarkazes} size="sm" variant="secondary">পূর্ববর্তী</Button><span className="text-sm">পৃষ্ঠা {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}</span><Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoadingMarkazes} size="sm" variant="secondary">পরবর্তী</Button></div>)}
      </Card>

      {isViewModalOpen && selectedMarkazForView && (() => {
        const hostMadrasa = getMadrasaById(selectedMarkazForView.hostMadrasaId);
        return (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`বিবরণ: ${selectedMarkazForView.nameBn}`} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <ViewDetailItem label="মারকাযের নাম" value={selectedMarkazForView.nameBn} />
                <ViewDetailItem label="মারকায কোড" value={toBengaliNumber(selectedMarkazForView.markazCode)} />
                <ViewDetailItem label="জোন" value={getZoneNameById(selectedMarkazForView.zoneId)} />
                <ViewDetailItem label="ধারণক্ষমতা" value={selectedMarkazForView.examineeCapacity ? toBengaliNumber(selectedMarkazForView.examineeCapacity) : 'প্রযোজ্য নয়'} />
                <ViewDetailItem label="স্ট্যাটাস" value={selectedMarkazForView.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} />
                <ViewDetailItem label="তৈরির তারিখ" value={formatDate(selectedMarkazForView.createdAt)} />
            </div>
            <h4 className="text-md font-semibold text-gray-700 border-t pt-3 mt-3">হোস্ট মাদরাসা</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <ViewDetailItem label="নাম" value={hostMadrasa?.nameBn || 'প্রযোজ্য নয়'} />
                <ViewDetailItem label="কোড" value={hostMadrasa?.madrasaCode ? toBengaliNumber(hostMadrasa.madrasaCode) : 'প্রযোজ্য নয়'} />
                <ViewDetailItem label="আইডি" value={selectedMarkazForView.hostMadrasaId} />
            </div>
          </div>
        </Modal>
        )
      })()}

      {isEditModalOpen && editingMarkaz && editFormData && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`সম্পাদনা: ${editingMarkaz.nameBn}`} size="2xl" footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={updateMarkazMutation.isPending}>বাতিল</Button><Button variant="primary" onClick={handleSaveChanges} disabled={updateMarkazMutation.isPending || isSearchingEditHost}>{updateMarkazMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}</Button></>}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <fieldset className="border p-3 rounded-md"><legend className="text-md font-medium text-gray-600 px-1 flex items-center"><MapPinIcon className="w-4 h-4 mr-1 text-emerald-600"/>সাধারণ তথ্য</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 mt-1">
                    <Input label="মারকাযের নাম" name="nameBn" value={editFormData.nameBn || ''} onChange={handleEditFormInputChange} error={editErrors.nameBn} required wrapperClassName="mb-0"/>
                     <div className="space-y-1"><label htmlFor="editHostMadrasaSearchMarkazList" className="block text-sm font-medium text-gray-700">হোস্ট মাদরাসা {editErrors.hostMadrasaId && <span className="text-red-500">*</span>}</label>
                        {editFormData.hostMadrasaId && editSelectedHostMadrasaName ? (<div className="flex items-center justify-between p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-black"><span className="text-black">{editSelectedHostMadrasaName}</span><Button type="button" variant="ghost" size="sm" onClick={handleEditClearHostMadrasa} className="p-0.5 text-gray-400 hover:text-red-500"><XMarkIcon className="w-3.5 h-3.5" /></Button></div>) 
                        : (<Input id="editHostMadrasaSearchMarkazList" type="text" placeholder="হোস্ট মাদরাসা খুঁজুন..." value={editHostMadrasaSearchInput} onChange={(e) => setEditHostMadrasaSearchInput(e.target.value)} error={editErrors.hostMadrasaId} wrapperClassName="mb-0" />)}
                        {isSearchingEditHost && <p className="text-xs text-gray-500">অনুসন্ধান চলছে...</p>}
                        {editHostMadrasaSearchInput && editFilteredHostMadrasas.length > 0 && !isSearchingEditHost && (<ul className="border rounded-md mt-1 max-h-32 overflow-y-auto bg-white shadow-lg z-20">{editFilteredHostMadrasas.map(m => (<li key={m.id} onClick={() => handleEditSelectHostMadrasa(m)} className="p-1.5 hover:bg-emerald-50 cursor-pointer text-xs text-black">{m.nameBn} (কোড: {m.madrasaCode})</li>))}</ul>)}
                        {editHostMadrasaSearchInput && editFilteredHostMadrasas.length === 0 && !isSearchingEditHost && <p className="text-xs text-gray-500">কোনো মাদরাসা পাওয়া যায়নি অথবা ইতিমধ্যে হোস্ট।</p>}
                    </div>
                    <Input label="মারকায কোড" name="markazCode" value={editFormData.markazCode?.toString() || ''} disabled className="bg-gray-100" wrapperClassName="mb-0"/>
                    <Select label="জোন" name="zoneId" value={editFormData.zoneId || ''} onChange={handleEditFormInputChange} options={zoneOptions} error={editErrors.zoneId} required wrapperClassName="mb-0" disabled={allApiZones.length === 0}/>
                    <Input label="পরীক্ষার্থী ধারণক্ষমতা" name="examineeCapacity" type="number" value={editFormData.examineeCapacity?.toString() || ''} onChange={handleEditFormInputChange} error={editErrors.examineeCapacity} required min="1" wrapperClassName="mb-0"/>
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1">স্ট্যাটাস</label> <Switch id="editIsActive" checked={editFormData.isActive ?? false} onChange={(checked) => setEditFormData(prev => ({ ...prev, isActive: checked }))} /> {editErrors.isActive && <p className="text-xs text-red-500 mt-1">{editErrors.isActive}</p>} </div>
                </div>{editErrors.apiError && <p className="text-sm text-red-500 mt-2 col-span-full">{editErrors.apiError}</p>}
              </fieldset>
            </div>
        </Modal>
      )}
       
    </div>);};
export default MarkazListPage;