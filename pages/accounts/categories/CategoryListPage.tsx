
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../contexts/ToastContext';
import { PlusCircleIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '../../../components/ui/Icon';
import { TransactionCategory, TransactionType } from '../../../types';
import { AlertDialog } from '../../../components/ui/AlertDialog';

type CategoryFormData = Omit<TransactionCategory, 'id' | 'created_at'>;

const CategoryListPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery<TransactionCategory[], Error>({
    queryKey: ['transaction_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transaction_categories').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (newCategory: CategoryFormData) => {
      const { error } = await supabase.from('transaction_categories').insert([newCategory]);
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('খাত সফলভাবে যোগ করা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['transaction_categories'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      addToast(`খাত যোগ করতে সমস্যা: ${error.message}`, 'error');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: Omit<TransactionCategory, 'created_at'>) => {
      const { error } = await supabase.from('transaction_categories').update(updatedCategory).eq('id', updatedCategory.id);
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('খাত সফলভাবে আপডেট করা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['transaction_categories'] });
      setIsModalOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      addToast(`খাত আপডেট করতে সমস্যা: ${error.message}`, 'error');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('transaction_categories').delete().eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      addToast('খাত সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      queryClient.invalidateQueries({ queryKey: ['transaction_categories'] });
      setIsAlertOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      addToast(`খাত মুছে ফেলতে সমস্যা: ${error.message}`, 'error');
    },
  });

  const handleAddClick = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (category: TransactionCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: TransactionCategory) => {
    setSelectedCategory(category);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  const CategoryForm: React.FC<{ onSubmit: (formData: CategoryFormData) => void; initialData?: TransactionCategory | null; isLoading: boolean; }> = ({ onSubmit, initialData, isLoading }) => {
    const [formData, setFormData] = useState<CategoryFormData>({
      name: initialData?.name || '',
      type: initialData?.type || 'expense',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.type) {
        addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'warning');
        return;
      }
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="খাতের নাম"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Select
          label="খাতের ধরণ"
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
          options={[
            { value: 'income', label: 'আয়' },
            { value: 'expense', label: 'ব্যয়' },
          ]}
          required
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">আয়-ব্যয়ের খাতসমূহ</h2>
          <p className="text-gray-500">এখান থেকে আয়-ব্যয়ের খাতসমূহ যোগ, সম্পাদনা বা মুছে ফেলুন।</p>
        </div>
        <Button onClick={handleAddClick} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
          নতুন খাত যোগ করুন
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">খাতের নাম</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ধরণ</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-4">লোড হচ্ছে...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4">কোনো খাত পাওয়া যায়নি।</td></tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.type === 'income' ? 'আয়' : 'ব্যয়'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="icon" size="sm" onClick={() => handleEditClick(category)} aria-label="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="icon" size="sm" onClick={() => handleDeleteClick(category)} aria-label="Delete">
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'খাত সম্পাদনা করুন' : 'নতুন খাত যোগ করুন'}
      >
        <CategoryForm
          onSubmit={(formData) => {
            if (selectedCategory) {
              updateCategoryMutation.mutate({ id: selectedCategory.id, ...formData });
            } else {
              createCategoryMutation.mutate(formData);
            }
          }}
          initialData={selectedCategory}
          isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        />
      </Modal>

      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={handleConfirmDelete}
        title="খাত মুছে ফেলুন"
        confirmText="মুছে ফেলুন"
        isConfirming={deleteCategoryMutation.isPending}
      >
        <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-800">আপনি কি নিশ্চিত?</h3>
            <p className="text-sm text-gray-500">
                আপনি কি সত্যিই এই খাতটি মুছে ফেলতে চান? এই প্রক্রিয়াটি বাতিল করা যাবে না। <br/>
                এই খাতের সাথে সম্পর্কিত সকল লেনদেন প্রভাবিত হতে পারে।
            </p>
        </div>
      </AlertDialog>
    </div>
  );
};

export default CategoryListPage;
