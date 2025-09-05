
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Madrasa, MadrasaDbRow, SelectOption, ZoneApiResponse, BoardProfile, BoardProfileDbRow, Division, District, Upazila } from '../../types';
import { supabase } from '../../lib/supabase';
import { DIVISIONS_BD, MADRASA_TYPE_OPTIONS } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import PrintPreviewModal from './PrintPreviewModal';
import MadrasaAddressPrintLayout from './MadrasaAddressPrintLayout';
import { ArrowPathIcon, PrinterIcon } from '../ui/Icon';

interface MadrasaAddressPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mapMadrasaDbRowToFrontend = (dbRow: MadrasaDbRow): Madrasa => ({
    id: dbRow.id, madrasaCode: dbRow.madrasa_code, nameBn: dbRow.name_bn, nameAr: dbRow.name_ar, nameEn: dbRow.name_en || undefined,
    address: { 
        holding: dbRow.address?.holding || undefined, 
        village: dbRow.address.village, 
        postOffice: dbRow.address?.post_office || undefined, // Correctly map post_office
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
});

const MadrasaAddressPrintModal: React.FC<MadrasaAddressPrintModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [districtOptions, setDistrictOptions] = useState<SelectOption[]>([]);
  const [upazilaOptions, setUpazilaOptions] = useState<SelectOption[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [madrasasToPrint, setMadrasasToPrint] = useState<Madrasa[]>([]);
  const [filterDescription, setFilterDescription] = useState<string>('');

  const { data: zones = [], isLoading: isLoadingZones } = useQuery<ZoneApiResponse[], Error>({
    queryKey: ['allZonesForAddressPrintFilter'],
    queryFn: async () => { const { data, error } = await supabase.from('zones').select('id, name_bn, zone_code, districts'); if (error) throw error; return data || []; },
  });
  const zoneOptions: SelectOption[] = useMemo(() => (zones || []).map(z => ({ value: z.id, label: `${z.name_bn} (${z.zone_code})`})), [zones]);
  const divisionOptions: SelectOption[] = useMemo(() => DIVISIONS_BD.map(d => ({ value: d.value, label: d.label })), []);
  
  useEffect(() => {
    if (selectedDivision) { const div = DIVISIONS_BD.find(d => d.value === selectedDivision); setDistrictOptions(div ? div.districts.map(dist => ({ value: dist.value, label: dist.label })) : []); setSelectedDistrict(''); setSelectedUpazila(''); setUpazilaOptions([]); } 
    else { setDistrictOptions([]); }
  }, [selectedDivision]);

  useEffect(() => {
    if (selectedDistrict) { const div = DIVISIONS_BD.find(d => d.value === selectedDivision); const dist = div?.districts.find(d => d.value === selectedDistrict); setUpazilaOptions(dist ? dist.upazilas.map(up => ({ value: up.value, label: up.label })) : []); setSelectedUpazila('');} 
    else { setUpazilaOptions([]); }
  }, [selectedDistrict, selectedDivision]);

  const handlePreviewAndPrint = async () => {
    setIsLoadingData(true);
    try {
      // No board profile needed for address slips specifically based on new layout
      const { data: madrasaData, error: madrasaError } = await supabase.rpc('get_madrasas_filtered', {
        p_division: selectedDivision || null, p_district: selectedDistrict || null, p_upazila: selectedUpazila || null,
        p_zone_id: selectedZone || null, p_type: selectedType || null,
        p_limit: 10000, p_page: 1, p_sort_field: 'madrasa_code', p_sort_order: 'asc'
      });
      if (madrasaError) throw madrasaError;
      
      const mappedMadrasas = (madrasaData.items as MadrasaDbRow[]).map(mapMadrasaDbRowToFrontend);
      setMadrasasToPrint(mappedMadrasas);

      let desc = [];
      if(selectedDivision) desc.push(`বিভাগ: ${divisionOptions.find(d => d.value === selectedDivision)?.label}`);
      if(selectedDistrict) desc.push(`জেলা: ${districtOptions.find(d => d.value === selectedDistrict)?.label}`);
      if(selectedUpazila) desc.push(`উপজেলা: ${upazilaOptions.find(d => d.value === selectedUpazila)?.label}`);
      if(selectedZone) desc.push(`জোন: ${zoneOptions.find(z => z.value === selectedZone)?.label}`);
      if(selectedType) desc.push(`ধরণ: ${MADRASA_TYPE_OPTIONS.find(t => t.value === selectedType)?.label}`);
      setFilterDescription(desc.length > 0 ? desc.join(', ') : 'সকল মাদরাসা');
      
      if(mappedMadrasas.length === 0){
        addToast('এই ফিল্টারে কোনো মাদরাসা পাওয়া যায়নি।', 'info');
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
      <Modal isOpen={isOpen} onClose={onClose} title="মাদ্রাসার ঠিকানা প্রিন্টের জন্য ফিল্টার" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
          <Select label="বিভাগ" value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)} options={divisionOptions} placeholderOption="সকল বিভাগ" />
          <Select label="জেলা" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} options={districtOptions} placeholderOption="সকল জেলা" disabled={!selectedDivision} />
          <Select label="থানা" value={selectedUpazila} onChange={e => setSelectedUpazila(e.target.value)} options={upazilaOptions} placeholderOption="সকল উপজেলা" disabled={!selectedDistrict} />
          <Select label="জোন" value={selectedZone} onChange={e => setSelectedZone(e.target.value)} options={zoneOptions} placeholderOption="সকল জোন" disabled={isLoadingZones} />
          <Select label="মাদ্রাসার ধরণ" value={selectedType} onChange={e => setSelectedType(e.target.value)} options={MADRASA_TYPE_OPTIONS} placeholderOption="সকল ধরণ" />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoadingData}>বন্ধ করুন</Button>
          <Button onClick={handlePreviewAndPrint} disabled={isLoadingData} leftIcon={isLoadingData ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4"/>}>
            {isLoadingData ? 'লোড হচ্ছে...' : 'প্রিভিউ ও প্রিন্ট করুন'}
          </Button>
        </div>
      </Modal>
      
      {isPreviewModalOpen && (
        <PrintPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`মাদ্রাসার ঠিকানা - ${filterDescription}`}
          printTargetId="printable-madrasa-address-slips" // Specify the target ID for addresses
          pageStyle="@page { size: A4 portrait; margin: 10mm; } @media print { .address-grid-container { grid-template-columns: repeat(2, 1fr) !important; } }" // Portrait for addresses
        >
          <MadrasaAddressPrintLayout
            madrasas={madrasasToPrint}
          />
        </PrintPreviewModal>
      )}
    </>
  );
};

export default MadrasaAddressPrintModal;