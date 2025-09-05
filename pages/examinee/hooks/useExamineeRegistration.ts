import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../../constants';
import { useToast } from '../../../contexts/ToastContext';
import { Examinee, Exam, Madrasa, RegistrationFeeCollection, Marhala, StudentType, SelectOption, MadrasaDbRow, MarhalaApiResponse, RegistrationFeeMarhalaStudentCountDb, RegistrationFeePaymentDbDetail, MarhalaSpecificType } from '../../../types';
import type { PostgrestError } from '@supabase/supabase-js';

// --- Mappers ---

const mapMadrasaDbRowToFrontend = (dbRow: Partial<MadrasaDbRow>): Madrasa => ({
  id: dbRow.id!, madrasaCode: dbRow.madrasa_code!, nameBn: dbRow.name_bn!, nameAr: dbRow.name_ar || '',
  address: { village: dbRow.address?.village || '', upazila: dbRow.address?.upazila || '', district: dbRow.address?.district || '', division: dbRow.address?.division || '', contactPersonName: dbRow.address?.contact_person_name || '' },
  zoneId: dbRow.zone_id || '', mobile1: dbRow.mobile1 || '', type: dbRow.type || 'boys',
  dispatchMethod: dbRow.dispatch_method || 'courier',
  highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined,
  highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
  muhtamim: { name: dbRow.muhtamim?.name || '', mobile: dbRow.muhtamim?.mobile || '' }, registrationDate: dbRow.registration_date || new Date().toISOString()
});

const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn, nameAr: apiMarhala.name_ar || undefined,
  type: apiMarhala.type, category: apiMarhala.category, kitabIds: apiMarhala.kitab_ids || [],
  marhala_order: apiMarhala.marhala_order, requiresPhoto: apiMarhala.requires_photo || false, createdAt: apiMarhala.created_at,
  updatedAt: apiMarhala.updated_at, 
});

const mapDbRegFeeCollectionToFrontend = (dbItem: any): RegistrationFeeCollection => ({
  id: dbItem.id,
  examId: dbItem.exam_id,
  examName: dbItem.exam_name,
  madrasaId: dbItem.madrasa_id,
  madrasaNameBn: dbItem.madrasa_name_bn,
  madrasaCode: dbItem.madrasa_code,
  applyLateFee: dbItem.apply_late_fee,
  marhalaStudentCounts: (dbItem.marhala_student_counts || []).map((msc: RegistrationFeeMarhalaStudentCountDb) => ({
    marhalaId: msc.marhala_id,
    marhalaNameBn: msc.marhala_name_bn, 
    regularStudents: Number(msc.regular_students),
    irregularStudents: Number(msc.irregular_students),
    calculatedFee: Number(msc.calculated_fee_for_marhala),
    displayedRegNoStart: msc.registration_number_range_start,
    displayedRegNoEnd: msc.registration_number_range_end,   
  })),
  payments: (dbItem.payments || []).map((p: RegistrationFeePaymentDbDetail) => ({
    id: p.id, method: p.method, amount: Number(p.amount), paymentDate: p.payment_date,
    transactionId: p.transaction_id, bankName: p.bank_name, branchName: p.branch_name,
    accountNumber: p.account_number, checkNumber: p.check_number,
    mobileBankingProvider: p.mobile_banking_provider, senderNumber: p.sender_number,
    receiverNumber: p.receiver_number, notes: p.notes,
  })),
  totalCalculatedFee: Number(dbItem.total_calculated_fee),
  totalPaidAmount: Number(dbItem.total_paid_amount),
  balanceAmount: Number(dbItem.balance_amount),
  collectionDate: dbItem.collection_date,
  createdAt: dbItem.created_at,
});

const formatDateForDropdown = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return 'অবৈধ তারিখ'; }
};


export interface SingleExamineeFormData {
  registrationNumberDisplay: string; 
  studentType: StudentType | '';
  nameBn: string; nameAr: string; nameEn: string;
  fatherNameBn: string; fatherNameAr: string; fatherNameEn: string;
  motherNameBn: string; motherNameAr: string; motherNameEn: string;
  dateOfBirth: string;
  nidOrBirthCert: string;
  photoFile?: File | null; 
  pastYearRoll?: string;
  pastYearMarhala?: string;
  pastExamYear?: string;
  pastYearTotalNumber?: string;
  pastYearDivision?: string;
  pastYearComment?: string;
}

export const initialSingleExamineeFormData: SingleExamineeFormData = {
  registrationNumberDisplay: 'মারহালা নির্বাচন করুন', studentType: '', nameBn: '', nameAr: '', nameEn: '',
  fatherNameBn: '', fatherNameAr: '', fatherNameEn: '', motherNameBn: '', motherNameAr: '', motherNameEn: '',
  dateOfBirth: '', nidOrBirthCert: '', photoFile: null,
  pastYearRoll: '', pastYearMarhala: '', pastExamYear: '', pastYearTotalNumber: '', pastYearDivision: '', pastYearComment: '',
};

