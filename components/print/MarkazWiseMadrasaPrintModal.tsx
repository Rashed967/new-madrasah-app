
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Madrasa, MadrasaDbRow, SelectOption, BoardProfile, BoardProfileDbRow, Exam, Markaz, MarkazDbRow } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import PrintPreviewModal from './PrintPreviewModal';
import MadrasaListPrintLayout from './MadrasaListPrintLayout';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';

interface MarkazWiseMadrasaPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mapMadrasaDbRowToFrontend = (dbRow: MadrasaDbRow): Madrasa => ({
    id: dbRow.id, madrasaCode: dbRow.madrasa_code, nameBn: dbRow.name_bn, nameAr: dbRow.name_ar, nameEn: dbRow.name_en || undefined,
    address: { holding: dbRow.address?.holding || undefined, village: dbRow.address.village, upazila: dbRow.address.upazila, district: dbRow.address.district, division: dbRow.address.division, contactPersonName: dbRow.address.contact_person_name, postOffice: dbRow.address.post_office || undefined },
    zoneId: dbRow.zone_id, mobile1: dbRow.mobile1, mobile2: dbRow.mobile2 || undefined, type: dbRow.type,
    dispatchMethod: dbRow.dispatch_method,
    highestMarhalaBoysId: dbRow.highest_marhala_boys_id || undefined, highestMarhalaGirlsId: dbRow.highest_marhala_girls_id || undefined,
    muhtamim: { name: dbRow.muhtamim.name, mobile: dbRow.muhtamim.mobile, nidNumber: dbRow.muhtamim.nid_number || undefined, qualification: dbRow.muhtamim.qualification || undefined, },
    educationSecretary: dbRow.education_secretary ? { name: dbRow.education_secretary.name, mobile: dbRow.education_secretary.mobile, nidNumber: dbRow.education_secretary.nid_number || undefined, qualification: dbRow.education_secretary.qualification || undefined, } : undefined,
    mutawalli: dbRow.mutawalli ? { name: dbRow.mutawalli.name, mobile: dbRow.mutawalli.mobile, nidNumber: dbRow.mutawalli.nid_number || undefined, } : undefined,
    registrationDate: dbRow.registration_date, ilhakFormUrl: dbRow.ilhak_form_url || undefined,
});

const mapBoardProfileDbToFrontend = (dbRow?: BoardProfileDbRow): BoardProfile | null => {
    if (!dbRow) return null;
    return {
        id: 'MAIN_PROFILE', boardNameBn: dbRow.board_name_bn, boardNameEn: dbRow.board_name_en,
        address: { villageArea: dbRow.address.village_area, postOffice: dbRow.address.post_office, upazila: dbRow.address.upazila, district: dbRow.address.district, division: dbRow.address.division, holding: dbRow.address.holding || undefined },
        primaryPhone: dbRow.primary_phone, secondaryPhone: dbRow.secondary_phone || undefined, email: dbRow.email, website: dbRow.website || undefined,
        logoUrl: dbRow.logo_url || undefined, establishmentDate: dbRow.establishment_date,
        chairman: { name: dbRow.chairman.name, mobile: dbRow.chairman.mobile, email: dbRow.chairman.email || undefined },
        secretary: { name: dbRow.secretary.name, mobile: dbRow.secretary.mobile, email: dbRow.secretary.email || undefined },
        updatedAt: dbRow.updated_at
    };
};

const mapMarkazDbRowToFrontend = (dbRow: MarkazDbRow): Markaz => ({ id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code, hostMadrasaId: dbRow.host_madrasa_id, zoneId: dbRow.zone_id, examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active, createdAt: dbRow.created_at, updatedAt: dbRow.updated_at });


const MarkazWiseMadrasaPrintModal: React.FC<MarkazWiseMadrasaPrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedMarkazId, setSelectedMarkazId] = useState('all'); // Default to all

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [madrasasToPrint, setMadrasasToPrint] = useState<Madrasa[]>([]);
  const [boardProfileToPrint, setBoardProfileToPrint] = useState<BoardProfile | null>(null);
  const [filterDescription, setFilterDescription] = useState<string>('');

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<SelectOption[], Error>({
    queryKey: ['activeExamsForMarkazWisePrint'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', { p_limit: 1000 });
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<Markaz[], Error>({
    queryKey: ['activeMarkazesForMarkazWisePrint'],
    queryFn: async () => {
      const { data, error } = await supabase.from('markazes').select('*').eq('is_active', true).order('name_bn');
      if (error) throw error;
      return (data as MarkazDbRow[]).map(mapMarkazDbRowToFrontend);
    }
  });

  const markazOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: 'সকল মারকায' },
    ...markazes.map(mk => ({ value: mk.id, label: `${mk.nameBn} (কোড: ${mk.markazCode})` }))
  ], [markazes]);
  
  const handlePreviewAndPrint = async () => {
    if(!selectedExamId) {
      addToast('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।', 'warning');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: profileData, error: profileError } = await supabase.from('board_profile').select('*').eq('id', 'MAIN_PROFILE').single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setBoardProfileToPrint(mapBoardProfileDbToFrontend(profileData as BoardProfileDbRow || undefined));

      let assignmentQuery = supabase.from('markaz_madrasa_marhala_assignments').select('madrasa_id').eq('exam_id', selectedExamId);
      if (selectedMarkazId !== 'all') {
        assignmentQuery = assignmentQuery.eq('markaz_id', selectedMarkazId);
      }
      const { data: assignments, error: assignmentError } = await assignmentQuery;
      if (assignmentError) throw assignmentError;

      const uniqueMadrasaIds = [...new Set(assignments.map(a => a.madrasa_id))];
      
      let mappedMadrasas: Madrasa[] = [];
      if (uniqueMadrasaIds.length === 0) {
        addToast('এই ফিল্টারে কোনো এসাইনকৃত মাদরাসা পাওয়া যায়নি।', 'info');
      } else {
        const { data: madrasaData, error: madrasaError } = await supabase.from('madrasas').select('*').in('id', uniqueMadrasaIds).order('madrasa_code', {ascending: true});
        if (madrasaError) throw madrasaError;
        mappedMadrasas = (madrasaData as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontend);
      }
      setMadrasasToPrint(mappedMadrasas);

      const examName = exams.find(e => e.value === selectedExamId)?.label || '';
      const markazName = markazes.find(m => m.id === selectedMarkazId)?.nameBn || 'সকল মারকায';
      setFilterDescription(`পরীক্ষা: ${examName}, মারকায: ${markazName}`);
      
      if(mappedMadrasas.length > 0) {
        setIsPreviewModalOpen(true);
      }
    } catch (error: any) {
      addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="মারকায ভিত্তিক মাদরাসা তালিকা প্রিন্ট" size="lg">
        <div className="grid grid-cols-1 gap-4 p-1">
          <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} required />
          <Select label="মারকায" value={selectedMarkazId} onChange={e => setSelectedMarkazId(e.target.value)} options={markazOptions} placeholderOption="সকল মারকায" disabled={isLoadingMarkazes} />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বন্ধ করুন</Button>
          <Button onClick={handlePreviewAndPrint} disabled={isLoadingData} leftIcon={isLoadingData ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4"/>}>
            {isLoadingData ? 'লোড হচ্ছে...' : 'প্রিভিউ ও প্রিন্ট করুন'}
          </Button>
        </div>
      </Modal>
      
      {isPreviewModalOpen && boardProfileToPrint && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="মারকায ভিত্তিক মাদরাসার তালিকা"
          pageStyle="@page { size: A4 landscape; margin: 10mm; }"
        >
          <MadrasaListPrintLayout
            madrasas={madrasasToPrint}
            boardProfile={boardProfileToPrint}
            filterDescription={filterDescription}
          />
        </PrintPreviewModal>
      )}
    </>
  );
};

export default MarkazWiseMadrasaPrintModal;
