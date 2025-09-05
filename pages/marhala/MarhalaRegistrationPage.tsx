
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { Checkbox } from '../../components/ui/Checkbox'; // Added Checkbox
import { MarhalaSpecificType, MarhalaCategory, DistrictOption, KitabApiResponse } from '../../types';
import { MARHALA_TYPES, MARHALA_CATEGORIES } from '../../constants';
import { PlusCircleIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';

// Fetches kitabs from Supabase for selection
const fetchKitabsForMarhalaReg = async (): Promise<KitabApiResponse[]> => {
  const { data, error } = await supabase
    .from('kitabs')
    .select('id, kitab_code, name_bn, name_ar, full_marks, created_at') // Ensure fields match KitabApiResponse
    .order('kitab_code', { ascending: true });

  if (error) {
    console.error('Supabase error fetching kitabs for marhala reg:', error);
    throw new Error(error.message || 'কিতাব তালিকা আনতে সমস্যা হয়েছে');
  }
  return data || [];
};


const MarhalaRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [nameBn, setNameBn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState<MarhalaSpecificType | ''>('');
  const [category, setCategory] = useState<MarhalaCategory | ''>('');
  const [selectedKitabIds, setSelectedKitabIds] = useState<string[]>([]);
  const [requiresPhoto, setRequiresPhoto] = useState<boolean>(false); // Added state for requiresPhoto
  
  const [errors, setErrors] = useState<{ nameBn?: string; type?: string; category?: string; kitabIds?: string; apiError?: string; requiresPhoto?: string; }>({});

  const { data: allKitabs = [], isLoading: isLoadingKitabs, error: kitabsError } = useQuery<KitabApiResponse[], Error>({
    queryKey: ['allKitabsForMarhalaReg'],
    queryFn: fetchKitabsForMarhalaReg,
  });

  useEffect(() => {
    if(kitabsError) {
        addToast(kitabsError.message || 'কিতাব তালিকা লোড করা যায়নি।', 'error');
    }
  }, [kitabsError, addToast]);


  const kitabOptions: DistrictOption[] = useMemo(() => {
    return allKitabs.map(kitab => ({
      value: kitab.id,
      label: `${kitab.name_bn} (${kitab.full_marks} নম্বর)`,
    }));
  }, [allKitabs]);

  const validateForm = (): boolean => {
    const newErrors: { nameBn?: string; type?: string; category?: string; kitabIds?: string } = {};
    if (!nameBn.trim()) newErrors.nameBn = 'মারহালার বাংলা নাম আবশ্যক';
    if (!type) newErrors.type = 'মারহালার ধরণ নির্বাচন করুন';
    if (!category) newErrors.category = 'মারহালার ক্যাটাগরি নির্বাচন করুন';
    setErrors(prev => ({ ...prev, apiError: undefined, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const createMarhalaMutation = useMutation({
    mutationFn: async (newMarhalaPayload: {
        p_name_bn: string;
        p_name_ar: string | null;
        p_type: MarhalaSpecificType;
        p_category: MarhalaCategory;
        p_kitab_ids: string[];
        p_requires_photo: boolean; // Added requires_photo parameter
    }) => {
        const { data, error } = await supabase.rpc('create_marhala_with_auto_code', newMarhalaPayload);
        if (error) throw error;
        return data;
    },
    onSuccess: (data) => {
        addToast(`"${(data as any).name_bn}" মারহালাটি (${(data as any).marhala_code}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
        queryClient.invalidateQueries({ queryKey: ['marhalas'] }); // To refetch marhala list page
        navigate('/marhala/list');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `মারহালা তৈরি করতে সমস্যা হয়েছে: ${error.message}`;
        if (error && typeof error === 'object' && 'code' in error) {
            const typedRpcError = error as SupabasePostgrestError;
            if (typedRpcError.code === '23505' && typedRpcError.message.includes('এই বাংলা নামে একটি মারহালা ইতিমধ্যে বিদ্যমান')) {
                setErrors(prev => ({ ...prev, nameBn: typedRpcError.message, apiError: undefined }));
                userMessage = typedRpcError.message;
            } else if (typedRpcError.message.includes('দরসিয়াত ক্যাটাগরির জন্য অন্তত একটি কিতাব আবশ্যক')) {
                 setErrors(prev => ({ ...prev, kitabIds: typedRpcError.message, apiError: undefined }));
                 userMessage = typedRpcError.message;
            }
            else {
                setErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else if (error && typeof error.message === 'string') {
            setErrors(prev => ({ ...prev, apiError: userMessage }));
        } else {
            userMessage = 'একটি অজানা ত্রুটি ঘটেছে।';
            setErrors(prev => ({ ...prev, apiError: userMessage }));
        }
        addToast(userMessage, 'error');
    }
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
      return;
    }
    
    createMarhalaMutation.mutate({
        p_name_bn: nameBn.trim(),
        p_name_ar: nameAr.trim() || null,
        p_type: type as MarhalaSpecificType,
        p_category: category as MarhalaCategory,
        p_kitab_ids: selectedKitabIds,
        p_requires_photo: type === 'boys' ? requiresPhoto : false, // Photo only relevant for boys' marhalas
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নতুন মারহালা নিবন্ধন</h2>
      <Card title="মারহালার তথ্য">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="মারহালার নাম (বাংলা)"
              id="nameBn"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              error={errors.nameBn}
              required
              placeholder="যেমন: ইবতেদائية"
              disabled={createMarhalaMutation.isPending}
            />
            <Input
              label="মারহালার নাম (আরবী) (اختیاری)"
              id="nameAr"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="যেমন: الابتدائية"
              disabled={createMarhalaMutation.isPending}
              dir="rtl"
              className="text-right"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="মারহালার ধরণ"
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as MarhalaSpecificType | '');
                if (e.target.value === 'girls') setRequiresPhoto(false); // Reset for girls
              }}
              options={MARHALA_TYPES}
              error={errors.type}
              placeholderOption="ধরণ নির্বাচন করুন"
              required
              disabled={createMarhalaMutation.isPending}
            />
            <Select
              label="মারহালার ক্যাটাগরি"
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as MarhalaCategory | '');
              }}
              options={MARHALA_CATEGORIES}
              error={errors.category}
              placeholderOption="ক্যাটাগরি নির্বাচন করুন"
              required
              disabled={createMarhalaMutation.isPending}
            />
             <div className="flex items-end pb-4"> {/* Aligns with bottom of other inputs */}
                <Checkbox
                  id="requiresPhoto"
                  label="ছবি আবশ্যক (বালকদের জন্য)"
                  checked={requiresPhoto}
                  onChange={(e) => setRequiresPhoto(e.target.checked)}
                  disabled={createMarhalaMutation.isPending || type === 'girls'}
                  wrapperClassName={type === 'girls' ? 'opacity-50' : ''}
                />
            </div>
          </div>
          
          { (category === 'darsiyat' || category === 'hifz') && (
            isLoadingKitabs ? (
                <div className="flex items-center text-sm text-gray-500">
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    কিতাব তালিকা লোড হচ্ছে...
                </div>
            ) :
            allKitabs.length > 0 ? (
                <MultiSelectGrid
                    label="অন্তর্ভুক্ত কিতাবসমূহ"
                    options={kitabOptions}
                    selectedValues={selectedKitabIds}
                    onChange={setSelectedKitabIds}
                    error={errors.kitabIds}
                    gridCols={2} 
                    visibleRows={5}
                    itemHeight={44}
                    required={category === 'darsiyat'}
                    wrapperClassName={createMarhalaMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                />
            ) : <p className="text-sm text-yellow-600">কোনো কিতাব পাওয়া যায়নি। অনুগ্রহ করে প্রথমে কিছু কিতাব নিবন্ধন করুন। দরসিয়াত মারহালার জন্য কিতাব আবশ্যক।</p>
          )}
          {errors.apiError && <p className="text-sm text-red-500">{errors.apiError}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/marhala/list')}
              disabled={createMarhalaMutation.isPending}
            >
              বাতিল করুন
            </Button>
            <Button type="submit" leftIcon={<PlusCircleIcon className="w-5 h-5" />} disabled={createMarhalaMutation.isPending || (category === 'darsiyat' && isLoadingKitabs)}>
              {createMarhalaMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MarhalaRegistrationPage;
