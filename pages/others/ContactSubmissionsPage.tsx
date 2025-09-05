import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowPathIcon, EyeIcon, TrashIcon, Cog6ToothIcon } from '../../components/ui/Icon';
import { SelectOption } from '../../types';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

const statusOptions: SelectOption[] = [
    { value: '', label: 'সকল স্ট্যাটাস' },
    { value: 'new', label: 'নতুন' },
    { value: 'read', label: 'পঠিত' },
    { value: 'replied', label: 'উত্তর দেওয়া হয়েছে' },
    { value: 'archived', label: 'আর্কাইভ' },
];

const getStatusLabel = (status: ContactSubmission['status']): string => {
    return statusOptions.find(opt => opt.value === status)?.label || status;
};

const getStatusColorClass = (status: ContactSubmission['status']): string => {
    switch(status) {
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'read': return 'bg-purple-100 text-purple-800';
        case 'replied': return 'bg-green-100 text-green-800';
        case 'archived': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('bn-BD', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const ContactSubmissionsPage: React.FC = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
    const [newStatus, setNewStatus] = useState<ContactSubmission['status']>('new');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const queryParams = {
        p_page: currentPage,
        p_limit: itemsPerPage,
        p_status_filter: statusFilter || null,
        p_search_term: debouncedSearchTerm || null
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['contactSubmissions', queryParams],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_contact_submissions_list', queryParams);
            if (error) throw error;
            return data as { items: ContactSubmission[], totalItems: number };
        },
        placeholderData: keepPreviousData,
    });
    
    if (error) addToast(`বার্তা আনতে সমস্যা: ${error.message}`, 'error');
    
    const submissions = data?.items || [];
    const totalItems = data?.totalItems || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: ContactSubmission['status'] }) => {
            const { error } = await supabase.rpc('update_contact_submission_status', { p_id: id, p_new_status: status });
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।', 'success');
            queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] });
            setIsManageModalOpen(false);
        },
        onError: (err: any) => addToast(`স্ট্যাটাস আপডেটে সমস্যা: ${err.message}`, 'error')
    });
    
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.rpc('delete_contact_submission', { p_id: id });
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('বার্তা সফলভাবে মুছে ফেলা হয়েছে।', 'success');
            queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] });
            setIsDeleteAlertOpen(false);
        },
        onError: (err: any) => addToast(`মুছতে সমস্যা: ${err.message}`, 'error')
    });
    
    const handleManageClick = (submission: ContactSubmission) => {
        setSelectedSubmission(submission);
        setNewStatus(submission.status);
        setIsManageModalOpen(true);
    };

    const handleUpdateStatus = () => {
        if (!selectedSubmission) return;
        updateStatusMutation.mutate({ id: selectedSubmission.id, status: newStatus });
    };
    
    const handleDeleteClick = (submission: ContactSubmission) => {
        setSelectedSubmission(submission);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedSubmission) {
            deleteMutation.mutate(selectedSubmission.id);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800">যোগাযোগ ফর্মের বার্তা</h2>
            <Card>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="অনুসন্ধান" placeholder="নাম, ইমেইল বা বিষয় দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} wrapperClassName="mb-0"/>
                    <Select label="স্ট্যাটাস অনুযায়ী ফিল্টার" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} options={statusOptions} wrapperClassName="mb-0"/>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            {['নাম', 'ইমেইল', 'বিষয়', 'স্ট্যাটাস', 'প্রাপ্তির তারিখ', 'কার্যক্রম'].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && Array.from({length: 5}).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6}><div className="h-10 bg-gray-200 m-2 rounded"></div></td></tr>)}
                            {!isLoading && submissions.map((sub) => (
                                <tr key={sub.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{sub.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{sub.email}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{sub.subject}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(sub.status)}`}>{getStatusLabel(sub.status)}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(sub.created_at)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedSubmission(sub); setIsViewModalOpen(true); }}><EyeIcon className="w-5 h-5"/></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleManageClick(sub)} className="ml-1"><Cog6ToothIcon className="w-5 h-5"/></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(sub)} className="text-red-500 hover:text-red-700 ml-1"><TrashIcon className="w-5 h-5"/></Button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && submissions.length === 0 && (<tr><td colSpan={6} className="text-center py-10 text-gray-500">কোনো বার্তা পাওয়া যায়নি।</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="py-3 px-4 flex items-center justify-between border-t">
                        <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button>
                        <span className="text-sm">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span>
                        <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button>
                    </div>
                )}
            </Card>

            {isViewModalOpen && selectedSubmission && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="বার্তার বিস্তারিত" size="lg">
                    <div className="space-y-3 text-black">
                        <p><strong>নাম:</strong> {selectedSubmission.name}</p>
                        <p><strong>ইমেইল:</strong> {selectedSubmission.email}</p>
                        <p><strong>বিষয়:</strong> {selectedSubmission.subject}</p>
                        <div className="border-t pt-3 mt-3">
                            <p className="font-semibold">বার্তা:</p>
                            <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded-md">{selectedSubmission.message}</p>
                        </div>
                    </div>
                </Modal>
            )}

            {isManageModalOpen && selectedSubmission && (
                <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="স্ট্যাটাস ম্যানেজ করুন" size="md" footer={<><Button variant="secondary" onClick={() => setIsManageModalOpen(false)}>বাতিল</Button><Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>{updateStatusMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</Button></>}>
                    <Select label="নতুন স্ট্যাটাস" value={newStatus} onChange={e => setNewStatus(e.target.value as ContactSubmission['status'])} options={statusOptions.filter(o => o.value !== '')} required />
                </Modal>
            )}
            
            {isDeleteAlertOpen && selectedSubmission && (
                <AlertDialog isOpen={isDeleteAlertOpen} onClose={() => setIsDeleteAlertOpen(false)} onConfirm={confirmDelete} title="বার্তা মুছে ফেলুন" description={`আপনি কি "${selectedSubmission.subject}" বিষয়ের এই বার্তাটি মুছে ফেলতে চান?`} confirmButtonText={deleteMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"} confirmButtonVariant="danger"/>
            )}
        </div>
    );
};

export default ContactSubmissionsPage;