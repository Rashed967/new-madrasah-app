
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { BANGLADESH_DISTRICTS } from '../../constants';
import { DistrictOption, Zone, ZoneApiResponse } from '../../types';
import { PlusCircleIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


export default function ZoneRegistrationPage(): JSX.Element {
  const navigate = useNavigate(); 
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [nameBn, setNameBn] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ nameBn?: string; districts?: string; apiError?: string, zone_code?: string }>({});

  const { data: allFetchedZonesData, isLoading: isLoadingInitialData, refetch: refetchAllZones, error: fetchZonesError } = useQuery<ZoneApiResponse[], Error>({
    queryKey: ['allZonesForZoneRegPage'], 
    queryFn: async () => {
        const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts');
        if (error) {
            console.error("Supabase error fetching zones for reg page:", error);
            throw new Error(error.message || 'বিদ্যমান জোন তালিকা আনতে সমস্যা হয়েছে।');
        }
        return data || [];
    },
    staleTime: 5 * 60 * 1000, 
  });
  
  useEffect(() => {
    if (fetchZonesError) {
        addToast(fetchZonesError.message || 'বিদ্যমান জোনগুলো আনতে সমস্যা হয়েছে। জেলা তালিকা সঠিকভাবে ফিল্টার নাও হতে পারে।', 'error');
    }
  }, [fetchZonesError, addToast]);


  const allZones: Zone[] = useMemo(() => {
    return (allFetchedZonesData || []).map(z_api => ({
        id: z_api.id,
        zoneCode: z_api.zone_code,
        nameBn: z_api.name_bn,
        districts: z_api.districts,
    }));
  }, [allFetchedZonesData]);


  const assignedDistrictValues = useMemo(() => {
    return new Set(allZones.flatMap(zone => zone.districts));
  }, [allZones]);

  const availableDistrictOptions: DistrictOption[] = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter(district => !assignedDistrictValues.has(district.value));
  }, [assignedDistrictValues]);

  const validateForm = (): boolean => {
    const newErrors: { nameBn?: string; districts?: string } = {};
    if (!nameBn.trim()) {
      newErrors.nameBn = 'জোনের বাংলা নাম আবশ্যক';
    }
    if (selectedDistricts.length === 0) {
      newErrors.districts = 'অন্তত একটি জেলা নির্বাচন করুন';
    }
    setErrors(prev => ({ apiError: prev.apiError, zone_code: prev.zone_code, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  const createZoneMutation = useMutation({
    mutationFn: async (newZonePayload: { p_name_bn: string; p_districts: string[] }) => {
        const { data, error } = await supabase.rpc('create_zone_with_auto_code', newZonePayload);
        if (error) throw error;
        return data;
    },
    onSuccess: (newZoneData) => {
        addToast(`জোন "${(newZoneData as any).name_bn}" (${(newZoneData as any).zone_code}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
        setNameBn('');
        setSelectedDistricts([]);
        setErrors({});
        refetchAllZones(); 
        queryClient.invalidateQueries({ queryKey: ['zones'] }); 
    },
    onError: (error: SupabasePostgrestError | Error ) => {
        let userMessage = `জোন তৈরি করতে সমস্যা হয়েছে: ${error.message}`;
        const fieldErrorsUpdate: any = { apiError: userMessage };

        if (error && typeof error === 'object' && 'code' in error) {
            const typedRpcError = error as SupabasePostgrestError;
            if (typedRpcError.code === '23505' && typedRpcError.message.includes('এই বাংলা নামে একটি জোন ইতিমধ্যে বিদ্যমান')) { 
                fieldErrorsUpdate.nameBn = typedRpcError.message;
                fieldErrorsUpdate.apiError = undefined; 
                userMessage = typedRpcError.message;
            } else if (typedRpcError.message.includes('অন্তত একটি জেলা আবশ্যক')) {
                 fieldErrorsUpdate.districts = typedRpcError.message;
                 fieldErrorsUpdate.apiError = undefined;
                 userMessage = typedRpcError.message;
            }
        }
        setErrors(prev => ({ ...prev, ...fieldErrorsUpdate }));
        addToast(userMessage, 'error', 7000);
    }
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ nameBn: prev.nameBn, districts: prev.districts, apiError: undefined, zone_code: undefined })); 

    if (!validateForm()) {
      addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
      return;
    }
    
    createZoneMutation.mutate({
        p_name_bn: nameBn.trim(),
        p_districts: selectedDistricts,
    });
  };
  
  if (isLoadingInitialData && !allFetchedZonesData) { 
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
            <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-xl text-gray-700">বিদ্যমান জোনসমূহের তথ্য লোড হচ্ছে...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নতুন জোন নিবন্ধন</h2>
      <Card title="জোনের তথ্য">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="জোনের নাম (বাংলা)"
            id="nameBn"
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
            error={errors.nameBn}
            required
            placeholder="যেমন: ঢাকা উত্তর জোন"
            disabled={createZoneMutation.isPending}
          />
           {errors.zone_code && <p className="text-sm text-red-500 -mt-2 mb-2">{errors.zone_code}</p>}
           {errors.apiError && !errors.nameBn && !errors.zone_code && !errors.districts && <p className="text-sm text-red-500 -mt-2 mb-2">{errors.apiError}</p>}
          <MultiSelectGrid
            label="অন্তর্ভুক্ত জেলাসমূহ"
            options={availableDistrictOptions}
            selectedValues={selectedDistricts}
            onChange={setSelectedDistricts}
            error={errors.districts}
            gridCols={3}
            visibleRows={5}
            itemHeight={44} 
            required
            wrapperClassName={createZoneMutation.isPending ? 'opacity-70' : ''}
          />
           {availableDistrictOptions.length === 0 && !isLoadingInitialData && (
             <p className="text-sm text-yellow-600 -mt-2">সকল জেলা ইতিমধ্যে কোনো না কোনো জোনে অন্তর্ভুক্ত করা হয়েছে। নতুন জোন তৈরি করতে হলে প্রথমে অন্য জোন থেকে জেলা বাদ দিন অথবা ডাটাবেজে নতুন জেলা যোগ করুন (যদি প্রযোজ্য হয়)।</p>
           )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/zone/list')} 
              disabled={createZoneMutation.isPending}
            >
              বাতিল করুন
            </Button>
            <Button type="submit" leftIcon={<PlusCircleIcon className="w-5 h-5" />} disabled={createZoneMutation.isPending || (availableDistrictOptions.length === 0 && selectedDistricts.length === 0 && !isLoadingInitialData) }>
              {createZoneMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
