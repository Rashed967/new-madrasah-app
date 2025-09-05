import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { MarhalaGroup } from './RollNumberBasedEntry';
import { MarkInputControl } from './MarkInputControl';
import { MarkStatus } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { SaveStatus, SaveStatusIndicator } from './SaveStatusIndicator';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { ArrowPathIcon, CheckCircleIcon } from '../../../components/ui/Icon';

interface MarhalaWiseMarksEntryProps {
    group: MarhalaGroup;
}

export const MarhalaWiseMarksEntry: React.FC<MarhalaWiseMarksEntryProps> = ({ group }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [marksInput, setMarksInput] = useState<Record<string, Record<string, { value: number | string; status: MarkStatus }>>>({});
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const focusedInputIndexRef = useRef<number | null>(null);
    const marksInputRef = useRef(marksInput);
    marksInputRef.current = marksInput;

    useEffect(() => {
        const initialMarks: Record<string, Record<string, { value: number | string; status: MarkStatus }>> = {};
        group.examinees.forEach(ex => {
            initialMarks[ex.id] = {};
            let marks = ex.marks;
            if (typeof marks === 'string') {
                try {
                    marks = JSON.parse(marks);
                } catch (e) {
                    console.error("Failed to parse marks JSON:", e);
                    marks = {};
                }
            }
            if (typeof marks !== 'object' || marks === null) {
                marks = {};
            }

            if (Array.isArray(group.kitabs)) {
                group.kitabs.forEach(kitab => {
                    const markInfo = marks[kitab.id];
                    initialMarks[ex.id][kitab.id] = {
                        value: markInfo?.value ?? '',
                        status: markInfo?.status || 'present'
                    };
                });
            }
        });
        setMarksInput(initialMarks);
    }, [group]);
    
    useEffect(() => {
        if (focusedInputIndexRef.current !== null) {
            const inputToFocus = inputRefs.current[focusedInputIndexRef.current];
            if (inputToFocus) {
                inputToFocus.focus();
                inputToFocus.select();
            }
        }
    }, [group.examinees]);

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (!payload || payload.p_marks_payload.length === 0) {
                setSaveStatus('idle');
                return;
            }
            setSaveStatus('saving');
            const { error } = await supabase.rpc('save_marks_for_markaz_entry_bulk', payload);
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('নম্বর সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
            queryClient.invalidateQueries({ queryKey: ['examineesByRoll'] });
            setSaveStatus('success');
        },
        onError: (error: any) => {
            addToast(`সংরক্ষণে ত্রুটি: ${error.message}`, 'error');
            setSaveStatus('error');
        }
    });

    const validateAndPreparePayload = useCallback((currentMarks: typeof marksInput) => {
        if (!group) return null;
        const newErrors: Record<string, Record<string, string>> = {};
        const payload: { examinee_id: string; kitab_id: string; obtained_marks: number | null; status: MarkStatus }[] = [];
        let hasError = false;

        for (const examinee of group.examinees) {
            for (const kitab of group.kitabs) {
                const markInfo = currentMarks[examinee.id]?.[kitab.id];
                if (!markInfo) continue;
                
                const originalMark = examinee.marks[kitab.id];
                const isChanged = markInfo.status !== (originalMark?.status || 'present') || String(markInfo.value) !== String(originalMark?.value ?? '');
                
                if (isChanged) {
                    if (markInfo.status === 'present') {
                        if (String(markInfo.value).trim() === '') continue;
                        const numMark = Number(markInfo.value);
                        if (isNaN(numMark)) { if (!newErrors[examinee.id]) newErrors[examinee.id] = {}; newErrors[examinee.id][kitab.id] = 'অবৈধ'; hasError = true; } 
                        else if (numMark < 0 || numMark > kitab.full_marks) { if (!newErrors[examinee.id]) newErrors[examinee.id] = {}; newErrors[examinee.id][kitab.id] = `۰-${kitab.full_marks}`; hasError = true; } 
                        else { payload.push({ examinee_id: examinee.id, kitab_id: kitab.id, obtained_marks: numMark, status: 'present' }); }
                    } else {
                        payload.push({ examinee_id: examinee.id, kitab_id: kitab.id, obtained_marks: null, status: markInfo.status });
                    }
                }
            }
        }

        setErrors(newErrors);
        if (hasError) { addToast('কিছু নম্বরের ক্ষেত্রে ত্রুটি রয়েছে।', 'error'); setSaveStatus('error'); return null; }
        return payload;
    }, [group, addToast]);

    const debouncedSave = useDebouncedCallback(() => {
        const payload = validateAndPreparePayload(marksInputRef.current);
        if (payload && payload.length > 0) saveMutation.mutate({ p_exam_id: group.examinees[0]?.exam_id, p_marks_payload: payload });
        else setSaveStatus('idle');
    }, 2000);

    const handleMarkUpdate = (examineeId: string, kitabId: string, update: Partial<{ value: number | string; status: MarkStatus }>) => {
        setSaveStatus('idle');
        setMarksInput(prev => ({ ...prev, [examineeId]: { ...(prev[examineeId] || {}), [kitabId]: { ...(prev[examineeId]?.[kitabId] || { value: '', status: 'present' }), ...update } } }));
        if (errors[examineeId]?.[kitabId]) { setErrors(prev => { const newErrors = { ...prev }; if (newErrors[examineeId]) { delete newErrors[examineeId][kitabId]; if (Object.keys(newErrors[examineeId]).length === 0) delete newErrors[examineeId]; } return newErrors; }); }
        debouncedSave();
    };
    
    const handleManualSave = () => {
        const payload = validateAndPreparePayload(marksInput);
        if (payload && payload.length > 0) saveMutation.mutate({ p_exam_id: group.examinees[0]?.exam_id, p_marks_payload: payload });
        else addToast('সংরক্ষণের জন্য কোনো পরিবর্তন করা হয়নি।', 'info');
    };

    const handleFocus = (index: number) => {
        focusedInputIndexRef.current = index;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    return (
        <Card title={`মারহালা: ${group.marhala_name}`}>
            <div className="p-4 border-b flex justify-between items-center">
                <SaveStatusIndicator status={saveStatus} />
                <Button onClick={handleManualSave} disabled={saveMutation.isPending} leftIcon={saveMutation.isPending ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <CheckCircleIcon className="w-5 h-5"/>}>
                    {saveMutation.isPending ? 'সংরক্ষণ করা হচ্ছে...' : 'এখনই সংরক্ষণ করুন'}
                </Button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-2 py-2 border sticky left-0 bg-gray-100 z-20 text-gray-800 w-20">রোল নং</th>
                            <th className="px-3 py-2 border sticky left-20 bg-gray-100 z-20 w-60 text-right text-gray-800">নাম</th>
                            {group.kitabs.map(kitab => (
                                <th key={kitab.id} className="px-2 py-2 border min-w-[120px] text-center text-gray-800">
                                    {kitab.name_bn}<br/>
                                    <span className="text-xs font-normal text-gray-500">
                                        (পূর্ণ: {kitab.full_marks.toLocaleString('bn-BD')})
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {group.examinees.map((examinee, rowIndex) => (
                            <tr key={examinee.id} className="hover:bg-gray-50">
                                <td className="px-2 py-1 border sticky left-0 bg-white z-10 text-center font-medium text-gray-900 w-20">
                                    {examinee.roll_number.toLocaleString('bn-BD')}
                                </td>
                                <td className="px-3 py-1 border sticky left-20 bg-white z-10 text-right text-gray-900 w-60">
                                    {examinee.name_bn}
                                </td>
                                {group.kitabs.map((kitab, colIndex) => {
                                    const markInfo = marksInput[examinee.id]?.[kitab.id] || { value: '', status: 'present' };
                                    const inputIndex = rowIndex * group.kitabs.length + colIndex;
                                    const errorMsg = errors[examinee.id]?.[kitab.id];
                                    return (
                                        <td key={kitab.id} className="px-2 py-1 border text-center" style={{ minWidth: '140px' }}>
                                            <MarkInputControl
                                                ref={el => inputRefs.current[inputIndex] = el}
                                                value={markInfo.value}
                                                status={markInfo.status}
                                                fullMarks={kitab.full_marks}
                                                error={errorMsg}
                                                onValueChange={(value) => handleMarkUpdate(examinee.id, kitab.id, { value })}
                                                onStatusChange={(status) => handleMarkUpdate(examinee.id, kitab.id, { status })}
                                                disabled={saveStatus === 'saving'}
                                                onKeyDown={(e) => handleKeyDown(e, inputIndex)}
                                                onFocus={() => handleFocus(inputIndex)}
                                            />
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};