export interface MarhalaSummary {
  marhalaId: string;
  marhalaName: string;
  totalRegularSlots: number;
  totalIrregularSlots: number;
  registeredRegular: number;
  registeredIrregular: number;
  availableRegular: number;
  availableIrregular: number;
  regNoStartDisplay: string | number;
  regNoEndDisplay: string | number;
  nextAvailableRegNoDisplay: string | number;
  requiresPhoto?: boolean; 
  marhalaType?: MarhalaSpecificType; 
}

export const useExamineeRegistration = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [examineeSearchTerm, setExamineeSearchTerm] = useState('');
  const [debouncedExamineeSearchTerm, setDebouncedExamineeSearchTerm] = useState('');
  const [isExamineeDropdownOpen, setIsExamineeDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedExamineeSearchTerm(examineeSearchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [examineeSearchTerm]);

  const { data: examineeSearchResults, isLoading: isSearchingExaminees } = useQuery({
    queryKey: ['examineeSearch', debouncedExamineeSearchTerm],
    queryFn: async () => {
      if (debouncedExamineeSearchTerm.length < 3) {
        return [];
      }
      const { data, error } = await supabase.rpc('search_examinees_for_autofill', { p_search_term: debouncedExamineeSearchTerm });
      if (error) {
        throw new Error(' পরীক্ষার্থী খুঁজতে গিয়ে সমস্যা হয়েছে।');
      }
      return data;
    },
    enabled: debouncedExamineeSearchTerm.length >= 3 && isExamineeDropdownOpen,
  });

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedMadrasa, setSelectedMadrasa] = useState<Madrasa | null>(null);
  const [madrasaSearchTerm, setMadrasaSearchTerm] = useState<string>('');
  const [debouncedMadrasaSearchTerm, setDebouncedMadrasaSearchTerm] = useState<string>('');
  const [isMadrasaDropdownOpen, setIsMadrasaDropdownOpen] = useState(false);
  
  const [allFeeCollectionsForMadrasaExam, setAllFeeCollectionsForMadrasaExam] = useState<RegistrationFeeCollection[]>([]);
  const [selectedFeeCollectionId, setSelectedFeeCollectionId] = useState<string>('');
  const [selectedFeeCollection, setSelectedFeeCollection] = useState<RegistrationFeeCollection | null>(null);
  
  const [marhalaSummaries, setMarhalaSummaries] = useState<MarhalaSummary[]>([]);
  const [selectedMarhalaForEntry, setSelectedMarhalaForEntry] = useState<string>('');
  
  const [currentStep, setCurrentStep] = useState(0); 
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [singleExamineeFormData, setSingleExamineeFormData] = useState<SingleExamineeFormData>(initialSingleExamineeFormData);
  
  const [errors, setErrors] = useState<any>({});

  const { data: allExams = [], isLoading: isLoadingExams, error: examsError } = useQuery<Exam[], Error>({
    queryKey: ['examsForExamineeReg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*, exam_marhala_fees!inner(*)').eq('is_active', true).eq('status', 'preparatory').order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'সক্রিয় পরীক্ষা তালিকা আনতে সমস্যা হয়েছে।');
      return (data || []).map(db_exam => ({
          ...db_exam,
          examFees: db_exam.exam_marhala_fees.map((fee: any) => ({
            marhalaId: fee.marhala_id, 
            startingRollNumber: fee.starting_roll_number,
            regularFee: fee.regular_fee,
            irregularFee: fee.irregular_fee,
            lateRegularFee: fee.late_regular_fee,
            lateIrregularFee: fee.late_irregular_fee,
          }))
      })) as Exam[];
    },
  });
  
  const { data: allMarhalas = [], isLoading: isLoadingMarhalas, error: marhalasError } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForExamineeReg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order');
      if (error) throw new Error(error.message || 'মারহালা তালিকা আনতে সমস্যা হয়েছে।');
      return (data as MarhalaApiResponse[]).map(mapApiMarhalaToFrontend);
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedMadrasaSearchTerm(madrasaSearchTerm), 300);
    return () => clearTimeout(handler);
  }, [madrasaSearchTerm]);

  const { data: filteredMadrasasForSearch = [], isLoading: isSearchingMadrasas } = useQuery<Madrasa[], Error>({
    queryKey: ['madrasaSearchForExamineeReg', debouncedMadrasaSearchTerm],
    queryFn: async () => {
      if (debouncedMadrasaSearchTerm.trim().length < 2) return [];
      const { data, error } = await supabase.rpc('get_madrasas_filtered', { p_search_term: debouncedMadrasaSearchTerm, p_limit: 10 });
      if (error) throw new Error(error.message || `মাদরাসা খুঁজতে সমস্যা হয়েছে`);
      return (data.items as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontend);
    },
    enabled: debouncedMadrasaSearchTerm.trim().length >= 2,
  });
  
  const { data: feeCollectionsRawData, isLoading: isLoadingFeeCollections, error: feeCollectionsError } = useQuery<{items: any[], totalItems: number} | null, Error>({
    queryKey: ['allFeeCollectionsForExamineeReg', selectedExamId, selectedMadrasa?.id],
    queryFn: async () => {
        if (!selectedExamId || !selectedMadrasa?.id) return null;
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_registration_fee_collections', {
            p_exam_id_filter: selectedExamId,
            p_madrasa_id_filter: selectedMadrasa.id,
            p_search_term: null, 
            p_limit: 100, 
            p_page: 1 
        });
        if (rpcError) throw rpcError; 
        return rpcData as { items: any[], totalItems: number };
    },
    enabled: !!selectedExamId && !!selectedMadrasa?.id,
  });

  const { data: allExamineesForSelectedExamAndMadrasa, isLoading: isLoadingAllExamineesForFilter } = useQuery<
    Pick<Examinee, 'id' | 'marhalaId' | 'studentType' | 'registrationNumber'>[], Error>({
    queryKey: ['allExamineesForSelectedExamMadrasaForDropdownFiltering', selectedExamId, selectedMadrasa?.id],
    queryFn: async () => {
      if (!selectedExamId || !selectedMadrasa?.id) return [];
      const { data: rawData, error } = await supabase
        .from('examinees')
        .select('id, marhala_id, student_type, registration_number') // Removed registration_fee_collection_id
        .eq('exam_id', selectedExamId)
        .eq('madrasa_id', selectedMadrasa.id);
      if (error) throw error;
      return (rawData || []).map(item => ({
        id: item.id,
        // registrationFeeCollectionId: item.registration_fee_collection_id, // Removed
        marhalaId: item.marhala_id,
        studentType: item.student_type as StudentType,
        registrationNumber: item.registration_number,
      }));
    },
    enabled: !!selectedExamId && !!selectedMadrasa?.id,
  });


  useEffect(() => {
    if (feeCollectionsError) {
      addToast(`ফি কালেকশন তালিকা আনতে সমস্যা: ${feeCollectionsError.message}`, 'error');
      setAllFeeCollectionsForMadrasaExam([]);
      setSelectedFeeCollectionId('');
      setSelectedFeeCollection(null);
      setErrors(prev => ({...prev, selectedFeeCollection: feeCollectionsError.message }));
    } else if (feeCollectionsRawData) {
      const mappedCollections = (feeCollectionsRawData.items || []).map(mapDbRegFeeCollectionToFrontend);
      setAllFeeCollectionsForMadrasaExam(mappedCollections);
      if (mappedCollections.length === 0) {
        setSelectedFeeCollectionId('');
        setSelectedFeeCollection(null);
        setErrors(prev => ({...prev, selectedFeeCollection: 'এই পরীক্ষা ও মাদ্রাসার জন্য কোনো নিবন্ধন ফি সংগ্রহের রেকর্ড পাওয়া যায়নি।'}));
      } else {
        const nonFullCollections = mappedCollections.filter(collection => {
            if (!allExamineesForSelectedExamAndMadrasa) return true; 
            for (const msc of collection.marhalaStudentCounts) {
                const examineesInThisMarhalaForThisCollection = (allExamineesForSelectedExamAndMadrasa || []).filter(
                    ex => ex.registrationFeeCollectionId === collection.id && ex.marhalaId === msc.marhalaId
                );
                const registeredRegular = examineesInThisMarhalaForThisCollection.filter(ex => ex.studentType === 'regular').length;
                const registeredIrregular = examineesInThisMarhalaForThisCollection.filter(ex => ex.studentType === 'irregular').length;
                if (registeredRegular < Number(msc.regularStudents) || registeredIrregular < Number(msc.irregularStudents)) {
                    return true; 
                }
            }
            return false; 
        });

        if (nonFullCollections.length === 1 && mappedCollections.length ===1) { 
             setSelectedFeeCollectionId(nonFullCollections[0].id);
        } else if (!mappedCollections.find(c => c.id === selectedFeeCollectionId)) {
            setSelectedFeeCollectionId(''); 
            setSelectedFeeCollection(null);
        }
      }
    } else if (!isLoadingFeeCollections && selectedExamId && selectedMadrasa){ 
        setAllFeeCollectionsForMadrasaExam([]);
        setSelectedFeeCollectionId('');
        setSelectedFeeCollection(null);
        setErrors(prev => ({...prev, selectedFeeCollection: 'এই পরীক্ষা ও মাদ্রাসার জন্য কোনো নিবন্ধন ফি সংগ্রহের রেকর্ড পাওয়া যায়নি।'}));
    }
  }, [feeCollectionsRawData, isLoadingFeeCollections, feeCollectionsError, addToast, selectedExamId, selectedMadrasa, selectedFeeCollectionId, allExamineesForSelectedExamAndMadrasa]);

  useEffect(() => {
    if (selectedFeeCollectionId && allFeeCollectionsForMadrasaExam.length > 0) {
        const foundCollection = allFeeCollectionsForMadrasaExam.find(c => c.id === selectedFeeCollectionId);
        setSelectedFeeCollection(foundCollection || null);
        if (!foundCollection) {
            setErrors(prev => ({...prev, selectedFeeCollection: 'নির্বাচিত ফি সংগ্রহ রশিদটি পাওয়া যায়নি।'}));
        } else {
            setErrors(prev => ({...prev, selectedFeeCollection: undefined}));
        }
    } else if (allFeeCollectionsForMadrasaExam.length === 1) { 
    } else {
        setSelectedFeeCollection(null); 
    }
  }, [selectedFeeCollectionId, allFeeCollectionsForMadrasaExam]);

  

  useEffect(() => {
    if (examsError) addToast(examsError.message, 'error');
    if (marhalasError) addToast(marhalasError.message, 'error');
  }, [examsError, marhalasError, addToast]);

  const examOptionsSelect: SelectOption[] = useMemo(() => 
    allExams.map(exam => ({ value: exam.id, label: exam.name })),
  [allExams]);
  
  const feeCollectionOptions: SelectOption[] = useMemo(() => {
    return allFeeCollectionsForMadrasaExam
      .filter(collection => {
        if (isLoadingAllExamineesForFilter || !allExamineesForSelectedExamAndMadrasa) return true;

        for (const msc of collection.marhalaStudentCounts) {
          const examineesInThisMarhalaForThisCollection = allExamineesForSelectedExamAndMadrasa.filter(
            ex => ex.registrationFeeCollectionId === collection.id && ex.marhalaId === msc.marhalaId
          );
          const registeredRegular = examineesInThisMarhalaForThisCollection.filter(ex => ex.studentType === 'regular').length;
          const registeredIrregular = examineesInThisMarhalaForThisCollection.filter(ex => ex.studentType === 'irregular').length;
          
          if (registeredRegular < Number(msc.regularStudents) || registeredIrregular < Number(msc.irregularStudents)) {
            return true; 
          }
        }
        return false; 
      })
      .map(fc => ({
        value: fc.id,
        label: `রশিদ: ...${fc.id.slice(-6)}, তারিখ: ${formatDateForDropdown(fc.collectionDate)}, ফি: ${fc.totalCalculatedFee.toLocaleString('bn-BD')}৳`
      }));
  }, [allFeeCollectionsForMadrasaExam, allExamineesForSelectedExamAndMadrasa, isLoadingAllExamineesForFilter]);

  const handleSelectExaminee = (examinee: any) => {
    addToast('পরীক্ষার্থীর তথ্য পাওয়া গেছে এবং ফর্মটি পূরণ করা হয়েছে।', 'success');
    setSingleExamineeFormData({
      ...singleExamineeFormData,
      nameBn: examinee.name_bn,
      nameAr: examinee.name_ar || '',
      nameEn: examinee.name_en || '',
      fatherNameBn: examinee.father_name_bn,
      fatherNameAr: examinee.father_name_ar || '',
      fatherNameEn: examinee.father_name_en || '',
      motherNameBn: examinee.mother_name_bn,
      motherNameAr: examinee.mother_name_ar || '',
      motherNameEn: examinee.mother_name_en || '',
      dateOfBirth: examinee.date_of_birth,
      nidOrBirthCert: examinee.nid_or_birth_cert,
      photoFile: null,
      pastYearRoll: examinee.past_year_roll?.toString() || '',
      pastYearMarhala: examinee.past_year_marhala || '',
      pastExamYear: examinee.past_exam_year || '',
      pastYearTotalNumber: examinee.past_year_total_number?.toString() || '',
      pastYearDivision: examinee.past_year_division || '',
      pastYearComment: examinee.past_year_comment || '',
    });
    setExamineeSearchTerm('');
    setIsExamineeDropdownOpen(false);
    setCompletedSteps(new Set([0, 1, 2, 3]));
  };

  const handleSelectMadrasa = (madrasa: Madrasa) => {
    setSelectedMadrasa(madrasa);
    setMadrasaSearchTerm(''); 
    setIsMadrasaDropdownOpen(false);
    setSelectedFeeCollection(null); 
    setSelectedFeeCollectionId('');
    setAllFeeCollectionsForMadrasaExam([]);
    setMarhalaSummaries([]);
    setSelectedMarhalaForEntry('');
  };

  const handleClearSelectedMadrasa = () => {
    setSelectedMadrasa(null);
    setMadrasaSearchTerm('');
    setSelectedFeeCollection(null);
    setSelectedFeeCollectionId('');
    setAllFeeCollectionsForMadrasaExam([]);
    setMarhalaSummaries([]);
    setSelectedMarhalaForEntry('');
  };
  
  const getMarhalaName = useCallback((marhalaId: string): string => {
    const marhala = allMarhalas.find(m => m.id === marhalaId);
    return marhala ? `${marhala.nameBn} (${marhala.type === 'boys' ? 'বালক' : 'বালিকা'})` : 'অজানা';
  }, [allMarhalas]);

  useEffect(() => {
    if (selectedFeeCollection && allMarhalas.length > 0 && allExamineesForSelectedExamAndMadrasa) { // Changed dependency
      const newSummaries: MarhalaSummary[] = selectedFeeCollection.marhalaStudentCounts.map(msc => {
        // Filter examinees based on registration number range and marhalaId
        const examineesInThisMarhala = (allExamineesForSelectedExamAndMadrasa || []).filter( // Changed source
            ex => ex.marhalaId === msc.marhalaId &&
                  ex.registrationNumber >= (msc.displayedRegNoStart || 0) &&
                  ex.registrationNumber <= (msc.displayedRegNoEnd || Infinity)
        );
        const registeredRegular = examineesInThisMarhala.filter(ex => ex.studentType === 'regular').length;
        const registeredIrregular = examineesInThisMarhala.filter(ex => ex.studentType === 'irregular').length;
        
        const existingRegNumbersSet = new Set(examineesInThisMarhala.map(ex => ex.registrationNumber));
        let nextRegNo: number | string = 'পূর্ণ';
        if (msc.displayedRegNoStart !== undefined && msc.displayedRegNoEnd !== undefined && msc.displayedRegNoStart !== null && msc.displayedRegNoEnd !== null) {
            for (let i = Number(msc.displayedRegNoStart); i <= Number(msc.displayedRegNoEnd); i++) {
                if (!existingRegNumbersSet.has(i)) {
                    nextRegNo = i;
                    break;
                }
            }
        } else {
            nextRegNo = 'সীমা নেই';
        }
        const marhalaDetails = allMarhalas.find(m => m.id === msc.marhalaId);

        return {
          marhalaId: msc.marhalaId,
          marhalaName: getMarhalaName(msc.marhalaId),
          totalRegularSlots: Number(msc.regularStudents),
          totalIrregularSlots: Number(msc.irregularStudents),
          registeredRegular,
          registeredIrregular,
          availableRegular: Number(msc.regularStudents) - registeredRegular,
          availableIrregular: Number(msc.irregularStudents) - registeredIrregular,
          regNoStartDisplay: msc.displayedRegNoStart?.toLocaleString('bn-BD') || 'N/A',
          regNoEndDisplay: msc.displayedRegNoEnd?.toLocaleString('bn-BD') || 'N/A',
          nextAvailableRegNoDisplay: typeof nextRegNo === 'number' ? nextRegNo.toLocaleString('bn-BD') : nextRegNo,
          requiresPhoto: marhalaDetails?.requiresPhoto || false,
          marhalaType: marhalaDetails?.type,
        };
      });
      setMarhalaSummaries(prevSummaries => {
        if (JSON.stringify(prevSummaries) === JSON.stringify(newSummaries)) {
          return prevSummaries;
        }
        return newSummaries;
      });
    } else {
      setMarhalaSummaries([]);
    }
  }, [selectedFeeCollection, allMarhalas, allExamineesForSelectedExamAndMadrasa, getMarhalaName]);
  
  const currentMarhalaSummary = useMemo(() => marhalaSummaries.find(s => s.marhalaId === selectedMarhalaForEntry), [marhalaSummaries, selectedMarhalaForEntry]);

  const handleSelectMarhalaForEntry = (marhalaId: string) => {
    setSelectedMarhalaForEntry(marhalaId);

    const summary = marhalaSummaries.find(s => s.marhalaId === marhalaId);
    if (summary) {
      const start = summary.regNoStartDisplay;
      const end = summary.regNoEndDisplay;
      let displayValue = 'রেঞ্জ অনির্ধারিত';

      if (start && start !== 'N/A' && end && end !== 'N/A') {
        displayValue = `${start} - ${end}`;
      } else if (start === 'N/A' && end === 'N/A') {
         displayValue = 'রেঞ্জ পাওয়া যায়নি';
      }
      
      let newStudentType: StudentType | '' = '';
      if (summary.availableRegular > 0) {
          newStudentType = 'regular';
      } else if (summary.availableIrregular > 0) {
          newStudentType = 'irregular';
      }

      setSingleExamineeFormData({ ...initialSingleExamineeFormData, registrationNumberDisplay: displayValue, studentType: newStudentType });
      setCurrentStep(0); 
      setCompletedSteps(new Set());
    } else {
      setSingleExamineeFormData({ ...initialSingleExamineeFormData, registrationNumberDisplay: 'মারহালা তথ্য নেই', studentType: '' });
    }
  }

  const handleExamineeInputChange = (field: keyof SingleExamineeFormData, value: string | File | null) => {
    setErrors(prev => ({...prev, stepperEntry: {...(prev.stepperEntry || {}), [field]: undefined }}));
    if (field === 'photoFile') {
        setSingleExamineeFormData(prev => ({ ...prev, photoFile: value as File | null }));
    } else {
        setSingleExamineeFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const shouldShowPhotoUpload: boolean = useMemo(() => {
    return !!(currentMarhalaSummary?.requiresPhoto && currentMarhalaSummary?.marhalaType === 'boys');
  }, [currentMarhalaSummary]);

  const steps = useMemo(() => {
    const baseSteps = [
        { id: 'examineeInfo', label: 'পরীক্ষার্থীর তথ্য' },
        { id: 'fatherInfo', label: 'পিতার তথ্য' },
        { id: 'motherInfo', label: 'মাতার তথ্য' },
        { id: 'pastExamInfo', label: 'পূর্ববর্তী পরীক্ষার তথ্য' },
    ];
    if (shouldShowPhotoUpload) {
        return [
            ...baseSteps,
            { id: 'photoUpload', label: 'পরীক্ষার্থীর ছবি' }
        ];
    }
    return baseSteps;
  }, [shouldShowPhotoUpload]);


  const validateStep = (stepIndex: number): boolean => {
    const newStepErrors: any = {};
    const stepId = steps[stepIndex].id; 
    const marhalaSummary = currentMarhalaSummary;

    if (stepId === 'examineeInfo') {
        if (!singleExamineeFormData.studentType) newStepErrors.studentType = 'শিক্ষার্থীর ধরণ আবশ্যক।';
        if (!singleExamineeFormData.nameBn.trim()) newStepErrors.nameBn = 'বাংলা নাম আবশ্যক।';
        if (!singleExamineeFormData.dateOfBirth) newStepErrors.dateOfBirth = 'জন্ম তারিখ আবশ্যক।';
        if (!singleExamineeFormData.nidOrBirthCert.trim()) newStepErrors.nidOrBirthCert = 'NID/জন্ম নিবন্ধন নম্বর আবশ্যক।';
        
        if (marhalaSummary) {
            if (singleExamineeFormData.studentType === 'regular' && marhalaSummary.availableRegular <= 0) newStepErrors.slotError = 'এই মারহালায় নিয়মিত পরীক্ষার্থীর জন্য কোনো স্লট খালি নেই।';
            if (singleExamineeFormData.studentType === 'irregular' && marhalaSummary.availableIrregular <= 0) newStepErrors.slotError = 'এই মারহালায় অনিয়মিত পরীক্ষার্থীর জন্য কোনো স্লট খালি নেই।';
            
            const nextRegNo = marhalaSummary.nextAvailableRegNoDisplay;
            if (typeof nextRegNo === 'string' && (nextRegNo === 'পূর্ণ' || nextRegNo === 'সীমা নেই')) newStepErrors.registrationNumberDisplayError = `এই মারহালার জন্য কোনো নিবন্ধন নম্বর উপলব্ধ নেই (স্ট্যাটাস: ${nextRegNo})।`;
        } else if(selectedMarhalaForEntry) {
             newStepErrors.selectedMarhalaForEntry = 'নির্বাচিত মারহালার তথ্য পাওয়া যায়নি।';
        }
    }
    else if (stepId === 'fatherInfo') {
        if (!singleExamineeFormData.fatherNameBn.trim()) newStepErrors.fatherNameBn = 'পিতার বাংলা নাম আবশ্যক।';
    }
    else if (stepId === 'motherInfo') {
        if (!singleExamineeFormData.motherNameBn.trim()) newStepErrors.motherNameBn = 'মাতার বাংলা নাম আবশ্যক।';
    }
    else if (stepId === 'photoUpload') {
        if (marhalaSummary && marhalaSummary.requiresPhoto && marhalaSummary.marhalaType === 'boys') {
            if (!singleExamineeFormData.photoFile) {
                newStepErrors.photoFile = 'এই মারহালার বালকদের জন্য ছবি আবশ্যক।';
            }
            else if (singleExamineeFormData.photoFile.size > 1 * 1024 * 1024) { // 1MB
                newStepErrors.photoFile = 'ছবির ফাইল সাইজ সর্বোচ্চ ১ মেগাবাইট।';
            }
            else if (!['image/jpeg', 'image/png'].includes(singleExamineeFormData.photoFile.type)) {
                newStepErrors.photoFile = 'ছবি অবশ্যই JPG অথবা PNG ফরম্যাটে হতে হবে।';
            }
        }
    }
    setErrors(prev => ({ ...prev, stepperEntry: {...(prev.stepperEntry || {}), ...newStepErrors }}));
    return Object.keys(newStepErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      if (currentStep < steps.length - 1) { 
        setCurrentStep(currentStep + 1);
      }
    }
    else {
      addToast('এই ধাপের কিছু তথ্য সঠিক নয়।', 'error');
    }
  };

  const handlePreviousStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  
  const fullFormValidationForStepper = () : boolean => {
    let allValid = true;
    const allStepperErrors: any = {};
    for(let i=0; i < steps.length; i++){ 
        const stepId = steps[i].id;
        if (stepId === 'examineeInfo') {
            if (!singleExamineeFormData.studentType) allStepperErrors.studentType = 'শিক্ষার্থীর ধরণ আবশ্যক।';
            if (!singleExamineeFormData.nameBn.trim()) allStepperErrors.nameBn = 'বাংলা নাম আবশ্যক।';
            if (!singleExamineeFormData.dateOfBirth) allStepperErrors.dateOfBirth = 'জন্ম তারিখ আবশ্যক।';
            if (!singleExamineeFormData.nidOrBirthCert.trim()) allStepperErrors.nidOrBirthCert = 'NID/জন্ম নিবন্ধন নম্বর আবশ্যক।';
        }
        else if (stepId === 'fatherInfo') {
            if (!singleExamineeFormData.fatherNameBn.trim()) allStepperErrors.fatherNameBn = 'পিতার বাংলা নাম আবশ্যক।';
        }
        else if (stepId === 'motherInfo') {
            if (!singleExamineeFormData.motherNameBn.trim()) allStepperErrors.motherNameBn = 'মাতার বাংলা নাম আবশ্যক।';
        }
        else if (stepId === 'photoUpload') {
            const marhalaSummary = currentMarhalaSummary;
            if (marhalaSummary && marhalaSummary.requiresPhoto && marhalaSummary.marhalaType === 'boys' && !singleExamineeFormData.photoFile) {
                allStepperErrors.photoFile = 'ছবি আবশ্যক।';
            }
        }
    }
    if(Object.keys(allStepperErrors).length > 0) {
        allValid = false;
        setErrors(prev => ({...prev, stepperEntry: allStepperErrors}));
    }
    return allValid;
  };

  const createExamineeMutation = useMutation({
    mutationFn: async (newExamineePayload: any) => {
        const { data, error } = await supabase.rpc('create_examinee', newExamineePayload);
        if (error) throw error;
        return data;
    },
    onSuccess: async (data) => {
        addToast(`পরীক্ষার্থী "${(data as any).name_bn}" (রেজি: ${(data as any).registration_number}) সফলভাবে নিবন্ধিত হয়েছে!`, 'success');
        queryClient.invalidateQueries({ queryKey: ['allExamineesForSelectedExamMadrasaForDropdownFiltering', selectedExamId, selectedMadrasa?.id] }); // Invalidate the correct query
        setSingleExamineeFormData(initialSingleExamineeFormData); 
        setCurrentStep(0);
        setCompletedSteps(new Set());
        setErrors(prev => ({...prev, stepperEntry: {}})); 
        const tempSelectedMarhala = selectedMarhalaForEntry;
        setSelectedMarhalaForEntry(''); 
        setTimeout(() => setSelectedMarhalaForEntry(tempSelectedMarhala), 0);
    },
    onError: (error: PostgrestError | Error) => {
        addToast(`পরীক্ষার্থী নিবন্ধনে ত্রুটি: ${error.message}`, 'error', 7000);
        setErrors(prev => ({...prev, stepperEntry: {...(prev.stepperEntry || {}), apiError: error.message }}));
    }
  });

  const handleRegisterSingleExaminee = async () => {
    const commonErrors: any = {};
    if (!selectedExamId) commonErrors.selectedExamId = 'পরীক্ষা নির্বাচন আবশ্যক।';
    if (!selectedMadrasa) commonErrors.selectedMadrasaId = 'মাদরাসা নির্বাচন আবশ্যক।';
    if (!selectedFeeCollection) commonErrors.selectedFeeCollectionError = 'ফি সংগ্রহের রশিদ নির্বাচন আবশ্যক।';
    if (!selectedMarhalaForEntry) commonErrors.selectedMarhalaForEntry = 'মারহালা নির্বাচন করুন।';
    
    if (Object.keys(commonErrors).length > 0) {
        setErrors(prev => ({...prev, ...commonErrors, stepperEntry: prev.stepperEntry || {}}));
        addToast('অনুগ্রহ করে প্রথমে পরীক্ষা, মাদরাসা, ফি রশিদ এবং মারহালা নির্বাচন করুন।', 'error');
        return;
    }

    if (!fullFormValidationForStepper()) {
      addToast('পরীক্ষার্থীর তথ্য ফরমে ত্রুটি রয়েছে।', 'error');
      for(let i=0; i < steps.length; i++){ 
          if(!validateStep(i)){ 
              setCurrentStep(i);
              const newCompleted = new Set<number>();
              completedSteps.forEach(cs => { if(cs < i) newCompleted.add(cs); });
              setCompletedSteps(newCompleted);
              break;
          }
      }
      return; 
    }

    let uploadedPhotoUrl: string | undefined = undefined;
    if (singleExamineeFormData.photoFile && shouldShowPhotoUpload) { 
        try {
            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary configuration missing.");
            uploadedPhotoUrl = await uploadToCloudinary(singleExamineeFormData.photoFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
        } catch (uploadError: any) {
            addToast(`ছবি আপলোডে সমস্যা: ${uploadError.message}`, 'error');
            setErrors(prev => ({...prev, stepperEntry: {...(prev.stepperEntry || {}), photoFile: uploadError.message }}));
            const photoStepIndex = steps.findIndex(s => s.id === 'photoUpload');
            if (photoStepIndex !== -1) setCurrentStep(photoStepIndex);
            return;
        }
    }

    const parsedRoll = parseInt(singleExamineeFormData.pastYearRoll || '', 10);
    const parsedTotalNumber = parseInt(singleExamineeFormData.pastYearTotalNumber || '', 10);
    const parsedExamYear = parseInt(singleExamineeFormData.pastExamYear || '', 10);

        const payload = {
        p_collection_id: selectedFeeCollection!.id, p_exam_id: selectedExamId, p_madrasa_id: selectedMadrasa!.id, p_marhala_id: selectedMarhalaForEntry,
        p_student_type: singleExamineeFormData.studentType, p_name_bn: singleExamineeFormData.nameBn, p_name_ar: singleExamineeFormData.nameAr || null, p_name_en: singleExamineeFormData.nameEn || null,
        p_father_name_bn: singleExamineeFormData.fatherNameBn, p_father_name_ar: singleExamineeFormData.fatherNameAr || null, p_father_name_en: singleExamineeFormData.fatherNameEn || null,
        p_mother_name_bn: singleExamineeFormData.motherNameBn, p_mother_name_ar: singleExamineeFormData.motherNameAr || null, p_mother_name_en: singleExamineeFormData.motherNameEn || null,
        p_date_of_birth: singleExamineeFormData.dateOfBirth, p_nid_or_birth_cert: singleExamineeFormData.nidOrBirthCert, p_photo_url: uploadedPhotoUrl,
        p_past_year_roll: isNaN(parsedRoll) ? null : parsedRoll,
        p_past_year_marhala: singleExamineeFormData.pastYearMarhala || null,
        p_past_exam_year: isNaN(parsedExamYear) ? null : parsedExamYear,
        p_past_year_total_number: isNaN(parsedTotalNumber) ? null : parsedTotalNumber,
        p_past_year_division: singleExamineeFormData.pastYearDivision || null,
        p_past_year_comment: singleExamineeFormData.pastYearComment || null,
    };
    createExamineeMutation.mutate(payload);
  };

  const studentTypeOptionsForSelectedMarhala: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [];
    if (currentMarhalaSummary) {
        if (currentMarhalaSummary.availableRegular > 0) {
            options.push({ value: 'regular', label: 'নিয়মিত' });
        }
        if (currentMarhalaSummary.availableIrregular > 0) {
            options.push({ value: 'irregular', label: 'অনিয়মিত' });
        }
    }
    return options;
  }, [currentMarhalaSummary]);


  const isRegNumCompletelyUnavailable: boolean = useMemo(() => {
    if (!currentMarhalaSummary) return true; 
    const nextRegNo = currentMarhalaSummary.nextAvailableRegNoDisplay;
    return typeof nextRegNo === 'string' && (nextRegNo === 'পূর্ণ' || nextRegNo === 'সীমা নেই');
  }, [currentMarhalaSummary]);

  const isLoadingInitialData = isLoadingExams || isLoadingMarhalas;
  const isOverallFormDisabled = !!errors.selectedFeeCollection || (feeCollectionOptions.length === 0 && selectedExamId !== '' && selectedMadrasa !== null && !isLoadingFeeCollections && !isLoadingAllExamineesForFilter) ;
  const canSubmitForm = currentMarhalaSummary && !isRegNumCompletelyUnavailable && singleExamineeFormData.studentType && 
                      !((singleExamineeFormData.studentType === 'regular' && currentMarhalaSummary.availableRegular <= 0) || 
                      (singleExamineeFormData.studentType === 'irregular' && currentMarhalaSummary.availableIrregular <= 0));


  return {
    examineeSearchTerm, setExamineeSearchTerm, isExamineeDropdownOpen, setIsExamineeDropdownOpen, examineeSearchResults, isSearchingExaminees, handleSelectExaminee,
    selectedExamId, setSelectedExamId, selectedMadrasa, setSelectedMadrasa, madrasaSearchTerm, setMadrasaSearchTerm, isMadrasaDropdownOpen, setIsMadrasaDropdownOpen,
    filteredMadrasasForSearch, isSearchingMadrasas, handleSelectMadrasa, handleClearSelectedMadrasa,
    allFeeCollectionsForMadrasaExam, setAllFeeCollectionsForMadrasaExam, selectedFeeCollectionId, setSelectedFeeCollectionId, selectedFeeCollection,
    marhalaSummaries, setMarhalaSummaries, selectedMarhalaForEntry, 
    currentStep, setCurrentStep, completedSteps, setCompletedSteps, singleExamineeFormData, setSingleExamineeFormData,
    errors, setErrors,
    allExams, isLoadingExams,
    allMarhalas, isLoadingMarhalas,
    feeCollectionOptions,
    examOptionsSelect,
    isLoadingFeeCollections,
    isLoadingAllExamineesForFilter, // Removed isLoadingExistingExaminees
    handleExamineeInputChange,
    handleNextStep,
    handlePreviousStep,
    handleRegisterSingleExaminee,
    createExamineeMutation,
    steps,
    currentMarhalaSummary,
    studentTypeOptionsForSelectedMarhala,
    isRegNumCompletelyUnavailable,
    isLoadingInitialData,
    isOverallFormDisabled,
    canSubmitForm,
    shouldShowPhotoUpload,
    validateStep,
    debouncedExamineeSearchTerm,
    handleSelectMarhalaForEntry
  };
};