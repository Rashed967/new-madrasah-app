import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Exam, Marhala, Examinee, SelectOption, MarhalaApiResponse } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircleIcon, Cog6ToothIcon, ArrowPathIcon } from '../../components/ui/Icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
    id: apiMarhala.id,
    marhala_code: apiMarhala.marhala_code,
    nameBn: apiMarhala.name_bn,
    nameAr: apiMarhala.name_ar || undefined,
    type: apiMarhala.type,
    category: apiMarhala.category,
    kitabIds: apiMarhala.kitab_ids || [],
    marhala_order: apiMarhala.marhala_order,
    requiresPhoto: apiMarhala.requires_photo || false,
    createdAt: apiMarhala.created_at,
    updatedAt: apiMarhala.updated_at,
});


interface MarhalaAssignmentInfo {
  marhalaId: string;
  marhalaName: string;
  eligibleExamineeCount: number;
  assignedExamineeCount: number; // New: to track already assigned
  startingRoll: number;
  isAssignedOrNoEligible: boolean; // Combined state for UI
  assigningInProgress: boolean;
}

const RollNumberAssignmentPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [marhalaAssignmentDetails, setMarhalaAssignmentDetails] = useState<MarhalaAssignmentInfo[]>([]);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({
    queryKey: ['examsForRollAssignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, exam_marhala_fees!inner(*)') // Ensure exam_marhala_fees are fetched
        .eq('is_active', true)
        .eq('status', 'preparatory') // Only exams ready for roll assignment
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'পরীক্ষা তালিকা আনতে সমস্যা হয়েছে।');
      
      return (data || []).map(exam_db_row => ({
        id: exam_db_row.id,
        name: exam_db_row.name,
        registrationDeadline: exam_db_row.registration_deadline,
        startingRegistrationNumber: exam_db_row.starting_registration_number,
        registrationFeeRegular: exam_db_row.registration_fee_regular,
        registrationFeeIrregular: exam_db_row.registration_fee_irregular,
        lateRegistrationFeeRegular: exam_db_row.late_registration_fee_regular,
        lateRegistrationFeeIrregular: exam_db_row.late_registration_fee_irregular,
        isActive: exam_db_row.is_active,
        status: exam_db_row.status as Exam['status'],
        createdAt: exam_db_row.created_at,
        updatedAt: exam_db_row.updated_at,
        examFees: (exam_db_row.exam_marhala_fees || []).map((dbFee: any) => ({
            marhalaId: dbFee.marhala_id, 
            startingRollNumber: dbFee.starting_roll_number,
            regularFee: dbFee.regular_fee, // Not directly used here but part of Exam type
            irregularFee: dbFee.irregular_fee, // Not directly used
            lateRegularFee: dbFee.late_regular_fee, // Not directly used
            lateIrregularFee: dbFee.late_irregular_fee, // Not directly used
        })),
      }));
    },
  });

  const examOptions: SelectOption[] = useMemo(() => 
    exams.map(exam => ({ value: exam.id, label: exam.name })),
  [exams]);

  const { data: allMarhalas = [], isLoading: isLoadingMarhalas } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForRollAssignment'],
    queryFn: async () => {
      const { data, error } = await supabase.from('marhalas').select('*').order('name_bn');
      if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।');
      return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend);
    },
  });
  
  const getMarhalaNameAndTypeById = useCallback((id: string): string => {
    const marhala = allMarhalas.find(m => m.id === id);
    return marhala ? `${marhala.nameBn} (${marhala.type === 'boys' ? 'বালক' : 'বালিকা'})` : 'N/A';
  }, [allMarhalas]);


  const fetchMarhalaDetailsForExam = useCallback(async (examId: string) => {
    if (!examId || allMarhalas.length === 0) {
      setMarhalaAssignmentDetails([]);
      return;
    }
    const currentExam = exams.find(ex => ex.id === examId);
    if (!currentExam || !currentExam.examFees) {
      setMarhalaAssignmentDetails([]);
      return;
    }

    const detailsPromises = currentExam.examFees.map(async (examFeeDetail) => {
      // Count examinees with status 'finalized_fee_paid'
      const { count: eligibleCount, error: eligibleError } = await supabase
        .from('examinees')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)
        .eq('marhala_id', examFeeDetail.marhalaId)
        .eq('status', 'fee_paid');

      if (eligibleError) {
        console.error(`Error fetching eligible examinees for marhala ${examFeeDetail.marhalaId}:`, eligibleError);
        // Decide how to handle this error, e.g., skip this marhala or show an error state for it
        return null; 
      }
      
      // Count examinees with status 'roll_assigned'
      const { count: assignedCount, error: assignedError } = await supabase
        .from('examinees')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)
        .eq('marhala_id', examFeeDetail.marhalaId)
        .eq('status', 'roll_assigned');

      if (assignedError) {
        console.error(`Error fetching assigned examinees for marhala ${examFeeDetail.marhalaId}:`, assignedError);
        return null;
      }

      return {
        marhalaId: examFeeDetail.marhalaId,
        marhalaName: getMarhalaNameAndTypeById(examFeeDetail.marhalaId),
        eligibleExamineeCount: eligibleCount || 0,
        assignedExamineeCount: assignedCount || 0,
        startingRoll: examFeeDetail.startingRollNumber,
        isAssignedOrNoEligible: (eligibleCount || 0) === 0, // True if no one to assign OR all already assigned (count updates after assignment)
        assigningInProgress: false,
      };
    });

    const resolvedDetails = (await Promise.all(detailsPromises)).filter(d => d !== null) as MarhalaAssignmentInfo[];
    setMarhalaAssignmentDetails(resolvedDetails);

  }, [exams, allMarhalas, getMarhalaNameAndTypeById]);

  useEffect(() => {
    if (selectedExamId) {
        fetchMarhalaDetailsForExam(selectedExamId);
    } else {
        setMarhalaAssignmentDetails([]);
    }
  }, [selectedExamId, fetchMarhalaDetailsForExam]);

  const assignRollsMutation = useMutation({
    mutationFn: async (params: { examId: string; marhalaId: string }) => {
      const { data, error } = await supabase.rpc('assign_roll_numbers_for_marhala_exam', {
        p_exam_id: params.examId,
        p_marhala_id: params.marhalaId,
      });
      if (error) throw error;
      return data;
    },
    onMutate: (variables) => {
        setMarhalaAssignmentDetails(prevDetails => prevDetails.map(detail => 
            detail.marhalaId === variables.marhalaId ? { ...detail, assigningInProgress: true } : detail
        ));
    },
    onSuccess: (data: any, variables) => {
      const resultData = data as { success: boolean; message: string; assigned_count: number };
      if (resultData.success) {
        addToast(`${getMarhalaNameAndTypeById(variables.marhalaId)} এর জন্য ${resultData.assigned_count.toLocaleString('bn-BD')} জন পরীক্ষার্থীর রোল নম্বর সফলভাবে নির্ধারণ করা হয়েছে।`, 'success');
        // Refetch or update the specific marhala detail
        fetchMarhalaDetailsForExam(variables.examId); 
      } else {
        addToast(`রোল নির্ধারণে সমস্যা: ${resultData.message || 'অজানা সমস্যা।'}`, 'error');
         setMarhalaAssignmentDetails(prevDetails => prevDetails.map(detail => 
            detail.marhalaId === variables.marhalaId ? { ...detail, assigningInProgress: false } : detail
        ));
      }
    },
    onError: (error: PostgrestError | Error, variables) => {
      addToast(`রোল নির্ধারণে ত্রুটি: ${error.message}`, 'error');
      setMarhalaAssignmentDetails(prevDetails => prevDetails.map(detail => 
        detail.marhalaId === variables.marhalaId ? { ...detail, assigningInProgress: false } : detail
      ));
    },
  });

  const handleAssignRolls = (marhalaIdToAssign: string) => {
    if (!selectedExamId) {
      addToast('প্রথমে একটি পরীক্ষা নির্বাচন করুন।', 'error');
      return;
    }
    assignRollsMutation.mutate({ examId: selectedExamId, marhalaId: marhalaIdToAssign });
  };

  if (isLoadingExams || isLoadingMarhalas) {
    return <div className="flex items-center justify-center h-screen"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-2"/> তথ্য লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">রোল নম্বর নির্ধারণ</h2>
      
      <Card title="পরীক্ষা নির্বাচন">
        <Select
          label="পরীক্ষা নির্বাচন করুন"
          value={selectedExamId}
          onChange={e => setSelectedExamId(e.target.value)}
          options={examOptions}
          placeholderOption="-- পরীক্ষা নির্বাচন করুন --"
          wrapperClassName="max-w-md"
        />
      </Card>

      {selectedExamId && marhalaAssignmentDetails.length > 0 && (
        <Card title="মারহালা ভিত্তিক রোল নির্ধারণ">
          <div className="space-y-4">
            {marhalaAssignmentDetails.map(detail => (
              <div key={detail.marhalaId} className={`p-4 border rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${detail.isAssignedOrNoEligible && detail.eligibleExamineeCount === 0 && detail.assignedExamineeCount > 0 ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-700">{detail.marhalaName}</h3>
                  <p className="text-sm text-gray-600">
                    যোগ্য পরীক্ষার্থী (ফি পরিশোধিত): <span className="font-medium">{detail.eligibleExamineeCount.toLocaleString('bn-BD')}</span> জন
                  </p>
                  <p className="text-sm text-gray-600">
                    ইতিমধ্যে রোল নির্ধারিত: <span className="font-medium">{detail.assignedExamineeCount.toLocaleString('bn-BD')}</span> জন
                  </p>
                  <p className="text-sm text-gray-600">
                    নির্ধারিত শুরুর রোল: <span className="font-medium">{detail.startingRoll.toLocaleString('bn-BD')}</span>
                  </p>
                </div>
                {detail.isAssignedOrNoEligible && detail.eligibleExamineeCount === 0 && detail.assignedExamineeCount > 0 ? (
                  <div className="flex items-center text-green-600 font-medium bg-green-100 px-3 py-1.5 rounded-md text-sm">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    রোল নির্ধারিত হয়েছে
                  </div>
                ) : detail.eligibleExamineeCount === 0 ? (
                    <div className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-md">
                      কোনো যোগ্য পরীক্ষার্থী নেই
                    </div>
                ) : (
                  <Button 
                    onClick={() => handleAssignRolls(detail.marhalaId)} 
                    disabled={detail.assigningInProgress || detail.eligibleExamineeCount === 0}
                    leftIcon={detail.assigningInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <Cog6ToothIcon className="w-5 h-5"/>}
                  >
                    {detail.assigningInProgress ? 'প্রসেসিং...' : `রোল নির্ধারণ করুন (${detail.eligibleExamineeCount.toLocaleString('bn-BD')} জন)`}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
       {selectedExamId && !isLoadingMarhalas && marhalaAssignmentDetails.length === 0 && (
         <Card>
            <p className="text-center text-gray-500 p-4">এই পরীক্ষার জন্য কোনো মারহালা ভিত্তিক ফি/রোল তথ্য পাওয়া যায়নি অথবা কোনো মারহালায় পরীক্ষার্থী নেই।</p>
         </Card>
       )}
    </div>
  );
};

export default RollNumberAssignmentPage;
