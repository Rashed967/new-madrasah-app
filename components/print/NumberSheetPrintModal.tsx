
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import { BoardProfile, Exam, SelectOption as GlobalSelectOption, BoardProfileDbRow } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';
import NumberSheetPrintLayout from '../reports/NumberSheetPrintLayout';
import PrintPreviewModal from './PrintPreviewModal';

interface NumberSheetData {
  marhala_id: string;
  marhala_name_bn: string;
  kitab_id: string;
  kitab_name_bn: string;
  full_marks: number;
  madrasas: {
    madrasa_id: string;
    madrasa_name_bn: string;
    markaz_name_bn: string;
    examinees: {
      roll_number: number;
      registration_number: number;
    }[];
  }[];
}

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

interface NumberSheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NumberSheetPrintModal: React.FC<NumberSheetPrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExaminerId, setSelectedExaminerId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [numberSheetData, setNumberSheetData] = useState<NumberSheetData[]>([]);
  const [boardProfile, setBoardProfile] = useState<BoardProfile | null>(null);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<GlobalSelectOption[], Error>({
    queryKey: ['activeExamsForNumberSheetModal'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', {p_limit: 1000});
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: examiners = [], isLoading: isLoadingExaminers } = useQuery<SearchableSelectOption[], Error>({
    queryKey: ['assignedExaminersForExamModal', selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const { data, error } = await supabase.rpc('search_assigned_examiners_for_exam', { p_exam_id: selectedExamId, p_limit: 5000 });
      if (error) throw error;
      return data.items || [];
    },
    enabled: !!selectedExamId,
  });

  const handleGenerateSheets = async () => {
    if (!selectedExamId || !selectedExaminerId) {
      addToast('অনুগ্রহ করে পরীক্ষা এবং পরীক্ষক নির্বাচন করুন।', 'warning');
      return;
    }
    setIsLoadingData(true);
    setNumberSheetData([]);

    try {
        const { data: profileData, error: profileError } = await supabase.from('board_profile').select('*').eq('id', 'MAIN_PROFILE').single();
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setBoardProfile(mapBoardProfileDbToFrontend(profileData as BoardProfileDbRow || undefined));

        const { data: sheetData, error: rpcError } = await supabase.rpc('get_number_sheet_data_for_examiner', {
            p_exam_id: selectedExamId,
            p_examiner_id: selectedExaminerId
        });
        if (rpcError) throw rpcError;

        if (sheetData && sheetData.length > 0) {
            setNumberSheetData(sheetData);
            setIsPreviewModalOpen(true);
        } else {
            addToast('এই পরীক্ষকের জন্য কোনো বন্টনকৃত উত্তরপত্র পাওয়া যায়নি।', 'info');
        }
    } catch (error: any) {
      addToast(`নম্বরপত্র তৈরি করতে সমস্যা: ${error.message}`, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const selectedExamName = exams.find(e => e.value === selectedExamId)?.label || '';
  const selectedExaminerName = examiners.find(e => e.value === selectedExaminerId)?.label || '';

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="নম্বরপত্র প্রিন্ট করুন"
        size="2xl"
        footer={
            <>
                <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বাতিল</Button>
                <Button onClick={handleGenerateSheets} disabled={isLoadingData || !selectedExaminerId} leftIcon={isLoadingData ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <PrinterIcon className="w-5 h-5"/>}>
                    {isLoadingData ? 'লোড হচ্ছে...' : 'প্রিভিউ দেখুন'}
                </Button>
            </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <Select label="পরীক্ষা" value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setSelectedExaminerId(null); }} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন..." required disabled={isLoadingExams} wrapperClassName="mb-0"/>
            <SearchableSelect id="examinerSelectModal" label="পরীক্ষক" options={examiners} value={selectedExaminerId} onChange={setSelectedExaminerId} placeholder="পরীক্ষক নির্বাচন করুন..." disabled={!selectedExamId || isLoadingExaminers} required wrapperClassName="mb-0"/>
        </div>
      </Modal>

      {isPreviewModalOpen && boardProfile && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`নম্বরপত্র প্রিভিউ - ${selectedExaminerName}`}
          pageStyle="@page { size: A4 portrait; margin: 8mm; }"
          printTargetId="print-number-sheets-area"
        >
          <div id="print-number-sheets-area" className="printable-content">
            {numberSheetData.map(sheet => (
              <NumberSheetPrintLayout
                key={`${sheet.marhala_id}-${sheet.kitab_id}`}
                sheetData={sheet}
                boardProfile={boardProfile}
                examinerName={selectedExaminerName.split(' (')[0]}
                examName={selectedExamName}
              />
            ))}
          </div>
        </PrintPreviewModal>
      )}
    </>
  );
};

export default NumberSheetPrintModal;
