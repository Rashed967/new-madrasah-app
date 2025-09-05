
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { Tabs } from '../../../components/ui/Tabs';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Transaction, TransactionCategory, TransactionType, SelectOption, Madrasa } from '../../../types';

import { ArrowPathIcon, CurrencyBangladeshiIcon, PlusCircleIcon, DocumentDuplicateIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '../../../components/ui/Icon';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const initialFormData: Omit<Transaction, 'id' | 'type'> = {
  transaction_date: new Date().toISOString().split('T')[0],
  category_id: '',
  amount: 0,
  party_name: '',
  voucher_no: '',
  description: '',
};

const IncomeExpenseEntryPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TransactionType>('income');
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<any>({});

  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<TransactionCategory[], Error>({
    queryKey: ['transaction_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transaction_categories').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: madrasas = [], isLoading: isLoadingMadrasas } = useQuery<Madrasa[], Error>({
    queryKey: ['madrasas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('madrasas').select('id, name_bn, madrasa_code');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const madrasaOptions = useMemo(() => 
    madrasas.map(m => ({ value: m.name_bn, label: `${m.name_bn} - ${m.madrasa_code}`, code: m.madrasa_code.toString() }))
  , [madrasas]);

  const incomeCategories: SelectOption[] = useMemo(() => 
    categories.filter(c => c.type === 'income').map(c => ({ value: c.id, label: c.name })), 
  [categories]);

  const expenseCategories: SelectOption[] = useMemo(() =>
    categories.filter(c => c.type === 'expense').map(c => ({ value: c.id, label: c.name })),
  [categories]);

  useEffect(() => {
    setFormData(initialFormData);
    setErrors({});
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prevErr:any) => ({ ...prevErr, [name]: undefined }));
  };

  const handlePartyNameChange = (value: string | null) => {
    setFormData(prev => ({ ...prev, party_name: value || '' }));
  };
  
  const handleDateChange = (dateString: string) => {
    setFormData(prev => ({...prev, transaction_date: dateString }));
    if(errors.transaction_date) setErrors((prevErr:any) => ({...prevErr, transaction_date: undefined}));
  };

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const { data, error } = await supabase.rpc('create_transaction', transactionData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      addToast(`${activeTab === 'income' ? 'আয়' : 'ব্যয়'} সফলভাবে যোগ করা হয়েছে।`, 'success');
      setFormData(initialFormData); // Reset form
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Invalidate any list views
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`লেনদেন যোগ করতে সমস্যা: ${error.message}`, 'error');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: any = {};
    if (!formData.transaction_date) newErrors.transaction_date = 'তারিখ আবশ্যক।';
    if (!formData.category_id) newErrors.category_id = 'খাত নির্বাচন করুন।';
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) newErrors.amount = 'টাকার পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে।';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('অনুগ্রহ করে ফর্মের ত্রুটিগুলো সংশোধন করুন।', 'warning');
      return;
    }

    createTransactionMutation.mutate({
      p_transaction_date: formData.transaction_date,
      p_category_id: formData.category_id,
      p_amount: Number(formData.amount),
      p_type: activeTab,
      p_party_name: formData.party_name || null,
      p_voucher_no: formData.voucher_no || null,
      p_description: formData.description || null,
    });
  };
  
  const tabs = [
    { id: 'income' as TransactionType, label: 'আয়ের হিসাব', icon: <ArrowUpCircleIcon className="w-4 h-4" />, content: null },
    { id: 'expense' as TransactionType, label: 'ব্যয়ের হিসাব', icon: <ArrowDownCircleIcon className="w-4 h-4" />, content: null },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
       <div className="text-center">
        <h2 className="text-3xl font-semibold text-gray-800">দৈনিক আয়-ব্যয়ের হিসাব</h2>
        <p className="text-gray-500 mt-1">দৈনন্দিন আয় এবং ব্যয়ের হিসাব এখানে যোগ করুন।</p>
      </div>

      <Card>
        <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={(id) => setActiveTab(id as TransactionType)} />
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <CustomDatePicker
                id="transaction_date"
                label="তারিখ"
                value={formData.transaction_date}
                onChange={handleDateChange}
                error={errors.transaction_date}
                required
              />
              <Input
                label="টাকার পরিমাণ (৳)"
                id="amount"
                name="amount"
                type="number"
                value={formData.amount || ''}
                onChange={handleInputChange}
                error={errors.amount}
                required
                min="1"
                icon={<CurrencyBangladeshiIcon className="w-4 h-4 text-gray-400"/>}
              />
              <Select
                label="খাত"
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                options={activeTab === 'income' ? incomeCategories : expenseCategories}
                error={errors.category_id}
                placeholderOption={isLoadingCategories ? "লোড হচ্ছে..." : "খাত নির্বাচন করুন"}
                required
                disabled={isLoadingCategories}
              />
              {activeTab === 'income' ? (
                <SearchableSelect
                  id="party_name"
                  label="প্রদানকারী"
                  value={formData.party_name}
                  onChange={handlePartyNameChange}
                  onInputChange={value => handlePartyNameChange(value)}
                  options={madrasaOptions}
                  placeholder="মাদরাসা সার্চ করুন বা নাম লিখুন..."
                  allowFreeText
                  disabled={isLoadingMadrasas}
                />
              ) : (
                <Input
                  label={'গ্রহীতা'}
                  id="party_name"
                  name="party_name"
                  value={formData.party_name || ''}
                  onChange={handleInputChange}
                  placeholder={'কাকে প্রদান করা হয়েছে'}
                />
              )}
               <Input
                label="ভাউচার নং (ঐচ্ছিক)"
                id="voucher_no"
                name="voucher_no"
                value={formData.voucher_no || ''}
                onChange={handleInputChange}
              />
            </div>
             <Textarea
                label="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={2}
                placeholder="লেনদেন সম্পর্কে কিছু নোট লিখুন..."
              />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createTransactionMutation.isPending} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
                {createTransactionMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : `${activeTab === 'income' ? 'আয় যোগ করুন' : 'ব্যয় যোগ করুন'}`}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default IncomeExpenseEntryPage;