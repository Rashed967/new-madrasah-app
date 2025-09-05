import React, { useMemo } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchableSelect, SearchableSelectOption } from '../../../../components/ui/SearchableSelect';
import { Input } from '../../../../components/ui/Input';
import { UsersIcon, TrashIcon } from '../../../../components/ui/Icon';
import { ExaminerBucket, Action } from '../types';

interface DistributionPanelProps {
  examinerBuckets: ExaminerBucket[];
  selectedScriptCount: number;
  eligibleExaminers: SearchableSelectOption[];
  dispatch: React.Dispatch<Action>;
  isLoadingExaminers: boolean;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

export const DistributionPanel: React.FC<DistributionPanelProps> = React.memo(({examinerBuckets, selectedScriptCount, eligibleExaminers, dispatch, isLoadingExaminers, handleSubmit, isSubmitting}) => {
  const handleAddExaminer = (examinerId: string | null) => { if (!examinerId) return; const examiner = eligibleExaminers.find(e => e.value === examinerId); if (examiner) { dispatch({ type: 'ADD_EXAMINER_BUCKET', payload: { examinerId: examiner.value, examinerName: examiner.label.split(' (')[0], examinerCode: examiner.label.split(' (')[1]?.replace(')', '') || '', scriptCount: 0 } }); }};
  const handleRemoveExaminer = (examinerId: string) => dispatch({type: 'REMOVE_EXAMINER_BUCKET', payload: examinerId});
  const handleBucketScriptCountChange = (examinerId: string, countStr: string) => { const count = parseInt(countStr, 10); dispatch({type: 'UPDATE_BUCKET_COUNT', payload: {examinerId, count: isNaN(count) || count < 0 ? 0 : count }}); };
  const totalAssigned = useMemo(() => examinerBuckets.reduce((sum, b) => sum + b.scriptCount, 0), [examinerBuckets]);
  const progress = selectedScriptCount > 0 ? (totalAssigned / selectedScriptCount) * 100 : 0;
  
  return (
    <div className="col-span-12 lg:col-span-5"><Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-800 flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-emerald-600"/>পরীক্ষক বন্টন</h3></div>
      <div className="p-4 space-y-4">
        <SearchableSelect id="examiner-select" label="পরীক্ষক যোগ করুন" options={eligibleExaminers} value={null} onChange={handleAddExaminer} placeholder="পরীক্ষক খুঁজুন..." disabled={isLoadingExaminers} />
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {examinerBuckets.map(bucket => (
            <div key={bucket.examinerId} className="p-2 border rounded-md">
              <div className="flex justify-between items-start"><p className="text-sm font-semibold">{bucket.examinerName} <span className="text-xs text-gray-500">({bucket.examinerCode})</span></p><Button variant="ghost" size="sm" onClick={() => handleRemoveExaminer(bucket.examinerId)} className="p-0.5 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></Button></div>
              <Input label="খাতার সংখ্যা" type="number" value={bucket.scriptCount.toString()} onChange={e => handleBucketScriptCountChange(bucket.examinerId, e.target.value)} wrapperClassName="mb-0 flex-grow" className="h-8 text-sm" />
            </div>
          ))}
        </div>
        <div className="pt-2 border-t text-sm font-semibold text-center space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">মোট নির্বাচিত: {selectedScriptCount.toLocaleString('bn-BD')}</span>
              <span className={`font-bold ${totalAssigned !== selectedScriptCount ? 'text-red-500' : 'text-green-600'}`}>বন্টিত: {totalAssigned.toLocaleString('bn-BD')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => dispatch({type: 'DISTRIBUTE_EVENLY'})} disabled={examinerBuckets.length === 0 || selectedScriptCount === 0}>সুষম বন্টন</Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => dispatch({type: 'RESET_ASSIGNMENT'})}>রিসেট করুন</Button>
            </div>
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting || selectedScriptCount === 0 || totalAssigned !== selectedScriptCount}>
          {isSubmitting ? 'বন্টন করা হচ্ছে...' : 'বন্টন সম্পন্ন করুন'}
        </Button>
      </div>
    </Card></div>
  );
});

DistributionPanel.displayName = 'DistributionPanel';
