import React from 'react';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { SelectOption } from '../../../types';

interface AssignmentFiltersProps {
  selectedExamId: string;
  onExamChange: (id: string) => void;
  examOptions: SelectOption[];
  isLoadingExams: boolean;
  selectedMarkazId: string;
  onMarkazChange: (id: string) => void;
  markazOptions: SelectOption[];
  isLoadingMarkazes: boolean;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  selectedExamId,
  onExamChange,
  examOptions,
  isLoadingExams,
  selectedMarkazId,
  onMarkazChange,
  markazOptions,
  isLoadingMarkazes,
}) => {
  return (
    <Card title="পরীক্ষা ও মারকায নির্বাচন করুন">
      <div className="grid grid-cols-1 gap-4 items-end">
        <Select
          label="পরীক্ষা (লক্ষ্য)"
          value={selectedExamId}
          onChange={(e) => onExamChange(e.target.value)}
          options={examOptions}
          placeholderOption="পরীক্ষা নির্বাচন করুন"
          disabled={isLoadingExams}
          required
        />
        <Select
          label="মারকায"
          value={selectedMarkazId}
          onChange={(e) => onMarkazChange(e.target.value)}
          options={markazOptions}
          placeholderOption="মারকায নির্বাচন করুন"
          disabled={isLoadingMarkazes || !selectedExamId}
          required
        />
      </div>
    </Card>
  );
};
