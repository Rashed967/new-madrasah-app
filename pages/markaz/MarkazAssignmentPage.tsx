import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { ListBulletIcon, DocumentDuplicateIcon, ArrowPathIcon, TrashIcon, Cog6ToothIcon, PlusCircleIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { toBengaliNumber } from '../../lib/utils';
import { Exam, Markaz, GroupedAssignmentDisplay, SelectOption, MarkazDbRow, MarkazAssignmentDetailDbRow, MarhalaSpecificType, Zone as ZoneType, ZoneApiResponse, MadrasaType, Marhala, Madrasa, FrontendMarhalaApiResponse, MadrasaDbRow } from '../../types';
import type { PostgrestError } from '@supabase/supabase-js';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { MADRASA_TYPE_OPTIONS } from '../../constants';

// Helper functions from various files
const getCategoryLabel = (category: string): string => {
    if (category === 'darsiyat') return 'দরসিয়াত';
    if (category === 'hifz') return 'হিফজ';
    return category;
}

const mapMarhalaApiToFrontend = (apiMarhala: FrontendMarhalaApiResponse): Marhala => ({ id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn, nameAr: apiMarhala.name_ar || undefined, type: apiMarhala.type, category: apiMarhala.category, kitabIds: apiMarhala.kitab_ids || [], marhala_order: apiMarhala.marhala_order, createdAt: apiMarhala.created_at, updatedAt: apiMarhala.updated_at });
const mapMadrasaDbRowToFrontendList = (dbRow: MadrasaDbRow): Madrasa => ({
    id: dbRow.id, madrasaCode: dbRow.madrasa_code, nameBn: dbRow.name_bn, nameAr: dbRow.name_ar, nameEn: dbRow.name_en || undefined,
    address: { 
        holding: dbRow.address?.holding || undefined, 
        village: dbRow.address.village, 
        postOffice: dbRow.address?.post_office || undefined,
        upazila: dbRow.address.upazila, 
        district: dbRow.address.district, 
        division: dbRow.address.division, 
        contactPersonName: dbRow.address.contact_person_name, 
    },
    zoneId: dbRow.zone_id, mobile1: dbRow.mobile1, mobile2: dbRow.mobile2 || undefined, type: dbRow.type,
    dispatchMethod: dbRow.dispatch_method,
    highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined, highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
    muhtamim: { name: dbRow.muhtamim.name, mobile: dbRow.muhtamim.mobile, nidNumber: dbRow.muhtamim.nid_number || undefined, qualification: dbRow.muhtamim.qualification || undefined, },
    educationSecretary: dbRow.education_secretary ? { name: dbRow.education_secretary.name, mobile: dbRow.education_secretary.mobile, nidNumber: dbRow.education_secretary.nid_number || undefined, qualification: dbRow.education_secretary.qualification || undefined, } : undefined,
    mutawalli: dbRow.mutawalli ? { name: dbRow.mutawalli.name, mobile: dbRow.mutawalli.mobile, nidNumber: dbRow.mutawalli.nid_number || undefined, } : undefined,
    registrationDate: dbRow.registration_date, ilhakFormUrl: dbRow.ilhak_form_url || undefined,
    userId: dbRow.user_id || undefined,
});

// --- Start of DeleteConfirmationModal.tsx ---
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isConfirming: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isConfirming,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="flex items-start space-x-4">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:text-right">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isConfirming}
          className="w-full sm:w-auto sm:ml-3"
        >
          {isConfirming ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত'}
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isConfirming}
          className="mt-3 w-full sm:mt-0 sm:w-auto"
        >
          বাতিল
        </Button>
      </div>
    </Modal>
  );
};
// --- End of DeleteConfirmationModal.tsx ---

// --- Start of CopyAssignmentModal.tsx ---
interface CopyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  allExams: Exam[];
  onCopy: (sourceExamId: string, targetExamId: string) => void;
  isLoading: boolean;
}

