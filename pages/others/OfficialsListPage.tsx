
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { FileUpload } from '../../components/ui/FileUpload';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, Bars3Icon, CheckCircleIcon, EyeIcon } from '../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

interface Official {
  id: string;
  name: string;
  designation: string;
  image_url: string;
  order_index: number;
}

const OfficialsListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [officials, setOfficials] = useState<Official[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [formData, setFormData] = useState<{ name: string; designation: string; imageFile: File | null }>({ name: '', designation: '', imageFile: null });
  const [errors, setErrors] = useState<{ name?: string; designation?: string; imageFile?: string }>({});
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [officialToDelete, setOfficialToDelete] = useState<Official | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [officialToView, setOfficialToView] = useState<Official | null>(null);

  const { data: fetchedOfficials, isLoading, error } = useQuery<Official[], Error>({
    queryKey: ['officials'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_officials');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    if (fetchedOfficials) {
      setOfficials(fetchedOfficials);
    }
  }, [fetchedOfficials]);

  useEffect(() => { if (error) addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error'); }, [error, addToast]);
  useEffect(() => {
    if (editingOfficial) {
      setFormData({ name: editingOfficial.name, designation: editingOfficial.designation, imageFile: null });
    } else {
      setFormData({ name: '', designation: '', imageFile: null });
    }
  }, [editingOfficial]);

  const createMutation = useMutation({
    mutationFn: async (newOfficial: { name: string; designation: string; image_url?: string }) => {
      const { error } = await supabase.rpc('create_official', { p_name: newOfficial.name, p_designation: newOfficial.designation, p_image_url: newOfficial.image_url });
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('কর্মকর্তা সফলভাবে যোগ করা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      setIsModalOpen(false);
    },
    onError: (err: PostgrestError | Error) => { addToast(`তৈরিতে সমস্যা: ${err.message}`, 'error'); },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedOfficial: { id: string; name: string; designation: string; image_url?: string }) => {
      const { error } = await supabase.rpc('update_official', { p_id: updatedOfficial.id, p_name: updatedOfficial.name, p_designation: updatedOfficial.designation, p_image_url: updatedOfficial.image_url });
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('কর্মকর্তার তথ্য সফলভাবে আপডেট করা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      setIsModalOpen(false);
    },
    onError: (err: PostgrestError | Error) => { addToast(`আপডেটে সমস্যা: ${err.message}`, 'error'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_official', { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('কর্মকর্তা সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      setIsDeleteAlertOpen(false);
    },
    onError: (err: PostgrestError | Error) => { addToast(`মুছতে সমস্যা: ${err.message}`, 'error'); },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await supabase.rpc('update_officials_order', { p_ordered_ids: orderedIds });
      if (error) throw error;
    },
    onSuccess: () => { addToast('ক্রম সফলভাবে সংরক্ষণ করা হয়েছে।', 'success'); queryClient.invalidateQueries({ queryKey: ['officials'] }); },
    onError: (err: PostgrestError | Error) => { addToast(`ক্রম সংরক্ষণে সমস্যা: ${err.message}`, 'error'); },
  });
  
  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'নাম আবশ্যক।';
    if (!formData.designation.trim()) newErrors.designation = 'পদবি আবশ্যক।';
    if (formData.imageFile && formData.imageFile.size > 2 * 1024 * 1024) newErrors.imageFile = 'ছবির সাইজ ২MB এর কম হতে হবে।';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    let imageUrl = editingOfficial?.image_url;
    if (formData.imageFile) {
      try {
        imageUrl = await uploadToCloudinary(formData.imageFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      } catch (uploadError: any) {
        addToast(`ছবি আপলোডে সমস্যা: ${uploadError.message}`, 'error');
        return;
      }
    }
    const payload = { ...formData, image_url: imageUrl };
    if (editingOfficial) {
      updateMutation.mutate({ id: editingOfficial.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(officials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setOfficials(items);
    updateOrderMutation.mutate(items.map(item => item.id));
  };
  
  const isLoadingAction = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || updateOrderMutation.isPending;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold text-gray-800">পরিচালনা পর্ষদ ম্যানেজমেন্ট</h2>
          <Button onClick={() => { setEditingOfficial(null); setIsModalOpen(true); }} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>নতুন কর্মকর্তা</Button>
        </div>
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="officials-list">
                {(provided) => (
                  <table className="min-w-full divide-y divide-gray-200" ref={provided.innerRef} {...provided.droppableProps}>
                    <thead className="bg-gray-50"><tr>
                      <th className="w-12"></th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">ছবি</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">নাম</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">পদবি</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">অ্যাকশন</th>
                    </tr></thead>
                    <tbody>
                      {isLoading ? (<tr><td colSpan={5} className="text-center p-6 text-gray-500"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block"/> লোড হচ্ছে...</td></tr>) :
                       officials.map((official, index) => (
                        <Draggable key={official.id} draggableId={official.id} index={index}>
                          {(provided) => (
                            <tr ref={provided.innerRef} {...provided.draggableProps} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-center text-gray-400 cursor-grab" {...provided.dragHandleProps}><Bars3Icon className="w-5 h-5"/></td>
                              <td className="px-4 py-3"><img src={official.image_url} alt={official.name} className="w-12 h-12 rounded-full object-cover ml-auto"/></td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{official.name}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-600">{official.designation}</td>
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="sm" onClick={() => { setOfficialToView(official); setIsViewModalOpen(true); }}><EyeIcon className="w-5 h-5"/></Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingOfficial(official); setIsModalOpen(true); }}><PencilSquareIcon className="w-5 h-5"/></Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => { setOfficialToDelete(official); setIsDeleteAlertOpen(true); }}><TrashIcon className="w-5 h-5"/></Button>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                       ))}
                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </Card>

        {isModalOpen && (
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOfficial ? 'কর্মকর্তা এডিট করুন' : 'নতুন কর্মকর্তা যোগ করুন'}>
                <div className="space-y-4">
                    <Input label="নাম" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} error={errors.name} required/>
                    <Input label="পদবি" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} error={errors.designation} required/>
                    <FileUpload id="officialImage" label="ছবি" onFileChange={(file) => setFormData({...formData, imageFile: file})} acceptedFileTypes="image/jpeg, image/png, image/gif" fileNameDisplay={formData.imageFile?.name || editingOfficial?.image_url?.split('/').pop()} error={errors.imageFile}/>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>বাতিল</Button>
                    <Button onClick={handleSave} disabled={isLoadingAction}>{isLoadingAction ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</Button>
                </div>
            </Modal>
        )}
        
        {isViewModalOpen && officialToView && (
            <Modal isOpen={true} onClose={() => setIsViewModalOpen(false)} title="কর্মকর্তার বিবরণ" size="lg">
                <div className="space-y-4 text-center">
                   <img src={officialToView.image_url} alt={officialToView.name} className="w-32 h-32 rounded-full object-cover mb-3 mx-auto border-2 border-emerald-200"/>
                   <h3 className="text-xl font-bold text-emerald-800">{officialToView.name}</h3>
                   <p className="text-md text-gray-600">{officialToView.designation}</p>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>বন্ধ করুন</Button>
                </div>
            </Modal>
        )}

        {isDeleteAlertOpen && officialToDelete && (
            <AlertDialog isOpen={isDeleteAlertOpen} onClose={() => setIsDeleteAlertOpen(false)} onConfirm={() => deleteMutation.mutate(officialToDelete.id)} title="মুছে ফেলা নিশ্চিত করুন" description={`আপনি কি "${officialToDelete.name}" (${officialToDelete.designation}) এর তথ্য মুছে ফেলতে চান?`} confirmButtonText="হ্যাঁ, মুছুন" confirmButtonVariant="danger" />
        )}
    </div>
  );
};
export default OfficialsListPage;
