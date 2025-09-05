import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { AlertDialog } from '../../../components/ui/AlertDialog';
import { Switch } from '../../../components/ui/Switch';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { BankAccount, BankAccountDbRow, BankAccountType, SelectOption, BankDashboardData, BankTransaction } from '../../../types';
import { BANK_ACCOUNT_TYPES, BANK_TRANSACTION_TYPES } from '../../../constants';
import { PlusCircleIcon, PencilSquareIcon, ArrowPathIcon, EyeIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowsUpDownIcon, BuildingOffice2Icon, CreditCardIcon, XMarkIcon } from '../../../components/ui/Icon';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
const formatCurrency = (amount: number) => `${amount.toLocaleString('bn-BD')} ৳`;

const BankDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const { data, isLoading, error } = useQuery<BankDashboardData, Error>({
    queryKey: ['bankDashboardData'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bank_dashboard_data');
      if (error) throw error;
      return {
        totalBalance: data.total_balance,
        accounts: (data.accounts || []).map((acc: BankAccountDbRow) => ({
            id: acc.id, bankName: acc.bank_name, branchName: acc.branch_name, accountName: acc.account_name,
            accountNumber: acc.account_number, accountType: acc.account_type, openingDate: acc.opening_date,
            openingBalance: parseFloat(String(acc.opening_balance).replace(/,/g, '')), currentBalance: parseFloat(String(acc.current_balance).replace(/,/g, '')),
            isActive: acc.is_active, createdAt: acc.created_at, updatedAt: acc.updated_at
        })),
        recentTransactions: (data.recent_transactions || []).map((tx: any) => ({
            id: tx.id, accountId: tx.account_id, type: tx.type, amount: parseFloat(String(tx.amount).replace(/,/g, '')),
            transactionDate: tx.transaction_date, description: tx.description,
            balanceAfter: parseFloat(String(tx.balance_after).replace(/,/g, '')), bankName: tx.bank_name, accountName: tx.account_name
        }))
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });

  useEffect(() => { if (error) addToast(`ড্যাশবোর্ড তথ্য আনতে সমস্যা: ${error.message}`, 'error'); }, [error, addToast]);

  const handleOpenAccountModal = (account: BankAccount | null = null) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };
  
  if (isLoading && !data) return <div className="flex items-center justify-center h-64"><ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-2" /><p>ড্যাশবোর্ড লোড হচ্ছে...</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">ব্যাংক ম্যানেজমেন্ট ড্যাশবোর্ড</h2>
      <div className="bg-emerald-100 shadow-md rounded-lg border border-emerald-200">
        <div className="p-6 flex flex-col md:flex-row justify-between items-center">
            <div>
                <p className="text-lg text-emerald-700">মোট ব্যাংক ব্যালেন্স</p>
                <p className="text-4xl font-bold text-emerald-800">{formatCurrency(data?.totalBalance || 0)}</p>
                <p className="text-sm text-emerald-600 mt-1">{(data?.accounts?.length || 0).toLocaleString('bn-BD')} টি অ্যাকাউন্ট থেকে</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
                <Button variant="primary" onClick={() => setIsTransactionModalOpen(true)}>নতুন লেনদেন</Button>
                <Button variant="outline" onClick={() => handleOpenAccountModal()}>নতুন অ্যাকাউন্ট</Button>
            </div>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">ব্যাংক অ্যাকাউন্ট সমূহ</h3>
            {(data?.accounts || []).map(acc => (
                <Card key={acc.id} className="transition-all hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                           <p className="font-bold text-lg text-emerald-800">{acc.bankName}</p>
                           <p className="text-sm text-gray-600">{acc.branchName}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenAccountModal(acc)} title="সম্পাদনা করুন" className="p-1">
                            <PencilSquareIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{acc.accountName} - {acc.accountNumber}</p>
                    <p className="text-2xl font-semibold my-2 text-black">{formatCurrency(acc.currentBalance)}</p>
                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${acc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {acc.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                    </div>
                </Card>
            ))}
             {(data?.accounts.length === 0) && (
                <Card className="text-center text-gray-500 py-6">
                    কোনো ব্যাংক অ্যাকাউন্ট যোগ করা হয়নি।
                </Card>
            )}
        </div>
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">সাম্প্রতিক লেনদেন</h3>
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">তারিখ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">ব্যাংক</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">ধরন</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">বিবরণ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">পরিমাণ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-black uppercase">ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {(data?.recentTransactions || []).map(tx => (
                          <tr key={tx.id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">{formatDate(tx.transactionDate)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">{tx.bankName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'deposit' ? 'bg-green-100 text-green-800' : tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {tx.type === 'deposit' ? 'জমা' : tx.type === 'withdrawal' ? 'উত্তোলন' : 'ট্রান্সফার'}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">{tx.description || '-'}</td>
                              <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-right ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'deposit' ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-black">{formatCurrency(tx.balanceAfter)}</td>
                          </tr>
                      ))}
                      {(data?.recentTransactions.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-6 text-gray-500">কোনো সাম্প্রতিক লেনদেন নেই।</td></tr>
                      )}
                  </tbody>
                </table>
              </div>
            </Card>
        </div>
      </div>
      
      {isAccountModalOpen && <BankAccountFormModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} account={editingAccount} allAccounts={data?.accounts || []} />}
      {isTransactionModalOpen && <BankTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} accounts={data?.accounts || []} />}
    </div>
  );
};


