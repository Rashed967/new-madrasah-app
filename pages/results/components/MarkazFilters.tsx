import React from 'react';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { SelectOption, SearchableSelectOption } from '../../../types';

interface MarkazFiltersProps {
    selectedExamId: string;
    setSelectedExamId: (id: string) => void;
    selectedMarkazId: string;
    setSelectedMarkazId: (id: string) => void;
    selectedMarhalaId: string;
    setSelectedMarhalaId: (id: string) => void;
    exams: SelectOption[];
    isLoadingExams: boolean;
    markazes: SearchableSelectOption[];
    isLoadingMarkazes: boolean;
    marhalas: SelectOption[];
    isLoadingMarhalas: boolean;
}

export const MarkazFilters: React.FC<MarkazFiltersProps> = ({
    selectedExamId,
    setSelectedExamId,
    selectedMarkazId,
    setSelectedMarkazId,
    selectedMarhalaId,
    setSelectedMarhalaId,
    exams,
    isLoadingExams,
    markazes,
    isLoadingMarkazes,
    marhalas,
    isLoadingMarhalas,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select label="পরীক্ষা" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} required/>
            <SearchableSelect id="markaz-select-markaz-based" label="মারকায" options={markazes} value={selectedMarkazId} onChange={setSelectedMarkazId} placeholder="মারকায নির্বাচন করুন" disabled={isLoadingMarkazes} required/>
            <Select label="মারহালা" value={selectedMarhalaId} onChange={(e) => setSelectedMarhalaId(e.target.value)} options={marhalas} placeholderOption="মারহালা নির্বাচন করুন" disabled={isLoadingMarhalas} required/>
        </div>
    );
};
