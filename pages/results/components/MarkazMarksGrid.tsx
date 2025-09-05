import React, { useRef, useEffect } from 'react';
import { MarkazEntryData, MarkStatus } from '../../../types';
import { MarkInputControl } from './MarkInputControl';

interface MarkazMarksGridProps {
    marksData: MarkazEntryData;
    paginatedExaminees: MarkazEntryData['examinees'];
    marksInput: Record<string, Record<string, { value: number | string; status: MarkStatus }>>;
    errors: Record<string, Record<string, string>>;
    currentPage: number;
    itemsPerPage: number;
    saveStatus: string;
    onMarkUpdate: (examineeId: string, kitabId: string, update: Partial<{ value: number | string; status: MarkStatus }>) => void;
}

export const MarkazMarksGrid: React.FC<MarkazMarksGridProps> = ({
    marksData,
    paginatedExaminees,
    marksInput,
    errors,
    currentPage,
    itemsPerPage,
    saveStatus,
    onMarkUpdate,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const focusedInputIndexRef = useRef<number | null>(null);
    const numberOfColumns = marksData.kitabs.length;

    useEffect(() => {
        if (focusedInputIndexRef.current !== null) {
            const inputToFocus = inputRefs.current[focusedInputIndexRef.current];
            if (inputToFocus) {
                inputToFocus.focus();
                inputToFocus.select();
            }
        }
    }, [paginatedExaminees]); // Re-run when data changes

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
        <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10"><tr>
                    <th className="px-2 py-2 border sticky left-0 bg-gray-100 z-20 text-gray-800">ক্রমিক</th>
                    <th className="px-2 py-2 border sticky left-12 bg-gray-100 z-20 min-w-[70px] text-gray-800">রোল নং</th>
                    <th className="px-3 py-2 border sticky left-32 bg-gray-100 z-20 min-w-[200px] text-right text-gray-800">নাম</th>
                    {marksData.kitabs.map(kitab => (<th key={kitab.id} className="px-2 py-2 border min-w-[120px] text-center text-gray-800">{kitab.name_bn}<br/><span className="text-xs font-normal text-gray-500">(পূর্ণ: {kitab.full_marks.toLocaleString('bn-BD')})</span></th>))}
                </tr></thead>
                <tbody>{paginatedExaminees.map((examinee, rowIndex) => (
                    <tr key={examinee.examinee_id} className="hover:bg-gray-50">
                        <td className="px-2 py-1 border sticky left-0 bg-white z-10 text-center text-gray-900">{(rowIndex + 1 + (currentPage - 1) * itemsPerPage).toLocaleString('bn-BD')}</td>
                        <td className="px-2 py-1 border sticky left-12 bg-white z-10 text-center font-medium text-gray-900">{examinee.roll_number.toLocaleString('bn-BD')}</td>
                        <td className="px-3 py-1 border sticky left-32 bg-white z-10 text-right text-gray-900">{examinee.name_bn}</td>
                        {marksData.kitabs.map((kitab, colIndex) => {
                            const errorMsg = errors[examinee.examinee_id]?.[kitab.id];
                            const markInfo = marksInput[examinee.examinee_id]?.[kitab.id] || { value: '', status: 'present' };
                            const inputIndex = rowIndex * numberOfColumns + colIndex;
                            return (
                            <td key={kitab.id} className={`px-2 py-1 border text-center ${saveStatus === 'saving' && 'opacity-50'}`}>
                                <MarkInputControl
                                  ref={el => inputRefs.current[inputIndex] = el}
                                  value={markInfo.value}
                                  status={markInfo.status}
                                  fullMarks={kitab.full_marks}
                                  error={errorMsg}
                                  onValueChange={(value) => onMarkUpdate(examinee.examinee_id, kitab.id, { value })}
                                  onStatusChange={(status) => onMarkUpdate(examinee.examinee_id, kitab.id, { status })}
                                  disabled={saveStatus === 'saving'}
                                  onKeyDown={(e) => handleKeyDown(e, inputIndex)}
                                  onFocus={() => handleFocus(inputIndex)}
                                />
                            </td>
                        )})}
                    </tr>
                ))}</tbody>
            </table>
        </div>
    );
};
