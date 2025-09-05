import React from 'react';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Card } from '../../../components/ui/Card';
import { Exam, Teacher } from '../../../types';

interface ExaminerFiltersProps {
    selectedExamId: string;
    setSelectedExamId: (id: string) => void;
    selectedExaminerId: string;
    setSelectedExaminerId: (id: string) => void;
    exams: Exam[];
    isLoadingExams: boolean;
    examiners: Teacher[];
    isLoadingExaminers: boolean;
    setSelectedKitab: (kitab: any) => void;
}

export const ExaminerFilters: React.FC<ExaminerFiltersProps> = ({
    selectedExamId,
    setSelectedExamId,
    selectedExaminerId,
    setSelectedExaminerId,
    exams,
    isLoadingExams,
    examiners,
    isLoadingExaminers,
    setSelectedKitab
}) => {
    const examOptions = React.useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);
    const examinerOptions = React.useMemo(() => examiners.map(e => ({ value: e.id, label: `${e.nameBn} (${e.teacherCode})`, code: e.teacherCode })), [examiners]);

    return (
        <Card title="পরীক্ষার বিবরণ">
            <div className="grid grid-cols-1 gap-4">
                <Select 
                    label="পরীক্ষা" 
                    value={selectedExamId} 
                    onChange={e => { 
                        setSelectedExamId(e.target.value); 
                        setSelectedExaminerId(''); 
                        setSelectedKitab(null); 
                    }} 
                    options={examOptions} 
                    placeholderOption="পরীক্ষা নির্বাচন করুন..." 
                    disabled={isLoadingExams} 
                    required
                />
                <SearchableSelect 
                    id="examiner-select" 
                    label="পরীক্ষক" 
                    options={examinerOptions} 
                    value={selectedExaminerId} 
                    onChange={(value) => { 
                        setSelectedExaminerId(value || ''); 
                        setSelectedKitab(null); 
                    }} 
                    placeholder="পরীক্ষক খুঁজুন বা নির্বাচন করুন..." 
                    disabled={isLoadingExaminers || !selectedExamId} 
                    required
                />
            </div>
        </Card>
    );
};
