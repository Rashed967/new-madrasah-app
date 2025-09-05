import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Exam, Marhala, MarhalaApiResponse, SelectOption, RegistrationFeePaymentDetail } from '@/types';
import { PlusCircleIcon, TrashIcon, ArrowPathIcon, CurrencyBangladeshiIcon, XMarkIcon } from '@/components/ui/Icon';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { PAYMENT_METHODS } from '@/constants';
import { Card } from '@/components/ui/Card';

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

interface MarhalaStudentCountEntry {
  marhalaId: string;
  regularStudents: number | string;
  irregularStudents: number | string;
  marhalaName: string;
  marhalaOrder?: number | null;
  calculatedFee: number;
  displayedRegNoStart: number | string;
  displayedRegNoEnd: number | string;
}

const RegistrationFeeCollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedMadrasa, setSelectedMadrasa] = useState<any | null>(null);
  const [madrasaSearchTerm, setMadrasaSearchTerm] = useState<string>('');
  const [debouncedMadrasaSearchTerm, setDebouncedMadrasaSearchTerm] = useState<string>('');
  const [isMadrasaDropdownOpen, setIsMadrasaDropdownOpen] = useState(false);
  const [applyLateFee, setApplyLateFee] = useState<boolean>(false);
  const [marhalaStudentCounts, setMarhalaStudentCounts] = useState<MarhalaStudentCountEntry[]>([]);
  const [payments, setPayments] = useState<Partial<RegistrationFeePaymentDetail>[]>([]);
  const [totalCalculatedFee, setTotalCalculatedFee] = useState(0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [errors, setErrors] = useState<any>({});

  const { data: allExams = [], isLoading: isLoadingExams, error: examsError } = useQuery<Exam[], Error>({
    queryKey: ['examsForFeeCollection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, exam_marhala_fees!inner(*)')
        .in('status', ['preparatory'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message || 'সক্রিয় পরীক্ষা তালিকা আনতে সমস্যা হয়েছে।');
      }

      return (data || []).map((exam_db_row: any) => ({
        id: exam_db_row.id,
        name: exam_db_row.name,
        registrationDeadline: exam_db_row.registration_deadline,
        startingRegistrationNumber: exam_db_row.starting_registration_number,
        lastUsedRegistrationNumber: exam_db_row.last_used_registration_number,
        registrationFeeRegular: exam_db_row.registration_fee_regular,
        registrationFeeIrregular: exam_db_row.registration_fee_irregular,
        lateRegistrationFeeRegular: exam_db_row.late_registration_fee_regular,
        lateRegistrationFeeIrregular: exam_db_row.late_registration_fee_irregular,
        isActive: exam_db_row.is_active,
        status: exam_db_row.status,
        createdAt: exam_db_row.created_at,
        updatedAt: exam_db_row.updated_at,
        examFees: (exam_db_row.exam_marhala_fees || []).map((fee: any) => ({
          marhalaId: fee.marhala_id,
          startingRollNumber: fee.starting_roll_number,
          regularFee: fee.regular_fee,
          irregularFee: fee.irregular_fee,
          lateRegularFee: fee.late_regular_fee,
          lateIrregularFee: fee.late_irregular_fee,
        }))
      })) as Exam[];
    },
  });
  
  const { data: allMarhalas = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<Marhala[], Error>({ queryKey: ['allMarhalasForFeeCollectionPage'], queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order'); if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।'); return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend); }, });
  
  useEffect(() => { const handler = setTimeout(() => setDebouncedMadrasaSearchTerm(madrasaSearchTerm), 300); return () => clearTimeout(handler); }, [madrasaSearchTerm]);
  
  const { data: filteredMadrasasForSearch = [], isLoading: isSearchingMadrasas } = useQuery<any[], Error>({ queryKey: ['madrasaSearchForRegFeeCollection', debouncedMadrasaSearchTerm], queryFn: async () => { if (debouncedMadrasaSearchTerm.trim().length < 2) return []; const { data, error } = await supabase.rpc('get_madrasas_filtered', { p_search_term: debouncedMadrasaSearchTerm, p_limit: 10 }); if (error) throw new Error(error.message || `মাদরাসা খুঁজতে সমস্যা হয়েছে`); return data.items; }, enabled: debouncedMadrasaSearchTerm.trim().length >= 2, });

  useEffect(() => { if (examsError) addToast(examsError.message, 'error'); if (marhalasError) addToast(marhalasError.message, 'error'); }, [examsError, marhalasError, addToast]);

  const examOptions: SelectOption[] = useMemo(() => allExams.filter(exam => exam.examFees && exam.examFees.length > 0).map(exam => ({ value: exam.id, label: exam.name })), [allExams]);

  const handleSelectMadrasa = (madrasa: any) => {
    setSelectedMadrasa(madrasa);
    setMadrasaSearchTerm('');
    setIsMadrasaDropdownOpen(false);
  };
  const handleClearSelectedMadrasa = () => { setSelectedMadrasa(null); setMadrasaSearchTerm(''); };

      useEffect(() => {
    if (selectedExam && selectedMadrasa && allMarhalas.length > 0) {
      const examFeesForSelectedExam = selectedExam.examFees || [];
      const highestBoyMarhala = selectedMadrasa.highest_marhala_boys_id ? allMarhalas.find(m => m.id === selectedMadrasa.highest_marhala_boys_id) : null;
      const highestGirlMarhala = selectedMadrasa.highest_marhala_girls_id ? allMarhalas.find(m => m.id === selectedMadrasa.highest_marhala_girls_id) : null;
      const highestBoyOrder = Number(highestBoyMarhala?.marhala_order ?? 0);
      const highestGirlOrder = Number(highestGirlMarhala?.marhala_order ?? 0);
      const filteredMarhalaEntries = examFeesForSelectedExam.map(feeDetail => {
        const marhalaInfo = allMarhalas.find(m => m.id === feeDetail.marhalaId);
        if (!marhalaInfo) return null;
        let isEligible = false;
        const marhalaOrder = Number(marhalaInfo.marhala_order ?? Infinity);
        if (selectedMadrasa.type === 'boys' && marhalaInfo.type === 'boys' && marhalaOrder >= highestBoyOrder) isEligible = true;
        else if (selectedMadrasa.type === 'girls' && marhalaInfo.type === 'girls' && marhalaOrder >= highestGirlOrder) isEligible = true;
        else if (selectedMadrasa.type === 'both' && ((marhalaInfo.type === 'boys' && marhalaOrder <= highestBoyOrder) || (marhalaInfo.type === 'girls' && marhalaOrder <= highestGirlOrder))) isEligible = true;
        if (!isEligible) return null;
        return { marhalaId: feeDetail.marhalaId, marhalaName: `${marhalaInfo.nameBn} (${marhalaInfo.type === 'boys' ? 'বালক' : 'বালিকা'})`, marhalaOrder: marhalaInfo.marhala_order, regularStudents: '', irregularStudents: '', calculatedFee: 0, displayedRegNoStart: '', displayedRegNoEnd: '' };
      }).filter(entry => entry !== null) as MarhalaStudentCountEntry[];
      filteredMarhalaEntries.sort((a, b) => (a.marhalaOrder ?? Infinity) - (b.marhalaOrder ?? Infinity));
      setMarhalaStudentCounts(filteredMarhalaEntries);
    } else {
      setMarhalaStudentCounts([]);
    }
  }, [selectedExam, selectedMadrasa, allMarhalas]);

  useEffect(() => {
    if (!selectedExam) {
      setTotalCalculatedFee(0);
      setMarhalaStudentCounts(prev => prev.map(msc => ({...msc, displayedRegNoStart: '', displayedRegNoEnd: ''})));
      return;
    }
    const regularBaseFee = applyLateFee ? selectedExam.lateRegistrationFeeRegular : selectedExam.registrationFeeRegular;
    const irregularBaseFee = applyLateFee ? selectedExam.lateRegistrationFeeIrregular : selectedExam.registrationFeeIrregular;
    let currentRegNoCounter = (selectedExam.lastUsedRegistrationNumber ? selectedExam.lastUsedRegistrationNumber + 1 : selectedExam.startingRegistrationNumber) || 1;
    let totalCalculated = 0;
    const updatedMarhalaCounts = marhalaStudentCounts.map(count => {
      const regular = Number(count.regularStudents) || 0;
      const irregular = Number(count.irregularStudents) || 0;
      const totalStudentsThisMarhala = regular + irregular;
      const calculated = (regular * regularBaseFee) + (irregular * irregularBaseFee);
      totalCalculated += calculated;
      let displayedRegNoStart: number | string = '';
      let displayedRegNoEnd: number | string = '';
      if (totalStudentsThisMarhala > 0) { displayedRegNoStart = currentRegNoCounter; displayedRegNoEnd = currentRegNoCounter + totalStudentsThisMarhala - 1; currentRegNoCounter += totalStudentsThisMarhala; }
      return { ...count, calculatedFee: calculated, displayedRegNoStart, displayedRegNoEnd };
    });
    setMarhalaStudentCounts(updatedMarhalaCounts);
    setTotalCalculatedFee(totalCalculated);
  }, [selectedExam, applyLateFee, JSON.stringify(marhalaStudentCounts.map(msc => `${msc.regularStudents}-${msc.irregularStudents}`))]);

  useEffect(() => { const newTotalPaid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0); setTotalPaidAmount(newTotalPaid); }, [payments]);
  useEffect(() => { setBalanceAmount(totalCalculatedFee - totalPaidAmount); }, [totalCalculatedFee, totalPaidAmount]);

  const handleStudentCountChange = (marhalaId: string, field: 'regularStudents' | 'irregularStudents', value: string) => { setMarhalaStudentCounts(prevCounts => prevCounts.map(count => count.marhalaId === marhalaId ? { ...count, [field]: value } : count)); };
  const handleAddPayment = () => setPayments(prev => [...prev, { id: `PAYREG-${Date.now()}`, method: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] }]);
  const handleRemovePayment = (paymentId?: string) => { if (paymentId) setPayments(prev => prev.filter(p => p.id !== paymentId)); };
  const handlePaymentChange = (paymentId: string | undefined, field: keyof RegistrationFeePaymentDetail, value: string) => { if (!paymentId) return; setPayments(prevPayments => prevPayments.map(p => p.id === paymentId ? { ...p, [field]: value } : p)); };

  const validateForm = (): boolean => { 
      const newErrors: any = {}; 
      if (!selectedExam) newErrors.selectedExam = 'পরীক্ষা নির্বাচন করুন'; 
      if (!selectedMadrasa) newErrors.selectedMadrasa = 'মাদরাসা নির্বাচন করুন'; 
      let hasStudents = false; 
      marhalaStudentCounts.forEach(msc => { if ((Number(msc.regularStudents) || 0) > 0 || (Number(msc.irregularStudents) || 0) > 0) hasStudents = true; }); 
      if (!hasStudents && marhalaStudentCounts.length > 0) newErrors.marhalaStudentCounts = 'অন্তত একটি মারহালায় পরীক্ষার্থীর সংখ্যা দিন।'; 
      else if(marhalaStudentCounts.length === 0 && selectedExam && selectedMadrasa) newErrors.marhalaStudentCounts = 'নির্বাচিত মাদ্রাসার জন্য এই পরীক্ষায় কোনো যোগ্য মারহালা পাওয়া যায়নি।'; 
      
      const paymentFieldErrors: any[] = []; 
      payments.forEach((p, index) => { 
          const pErrors: any = {}; 
          if(!p.method) pErrors.method = 'পেমেন্ট পদ্ধতি নির্বাচন করুন।'; 
          if(Number(p.amount) <=0 && payments.length > 0 && totalCalculatedFee > 0) pErrors.amount = 'টাকার পরিমাণ ধনাত্মক হতে হবে।'; 
          if(!p.paymentDate && payments.length > 0 && totalCalculatedFee > 0) pErrors.paymentDate = 'পেমেন্টের তারিখ আবশ্যক।'; 
          if(p.method === 'check' && !p.checkNumber?.trim()) pErrors.checkNumber = "চেক নম্বর আবশ্যক।"; 
          if((p.method === 'mobile_banking' || p.method === 'bank_transfer') && !p.transactionId?.trim()) pErrors.transactionId = "ট্রানজেকশন আইডি আবশ্যক।"; 
          if (Object.keys(pErrors).length > 0) paymentFieldErrors[index] = pErrors; 
      }); 
      if(paymentFieldErrors.some(e => e && Object.keys(e).length > 0)) newErrors.payments = paymentFieldErrors; 
      
      if (totalPaidAmount > totalCalculatedFee) newErrors.paymentAmountOverall = `মোট জমাকৃত অর্থ (${totalPaidAmount.toLocaleString('bn-BD')}৳) মোট ফি (${totalCalculatedFee.toLocaleString('bn-BD')}৳) এর চেয়ে বেশি হতে পারবে না।`; 
      if (totalPaidAmount <= 0 && totalCalculatedFee > 0) { 
          if (payments.length === 0 && !newErrors.payments) newErrors.noPaymentMade = 'কোনো ফি জমা করা হয়নি।'; 
          else if (payments.every(p => Number(p.amount) <= 0) && !newErrors.payments) newErrors.noPaymentMade = 'জমাকৃত অর্থের পরিমাণ শূন্য।';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const createFeeCollectionMutation = useMutation({
    mutationFn: async (payload: any) => { 
        const { data, error } = await supabase.rpc('create_registration_fee_collection_v2', payload); 
        if (error) throw error; 
        return data; 
    },
    onSuccess: () => {
        addToast('নিবন্ধন ফি সফলভাবে গ্রহণ করা হয়েছে!', 'success');
        queryClient.invalidateQueries({ queryKey: ['collectionsList', 'registration_fee'] });
        queryClient.invalidateQueries({ queryKey: ['examsForFeeCollection'] });
        // Reset form state here if needed, for now, we just show a success message.
    },
    onError: (error: PostgrestError | Error) => {
        addToast(`ফি সংগ্রহে ত্রুটি: ${error.message}`, 'error', 7000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { 
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে সরি করুন।', 'error', 7000); 
        return; 
    }

    const collectionPayload = {
        p_exam_id: selectedExam!.id,
        p_madrasa_id: selectedMadrasa!.id,
        p_apply_late_fee: applyLateFee,
        p_collection_date: new Date().toISOString(),
        p_total_calculated_fee: totalCalculatedFee,
        p_marhala_counts: marhalaStudentCounts
        .map(msc => ({
                marhalaId: msc.marhalaId,
                regularStudents: Number(msc.regularStudents) || 0,
                irregularStudents: Number(msc.irregularStudents) || 0,
                calculatedFee: msc.calculatedFee,
                displayedRegNoStart: Number(msc.displayedRegNoStart) || null,
                displayedRegNoEnd: Number(msc.displayedRegNoEnd) || null
            })),
        p_payments: payments.map(p => ({ 
            ...p, 
            amount: Number(p.amount) 
        }))
    };

    createFeeCollectionMutation.mutate(collectionPayload);
  };
  
  if (isLoadingExams || isLoadingMarhalas) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
            <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-xl text-gray-700">ফর্মের জন্য তথ্য লোড হচ্ছে...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নিবন্ধন ফি গ্রহণ</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="সাধারণ তথ্য">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
            <Select label="পরীক্ষা" value={selectedExam?.id || ''} onChange={e => setSelectedExam(allExams.find(ex => ex.id === e.target.value) || null)} options={examOptions} error={errors.selectedExam} placeholderOption="পরীক্ষা নির্বাচন করুন" required/>
            <div className="relative">
              <label htmlFor="madrasaSearchRegFeeLeft" className="block text-sm font-medium text-gray-700"> মাদরাসা {errors.selectedMadrasa && <span className="text-red-500">*</span>} </label>
              {selectedMadrasa ? (
                <div className="flex items-center justify-between p-2.5 mt-0.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 min-h-[38px]">
                  <span>{selectedMadrasa.name_bn} ({selectedMadrasa.madrasa_code})</span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearSelectedMadrasa} className="p-0.5 text-gray-500 hover:text-red-500" aria-label="মাদরাসা রিসেট করুন"><XMarkIcon className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Input id="madrasaSearchRegFeeLeft" type="text" placeholder="মাদ্রাসার নাম বা কোড দিয়ে খুঁজুন..." value={madrasaSearchTerm} onChange={(e) => {setMadrasaSearchTerm(e.target.value); if(!isMadrasaDropdownOpen) setIsMadrasaDropdownOpen(true);}} onBlur={() => setTimeout(() => setIsMadrasaDropdownOpen(false), 150)} onFocus={() => setIsMadrasaDropdownOpen(true)} error={errors.selectedMadrasaId && !selectedMadrasa ? errors.selectedMadrasaId : undefined} wrapperClassName="mb-0 mt-0.5" className="h-9 text-sm"/>
              )}
              {isSearchingMadrasas && isMadrasaDropdownOpen && <p className="text-xs text-gray-500">অনুসন্ধান করা হচ্ছে...</p>}
              {isMadrasaDropdownOpen && madrasaSearchTerm && filteredMadrasasForSearch.length > 0 && !isSearchingMadrasas && (
                <ul className="absolute w-full border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                  {filteredMadrasasForSearch.map(m => ( <li key={m.id} onClick={() => handleSelectMadrasa(m)} className="p-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-800"> {m.name_bn} ({m.madrasa_code}) </li> ))}
                </ul>
              )}
            </div>
            <div className="pt-6"><Switch label="বিলম্ব ফি প্রযোজ্য" checked={applyLateFee} onChange={setApplyLateFee}/></div>
          </div>
        </Card>
        {selectedExam && selectedMadrasa && (<Card title="মারহালা-ভিত্তিক পরীক্ষার্থীর সংখ্যা ও ফি"> {marhalaStudentCounts.length > 0 ? (<div className="space-y-4">{marhalaStudentCounts.map((msc) => { const marhalaError = errors.marhalaStudentCountsDetails?.[msc.marhalaId]?.studentCount; return (<fieldset key={msc.marhalaId} className="border p-3 rounded-md bg-gray-50/70"><legend className="text-sm font-semibold text-gray-600 px-1">{msc.marhalaName}</legend><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-2 mt-1 items-start"><Input label="নিয়মিত" type="number" min="0" value={String(msc.regularStudents)} onChange={e => handleStudentCountChange(msc.marhalaId, 'regularStudents', e.target.value)} wrapperClassName="mb-0 text-xs" error={marhalaError}/><Input label="অনিয়মিত" type="number" min="0" value={String(msc.irregularStudents)} onChange={e => handleStudentCountChange(msc.marhalaId, 'irregularStudents', e.target.value)} wrapperClassName="mb-0 text-xs" error={marhalaError}/><div className="pt-1"><label className="block text-xs font-medium text-gray-700 mb-0.5">গণনাকৃত ফি</label><p className="text-md font-semibold text-emerald-600 h-9 flex items-center">{msc.calculatedFee ? msc.calculatedFee.toLocaleString('bn-BD') : '০'} ৳</p></div><div className="pt-1"><label className="block text-xs font-medium text-gray-700 mb-0.5">নিবন্ধন নং রেঞ্জ (তথ্যমূলক)</label><p className="text-md font-semibold text-blue-600 h-9 flex items-center">{(msc.displayedRegNoStart && msc.displayedRegNoEnd) ? `${msc.displayedRegNoStart.toLocaleString('bn-BD')}-${msc.displayedRegNoEnd.toLocaleString('bn-BD')}` : 'N/A'}</p></div></div></fieldset> )})} {errors.marhalaStudentCounts && <p className="text-sm text-red-500 mt-2">{errors.marhalaStudentCounts}</p>}</div>) : (<p className="text-center text-gray-500 py-4">এই পরীক্ষার জন্য নির্বাচিত মাদ্রাসার কোনো যোগ্য মারহালা পাওয়া যায়নি।</p>)} </Card> )}
        <Card title="পেমেন্টের তথ্য">{payments.map((payment, index) => { const paymentError = errors.payments?.[index] || {}; return ( <div key={payment.id} className="border p-3 rounded-md mb-3 bg-white shadow-sm relative"><Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePayment(payment.id!)} className="absolute top-1 right-1 p-0.5 text-red-400 hover:text-red-600"><TrashIcon className="w-3.5 h-3.5" /></Button><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2"><Select label="পদ্ধতি" value={payment.method || ''} onChange={e => handlePaymentChange(payment.id!, 'method', e.target.value)} options={PAYMENT_METHODS} error={paymentError.method} required wrapperClassName="text-xs" placeholderOption="পদ্ধতি নির্বাচন"/><Input label="পরিমাণ" type="number" min="0" value={String(payment.amount || '')} onChange={e => handlePaymentChange(payment.id!, 'amount', e.target.value)} error={paymentError.amount} required wrapperClassName="text-xs"/><Input label="তারিখ" type="date" value={payment.paymentDate || ''} onChange={e => handlePaymentChange(payment.id!, 'paymentDate', e.target.value)} error={paymentError.paymentDate} required wrapperClassName="text-xs"/>{payment.method === 'check' && ( <> <Input label="ব্যাংক" value={payment.bankName || ''} onChange={e => handlePaymentChange(payment.id!, 'bankName', e.target.value)} wrapperClassName="text-xs"/>                 <Input label="ব্রাঞ্চ" value={payment.branchName || ''} onChange={e => handlePaymentChange(payment.id!, 'branchName', e.target.value)} wrapperClassName="text-xs"/> <Input label="চেক নং" value={payment.checkNumber || ''} onChange={e => handlePaymentChange(payment.id!, 'checkNumber', e.target.value)} error={paymentError.checkNumber} required wrapperClassName="text-xs"/> </> )}{payment.method === 'mobile_banking' && ( <> <Input label="সেবাদাতা" value={payment.mobileBankingProvider || ''} onChange={e => handlePaymentChange(payment.id!, 'mobileBankingProvider', e.target.value)} wrapperClassName="text-xs"/> <Input label="প্রেরকের নম্বর" value={payment.senderNumber || ''} onChange={e => handlePaymentChange(payment.id!, 'senderNumber', e.target.value)} wrapperClassName="text-xs"/> <Input label="ট্রানজেকশন আইডি" value={payment.transactionId || ''} onChange={e => handlePaymentChange(payment.id!, 'transactionId', e.target.value)} error={paymentError.transactionId} required wrapperClassName="text-xs"/> </> )}{payment.method === 'bank_transfer' && ( <> <Input label="ব্যাংক" value={payment.bankName || ''} onChange={e => handlePaymentChange(payment.id!, 'bankName', e.target.value)} wrapperClassName="text-xs"/> <Input label="ব্রাঞ্চ" value={payment.branchName || ''} onChange={e => handlePaymentChange(payment.id!, 'branchName', e.target.value)} wrapperClassName="text-xs"/> <Input label="ট্রানজেকশন আইডি" value={payment.transactionId || ''} onChange={e => handlePaymentChange(payment.id!, 'transactionId', e.target.value)} error={paymentError.transactionId} required wrapperClassName="text-xs"/> </> )}<Input label="নোট" value={payment.notes || ''} onChange={e => handlePaymentChange(payment.id!, 'notes', e.target.value)} wrapperClassName="text-xs"/></div></div> )})} <Button type="button" variant="secondary" onClick={handleAddPayment} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>আরও পেমেন্ট যোগ করুন</Button>{errors.payments && <p className="text-sm text-red-500 mt-2">পেমেন্টের তথ্যে ত্রুটি রয়েছে।</p>}{errors.noPaymentMade && <p className="text-sm text-red-500 mt-2">{errors.noPaymentMade}</p>}{errors.paymentAmountOverall && <p className="text-sm text-red-500 mt-2">{errors.paymentAmountOverall}</p>}{errors.apiError && <p className="text-sm text-red-500 mt-2">{errors.apiError}</p>}</Card>
        <Card title="হিসাবের সারসংক্ষেপ" className="sticky bottom-0 bg-white z-10 shadow-lg border"><div className="grid grid-cols-3 gap-3 text-center sm:text-right p-4"><div><p className="text-sm text-gray-600">মোট ফি:</p><p className="text-xl font-bold text-emerald-700">{totalCalculatedFee.toLocaleString('bn-BD')} ৳</p></div><div><p className="text-sm text-gray-600">মোট জমা:</p><p className="text-xl font-bold text-blue-600">{totalPaidAmount.toLocaleString('bn-BD')} ৳</p></div><div><p className="text-sm text-gray-600">অবশিষ্ট:</p><p className={`text-xl font-bold ${balanceAmount >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{balanceAmount.toLocaleString('bn-BD')} ৳</p></div></div></Card>
        <div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => navigate('/finance/collections/list')} disabled={createFeeCollectionMutation.isPending}>বাতিল করুন</Button><Button type="submit" leftIcon={<CurrencyBangladeshiIcon className="w-5 h-5" />} disabled={createFeeCollectionMutation.isPending || totalCalculatedFee <= 0}>ফি সংগ্রহ করুন</Button></div>
      </form>
    </div>
  );
};

export default RegistrationFeeCollectionPage;