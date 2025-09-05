
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { BoardProfile, BoardProfileDbRow, SelectOption as GlobalSelectOption, Markaz, MarkazDbRow, Zone, ZoneApiResponse } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import PrintPreviewModal from './PrintPreviewModal';
import { MarkazAttendancePrintLayout } from './MarkazAttendancePrintLayout';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';

interface MarkazAttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mapMarkazDbRowToFrontend = (dbRow: MarkazDbRow): Markaz => ({
    id: dbRow.id,
    nameBn: dbRow.name_bn,
    markazCode: dbRow.markaz_code,
    hostMadrasaId: dbRow.host_madrasa_id,
    zoneId: dbRow.zone_id,
    examineeCapacity: dbRow.examinee_capacity,
    isActive: dbRow.is_active,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at
});

const MarkazAttendancePrintModal: React.FC<MarkazAttendancePrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedMarkazId, setSelectedMarkazId] = useState<string>('');

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const { data: exams = [], isLoading: isLoadingExams } = useQuery<GlobalSelectOption[], Error>({
    queryKey: ['allExamsForAttendancePrint'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exams_for_filter_dropdown', { p_limit: 1000 });
      if (error) throw error;
      return data.items || [];
    }
  });

  const { data: zones = [], isLoading: isLoadingZones } = useQuery<ZoneApiResponse[], Error>({
      queryKey: ['allZonesForAttendancePrint'],
      queryFn: async () => {
        const { data, error } = await supabase.from('zones').select('id, name_bn, zone_code, districts');
        if (error) throw error;
        return data || [];
      },
  });

  const { data: markazes = [], isLoading: isLoadingMarkazes } = useQuery<Markaz[], Error>({
      queryKey: ['allMarkazesForAttendancePrint', selectedZoneId],
      queryFn: async () => {
        let query = supabase.from('markazes').select('*').eq('is_active', true);
        if (selectedZoneId) {
            query = query.eq('zone_id', selectedZoneId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data as MarkazDbRow[]).map(mapMarkazDbRowToFrontend);
      },
      enabled: !!isOpen
  });

  const zoneOptions: GlobalSelectOption[] = useMemo(() => 
    (zones || []).map(z => ({ value: z.id, label: z.name_bn })), 
    [zones]
  );
  
  const markazOptions: GlobalSelectOption[] = useMemo(() => {
    return markazes.map(m => ({value: m.id, label: `${m.nameBn} (কোড: ${m.markazCode})`}));
  }, [markazes]);
  
  const handlePreviewAndPrint = async () => {
    if(!selectedExamId) {
      addToast('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।', 'warning');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.rpc('get_markaz_attendance_sheet_data', {
        p_exam_id: selectedExamId,
        p_zone_id: selectedZoneId || null,
        p_markaz_id: selectedMarkazId || null
      });

      if (error) throw error;

      if(!data || !data.markazes || data.markazes.length === 0){
        addToast('এই ফিল্টারে কোনো মারকায বা পরীক্ষার্থী পাওয়া যায়নি।', 'info');
      } else {
        setReportData(data);
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
      <Modal isOpen={isOpen} onClose={onClose} title="মারকায ভিত্তিক হাজিরা প্রিন্ট" size="lg">
        <div className="grid grid-cols-1 gap-4 p-1">
          <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={exams} placeholderOption="পরীক্ষা নির্বাচন করুন" disabled={isLoadingExams} required />
          <Select label="জোন (ঐচ্ছিক)" value={selectedZoneId} onChange={(e) => { setSelectedZoneId(e.target.value); setSelectedMarkazId(''); }} options={zoneOptions} placeholderOption="সকল জোন" disabled={isLoadingZones} />
          <Select label="মারকায (ঐচ্ছিক)" value={selectedMarkazId} onChange={(e) => setSelectedMarkazId(e.target.value)} options={markazOptions} placeholderOption="সকল মারকায" disabled={isLoadingMarkazes} />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বন্ধ করুন</Button>
          <Button onClick={handlePreviewAndPrint} disabled={isLoadingData || !selectedExamId} leftIcon={isLoadingData ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4"/>}>
            {isLoadingData ? 'লোড হচ্ছে...' : 'প্রিভিউ দেখুন'}
          </Button>
        </div>
      </Modal>
      
      {isPreviewModalOpen && reportData && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`মারকায ভিত্তিক হাজিরা - ${reportData.exam_name}`}
          pageStyle="@page { size: A3 landscape; margin: 10mm; } @media print { .attendance-page { page-break-after: always; } }"
          printTargetId="printable-attendance-sheet-area"
        >
          <div id="printable-attendance-sheet-area">
              <MarkazAttendancePrintLayout reportData={reportData} />
          </div>
        </PrintPreviewModal>
      )}
    </>
  );
};

export default MarkazAttendancePrintModal;
