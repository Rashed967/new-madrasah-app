
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { Zone as ZoneType, DistrictOption, ZoneApiResponse as BackendZoneType } from '../../types';
import { BANGLADESH_DISTRICTS } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, EyeIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
  } catch (e) {
    return 'অবৈধ তারিখ';
  }
};

// Maps a backend (Supabase row) Zone to a frontend ZoneType
const mapBackendZoneToFrontend = (backendZone: BackendZoneType): ZoneType => ({
  id: backendZone.id,
  zoneCode: backendZone.zone_code,
  nameBn: backendZone.name_bn,
  districts: backendZone.districts || [], // Ensure districts is always an array
  createdAt: backendZone.created_at,
  updatedAt: backendZone.updated_at,
});

// Fetches zones from Supabase
const fetchZonesFromSupabase = async (): Promise<ZoneType[]> => {
  const { data, error } = await supabase
    .from('zones')
    .select('id, zone_code, name_bn, districts, created_at, updated_at') // Added created_at and updated_at
    .order('zone_code', { ascending: true });

  if (error) {
    console.error('Supabase error fetching zones:', error);
    throw new Error(error.message || 'জোন তালিকা আনতে সমস্যা হয়েছে');
  }
  return (data || []).map(mapBackendZoneToFrontend);
};


const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="py-1">
    <p className="text-sm text-gray-500">{label}:</p>
    <p className="text-md font-medium text-gray-800 break-words">{value || <span className="text-gray-400 italic">নেই</span>}</p>
  </div>
);


const ZoneListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedZoneForView, setSelectedZoneForView] = useState<ZoneType | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneType | null>(null);
  const [editForm, setEditForm] = useState<{ id: string; zoneCode: string; nameBn: string; districts: string[] }>({
    id: '', zoneCode: '', nameBn: '', districts: []
  });
  const [editErrors, setEditErrors] = useState<{ nameBn?: string; districts?: string; apiError?: string }>({});
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ZoneType | null>(null);

  const { data: allZones = [], isLoading, error: fetchError, refetch } = useQuery<ZoneType[], Error>({
    queryKey: ['zones'],
    queryFn: fetchZonesFromSupabase,
  });

  useEffect(() => {
    if (fetchError) {
      addToast(fetchError.message || 'জোন তালিকা আনতে একটি ত্রুটি ঘটেছে।', 'error');
    }
  }, [fetchError, addToast]);

  const filteredZones = useMemo(() => {
    return allZones.filter(zone =>
      zone.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.zoneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.districts.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allZones, searchTerm]);

  const paginatedZones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredZones.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredZones, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredZones.length / itemsPerPage);

  const availableDistrictOptionsForEdit = useMemo((): DistrictOption[] => {
    if (!editingZone) return BANGLADESH_DISTRICTS;
    
    const districtsAssignedToOtherZones = new Set(
      allZones
        .filter(zone => zone.id !== editingZone.id)
        .flatMap(zone => zone.districts)
    );
    
    return BANGLADESH_DISTRICTS.filter(districtOption => 
      editingZone.districts.includes(districtOption.value) || 
      !districtsAssignedToOtherZones.has(districtOption.value) 
    );
  }, [allZones, editingZone]);

  const handleViewClick = (zone: ZoneType) => {
    setSelectedZoneForView(zone);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (zone: ZoneType) => {
    setEditingZone(zone);
    setEditForm({ id: zone.id, zoneCode: zone.zoneCode, nameBn: zone.nameBn, districts: [...zone.districts] });
    setEditErrors({});
    setIsEditModalOpen(true);
  };
  
  const validateEditForm = (): boolean => {
    const newErrors: { nameBn?: string; districts?: string } = {};
    if (!editForm.nameBn.trim()) {
      newErrors.nameBn = 'জোনের বাংলা নাম আবশ্যক';
    }
    if (editForm.districts.length === 0) {
      newErrors.districts = 'অন্তত একটি জেলা নির্বাচন করুন';
    }
    setEditErrors(prev => ({ ...prev, apiError: undefined, ...newErrors })); 
    return Object.keys(newErrors).length === 0;
  };

  const updateZoneMutation = useMutation({
    mutationFn: async (updatedZoneData: { p_id: string; p_name_bn: string; p_districts: string[] }) => {
      const { data, error } = await supabase.rpc('update_zone', updatedZoneData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setIsEditModalOpen(false);
      addToast('জোনের তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `জোন আপডেট করতে সমস্যা হয়েছে: ${error.message}`;
        if (error && typeof error === 'object' && 'code' in error) {
             const typedError = error as SupabasePostgrestError;
            if (typedError.code === '23505') { 
                 setEditErrors(prev => ({ ...prev, nameBn: typedError.message, apiError: undefined }));
                 userMessage = typedError.message;
            } else if (typedError.code === 'P0002' && typedError.message.includes('জেলা ইতিমধ্যে')) { 
                 setEditErrors(prev => ({ ...prev, districts: typedError.message, apiError: undefined }));
                 userMessage = typedError.message;
            }
            else {
                 setEditErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else {
            setEditErrors(prev => ({ ...prev, apiError: userMessage }));
        }
      addToast(userMessage, 'error', 7000);
    },
  });

  const handleSaveChanges = async () => {
    if (!editingZone || !validateEditForm()) {
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
        return;
    }
    updateZoneMutation.mutate({
      p_id: editingZone.id,
      p_name_bn: editForm.nameBn.trim(),
      p_districts: editForm.districts,
    });
  };
  
  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      const { data, error } = await supabase.rpc('delete_zone', { p_id: zoneId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      const deletedZoneName = allZones.find(z => z.id === variables)?.nameBn || 'জোনটি';
      addToast(`"${deletedZoneName}" সফলভাবে মুছে ফেলা হয়েছে।`, 'success');
      setIsDeleteAlertOpen(false);
      setZoneToDelete(null);
    },
    onError: (error: SupabasePostgrestError | Error ) => {
      addToast(`জোন মুছে ফেলতে সমস্যা হয়েছে: ${error.message}`, 'error', 7000);
      setIsDeleteAlertOpen(false);
    },
  });

  const handleDeleteClick = (zone: ZoneType) => {
    setZoneToDelete(zone);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!zoneToDelete) return;
    deleteZoneMutation.mutate(zoneToDelete.id);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-gray-500 animate-spin mr-2" />
        <p className="text-xl text-gray-700">জোন তালিকা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">জোন তালিকা</h2>
        <Button onClick={() => navigate('/zone/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
          নতুন জোন যোগ করুন
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <Input
            placeholder="অনুসন্ধান করুন (জোন কোড, নাম বা জেলা)..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            wrapperClassName="mb-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">জোন কোড</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">জোনের নাম (বাংলা)</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">অন্তর্ভুক্ত জেলাসমূহ</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{zone.zoneCode}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{zone.nameBn}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-right">
                    {zone.districts.length > 3 ? `${zone.districts.slice(0,3).join(', ')} সহ আরও ${(zone.districts.length - 3).toLocaleString('bn-BD')}টি` : zone.districts.join(', ') || 'নেই'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <button onClick={() => handleViewClick(zone)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত দেখুন">
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleEditClick(zone)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা করুন">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(zone)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="মুছে ফেলুন" disabled={deleteZoneMutation.isPending && zoneToDelete?.id === zone.id}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedZones.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    কোনো জোন খুঁজে পাওয়া যায়নি। <Button variant="ghost" onClick={() => refetch()} className="text-sm">পুনরায় চেষ্টা করুন</Button>
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
              disabled={currentPage === 1 || isLoading}
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
              disabled={currentPage === totalPages || isLoading}
              size="sm"
              variant="secondary"
            >
              পরবর্তী
            </Button>
          </div>
        )}
      </Card>

      {isViewModalOpen && selectedZoneForView && (
        <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={`জোনের বিবরণ: ${selectedZoneForView.nameBn}`}
            size="xl"
        >
            <div className="space-y-3">
                <ViewDetailItem label="জোন কোড" value={selectedZoneForView.zoneCode} />
                <ViewDetailItem label="জোনের নাম (বাংলা)" value={selectedZoneForView.nameBn} />
                <div>
                    <p className="text-sm text-gray-500">অন্তর্ভুক্ত জেলাসমূহ ({selectedZoneForView.districts.length.toLocaleString('bn-BD')}টি):</p>
                    {selectedZoneForView.districts.length > 0 ? (
                        <ul className="list-disc list-inside pl-1 text-md font-medium text-gray-800 columns-2 md:columns-3">
                            {selectedZoneForView.districts.map(district => <li key={district}>{district}</li>)}
                        </ul>
                    ) : <p className="text-md font-medium text-gray-400 italic">কোনো জেলা অন্তর্ভুক্ত নেই।</p>}
                </div>
                <ViewDetailItem label="তৈরির তারিখ" value={formatDate(selectedZoneForView.createdAt)} />
                <ViewDetailItem label="সর্বশেষ আপডেট" value={formatDate(selectedZoneForView.updatedAt)} />
                <ViewDetailItem label="আইডি" value={selectedZoneForView.id} />
            </div>
        </Modal>
      )}

      {isEditModalOpen && editingZone && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`জোন সম্পাদনা: ${editingZone.nameBn}`}
          size="xl" 
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={updateZoneMutation.isPending}>বাতিল</Button>
              <Button variant="primary" onClick={handleSaveChanges} disabled={updateZoneMutation.isPending}>
                {updateZoneMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="জোন কোড"
              id="editZoneCode"
              value={editForm.zoneCode}
              disabled 
              wrapperClassName="bg-gray-100 rounded-md"
            />
            <Input
              label="জোনের নাম (বাংলা)"
              id="editNameBn"
              value={editForm.nameBn}
              onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })}
              error={editErrors.nameBn}
              required
              disabled={updateZoneMutation.isPending}
            />
            {editErrors.apiError && !editErrors.nameBn && !editErrors.districts && <p className="text-sm text-red-500 -mt-2 mb-2">{editErrors.apiError}</p>}
            <MultiSelectGrid
              label="অন্তর্ভুক্ত জেলাসমূহ"
              options={availableDistrictOptionsForEdit}
              selectedValues={editForm.districts}
              onChange={(newDistricts) => setEditForm({...editForm, districts: newDistricts})}
              error={editErrors.districts}
              gridCols={3}
              visibleRows={5}
              itemHeight={44}
              required
              wrapperClassName={updateZoneMutation.isPending ? 'opacity-70' : ''}
            />
             {availableDistrictOptionsForEdit.length === 0 && editForm.districts.length === 0 && (
                <p className="text-sm text-yellow-600 -mt-2">সকল জেলা ইতিমধ্যে অন্য কোনো জোনে অন্তর্ভুক্ত করা হয়েছে অথবা কোনো জেলা পাওয়া যায়নি।</p>
            )}
          </div>
        </Modal>
      )}

      {isDeleteAlertOpen && zoneToDelete && (
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          onClose={() => setIsDeleteAlertOpen(false)}
          onConfirm={confirmDelete}
          title="নিশ্চিতকরণ"
          description={`আপনি কি "${zoneToDelete.nameBn}" (${zoneToDelete.zoneCode}) জোনটি মুছে ফেলতে চান? এটি মুছে ফেললে সংশ্লিষ্ট মাদরাসাগুলোর জোন তথ্যও প্রভাবিত হতে পারে। এই কাজটি আর ফেরানো যাবে না।`}
          confirmButtonText={deleteZoneMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"}
          cancelButtonText="না, থাক"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default ZoneListPage;
