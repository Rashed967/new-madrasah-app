
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input'; // Restored Input import
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { MultiSelectGrid } from '../../components/ui/MultiSelectGrid';
import { Checkbox } from '../../components/ui/Checkbox'; // Added Checkbox
import { Tabs } from '../../components/ui/Tabs'; 
import { Marhala, MarhalaSpecificType, MarhalaCategory, KitabApiResponse, DistrictOption, MarhalaApiResponse as FrontendMarhalaApiResponse } from '../../types';
import { MARHALA_TYPES, MARHALA_CATEGORIES } from '../../constants';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, CheckCircleIcon, Bars3Icon, UserCircleIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import type { PostgrestError as SupabasePostgrestError } from '@supabase/supabase-js';


const getMarhalaTypeLabel = (type?: MarhalaSpecificType) => (type === 'boys' ? 'বালক' : type === 'girls' ? 'বালিকা' : 'N/A');
const getMarhalaCategoryLabel = (category?: MarhalaCategory) => (category === 'darsiyat' ? 'দরসিয়াত' : category === 'hifz' ? 'হিফজ' : 'N/A');


// Helper to map backend marhala (snake_case) to frontend Marhala (camelCase where applicable)
const mapBackendMarhalaToFrontend = (backendMarhala: any): Marhala => ({
    id: backendMarhala.id,
    marhala_code: backendMarhala.marhala_code,
    nameBn: backendMarhala.name_bn,
    nameAr: backendMarhala.name_ar || undefined,
    type: backendMarhala.type,
    category: backendMarhala.category,
    kitabIds: backendMarhala.kitab_ids || [],
    marhala_order: backendMarhala.marhala_order,
    requiresPhoto: backendMarhala.requires_photo || false, // Added mapping
    createdAt: backendMarhala.created_at,
    updatedAt: backendMarhala.updated_at // Ensure this is also mapped if present
});

const fetchMarhalasFromSupabase = async (): Promise<Marhala[]> => {
    const { data, error } = await supabase
      .from('marhalas')
      .select('id, marhala_code, name_bn, name_ar, type, category, kitab_ids, created_at, marhala_order, requires_photo, updated_at')  // Added requires_photo & updated_at
      .order('type', { ascending: true }) 
      .order('marhala_order', { ascending: true, nullsFirst: false }) 
      .order('marhala_code', { ascending: true }); 

    if (error) {
        console.error("Supabase error fetching marhalas:", error);
        throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে');
    }
    return (data || []).map(mapBackendMarhalaToFrontend);
};

const fetchKitabsForSelection = async (): Promise<KitabApiResponse[]> => {
    const { data, error } = await supabase
      .from('kitabs')
      .select('id, name_bn, full_marks, kitab_code, created_at, name_ar') 
      .order('kitab_code', { ascending: true });

    if (error) {
        console.error("Supabase error fetching kitabs for selection:", error);
        throw new Error(error.message || 'কিতাব তালিকা আনতে সমস্যা হয়েছে');
    }
    return data || [];
};


interface DraggableMarhalaRowProps {
  marhala: Marhala;
  index: number; 
  onView: (marhala: Marhala) => void;
  onEdit: (marhala: Marhala) => void;
  onDelete: (marhala: Marhala) => void;
  isDeleting: boolean;
  marhalaToDeleteId: string | null | undefined;
}

const DraggableMarhalaRow = React.memo(({ marhala, index, onView, onEdit, onDelete, isDeleting, marhalaToDeleteId }: DraggableMarhalaRowProps): JSX.Element => {
  return (
    <Draggable draggableId={marhala.id.toString()} index={index}>
      {(provided, snapshot) => (
        <tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`hover:bg-gray-50 transition-colors ${snapshot.isDragging ? 'bg-emerald-50 shadow-lg' : ''}`}
          style={{ ...provided.draggableProps.style }}
        >
          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-700 text-center">
            <div {...provided.dragHandleProps} className="cursor-grab p-1 text-gray-500 hover:text-gray-700 inline-block" aria-label="মারহালা সরান">
              <Bars3Icon className="w-5 h-5" />
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-700 text-center">
            {(marhala.marhala_order || index + 1).toLocaleString('bn-BD')}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{marhala.marhala_code?.toString() || marhala.id}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{marhala.nameBn}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{marhala.kitabIds?.length > 0 ? marhala.kitabIds.length.toLocaleString('bn-BD') : 'নেই'}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
            <button onClick={() => onView(marhala)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত দেখুন">
              <EyeIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => onEdit(marhala)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা করুন">
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </td>
        </tr>
      )}
    </Draggable>
  );
});
DraggableMarhalaRow.displayName = 'DraggableMarhalaRow';


