
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useInfiniteQuery
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select'; 
import { SearchableSelect, SearchableSelectOption } from '../../components/ui/SearchableSelect'; 
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Checkbox } from '../../components/ui/Checkbox';
import { Tabs } from '../../components/ui/Tabs';
import { Exam, Markaz, Teacher, ExamPersonnelAssignment, AssignedPersonnelRole, NegranType, SelectOption as GlobalSelectOption, MarkazDbRow, TeacherDbRow } from '../../types'; 
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { PlusCircleIcon, TrashIcon, ArrowPathIcon, CheckCircleIcon as AssignIcon, UserGroupIcon, UsersIcon as MumtahinIcon, MagnifyingGlassIcon, ListBulletIcon } from '../../components/ui/Icon'; // Removed BuildingOffice2Icon as it's unused now
import { NEGRAN_TYPE_OPTIONS } from '../../constants';
import type { PostgrestError } from '@supabase/supabase-js';

// --- Mappers ---
const mapExamDbToFrontend = (dbExam: any): Exam => ({
    id: dbExam.id, name: dbExam.name, registrationDeadline: dbExam.registration_deadline,
    startingRegistrationNumber: dbExam.starting_registration_number,
    registrationFeeRegular: dbExam.registration_fee_regular,
    registrationFeeIrregular: dbExam.registration_fee_irregular,
    lateRegistrationFeeRegular: dbExam.late_registration_fee_regular,
    lateRegistrationFeeIrregular: dbExam.late_registration_fee_irregular,
    examFees: (dbExam.exam_marhala_fees || []).map((f: any) => ({
        marhalaId: f.marhala_id, startingRollNumber: f.starting_roll_number,
        regularFee: f.regular_fee, irregularFee: f.irregular_fee,
        lateRegularFee: f.late_regular_fee, lateIrregularFee: f.late_irregular_fee,
    })),
    isActive: dbExam.is_active, status: dbExam.status as Exam['status'],
    createdAt: dbExam.created_at, updatedAt: dbExam.updated_at,
});

const mapMarkazDbRowToFrontendList = (dbRow: MarkazDbRow): Markaz => ({
    id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code,
    hostMadrasaId: dbRow.host_madrasa_id, zoneId: dbRow.zone_id,
    examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active,
    createdAt: dbRow.created_at, updatedAt: dbRow.updated_at
});

const mapTeacherDbRowToFrontendList = (dbRow: TeacherDbRow): Teacher => ({
  id: dbRow.id, teacherCode: dbRow.teacher_code, nameBn: dbRow.name_bn,
  nameEn: dbRow.name_en || undefined, mobile: dbRow.mobile,
  nidNumber: dbRow.nid_number, email: dbRow.email || undefined,
  dateOfBirth: dbRow.date_of_birth, gender: dbRow.gender,
  addressDetails: dbRow.address_details || undefined,
  educationalQualification: dbRow.educational_qualification,
  kitabiQualification: dbRow.kitabi_qualification || [],
  expertiseAreas: dbRow.expertise_areas || undefined,
  notes: dbRow.notes || undefined, isActive: dbRow.is_active,
  registeredBy: dbRow.registered_by || undefined,
  createdAt: dbRow.created_at, updatedAt: dbRow.updated_at,
  photoUrl: dbRow.photo_url || undefined,
  paymentInfo: dbRow.payment_info || undefined,
});


type AssignmentMode = 'negran' | 'mumtahin';

interface CreateAssignmentVariable {
  teacherId: string;
  negranType?: NegranType | null;
  teacherName: string; 
}

const getRoleLabel = (role: AssignedPersonnelRole) => {
  if (role === 'mumtahin') return 'মুমতাহিন';
  if (role === 'negran') return 'নেগরান';
  return role;
};


