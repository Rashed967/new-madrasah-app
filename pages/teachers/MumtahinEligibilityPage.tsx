import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Teacher, TeacherDbRow, TeacherGeneralDesignation } from '../../types';
import { ArrowPathIcon, CheckBadgeIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const mapTeacherDbRowToFrontendList = (dbRow: TeacherDbRow): Teacher => ({
  id: dbRow.id, teacherCode: dbRow.teacher_code, nameBn: dbRow.name_bn,
  nameEn: dbRow.name_en || undefined, mobile: dbRow.mobile,
  nidNumber: dbRow.nid_number, email: dbRow.email || undefined,
  dateOfBirth: dbRow.date_of_birth, gender: dbRow.gender,
  photoUrl: dbRow.photo_url || undefined,
  paymentInfo: dbRow.payment_info || undefined,
  addressDetails: dbRow.address_details || undefined,
  educationalQualification: dbRow.educational_qualification,
  kitabiQualification: dbRow.kitabi_qualification || [],
  expertiseAreas: dbRow.expertise_areas || undefined,
  notes: dbRow.notes || undefined, isActive: dbRow.is_active,
  // isMumtahinEligible is NOT directly mapped here, it's derived later
  registeredBy: dbRow.registered_by || undefined,
  createdAt: dbRow.created_at, updatedAt: dbRow.updated_at,
});


const MumtahinEligibilityPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const { data: allTeachersData, isLoading: isLoadingTeachers, error: teachersError } = useQuery<
    { items: TeacherDbRow[], totalItems: number }, Error
  >({
    queryKey: ['allTeachersForEligibility'],
    queryFn: async () => {
      const response = await supabase.rpc('get_teachers_list', {
        p_is_active: true, p_limit: 3000, p_page: 1, 
      });
      if (response.error) throw response.error;
      return response.data || { items: [], totalItems: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });
  const allTeachers: Teacher[] = useMemo(() =>
    (allTeachersData?.items || []).map(mapTeacherDbRowToFrontendList),
  [allTeachersData]);

  const { data: mumtahinDesignations = [], isLoading: isLoadingDesignations, error: designationsError, refetch: refetchDesignations } = useQuery<TeacherGeneralDesignation[], Error>({
    queryKey: ['mumtahinDesignations'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('teacher_general_designations')
            .select('*')
            .eq('designation', 'MUMTAHIN_ELIGIBLE');
        if (error) throw error;
        return data || [];
    }
  });

  useEffect(() => {
    if (teachersError) addToast(`শিক্ষক তালিকা আনতে সমস্যা: ${teachersError.message}`, 'error');
    if (designationsError) addToast(`পরীক্ষক যোগ্যতা তথ্য আনতে সমস্যা: ${designationsError.message}`, 'error');
  }, [teachersError, designationsError, addToast]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const teachersWithEligibility: Teacher[] = useMemo(() => {
    const eligibleTeacherIds = new Set(mumtahinDesignations.map(d => d.teacher_id));
    return allTeachers
      .map(teacher => ({
        ...teacher,
        isMumtahinEligible: eligibleTeacherIds.has(teacher.id),
      }))
      .filter(teacher => 
        teacher.nameBn.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        teacher.teacherCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        teacher.mobile.includes(debouncedSearchTerm)
      )
      .sort((a,b) => a.teacherCode.localeCompare(b.teacherCode));
  }, [allTeachers, mumtahinDesignations, debouncedSearchTerm]);

  const setEligibilityMutation = useMutation({
    mutationFn: async ({ teacherId, isEligible }: { teacherId: string, isEligible: boolean }) => {
      const { error } = await supabase.rpc('set_teacher_mumtahin_eligibility', {
        p_teacher_id: teacherId,
        p_is_eligible: isEligible,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      addToast(`শিক্ষকের পরীক্ষক যোগ্যতা সফলভাবে ${variables.isEligible ? 'নির্ধারণ' : 'বাতিল'} করা হয়েছে।`, 'success');
      refetchDesignations(); // Refetch designations to update the list
      queryClient.invalidateQueries({ queryKey: ['mumtahinDesignations'] }); 
    },
    onError: (error: PostgrestError | Error) => {
      addToast(`যোগ্যতা পরিবর্তনে ত্রুটি: ${error.message}`, 'error');
    }
  });

  const handleToggleEligibility = (teacherId: string, currentEligibility: boolean) => {
    setEligibilityMutation.mutate({ teacherId, isEligible: !currentEligibility });
  };

  if (isLoadingTeachers || isLoadingDesignations) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mr-3" />
        <p className="text-xl text-gray-700">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800 flex items-center">
          <CheckBadgeIcon className="w-8 h-8 mr-3 text-emerald-600" />
          পরীক্ষক যোগ্যতা নির্ধারণ
        </h2>
      </div>

      <Card>
        <div className="p-4 border-b">
          <Input
            placeholder="শিক্ষকের নাম, কোড বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            wrapperClassName="mb-0"
          />
        </div>
        <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
          {teachersWithEligibility.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {teachersWithEligibility.map((teacher) => (
                <li key={teacher.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-md font-semibold text-emerald-700">{teacher.nameBn}</p>
                      <p className="text-sm text-gray-600">কোড: {teacher.teacherCode} | মোবাইল: {teacher.mobile}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                       <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${teacher.isMumtahinEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {teacher.isMumtahinEligible ? 'পরীক্ষক যোগ্য' : 'পরীক্ষক নন'}
                       </span>
                       <Switch
                        id={`eligibility-${teacher.id}`}
                        checked={teacher.isMumtahinEligible || false}
                        onChange={() => handleToggleEligibility(teacher.id, teacher.isMumtahinEligible || false)}
                        disabled={setEligibilityMutation.isPending && setEligibilityMutation.variables?.teacherId === teacher.id}
                        srOnlyLabel={`${teacher.nameBn} এর পরীক্ষক যোগ্যতা`}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">
              {debouncedSearchTerm ? `"${debouncedSearchTerm}" এর সাথে মিলে কোনো শিক্ষক পাওয়া যায়নি।` : 'কোনো শিক্ষক পাওয়া যায়নি।'}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MumtahinEligibilityPage;