

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Textarea } from '../../components/ui/Textarea';
import { Madrasa, SelectOption, Zone, Marhala, MarhalaApiResponse, ZoneApiResponse } from '../../types';
import { EyeIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';
interface MadrasaApplication extends Omit<Madrasa, 'madrasaCode' | 'id'> {
    id: string; // From application table
    application_status: ApplicationStatus;
    contact_email: string;
    notes?: string;
    review_notes?: string;
    created_at: string;
    zoneName?: string;
    highestMarhalaBoysName?: string;
    highestMarhalaGirlsName?: string;
}

const mapDbToFrontend = (app: any): MadrasaApplication => ({
    id: app.id,
    nameBn: app.name_bn,
    nameAr: app.name_ar,
    nameEn: app.name_en,
    address: app.address,
    zoneId: app.zone_id,
    mobile1: app.mobile1,
    mobile2: app.mobile2,
    type: app.type,
    dispatchMethod: app.dispatch_method,
    highestMarhalaBoysId: app.highest_marhala_boys_id,
    highestMarhalaGirlsId: app.highest_marhala_girls_id,
    muhtamim: app.muhtamim,
    educationSecretary: app.education_secretary,
    mutawalli: app.mutawalli,
    registrationDate: app.registration_date,
    ilhakFormUrl: app.ilhak_form_url,
    application_status: app.application_status,
    contact_email: app.contact_email,
    notes: app.notes,
    review_notes: app.review_notes,
    created_at: app.created_at,
    zoneName: app.zone_name_bn,
    highestMarhalaBoysName: app.highest_marhala_boys_name_bn,
    highestMarhalaGirlsName: app.highest_marhala_girls_name_bn,
});


const statusOptions: SelectOption[] = [
    { value: '', label: 'সকল স্ট্যাটাস' },
    { value: 'pending', label: 'অপেক্ষমান' },
    { value: 'approved', label: 'অনুমোদিত' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত' },
];

const getStatusLabel = (status: ApplicationStatus) => statusOptions.find(opt => opt.value === status)?.label || status;
const getStatusColorClass = (status: ApplicationStatus) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
const getMadrasaTypeLabel = (type?: Madrasa['type']) => {
    if (type === 'boys') return 'বালক';
    if (type === 'girls') return 'বালিকা';
    if (type === 'both') return 'উভয়';
    return 'অজানা';
};


const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="py-1.5"><p className="text-sm text-gray-600">{label}</p><p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p></div>
);

const MadrasaApplicationListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveAlertOpen, setIsApproveAlertOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<MadrasaApplication | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); setCurrentPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  const queryParams = { p_page: currentPage, p_limit: itemsPerPage, p_search_term: debouncedSearchTerm || null, p_status_filter: statusFilter || null };

  const { data: applicationsData, isLoading, error } = useQuery({
    queryKey: ['madrasaApplications', queryParams],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_madrasa_applications', queryParams);
      if (rpcError) throw rpcError;
      return {
          items: (data.items || []).map(mapDbToFrontend),
          totalItems: data.totalItems || 0
      };
    },
    placeholderData: keepPreviousData,
  });
  
  if (error) addToast(`আবেদন তালিকা আনতে সমস্যা: ${error.message}`, 'error');

  const applications = applicationsData?.items || [];
  const totalItems = applicationsData?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
        // Invoke the Edge Function to handle the entire approval process
        const { data, error } = await supabase.functions.invoke('send-welcome-email', { // Note: using old name for now
            body: { applicationId },
        });

        if (error) {
            // The Edge Function might return a specific error message in the body
            let errorMessage = error.message;
            try {
                const errorBody = await (error as any).context.json();
                if(errorBody.error) errorMessage = errorBody.error;
            } catch(e) {
                // Ignore parsing error
            }
            throw new Error(errorMessage);
        }
        return data;
    },
    onSuccess: () => { 
        addToast('আবেদনটি সফলভাবে অনুমোদিত হয়েছে এবং নতুন ব্যবহারকারীকে আমন্ত্রণ জানানো হয়েছে।', 'success');
        queryClient.invalidateQueries({ queryKey: ['madrasaApplications'] });
        queryClient.invalidateQueries({ queryKey: ['madrasas'] }); 
        setIsApproveAlertOpen(false); 
    },
    onError: (err: any) => { 
        addToast(`অনুমোদনে সমস্যা: ${err.message}`, 'error', 8000); 
        setIsApproveAlertOpen(false); 
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
        const { error } = await supabase.rpc('reject_madrasa_application', { p_application_id: id, p_review_notes: notes });
        if (error) throw error;
    },
    onSuccess: () => { addToast('আবেদনটি প্রত্যাখ্যান করা হয়েছে।', 'success'); queryClient.invalidateQueries({ queryKey: ['madrasaApplications'] }); setIsRejectModalOpen(false); },
    onError: (err: any) => addToast(`প্রত্যাখ্যান করতে সমস্যা: ${err.message}`, 'error')
  });

  const handleApproveClick = (app: MadrasaApplication) => { setSelectedApplication(app); setIsApproveAlertOpen(true); };
  const handleRejectClick = (app: MadrasaApplication) => { setSelectedApplication(app); setRejectionNotes(''); setIsRejectModalOpen(true); };
  const handleViewClick = (app: MadrasaApplication) => { setSelectedApplication(app); setIsViewModalOpen(true); };

  const confirmApprove = () => { if (selectedApplication) approveMutation.mutate(selectedApplication.id); };
  const confirmReject = () => { if (selectedApplication) rejectMutation.mutate({ id: selectedApplication.id, notes: rejectionNotes }); };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">মাদরাসা অন্তর্ভুক্তির আবেদন</h2>
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="অনুসন্ধান (নাম, ইমেইল, মুহতামিম)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} wrapperClassName="mb-0"/>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} wrapperClassName="mb-0"/>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
              {['মাদ্রাসার নাম', 'মুহতামিমের নাম', 'মোবাইল', 'ঠিকানা', 'ধরণ', 'সর্বোচ্চ মারহালা', 'আবেদনের তারিখ', 'স্ট্যাটাস', 'কার্যক্রম'].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && Array.from({length:5}).map((_,i)=><tr key={i} className="animate-pulse"><td colSpan={9}><div className="h-10 bg-gray-200 m-2 rounded"></div></td></tr>)}
              {!isLoading && applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{app.nameBn}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{app.muhtamim?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{app.muhtamim?.mobile}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{`${app.address.village}, ${app.address.upazila}, ${app.address.district}`}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{getMadrasaTypeLabel(app.type)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{app.highestMarhalaBoysName || app.highestMarhalaGirlsName || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(app.application_status)}`}>{getStatusLabel(app.application_status)}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClick(app)}><EyeIcon className="w-5 h-5"/></Button>
                        {app.application_status === 'pending' && <>
                        <Button variant="ghost" size="sm" onClick={() => handleApproveClick(app)} className="text-green-600 hover:text-green-800"><CheckCircleIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRejectClick(app)} className="text-red-500 hover:text-red-700"><XCircleIcon className="w-5 h-5"/></Button>
                        </>}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && applications.length === 0 && (<tr><td colSpan={9} className="text-center py-10 text-gray-500">কোনো আবেদন পাওয়া যায়নি।</td></tr>)}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="py-3 px-4 flex items-center justify-between border-t"><Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1 || isLoading} size="sm" variant="secondary">পূর্ববর্তী</Button><span className="text-sm">পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span><Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="secondary">পরবর্তী</Button></div>)}
      </Card>
      
      {isViewModalOpen && selectedApplication && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="আবেদনের বিস্তারিত" size="2xl">
          <div className="space-y-3 max-h-[75vh] overflow-y-auto p-1">
            <ViewDetailItem label="নাম (বাংলা)" value={selectedApplication.nameBn} />
            <ViewDetailItem label="নাম (আরবী)" value={selectedApplication.nameAr} />
            <ViewDetailItem label="মোবাইল ১" value={selectedApplication.mobile1} />
            <ViewDetailItem label="জোন" value={selectedApplication.zoneName || 'এখনো নির্ধারিত হয়নি'} />
            <ViewDetailItem label="ঠিকানা" value={`${selectedApplication.address.holding ? selectedApplication.address.holding + ', ' : ''}${selectedApplication.address.village}, ${selectedApplication.address.postOffice}, ${selectedApplication.address.upazila}, ${selectedApplication.address.district}, ${selectedApplication.address.division}`} />
            <ViewDetailItem label="মুহতামিম" value={selectedApplication.muhtamim?.name} />
            <ViewDetailItem label="মুহতামিমের মোবাইল" value={selectedApplication.muhtamim?.mobile} />
            {selectedApplication.ilhakFormUrl && <ViewDetailItem label="ইলহাক ফর্ম" value={<a href={selectedApplication.ilhakFormUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">দেখুন</a>} />}
            <ViewDetailItem label="আবেদনকারীর নোট" value={selectedApplication.notes} />
            {selectedApplication.review_notes && <ViewDetailItem label="এডমিনের নোট" value={selectedApplication.review_notes} />}
          </div>
        </Modal>
      )}
      <AlertDialog isOpen={isApproveAlertOpen} onClose={() => setIsApproveAlertOpen(false)} onConfirm={confirmApprove} title="আবেদন অনুমোদন" description={`আপনি কি "${selectedApplication?.nameBn}" এর আবেদনটি অনুমোদন করতে চান? অনুমোদন করলে মাদরাসার জন্য একটি নতুন ইউজার একাউন্ট তৈরি হবে এবং ব্যবহারকারীর ইমেইলে একটি আমন্ত্রণ পাঠানো হবে।`} confirmButtonText={approveMutation.isPending ? "প্রসেসিং..." : "হ্যাঁ, অনুমোদন করুন"} confirmButtonVariant="primary"/>
      {isRejectModalOpen && selectedApplication && (
        <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="আবেদন প্রত্যাখ্যান" size="md" footer={<><Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>বাতিল</Button><Button variant="danger" onClick={confirmReject} disabled={rejectMutation.isPending}>{rejectMutation.isPending ? "প্রত্যাখ্যান হচ্ছে..." : "প্রত্যাখ্যান নিশ্চিত করুন"}</Button></>}>
          <p className="text-sm mb-4">আপনি কি "${selectedApplication.nameBn}" এর আবেদনটি প্রত্যাখ্যান করতে চান?</p>
          <Textarea label="প্রত্যাখ্যানের কারণ (ঐচ্ছিক)" value={rejectionNotes} onChange={e => setRejectionNotes(e.target.value)} rows={3} placeholder="প্রত্যাখ্যানের কারণ লিখুন..."/>
        </Modal>
      )}
    </div>
  );
};
export default MadrasaApplicationListPage;
