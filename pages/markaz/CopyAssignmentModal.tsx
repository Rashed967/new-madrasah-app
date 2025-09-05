import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Exam, SelectOption } from '../../types';
import { DocumentDuplicateIcon } from '../../components/ui/Icon';

interface CopyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  allExams: Exam[];
  onCopy: (sourceExamId: string, targetExamId: string) => void;
  isLoading: boolean;
}

export const CopyAssignmentModal: React.FC<CopyAssignmentModalProps> = ({
  isOpen,
  onClose,
  allExams,
  onCopy,
  isLoading,
}) => {
  const [selectedSourceExamId, setSelectedSourceExamId] = useState<string>('');
  const [selectedTargetExamId, setSelectedTargetExamId] = useState<string>('');

  const examOptions: SelectOption[] = useMemo(() => {
    return allExams.map(exam => ({ value: exam.id, label: exam.name }));
  }, [allExams]);

  const sourceExamFilteredOptions: SelectOption[] = useMemo(() => {
    return examOptions.filter(option => option.value !== selectedTargetExamId);
  }, [examOptions, selectedTargetExamId]);

  const targetExamFilteredOptions: SelectOption[] = useMemo(() => {
    return examOptions.filter(option => option.value !== selectedSourceExamId);
  }, [examOptions, selectedSourceExamId]);
  
  useEffect(() => {
    // Reset selections when modal is opened or allExams change
    if (isOpen) {
        setSelectedSourceExamId('');
        setSelectedTargetExamId('');
    }
  }, [isOpen, allExams]);


  const handleConfirmCopy = () => {
    if (selectedSourceExamId && selectedTargetExamId && selectedSourceExamId !== selectedTargetExamId) {
      onCopy(selectedSourceExamId, selectedTargetExamId);
    }
  };

  const canCopy = selectedSourceExamId && selectedTargetExamId && selectedSourceExamId !== selectedTargetExamId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="পরীক্ষার এসাইনমেন্ট কপি করুন"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            বাতিল
          </Button>
          <Button
            onClick={handleConfirmCopy}
            disabled={!canCopy || isLoading}
            leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
          >
            {isLoading ? 'কপি করা হচ্ছে...' : 'কপি করুন'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          একটি উৎস পরীক্ষা এবং একটি লক্ষ্য পরীক্ষা নির্বাচন করুন। উৎস পরীক্ষার সকল মারকায এসাইনমেন্ট লক্ষ্য পরীক্ষায় কপি করা হবে।
        </p>
        <Select
          label="উৎস পরীক্ষা (যেখান থেকে কপি হবে)"
          value={selectedSourceExamId}
          onChange={(e) => setSelectedSourceExamId(e.target.value)}
          options={sourceExamFilteredOptions}
          placeholderOption="-- উৎস পরীক্ষা নির্বাচন করুন --"
          required
          disabled={isLoading}
        />
        <Select
          label="লক্ষ্য পরীক্ষা (যেখানে কপি হবে)"
          value={selectedTargetExamId}
          onChange={(e) => setSelectedTargetExamId(e.target.value)}
          options={targetExamFilteredOptions}
          placeholderOption="-- লক্ষ্য পরীক্ষা নির্বাচন করুন --"
          required
          disabled={isLoading}
        />
        {selectedSourceExamId && selectedTargetExamId && selectedSourceExamId === selectedTargetExamId && (
            <p className="text-xs text-red-500">উৎস এবং লক্ষ্য পরীক্ষা একই হতে পারবে না।</p>
        )}
         <p className="text-xs text-gray-500 mt-2">
            লক্ষ্য করুন: শুধুমাত্র সক্রিয় মারকায, মাদরাসা এবং ঐ মাদরাসার জন্য বৈধ মারহালাগুলোর এসাইনমেন্ট কপি করা হবে। যদি কোনো মাদরাসা-মারহালা লক্ষ্য পরীক্ষায় ইতিমধ্যে অন্য কোনো মারকাযে এসাইন করা থাকে, সেটি এড়িয়ে যাওয়া হবে।
          </p>
      </div>
    </Modal>
  );
};
