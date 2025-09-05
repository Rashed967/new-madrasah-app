import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Examinee, Exam, Madrasa, SelectOption, ExamFeePaymentDetail, StudentType, MarhalaSpecificType, ExamStatus } from '../../../types';
import { PAYMENT_METHODS } from '../../../constants';
import { PlusCircleIcon, CurrencyBangladeshiIcon, XMarkIcon, UsersIcon, TrashIcon, ArrowPathIcon } from '../../../components/ui/Icon';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

interface EligibleExaminee extends Examinee {
    applicableFee: number;
    marhalaNameBn?: string; // For display
    marhalaType?: MarhalaSpecificType; // For display
}

const ExamFeeCollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedMadrasaId, setSelectedMadrasaId] = useState<string>('');
  const [madrasaSearchTerm, setMadrasaSearchTerm] = useState<string>('');
  const [debouncedMadrasaSearchTerm, setDebouncedMadrasaSearchTerm] = useState<string>('');
  const [selectedMadrasaDisplayName, setSelectedMadrasaDisplayName] = useState<string>('');
  const [isMadrasaDropdownOpen, setIsMadrasaDropdownOpen] = useState(false);

  const [applyLateFee, setApplyLateFee] = useState<boolean>(false);
  const [availableExaminees, setAvailableExaminees] = useState<EligibleExaminee[]>([]);
  const [selectedExamineeIds, setSelectedExamineeIds] = useState<string[]>([]);

  const [payments, setPayments] = useState<Partial<ExamFeePaymentDetail>[]>([]);
  
  const [totalCalculatedFee, setTotalCalculatedFee] = useState(0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [errors, setErrors] = useState<any>({});

  const { data: allExams = [], isLoading: isLoadingExams, error: examsError } = useQuery<Exam[], Error>({
    queryKey: ['activeExamsForExamFeeCollectionPage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, exam_marhala_fees!inner(*)')
        .eq('is_active', true)
        .in('status', ['preparatory']) 
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(exam_db_row => ({
        id: exam_db_row.id, name: exam_db_row.name, registrationDeadline: exam_db_row.registration_deadline,
        startingRegistrationNumber: exam_db_row.starting_registration_number, registrationFeeRegular: exam_db_row.registration_fee_regular,
        registrationFeeIrregular: exam_db_row.registration_fee_irregular, lateRegistrationFeeRegular: exam_db_row.late_registration_fee_regular,
        lateRegistrationFeeIrregular: exam_db_row.late_registration_fee_irregular, isActive: exam_db_row.is_active,
        status: exam_db_row.status as ExamStatus, createdAt: exam_db_row.created_at, updatedAt: exam_db_row.updated_at,
        examFees: (exam_db_row.exam_marhala_fees || []).map((dbFee: any) => ({
            marhalaId: dbFee.marhala_id, startingRollNumber: dbFee.starting_roll_number, regularFee: dbFee.regular_fee,
            irregularFee: dbFee.irregular_fee, lateRegularFee: dbFee.late_regular_fee, lateIrregularFee: dbFee.late_irregular_fee,
        })),
      })) as Exam[];
    },
  });
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedMadrasaSearchTerm(madrasaSearchTerm), 300);
    return () => clearTimeout(handler);
  }, [madrasaSearchTerm]);

  const { data: madrasaSearchResults, isLoading: isSearchingMadrasas } = useQuery<Madrasa[], Error>({
    queryKey: ['madrasaSearchForExamFeeCollection', debouncedMadrasaSearchTerm],
    queryFn: async () => {
      if (debouncedMadrasaSearchTerm.trim().length < 2) return [];
      const { data, error } = await supabase.rpc('get_madrasas_filtered', { p_search_term: debouncedMadrasaSearchTerm, p_limit: 10 });
      if (error) throw new Error(error.message || `মাদরাসা খুঁজতে সমস্যা হয়েছে`);
      return (data.items as any[]).map(dbRow => ({
          id: dbRow.id,
          madrasaCode: dbRow.madrasa_code,
          nameBn: dbRow.name_bn,
          nameAr: dbRow.name_ar,
          nameEn: dbRow.name_en || undefined,
          address: {
              village: dbRow.address.village,
              upazila: dbRow.address.upazila,
              district: dbRow.address.district,
              division: dbRow.address.division,
              contactPersonName: dbRow.address.contact_person_name,
              holding: dbRow.address.holding || undefined,
              postOffice: dbRow.address.post_office || undefined,
          },
          zoneId: dbRow.zone_id,
          mobile1: dbRow.mobile1,
          mobile2: dbRow.mobile2 || undefined,
          type: dbRow.type,
          dispatchMethod: dbRow.dispatch_method,
          highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined,
          highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
          muhtamim: { name: dbRow.muhtamim.name, mobile: dbRow.muhtamim.mobile },
          registrationDate: dbRow.registration_date,
      }));
    },
    enabled: debouncedMadrasaSearchTerm.trim().length >= 2 && !selectedMadrasaId,
  });

 const { data: eligibleExamineesData, isLoading: isLoadingEligibleExaminees, refetch: refetchEligibleExaminees } = useQuery<{ examinees: EligibleExaminee[], totalEligible: number }, Error>({
    queryKey: ['eligibleExamineesForExamFee', selectedExamId, selectedMadrasaId, applyLateFee],
    queryFn: async () => {
      if (!selectedExamId || !selectedMadrasaId) return { examinees: [], totalEligible: 0 };
      const { data: rpcData, error } = await supabase.rpc('get_eligible_examinees_for_exam_fee', {
        p_exam_id: selectedExamId,
        p_madrasa_id: selectedMadrasaId,
        p_apply_late_fee: applyLateFee
      });

      if (error) throw error;
      if (!rpcData || !Array.isArray(rpcData.examinees)) {
          console.warn('RPC get_eligible_examinees_for_exam_fee did not return expected examinees array:', rpcData);
          return { examinees: [], totalEligible: 0 };
      }

      const mappedExaminees = rpcData.examinees
        .filter((dbEx: any) => dbEx && typeof dbEx === 'object' && dbEx.id)
        .map((dbEx: any) => ({
            id: dbEx.id,
            nameBn: dbEx.name_bn || 'নাম নেই',
            registrationNumber: Number(dbEx.registration_number) || 0,
            marhalaId: dbEx.marhala_id || 'unknown-marhala-id',
            studentType: (dbEx.student_type || 'regular') as StudentType,
            applicableFee: Number(dbEx.applicable_fee) || 0,
            marhalaNameBn: dbEx.marhala_name_bn || 'মারহালা নেই',
            marhalaType: (dbEx.marhala_type || 'boys') as MarhalaSpecificType,
            registrationFeeCollectionId: 'N/A',
            examId: selectedExamId!,
            madrasaId: selectedMadrasaId!,
            fatherNameBn: dbEx.father_name_bn || 'N/A',
            motherNameBn: dbEx.mother_name_bn || 'N/A',
            dateOfBirth: dbEx.date_of_birth || new Date(0).toISOString(),
            nidOrBirthCert: dbEx.nid_or_birth_cert || 'N/A',
            status: (dbEx.status || 'fee_pending') as Examinee['status'],
            registrationInputDate: dbEx.registration_input_date || new Date().toISOString(),
        } as EligibleExaminee));

      return {
        examinees: mappedExaminees,
        totalEligible: rpcData.totalEligible || 0,
      };
    },
    enabled: !!selectedExamId && !!selectedMadrasaId,
  });

  useEffect(() => {
    if (eligibleExamineesData) {
      setAvailableExaminees(eligibleExamineesData.examinees || []);
      setSelectedExamineeIds([]);
    }
  }, [eligibleExamineesData]);

  useEffect(() => { if (examsError) addToast(examsError.message, 'error'); }, [examsError, addToast]);
  
  const examOptionsSelect: SelectOption[] = useMemo(() => allExams.map(exam => ({ value: exam.id, label: exam.name })), [allExams]);

  const handleSelectMadrasa = (madrasa: Madrasa) => {
    setSelectedMadrasaId(madrasa.id);
    setSelectedMadrasaDisplayName(`${madrasa.nameBn} (কোড: ${madrasa.madrasaCode})`);
    setMadrasaSearchTerm('');
    setIsMadrasaDropdownOpen(false);
  };

  const handleClearSelectedMadrasa = () => { setSelectedMadrasaId(''); setSelectedMadrasaDisplayName(''); setMadrasaSearchTerm(''); setAvailableExaminees([]); };
  
  useEffect(() => {
    const newTotalFee = selectedExamineeIds.reduce((sum, id) => {
      const examinee = availableExaminees.find(ex => ex.id === id);
      return sum + (examinee ? examinee.applicableFee : 0);
    }, 0);
    setTotalCalculatedFee(newTotalFee);
  }, [selectedExamineeIds, availableExaminees]);

  useEffect(() => {
    const newTotalPaid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    setTotalPaidAmount(newTotalPaid);
  }, [payments]);

  useEffect(() => { setBalanceAmount(totalCalculatedFee - totalPaidAmount); }, [totalCalculatedFee, totalPaidAmount]);

  const handleSelectExaminee = (examineeId: string, checked: boolean) => setSelectedExamineeIds(prev => checked ? [...prev, examineeId] : prev.filter(id => id !== examineeId));
  const handleSelectAllExaminees = (checked: boolean) => setSelectedExamineeIds(checked ? availableExaminees.map(ex => ex.id) : []);
  
  const handleAddPayment = () => setPayments(prev => [...prev, { id: `PAYEXF-${Date.now()}`, method: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] }]);
  const handleRemovePayment = (paymentId: string) => setPayments(prev => prev.filter(p => p.id !== paymentId));
  const handlePaymentChange = (paymentId: string | undefined, field: keyof ExamFeePaymentDetail, value: string) => { if (!paymentId) return; setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, [field]: value } : p )); };

  const validateForm = (): boolean => { 
    const newErrors: any = {};
    if (!selectedExamId) newErrors.selectedExam = 'পরীক্ষা নির্বাচন করুন';
    if (!selectedMadrasaId) newErrors.selectedMadrasa = 'মাদরাসা নির্বাচন করুন';
    if (selectedExamineeIds.length === 0) newErrors.selectedExaminees = 'অন্তত একজন পরীক্ষার্থী নির্বাচন করুন।';

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
    if(paymentFieldErrors.some(e => e && Object.keys(e).length > 0)) newErrors.paymentsValidation = paymentFieldErrors;
    
    if (totalPaidAmount > totalCalculatedFee) newErrors.paymentAmountOverall = `মোট জমাকৃত অর্থ (${totalPaidAmount.toLocaleString('bn-BD')}৳) মোট প্রদেয় ফি (${totalCalculatedFee.toLocaleString('bn-BD')}৳) এর চেয়ে বেশি হতে পারবে না।`;
    if (totalPaidAmount <= 0 && totalCalculatedFee > 0) {
        if (payments.length === 0 && !newErrors.paymentsValidation) newErrors.noPaymentMade = 'কোনো ফি জমা করা হয়নি।';
        else if (payments.every(p => Number(p.amount) <= 0) && !newErrors.paymentsValidation) newErrors.noPaymentMade = 'জমাকৃত অর্থের পরিমাণ শূন্য।';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createExamFeeCollectionMutation = useMutation({
    mutationFn: async (payload: any) => {
        const { data, error } = await supabase.rpc('create_exam_fee_collection_v2', payload);
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        addToast('পরীক্ষার ফি সফলভাবে গ্রহণ করা হয়েছে!', 'success');
        queryClient.invalidateQueries({ queryKey: ['collectionsList', 'exam_fee'] });
        refetchEligibleExaminees();
    },
    onError: (error: PostgrestError | Error) => {
        addToast(`ফি সংগ্রহে ত্রুটি: ${error.message}`, 'error', 7000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error', 7000);
        return;
    }

    const examineeFeeDetailsPayload = selectedExamineeIds.map(id => {
      const ex = availableExaminees.find(e => e.id === id)!;
      return {
        examineeId: ex.id,
        paidFee: ex.applicableFee,
        studentType: ex.studentType,
        marhalaId: ex.marhalaId,
      };
    });

    const paymentsPayload = payments.map(p => ({ ...p, amount: Number(p.amount) }));

    createExamFeeCollectionMutation.mutate({
      p_exam_id: selectedExamId,
      p_madrasa_id: selectedMadrasaId,
      p_apply_late_fee: applyLateFee,
      p_collection_date: new Date().toISOString(),
      p_total_calculated_fee: totalCalculatedFee,
      p_examinee_fee_details_json: examineeFeeDetailsPayload,
      p_payments_json: paymentsPayload,
    });
  };
  
  if (isLoadingExams) return <div className="flex justify-center items-center h-64"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-2"/><p>পরীক্ষার তথ্য লোড হচ্ছে...</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">পরীক্ষার ফি গ্রহণ</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="সাধারণ তথ্য" bodyClassName="p-4" titleClassName="p-4 text-lg text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
            <Select label="পরীক্ষা" value={selectedExamId} onChange={e => {setSelectedExamId(e.target.value); setAvailableExaminees([]); setSelectedExamineeIds([]);}} options={examOptionsSelect} placeholderOption="পরীক্ষা নির্বাচন করুন" required />
            <div className="relative">
              <label htmlFor="madrasaSearchExamFeePage" className="block text-sm font-medium text-gray-700"> মাদরাসা {errors.selectedMadrasa && <span className="text-red-500">*</span>} </label>
              {selectedMadrasaId && selectedMadrasaDisplayName ? (
                <div className="flex items-center justify-between p-2.5 mt-1 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 min-h-[40px]">
                  <span>{selectedMadrasaDisplayName}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearSelectedMadrasa} className="p-1 text-gray-500 hover:text-red-500" aria-label="রিসেট"><XMarkIcon className="w-4 h-4" /></Button>
                </div>
              ) : (
                 <Input id="madrasaSearchExamFeePage" type="text" placeholder="মাদ্রাসার নাম বা কোড..." value={madrasaSearchTerm} onChange={(e) => {setMadrasaSearchTerm(e.target.value); setIsMadrasaDropdownOpen(true);}} onBlur={() => setTimeout(() => setIsMadrasaDropdownOpen(false), 150)} onFocus={() => setIsMadrasaDropdownOpen(true)} error={errors.selectedMadrasaId && !selectedMadrasaId ? errors.selectedMadrasaId : undefined} wrapperClassName="mb-0 mt-1" />
              )}
              {isSearchingMadrasas && isMadrasaDropdownOpen && <p className="text-xs text-gray-500">অনুসন্ধান করা হচ্ছে...</p>}
              {isMadrasaDropdownOpen && madrasaSearchTerm && madrasaSearchResults && madrasaSearchResults.length > 0 && !isSearchingMadrasas && (
                <ul className="absolute w-full border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                  {madrasaSearchResults.map(m => ( <li key={m.id} onMouseDown={() => handleSelectMadrasa(m)} className="p-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-800">{m.nameBn} ({m.madrasaCode})</li> ))}
                </ul>
              )}
            </div>
            <div className="pt-6"><Switch label="বিলম্ব ফি প্রযোজ্য?" checked={applyLateFee} onChange={setApplyLateFee} /></div>
          </div>
        </Card>

        {selectedExamId && selectedMadrasaId && (
          <Card title="পরীক্ষার্থী নির্বাচন ও ফি" bodyClassName="p-0" titleClassName="p-4 text-lg text-black">
            {isLoadingEligibleExaminees ? <div className="p-4 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline mr-2"/> পরীক্ষার্থী লোড হচ্ছে...</div> :
            availableExaminees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2 text-center"><Checkbox id="selectAllExaminees" checked={availableExaminees.length > 0 && selectedExamineeIds.length === availableExaminees.length} onChange={(e) => handleSelectAllExaminees(e.target.checked)} /></th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">রেজি. নং</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">নাম</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">মারহালা</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">ধরণ</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">পরীক্ষার ফি (৳)</th>
                  </tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availableExaminees.map(ex => (
                      <tr key={ex.id} className={`${selectedExamineeIds.includes(ex.id) ? 'bg-emerald-50' : ''} hover:bg-gray-50`}>
                        <td className="px-4 py-2 text-center"><Checkbox id={`ex-${ex.id}`} checked={selectedExamineeIds.includes(ex.id)} onChange={(e) => handleSelectExaminee(ex.id, e.target.checked)} /></td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{(ex.registrationNumber ?? 0).toLocaleString('bn-BD')}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{ex.nameBn}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">{`${ex.marhalaNameBn || 'N/A'} (${ex.marhalaType === 'boys' ? 'বালক' : 'বালিকা'})`}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">{ex.studentType === 'regular' ? 'নিয়মিত' : 'অনিয়মিত'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-emerald-700 font-semibold text-right">{(ex.applicableFee ?? 0).toLocaleString('bn-BD')}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            ) : ( <p className="p-4 text-center text-gray-500">এই মাদরাসার জন্য কোনো যোগ্য (ফি বাকি থাকা) পরীক্ষার্থী পাওয়া যায়নি।</p> )}
            {errors.selectedExaminees && <p className="text-sm text-red-500 p-3">{errors.selectedExaminees}</p>}
          </Card>
        )}
        
        <Card title="পেমেন্টের তথ্য" bodyClassName="p-4" titleClassName="p-4 text-lg text-black">
           {payments.map((payment, index) => {   const paymentError = errors.paymentsValidation?.[index] || {}; return ( <div key={payment.id} className="border p-3 rounded-md mb-3 bg-white shadow-sm relative"><Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePayment(payment.id!)} className="absolute top-1 right-1 p-0.5 text-red-400 hover:text-red-600"><TrashIcon className="w-3.5 h-3.5" /></Button><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2"><Select label="পদ্ধতি" value={payment.method || ''} onChange={e => handlePaymentChange(payment.id!, 'method', e.target.value)} options={PAYMENT_METHODS} error={paymentError.method} required wrapperClassName="text-xs" placeholderOption="পদ্ধতি নির্বাচন"/><Input label="পরিমাণ" type="number" min="0" value={String(payment.amount || '')} onChange={e => handlePaymentChange(payment.id!, 'amount', e.target.value)} error={paymentError.amount} required wrapperClassName="text-xs"/><Input label="তারিখ" type="date" value={payment.paymentDate || ''} onChange={e => handlePaymentChange(payment.id!, 'paymentDate', e.target.value)} error={paymentError.paymentDate} required wrapperClassName="text-xs"/>{payment.method === 'check' && ( <> <Input label="ব্যাংক" value={payment.bankName || ''} onChange={e => handlePaymentChange(payment.id!, 'bankName', e.target.value)} wrapperClassName="text-xs"/> <Input label="ব্রাঞ্চ" value={payment.branchName || ''} onChange={e => handlePaymentChange(payment.id!, 'branchName', e.target.value)} wrapperClassName="text-xs"/> <Input label="চেক নং" value={payment.checkNumber || ''} onChange={e => handlePaymentChange(payment.id!, 'checkNumber', e.target.value)} error={paymentError.checkNumber} required wrapperClassName="text-xs"/> </> )}{payment.method === 'mobile_banking' && ( <> <Input label="সেবাদাতা" value={payment.mobileBankingProvider || ''} onChange={e => handlePaymentChange(payment.id!, 'mobileBankingProvider', e.target.value)} wrapperClassName="text-xs"/> <Input label="প্রেরকের নম্বর" value={payment.senderNumber || ''} onChange={e => handlePaymentChange(payment.id!, 'senderNumber', e.target.value)} wrapperClassName="text-xs"/> <Input label="ট্রানজেকশন আইডি" value={payment.transactionId || ''} onChange={e => handlePaymentChange(payment.id!, 'transactionId', e.target.value)} error={paymentError.transactionId} required wrapperClassName="text-xs"/> </> )}{payment.method === 'bank_transfer' && ( <> <Input label="ব্যাংক" value={payment.bankName || ''} onChange={e => handlePaymentChange(payment.id!, 'bankName', e.target.value)} wrapperClassName="text-xs"/> <Input label="ব্রাঞ্চ" value={payment.branchName || ''} onChange={e => handlePaymentChange(payment.id!, 'branchName', e.target.value)} wrapperClassName="text-xs"/> <Input label="ট্রানজেকশন আইডি" value={payment.transactionId || ''} onChange={e => handlePaymentChange(payment.id!, 'transactionId', e.target.value)} error={paymentError.transactionId} required wrapperClassName="text-xs"/> </> )}<Input label="নোট" value={payment.notes || ''} onChange={e => handlePaymentChange(payment.id!, 'notes', e.target.value)} wrapperClassName="text-xs"/></div></div> )})} <Button type="button" variant="secondary" onClick={handleAddPayment} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>আরও পেমেন্ট যোগ করুন</Button>{errors.paymentsValidation && <p className="text-sm text-red-500 mt-2">পেমেন্টের তথ্যে ত্রুটি রয়েছে।</p>}{errors.noPaymentMade && <p className="text-sm text-red-500 mt-2">{errors.noPaymentMade}</p>}{errors.paymentAmountOverall && <p className="text-sm text-red-500 mt-2">{errors.paymentAmountOverall}</p>}</Card>
        <Card title="হিসাবের সারসংক্ষেপ" className="sticky bottom-0 bg-white z-10 shadow-lg border" bodyClassName="p-0"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4"><div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md"><UsersIcon className="w-6 h-6 text-gray-500"/><div><p className="text-xs text-gray-500">মোট পরীক্ষার্থী:</p><p className="text-lg font-bold text-gray-700">{selectedExamineeIds.length.toLocaleString('bn-BD')}</p></div></div><div><p className="text-sm text-gray-600">মোট প্রদেয় ফি:</p><p className="text-xl font-bold text-emerald-700">{totalCalculatedFee.toLocaleString('bn-BD')} ৳</p></div><div><p className="text-sm text-gray-600">মোট জমা:</p><p className="text-xl font-bold text-blue-600">{totalPaidAmount.toLocaleString('bn-BD')} ৳</p></div><div><p className="text-sm text-gray-600">অবশিষ্ট:</p><p className={`text-xl font-bold ${balanceAmount >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{balanceAmount.toLocaleString('bn-BD')} ৳</p></div></div></Card>
        <div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="secondary" onClick={() => navigate('/finance/collections/list')} disabled={createExamFeeCollectionMutation.isPending}>বাতিল করুন</Button><Button type="submit" leftIcon={<CurrencyBangladeshiIcon className="w-5 h-5" />} disabled={createExamFeeCollectionMutation.isPending || selectedExamineeIds.length === 0}>ফি সংগ্রহ করুন</Button></div>
      </form>
    </div>
  );
};
export default ExamFeeCollectionPage;