const ExamTeacherAssignmentPage: React.FC = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('negran');
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedMarkazId, setSelectedMarkazId] = useState<string | null>(null); 

    const [selectedTeacherIdsToAssign, setSelectedTeacherIdsToAssign] = useState<string[]>([]);
    const [assignmentNegranType, setAssignmentNegranType] = useState<NegranType | ''>(''); 

    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false);
    const [teacherToRemove, setTeacherToRemove] = useState<ExamPersonnelAssignment | null>(null);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState<boolean>(false);

    const [searchTermAvailable, setSearchTermAvailable] = useState<string>('');
    const [debouncedSearchTermAvailable, setDebouncedSearchTermAvailable] = useState<string>('');
    const availableTeachersListRef = useRef<HTMLDivElement>(null);


    const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[], Error>({
        queryKey: ['activeExamsForTeacherAssignmentPage'],
        queryFn: async () => {
            const { data, error } = await supabase.from('exams').select('*, exam_marhala_fees(*)').eq('is_active', true).order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapExamDbToFrontend);
        }
    });

    const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<Markaz[], Error>({
        queryKey: ['activeMarkazesForTeacherAssignmentPage'],
        queryFn: async () => {
            const { data, error } = await supabase.from('markazes').select('*').eq('is_active', true).order('name_bn');
            if (error) throw error;
            return (data as MarkazDbRow[]).map(mapMarkazDbRowToFrontendList);
        }
    });
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTermAvailable(searchTermAvailable);
        }, 500); // Debounce search term
        return () => clearTimeout(handler);
    }, [searchTermAvailable]);

    const fetchAvailableTeachers = async ({ pageParam = 1 }) => {
        if (!selectedExamId) return { items: [], total_items: 0, nextPage: undefined };
        
        const { data, error } = await supabase.rpc('search_available_teachers_for_assignment', {
            p_search_term: debouncedSearchTermAvailable.trim() || null,
            p_exam_id: selectedExamId,
            p_assigned_role: assignmentMode,
            p_page: pageParam,
            p_limit: 15 
        });
        if (error) throw error;
        return { 
            items: (data.items || []).map(mapTeacherDbRowToFrontendList), 
            total_items: data.total_items || 0,
            nextPage: (data.items || []).length === 15 ? pageParam + 1 : undefined
        };
    };

    const {
        data: availableTeachersData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingAvailableTeachers,
        refetch: refetchAvailableTeachers,
    } = useInfiniteQuery({
        queryKey: ['availableTeachersForAssignment', selectedExamId, assignmentMode, debouncedSearchTermAvailable],
        queryFn: fetchAvailableTeachers,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        enabled: !!selectedExamId,
    });
    
    const allFetchedAvailableTeachers: Teacher[] = useMemo(() => 
        availableTeachersData?.pages.flatMap(page => page.items) || [],
    [availableTeachersData]);

    const { data: assignedPersonnelQueryData, isLoading: isLoadingAssignedPersonnel, refetch: refetchAssignedPersonnel } = useQuery<
        { assignments: any[], totalItems: number }, Error
    >({
        queryKey: ['examPersonnelAssignments', selectedExamId, assignmentMode, selectedMarkazId],
        queryFn: async () => {
            if (!selectedExamId) return { assignments: [], totalItems: 0 };

            if (assignmentMode === 'mumtahin') {
                const { data, error } = await supabase.rpc('get_general_mumtahins_for_exam', { p_exam_id: selectedExamId });
                if (error) throw error;
                return data || { assignments: [], totalItems: 0 };
            } else if (assignmentMode === 'negran' && selectedMarkazId) {
                 const { data, error } = await supabase.rpc('get_exam_personnel_assignments', {
                    p_exam_id: selectedExamId,
                    p_markaz_id: selectedMarkazId,
                });
                if (error) throw error;
                const filteredAssignments = (data.assignments || []).filter((item: any) => item.assigned_role === 'negran');
                return { assignments: filteredAssignments, totalItems: filteredAssignments.length };
            }
            return { assignments: [], totalItems: 0 };
        },
        enabled: !!selectedExamId && (assignmentMode === 'mumtahin' || (assignmentMode === 'negran' && !!selectedMarkazId)),
    });
    
    const assignedPersonnelList: ExamPersonnelAssignment[] = useMemo(() =>
        (assignedPersonnelQueryData?.assignments || []).map((item: any) => ({
            id: item.assignment_id,
            examId: selectedExamId,
            markazId: assignmentMode === 'mumtahin' ? undefined : (item.markaz_id || selectedMarkazId || undefined),
            personnelId: item.personnel_id,
            assignedRole: item.assigned_role,
            assignedMarhalaId: undefined,
            negranType: item.negran_type || undefined,
            personnelNameBn: item.personnel_name_bn,
            personnelCode: item.personnel_code,
            assignedMarhalaNameBn: undefined,
            educationalQualification: item.educational_qualification_name_bn,
            kitabiQualification: Array.isArray(item.kitabi_qualification_names)
                ? item.kitabi_qualification_names
                : (typeof item.kitabi_qualification_names === 'string' && item.kitabi_qualification_names.trim() !== ''
                    ? item.kitabi_qualification_names.split(',').map((s: string) => s.trim())
                    : []),
            personnelMobile: item.personnel_mobile,
            createdAt: item.assignment_created_at,
        } as ExamPersonnelAssignment)),
    [assignedPersonnelQueryData, selectedExamId, selectedMarkazId, assignmentMode]);


    const examOptions: GlobalSelectOption[] = useMemo(() => exams.map(ex => ({ value: ex.id, label: ex.name })), [exams]);
    const markazOptionsForSearchableSelect: SearchableSelectOption[] = useMemo(() =>
        markazes.map(mk => ({
            value: mk.id,
            label: `${mk.nameBn} (কোড: ${mk.markazCode.toLocaleString('bn-BD')})`,
            code: mk.markazCode 
        })),
    [markazes]);


    useEffect(() => {
        setSelectedTeacherIdsToAssign([]);
        setSearchTermAvailable('');
        if (assignmentMode === 'negran') {
             setSelectedMarkazId(null);
        } else if (assignmentMode === 'mumtahin') {
            setSelectedMarkazId(null);
        }
        setAssignmentNegranType('');
        refetchAvailableTeachers(); // Refetch available teachers when exam or mode changes
    }, [selectedExamId, assignmentMode, refetchAvailableTeachers]);

    useEffect(() => {
        if (assignmentMode === 'negran') {
            setSelectedTeacherIdsToAssign([]);
            setSearchTermAvailable('');
            refetchAvailableTeachers(); // Refetch for negran mode if markaz changes
        }
    }, [selectedMarkazId, assignmentMode, refetchAvailableTeachers]);

     const createAssignmentMutation = useMutation<any[], Error, CreateAssignmentVariable[]>({
        mutationFn: async (variables: CreateAssignmentVariable[]) => {
          const results = await Promise.allSettled(
            variables.map(v =>
              supabase.rpc('create_exam_personnel_assignment', {
                p_exam_id: selectedExamId,
                p_markaz_id: assignmentMode === 'negran' ? selectedMarkazId : null,
                p_personnel_id: v.teacherId,
                p_assigned_role: assignmentMode,
                p_negran_type: assignmentMode === 'negran' ? v.negranType : null,
              }).then(response => {
                if (response.error) {
                  throw response.error;
                }
                return response.data;
              })
            )
          );
          const rejectedP0001 = results.find(r => r.status === 'rejected' && (r.reason as PostgrestError)?.code === 'P0001');
          if (rejectedP0001) { throw (rejectedP0001 as PromiseRejectedResult).reason; }
          
          const firstOtherRejection = results.find(r => r.status === 'rejected');
          if (firstOtherRejection) { throw (firstOtherRejection as PromiseRejectedResult).reason; }
          
          return results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
        },
        onSuccess: (data, variables) => {
          const successfulAssignments = data.filter(d => d !== null && d !== undefined); 
            if (successfulAssignments.length > 0) {
                addToast(`${successfulAssignments.length.toLocaleString('bn-BD')} জন ব্যক্তিকে সফলভাবে "${getRoleLabel(assignmentMode)}" হিসেবে নিয়োগ দেওয়া হয়েছে।`, 'success');
            } else if (variables.length > 0) { 
                addToast('কোনো নতুন নিয়োগ সম্পন্ন হয়নি অথবা কোনোটিই সফল হয়নি। অনুগ্রহ করে বিস্তারিত চেক করুন।', 'warning');
            }
            refetchAssignedPersonnel();
            refetchAvailableTeachers(); 
            setSelectedTeacherIdsToAssign([]);
            setIsAssignmentModalOpen(false);
            setAssignmentNegranType('');
            queryClient.invalidateQueries({ queryKey: ['groupedNegransByExam', selectedExamId] });
            queryClient.invalidateQueries({ queryKey: ['allMumtahinsForExam', selectedExamId] });
        },
        onError: (error: Error | PostgrestError) => {
            let userMessage = `নিয়োগে সমস্যা: ${error.message || 'একটি অজানা ত্রুটি ঘটেছে।'}`;
            if (error && typeof error === 'object' && 'code' in error) {
                const pgError = error as PostgrestError;
                if (pgError.code === 'P0001' && pgError.message) { userMessage = pgError.message; }
                else if (pgError.code === '23505') { userMessage = `এই শিক্ষক ইতিমধ্যে এই পরীক্ষার জন্য এই ভূমিকায় (${getRoleLabel(assignmentMode)}) নিয়োগপ্রাপ্ত আছেন অথবা অন্য কোনো ডেটা ডুপ্লিকেট হয়েছে। বিস্তারিত: ${pgError.message}`; }
            }
            addToast(userMessage, 'error', 7000);
            refetchAssignedPersonnel();
            refetchAvailableTeachers(); 
            setSelectedTeacherIdsToAssign([]); 
        }
    });

    const removeAssignmentMutation = useMutation<any, Error, string>({
        mutationFn: async (assignmentId) => {
            const { error } = await supabase.rpc('remove_exam_personnel_assignment', { p_assignment_id: assignmentId });
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('নিয়োগ সফলভাবে বাতিল করা হয়েছে।', 'success');
            refetchAssignedPersonnel();
            refetchAvailableTeachers(); 
            setIsRemoveConfirmOpen(false);
            setTeacherToRemove(null);
            queryClient.invalidateQueries({ queryKey: ['groupedNegransByExam', selectedExamId] });
            queryClient.invalidateQueries({ queryKey: ['allMumtahinsForExam', selectedExamId] });
        },
        onError: (error: PostgrestError | Error) => { addToast(`বাতিল করতে সমস্যা: ${error.message}`, 'error');}
    });
    
    const handleAssignSubmit = () => {
        if (selectedTeacherIdsToAssign.length === 0) { addToast('নিয়োগের জন্য শিক্ষক নির্বাচন করুন।', 'warning'); setIsAssignmentModalOpen(false); return; }
        if (assignmentMode === 'negran') {
            if (!selectedMarkazId) { addToast('নেগরান নিয়োগের জন্য মারকায নির্বাচন করুন।', 'error'); setIsAssignmentModalOpen(false); return; }
            if (!assignmentNegranType) { addToast('নেগরানের জন্য ধরণ (প্রধান/সহকারী) নির্বাচন করুন।', 'error'); return; } 
            if (assignmentNegranType === 'head' && selectedTeacherIdsToAssign.length > 1) {
                addToast('একই সাথে একাধিক শিক্ষককে প্রধান নেগরান হিসেবে নিয়োগ দেওয়া যাবে না। অনুগ্রহ করে একজন শিক্ষক নির্বাচন করুন।', 'error', 7000);
                setIsAssignmentModalOpen(false); 
                return;
            }
        }
        const assignmentsToCreatePayload = selectedTeacherIdsToAssign.map(teacherId => {
            const teacher = allFetchedAvailableTeachers.find(t => t.id === teacherId); // Search in fetched teachers
            return {
                teacherId: teacherId,
                negranType: assignmentMode === 'negran' ? assignmentNegranType as NegranType : null,
                teacherName: teacher?.nameBn || 'শিক্ষক'
            } as CreateAssignmentVariable;
        });
        createAssignmentMutation.mutate(assignmentsToCreatePayload);
    };

    const handleOpenAssignmentModal = () => {
        if(selectedTeacherIdsToAssign.length === 0) { addToast('অনুগ্রহ করে নিয়োগের জন্য শিক্ষক নির্বাচন করুন।', 'warning'); return; }
        
        if (assignmentMode === 'negran') {
             if (assignmentNegranType === 'head' && selectedTeacherIdsToAssign.length > 1) {
                addToast('একই সাথে একাধিক শিক্ষককে প্রধান নেগরান হিসেবে নিয়োগ দেওয়া যাবে না। অনুগ্রহ করে একজন শিক্ষক নির্বাচন করুন।', 'warning', 7000);
                return; 
            }
            setIsAssignmentModalOpen(true);
        } else if (assignmentMode === 'mumtahin') {
            handleAssignSubmit();
        }
    };


    const handleRemoveAssignment = (assignment: ExamPersonnelAssignment) => { setTeacherToRemove(assignment); setIsRemoveConfirmOpen(true); };
    const confirmRemoveAssignment = () => { if (teacherToRemove) removeAssignmentMutation.mutate(teacherToRemove.id); };
    const getNegranTypeLabel = (type?: NegranType) => { if (!type) return ''; const option = NEGRAN_TYPE_OPTIONS.find(opt => opt.value === type); return option ? option.label : type; };
    const formatDateBn = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

    const isLoadingCoreData = isLoadingExams || isLoadingMarkazes;
    
    const TopControlsComponent = () => (
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select label="পরীক্ষা নির্বাচন করুন" value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setSelectedMarkazId(null); }} options={examOptions} placeholderOption="-- পরীক্ষা নির্বাচন করুন --" required disabled={isLoadingExams} wrapperClassName="mb-0"/>
            {assignmentMode === 'negran' && ( 
              <SearchableSelect
                id="markazSelectAssignment"
                label="মারকায নির্বাচন করুন"
                options={markazOptionsForSearchableSelect}
                value={selectedMarkazId}
                onChange={(val) => setSelectedMarkazId(val)}
                placeholder="মারকায খুঁজুন বা নির্বাচন করুন..."
                disabled={!selectedExamId || isLoadingMarkazes}
                required
                wrapperClassName="mb-0"
              />
            )}
        </div>
      </div>
    );
    
    const AssignmentPanelsComponent = () => (
        <>
            {selectedExamId && (assignmentMode === 'negran' ? !!selectedMarkazId : true) ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <Card bodyClassName="p-0">
                        <div className="p-4 border-b">
                            <div className="flex items-center mb-1">
                                <ListBulletIcon className="w-5 h-5 mr-2 text-emerald-600" />
                                <h3 className="text-md font-semibold text-gray-700">{assignmentMode === 'negran' ? 'নেগরান নির্বাচন' : 'মুমতাহিন নির্বাচন'}</h3>
                            </div>
                            <p className="text-xs text-gray-500">উপলব্ধ শিক্ষকদের থেকে {getRoleLabel(assignmentMode)} নিয়োগ দিন</p>
                        </div>
                        <div className="p-4 space-y-3">
                            <Input icon={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />} placeholder="নাম বা কোড দিয়ে খুঁজুন..." value={searchTermAvailable} onChange={e => setSearchTermAvailable(e.target.value)} wrapperClassName="mb-0" />
                            <Checkbox
                                id="selectAllAvailableTeachers"
                                label="সবাইকে নির্বাচন/বাতিল করুন"
                                checked={allFetchedAvailableTeachers.length > 0 && selectedTeacherIdsToAssign.length === allFetchedAvailableTeachers.length && allFetchedAvailableTeachers.every(t => selectedTeacherIdsToAssign.includes(t.id))}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    if (checked) {
                                        setSelectedTeacherIdsToAssign(allFetchedAvailableTeachers.map(t => t.id));
                                    } else {
                                        setSelectedTeacherIdsToAssign([]);
                                    }
                                }}
                                disabled={allFetchedAvailableTeachers.length === 0 || isLoadingAvailableTeachers}
                            />
                        </div>
                        <div className="p-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">উপলব্ধ শিক্ষকগণ (মোট: {availableTeachersData?.pages[0]?.total_items.toLocaleString('bn-BD') || '০'})</p>
                            <div ref={availableTeachersListRef} className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                {isLoadingAvailableTeachers && allFetchedAvailableTeachers.length === 0 ? <p className="text-center py-4 text-gray-500">শিক্ষক তালিকা লোড হচ্ছে...</p> : allFetchedAvailableTeachers.length > 0 ? allFetchedAvailableTeachers.map(person => (
                                    <div key={person.id} className={`flex items-center justify-between p-2.5 border rounded-md shadow-sm transition-colors ${selectedTeacherIdsToAssign.includes(person.id) ? 'bg-emerald-50 border-emerald-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                                        <div>
                                          <p className="font-medium text-gray-800 text-sm">{person.nameBn} <span className="text-xs text-gray-500">({person.teacherCode})</span></p>
                                          <p className="text-xs text-gray-600">মোবাইল: {person.mobile}</p>
                                        </div>
                                        <Checkbox id={`assign-${person.id}`} checked={selectedTeacherIdsToAssign.includes(person.id)} onChange={e => { const checked = e.target.checked; setSelectedTeacherIdsToAssign(prev => checked ? [...prev, person.id] : prev.filter(id => id !== person.id)); }} />
                                    </div>
                                )) : <p className="text-gray-500 text-sm text-center py-4">এই মুহুর্তে কোনো উপলব্ধ {getRoleLabel(assignmentMode)} নেই অথবা সকলে ইতিমধ্যে এই পরীক্ষার জন্য এই ভূমিকায় নিয়োগপ্রাপ্ত। নতুন শিক্ষক খুঁজতে অনুগ্রহ করে সার্চ করুন।</p>}
                                {hasNextPage && (
                                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" size="sm" className="w-full mt-2">
                                        {isFetchingNextPage ? 'লোড হচ্ছে...' : 'আরও লোড করুন'}
                                    </Button>
                                )}
                            </div>
                            <div className="mt-4 flex justify-end"> <Button onClick={handleOpenAssignmentModal} disabled={selectedTeacherIdsToAssign.length === 0 || createAssignmentMutation.isPending} leftIcon={<PlusCircleIcon className="w-4 h-4"/>} size="sm">নির্বাচিতদের ({selectedTeacherIdsToAssign.length.toLocaleString('bn-BD')}) এসাইন করুন</Button> </div>
                        </div>
                    </Card>

                    <Card bodyClassName="p-0">
                        <div className="p-4 border-b">
                            <div className="flex items-center mb-1">
                                 <UserGroupIcon className="w-5 h-5 mr-2 text-emerald-600" />
                                <h3 className="text-md font-semibold text-gray-700">নিয়োগকৃত {getRoleLabel(assignmentMode)}গণ</h3>
                            </div>
                             <p className="text-xs text-gray-500">পরীক্ষা: {exams.find(e=>e.id === selectedExamId)?.name || 'N/A'}
                               {assignmentMode === 'negran' && selectedMarkazId && `, মারকায: ${markazes.find(m=>m.id === selectedMarkazId)?.nameBn || 'N/A'}`}
                             </p>
                        </div>
                        <div className="p-4">
                            <div className="max-h-[calc(100vh-24rem)] overflow-y-auto space-y-2 pr-1">
                                {isLoadingAssignedPersonnel ? <p className="text-center py-4 text-gray-500">নিয়োগ তালিকা লোড হচ্ছে...</p> : assignedPersonnelList.length > 0 ? assignedPersonnelList.map(assign => (
                                    <div key={assign.id} className="p-2.5 border rounded-md bg-white shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{assign.personnelNameBn} <span className="text-xs text-gray-500">({assign.personnelCode})</span></p>
                                                {assign.assignedRole === 'negran' && assign.negranType && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full my-0.5 inline-block ${assign.negranType === 'head' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{getNegranTypeLabel(assign.negranType)}</span>}
                                                <p className="text-xs text-gray-500">নিয়োগের তারিখ: {formatDateBn(assign.createdAt)}</p>
                                            </div>
                                            <Button variant="danger" size="sm" onClick={() => handleRemoveAssignment(assign)} leftIcon={<TrashIcon className="w-3 h-3"/>} className="px-2 py-0.5 text-xs" disabled={removeAssignmentMutation.isPending && teacherToRemove?.id === assign.id}>বাতিল</Button>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-500 text-sm text-center py-4">এই পরীক্ষা {assignmentMode === 'negran' && selectedMarkazId ? 'ও মারকাযে' : ''} এখনও কোনো {getRoleLabel(assignmentMode)} নিয়োগ করা হয়নি।</p>}
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                 <Card className="mt-4"><p className="text-center text-gray-500 py-10">নিয়োগের জন্য অনুগ্রহ করে প্রথমে একটি পরীক্ষা {assignmentMode === 'negran' ? 'ও মারকায' : ''} নির্বাচন করুন।</p></Card>
            )}
        </>
    );
    
    const NegranAssignmentContent = () => (<><TopControlsComponent /><AssignmentPanelsComponent /></>);
    const MumtahinAssignmentContent = () => (<><TopControlsComponent /><AssignmentPanelsComponent /></>);
    
    const tabs = [
        { id: 'negran' as AssignmentMode, label: 'নেগরান নিয়োগ', icon: <UserGroupIcon className="w-4 h-4" />, content: <NegranAssignmentContent /> },
        { id: 'mumtahin' as AssignmentMode, label: 'মুমতাহিন নিয়োগ', icon: <MumtahinIcon className="w-4 h-4" />, content: <MumtahinAssignmentContent /> }
    ];

    if (isLoadingCoreData) {
        return <div className="flex justify-center items-center h-64"><ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin mr-2" /><p>তথ্য লোড হচ্ছে...</p></div>;
    }

    return (
        <div className="space-y-6">
            <Tabs tabs={tabs} activeTabId={assignmentMode} onTabChange={(id) => setAssignmentMode(id as AssignmentMode)} tabListClassName="flex border-b border-gray-300 bg-white rounded-t-lg shadow" tabButtonClassName="py-3 px-5 font-medium text-sm text-center border-b-2 transition-colors duration-150 flex items-center focus:outline-none" activeTabButtonClassName="border-emerald-500 text-emerald-600" inactiveTabButtonClassName="border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-300"/>
            <Modal 
              isOpen={isAssignmentModalOpen && assignmentMode === 'negran'} 
              onClose={() => setIsAssignmentModalOpen(false)} 
              title="নেগরানের ধরণ নির্বাচন করুন" 
              size="md" 
              footer={<><Button variant="secondary" onClick={() => setIsAssignmentModalOpen(false)}>বাতিল</Button><Button onClick={handleAssignSubmit} disabled={createAssignmentMutation.isPending || !assignmentNegranType} leftIcon={<AssignIcon className="w-5 h-5"/>}>{createAssignmentMutation.isPending ? 'এসাইন করা হচ্ছে...' : 'নিশ্চিত করুন'}</Button></>}
            >
                <div className="space-y-4"> 
                    <p className="text-sm text-gray-700">আপনি কি নিশ্চিত যে আপনি {selectedTeacherIdsToAssign.length.toLocaleString('bn-BD')} জন শিক্ষককে "নেগরান" হিসেবে নিয়োগ দিতে চান? অনুগ্রহ করে তাদের ধরণ নির্বাচন করুন।</p> 
                    <Select 
                      label="নেগরানের ধরণ" 
                      value={assignmentNegranType} 
                      onChange={e => setAssignmentNegranType(e.target.value as NegranType | '')} 
                      options={NEGRAN_TYPE_OPTIONS.filter(opt => opt.value !== '')} 
                      placeholderOption="ধরণ নির্বাচন করুন..." 
                      required
                      error={!assignmentNegranType && isAssignmentModalOpen ? 'নেগরানের ধরণ নির্বাচন আবশ্যক।': undefined}
                    /> 
                </div>
            </Modal>
            {teacherToRemove && (<AlertDialog isOpen={isRemoveConfirmOpen} onClose={() => setIsRemoveConfirmOpen(false)} onConfirm={confirmRemoveAssignment} title="নিয়োগ বাতিল নিশ্চিত করুন" description={`আপনি কি "${teacherToRemove.personnelNameBn || 'নামবিহীন ব্যক্তি'}" এর (${getRoleLabel(teacherToRemove.assignedRole)}) নিয়োগটি বাতিল করতে চান?`} confirmButtonText={removeAssignmentMutation.isPending ? "বাতিল হচ্ছে..." : "হ্যাঁ, বাতিল করুন"}/>)}
        </div>
    );
};

export default ExamTeacherAssignmentPage;