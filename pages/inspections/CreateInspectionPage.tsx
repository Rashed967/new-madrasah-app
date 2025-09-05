
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { SearchableSelect, SearchableSelectOption } from '../../components/ui/SearchableSelect';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { PlusCircleIcon, TrashIcon, XMarkIcon } from '../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';
import { MadrasaInspection, InspectionFee, SelectOption } from '../../types';

const initialFormData: Partial<MadrasaInspection & { examId: string | null }> = {
  madrasaId: '',
  examId: null,
  inspectionDate: new Date().toISOString().split('T')[0],
  inspectorName: '',
  comments: '',
  fees: [],
};

const fetchExamsForSelection = async (): Promise<SelectOption[]> => {
    const { data, error } = await supabase
      .from('exams')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
        console.error("Supabase error fetching exams for selection:", error);
        throw new Error(error.message || 'পরীক্ষা তালিকা আনতে সমস্যা হয়েছে');
    }
    return data.map(exam => ({ value: exam.id, label: exam.name })) || [];
};

const CreateInspectionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<Partial<MadrasaInspection & { examId: string | null }>>(initialFormData);
    const [errors, setErrors] = useState<any>({});
    
    // Fetch existing inspection data if in edit mode
    const { data: existingInspection, isLoading: isLoadingExisting } = useQuery({
        queryKey: ['madrasaInspection', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('madrasa_inspections').select('*, madrasas(name_bn, madrasa_code)').eq('id', id).single();
            if (error) throw error;
            return { ...data, madrasaNameBn: data.madrasas?.name_bn, madrasaCode: data.madrasas?.madrasa_code };
        },
        enabled: isEditMode,
    });
    
    useEffect(() => {
        if (isEditMode && existingInspection) {
            setFormData({
                ...existingInspection,
                madrasaId: existingInspection.madrasa_id,
                examId: existingInspection.exam_id,
                inspectionDate: existingInspection.inspection_date,
                inspectorName: existingInspection.inspector_name,
            });
        }
    }, [isEditMode, existingInspection]);
    
    const { data: madrasaOptions, isLoading: isLoadingMadrasas } = useQuery<SearchableSelectOption[], Error>({
        queryKey: ['madrasasForInspectionDropdown'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('search_madrasas_for_filter_dropdown', { p_limit: 5000 });
            if (error) throw error;
            return data.items || [];
        }
    });

    const { data: examOptions, isLoading: isLoadingExams } = useQuery<SelectOption[], Error>({
        queryKey: ['examsForInspectionDropdown'],
        queryFn: fetchExamsForSelection,
    });

    const { data: incomeCategories, isLoading: isLoadingCategories } = useQuery<SelectOption[], Error>({
        queryKey: ['incomeTransactionCategories'],
        queryFn: async () => {
            const { data, error } = await supabase.from('transaction_categories').select('id, name').eq('type', 'income');
            if (error) throw error;
            return data.map(c => ({ value: c.name, label: c.name })) || [];
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        if(errors[name]) setErrors(prev => ({...prev, [name]: undefined}));
    };

    const handleDateChange = (date: string) => {
        setFormData(prev => ({...prev, inspectionDate: date}));
        if(errors.inspectionDate) setErrors(prev => ({...prev, inspectionDate: undefined}));
    };
    
    const handleMadrasaChange = (madrasaId: string | null) => {
        setFormData(prev => ({ ...prev, madrasaId: madrasaId || ''}));
        if(errors.madrasaId) setErrors(prev => ({ ...prev, madrasaId: undefined}));
    }

    const handleFeeChange = (index: number, field: keyof InspectionFee, value: string) => {
        const newFees = [...(formData.fees || [])];
        newFees[index] = { ...newFees[index], [field]: value };
        setFormData(prev => ({ ...prev, fees: newFees }));
    };

    const addFeeRow = () => {
        setFormData(prev => ({...prev, fees: [...(prev.fees || []), { type: '', amount: '' }]}));
    };

    const removeFeeRow = (index: number) => {
        setFormData(prev => ({...prev, fees: prev.fees?.filter((_, i) => i !== index)}));
    };

    const validateForm = (): boolean => {
        const newErrors: any = {};
        if(!formData.madrasaId) newErrors.madrasaId = 'মাদরাসা নির্বাচন করুন।';
        if(!formData.examId) newErrors.examId = 'পরীক্ষা নির্বাচন করুন।';
        if(!formData.inspectionDate) newErrors.inspectionDate = 'পরিদর্শনের তারিখ আবশ্যক।';
        if(!formData.inspectorName?.trim()) newErrors.inspectorName = 'পরিদর্শকের নাম আবশ্যক।';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const mutation = useMutation({
        mutationFn: async (payload: Partial<MadrasaInspection & { examId: string | null }>) => {
            const rpcFunction = isEditMode ? 'update_madrasa_inspection' : 'create_madrasa_inspection';
            const rpcPayload = isEditMode 
                ? { p_inspection_id: id, p_updates: { madrasa_id: payload.madrasaId, exam_id: payload.examId, inspection_date: payload.inspectionDate, inspector_name: payload.inspectorName, comments: payload.comments, fees: payload.fees } }
                : { p_madrasa_id: payload.madrasaId, p_exam_id: payload.examId, p_inspection_date: payload.inspectionDate, p_inspector_name: payload.inspectorName, p_comments: payload.comments, p_fees: payload.fees };
            
            const { error } = await supabase.rpc(rpcFunction, rpcPayload);
            if (error) throw error;
        },
        onSuccess: () => {
            addToast(`পরিদর্শন রিপোর্ট সফলভাবে ${isEditMode ? 'আপডেট' : 'তৈরি'} হয়েছে।`, 'success');
            queryClient.invalidateQueries({ queryKey: ['madrasaInspections'] });
            navigate('/inspection/list');
        },
        onError: (err: PostgrestError) => {
            addToast(`সংরক্ষণে সমস্যা: ${err.message}`, 'error');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!validateForm()) return;
        
        const payload = {
            ...formData,
            fees: formData.fees?.filter(fee => fee.type.trim() && String(fee.amount).trim()).map(fee => ({ ...fee, amount: Number(fee.amount) })) || []
        };
        mutation.mutate(payload);
    };
    
    const selectedMadrasaLabel = useMemo(() => {
        if (!formData.madrasaId) return '';
        if (isEditMode && existingInspection?.madrasa_id === formData.madrasaId) {
            return `${existingInspection.madrasaNameBn} (${existingInspection.madrasaCode})`;
        }
        return madrasaOptions?.find(opt => opt.value === formData.madrasaId)?.label || '';
    }, [formData.madrasaId, isEditMode, existingInspection, madrasaOptions]);


    if(isEditMode && isLoadingExisting) return <div>রিপোর্ট লোড হচ্ছে...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <Card title={isEditMode ? 'পরিদর্শন রিপোর্ট সম্পাদনা' : 'নতুন পরিদর্শন রিপোর্ট'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <SearchableSelect id="madrasaId" label="মাদরাসা" options={madrasaOptions || []} value={formData.madrasaId || null} onChange={handleMadrasaChange} placeholder="মাদরাসা খুঁজুন..." required disabled={isLoadingMadrasas} error={errors.madrasaId}/>
                        <Select id="examId" label="পরীক্ষা" options={examOptions || []} value={formData.examId || ''} onChange={(e) => setFormData(prev => ({ ...prev, examId: e.target.value }))} placeholder="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} error={errors.examId} required/>
                        <Input label="পরিদর্শকের নাম" name="inspectorName" value={formData.inspectorName || ''} onChange={handleInputChange} error={errors.inspectorName} required/>
                        <CustomDatePicker id="inspectionDate" label="পরিদর্শনের তারিখ" value={formData.inspectionDate || ''} onChange={handleDateChange} error={errors.inspectionDate} required/>
                    </div>
                    <Textarea label="পর্যবেক্ষণ/মন্তব্য" name="comments" value={formData.comments || ''} onChange={handleInputChange} rows={4}/>
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-md font-medium text-gray-700 px-2">ফি-এর বিবরণ</legend>
                        <div className="space-y-3 mt-2">
                            {formData.fees?.map((fee, index) => (
                                <div key={index} className="flex items-end gap-3">
                                    <Select label="ফির ধরণ" value={fee.type} onChange={e => handleFeeChange(index, 'type', e.target.value)} options={incomeCategories || []} placeholderOption="খাত নির্বাচন করুন" wrapperClassName="mb-0 flex-grow" disabled={isLoadingCategories}/>
                                    <Input label="পরিমাণ (৳)" type="number" value={String(fee.amount)} onChange={e => handleFeeChange(index, 'amount', e.target.value)} wrapperClassName="mb-0 flex-grow"/>
                                    <Button type="button" variant="danger" size="sm" onClick={() => removeFeeRow(index)} className="h-10 mb-0" disabled={formData.fees && formData.fees.length <= 1}><TrashIcon className="w-4 h-4"/></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" onClick={addFeeRow} size="sm" className="mt-4" leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>আরেকটি ফি যোগ করুন</Button>
                    </fieldset>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={() => navigate('/inspection/list')}>বাতিল</Button>
                        <Button type="submit" disabled={mutation.isPending}>{isEditMode ? 'আপডেট করুন' : 'রিপোর্ট সংরক্ষণ করুন'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateInspectionPage;
