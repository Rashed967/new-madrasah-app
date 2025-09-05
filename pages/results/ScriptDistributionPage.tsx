
import React, { useState, useMemo, useEffect, useReducer, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {  SearchableSelectOption } from '../../components/ui/SearchableSelect';
import { Exam, Marhala, Kitab, SelectOption as GlobalSelectOption, KitabApiResponse, MarhalaApiResponse } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowPathIcon, ClipboardDocumentListIcon, ListBulletIcon, UsersIcon, CheckCircleIcon as AssignIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '../../components/ui/Icon';
import type { PostgrestError } from '@supabase/supabase-js';

import { UndistributedScript, GroupedScripts, ExaminerBucket, SelectedMadrasaInfo, State, Action } from './script-distribution/types';
import { initialState, scriptDistributionReducer } from './script-distribution/hooks/useScriptDistributionReducer';
import { mapApiExamToFrontend, mapApiMarhalaToFrontend, mapApiKitabToFrontend } from './script-distribution/utils/mappers';
import { ScriptPoolPanel } from './script-distribution/components/ScriptPoolPanel';
import { DistributionPanel } from './script-distribution/components/DistributionPanel';
import { DistributionFilters } from './script-distribution/components/DistributionFilters';

// Main Component
const ScriptDistributionPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(scriptDistributionReducer, initialState);
  const { selectedExamId, selectedMarhalaId, selectedKitabId, selectedMadrasahFilterId, groupedScripts, selectedMadrasas, examinerBuckets, isPanelVisible, expandedMarkaz } = state;

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({ queryKey: ['examsForScriptDistribution'], queryFn: async () => { const { data, error } = await supabase.rpc('get_exams_for_script_distribution'); if (error) throw error; return (data || []).map(mapApiExamToFrontend); }});
  const { data: marhalas = [], isLoading: isLoadingMarhalas } = useQuery<Marhala[], Error>({ queryKey: ['marhalasForScriptDistribution', selectedExamId], queryFn: async () => { if (!selectedExamId) return []; const { data, error } = await supabase.rpc('get_marhalas_for_exam', {p_exam_id: selectedExamId}); if (error) throw error; return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend); }, enabled: !!selectedExamId, });
  const { data: kitabs = [], isLoading: isLoadingKitabs } = useQuery<GlobalSelectOption[], Error>({ queryKey: ['kitabsForScriptDistribution', selectedMarhalaId], queryFn: async () => { if (!selectedMarhalaId) return []; const { data, error } = await supabase.rpc('get_kitabs_by_marhala', {p_marhala_id: selectedMarhalaId}); if(error) throw error; return (data as KitabApiResponse[]).map(mapApiKitabToFrontend); }, enabled: !!selectedMarhalaId });
  const { data: madrasahs = [], isLoading: isLoadingMadrasahs } = useQuery<SearchableSelectOption[], Error>({ queryKey: ['madrasahsForScriptDistribution', selectedExamId, selectedMarhalaId, selectedKitabId], queryFn: async () => { if (!selectedExamId || !selectedMarhalaId || !selectedKitabId) return []; const { data, error } = await supabase.rpc('get_madrasahs_for_script_distribution', { p_exam_id: selectedExamId, p_marhala_id: selectedMarhalaId, p_kitab_id: selectedKitabId }); if (error) throw error; return data || []; }, enabled: !!selectedExamId && !!selectedMarhalaId && !!selectedKitabId });
  const { data: eligibleExaminersData, isLoading: isLoadingExaminers } = useQuery<{ items: SearchableSelectOption[] }, Error>({ queryKey: ['eligibleExaminersForScriptDistributionDropdown', selectedExamId], queryFn: async () => { if (!selectedExamId) return { items: [] }; const { data, error } = await supabase.rpc('get_eligible_examiners_for_script_distribution', { p_exam_id: selectedExamId, p_limit: 5000 }); if (error) throw error; return data || { items: [] }; }, enabled: !!selectedExamId, });
  
  const { refetch: fetchScripts, isFetching: isFetchingScripts, error: scriptsError } = useQuery<UndistributedScript[], Error>({ queryKey: ['undistributedScripts', selectedExamId, selectedMarhalaId, selectedKitabId], queryFn: async () => { const { data, error } = await supabase.rpc('get_undistributed_scripts_for_distribution_v2', { p_exam_id: selectedExamId, p_marhala_id: selectedMarhalaId, p_kitab_id: selectedKitabId }); if (error) throw error; return data || []; }, enabled: false });

  const assignScriptsMutation = useMutation({
    mutationFn: async (payload: { assignments: any[] }) => { const { data, error } = await supabase.rpc('assign_scripts_to_examiner_bulk', { p_assignments: payload.assignments }); if (error) throw error; return data; },
    onSuccess: (data) => {
      addToast(`সফলভাবে ${(data as any).total_scripts_assigned.toLocaleString('bn-BD')} টি উত্তরপত্র বন্টন করা হয়েছে।`, 'success');
      queryClient.invalidateQueries({ queryKey: ['undistributedScripts', selectedExamId, selectedMarhalaId, selectedKitabId] });
      dispatch({ type: 'RESET_ASSIGNMENT' });
      handleFetchScripts(); // Re-fetch to show remaining scripts
    },
    onError: (error: PostgrestError | Error) => { addToast(`বন্টনে ত্রুটি: ${error.message}`, 'error', 7000); }
  });

  useEffect(() => { if (scriptsError) { addToast(`উত্তরপত্র আনতে সমস্যা: ${scriptsError.message}`, 'error'); dispatch({type: 'FETCH_SCRIPTS_ERROR'}); } }, [scriptsError, addToast]);

  const examOptions = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);
  const marhalaOptions = useMemo(() => marhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'})` })), [marhalas]);
  const kitabOptions = useMemo(() => kitabs.map(k => ({ value: k.value, label: k.label })), [kitabs]);
  const madrasahOptions = useMemo(() => madrasahs.map(m => ({ value: m.value, label: `${m.label} - ${m.code}`, code: m.code })), [madrasahs]);

  const handleFetchScripts = useCallback(async () => {
    if (!selectedExamId || !selectedMarhalaId || !selectedKitabId) { addToast('অনুগ্রহ করে পরীক্ষা, মারহালা এবং কিতাব নির্বাচন করুন।', 'error'); return; }
    const { data } = await fetchScripts();
    if (data) {
        if(data.length === 0){ addToast('এই ফিল্টারে বন্টনের জন্য কোনো উত্তরপত্র পাওয়া যায়নি।', 'info'); }
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
    }
  }, [selectedExamId, selectedMarhalaId, selectedKitabId, fetchScripts, addToast]);
  
  const { selectedScriptIds, selectedScriptCount } = useMemo(() => {
    const ids = new Set<string>();
    let count = 0;
    Object.values(selectedMadrasas).forEach(info => {
      for(let i = 0; i < info.scriptCount; i++) {
        ids.add(info.scripts[i].examinee_id);
      }
      count += info.scriptCount;
    });
    return { selectedScriptIds: ids, selectedScriptCount: count };
  }, [selectedMadrasas]);

  const totalAssignedInBuckets = useMemo(() => examinerBuckets.reduce((sum, b) => sum + b.scriptCount, 0), [examinerBuckets]);

  const handleSubmitAssignments = () => {
    if (selectedScriptCount !== totalAssignedInBuckets) { addToast(`নির্বাচিত (${selectedScriptCount}) ও বন্টিত (${totalAssignedInBuckets}) খাতার সংখ্যা সমান নয়।`, 'error'); return; }
    if (examinerBuckets.length === 0) { addToast('কোনো পরীক্ষককে বন্টন করা হয়নি।', 'error'); return; }

    const scriptsToDistribute = Array.from(selectedScriptIds).map(id => state.scriptPool.find(s => s.examinee_id === id)).filter(Boolean) as UndistributedScript[];
    scriptsToDistribute.sort((a,b) => (a.roll_number || 0) - (b.roll_number || 0));

    let scriptIndex = 0;
    const assignmentsPayload: any[] = [];
    
    for (const bucket of examinerBuckets) {
        if (bucket.scriptCount > 0) {
            const scriptsForThisBucket = scriptsToDistribute.slice(scriptIndex, scriptIndex + bucket.scriptCount);
            if(scriptsForThisBucket.length !== bucket.scriptCount){ addToast('একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। খাতা বন্টন সম্ভব নয়।', 'error'); return; }
            if(scriptsForThisBucket.length === 0) continue;

            const markazId = scriptsForThisBucket[0]?.markaz_id;
            const examineeIds = scriptsForThisBucket.map(s => s.examinee_id);
            const madrasaIds = [...new Set(scriptsForThisBucket.map(s => s.madrasa_id))];
            
            assignmentsPayload.push({
                examiner_id: bucket.examinerId, examinee_ids: examineeIds, markaz_id: markazId,
                kitab_id: selectedKitabId, exam_id: selectedExamId, marhala_id: selectedMarhalaId,
                distribution_date: new Date().toISOString(), madrasa_ids: madrasaIds
            });
            scriptIndex += bucket.scriptCount;
        }
    }
    assignScriptsMutation.mutate({ assignments: assignmentsPayload });
  };
  
  if (isLoadingExams) return <div className="flex justify-center items-center h-64"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-2"/><p>তথ্য লোড হচ্ছে...</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">উত্তরপত্র বন্টন</h2>
      <DistributionFilters
        selectedExamId={selectedExamId}
        selectedMarhalaId={selectedMarhalaId}
        selectedKitabId={selectedKitabId}
        examOptions={examOptions}
        marhalaOptions={marhalaOptions}
        kitabOptions={kitabOptions}
        isLoadingExams={isLoadingExams}
        isLoadingMarhalas={isLoadingMarhalas}
        isLoadingKitabs={isLoadingKitabs}
        isFetchingScripts={isFetchingScripts}
        dispatch={dispatch}
        handleFetchScripts={handleFetchScripts}
      />
      
      {isPanelVisible && (
        <div className="grid grid-cols-12 gap-6">
          <ScriptPoolPanel
            groupedScripts={groupedScripts}
            selectedMadrasas={selectedMadrasas}
            expandedMarkaz={expandedMarkaz}
            dispatch={dispatch}
            selectedMadrasahFilterId={selectedMadrasahFilterId}
            madrasahOptions={madrasahOptions}
            isLoadingMadrasahs={isLoadingMadrasahs}
          />
          <DistributionPanel examinerBuckets={examinerBuckets} selectedScriptCount={selectedScriptCount} eligibleExaminers={eligibleExaminersData?.items || []} dispatch={dispatch} isLoadingExaminers={isLoadingExaminers} handleSubmit={handleSubmitAssignments} isSubmitting={assignScriptsMutation.isPending} />
        </div>
      )}
    </div>
  );
};

// -- Sub-components --






export default ScriptDistributionPage;

