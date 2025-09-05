import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { SelectOption, BoardProfile, BoardProfileDbRow, Exam, Markaz, MarkazDbRow } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import PrintPreviewModal from './PrintPreviewModal';
import MarkazWiseExamineePrintLayout from './MarkazWiseExamineePrintLayout';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';

interface MarkazWiseExamineePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExamineePrintData {
  roll_number: number;
  registration_number: number;
  name_bn: string;
  madrasa_name_bn: string;
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

const mapMarkazDbRowToFrontend = (dbRow: MarkazDbRow): Markaz => ({ id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code, hostMadrasaId: dbRow.host_madrasa_id, zoneId: dbRow.zone_id, examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active, createdAt: dbRow.created_at, updatedAt: dbRow.updated_at });


const MarkazWiseExamineePrintModal: React.FC<MarkazWiseExamineePrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedMarkazId, setSelectedMarkazId] = useState('');

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [examineesToPrint, setExamineesToPrint] = useState<ExamineePrintData[]>([]);
  const [boardProfileToPrint, setBoardProfileToPrint] = useState<BoardProfile | null>(null);
  const [filterDescription, setFilterDescription] = useState<string>('');

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<SelectOption[], Error>({
    queryKey: ['activeExamsForMarkazExamineePrint'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', { p_limit: 1000 });
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<Markaz[], Error>({
    queryKey: ['activeMarkazesForMarkazExamineePrint'],
    queryFn: async () => {
      const { data, error } = await supabase.from('markazes').select('*').eq('is_active', true).order('name_bn');
      if (error) throw error;
      return (data as MarkazDbRow[]).map(mapMarkazDbRowToFrontend);
    }
  });

  const markazOptions: SelectOption[] = useMemo(() =>
    markazes.map(mk => ({ value: mk.id, label: `${mk.nameBn} (কোড: ${mk.markazCode})` }))
  , [markazes]);
  
  const handlePreviewAndPrint = async () => {
    if(!selectedExamId || !selectedMarkazId) {
      addToast('অনুগ্রহ করে পরীক্ষা এবং মারকায নির্বাচন করুন।', 'warning');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: profileData, error: profileError } = await supabase.from('board_profile').select('*').eq('id', 'MAIN_PROFILE').single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setBoardProfileToPrint(mapBoardProfileDbToFrontend(profileData as BoardProfileDbRow || undefined));

      const { data: examineeData, error: examineeError } = await supabase.rpc('get_examinees_for_markaz_exam', {
        p_exam_id: selectedExamId,
        p_markaz_id: selectedMarkazId
      });
      if (examineeError) throw examineeError;
      
      setExamineesToPrint(examineeData || []);

      const examName = exams.find(e => e.value === selectedExamId)?.label || '';
      const markazName = markazes.find(m => m.id === selectedMarkazId)?.nameBn || '';
      setFilterDescription(`পরীক্ষা: ${examName}, মারকায: ${markazName}`);
      
      if(!examineeData || examineeData.length === 0){
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="মারকায ভিত্তিক পরীক্ষার্থী তালিকা প্রিন্ট" size="lg">
        <div className="grid grid-cols-1 gap-4 p-1">
          <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} required />
          <Select label="মারকায" value={selectedMarkazId} onChange={e => setSelectedMarkazId(e.target.value)} options={markazOptions} placeholderOption="মারকায নির্বাচন করুন" disabled={isLoadingMarkazes} required />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বন্ধ করুন</Button>
          <Button onClick={handlePreviewAndPrint} disabled={isLoadingData} leftIcon={isLoadingData ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4"/>}>
            {isLoadingData ? 'লোড হচ্ছে...' : 'তালিকা দেখুন ও প্রিন্ট করুন'}
          </Button>
        </div>
      </Modal>
      
      {isPreviewModalOpen && boardProfileToPrint && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="মারকায ভিত্তিক পরীক্ষার্থী তালিকা"
          pageStyle="@page { size: A4 portrait; margin: 10mm; }"
        >
          <MarkazWiseExamineePrintLayout
            examinees={examineesToPrint}
            boardProfile={boardProfileToPrint}
            examName={exams.find(e => e.value === selectedExamId)?.label || ''}
            markazName={markazes.find(m => m.id === selectedMarkazId)?.nameBn || ''}
          />
        </PrintPreviewModal>
      )}
    </>
  );
};

export default MarkazWiseExamineePrintModal;