
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
// Kitab type is not explicitly needed for this page's logic anymore for form state,
// but keeping it for reference or if other parts of the page might use it.
// import { Kitab } from '../../types'; 
import { PlusCircleIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase'; // Import supabase client value
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js'; // Import type for assertion

const KitabRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [nameBn, setNameBn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [fullMarks, setFullMarks] = useState<number | string>('');
  const [errors, setErrors] = useState<{ nameBn?: string; fullMarks?: string; apiError?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { nameBn?: string; fullMarks?: string } = {};
    if (!nameBn.trim()) {
      newErrors.nameBn = 'কিতাবের বাংলা নাম আবশ্যক';
    }
    const marks = Number(fullMarks);
    if (fullMarks === '' || isNaN(marks) || marks <= 0) {
      newErrors.fullMarks = 'পূর্ণ নম্বর একটি ধনাত্মক সংখ্যা হতে হবে';
    }
    setErrors(prev => ({ ...prev, apiError: undefined, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, apiError: undefined }));

    try {
      const { data: newKitabData, error: rpcError } = await supabase.rpc('create_kitab_with_auto_code', {
        p_name_bn: nameBn.trim(),
        p_name_ar: nameAr.trim() || null,
        p_full_marks: Number(fullMarks),
      });

      if (rpcError) {
        console.error('Supabase RPC error creating kitab:', rpcError);
        let userMessage = `কিতাব তৈরি করতে সমস্যা হয়েছে: ${rpcError.message}`;
        
        // Check if rpcError has 'code' property to safely cast
        if (rpcError && typeof rpcError === 'object' && 'code' in rpcError) {
            const typedRpcError = rpcError as SupabasePostgrestError; // Use imported type for assertion
            if (typedRpcError.code === '23505' && typedRpcError.message.includes('এই বাংলা নামে একটি কিতাব ইতিমধ্যে বিদ্যমান')) {
                setErrors(prev => ({ ...prev, nameBn: typedRpcError.message }));
                userMessage = typedRpcError.message;
            } else {
                setErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else if (rpcError && typeof rpcError.message === 'string') {
             // Handle generic error if it doesn't fit PostgrestError structure but has a message
            setErrors(prev => ({ ...prev, apiError: userMessage }));
        } else {
            setErrors(prev => ({ ...prev, apiError: 'একটি অজানা ত্রুটি ঘটেছে।' }));
            userMessage = 'একটি অজানা ত্রুটি ঘটেছে।';
        }
        addToast(userMessage, 'error');
      } else {
        console.log('New Kitab Data from RPC:', newKitabData); // Log the response from RPC
        addToast(`"${(newKitabData as any).name_bn}" কিতাবটি (${(newKitabData as any).kitab_code}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
        navigate('/kitab/list');
      }
    } catch (error: any) {
      console.error('Kitab registration error (catch block):', error);
      const apiErrorMsg = `কিতাব নিবন্ধনে একটি নেটওয়ার্ক বা সার্ভার ত্রুটি ঘটেছে: ${error.message || 'অজানা ত্রুটি'}`;
      setErrors(prev => ({ ...prev, apiError: apiErrorMsg }));
      addToast(apiErrorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নতুন কিতাব নিবন্ধন</h2>
      <Card title="কিতাবের তথ্য">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="নাম (বাংলা)"
            id="nameBn"
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
            error={errors.nameBn}
            required
            placeholder="যেমন: সহীহ বুখারী"
            disabled={isLoading}
          />
          <Input
            label="নাম (আরবী) (اختیاری)"
            id="nameAr"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="যেমন: صحيح البخاري"
            disabled={isLoading}
            style={{ direction: 'rtl', textAlign: 'right' }}
          />
          <Input
            label="পূর্ণ নম্বর"
            id="fullMarks"
            type="number"
            value={fullMarks.toString()}
            onChange={(e) => setFullMarks(e.target.value)}
            error={errors.fullMarks}
            required
            min="1"
            placeholder="যেমন: 100"
            disabled={isLoading}
          />
          {errors.apiError && <p className="text-sm text-red-500">{errors.apiError}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/kitab/list')}
              disabled={isLoading}
            >
              বাতিল করুন
            </Button>
            <Button type="submit" leftIcon={<PlusCircleIcon className="w-5 h-5" />} disabled={isLoading}>
              {isLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default KitabRegistrationPage;