// Bank Account Form Modal
const BankAccountFormModal: React.FC<{isOpen: boolean; onClose: () => void; account: BankAccount | null; allAccounts: BankAccount[]}> = ({ isOpen, onClose, account, allAccounts }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<BankAccount>>({
        bankName: account?.bankName || '', branchName: account?.branchName || '', accountName: account?.accountName || '',
        accountNumber: account?.accountNumber || '', accountType: account?.accountType || 'current',
        openingDate: account ? account.openingDate.split('T')[0] : new Date().toISOString().split('T')[0],
        openingBalance: account?.openingBalance || 0,
    });
    const [errors, setErrors] = useState<any>({});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); if(errors[name]) setErrors(prev => ({...prev, [name]: undefined})); };
    const handleDateChange = (dateString: string) => { setFormData(prev => ({...prev, openingDate: dateString})); if(errors.openingDate) setErrors(prev => ({...prev, openingDate: undefined})); };

    const validate = (): boolean => {
        const newErrors: any = {};
        if(!formData.bankName?.trim()) newErrors.bankName = 'ব্যাংকের নাম আবশ্যক।';
        if(!formData.accountName?.trim()) newErrors.accountName = 'অ্যাকাউন্টের নাম আবশ্যক।';
        if(!formData.accountNumber?.trim()) newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর আবশ্যক।';
        else if(allAccounts.some(acc => acc.accountNumber === formData.accountNumber && acc.id !== account?.id)) newErrors.accountNumber = 'এই নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।';
        if(!formData.openingDate) newErrors.openingDate = 'শুরুর তারিখ আবশ্যক।';
        if(formData.openingBalance === undefined || formData.openingBalance === null || Number(formData.openingBalance) < 0) newErrors.openingBalance = 'প্রারম্ভিক ব্যালেন্স একটি অ-ঋণাত্মক সংখ্যা হতে হবে।';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const upsertMutation = useMutation({
        mutationFn: async (payload: { accountData: Partial<BankAccount>, accountId?: string }) => {
            const { accountData, accountId } = payload;
            const rpcFunction = accountId ? 'update_bank_account' : 'create_bank_account';
            const rpcPayload = accountId
                ? { p_account_id: accountId, p_updates: { bank_name: accountData.bankName, branch_name: accountData.branchName, account_name: accountData.accountName, account_number: accountData.accountNumber, account_type: accountData.accountType } }
                : { p_bank_name: accountData.bankName, p_branch_name: accountData.branchName, p_account_name: accountData.accountName, p_account_number: accountData.accountNumber, p_account_type: accountData.accountType, p_opening_date: accountData.openingDate, p_opening_balance: accountData.openingBalance };
            const { error } = await supabase.rpc(rpcFunction, rpcPayload);
            if (error) throw error;
        },
        onSuccess: () => { addToast(`ব্যাংক অ্যাকাউন্ট সফলভাবে ${account ? 'আপডেট' : 'তৈরি'} হয়েছে!`, 'success'); queryClient.invalidateQueries({queryKey: ['bankDashboardData']}); onClose(); },
        onError: (error: PostgrestError | Error) => { addToast(`সংরক্ষণে ত্রুটি: ${error.message}`, 'error'); }
    });

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!validate()) return; upsertMutation.mutate({ accountData: formData, accountId: account?.id }); };

    return ( <Modal isOpen={isOpen} onClose={onClose} title={account ? 'অ্যাকাউন্ট সম্পাদনা' : 'নতুন ব্যাংক অ্যাকাউন্ট'}><form onSubmit={handleSubmit} className="space-y-4"> <Input label="ব্যাংকের নাম" name="bankName" value={formData.bankName} onChange={handleChange} error={errors.bankName} required/> <Input label="ব্রাঞ্চের নাম" name="branchName" value={formData.branchName} onChange={handleChange} required/> <Input label="অ্যাকাউন্টের নাম" name="accountName" value={formData.accountName} onChange={handleChange} error={errors.accountName} required/> <Input label="অ্যাকাউন্ট নম্বর" name="accountNumber" value={formData.accountNumber} onChange={handleChange} error={errors.accountNumber} required/> <Select label="অ্যাকাউন্টের ধরণ" name="accountType" value={formData.accountType} onChange={handleChange} options={BANK_ACCOUNT_TYPES} required/> <CustomDatePicker id="openingDate" label="শুরুর তারিখ" value={formData.openingDate} onChange={handleDateChange} error={errors.openingDate} required disabled={!!account}/> <Input label="প্রারম্ভিক ব্যালেন্স (৳)" name="openingBalance" type="number" min="0" value={String(formData.openingBalance)} onChange={handleChange} error={errors.openingBalance} required disabled={!!account}/> <div className="flex justify-end space-x-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>বাতিল</Button><Button type="submit" disabled={upsertMutation.isPending}>{upsertMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></div></form></Modal> );
};

