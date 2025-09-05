
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Kitab, KitabApiResponse as BackendKitab } from '../../types';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, EyeIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
};

// Maps a backend (Supabase row) Kitab to a frontend Kitab type
const mapBackendKitabToFrontend = (backendKitab: BackendKitab): Kitab => ({
  id: backendKitab.id,
  kitabCode: backendKitab.kitab_code,
  nameBn: backendKitab.name_bn,
  nameAr: backendKitab.name_ar || undefined,
  fullMarks: backendKitab.full_marks,
  createdAt: backendKitab.created_at,
});

// Fetches kitabs from Supabase
const fetchKitabsFromSupabase = async (): Promise<Kitab[]> => {
  const { data, error } = await supabase
    .from('kitabs')
    .select('id, kitab_code, name_bn, name_ar, full_marks, created_at')
    .order('kitab_code', { ascending: true });

  if (error) {
    console.error('Supabase error fetching kitabs:', error);
    throw new Error(error.message || 'কিতাব তালিকা আনতে সমস্যা হয়েছে');
  }
  return (data || []).map(mapBackendKitabToFrontend);
};


const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
  </div>
);


const KitabListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: kitabs = [], isLoading, error, refetch } = useQuery<Kitab[], Error>({
    queryKey: ['kitabs'],
    queryFn: fetchKitabsFromSupabase,
  });
  
  useEffect(() => {
    if (error) {
      addToast(error.message || 'কিতাব তালিকা আনতে একটি ত্রুটি ঘটেছে।', 'error');
    }
  }, [error, addToast]);


  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedKitabForView, setSelectedKitabForView] = useState<Kitab | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKitab, setEditingKitab] = useState<Kitab | null>(null);
  const [editForm, setEditForm] = useState<{ id: string; kitabCode: string; nameBn: string; nameAr?: string; fullMarks: number | string }>({
    id: '', kitabCode: '', nameBn: '', nameAr: '', fullMarks: ''
  });
  const [editErrors, setEditErrors] = useState<{ nameBn?: string; fullMarks?: string; apiError?: string }>({});
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [kitabToDelete, setKitabToDelete] = useState<Kitab | null>(null);

  const filteredKitabs = useMemo(() => {
    return kitabs.filter(kitab =>
      kitab.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kitab.nameAr && kitab.nameAr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      kitab.kitabCode.toLowerCase().includes(searchTerm.toLowerCase()) 
    ).sort((a,b) => a.kitabCode.localeCompare(b.kitabCode)); 
  }, [kitabs, searchTerm]);

  const paginatedKitabs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKitabs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKitabs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredKitabs.length / itemsPerPage);

  const handleViewClick = (kitab: Kitab) => {
    setSelectedKitabForView(kitab);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (kitab: Kitab) => {
    setEditingKitab(kitab);
    setEditForm({ id: kitab.id, kitabCode: kitab.kitabCode, nameBn: kitab.nameBn, nameAr: kitab.nameAr || '', fullMarks: kitab.fullMarks });
    setEditErrors({});
    setIsEditModalOpen(true);
  };
  
  const validateEditForm = (): boolean => {
    const newErrors: { nameBn?: string; fullMarks?: string } = {};
    if (!editForm.nameBn.trim()) {
      newErrors.nameBn = 'কিতাবের বাংলা নাম আবশ্যক';
    }
    const marks = Number(editForm.fullMarks);
    if (editForm.fullMarks === '' || isNaN(marks) || marks <= 0) {
      newErrors.fullMarks = 'পূর্ণ নম্বর একটি ধনাত্মক সংখ্যা হতে হবে';
    }
    setEditErrors(prev => ({ ...prev, apiError: undefined, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const updateKitabMutation = useMutation({
    mutationFn: async (updatedKitabData: { p_id: string; p_name_bn: string; p_name_ar: string | null; p_full_marks: number }) => {
      const { data, error } = await supabase.rpc('update_kitab', updatedKitabData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kitabs'] });
      setIsEditModalOpen(false);
      addToast('কিতাবের তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `কিতাব আপডেট করতে সমস্যা হয়েছে: ${error.message}`;
        if (error && typeof error === 'object' && 'code' in error) {
             const typedError = error as SupabasePostgrestError;
            if (typedError.code === '23505' && typedError.message.includes('এই বাংলা নামে অন্য একটি কিতাব ইতিমধ্যে বিদ্যমান')) {
                 setEditErrors(prev => ({ ...prev, nameBn: typedError.message, apiError: undefined }));
                 userMessage = typedError.message;
            } else {
                 setEditErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else {
            setEditErrors(prev => ({ ...prev, apiError: userMessage }));
        }
      addToast(userMessage, 'error');
    },
  });

  const handleSaveChanges = async () => {
    if (!editingKitab || !validateEditForm()) {
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে সংশোধন করুন।', 'error');
        return;
    }
    updateKitabMutation.mutate({
      p_id: editingKitab.id,
      p_name_bn: editForm.nameBn.trim(),
      p_name_ar: editForm.nameAr?.trim() || null,
      p_full_marks: Number(editForm.fullMarks),
    });
  };
  
  const deleteKitabMutation = useMutation({
    mutationFn: async (kitabId: string) => {
      const { data, error } = await supabase.rpc('delete_kitab', { p_id: kitabId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kitabs'] });
      const deletedKitabName = kitabs.find(k => k.id === variables)?.nameBn || 'কিতাবটি';
      addToast(`"${deletedKitabName}" সফলভাবে মুছে ফেলা হয়েছে।`, 'success');
      setIsDeleteAlertOpen(false);
      setKitabToDelete(null);
    },
    onError: (error: SupabasePostgrestError | Error ) => {
        let userMessage = `কিতাব মুছে ফেলতে সমস্যা হয়েছে: ${error.message}`;
         if (error && typeof error === 'object' && 'code' in error) {
             const typedError = error as SupabasePostgrestError;
            if (typedError.code === '23503' && typedError.message.includes('মারহালায় ব্যবহৃত হয়েছে')) { // Custom code or part of message
                userMessage = typedError.message;
            }
        }
      addToast(userMessage, 'error', 7000); // Longer duration for important errors
      setIsDeleteAlertOpen(false);
    },
  });


  const handleDeleteClick = (kitab: Kitab) => {
    setKitabToDelete(kitab);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!kitabToDelete) return;
    deleteKitabMutation.mutate(kitabToDelete.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-gray-500 animate-spin mr-2" />
        <p className="text-xl text-gray-700">কিতাব তালিকা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">কিতাব তালিকা</h2>
        <Button onClick={() => navigate('/kitab/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
          নতুন কিতাব যোগ করুন
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <Input
            placeholder="অনুসন্ধান করুন (কোড, বাংলা বা আরবী নাম)..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            wrapperClassName="mb-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">কোড</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">নাম (বাংলা)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">নাম (আরবী)</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">পূর্ণ নম্বর</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedKitabs.map((kitab) => (
                <tr key={kitab.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-700 text-right">{kitab.kitabCode}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">{kitab.nameBn}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-left" style={{ direction: 'rtl', textAlign: 'right' }}>{kitab.nameAr || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{kitab.fullMarks.toLocaleString('bn-BD')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                     <button onClick={() => handleViewClick(kitab)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত দেখুন">
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleEditClick(kitab)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা করুন">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedKitabs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    কোনো কিতাব খুঁজে পাওয়া যায়নি। <Button variant="ghost" onClick={() => refetch()} className="text-sm">পুনরায় চেষ্টা করুন</Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              size="sm"
              variant="secondary"
            >
              পূর্ববর্তী
            </Button>
            <span className="text-sm text-gray-700">
              পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} এর {totalPages.toLocaleString('bn-BD')}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              size="sm"
              variant="secondary"
            >
              পরবর্তী
            </Button>
          </div>
        )}
      </Card>

      {isViewModalOpen && selectedKitabForView && (
        <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={` কিতাবের বিবরণ: ${selectedKitabForView.nameBn}`}
            size="lg"
        >
            <div className="space-y-3">
                <ViewDetailItem label="কোড" value={selectedKitabForView.kitabCode} />
                <ViewDetailItem label="নাম (বাংলা)" value={selectedKitabForView.nameBn} />
                <ViewDetailItem label="নাম (আরবী)" value={selectedKitabForView.nameAr} />
                <ViewDetailItem label="পূর্ণ নম্বর" value={selectedKitabForView.fullMarks.toLocaleString('bn-BD')} />
                <ViewDetailItem label="সিস্টেম আইডি" value={selectedKitabForView.id} />
                <ViewDetailItem label="তৈরির তারিখ" value={formatDate(selectedKitabForView.createdAt)} />
            </div>
        </Modal>
      )}

      {isEditModalOpen && editingKitab && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={` কিতাব সম্পাদনা করুন: ${editingKitab.nameBn} (${editingKitab.kitabCode})`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={updateKitabMutation.isPending}>বাতিল</Button>
              <Button variant="primary" onClick={handleSaveChanges} disabled={updateKitabMutation.isPending}>
                {updateKitabMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="কিতাব কোড"
              id="editKitabCode"
              value={editForm.kitabCode}
              disabled 
              className="bg-gray-100"
            />
            <Input
              label="নাম (বাংলা)"
              id="editNameBn"
              value={editForm.nameBn}
              onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })}
              error={editErrors.nameBn}
              required
              disabled={updateKitabMutation.isPending}
            />
            <Input
              label="নাম (আরবী) (اختیاری)"
              id="editNameAr"
              value={editForm.nameAr || ''}
              onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
              disabled={updateKitabMutation.isPending}
              style={{ direction: 'rtl', textAlign: 'right' }}
            />
            <Input
              label="পূর্ণ নম্বর"
              id="editFullMarks"
              type="number"
              value={editForm.fullMarks.toString()}
              onChange={(e) => setEditForm({ ...editForm, fullMarks: e.target.value })}
              error={editErrors.fullMarks}
              required
              min="1"
              disabled={updateKitabMutation.isPending}
            />
            {editErrors.apiError && <p className="text-sm text-red-500">{editErrors.apiError}</p>}
          </div>
        </Modal>
      )}

      {isDeleteAlertOpen && kitabToDelete && (
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          onClose={() => setIsDeleteAlertOpen(false)}
          onConfirm={confirmDelete}
          title="নিশ্চিতকরণ"
          description={`আপনি কি "${kitabToDelete.nameBn}" (${kitabToDelete.kitabCode}) কিতাবটি মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।`}
          confirmButtonText={deleteKitabMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"}
          cancelButtonText="না, থাক"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default KitabListPage;
