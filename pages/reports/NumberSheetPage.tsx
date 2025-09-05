import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SearchableSelect, SearchableSelectOption } from '../../components/ui/SearchableSelect';
import { Select } from '../../components/ui/Select';
import { BoardProfile, Exam, SelectOption as GlobalSelectOption, BoardProfileDbRow } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowPathIcon, PrinterIcon } from '../../components/ui/Icon';
import NumberSheetPrintLayout from '../../components/reports/NumberSheetPrintLayout';
import PrintPreviewModal from '../../components/print/PrintPreviewModal';

interface ExamineeInfo {
  roll_number: number;
  registration_number: number;
}
interface MadrasaInfo {
  madrasa_id: string;
  madrasa_name_bn: string;
  markaz_name_bn: string;
  examinees: ExamineeInfo[];
}
interface NumberSheetData {
  marhala_id: string;
  marhala_name_bn: string;
  kitab_id: string;
  kitab_name_bn: string;
  full_marks: number;
  madrasas: MadrasaInfo[];
}

interface NumberSheetPrintLayoutProps {
  sheetData: NumberSheetData;
  boardProfile: BoardProfile;
  examinerName: string;
  examName: string;
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

const NumberSheetPage: React.FC = () => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExaminerId, setSelectedExaminerId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [numberSheetData, setNumberSheetData] = useState<NumberSheetData[]>([]);
  const [boardProfile, setBoardProfile] = useState<BoardProfile | null>(null);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<GlobalSelectOption[], Error>({
    queryKey: ['activeExamsForNumberSheet'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', {p_limit: 1000});
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: examiners = [], isLoading: isLoadingExaminers } = useQuery<SearchableSelectOption[], Error>({
    queryKey: ['assignedExaminersForExam', selectedExamId],
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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const selectedExamName = exams.find(e => e.value === selectedExamId)?.label || '';
  const selectedExaminerName = examiners.find(e => e.value === selectedExaminerId)?.label || '';

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">নম্বরপত্র প্রিন্ট</h2>
      <Card title="ফিল্টার" className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select label="পরীক্ষা" value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setSelectedExaminerId(null); }} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন..." required disabled={isLoadingExams} />
          <SearchableSelect id="examinerSelect" label="পরীক্ষক" options={examiners} value={selectedExaminerId} onChange={setSelectedExaminerId} placeholder="পরীক্ষক নির্বাচন করুন..." disabled={!selectedExamId || isLoadingExaminers} required />
          <Button onClick={handleGenerateSheets} disabled={isLoading || !selectedExaminerId} leftIcon={isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <PrinterIcon className="w-5 h-5"/>}>
            {isLoading ? 'লোড হচ্ছে...' : 'প্রিভিউ দেখুন'}
          </Button>
        </div>
      </Card>
      
      {isPreviewModalOpen && boardProfile && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`নম্বরপত্র প্রিভিউ - ${selectedExaminerName}`}
          pageStyle="@page { size: A4 portrait; margin: 8mm; }"
          printTargetId="print-number-sheets-area"
        >
          <div id="print-number-sheets-area">
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
    </div>
  );
};

export default NumberSheetPage;