// Bank Transaction Form Modal
const BankTransactionModal: React.FC<{isOpen: boolean; onClose: () => void; accounts: BankAccount[]}> = ({isOpen, onClose, accounts}) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [txType, setTxType] = useState<any>('deposit');
    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [toAccountId, setToAccountId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [checkNumber, setCheckNumber] = useState<string>('');
    const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const accountOptions = useMemo(() => accounts.filter(a => a.isActive).map(a => ({value: a.id, label: `${a.accountName} (${a.bankName}) - ব্যালেন্স: ${formatCurrency(a.currentBalance)}`})), [accounts]);
    
    const createTxMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.rpc('create_bank_transaction', payload);
            if (error) throw error;
        },
        onSuccess: () => { addToast('লেনদেন সফল হয়েছে!', 'success'); queryClient.invalidateQueries({queryKey: ['bankDashboardData']}); onClose(); },
        onError: (error: PostgrestError | Error) => { addToast(`লেনদেন ব্যর্থ: ${error.message}`, 'error', 7000); }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if(isNaN(numAmount) || numAmount <= 0) { addToast('পরিমাণ সঠিক নয়।', 'error'); return; }
        if (txType === 'transfer' && fromAccountId === toAccountId) { addToast('একই অ্যাকাউন্টে ট্রান্সফার করা যাবে না।', 'error'); return; }

        createTxMutation.mutate({
            p_type: txType, p_amount: numAmount, p_transaction_date: transactionDate,
            p_from_account_id: txType !== 'deposit' ? fromAccountId : null,
            p_to_account_id: txType !== 'withdrawal' ? toAccountId : null,
            p_description: description, p_check_number: checkNumber || null
        });
    };

    return ( <Modal isOpen={isOpen} onClose={onClose} title="নতুন লেনদেন"><form onSubmit={handleSubmit} className="space-y-4"><Select label="লেনদেনের ধরণ" value={txType} onChange={e => setTxType(e.target.value)} options={BANK_TRANSACTION_TYPES} required/>
        {txType === 'transfer' && <Select label="যে অ্যাকাউন্ট থেকে" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} options={accountOptions} placeholderOption="অ্যাকাউন্ট নির্বাচন..." required/>}
        {txType === 'withdrawal' && <Select label="অ্যাকাউন্ট" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} options={accountOptions} placeholderOption="অ্যাকাউন্ট নির্বাচন..." required/>}
        {txType === 'deposit' && <Select label="অ্যাকাউন্ট" value={toAccountId} onChange={e => setToAccountId(e.target.value)} options={accountOptions} placeholderOption="অ্যাকাউন্ট নির্বাচন..." required/>}
        {txType === 'transfer' && <Select label="যে অ্যাকাউন্টে" value={toAccountId} onChange={e => setToAccountId(e.target.value)} options={accountOptions.filter(opt => opt.value !== fromAccountId)} placeholderOption="অ্যাকাউন্ট নির্বাচন..." required/>}
        <Input label="পরিমাণ" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1"/>
        <CustomDatePicker id="txDate" label="লেনদেনের তারিখ" value={transactionDate} onChange={setTransactionDate} required/>
        <Input label="বিবরণ" value={description} onChange={e => setDescription(e.target.value)} />
        <Input label="চেক নম্বর (ঐচ্ছিক)" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} />
        <div className="flex justify-end space-x-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>বাতিল</Button><Button type="submit" disabled={createTxMutation.isPending}>{createTxMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button></div>
    </form></Modal> );
};

export default BankDashboardPage;