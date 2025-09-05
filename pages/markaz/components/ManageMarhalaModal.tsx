
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { toBengaliNumber } from '../../../lib/utils';
import { GroupedAssignmentDisplay, Marhala, MarhalaSpecificType, Madrasa, MarkazAssignmentDetailDbRow, FrontendMarhalaApiResponse, MadrasaDbRow } from '../../../types';

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

interface ManageMarhalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  managingMadrasaDetails: GroupedAssignmentDisplay | null;
  selectedExamId: string;
  selectedMarkazId: string;
  onSuccess: () => void;
}

export const ManageMarhalaModal: React.FC<ManageMarhalaModalProps> = ({
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
