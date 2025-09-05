

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Markaz, SelectOption, Madrasa, MadrasaDbRow, ZoneApiResponse } from '../../types';
import { PlusCircleIcon, BuildingOffice2Icon, XMarkIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const mapMadrasaDbRowToFrontendDropdown = (dbRow: Partial<MadrasaDbRow>): Madrasa => ({
    id: dbRow.id!, madrasaCode: dbRow.madrasa_code!, nameBn: dbRow.name_bn!, nameAr: dbRow.name_ar || '',
    address: { village: dbRow.address?.village || '', upazila: dbRow.address?.upazila || '', district: dbRow.address?.district || '', division: dbRow.address?.division || '', contactPersonName: dbRow.address?.contact_person_name || '', postOffice: dbRow.address?.post_office, holding: dbRow.address?.holding },
    zoneId: dbRow.zone_id || '', mobile1: dbRow.mobile1 || '', type: dbRow.type || 'boys',
    muhtamim: { name: dbRow.muhtamim?.name || '', mobile: dbRow.muhtamim?.mobile || ''}, registrationDate: dbRow.registration_date || new Date().toISOString(),
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


const MarkazRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [hostMadrasaId, setHostMadrasaId] = useState('');
  const [selectedHostMadrasaDisplay, setSelectedHostMadrasaDisplay] = useState('');
  const [hostMadrasaSearchInput, setHostMadrasaSearchInput] = useState('');
  const [debouncedHostSearchTerm, setDebouncedHostSearchTerm] = useState('');
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);

  const [markazNameBn, setMarkazNameBn] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [examineeCapacity, setExamineeCapacity] = useState<number | string>('');

  const [errors, setErrors] = useState<{ hostMadrasaId?: string; markazNameBn?: string; zoneId?: string; examineeCapacity?: string; apiError?: string; }>({});

  const { data: allApiZones = [], isLoading: isLoadingZones, error: zonesError } = useQuery<ZoneApiResponse[], Error>({
    queryKey: ['allZonesForMarkazReg'],
    queryFn: async () => {
        const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts');
        if (error) throw new Error(error.message || 'জোন তালিকা আনতে সমস্যা হয়েছে।');
        return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: allMadrasasForLookup = [], isLoading: isLoadingAllMadrasas, error: madrasasError } = useQuery<Madrasa[], Error>({
    queryKey: ['allMadrasasForMarkazRegLookup'],
     queryFn: async () => {
      const { data, error } = await supabase.from('madrasas').select('*');
      if (error) throw new Error(error.message || 'মাদরাসা তালিকা আনতে সমস্যা হয়েছে।');
      return (data as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontendDropdown);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (zonesError) addToast(zonesError.message, 'error');
    if (madrasasError) addToast(madrasasError.message, 'error');
  }, [zonesError, madrasasError, addToast]);


  useEffect(() => {
    const handler = setTimeout(() => setDebouncedHostSearchTerm(hostMadrasaSearchInput), 300);
    return () => clearTimeout(handler);
  }, [hostMadrasaSearchInput]);

  const { data: filteredHostMadrasas = [], isLoading: isSearchingHost, error: hostSearchError } = useQuery<Madrasa[], Error>({
    queryKey: ['madrasaSearchForHostMarkaz', debouncedHostSearchTerm],
    queryFn: async () => {
        if (debouncedHostSearchTerm.trim().length < 2) return [];
        const { data: markazesData, error: markazesError } = await supabase.from('markazes').select('host_madrasa_id');
        if (markazesError) {
            console.error("Error fetching existing markaz hosts:", markazesError);
        }
        const hostedMadrasaIds = new Set((markazesData || []).map(m => m.host_madrasa_id));
        
        const { data, error } = await supabase.rpc('get_madrasas_filtered', {
            p_search_term: debouncedHostSearchTerm, p_limit: 10 
        });
        if (error) throw new Error(error.message || `মাদরাসা খুঁজতে সমস্যা হয়েছে`);
        
        const madrasasFromRpc = (data.items as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontendDropdown);
        return madrasasFromRpc.filter(m => !hostedMadrasaIds.has(m.id));
    },
    enabled: debouncedHostSearchTerm.trim().length >= 2,
  });
  
   useEffect(() => {
    if (hostSearchError) addToast(`হোস্ট মাদরাসা খুঁজতে সমস্যা: ${hostSearchError.message}`, 'error');
  }, [hostSearchError, addToast]);

  const zoneOptions: SelectOption[] = useMemo(() => 
    allApiZones.map(z => ({ value: z.id, label: `${z.name_bn} (${z.zone_code})` })), 
  [allApiZones]);

  useEffect(() => {
    if (hostMadrasaId) {
      const hostMadrasa = allMadrasasForLookup.find(m => m.id === hostMadrasaId);
      if (hostMadrasa) {
          setMarkazNameBn(hostMadrasa.nameBn + ' কেন্দ্র'); 
          if(hostMadrasa.zoneId) setZoneId(hostMadrasa.zoneId); 
      }
    }
  }, [hostMadrasaId, allMadrasasForLookup]);

  const handleSelectHostMadrasa = (madrasa: Madrasa) => {
    setHostMadrasaId(madrasa.id);
    setSelectedHostMadrasaDisplay(`${madrasa.nameBn} (${madrasa.madrasaCode})`);
    setMarkazNameBn(madrasa.nameBn + ' কেন্দ্র'); 
    if(madrasa.zoneId) setZoneId(madrasa.zoneId);
    setHostMadrasaSearchInput(''); 
    setIsHostDropdownOpen(false);
    if (errors.hostMadrasaId) setErrors(prev => ({...prev, hostMadrasaId: undefined}));
  };

  const handleClearHostMadrasa = () => {
    setHostMadrasaId(''); setSelectedHostMadrasaDisplay(''); setHostMadrasaSearchInput(''); 
    setMarkazNameBn(''); setZoneId(''); setIsHostDropdownOpen(false);
  };

  const validateForm = (): boolean => { 
    const newErrors: typeof errors = {};
    if (!hostMadrasaId) newErrors.hostMadrasaId = 'মারকায (কেন্দ্র) মাদরাসা নির্বাচন করুন';
    if (!markazNameBn.trim()) newErrors.markazNameBn = 'মারকাযের নাম আবশ্যক';
    if (!zoneId) newErrors.zoneId = 'মারকাযের জোন নির্বাচন করুন';
    if (examineeCapacity === '' || Number(examineeCapacity) <= 0) {
      newErrors.examineeCapacity = 'পরীক্ষার্থী ধারণক্ষমতা একটি ধনাত্মক সংখ্যা হতে হবে';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const createMarkazMutation = useMutation({
    mutationFn: async (newMarkazPayload: { p_name_bn: string; p_host_madrasa_id: string; p_zone_id: string; p_examinee_capacity: number }) => {
      const { data, error } = await supabase.rpc('create_markaz_with_auto_code', newMarkazPayload);
      if (error) throw error;
      return data;
    },
    onSuccess: (newMarkazData) => {
      addToast(`মারকায "${(newMarkazData as any).name_bn}" (কোড: ${(newMarkazData as any).markaz_code}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['markazes'] }); 
      queryClient.invalidateQueries({ queryKey: ['madrasaSearchForHostMarkaz'] }); 
      navigate('/markaz/list');
    },
    onError: (error: PostgrestError | Error) => {
      const pgError = error as PostgrestError;
      let userMessage = `মারকায তৈরি করতে সমস্যা হয়েছে: ${pgError.message || error.message}`;
       if (pgError.code === '23505' && pgError.message.includes('markazes_name_bn_key')) {
          userMessage = `এই নামে (${markazNameBn}) একটি মারকায ইতিমধ্যে বিদ্যমান।`;
          setErrors(prev => ({ ...prev, markazNameBn: userMessage, apiError: undefined }));
      } else if (pgError.code === '23505' && (pgError.message.includes('markazes_host_madrasa_id_key') || pgError.message.includes('markazes_markaz_code_key')) ) {
          const hostMadrasa = allMadrasasForLookup.find(m => m.id === hostMadrasaId);
          userMessage = `এই মাদরাসাটি (${hostMadrasa?.nameBn || hostMadrasaId} - কোড: ${hostMadrasa?.madrasaCode}) ইতিমধ্যে একটি মারকাযের হোস্ট অথবা এই মাদরাসা কোড দিয়ে অন্য মারকায বিদ্যমান।`;
          setErrors(prev => ({ ...prev, hostMadrasaId: userMessage, apiError: undefined }));
      } else {
          setErrors(prev => ({ ...prev, apiError: userMessage }));
      }
      addToast(userMessage, 'error', 7000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error'); return; }
    createMarkazMutation.mutate({
      p_name_bn: markazNameBn.trim(), 
      p_host_madrasa_id: hostMadrasaId, 
      p_zone_id: zoneId,
      p_examinee_capacity: Number(examineeCapacity)
    });
  };
  
  if (isLoadingZones || isLoadingAllMadrasas) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
            <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-xl text-gray-700">ফর্মের জন্য তথ্য লোড হচ্ছে...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">নতুন মারকায নিবন্ধন</h2>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <fieldset className="border p-4 rounded-md shadow-sm">
            <legend className="text-lg font-medium text-gray-700 px-2 flex items-center"><BuildingOffice2Icon className="w-5 h-5 mr-2 text-emerald-600"/>কেন্দ্রের তথ্য</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
              <div className="space-y-1 relative">
                <label htmlFor="hostMadrasaSearch" className="block text-sm font-medium text-gray-700">হোস্ট মাদরাসা (কেন্দ্র) {errors.hostMadrasaId && <span className="text-red-500">*</span>}</label>
                {hostMadrasaId && selectedHostMadrasaDisplay ? (
                  <div className="flex items-center justify-between p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 min-h-[40px]">
                    <span>{selectedHostMadrasaDisplay}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearHostMadrasa} className="p-1 text-gray-500 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <Input id="hostMadrasaSearch" type="text" placeholder="মাদ্রাসার নাম বা কোড দিয়ে খুঁজুন..." value={hostMadrasaSearchInput} 
                    onChange={(e) => {setHostMadrasaSearchInput(e.target.value); if(!isHostDropdownOpen) setIsHostDropdownOpen(true);}} 
                    onBlur={() => setTimeout(() => setIsHostDropdownOpen(false), 150)} onFocus={() => setIsHostDropdownOpen(true)}
                    error={errors.hostMadrasaId && !hostMadrasaId ? errors.hostMadrasaId : undefined} wrapperClassName="mb-0" 
                  />
                )}
                {isSearchingHost && isHostDropdownOpen && <p className="text-xs text-gray-500">অনুসন্ধান করা হচ্ছে...</p>}
                {isHostDropdownOpen && hostMadrasaSearchInput && filteredHostMadrasas.length > 0 && !isSearchingHost && (
                  <ul className="absolute top-full left-0 right-0 border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                    {filteredHostMadrasas.map(madrasa => (
                      <li key={madrasa.id} onMouseDown={() => handleSelectHostMadrasa(madrasa)} className="p-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-800">
                        {madrasa.nameBn} (কোড: {madrasa.madrasaCode})
                      </li>
                    ))}
                  </ul>
                )}
                {isHostDropdownOpen && hostMadrasaSearchInput && filteredHostMadrasas.length === 0 && !isSearchingHost && <p className="text-xs text-gray-500">কোনো মাদরাসা পাওয়া যায়নি অথবা ইতিমধ্যে হোস্ট।</p>}
              </div>
              <Input label="মারকাযের নাম" id="markazNameBn" value={markazNameBn} onChange={(e) => setMarkazNameBn(e.target.value)} error={errors.markazNameBn} required placeholder="মারকাযের একটি নাম দিন (ডিফল্ট হোস্ট মাদ্রাসার নাম)" wrapperClassName="mb-0" />
              <Select label="মারকাযের জোন" id="zoneId" value={zoneId} onChange={(e) => setZoneId(e.target.value)} options={zoneOptions} error={errors.zoneId} placeholderOption="জোন নির্বাচন করুন" required wrapperClassName="mb-0" disabled={allApiZones.length === 0}/>
              <Input label="পরীক্ষার্থী ধারণক্ষমতা" id="examineeCapacity" type="number" value={examineeCapacity.toString()} onChange={(e) => setExamineeCapacity(e.target.value)} error={errors.examineeCapacity} required placeholder="যেমন: ৫০০" min="1" wrapperClassName="mb-0" />
            </div>
            {errors.apiError && <p className="text-sm text-red-500 mt-2 col-span-full">{errors.apiError}</p>}
          </fieldset>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/markaz/list')} disabled={createMarkazMutation.isPending}>বাতিল করুন</Button>
            <Button type="submit" leftIcon={<PlusCircleIcon className="w-5 h-5" />} disabled={createMarkazMutation.isPending}>
              {createMarkazMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'মারকায সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default MarkazRegistrationPage;