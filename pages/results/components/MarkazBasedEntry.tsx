import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MarkStatus, Mark, MarkazEntryData, SelectOption, SearchableSelectOption } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { ArrowPathIcon, CheckCircleIcon } from '../../../components/ui/Icon';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { MarkazFilters } from './MarkazFilters';
import { MarkazMarksGrid } from './MarkazMarksGrid';
import { SaveStatus, SaveStatusIndicator } from './SaveStatusIndicator';

export const MarkazBasedEntry: React.FC = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedMarkazId, setSelectedMarkazId] = useState<string>('');
    const [selectedMarhalaId, setSelectedMarhalaId] = useState<string>('');
    const [marksData, setMarksData] = useState<MarkazEntryData | null>(null);
    const [marksInput, setMarksInput] = useState<Record<string, Record<string, { value: number | string; status: MarkStatus }>>>({});
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const itemsPerPage = 25;
    const marksInputRef = useRef(marksInput);
    marksInputRef.current = marksInput;

    const { data: exams = [], isLoading: isLoadingExams } = useQuery<SelectOption[], Error>({ queryKey: ['examsForMarkazEntry'], queryFn: async () => { const {data,error} = await supabase.rpc('get_exams_for_filter_dropdown', {p_limit:1000}); if(error) throw error; return data.items || []; } });
    const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<SearchableSelectOption[], Error>({ queryKey: ['markazesForMarkazEntry'], queryFn: async () => { const {data,error} = await supabase.rpc('get_markazes_for_filter_dropdown', {p_limit:1000}); if(error) throw error; return data.items || []; } });
    const { data: marhalas = [], isLoading: isLoadingMarhalas } = useQuery<SelectOption[], Error>({ queryKey: ['marhalasForMarkazEntry'], queryFn: async () => { const {data,error} = await supabase.rpc('get_marhalas_for_filter_dropdown', {p_limit:1000}); if(error) throw error; return data.items || []; } });
    
    const { data: fetchedData, isLoading: isLoadingGridData, refetch: refetchGridData } = useQuery<MarkazEntryData, Error>({
        queryKey: ['markazEntryData', selectedExamId, selectedMarkazId, selectedMarhalaId],
        queryFn: async () => { const { data, error } = await supabase.rpc('get_data_for_markaz_entry', { p_exam_id: selectedExamId, p_markaz_id: selectedMarkazId, p_marhala_id: selectedMarhalaId }); if (error) throw error; return data; },
        enabled: !!selectedExamId && !!selectedMarkazId && !!selectedMarhalaId,
    });
    
    useEffect(() => {
        if (fetchedData) {
            setMarksData(fetchedData);
            const initialMarks: Record<string, Record<string, { value: number | string; status: MarkStatus }>> = {};
            fetchedData.examinees.forEach(ex => {
                initialMarks[ex.examinee_id] = {};
                fetchedData.kitabs.forEach(kitab => {
                    const markInfo = ex.marks[kitab.id];
                    initialMarks[ex.examinee_id][kitab.id] = {
                        value: markInfo?.value ?? '',
                        status: markInfo?.status || 'present'
                    };
                });
            });
            setMarksInput(initialMarks);
            setCurrentPage(1);
            setSaveStatus('idle');
        } else {
            setMarksData(null);
            setMarksInput({});
        }
    }, [fetchedData]);

    useEffect(() => {
        if (!selectedExamId || !selectedMarhalaId || !marksData) return;
        const channel = supabase.channel(`marks-changes-for-marhala-${selectedMarhalaId}`);
        const subscription = channel.on<Mark>('postgres_changes', { event: '*', schema: 'public', table: 'marks', filter: `exam_id=eq.${selectedExamId}` }, (payload) => {
            const updatedMark = payload.new as Mark;
            if (updatedMark && updatedMark.examinee_id && updatedMark.kitab_id && marksData.examinees.some(ex => ex.examinee_id === updatedMark.examinee_id) && marksData.kitabs.some(k => k.id === updatedMark.kitab_id)) {
                setMarksInput(prev => {
                    const newMarks = { ...prev };
                    if (!newMarks[updatedMark.examinee_id]) newMarks[updatedMark.examinee_id] = {};
                    newMarks[updatedMark.examinee_id][updatedMark.kitab_id] = { value: updatedMark.obtained_marks ?? '', status: (updatedMark.status as MarkStatus) || 'present' };
                    return newMarks;
                });
            }
        }).subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') addToast(`Real-time সংযোগে ত্রুটি হয়েছে।`, 'error');
        });
        return () => { supabase.removeChannel(channel); };
    }, [selectedExamId, selectedMarhalaId, marksData, addToast]);

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => { 
            if (!payload || payload.p_marks_payload.length === 0) { setSaveStatus('idle'); return; }
            setSaveStatus('saving');
            const { error } = await supabase.rpc('save_marks_for_markaz_entry_bulk', payload); 
            if (error) throw error; 
        },
        onSuccess: () => { addToast('নম্বর সফলভাবে সংরক্ষণ করা হয়েছে!', 'success'); refetchGridData(); setSaveStatus('success'); },
        onError: (error: PostgrestError | Error) => { addToast(`সংরক্ষণে ত্রুটি: ${error.message}`, 'error'); setSaveStatus('error'); }
    });

    const validateAndPreparePayloadForMarkaz = useCallback((currentMarks: typeof marksInput) => {
        if (!marksData) return null;
        const newErrors: Record<string, Record<string, string>> = {};
        const payload: { examinee_id: string; kitab_id: string; obtained_marks: number | null; status: MarkStatus }[] = [];
        let hasError = false;

        for (const examinee of marksData.examinees) {
            for (const kitab of marksData.kitabs) {
                const markInfo = currentMarks[examinee.examinee_id]?.[kitab.id];
                if (!markInfo) continue;
                
                const originalMark = examinee.marks[kitab.id];
                const isChanged = markInfo.status !== (originalMark?.status || 'present') || String(markInfo.value) !== String(originalMark?.value ?? '');
                
                if (isChanged) {
                    if (markInfo.status === 'present') {
                        if (String(markInfo.value).trim() === '') continue; // Don't validate empty for auto-save
                        const numMark = Number(markInfo.value);
                        if (isNaN(numMark)) { if (!newErrors[examinee.examinee_id]) newErrors[examinee.examinee_id] = {}; newErrors[examinee.examinee_id][kitab.id] = 'অবৈধ'; hasError = true; } 
                        else if (numMark < 0 || numMark > kitab.full_marks) { if (!newErrors[examinee.examinee_id]) newErrors[examinee.examinee_id] = {}; newErrors[examinee.examinee_id][kitab.id] = `০-${kitab.full_marks}`; hasError = true; } 
                        else { payload.push({ examinee_id: examinee.examinee_id, kitab_id: kitab.id, obtained_marks: numMark, status: 'present' }); }
                    } else {
                        payload.push({ examinee_id: examinee.examinee_id, kitab_id: kitab.id, obtained_marks: null, status: markInfo.status });
                    }
                }
            }
        }

        setErrors(newErrors);
        if (hasError) { addToast('কিছু নম্বরের ক্ষেত্রে ত্রুটি রয়েছে।', 'error'); setSaveStatus('error'); return null; }
        return payload;
    }, [marksData, addToast]);

    const debouncedSave = useDebouncedCallback(() => {
        const payload = validateAndPreparePayloadForMarkaz(marksInputRef.current);
        if (payload && payload.length > 0) saveMutation.mutate({ p_exam_id: selectedExamId, p_marks_payload: payload });
        else setSaveStatus('idle');
    }, 2000);

    const handleMarkUpdate = (examineeId: string, kitabId: string, update: Partial<{ value: number | string; status: MarkStatus }>) => {
      setSaveStatus('idle');
      setMarksInput(prev => ({ ...prev, [examineeId]: { ...(prev[examineeId] || {}), [kitabId]: { ...(prev[examineeId]?.[kitabId] || { value: '', status: 'present' }), ...update } } }));
      if (errors[examineeId]?.[kitabId]) { setErrors(prev => { const newErrors = { ...prev }; if (newErrors[examineeId]) { delete newErrors[examineeId][kitabId]; if (Object.keys(newErrors[examineeId]).length === 0) delete newErrors[examineeId]; } return newErrors; }); }
      debouncedSave();
    };

    const handleManualSave = () => {
        const payload = validateAndPreparePayloadForMarkaz(marksInput);
        if (payload && payload.length > 0) saveMutation.mutate({ p_exam_id: selectedExamId, p_marks_payload: payload });
        else addToast('সংরক্ষণের জন্য কোনো পরিবর্তন করা হয়নি।', 'info');
    };

    const paginatedExaminees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return marksData?.examinees.slice(startIndex, startIndex + itemsPerPage) || [];
    }, [currentPage, marksData, itemsPerPage]);

    return (
        <Card>
            <div className="p-4 border-b space-y-4">
                <MarkazFilters 
                    selectedExamId={selectedExamId}
                    setSelectedExamId={setSelectedExamId}
                    selectedMarkazId={selectedMarkazId}
                    setSelectedMarkazId={setSelectedMarkazId}
                    selectedMarhalaId={selectedMarhalaId}
                    setSelectedMarhalaId={setSelectedMarhalaId}
                    exams={exams}
                    isLoadingExams={isLoadingExams}
                    markazes={markazes}
                    isLoadingMarkazes={isLoadingMarkazes}
                    marhalas={marhalas}
                    isLoadingMarhalas={isLoadingMarhalas}
                />
                <SaveStatusIndicator status={saveStatus} />
            </div>
            {isLoadingGridData ? <div className="p-8 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline mr-2" /> ডেটা লোড হচ্ছে...</div> : !marksData || marksData.examinees.length === 0 ? <div className="p-8 text-center text-gray-500">অনুগ্রহ করে ফিল্টার নির্বাচন করুন অথবা এই ফিল্টারে কোনো পরীক্ষার্থী নেই।</div> : (
                <>
                <MarkazMarksGrid 
                    marksData={marksData}
                    paginatedExaminees={paginatedExaminees}
                    marksInput={marksInput}
                    errors={errors}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    saveStatus={saveStatus}
                    onMarkUpdate={handleMarkUpdate}
                />
                <div className="p-3 border-t flex justify-between items-center">
                    <Button onClick={handleManualSave} disabled={saveMutation.isPending} leftIcon={saveMutation.isPending ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <CheckCircleIcon className="w-5 h-5"/>}>{saveMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'সকল পরিবর্তন সংরক্ষণ করুন'}</Button>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>পূর্ববর্তী</Button>
                        <span>পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} / {Math.ceil((marksData?.examinees.length || 0) / itemsPerPage).toLocaleString('bn-BD')}</span>
                        <Button onClick={() => setCurrentPage(p => Math.min(Math.ceil((marksData?.examinees.length || 0) / itemsPerPage), p+1))} disabled={currentPage * itemsPerPage >= (marksData?.examinees.length || 0)}>পরবর্তী</Button>
                    </div>
                </div>
                </>
            )}
        </Card>
    );
};
