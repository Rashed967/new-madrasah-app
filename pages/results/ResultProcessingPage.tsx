import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Exam, SelectOption, ResultProcessingStatusItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowPathIcon, CheckCircleIcon, Cog6ToothIcon, ExclamationTriangleIcon } from '../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

const ResultProcessingPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Fetch exams that are ready for result processing
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({
    queryKey: ['examsForResultProcessing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'completed')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  // Fetch the processing status for the selected exam
  const { data: processingStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery<ResultProcessingStatusItem[], Error>({
    queryKey: ['resultProcessingStatus', selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const { data, error } = await supabase.rpc('get_result_processing_status', { p_exam_id: selectedExamId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedExamId,
  });

  const isAllMarksEntered = useMemo(() => {
    if (!processingStatus || processingStatus.length === 0) return false;
    return processingStatus.every(item => item.is_complete);
  }, [processingStatus]);

  const processResultsMutation = useMutation({
    mutationFn: async (examId: string) => {
      const { data, error } = await supabase.rpc('process_exam_results', { p_exam_id: examId });
      if (error) throw error;
      if (!(data as any).success) {
        throw new Error((data as any).message || 'ফলাফল প্রস্তুত করতে একটি অজানা সমস্যা হয়েছে।');
      }
      return data;
    },
    onSuccess: (data) => {
      addToast((data as any).message || 'ফলাফল সফলভাবে প্রস্তুত করা হয়েছে!', 'success');
      queryClient.invalidateQueries({ queryKey: ['resultProcessingStatus', selectedExamId] });
      queryClient.invalidateQueries({ queryKey: ['examsForResultProcessing'] }); // To update exam status
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`ফলাফল প্রস্তুত করতে সমস্যা: ${error.message}`, 'error', 7000);
    }
  });

  const handleProcessResults = () => {
    if (!selectedExamId) {
      addToast('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।', 'warning');
      return;
    }
    if (!isAllMarksEntered) {
      addToast('সকল মারহালার নম্বর এন্ট্রি সম্পন্ন হয়নি।', 'error');
      return;
    }
    processResultsMutation.mutate(selectedExamId);
  };

  const examOptions: SelectOption[] = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">ফলাফল প্রস্তুতকরণ</h2>

      <Card title="পরীক্ষা নির্বাচন করুন">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="পরীক্ষা"
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            options={examOptions}
            placeholderOption="-- পরীক্ষা নির্বাচন করুন --"
            required
            disabled={isLoadingExams || processResultsMutation.isPending}
            wrapperClassName="md:col-span-2"
          />
        </div>
      </Card>

      {isLoadingStatus && selectedExamId && (
        <Card>
          <div className="flex items-center justify-center p-8">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-3" />
            <p className="text-lg text-gray-700">স্ট্যাটাস লোড হচ্ছে...</p>
          </div>
        </Card>
      )}

      {!isLoadingStatus && selectedExamId && processingStatus && (
        <Card title="নম্বর এন্ট্রির অবস্থা">
          <ul className="space-y-3">
            {processingStatus.map(item => (
              <li key={item.marhala_id} className={`p-4 border rounded-lg flex justify-between items-center ${item.is_complete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
                <div>
                  <p className="font-semibold text-gray-800">{item.marhala_name}</p>
                  <p className="text-sm text-gray-600">
                    প্রয়োজনীয় নম্বর এন্ট্রি: <span className="font-medium">{item.expected_marks_entries.toLocaleString('bn-BD')}</span> | 
                    সম্পন্ন হয়েছে: <span className="font-medium">{item.actual_marks_entries.toLocaleString('bn-BD')}</span>
                  </p>
                </div>
                {item.is_complete ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">সম্পন্ন</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-700">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">অসম্পূর্ণ</span>
                  </div>
                )}
              </li>
            ))}
            {processingStatus.length === 0 && (
                <p className="text-center text-gray-500 p-4">এই পরীক্ষার জন্য কোনো মারহালা পাওয়া যায়নি।</p>
            )}
          </ul>
        </Card>
      )}

      {selectedExamId && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleProcessResults}
            disabled={!isAllMarksEntered || processResultsMutation.isPending}
            leftIcon={processResultsMutation.isPending ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <Cog6ToothIcon className="w-5 h-5" />}
            size="lg"
            className="w-full md:w-auto"
          >
            {processResultsMutation.isPending ? 'ফলাফল প্রস্তুত করা হচ্ছে...' : 'ফলাফল প্রস্তুত করুন'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultProcessingPage;