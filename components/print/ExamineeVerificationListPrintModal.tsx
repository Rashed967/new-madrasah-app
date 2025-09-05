import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { SearchableSelect, SearchableSelectOption } from '../ui/SearchableSelect';
import { BoardProfile, BoardProfileDbRow, ExamFeeFormData, MadrasaDbRow } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import PrintPreviewModal from './PrintPreviewModal';
import { ExamFeeFormPrintLayout } from './ExamineeVerificationPrintLayout';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';

interface ExamFeeFormPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const ExamFeeFormPrintModal: React.FC<ExamFeeFormPrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedMadrasaId, setSelectedMadrasaId] = useState<string | null>('');

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [dataToPrint, setDataToPrint] = useState<ExamFeeFormData | null>(null);
  const [boardProfileToPrint, setBoardProfileToPrint] = useState<BoardProfile | null>(null);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<SearchableSelectOption[], Error>({
    queryKey: ['allExamsForFeeFormPrint'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', { p_limit: 1000 });
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: madrasas = [], isLoading: isLoadingMadrasas } = useQuery<SearchableSelectOption[], Error>({
    queryKey: ['allMadrasasForFeeFormPrint'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_madrasas_for_filter_dropdown', { p_limit: 10000 });
      if (error) throw error;
      return data.items || [];
    }
  });

  const handlePreviewAndPrint = async () => {
    if(!selectedExamId || !selectedMadrasaId) {
      addToast('অনুগ্রহ করে পরীক্ষা এবং মাদরাসা নির্বাচন করুন।', 'warning');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: profileData, error: profileError } = await supabase.from('board_profile').select('*').eq('id', 'MAIN_PROFILE').single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setBoardProfileToPrint(mapBoardProfileDbToFrontend(profileData as BoardProfileDbRow || undefined));

      const { data: examineeData, error: examineeError } = await supabase.rpc('get_examinee_list_for_verification', {
        p_exam_id: selectedExamId,
        p_madrasa_id: selectedMadrasaId
      });
      if (examineeError) throw examineeError;

      const typedData = examineeData as ExamFeeFormData;
      setDataToPrint(typedData);
      
      if(!typedData || !typedData.marhala_groups || typedData.marhala_groups.length === 0){
        addToast('এই ফিল্টারে কোনো পরীক্ষার্থী পাওয়া যায়নি।', 'info');
      } else {
        setIsPreviewModalOpen(true);
      }
    } catch (error: any) {
      addToast(`তথ্য আনতে সমস্যা: ${error.message}`, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectedExam = useMemo(() => exams.find(e => e.value === selectedExamId), [exams, selectedExamId]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="পরীক্ষা ফি জমা ফরম প্রিন্ট" size="lg">
        <div className="grid grid-cols-1 gap-4 p-1">
          <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} required />
          <SearchableSelect id="madrasaSelectForFeeForm" label="মাদরাসা" options={madrasas} value={selectedMadrasaId} onChange={setSelectedMadrasaId} placeholder="মাদরাসা খুঁজুন বা নির্বাচন করুন..." disabled={isLoadingMadrasas} required/>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বন্ধ করুন</Button>
          <Button onClick={handlePreviewAndPrint} disabled={isLoadingData} leftIcon={isLoadingData ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4"/>}>
            {isLoadingData ? 'লোড হচ্ছে...' : 'প্রিভিউ দেখুন'}
          </Button>
        </div>
      </Modal>
      
      {isPreviewModalOpen && boardProfileToPrint && dataToPrint?.madrasa_info && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="পরীক্ষা ফি জমা ফরম"
          pageStyle="@page { size: A4 landscape; margin: 10mm; } @media print { .fee-form-page { page-break-after: always; } }"
          printTargetId="printable-fee-form-area"
        >
          <div id="printable-fee-form-area">
            {dataToPrint.marhala_groups.map((group) => (
              <div key={group.marhala_id} className="fee-form-page">
                 <ExamFeeFormPrintLayout
                    marhalaGroup={group}
                    boardProfile={boardProfileToPrint}
                    examName={selectedExam?.label || ''}
                    madrasaInfo={dataToPrint.madrasa_info}
                  />
              </div>
            ))}
          </div>
        </PrintPreviewModal>
      )}
    </>
  );
};