const CopyAssignmentModal: React.FC<CopyAssignmentModalProps> = ({
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
// --- End of CopyAssignmentModal.tsx ---

// --- Start of ManageMarhalaModal.tsx ---
interface ManageMarhalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  managingMadrasaDetails: GroupedAssignmentDisplay | null;
  selectedExamId: string;
  selectedMarkazId: string;
  onSuccess: () => void;
}

const ManageMarhalaModal: React.FC<ManageMarhalaModalProps> = ({
  isOpen,
  onClose,
  managingMadrasaDetails,
  selectedExamId,
  selectedMarkazId,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [marhalasToAddInModal, setMarhalasToAddInModal] = useState<string[]>([]);
  const [marhalasToRemoveInModal, setMarhalasToRemoveInModal] = useState<string[]>([]);

  const { data: allMarhalas = [] } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForMarkazAssignment'],
    queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order'); if (error) throw error; return (data as FrontendMarhalaApiResponse[]).map(mapMarhalaApiToFrontend); }
  });

  const { data: allAssignmentsForExamData = [] } = useQuery<MarkazAssignmentDetailDbRow[], Error>({
    queryKey: ['allAssignmentsForExam', selectedExamId],
    queryFn: async () => { if (!selectedExamId) return []; const { data: allAssignmentsRaw, error: allError } = await supabase.from('markaz_madrasa_marhala_assignments').select('id, markaz_id, exam_id, madrasa_id, marhala_id, created_at, madrasas(name_bn), marhalas(name_bn, type)').eq('exam_id', selectedExamId); if (allError) throw allError; return allAssignmentsRaw.map((item: any) => ({ assignment_id: item.id, markaz_id: item.markaz_id, exam_id: item.exam_id, madrasa_id: item.madrasa_id, marhala_id: item.marhala_id, assignment_created_at: item.created_at, madrasa_name_bn: item.madrasas?.name_bn || 'Unknown Madrasa', marhala_name_bn: item.marhalas?.name_bn || 'Unknown Marhala', marhala_type: item.marhalas?.type || 'boys' })); },
    enabled: !!selectedExamId,
  });

  const { data: allMadrasasForLookup = [] } = useQuery<Madrasa[], Error>({
    queryKey: ['allMadrasasForMarkazAssignmentLookup'],
    queryFn: async () => { const { data, error } = await supabase.from('madrasas').select('*').order('name_bn'); if (error) throw error; return (data as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontendList); },
    staleTime: 5 * 60 * 1000, 
  });

  const availableMarhalasForManageModal = useMemo(() => {
    if (!managingMadrasaDetails) return [];
    const currentMadrasa = allMadrasasForLookup?.find(m => m.id === managingMadrasaDetails.madrasaId);
    if (!currentMadrasa || !allMarhalas || !allAssignmentsForExamData) return [];

    const marhalasOfThisMadrasaType = allMarhalas.filter(mh => {
        if (currentMadrasa.type === 'boys') return mh.type === 'boys';
        if (currentMadrasa.type === 'girls') return mh.type === 'girls';
        return true;
    });

    const marhalasAssignedToAnyMarkazForThisMadrasaExam = new Set(
        allAssignmentsForExamData
            .filter(asgn => asgn.madrasa_id === managingMadrasaDetails.madrasaId)
            .map(asgn => asgn.marhala_id)
    );

    const currentlyAssignedToThisMarkazSet = new Set(managingMadrasaDetails.marhalas.map(mh => mh.marhalaId));

    return marhalasOfThisMadrasaType
        .filter(mh => !currentlyAssignedToThisMarkazSet.has(mh.id) && !marhalasAssignedToAnyMarkazForThisMadrasaExam.has(mh.id))
        .map(mh => ({ marhalaId: mh.id, marhalaNameBn: mh.nameBn, marhalaType: mh.type, category: mh.category }));
  }, [managingMadrasaDetails, allMadrasasForLookup, allMarhalas, allAssignmentsForExamData]);

  useEffect(() => {
    setMarhalasToAddInModal([]);
    setMarhalasToRemoveInModal([]);
  }, [managingMadrasaDetails]);

  const assignMutation = useMutation({
    mutationFn: async (assignmentsToCreate: { markaz_id: string; exam_id: string; madrasa_id: string; marhala_id: string }[]) => {
        const { data, error } = await supabase.from('markaz_madrasa_marhala_assignments').insert(assignmentsToCreate);
        if (error) throw error;
        return data;
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
        const { error } = await supabase.from('markaz_madrasa_marhala_assignments').delete().match({ id: assignmentId });
        if (error) throw error;
    },
  });

  const handleSaveChangesInManageModal = async () => {
    if (!managingMadrasaDetails || !selectedMarkazId || !selectedExamId) return;

    const assignmentsToCreate = marhalasToAddInModal.map(marhalaId => ({
        markaz_id: selectedMarkazId,
        exam_id: selectedExamId,
        madrasa_id: managingMadrasaDetails.madrasaId,
        marhala_id: marhalaId,
    }));

    const assignmentsToRemovePromises = marhalasToRemoveInModal.map(assignmentId =>
        removeAssignmentMutation.mutateAsync(assignmentId)
    );

    let allSucceeded = true;
    const errorsEncountered: Error[] = [];

    try {
        if (assignmentsToCreate.length > 0) {
            await assignMutation.mutateAsync(assignmentsToCreate as any);
        }

        if (assignmentsToRemovePromises.length > 0) {
            const removalResults = await Promise.allSettled(assignmentsToRemovePromises);
            const failedRemovals = removalResults.filter(r => r.status === 'rejected');
            if (failedRemovals.length > 0) {
                allSucceeded = false;
                errorsEncountered.push(...failedRemovals.map(fr => (fr as PromiseRejectedResult).reason as Error));
            }
        }

        if (allSucceeded) {
            addToast('মারহালা পরিচালনা সফল হয়েছে।', 'success');
        } else {
            const errorMsg = errorsEncountered.map(e => e.message).join('; ');
            addToast(`কিছু পরিবর্তন ব্যর্থ হয়েছে: ${errorMsg}`, 'error');
        }
        onSuccess();
    } catch (error: any) {
        addToast(`মারহালা পরিচালনায় ত্রুটি: ${error.message}`, 'error');
    } finally {
        onClose();
    }
  };

  if (!managingMadrasaDetails) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${managingMadrasaDetails.madrasaNameBn} (${toBengaliNumber(managingMadrasaDetails.madrasaCode)}) - মারহালা পরিচালনা`}
      size="2xl"
      footer={ <> <Button variant="secondary" onClick={onClose}>বাতিল</Button> <Button onClick={handleSaveChangesInManageModal} disabled={assignMutation.isPending || removeAssignmentMutation.isPending || (marhalasToAddInModal.length === 0 && marhalasToRemoveInModal.length === 0)}>পরিবর্তন সংরক্ষণ করুন</Button> </> }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
        <div>
          <h4 className="text-md font-semibold text-black mb-2">বর্তমান এসাইনকৃত মারহালাসমূহ:</h4>
          {managingMadrasaDetails.marhalas.length > 0 ? (
            <ul className="space-y-1">
              {managingMadrasaDetails.marhalas.map(mh => (
                <li key={mh.assignmentId} className={`flex justify-between items-center p-2 rounded-md ${marhalasToRemoveInModal.includes(mh.assignmentId) ? 'bg-red-100 line-through' : 'bg-gray-100'}`}>
                  <span className="text-black">{mh.marhalaNameBn} ({mh.marhalaType === 'boys' ? 'বালক' : 'বালিকা'})</span>
                  <Button variant="ghost" size="sm" className={`text-xs ${marhalasToRemoveInModal.includes(mh.assignmentId) ? 'text-blue-500 hover:text-blue-700' : 'text-red-500 hover:text-red-700'}`} onClick={() => {
                    setMarhalasToRemoveInModal(prev => prev.includes(mh.assignmentId) ? prev.filter(id => id !== mh.assignmentId) : [...prev, mh.assignmentId]);
                  }} > {marhalasToRemoveInModal.includes(mh.assignmentId) ? 'অপসারণ বাতিল' : 'অপসারণ করুন'} </Button>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-black">এই মারকাযে বর্তমানে কোনো মারহালা এসাইন করা নেই।</p>}
        </div>
        {availableMarhalasForManageModal.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-black mb-2 mt-4">নতুন মারহালা যোগ করুন:</h4>
            <Checkbox id="selectAllAvailableInModal" label="সবগুলো নির্বাচন/বাতিল করুন" checked={marhalasToAddInModal.length === availableMarhalasForManageModal.length} onChange={(e) => setMarhalasToAddInModal(e.target.checked ? availableMarhalasForManageModal.map(mh => mh.marhalaId) : [])} wrapperClassName="mb-2"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableMarhalasForManageModal.map(mh => (
                <Checkbox key={mh.marhalaId} id={`add-marhala-modal-${mh.marhalaId}`} label={`${mh.marhalaNameBn} (${mh.marhalaType === 'boys' ? 'বালক' : 'বালিকা'})`} checked={marhalasToAddInModal.includes(mh.marhalaId)} onChange={(e) => {
                  setMarhalasToAddInModal(prev => e.target.checked ? [...prev, mh.marhalaId] : prev.filter(id => id !== mh.marhalaId));
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
// --- End of ManageMarhalaModal.tsx ---

// --- Start of AssignedMadrasaList.tsx ---
interface AssignedMadrasaListProps {
  isLoading: boolean;
  assignments: GroupedAssignmentDisplay[];
  onManage: (madrasaGroup: GroupedAssignmentDisplay) => void;
  onRemove: (madrasaGroup: GroupedAssignmentDisplay) => void;
  onBulkRemove: (selectedIds: string[]) => void;
}

const AssignedMadrasaList: React.FC<AssignedMadrasaListProps> = ({
  isLoading,
  assignments,
  onManage,
  onRemove,
  onBulkRemove,
}) => {
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<string[]>([]);

  const handleToggleBulkDeleteMadrasa = (madrasaId: string) => {
    setSelectedForBulkDelete(prev =>
      prev.includes(madrasaId) ? prev.filter(id => id !== madrasaId) : [...prev, madrasaId]
    );
  };

  const handleSelectAllVisibleAssigned = (checked: boolean) => {
    setSelectedForBulkDelete(checked ? assignments.map(g => g.madrasaId) : []);
  };

  const isAllVisibleAssignedSelected = useMemo(() => {
    if (assignments.length === 0) return false;
    return assignments.every(g => selectedForBulkDelete.includes(g.madrasaId));
  }, [assignments, selectedForBulkDelete]);

  const handleBulkDeleteClick = () => {
    onBulkRemove(selectedForBulkDelete);
    setSelectedForBulkDelete([]);
  }

  return (
    <Card>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">নির্ধারিত মাদরাসা ও মারহালাসমূহ</h3>
        <Button
          onClick={handleBulkDeleteClick}
          variant="danger"
          size="sm"
          disabled={selectedForBulkDelete.length === 0}
          leftIcon={<TrashIcon className="w-4 h-4"/>}
        >
          নির্বাচিতগুলো মুছুন
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center p-8"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500"/> <span className="ml-2 text-black">এসাইনমেন্ট তালিকা লোড হচ্ছে...</span></div>
      ) : assignments.length > 0 ? (
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-center" style={{width: '20px'}}><Checkbox id="selectAllVisibleAssigned" labelClassName="sr-only" checked={isAllVisibleAssignedSelected} onChange={(e) => handleSelectAllVisibleAssigned(e.target.checked)} disabled={assignments.length === 0} aria-label="সব দৃশ্যমান এসাইনমেন্ট নির্বাচন করুন"/></th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500" style={{width: '180px'}}>মাদরাসার নাম</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500" style={{width: '40px'}}>মারহালা সংখ্যা</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500" style={{width: '70px'}}>কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map(group => (
                <tr key={group.madrasaId} className={selectedForBulkDelete.includes(group.madrasaId) ? 'bg-red-50' : ''}>
                  <td className="px-3 py-3 text-center"><Checkbox id={`assigned-madrasa-${group.madrasaId}`} checked={selectedForBulkDelete.includes(group.madrasaId)} onChange={() => handleToggleBulkDeleteMadrasa(group.madrasaId)} labelClassName="sr-only"/></td>
                  <td className="px-4 py-3 text-sm text-black text-right font-medium" style={{maxWidth: '180px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{group.madrasaNameBn} - {toBengaliNumber(group.madrasaCode)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-black text-center">{toBengaliNumber(group.marhalas.length)}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    <Button variant="ghost" size="sm" onClick={() => onManage(group)} leftIcon={<Cog6ToothIcon className="w-4 h-4"/>}>পরিচালনা</Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(group)} leftIcon={<TrashIcon className="w-4 h-4"/>} className="text-red-500 hover:text-red-700">সব মুছুন</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 text-black">এই মারকাযে কোনো মাদরাসা এসাইন করা নেই।</div>
      )}
    </Card>
  );
};
// --- End of AssignedMadrasaList.tsx ---

// --- Start of AssignableMadrasaList.tsx ---
interface AssignableMadrasa {
  madrasa_id: string;
  madrasa_name_bn: string;
  madrasa_code: number;
  madrasa_type: MarhalaSpecificType | 'both';
  assignable_marhalas: {
    marhala_id: string;
    marhala_name_bn: string;
    marhala_type: MarhalaSpecificType;
    marhala_category: string;
  }[];
}

interface AssignableMadrasaListProps {
  selectedExamId: string;
  selectedMarkazId: string;
  onAssignmentSuccess: () => void;
}

const AssignableMadrasaList: React.FC<AssignableMadrasaListProps> = ({ selectedExamId, selectedMarkazId, onAssignmentSuccess }) => {
  const { addToast } = useToast();
  const [selectedMadrasasForBulkAssignment, setSelectedMadrasasForBulkAssignment] = useState<Record<string, { madrasaId: string; marhalaIds: string[] }>>({});
  const [assignableMadrasasPage, setAssignableMadrasasPage] = useState(1);
  const [assignableMadrasas, setAssignableMadrasas] = useState<AssignableMadrasa[]>([]);
  const assignableMadrasasLimit = 20;

  const [filterZoneId, setFilterZoneId] = useState<string>('');
  const [filterMadrasaType, setFilterMadrasaType] = useState<MadrasaType>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [expandedMarhalas, setExpandedMarhalas] = useState<Record<string, boolean>>({});

  const { data: zones = [], isLoading: isLoadingZones } = useQuery<ZoneType[], Error>({
    queryKey: ['allZonesForAssignmentFilter'],
    queryFn: async (): Promise<ZoneType[]> => { 
        const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts, created_at, updated_at').order('name_bn'); 
        if (error) throw error; 
        const rawData = data || [];
        return rawData.map((z_api: ZoneApiResponse) => ({
            id: z_api.id,
            zoneCode: z_api.zone_code,
            nameBn: z_api.name_bn,
            districts: z_api.districts || [],
            createdAt: z_api.created_at,
            updatedAt: z_api.updated_at,
        }));
    }
  });

  const madrasaTypesToFilter = useMemo(() => {
    if (filterMadrasaType === 'boys') return ['boys'];
    if (filterMadrasaType === 'girls') return ['girls'];
    if (filterMadrasaType === 'both') return ['boys', 'girls'];
    return null; // No filter applied
  }, [filterMadrasaType]);

  const { data: assignableMadrasasData, isLoading: isLoadingAssignableMadrasas, isFetching: isFetchingAssignableMadrasas } = useQuery<{ items: AssignableMadrasa[], total: number }, Error>({
    queryKey: ['assignableMadrasasForExam', selectedExamId, assignableMadrasasPage, assignableMadrasasLimit, filterZoneId, debouncedSearchTerm, madrasaTypesToFilter],
    queryFn: async () => {
        if (!selectedExamId) return { items: [], total: 0 };
        const { data, error, count } = await supabase.rpc(
            'get_assignable_madrasas_for_exam',
            {
                p_exam_id: selectedExamId,
                p_page: assignableMadrasasPage,
                p_limit: assignableMadrasasLimit,
                p_zone_id: filterZoneId || null,
                p_search_term: debouncedSearchTerm || null,
                p_madrasa_types: madrasaTypesToFilter
            },
            { count: 'exact' }
        );
        if (error) throw error;
        return { items: data || [], total: count || 0 };
    },
    enabled: !!selectedExamId,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setAssignableMadrasasPage(1); // Reset page when search term changes
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (assignableMadrasasData?.items) {
      if (assignableMadrasasPage === 1) {
        setAssignableMadrasas(assignableMadrasasData.items);
      } else {
        setAssignableMadrasas(prev => [...prev, ...assignableMadrasasData.items]);
      }
    }
  }, [assignableMadrasasData, assignableMadrasasPage]);

  const totalAssignableMadrasas = assignableMadrasasData?.total || 0;
  const hasMoreAssignableMadrasas = assignableMadrasas.length < totalAssignableMadrasas;

  const zoneFilterOptions: SelectOption[] = useMemo(() => {
    const sortedZones = zones
      .slice()
      .sort((a, b) => {
        const numA = parseInt(a.zoneCode.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.zoneCode.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
      });
    return [{value: '', label: 'সকল জোন'}, ...sortedZones.map(z => ({ value: z.id, label: `${z.nameBn} (${z.zoneCode})` }))];
}, [zones]);
  const madrasaTypeFilterOptions: SelectOption[] = useMemo(() => [{value: '', label: 'সকল ধরণ'}, ...MADRASA_TYPE_OPTIONS], []);

  const assignMutation = useMutation({
    mutationFn: async (assignmentsToCreate: { markazId: string; examId: string; madrasaId: string; marhalaId: string }[]) => {
        const { data, error } = await supabase.from('markaz_madrasa_marhala_assignments').insert(assignmentsToCreate);
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        addToast('সফলভাবে এসাইন করা হয়েছে!', 'success');
        setSelectedMadrasasForBulkAssignment({});
        onAssignmentSuccess();
    },
    onError: (error: Error) => {
        addToast(`এসাইনমেন্টে ত্রুটি: ${error.message}`, 'error');
    }
  });

  const handleBulkAssign = () => {
    if (!selectedExamId || !selectedMarkazId || Object.keys(selectedMadrasasForBulkAssignment).length === 0) {
        addToast('অনুগ্রহ করে পরীক্ষা, মারকায, এবং এসাইন করার জন্য মাদরাসা/মারহালা নির্বাচন করুন।', 'warning');
        return;
    }
    const assignmentsToCreate: { markaz_id: string; exam_id: string; madrasa_id: string; marhala_id: string }[] = [];
    Object.values(selectedMadrasasForBulkAssignment).forEach(madrasaSelection => {
        const madrasaDetails = assignableMadrasas.find(m => m.madrasa_id === madrasaSelection.madrasaId);
        if (!madrasaDetails) return;
        const marhalasToAssign = madrasaSelection.marhalaIds.length > 0 ? madrasaSelection.marhalaIds : madrasaDetails.assignable_marhalas.map(mh => mh.marhala_id);
        marhalasToAssign.forEach(marhalaId => {
            assignmentsToCreate.push({ markaz_id: selectedMarkazId, exam_id: selectedExamId, madrasa_id: madrasaSelection.madrasaId, marhala_id: marhalaId });
        });
    });
    if (assignmentsToCreate.length > 0) {
        assignMutation.mutate(assignmentsToCreate as any);
    } else {
        addToast('এসাইন করার জন্য কোনো মারহালা নির্বাচন করা হয়নি।', 'info');
    }
  };

  const handleMadrasaCheckboxChange = (madrasaId: string, checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const newState = { ...prev };
        if (checked) {
            if (!newState[madrasaId]) {
                newState[madrasaId] = { madrasaId, marhalaIds: [] };
            }
        } else {
            delete newState[madrasaId];
        }
        return newState;
    });
  };

  const handleMarhalaCheckboxChange = (madrasaId: string, marhalaIdToToggle: string, checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const madrasaSelection = prev[madrasaId] || { madrasaId, marhalaIds: [] };
        const newMarhalaIds = checked
            ? [...madrasaSelection.marhalaIds, marhalaIdToToggle]
            : madrasaSelection.marhalaIds.filter(id => id !== marhalaIdToToggle);
        return { ...prev, [madrasaId]: { ...madrasaSelection, marhalaIds: newMarhalaIds } };
    });
  };

  const handleSelectAllMarhalasForMadrasa = (madrasaId: string, assignableMarhalas: AssignableMadrasa['assignable_marhalas'], checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const madrasaSelection = prev[madrasaId] || { madrasaId, marhalaIds: [] };
        const newMarhalaIds = checked ? assignableMarhalas.map(mh => mh.marhala_id) : [];
        return { ...prev, [madrasaId]: { ...madrasaSelection, marhalaIds: newMarhalaIds } };
    });
  };

  const handleSelectAllVisibleMadrasas = (checked: boolean) => {
    if (checked) {
        const newSelections: Record<string, { madrasaId: string; marhalaIds: string[] }> = {};
        assignableMadrasas.forEach(madrasa => {
            newSelections[madrasa.madrasa_id] = { madrasaId: madrasa.madrasa_id, marhalaIds: [] };
        });
        setSelectedMadrasasForBulkAssignment(newSelections);
    } else {
        setSelectedMadrasasForBulkAssignment({});
    }
  };

  const isAllVisibleSelected = useMemo(() => {
    if (assignableMadrasas.length === 0) return false;
    return assignableMadrasas.every(m => !!selectedMadrasasForBulkAssignment[m.madrasa_id]);
  }, [assignableMadrasas, selectedMadrasasForBulkAssignment]);

  return (
    <Card title="নতুন মাদরাসা/মারহালা এসাইন করুন">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
        <Select label="জোন" value={filterZoneId} onChange={e => setFilterZoneId(e.target.value)} options={zoneFilterOptions} placeholderOption="সকল জোন" disabled={isLoadingZones || !selectedExamId} wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Select label="ধরণ" value={filterMadrasaType} onChange={e => setFilterMadrasaType(e.target.value as MadrasaType)} options={madrasaTypeFilterOptions} placeholderOption="সকল ধরণ" disabled={!selectedExamId} wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Input label="মাদরাসা খুঁজুন" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="নাম বা কোড দিয়ে খুঁজুন" wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Checkbox id="selectAllVisibleMadrasas" label="সব নির্বাচন" checked={isAllVisibleSelected} onChange={(e) => handleSelectAllVisibleMadrasas(e.target.checked)} disabled={assignableMadrasas.length === 0 || isLoadingAssignableMadrasas} wrapperClassName="mt-2 sm:mt-5 whitespace-nowrap" labelClassName="text-sm font-medium text-black"/>
      </div>
      {isLoadingAssignableMadrasas && assignableMadrasasPage === 1 ? (
        <div className="flex justify-center items-center p-8"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500"/> <span className="ml-2 text-black">এসাইনযোগ্য মাদরাসা লোড হচ্ছে...</span></div>
      ) : assignableMadrasas.length > 0 ? (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {assignableMadrasas.map(madrasa => (
            <div key={madrasa.madrasa_id} className="p-3 border rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <Checkbox id={`madrasa-bulk-${madrasa.madrasa_id}`} label={`${madrasa.madrasa_name_bn} (কোড: ${toBengaliNumber(madrasa.madrasa_code)}) - ধরণ: ${madrasa.madrasa_type === 'boys' ? 'বালক' : madrasa.madrasa_type === 'girls' ? 'বালিকা' : 'উভয়'}`} checked={!!selectedMadrasasForBulkAssignment[madrasa.madrasa_id]} onChange={e => handleMadrasaCheckboxChange(madrasa.madrasa_id, e.target.checked)} labelClassName="font-semibold text-black"/>
                <Button variant="ghost" size="sm" onClick={() => setExpandedMarhalas(prev => ({...prev, [madrasa.madrasa_id]: !prev[madrasa.madrasa_id]}))} className="text-xs"> {expandedMarhalas[madrasa.madrasa_id] ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}  মারহালা ({madrasa.assignable_marhalas.length}) </Button>
              </div>
              {expandedMarhalas[madrasa.madrasa_id] && madrasa.assignable_marhalas.length > 0 && (
                <div className="mt-2 pl-4 pt-2 border-t">
                  <Checkbox id={`select-all-marhalas-${madrasa.madrasa_id}`} label="এই মাদরাসার সকল মারহালা নির্বাচন করুন" checked={ selectedMadrasasForBulkAssignment[madrasa.madrasa_id]?.marhalaIds.length === madrasa.assignable_marhalas.length && madrasa.assignable_marhalas.length > 0 } onChange={e => handleSelectAllMarhalasForMadrasa(madrasa.madrasa_id, madrasa.assignable_marhalas, e.target.checked)} wrapperClassName="mb-1" labelClassName="text-xs font-medium text-black"/>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {madrasa.assignable_marhalas.map(marhala => (
                      <Checkbox key={marhala.marhala_id} id={`marhala-bulk-${madrasa.madrasa_id}-${marhala.marhala_id}`} label={`${marhala.marhala_name_bn} (${getCategoryLabel(marhala.marhala_category)})`} checked={selectedMadrasasForBulkAssignment[madrasa.madrasa_id]?.marhalaIds.includes(marhala.marhala_id)} onChange={e => handleMarhalaCheckboxChange(madrasa.madrasa_id, marhala.marhala_id, e.target.checked)} disabled={!selectedMadrasasForBulkAssignment[madrasa.madrasa_id]} wrapperClassName="text-xs" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {hasMoreAssignableMadrasas && (
            <div className="text-center mt-4">
              <Button onClick={() => setAssignableMadrasasPage(p => p + 1)} disabled={isFetchingAssignableMadrasas} > {isFetchingAssignableMadrasas ? 'লোড হচ্ছে...' : 'আরও লোড করুন'} </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8 text-black">কোনো মাদরাসা পাওয়া যায়নি।</div>
      )}
      <div className="mt-6 text-right">
        <Button onClick={handleBulkAssign} disabled={assignMutation.isPending || Object.keys(selectedMadrasasForBulkAssignment).length === 0} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>
          {assignMutation.isPending ? 'এসাইন করা হচ্ছে...' : 'নির্বাচিত মাদরাসা ও মারহালা এসাইন করুন'}
        </Button>
      </div>
    </Card>
  );
};
// --- End of AssignableMadrasaList.tsx ---

// --- Start of AssignmentFilters.tsx ---
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

const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
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
// --- End of AssignmentFilters.tsx ---

// --- Start of MarkazAssignmentPage.tsx ---
const mapMarkazDbRowToFrontendList = (dbRow: MarkazDbRow): Markaz => ({ id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code, hostMadrasaId: dbRow.host_madrasa_id, zoneId: dbRow.zone_id, examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active, createdAt: dbRow.created_at, updatedAt: dbRow.updated_at });
const mapAssignmentDetailDbRowToFrontend = (dbRow: MarkazAssignmentDetailDbRow): any => ({ id: dbRow.assignment_id, markazId: dbRow.markaz_id, examId: dbRow.exam_id, madrasaId: dbRow.madrasa_id, marhalaId: dbRow.marhala_id, createdAt: dbRow.assignment_created_at, madrasaNameBn: dbRow.madrasa_name_bn, madrasaCode: dbRow.madrasa_code, marhalaNameBn: dbRow.marhala_name_bn, marhalaType: dbRow.marhala_type as MarhalaSpecificType });

const MarkazAssignmentPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedMarkazId, setSelectedMarkazId] = useState<string>('');
  
  const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState<boolean>(false);
  const [madrasaToRemoveAllAssignments, setMadrasaToRemoveAllAssignments] = useState<GroupedAssignmentDisplay | null>(null);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [bulkDeleteMadrasaIds, setBulkDeleteMadrasaIds] = useState<string[]>([]);

  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [managingMadrasaDetails, setManagingMadrasaDetails] = useState<GroupedAssignmentDisplay | null>(null);
  const [isCopyAssignmentModalOpen, setIsCopyAssignmentModalOpen] = useState(false);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({
    queryKey: ['activeExamsForAssignment'],
    queryFn: async () => { const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false }); if (error) throw error; return data as Exam[]; }
  });

  const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<Markaz[], Error>({
    queryKey: ['activeMarkazesForAssignment'],
    queryFn: async () => { const { data, error } = await supabase.from('markazes').select('*').eq('is_active', true).order('name_bn'); if (error) throw error; return (data as MarkazDbRow[]).map(mapMarkazDbRowToFrontendList); }
  });

  const { data: assignments = [], isLoading: isLoadingAssignments, refetch: refetchAssignments } = useQuery<any[], Error>({
    queryKey: ['markazAssignments', selectedExamId, selectedMarkazId],
    queryFn: async () => { if (!selectedExamId || !selectedMarkazId) return []; const { data, error } = await supabase.rpc('get_assignments_by_markaz_and_exam_details', { p_exam_id: selectedExamId, p_markaz_id: selectedMarkazId }); if (error) throw error; return (data as MarkazAssignmentDetailDbRow[]).map(mapAssignmentDetailDbRowToFrontend); },
    enabled: !!selectedExamId && !!selectedMarkazId
  });

  const groupedAssignments: GroupedAssignmentDisplay[] = useMemo(() => { if (!assignments || assignments.length === 0) return []; const groups: Record<string, GroupedAssignmentDisplay> = {}; assignments.forEach(asgn => { if (!groups[asgn.madrasaId]) { groups[asgn.madrasaId] = { madrasaId: asgn.madrasaId, madrasaNameBn: asgn.madrasaNameBn, madrasaCode: asgn.madrasaCode, marhalas: [], }; } groups[asgn.madrasaId].marhalas.push({ assignmentId: asgn.id, marhalaId: asgn.marhalaId, marhalaNameBn: asgn.marhalaNameBn, marhalaType: asgn.marhalaType, }); }); return Object.values(groups).sort((a,b) => a.madrasaNameBn.localeCompare(b.madrasaNameBn, 'bn')); }, [assignments]);
  const examOptions: SelectOption[] = useMemo(() => exams.map(ex => ({ value: ex.id, label: ex.name })), [exams]);
  const markazOptions: SelectOption[] = useMemo(() => markazes.map(mk => ({ value: mk.id, label: `${mk.nameBn} ( ${toBengaliNumber(mk.markazCode)})` })), [markazes]);

  const handleAssignmentSuccess = useCallback(() => {
    refetchAssignments();
    queryClient.invalidateQueries({queryKey: ['assignableMadrasasForExam', selectedExamId]});
    queryClient.invalidateQueries({queryKey: ['allAssignmentsForExam', selectedExamId]});
  }, [queryClient, refetchAssignments, selectedExamId]);

  const removeAllAssignmentsForMadrasaMutation = useMutation({
    mutationFn: async (params: { markazId: string; examId: string; madrasaId: string, isBulkOperation?: boolean }) => {
      const { error } = await supabase.rpc('remove_all_assignments_for_madrasa_from_markaz_exam', {
        p_markaz_id: params.markazId,
        p_exam_id: params.examId,
        p_madrasa_id: params.madrasaId
      });
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      if (!variables.isBulkOperation) { // Only show toast if not part of bulk operation
        addToast('মাদরাসার সকল এসাইনমেন্ট সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      }
      handleAssignmentSuccess();
      setIsDeleteConfirmationModalOpen(false);
      setMadrasaToRemoveAllAssignments(null);
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`এসাইনমেন্ট মুছতে ত্রুটি: ${error.message}`, 'error');
      setIsDeleteConfirmationModalOpen(false); // Ensure modal closes even on error
    }
  });

  const handleConfirmRemoveAllAssignments = () => { 
    if (madrasaToRemoveAllAssignments && selectedMarkazId && selectedExamId) { 
      removeAllAssignmentsForMadrasaMutation.mutate({ markazId: selectedMarkazId, examId: selectedExamId, madrasaId: madrasaToRemoveAllAssignments.madrasaId }); 
    }
  };

  const handleOpenBulkDeleteAlert = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
        setBulkDeleteMadrasaIds(selectedIds);
        setIsBulkDeleteAlertOpen(true);
    } else {
        addToast('মুছে ফেলার জন্য কোনো মাদরাসা নির্বাচন করা হয়নি।', 'warning');
    }
  };
  
  const handleConfirmBulkDelete = async () => {
    if (!selectedExamId || !selectedMarkazId || bulkDeleteMadrasaIds.length === 0) return;
    const deletionPromises = bulkDeleteMadrasaIds.map(madrasaId =>
        removeAllAssignmentsForMadrasaMutation.mutateAsync({
            markazId: selectedMarkazId,
            examId: selectedExamId,
            madrasaId: madrasaId,
            isBulkOperation: true // Pass this to suppress individual toasts
        })
    );
    const results = await Promise.allSettled(deletionPromises);
    let successCount = 0;
    const errorMessages: string[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successCount++;
        } else {
            const madrasaId = bulkDeleteMadrasaIds[index];
            const madrasaName = groupedAssignments.find(g => g.madrasaId === madrasaId)?.madrasaNameBn || madrasaId;
            errorMessages.push(`${madrasaName}: ${(result.reason as Error)?.message || 'অজানা ত্রুটি'}`);
        }
    });

    if (successCount > 0) {
        addToast(`${successCount.toLocaleString('bn-BD')} টি মাদরাসার এসাইনমেন্ট সফলভাবে মুছে ফেলা হয়েছে।`, 'success');
    }
    if (errorMessages.length > 0) {
        addToast(`কিছু এসাইনমেন্ট মুছতে সমস্যা হয়েছে:
${errorMessages.join('\n')}`, 'error', 10000);
    }
    
    if (successCount > 0 || errorMessages.length === 0) { // Only refetch if some succeeded or no errors occurred
        handleAssignmentSuccess();
    }
    setIsBulkDeleteAlertOpen(false);
  };

  const copyAssignmentsMutation = useMutation({
    mutationFn: async (params: { sourceExamId: string; targetExamId: string }) => { 
      const { data, error } = await supabase.rpc('copy_markaz_assignments', { p_source_exam_id: params.sourceExamId, p_target_exam_id: params.targetExamId, }); 
      if (error) throw error; return data; 
    }, 
    onSuccess: (data: any, variables) => { 
      const { copied_count, skipped_count } = data; 
      let message = `${copied_count.toLocaleString('bn-BD')} টি এসাইনমেন্ট সফলভাবে কপি করা হয়েছে।`; 
      if (skipped_count > 0) { message += ` ${skipped_count.toLocaleString('bn-BD')} টি এসাইনমেন্ট কপি করা যায়নি।`; addToast(message, 'warning', 7000); 
      } else { addToast(message, 'success'); } 
      if (selectedExamId === variables.targetExamId) {
        handleAssignmentSuccess();
      }
      setIsCopyAssignmentModalOpen(false); 
    }, 
    onError: (error: PostgrestError | Error) => { addToast(`এসাইনমেন্ট কপি করতে ত্রুটি: ${error.message}`, 'error'); setIsCopyAssignmentModalOpen(false); }, 
  });

  const handleCopyAssignments = (sourceExamId: string, targetExamId: string) => { 
    if (!targetExamId) { addToast('প্রথমে একটি লক্ষ্য পরীক্ষা নির্বাচন করুন।', 'error'); return; } 
    if (!sourceExamId) { addToast('কপি করার জন্য একটি উৎস পরীক্ষা নির্বাচন করুন।', 'error'); return; } 
    copyAssignmentsMutation.mutate({ sourceExamId, targetExamId }); 
  };

  const isLoadingInitialData = isLoadingExams || isLoadingMarkazes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">মারকায ভিত্তিক মাদরাসা ও মারহালা নির্ধারণ</h2>
      </div>
      
       <div className="mb-4">
        <Button 
          onClick={() => setIsCopyAssignmentModalOpen(true)} 
          leftIcon={<DocumentDuplicateIcon className="w-4 h-4 mr-1" />} 
          disabled={copyAssignmentsMutation.isPending || isLoadingExams || exams.length === 0}
          variant="outline"
          className="w-full md:w-auto"
        >
          মারকায এসাইনমেন্ট কপি করুন
        </Button>
      </div>

      <div className="md:flex md:space-x-6">
        <div className="md:w-3/5 space-y-6 mb-6 md:mb-0">
          <AssignmentFilters 
            selectedExamId={selectedExamId}
            onExamChange={(id) => { setSelectedExamId(id); setSelectedMarkazId(''); }}
            examOptions={examOptions}
            isLoadingExams={isLoadingExams}
            selectedMarkazId={selectedMarkazId}
            onMarkazChange={setSelectedMarkazId}
            markazOptions={markazOptions}
            isLoadingMarkazes={isLoadingMarkazes}
          />

          {selectedExamId && selectedMarkazId && (
            <AssignableMadrasaList 
              selectedExamId={selectedExamId}
              selectedMarkazId={selectedMarkazId}
              onAssignmentSuccess={handleAssignmentSuccess}
            />
          )}
        </div>
        <div className="md:w-2/5">
          {selectedExamId && selectedMarkazId ? (
            <AssignedMadrasaList 
              isLoading={isLoadingAssignments}
              assignments={groupedAssignments}
              onManage={(group) => { setManagingMadrasaDetails(group); setIsManageModalOpen(true); }}
              onRemove={(group) => { setMadrasaToRemoveAllAssignments(group); setIsDeleteConfirmationModalOpen(true); }}
              onBulkRemove={handleOpenBulkDeleteAlert}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <div className="text-center">
                <ListBulletIcon className="w-12 h-12 mx-auto text-gray-400"/>
                <h3 className="mt-2 text-sm font-medium text-black">তালিকা দেখতে নির্বাচন করুন</h3>
                <p className="mt-1 text-sm text-gray-500">অনুগ্রহ করে প্রথমে একটি পরীক্ষা এবং মারকায নির্বাচন করুন।</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isLoadingInitialData && ( <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50"> <ArrowPathIcon className="w-10 h-10 animate-spin text-emerald-500"/> <span className="ml-3 text-white text-lg">তথ্য লোড হচ্ছে...</span> </div> )}
      
      <DeleteConfirmationModal 
        isOpen={isDeleteConfirmationModalOpen}
        onClose={() => setIsDeleteConfirmationModalOpen(false)}
        onConfirm={handleConfirmRemoveAllAssignments}
        title="সকল এসাইনমেন্ট নিশ্চিতভাবে মুছুন"
        description={`আপনি কি "${madrasaToRemoveAllAssignments?.madrasaNameBn}" মাদরাসার সকল মারহালা এই মারকায থেকে সরাতে চান?`}
        isConfirming={removeAllAssignmentsForMadrasaMutation.isPending}
      />

      <DeleteConfirmationModal 
        isOpen={isBulkDeleteAlertOpen}
        onClose={() => setIsBulkDeleteAlertOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="নির্বাচিত সকল এসাইনমেন্ট মুছুন"
        description={`আপনি কি (${bulkDeleteMadrasaIds.length.toLocaleString('bn-BD')} টি) নির্বাচিত মাদরাসার সকল মারহালা এই মারকায থেকে সরাতে চান?`}
        isConfirming={removeAllAssignmentsForMadrasaMutation.isPending}
      />

      <ManageMarhalaModal 
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        managingMadrasaDetails={managingMadrasaDetails}
        selectedExamId={selectedExamId}
        selectedMarkazId={selectedMarkazId}
        onSuccess={handleAssignmentSuccess}
      />

      {isCopyAssignmentModalOpen && (
        <CopyAssignmentModal 
          isOpen={isCopyAssignmentModalOpen}
          onClose={() => setIsCopyAssignmentModalOpen(false)}
          allExams={exams}
          onCopy={handleCopyAssignments}
          isLoading={copyAssignmentsMutation.isPending}
        />
      )}
    </div>
  );
};

export default MarkazAssignmentPage;