const MarhalaListPage :React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<MarhalaSpecificType>('boys');

  const { data: fetchedMarhalas = [], isLoading: isLoadingMarhalas, error: marhalasError, refetch: refetchMarhalas } = useQuery<Marhala[], Error>({
    queryKey: ['marhalas'],
    queryFn: fetchMarhalasFromSupabase,
  });

  const [boysMarhalas, setBoysMarhalas] = useState<Marhala[]>([]);
  const [girlsMarhalas, setGirlsMarhalas] = useState<Marhala[]>([]);
  
  useEffect(() => {
    setBoysMarhalas(fetchedMarhalas.filter(m => m.type === 'boys').sort((a,b) => (a.marhala_order || Infinity) - (b.marhala_order || Infinity)));
    setGirlsMarhalas(fetchedMarhalas.filter(m => m.type === 'girls').sort((a,b) => (a.marhala_order || Infinity) - (b.marhala_order || Infinity)));
  }, [fetchedMarhalas]);
  
  useEffect(() => {
    if (marhalasError) {
      addToast(marhalasError.message || 'মারহালা তালিকা লোড করা যায়নি।', 'error');
    }
  }, [marhalasError, addToast]);

  
  const { data: allKitabs = [], isLoading: isLoadingKitabs, error: kitabsError } = useQuery<KitabApiResponse[], Error>({
    queryKey: ['allKitabsForMarhalaList'],
    queryFn: fetchKitabsForSelection,
  });

  useEffect(() => {
    if(kitabsError) {
        addToast(kitabsError.message || 'সম্পাদনার জন্য কিতাব তালিকা লোড করা যায়নি।', 'error');
    }
  }, [kitabsError, addToast]);


  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMarhalaForView, setSelectedMarhalaForView] = useState<Marhala | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMarhala, setEditingMarhala] = useState<Marhala | null>(null);
  const [editForm, setEditForm] = useState<{ id: string; marhalaCode: string; nameBn: string; nameAr?: string; type: MarhalaSpecificType | ''; category: MarhalaCategory | ''; kitabIds: string[]; requiresPhoto: boolean; marhala_order?: number | null }>({
    id: '', marhalaCode: '', nameBn: '', nameAr: '', type: '', category: '', kitabIds: [], requiresPhoto: false, marhala_order: null
  });
  const [editErrors, setEditErrors] = useState<{ nameBn?: string; type?: string; category?: string; kitabIds?: string; apiError?: string }>({});
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [marhalaToDelete, setMarhalaToDelete] = useState<Marhala | null>(null);
  
  const kitabOptions: DistrictOption[] = useMemo(() => {
    return allKitabs.map(kitab => ({
      value: kitab.id,
      label: `${kitab.name_bn} (${kitab.full_marks} নম্বর)`,
    }));
  }, [allKitabs]);

  const getKitabNameById = (id: string): string => {
    const kitab = allKitabs.find(k => k.id === id);
    return kitab?.name_bn || 'অজানা কিতাব';
  };


  const handleViewClick = (marhala: Marhala) => {
    setSelectedMarhalaForView(marhala);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (marhala: Marhala) => {
    setEditingMarhala(marhala);
    setEditForm({ 
      id: marhala.id, 
      marhalaCode: marhala.marhala_code?.toString() || marhala.id,
      nameBn: marhala.nameBn, 
      nameAr: marhala.nameAr || '', 
      type: marhala.type, 
      category: marhala.category, 
      kitabIds: marhala.kitabIds ? [...marhala.kitabIds] : [],
      requiresPhoto: marhala.requiresPhoto || false, // Set requiresPhoto for edit form
      marhala_order: marhala.marhala_order 
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };
  
  const validateEditForm = (): boolean => {
    const newErrors: { nameBn?: string; type?: string; category?: string; kitabIds?: string } = {};
    if (!editForm.nameBn?.trim()) newErrors.nameBn = 'মারহালার বাংলা নাম আবশ্যক';
    if (!editForm.type) newErrors.type = 'মারহালার ধরণ নির্বাচন করুন';
    if (!editForm.category) newErrors.category = 'মারহালার ক্যাটাগরি নির্বাচন করুন';
    setEditErrors(prev => ({ ...prev, apiError: undefined, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const updateMarhalaMutation = useMutation({
    mutationFn: async (updatedMarhalaData: { p_id: string; p_name_bn: string; p_name_ar: string | null; p_type: string; p_category: string; p_kitab_ids: string[]; p_requires_photo: boolean; }) => {
        const { data, error } = await supabase.rpc('update_marhala', updatedMarhalaData);
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['marhalas'] });
        setIsEditModalOpen(false);
        addToast('মারহালার তথ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        let userMessage = `মারহালা আপডেট করতে সমস্যা হয়েছে: ${error.message}`;
        if (error && typeof error === 'object' && 'code' in error) {
            const typedRpcError = error as SupabasePostgrestError;
            if (typedRpcError.code === '23505') { // Unique violation
                setEditErrors(prev => ({ ...prev, nameBn: typedRpcError.message, apiError: undefined }));
                userMessage = typedRpcError.message;
            } else {
                setEditErrors(prev => ({ ...prev, apiError: userMessage }));
            }
        } else {
            setEditErrors(prev => ({ ...prev, apiError: userMessage }));
        }
        addToast(userMessage, 'error');
    }
  });

  const handleSaveChanges = async () => {
    if (!editingMarhala || !validateEditForm()) {
        addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
        return;
    }
    updateMarhalaMutation.mutate({
        p_id: editingMarhala.id,
        p_name_bn: editForm.nameBn.trim(),
        p_name_ar: editForm.nameAr?.trim() || null,
        p_type: editForm.type as MarhalaSpecificType,
        p_category: editForm.category as MarhalaCategory,
        p_kitab_ids: editForm.kitabIds,
        p_requires_photo: editForm.type === 'boys' ? editForm.requiresPhoto : false, // Photo only relevant for boys
    });
  };

  const deleteMarhalaMutation = useMutation({
    mutationFn: async (marhalaId: string) => {
      const { error } = await supabase.rpc('delete_marhala', { p_id: marhalaId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marhalas'] });
      addToast(`মারহালাটি সফলভাবে মুছে ফেলা হয়েছে।`, 'success');
      setIsDeleteAlertOpen(false);
      setMarhalaToDelete(null);
    },
    onError: (error: SupabasePostgrestError | Error) => {
      addToast(`মারহালা মুছে ফেলতে সমস্যা হয়েছে: ${error.message}`, 'error');
      setIsDeleteAlertOpen(false);
    },
  });

  const handleDeleteClick = (marhala: Marhala) => {
    setMarhalaToDelete(marhala);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!marhalaToDelete) return;
    deleteMarhalaMutation.mutate(marhalaToDelete.id);
  };
  
  const updateOrderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
        const { error } = await supabase.rpc('update_marhala_order_bulk', { p_ordered_ids: orderedIds });
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['marhalas'] });
        addToast('মারহালাগুলোর নতুন ক্রম সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
    },
    onError: (error: SupabasePostgrestError | Error) => {
        addToast(`ক্রম পরিবর্তন সংরক্ষণ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        refetchMarhalas(); 
    }
  });

  const handleSaveOrder = async () => {
    const orderedBoysIds = boysMarhalas.map(m => m.id);
    const orderedGirlsIds = girlsMarhalas.map(m => m.id);
    
    let boysSuccess = true;
    let girlsSuccess = true;

    if (orderedBoysIds.length > 0) {
       try { await updateOrderMutation.mutateAsync(orderedBoysIds); }
       catch(e) { boysSuccess = false; /* Error toast handled by mutation's onError */ }
    }
    if (orderedGirlsIds.length > 0) {
       try { await updateOrderMutation.mutateAsync(orderedGirlsIds); }
       catch(e) { girlsSuccess = false; /* Error toast handled by mutation's onError */ }
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type: dndType } = result; 
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const listToUpdate = dndType === 'boys-marhalas' ? boysMarhalas : girlsMarhalas;
    const setListToUpdate = dndType === 'boys-marhalas' ? setBoysMarhalas : setGirlsMarhalas;

    const newMarhalas = Array.from(listToUpdate); 
    const [reorderedItem] = newMarhalas.splice(source.index, 1);
    newMarhalas.splice(destination.index, 0, reorderedItem);
    
    const updatedWithOrder = newMarhalas.map((marhala, idx) => ({
        ...marhala,
        marhala_order: idx + 1
    }));

    setListToUpdate(updatedWithOrder);
  };


  const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="py-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800">{value || 'N/A'}</p>
    </div>
  );
  
  const tabItems = [
    { id: 'boys' as MarhalaSpecificType, label: 'বালক মারহালা', icon: <UserCircleIcon className="w-4 h-4"/>, content: (
        <MarhalaListTable marhalas={boysMarhalas} type="boys-marhalas" onView={handleViewClick} onEdit={handleEditClick} onDelete={handleDeleteClick} isDeleting={deleteMarhalaMutation.isPending} marhalaToDeleteId={marhalaToDelete?.id} />
    )},
    { id: 'girls' as MarhalaSpecificType, label: 'বালিকা মারহালা', icon: <UserCircleIcon className="w-4 h-4" style={{fill: 'pink'}}/>, content: (
        <MarhalaListTable marhalas={girlsMarhalas} type="girls-marhalas" onView={handleViewClick} onEdit={handleEditClick} onDelete={handleDeleteClick} isDeleting={deleteMarhalaMutation.isPending} marhalaToDeleteId={marhalaToDelete?.id} />
    )}
  ];

  if (isLoadingMarhalas && boysMarhalas.length === 0 && girlsMarhalas.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-gray-500 animate-spin mr-2" />
        <p className="text-xl text-gray-700">মারহালা তালিকা লোড হচ্ছে...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">মারহালা তালিকা ও স্তরবিন্যাস</h2>
         <div className="flex space-x-2">
            <Button onClick={handleSaveOrder} leftIcon={<CheckCircleIcon className="w-5 h-5"/>} disabled={updateOrderMutation.isPending || isLoadingMarhalas}>
              {updateOrderMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "স্তর সংরক্ষণ করুন"}
            </Button>
            <Button onClick={() => navigate('/marhala/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
            নতুন মারহালা
            </Button>
        </div>
      </div>
      <Card bodyClassName="p-0">
        <DragDropContext onDragEnd={onDragEnd}>
            <Tabs tabs={tabItems} activeTabId={activeTab} onTabChange={(id) => setActiveTab(id as MarhalaSpecificType)} />
        </DragDropContext>
      </Card>

      {isViewModalOpen && selectedMarhalaForView && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`মারহালার বিবরণ: ${selectedMarhalaForView?.nameBn}`} size="lg">
            <div className="space-y-3">
                <ViewDetailItem label="আইডি/কোড" value={selectedMarhalaForView?.marhala_code?.toString() || selectedMarhalaForView?.id} />
                <ViewDetailItem label="স্তর (সংরক্ষিত)" value={selectedMarhalaForView?.marhala_order ? selectedMarhalaForView?.marhala_order.toLocaleString('bn-BD') : 'নির্ধারিত নয়'} />
                <ViewDetailItem label="নাম (বাংলা)" value={selectedMarhalaForView?.nameBn} />
                <ViewDetailItem label="নাম (আরবী)" value={selectedMarhalaForView?.nameAr} />
                <ViewDetailItem label="ধরণ" value={selectedMarhalaForView?.type ? getMarhalaTypeLabel(selectedMarhalaForView.type) : 'N/A'} />
                <ViewDetailItem label="ক্যাটাগরি" value={selectedMarhalaForView?.category ? getMarhalaCategoryLabel(selectedMarhalaForView.category) : 'N/A'} />
                <ViewDetailItem label="ছবি আবশ্যক (বালকদের জন্য)" value={selectedMarhalaForView?.requiresPhoto ? 'হ্যাঁ' : 'না'} />
                <div>
                    <p className="text-sm text-gray-500">অন্তর্ভুক্ত কিতাবসমূহ (${selectedMarhalaForView?.kitabIds?.length?.toLocaleString('bn-BD') || '০'}টি)</p>
                    {selectedMarhalaForView?.kitabIds && selectedMarhalaForView.kitabIds.length > 0 ? (
                        <ul className="list-disc list-inside pl-1 text-md font-medium text-gray-800 max-h-40 overflow-y-auto">
                            {selectedMarhalaForView?.kitabIds.map(kitabId => (
                                <li key={kitabId}>{getKitabNameById(kitabId)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-md font-medium text-gray-800">কোনো কিতাব অন্তর্ভুক্ত নেই।</p>
                    )}
                </div>
            </div>
        </Modal>
      )}

      {isEditModalOpen && editingMarhala && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`মারহালা সম্পাদনা: ${editForm.nameBn}`} size="xl"
          footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={updateMarhalaMutation.isPending}>বাতিল</Button><Button variant="primary" onClick={handleSaveChanges} disabled={updateMarhalaMutation.isPending || isLoadingKitabs}>{updateMarhalaMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}</Button></>}>
          <div className="space-y-4">
            <Input label="মারহালা কোড" id="editMarhalaCode" value={editForm.marhalaCode} disabled className="bg-gray-100"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="মারহালার নাম (বাংলা)" id="editNameBn" value={editForm.nameBn} onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })} error={editErrors?.nameBn} required disabled={updateMarhalaMutation.isPending}/>
                <Input label="মারহালার নাম (আরবী)" id="editNameAr" value={editForm.nameAr || ''} onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })} disabled={updateMarhalaMutation.isPending} dir="rtl" className="text-right"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="মারহালার ধরণ" id="editType" value={editForm.type} onChange={(e) => {
                    const newType = e.target.value as MarhalaSpecificType | '';
                    setEditForm({ ...editForm, type: newType, requiresPhoto: newType === 'girls' ? false : editForm.requiresPhoto });
                }} options={MARHALA_TYPES} error={editErrors?.type} required disabled={updateMarhalaMutation.isPending || true /* Type change is complex and might be disabled */} />
                <Select label="মারহালার ক্যাটাগরি" id="editCategory" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as MarhalaCategory | ''})} options={MARHALA_CATEGORIES} error={editErrors?.category} required disabled={updateMarhalaMutation.isPending}/>
                 <div className="flex items-end pb-4">
                    <Checkbox
                      id="editRequiresPhoto"
                      label="ছবি আবশ্যক (বালকদের জন্য)"
                      checked={editForm.requiresPhoto}
                      onChange={(e) => setEditForm({...editForm, requiresPhoto: e.target.checked})}
                      disabled={updateMarhalaMutation.isPending || editForm.type === 'girls'}
                      wrapperClassName={editForm.type === 'girls' ? 'opacity-50' : ''}
                    />
                </div>
            </div>
            { (editForm.category === 'darsiyat' || editForm.category === 'hifz') && (
                isLoadingKitabs ? <p className="text-sm text-gray-500">কিতাব তালিকা লোড হচ্ছে...</p> :
                allKitabs.length > 0 ? (
                    <MultiSelectGrid label="অন্তর্ভুক্ত কিতাবসমূহ" options={kitabOptions} selectedValues={editForm.kitabIds || []} onChange={(newKitabIds) => setEditForm({...editForm, kitabIds: newKitabIds})} error={editErrors?.kitabIds} gridCols={2} visibleRows={5} itemHeight={44} wrapperClassName={updateMarhalaMutation.isPending ? 'opacity-50' : ''}/>
                ) : <p className="text-sm text-yellow-600">কোনো কিতাব পাওয়া যায়নি। কিতাব যোগ করতে না পারলে, অনুগ্রহ করে প্রথমে কিতাব নিবন্ধন করুন।</p>
            )}
            {editErrors?.apiError && <p className="text-sm text-red-500">{editErrors.apiError}</p>}
          </div>
        </Modal>
      )}

      {isDeleteAlertOpen && marhalaToDelete && (
        <AlertDialog isOpen={isDeleteAlertOpen} onClose={() => setIsDeleteAlertOpen(false)} onConfirm={confirmDelete} title="নিশ্চিতকরণ" description={`আপনি কি "${marhalaToDelete?.nameBn}" মারহালাটি মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।`} confirmButtonText={deleteMarhalaMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"} cancelButtonText="না, থাক" />
      )}
    </div>
  );
};


interface MarhalaListTableProps {
  marhalas: Marhala[];
  type: 'boys-marhalas' | 'girls-marhalas'; 
  onView: (marhala: Marhala) => void;
  onEdit: (marhala: Marhala) => void;
  onDelete: (marhala: Marhala) => void;
  isDeleting: boolean;
  marhalaToDeleteId: string | null | undefined;
}

const MarhalaListTable: React.FC<MarhalaListTableProps> = ({ marhalas, type, onView, onEdit, onDelete, isDeleting, marhalaToDeleteId }) => {
  if (!marhalas || marhalas.length === 0) {
    return <p className="text-center text-gray-500 py-6 px-4">এই প্রকারের কোনো মারহালা পাওয়া যায়নি।</p>;
  }
  return (
    <Droppable droppableId={type} type={type}>
      {(provided) => (
        <div className="overflow-x-auto" {...provided.droppableProps} ref={provided.innerRef}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">সরান</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">ক্রম</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">আইডি/কোড</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">নাম (বাংলা)</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">কিতাব সংখ্যা</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marhalas.map((marhala, index) => (
                <DraggableMarhalaRow
                    key={marhala.id}
                    marhala={marhala}
                    index={index}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                    marhalaToDeleteId={marhalaToDeleteId}
                />
              ))}
              {provided.placeholder}
            </tbody>
          </table>
        </div>
      )}
    </Droppable>
  );
};

export default MarhalaListPage;
