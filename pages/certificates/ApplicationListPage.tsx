
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { CertificateApplication, SelectOption, ApplicationStatus } from '../../types';
import { EyeIcon, Cog6ToothIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return `${amount.toLocaleString('bn-BD')} ৳`;
}

const getStatusLabel = (status: ApplicationStatus): string => {
  const labels: Record<ApplicationStatus, string> = {
    pending: 'অপেক্ষমান',
    processing: 'প্রস্তুত হচ্ছে',
    ready_for_delivery: 'প্রদানের জন্য প্রস্তুত',
    completed: 'সম্পন্ন',
    rejected: 'বাতিল',
  };
  return labels[status] || status;
};

const getStatusColorClass = (status: ApplicationStatus): string => {
  const colors: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    ready_for_delivery: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const statusOptions: SelectOption[] = [
    { value: '', label: 'সকল স্ট্যাটাস' },
    { value: 'pending', label: 'অপেক্ষমান' },
    { value: 'processing', label: 'প্রস্তুত হচ্ছে' },
    { value: 'ready_for_delivery', label: 'প্রদানের জন্য প্রস্তুত' },
    { value: 'completed', label: 'সম্পন্ন' },
    { value: 'rejected', label: 'বাতিল' },
];

const ApplicationListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CertificateApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: exams = [] } = useQuery<SelectOption[], Error>({
    queryKey: ['examOptionsForCertList'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', { p_limit: 1000 });
      if (error) throw error;
      return data.items || [];
    }
  });
  const examOptions: SelectOption[] = [{value: '', label: 'সকল পরীক্ষা'}, ...exams];

  const queryParams = {
    p_page: currentPage, p_limit: itemsPerPage, 
    p_exam_id_filter: filterExamId || null,
    p_status_filter: filterStatus || null,
    p_search_term: searchTerm || null
  };

  const { data: applicationsData, isLoading, error } = useQuery({
    queryKey: ['certificateApplications', queryParams],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_certificate_applications_list', queryParams);
      if (rpcError) throw rpcError;
      return data as { items: CertificateApplication[], totalItems: number };
    },
    placeholderData: keepPreviousData,
  });

  const applications = applicationsData?.items || [];
  const totalItems = applicationsData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: ApplicationStatus, notes?: string }) => {
      const { error } = await supabase.rpc('update_certificate_application_status', {
        p_application_id: id,
        p_new_status: status,
        p_admin_notes: notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('আবেদনের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['certificateApplications'] });
      setIsManageModalOpen(false);
    },
    onError: (err: any) => {
      addToast(`স্ট্যাটাস আপডেটে সমস্যা: ${err.message}`, 'error');
    }
  });

  const handleViewClick = (app: CertificateApplication) => {
    setSelectedApplication(app);
    setIsViewModalOpen(true);
  };
  
  const handleManageClick = (app: CertificateApplication) => {
    setSelectedApplication(app);
    setNewStatus(app.application_status || '');
    setAdminNotes(app.notes_by_admin || '');
    setIsManageModalOpen(true);
  };
  
  const handleStatusUpdate = () => {
    if (!selectedApplication || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`py-1 ${className || ''}`}><p className="text-sm text-gray-600">{label}</p><p className="text-md font-medium text-black break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">সনদের জন্য আবেদন তালিকা</h2>
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="অনুসন্ধান" placeholder="আবেদন আইডি, নাম বা রোল..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} wrapperClassName="mb-0 md:col-span-1"/>
            <Select label="পরীক্ষা অনুযায়ী ফিল্টার" value={filterExamId} onChange={(e) => {setFilterExamId(e.target.value); setCurrentPage(1);}} options={examOptions} wrapperClassName="mb-0"/>
            <Select label="স্ট্যাটাস অনুযায়ী ফিল্টার" value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value as any); setCurrentPage(1);}} options={statusOptions} wrapperClassName="mb-0"/>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              {['আবেদন আইডি', 'পরীক্ষার্থীর নাম', 'রোল', 'পরীক্ষা', 'ফি', 'স্ট্যাটাস', 'তারিখ', 'কার্যক্রম'].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={8}><div className="h-10 bg-gray-200 m-2 rounded"></div></td></tr>)}
              {!isLoading && applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono" title={app.id}>{app.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{app.examinee_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{app.examinee_roll?.toLocaleString('bn-BD')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{app.exam_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-600 font-semibold text-right">{formatCurrency(app.total_fee)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(app.application_status)}`}>{getStatusLabel(app.application_status)}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleViewClick(app)}><EyeIcon className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleManageClick(app)} className="ml-1"><Cog6ToothIcon className="w-5 h-5"/></Button>
                  </td>
                </tr>
              ))}
              {!isLoading && applications.length === 0 && (<tr><td colSpan={8} className="text-center py-10 text-gray-500">কোনো আবেদন পাওয়া যায়নি।</td></tr>)}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="py-3 px-4 flex items-center justify-between border-t"><Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button><span className="text-sm">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span><Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button></div>)}
      </Card>
      
      {isViewModalOpen && selectedApplication && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="আবেদনের বিস্তারিত" size="lg">
          <div className="space-y-3">
              <ViewDetailItem label="আবেদন আইডি" value={<span className="font-mono">{selectedApplication.id}</span>} />
              <ViewDetailItem label="পরীক্ষার্থীর নাম" value={selectedApplication.examinee_name} />
              <ViewDetailItem label="পিতার নাম" value={selectedApplication.father_name} />
              <ViewDetailItem label="রোল" value={selectedApplication.examinee_roll?.toLocaleString('bn-BD')} />
              <ViewDetailItem label="রেজি." value={selectedApplication.examinee_reg?.toLocaleString('bn-BD')} />
              <ViewDetailItem label="পরীক্ষা" value={selectedApplication.exam_name} />
              <ViewDetailItem label="মাদরাসা" value={selectedApplication.madrasa_name} />
              <ViewDetailItem label="যোগাযোগের মোবাইল" value={selectedApplication.contact_mobile} />
              <div className="py-1"><p className="text-sm text-gray-600">আবেদনের বিষয়:</p><ul className="list-disc list-inside pl-2">{selectedApplication.applied_certificates.map(cert => (<li key={cert.type_id}>{cert.name_bn} (ফি: {formatCurrency(cert.fee)})</li>))}</ul></div>
              <ViewDetailItem label="মোট ফি" value={formatCurrency(selectedApplication.total_fee)} />
              <ViewDetailItem label="পেমেন্ট স্ট্যাটাস" value={selectedApplication.payment_status === 'paid' ? 'পরিশোধিত' : 'অপেক্ষমান'} />
              <ViewDetailItem label="আবেদনের স্ট্যাটাস" value={<span className={`px-2 py-0.5 font-medium text-xs rounded-full ${getStatusColorClass(selectedApplication.application_status)}`}>{getStatusLabel(selectedApplication.application_status)}</span>} />
              <ViewDetailItem label="এডমিনের নোট" value={selectedApplication.notes_by_admin || 'কোনো নোট নেই।'} />
          </div>
        </Modal>
      )}
      {isManageModalOpen && selectedApplication && (
        <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="স্ট্যাটাস ম্যানেজ করুন" size="md" footer={<><Button variant="secondary" onClick={() => setIsManageModalOpen(false)}>বাতিল</Button><Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>{updateStatusMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</Button></>}>
          <p className="text-sm mb-2">আবেদনকারী: <span className="font-semibold">{selectedApplication.examinee_name}</span></p>
          <Select label="নতুন স্ট্যাটাস" value={newStatus} onChange={e => setNewStatus(e.target.value as ApplicationStatus)} options={statusOptions.filter(opt => opt.value !== '')} required />
          <Textarea label="নোট (ঐচ্ছিক)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="স্ট্যাটাস পরিবর্তনের কারণ বা কোনো নোট লিখুন..."/>
        </Modal>
      )}
    </div>
  );
};

export default ApplicationListPage;
