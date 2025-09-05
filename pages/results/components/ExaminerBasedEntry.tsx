import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Exam, Teacher, MarkForEntry, MarkStatus, Mark } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { ArrowPathIcon, CheckCircleIcon, DocumentChartBarIcon } from '../../../components/ui/Icon';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { mapDbRowToTeacher } from '../utils/mappers';
import { ExaminerFilters } from './ExaminerFilters';
import { AssignedSubjectList, AssignedSubject } from './AssignedSubjectList';
import { ExaminerMarksTable } from './ExaminerMarksTable';
import { SaveStatus, SaveStatusIndicator } from './SaveStatusIndicator';

export const ExaminerBasedEntry: React.FC = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedExaminerId, setSelectedExaminerId] = useState<string>('');
    const [selectedKitab, setSelectedKitab] = useState<AssignedSubject | null>(null);
    const [marks, setMarks] = useState<Record<string, { value: number | string; status: MarkStatus }>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const marksRef = useRef(marks);
    marksRef.current = marks;
    
    const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({ queryKey: ['examsForMarksEntry'], queryFn: async () => { const { data, error } = await supabase.rpc('get_exams_for_script_distribution'); if (error) throw error; return data || []; } });
    const { data: examiners = [], isLoading: isLoadingExaminers } = useQuery<Teacher[], Error>({ queryKey: ['examinersForMarksEntry', selectedExamId], queryFn: async () => { if (!selectedExamId) return []; const { data, error } = await supabase.rpc('get_examiners_for_exam', { p_exam_id: selectedExamId }); if (error) throw error; return (data || []).map(mapDbRowToTeacher); }, enabled: !!selectedExamId });
    const { data: subjects = [], isLoading: isLoadingSubjects, refetch: refetchSubjects } = useQuery<AssignedSubject[], Error>({ queryKey: ['assignedSubjects', selectedExamId, selectedExaminerId], queryFn: async () => { if (!selectedExamId || !selectedExaminerId) return []; const { data, error } = await supabase.rpc('get_assigned_subjects_for_examiner', { p_exam_id: selectedExamId, p_examiner_id: selectedExaminerId }); if (error) throw error; return data || []; }, enabled: !!selectedExamId && !!selectedExaminerId });
    
    const { data: examineesForEntry = [], isLoading: isLoadingExaminees } = useQuery<MarkForEntry[], Error>({
        queryKey: ['examineesForSubject', selectedKitab?.kitab_id],
        queryFn: async () => {
            if (!selectedKitab) return [];
            const { data, error } = await supabase.rpc('get_examinees_for_marks_entry_by_subject', { p_exam_id: selectedExamId, p_examiner_id: selectedExaminerId, p_kitab_id: selectedKitab.kitab_id });
            if (error) throw error;
            const examinees = data || [];
            const examineeIds = examinees.map((ex: MarkForEntry) => ex.examinee_id);
            if (examineeIds.length > 0) {
                const { data: marksData, error: marksError } = await supabase.from('marks').select('examinee_id, obtained_marks, status').eq('exam_id', selectedExamId).eq('kitab_id', selectedKitab.kitab_id).in('examinee_id', examineeIds);
                if (marksError) throw marksError;
                const marksMap: Record<string, { value: number | string; status: MarkStatus }> = {};
                examinees.forEach((ex: MarkForEntry) => { 
                    const foundMark = marksData.find(m => m.examinee_id === ex.examinee_id);
                    marksMap[ex.examinee_id] = { value: foundMark?.obtained_marks ?? '', status: (foundMark?.status as MarkStatus) || 'present' };
                });
                setMarks(marksMap);
            } else {
                setMarks({});
            }
            return examinees;
        },
        enabled: !!selectedKitab,
    });

    useEffect(() => {
        if (!selectedKitab || !selectedExamId) return;
        const channel = supabase.channel(`marks-changes-for-kitab-${selectedKitab.kitab_id}`);
        const subscription = channel.on<Mark>('postgres_changes', { event: '*', schema: 'public', table: 'marks', filter: `kitab_id=eq.${selectedKitab.kitab_id}` }, (payload) => {
            const updatedMark = payload.new as Mark;
            if (updatedMark && updatedMark.examinee_id && examineesForEntry.some(ex => ex.examinee_id === updatedMark.examinee_id)) {
                setMarks(prev => ({ ...prev, [updatedMark.examinee_id]: { value: updatedMark.obtained_marks ?? '', status: (updatedMark.status as MarkStatus) || 'present' } }));
                refetchSubjects();
            }
        }).subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') addToast(`Real-time সংযোগে ত্রুটি হয়েছে।`, 'error');
        });
        return () => { supabase.removeChannel(channel); };
    }, [selectedKitab, selectedExamId, examineesForEntry, refetchSubjects, addToast]);

    const saveMarksMutation = useMutation({
        mutationFn: async (payload: any[]) => {
            if (payload.length === 0) { setSaveStatus('idle'); return; }
            setSaveStatus('saving');
            const { data, error } = await supabase.rpc('save_marks_bulk', { p_marks_data: payload });
            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => { if(data) { addToast(`${(data.upserted_count || 0).toLocaleString('bn-BD')} টি নম্বর সফলভাবে সংরক্ষণ করা হয়েছে।`, 'success'); refetchSubjects(); setSaveStatus('success'); }},
        onError: (error: PostgrestError | Error) => { addToast(`নম্বর সংরক্ষণে ত্রুটি: ${error.message}`, 'error'); setSaveStatus('error'); },
    });

    const validateAndPreparePayload = useCallback((currentMarks: typeof marks) => {
        if (!selectedKitab || examineesForEntry.length === 0) return null;
        const newErrors: Record<string, string> = {};
        const marksToSave: any[] = [];
        let hasError = false;

        for (const examinee of examineesForEntry) {
            const markInfo = currentMarks[examinee.examinee_id];
            if (!markInfo) continue;

            if (markInfo.status === 'present') {
                const markValue = markInfo.value;
                if (markValue === '' || markValue === undefined || markValue === null) continue; // Don't validate empty fields for auto-save
                const numMark = Number(markValue);
                if (isNaN(numMark)) { newErrors[examinee.examinee_id] = 'অবৈধ নম্বর'; hasError = true; } 
                else if (numMark < 0) { newErrors[examinee.examinee_id] = 'ঋণাত্মক নয়'; hasError = true; } 
                else if (numMark > selectedKitab.full_marks) { newErrors[examinee.examinee_id] = `${selectedKitab.full_marks.toLocaleString('bn-BD')} এর বেশি নয়`; hasError = true; }
                else { marksToSave.push({ p_examinee_id: examinee.examinee_id, p_exam_id: selectedExamId, p_kitab_id: selectedKitab.kitab_id, p_obtained_marks: numMark, p_status: 'present', p_examiner_id: selectedExaminerId }); }
            } else {
                marksToSave.push({ p_examinee_id: examinee.examinee_id, p_exam_id: selectedExamId, p_kitab_id: selectedKitab.kitab_id, p_obtained_marks: null, p_status: markInfo.status, p_examiner_id: selectedExaminerId });
            }
        }
        setErrors(newErrors);
        if (hasError) {
            addToast('কিছু নম্বরের ক্ষেত্রে ত্রুটি রয়েছে।', 'error');
            setSaveStatus('error');
            return null;
        }
        return marksToSave;
    }, [selectedKitab, examineesForEntry, selectedExamId, selectedExaminerId, addToast]);

    const debouncedSave = useDebouncedCallback(() => {
        const payload = validateAndPreparePayload(marksRef.current);
        if (payload) saveMarksMutation.mutate(payload);
    }, 1500);

    const handleMarkUpdate = (examineeId: string, update: Partial<{ value: number | string; status: MarkStatus }>) => {
        setSaveStatus('idle');
        const newMarks = { ...marks, [examineeId]: { ...(marks[examineeId] || { value: '', status: 'present' }), ...update } };
        setMarks(newMarks);
        if (errors[examineeId]) { setErrors(prev => { const newErrors = { ...prev }; delete newErrors[examineeId]; return newErrors; }); }
        debouncedSave();
    };
    
    const handleManualSave = () => {
        const payload = validateAndPreparePayload(marks);
        if (payload) saveMarksMutation.mutate(payload);
    };

    const handleSelectSubject = (subject: AssignedSubject) => {
        setSelectedKitab(subject);
        setMarks({});
        setErrors({});
        setSaveStatus('idle');
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <ExaminerFilters 
                    selectedExamId={selectedExamId}
                    setSelectedExamId={setSelectedExamId}
                    selectedExaminerId={selectedExaminerId}
                    setSelectedExaminerId={setSelectedExaminerId}
                    exams={exams}
                    isLoadingExams={isLoadingExams}
                    examiners={examiners}
                    isLoadingExaminers={isLoadingExaminers}
                    setSelectedKitab={setSelectedKitab}
                />
                {selectedExaminerId && (
                    <AssignedSubjectList 
                        subjects={subjects}
                        isLoading={isLoadingSubjects}
                        selectedKitab={selectedKitab}
                        onSelectSubject={handleSelectSubject}
                    />
                )}
            </div>
            <div className="lg:col-span-7 xl:col-span-8">
                {selectedKitab ? (
                    <Card>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-700">নম্বর ইনপুট করুন (পূর্ণ নম্বর: {selectedKitab.full_marks.toLocaleString('bn-BD')})</h3>
                            <Button onClick={handleManualSave} disabled={saveMarksMutation.isPending} leftIcon={saveMarksMutation.isPending ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <CheckCircleIcon className="w-5 h-5"/>}> {saveMarksMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'এখনই সংরক্ষণ করুন'} </Button>
                        </div>
                        <SaveStatusIndicator status={saveStatus} />
                        <ExaminerMarksTable 
                            isLoading={isLoadingExaminees}
                            examinees={examineesForEntry}
                            marks={marks}
                            errors={errors}
                            fullMarks={selectedKitab.full_marks}
                            onMarkUpdate={handleMarkUpdate}
                        />
                    </Card>
                ) : (
                    <Card className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center text-gray-500">
                            <DocumentChartBarIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <p className="mt-4 text-lg">নম্বর এন্ট্রি করতে বাম পাশ থেকে একটি ব্যাচ নির্বাচন করুন।</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
