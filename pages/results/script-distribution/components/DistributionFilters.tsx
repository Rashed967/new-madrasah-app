import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { ArrowPathIcon, ClipboardDocumentListIcon } from '../../../../components/ui/Icon';
import { Exam, Marhala, SelectOption as GlobalSelectOption } from '../../../../types';
import { Action } from '../types';

interface DistributionFiltersProps {
  selectedExamId: string;
  selectedMarhalaId: string;
  selectedKitabId: string;
  examOptions: GlobalSelectOption[];
  marhalaOptions: GlobalSelectOption[];
  kitabOptions: GlobalSelectOption[];
  isLoadingExams: boolean;
  isLoadingMarhalas: boolean;
  isLoadingKitabs: boolean;
  isFetchingScripts: boolean;
  dispatch: React.Dispatch<Action>;
  handleFetchScripts: () => void;
}

export const DistributionFilters: React.FC<DistributionFiltersProps> = React.memo((
  { selectedExamId, selectedMarhalaId, selectedKitabId, examOptions, marhalaOptions, kitabOptions,
    isLoadingExams, isLoadingMarhalas, isLoadingKitabs, isFetchingScripts, dispatch, handleFetchScripts }
) => {
  return (
    <Card title="প্রেক্ষাপট নির্বাচন">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <Select label="পরীক্ষা" value={selectedExamId} onChange={e => dispatch({type: 'SET_FILTER', payload: {filter: 'selectedExamId', value: e.target.value}})} options={examOptions} placeholderOption="পরীক্ষা..." required />
        <Select label="মারহালা" value={selectedMarhalaId} onChange={e => dispatch({type: 'SET_FILTER', payload: {filter: 'selectedMarhalaId', value: e.target.value}})} options={marhalaOptions} placeholderOption="মারহালা..." disabled={isLoadingMarhalas || !selectedExamId} required />
        <Select label="কিতাব" value={selectedKitabId} onChange={e => dispatch({type: 'SET_FILTER', payload: {filter: 'selectedKitabId', value: e.target.value}})} options={kitabOptions} placeholderOption="কিতাব..." disabled={isLoadingKitabs || !selectedMarhalaId} required />
        <Button onClick={handleFetchScripts} disabled={isFetchingScripts || !selectedKitabId} leftIcon={isFetchingScripts ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <ClipboardDocumentListIcon className="w-5 h-5"/>}>উত্তরপত্র খুঁজুন</Button>
      </div>
    </Card>
  );
});

DistributionFilters.displayName = 'DistributionFilters';
