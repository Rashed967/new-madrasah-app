import React, { useRef, useEffect } from 'react';
import { MarkForEntry, MarkStatus } from '../../../types';
import { MarkInputControl } from './MarkInputControl';
import { ArrowPathIcon } from '../../../components/ui/Icon';

interface ExaminerMarksTableProps {
    isLoading: boolean;
    examinees: MarkForEntry[];
    marks: Record<string, { value: number | string; status: MarkStatus }>;
    errors: Record<string, string>;
    fullMarks: number;
    onMarkUpdate: (examineeId: string, update: Partial<{ value: number | string; status: MarkStatus }>) => void;
}

export const ExaminerMarksTable: React.FC<ExaminerMarksTableProps> = ({
    isLoading,
    examinees,
    marks,
    errors,
    fullMarks,
    onMarkUpdate,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const focusedInputIndexRef = useRef<number | null>(null);

    useEffect(() => {
        if (focusedInputIndexRef.current !== null) {
            const inputToFocus = inputRefs.current[focusedInputIndexRef.current];
            if (inputToFocus) {
                inputToFocus.focus();
                inputToFocus.select();
            }
        }
    }, [examinees]); // Re-run when data changes

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

    if (isLoading) {
        return <div className="p-8 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline mr-2" /> পরীক্ষার্থী তালিকা লোড হচ্ছে...</div>;
    }

    if (examinees.length === 0) {
        return <p className="p-6 text-center text-gray-500">এই ব্যাচের জন্য কোনো পরীক্ষার্থী পাওয়া যায়নি।</p>;
    }

    return (
        <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ক্রমিক</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">রোল নং</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">নাম</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">প্রাপ্ত নম্বর</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {examinees.map((ex, index) => (
                        <tr key={ex.examinee_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{(index + 1).toLocaleString('bn-BD')}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800 text-right">{ex.roll_number.toLocaleString('bn-BD')}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{ex.name_bn}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                <MarkInputControl
                                    ref={el => inputRefs.current[index] = el}
                                    value={marks[ex.examinee_id]?.value || ''}
                                    status={marks[ex.examinee_id]?.status || 'present'}
                                    fullMarks={fullMarks}
                                    error={errors[ex.examinee_id]}
                                    onValueChange={(value) => onMarkUpdate(ex.examinee_id, { value })}
                                    onStatusChange={(status) => onMarkUpdate(ex.examinee_id, { status })}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onFocus={() => handleFocus(index)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
