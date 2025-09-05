import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ArrowPathIcon, PlusCircleIcon, ChevronDownIcon, ChevronUpIcon } from '../../../components/ui/Icon';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { toBengaliNumber } from '../../../lib/utils';
import { SelectOption, MarhalaSpecificType, Zone as ZoneType, ZoneApiResponse, MadrasaType } from '../../../types';
import { MADRASA_TYPE_OPTIONS } from '../../../constants';

const getCategoryLabel = (category: string): string => {
    if (category === 'darsiyat') return 'দরসিয়াত';
    if (category === 'hifz') return 'হিফজ';
    return category;
}

interface AssignableMadrasa {
  madrasa_id: string;
  madrasa_name_bn: string;
  madrasa_code: number;
  madrasa_type: MarhalaSpecificType | 'both';
  assignable_marhalas: {
    marhala_id: string;
    marhala_name_bn: string;
    marhala_type: MarhalaSpecificType;
    marhala_category: string;
  }[];
}

interface AssignableMadrasaListProps {
  selectedExamId: string;
  selectedMarkazId: string;
  onAssignmentSuccess: () => void;
}

export const AssignableMadrasaList: React.FC<AssignableMadrasaListProps> = ({ selectedExamId, selectedMarkazId, onAssignmentSuccess }) => {
  const { addToast } = useToast();
  const [selectedMadrasasForBulkAssignment, setSelectedMadrasasForBulkAssignment] = useState<Record<string, { madrasaId: string; marhalaIds: string[] }>>({});
  const [assignableMadrasasPage, setAssignableMadrasasPage] = useState(1);
  const [assignableMadrasas, setAssignableMadrasas] = useState<AssignableMadrasa[]>([]);
  const assignableMadrasasLimit = 20;

  const [filterZoneId, setFilterZoneId] = useState<string>('');
  const [filterMadrasaType, setFilterMadrasaType] = useState<MadrasaType>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [expandedMarhalas, setExpandedMarhalas] = useState<Record<string, boolean>>({});

  const { data: zones = [], isLoading: isLoadingZones } = useQuery<ZoneType[], Error>({
    queryKey: ['allZonesForAssignmentFilter'],
    queryFn: async (): Promise<ZoneType[]> => { 
        const { data, error } = await supabase.from('zones').select('id, zone_code, name_bn, districts, created_at, updated_at').order('name_bn'); 
        if (error) throw error; 
        const rawData = data || [];
        return rawData.map((z_api: ZoneApiResponse) => ({
            id: z_api.id,
            zoneCode: z_api.zone_code,
            nameBn: z_api.name_bn,
            districts: z_api.districts || [],
            createdAt: z_api.created_at,
            updatedAt: z_api.updated_at,
        }));
    }
  });

  const madrasaTypesToFilter = useMemo(() => {
    if (filterMadrasaType === 'boys') return ['boys'];
    if (filterMadrasaType === 'girls') return ['girls'];
    if (filterMadrasaType === 'both') return ['boys', 'girls'];
    return null; // No filter applied
  }, [filterMadrasaType]);

  const { data: assignableMadrasasData, isLoading: isLoadingAssignableMadrasas, isFetching: isFetchingAssignableMadrasas } = useQuery<{ items: AssignableMadrasa[], total: number }, Error>({
    queryKey: ['assignableMadrasasForExam', selectedExamId, assignableMadrasasPage, assignableMadrasasLimit, filterZoneId, debouncedSearchTerm, madrasaTypesToFilter],
    queryFn: async () => {
        if (!selectedExamId) return { items: [], total: 0 };
        const { data, error, count } = await supabase.rpc(
            'get_assignable_madrasas_for_exam',
            {
                p_exam_id: selectedExamId,
                p_page: assignableMadrasasPage,
                p_limit: assignableMadrasasLimit,
                p_zone_id: filterZoneId || null,
                p_search_term: debouncedSearchTerm || null,
                p_madrasa_types: madrasaTypesToFilter
            },
            { count: 'exact' }
        );
        if (error) throw error;
        return { items: data || [], total: count || 0 };
    },
    enabled: !!selectedExamId,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setAssignableMadrasasPage(1); // Reset page when search term changes
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (assignableMadrasasData?.items) {
      if (assignableMadrasasPage === 1) {
        setAssignableMadrasas(assignableMadrasasData.items);
      } else {
        setAssignableMadrasas(prev => [...prev, ...assignableMadrasasData.items]);
      }
    }
  }, [assignableMadrasasData, assignableMadrasasPage]);

  const totalAssignableMadrasas = assignableMadrasasData?.total || 0;
  const hasMoreAssignableMadrasas = assignableMadrasas.length < totalAssignableMadrasas;

  const zoneFilterOptions: SelectOption[] = useMemo(() => {
    const sortedZones = zones
      .slice()
      .sort((a, b) => {
        const numA = parseInt(a.zoneCode.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.zoneCode.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
      });
    return [{value: '', label: 'সকল জোন'}, ...sortedZones.map(z => ({ value: z.id, label: `${z.nameBn} (${z.zoneCode})` }))];
}, [zones]);
  const madrasaTypeFilterOptions: SelectOption[] = useMemo(() => [{value: '', label: 'সকল ধরণ'}, ...MADRASA_TYPE_OPTIONS], []);

  const assignMutation = useMutation({
    mutationFn: async (assignmentsToCreate: { markazId: string; examId: string; madrasaId: string; marhalaId: string }[]) => {
        const { data, error } = await supabase.from('markaz_madrasa_marhala_assignments').insert(assignmentsToCreate);
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        addToast('সফলভাবে এসাইন করা হয়েছে!', 'success');
        setSelectedMadrasasForBulkAssignment({});
        onAssignmentSuccess();
    },
    onError: (error: Error) => {
        addToast(`এসাইনমেন্টে ত্রুটি: ${error.message}`, 'error');
    }
  });

  const handleBulkAssign = () => {
    if (!selectedExamId || !selectedMarkazId || Object.keys(selectedMadrasasForBulkAssignment).length === 0) {
        addToast('অনুগ্রহ করে পরীক্ষা, মারকায, এবং এসাইন করার জন্য মাদরাসা/মারহালা নির্বাচন করুন।', 'warning');
        return;
    }
    const assignmentsToCreate: { markaz_id: string; exam_id: string; madrasa_id: string; marhala_id: string }[] = [];
    Object.values(selectedMadrasasForBulkAssignment).forEach(madrasaSelection => {
        const madrasaDetails = assignableMadrasas.find(m => m.madrasa_id === madrasaSelection.madrasaId);
        if (!madrasaDetails) return;
        const marhalasToAssign = madrasaSelection.marhalaIds.length > 0 ? madrasaSelection.marhalaIds : madrasaDetails.assignable_marhalas.map(mh => mh.marhala_id);
        marhalasToAssign.forEach(marhalaId => {
            assignmentsToCreate.push({ markaz_id: selectedMarkazId, exam_id: selectedExamId, madrasa_id: madrasaSelection.madrasaId, marhala_id: marhalaId });
        });
    });
    if (assignmentsToCreate.length > 0) {
        assignMutation.mutate(assignmentsToCreate as any);
    } else {
        addToast('এসাইন করার জন্য কোনো মারহালা নির্বাচন করা হয়নি।', 'info');
    }
  };

  const handleMadrasaCheckboxChange = (madrasaId: string, checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const newState = { ...prev };
        if (checked) {
            if (!newState[madrasaId]) {
                newState[madrasaId] = { madrasaId, marhalaIds: [] };
            }
        } else {
            delete newState[madrasaId];
        }
        return newState;
    });
  };

  const handleMarhalaCheckboxChange = (madrasaId: string, marhalaIdToToggle: string, checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const madrasaSelection = prev[madrasaId] || { madrasaId, marhalaIds: [] };
        const newMarhalaIds = checked
            ? [...madrasaSelection.marhalaIds, marhalaIdToToggle]
            : madrasaSelection.marhalaIds.filter(id => id !== marhalaIdToToggle);
        return { ...prev, [madrasaId]: { ...madrasaSelection, marhalaIds: newMarhalaIds } };
    });
  };

  const handleSelectAllMarhalasForMadrasa = (madrasaId: string, assignableMarhalas: AssignableMadrasa['assignable_marhalas'], checked: boolean) => {
    setSelectedMadrasasForBulkAssignment(prev => {
        const madrasaSelection = prev[madrasaId] || { madrasaId, marhalaIds: [] };
        const newMarhalaIds = checked ? assignableMarhalas.map(mh => mh.marhala_id) : [];
        return { ...prev, [madrasaId]: { ...madrasaSelection, marhalaIds: newMarhalaIds } };
    });
  };

  const handleSelectAllVisibleMadrasas = (checked: boolean) => {
    if (checked) {
        const newSelections: Record<string, { madrasaId: string; marhalaIds: string[] }> = {};
        assignableMadrasas.forEach(madrasa => {
            newSelections[madrasa.madrasa_id] = { madrasaId: madrasa.madrasa_id, marhalaIds: [] };
        });
        setSelectedMadrasasForBulkAssignment(newSelections);
    } else {
        setSelectedMadrasasForBulkAssignment({});
    }
  };

  const isAllVisibleSelected = useMemo(() => {
    if (assignableMadrasas.length === 0) return false;
    return assignableMadrasas.every(m => !!selectedMadrasasForBulkAssignment[m.madrasa_id]);
  }, [assignableMadrasas, selectedMadrasasForBulkAssignment]);

  return (
    <Card title="নতুন মাদরাসা/মারহালা এসাইন করুন">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
        <Select label="জোন" value={filterZoneId} onChange={e => setFilterZoneId(e.target.value)} options={zoneFilterOptions} placeholderOption="সকল জোন" disabled={isLoadingZones || !selectedExamId} wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Select label="ধরণ" value={filterMadrasaType} onChange={e => setFilterMadrasaType(e.target.value as MadrasaType)} options={madrasaTypeFilterOptions} placeholderOption="সকল ধরণ" disabled={!selectedExamId} wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Input label="মাদরাসা খুঁজুন" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="নাম বা কোড দিয়ে খুঁজুন" wrapperClassName="flex-grow mb-2 sm:mb-0"/>
        <Checkbox id="selectAllVisibleMadrasas" label="সব নির্বাচন" checked={isAllVisibleSelected} onChange={(e) => handleSelectAllVisibleMadrasas(e.target.checked)} disabled={assignableMadrasas.length === 0 || isLoadingAssignableMadrasas} wrapperClassName="mt-2 sm:mt-5 whitespace-nowrap" labelClassName="text-sm font-medium text-black"/>
      </div>
      {isLoadingAssignableMadrasas && assignableMadrasasPage === 1 ? (
        <div className="flex justify-center items-center p-8"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500"/> <span className="ml-2 text-black">এসাইনযোগ্য মাদরাসা লোড হচ্ছে...</span></div>
      ) : assignableMadrasas.length > 0 ? (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {assignableMadrasas.map(madrasa => (
            <div key={madrasa.madrasa_id} className="p-3 border rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <Checkbox id={`madrasa-bulk-${madrasa.madrasa_id}`} label={`${madrasa.madrasa_name_bn} (কোড: ${toBengaliNumber(madrasa.madrasa_code)}) - ধরণ: ${madrasa.madrasa_type === 'boys' ? 'বালক' : madrasa.madrasa_type === 'girls' ? 'বালিকা' : 'উভয়'}`} checked={!!selectedMadrasasForBulkAssignment[madrasa.madrasa_id]} onChange={e => handleMadrasaCheckboxChange(madrasa.madrasa_id, e.target.checked)} labelClassName="font-semibold text-black"/>
                <Button variant="ghost" size="sm" onClick={() => setExpandedMarhalas(prev => ({...prev, [madrasa.madrasa_id]: !prev[madrasa.madrasa_id]}))} className="text-xs"> {expandedMarhalas[madrasa.madrasa_id] ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}  মারহালা ({madrasa.assignable_marhalas.length}) </Button>
              </div>
              {expandedMarhalas[madrasa.madrasa_id] && madrasa.assignable_marhalas.length > 0 && (
                <div className="mt-2 pl-4 pt-2 border-t">
                  <Checkbox id={`select-all-marhalas-${madrasa.madrasa_id}`} label="এই মাদরাসার সকল মারহালা নির্বাচন করুন" checked={ selectedMadrasasForBulkAssignment[madrasa.madrasa_id]?.marhalaIds.length === madrasa.assignable_marhalas.length && madrasa.assignable_marhalas.length > 0 } onChange={e => handleSelectAllMarhalasForMadrasa(madrasa.madrasa_id, madrasa.assignable_marhalas, e.target.checked)} wrapperClassName="mb-1" labelClassName="text-xs font-medium text-black"/>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {madrasa.assignable_marhalas.map(marhala => (
                      <Checkbox key={marhala.marhala_id} id={`marhala-bulk-${madrasa.madrasa_id}-${marhala.marhala_id}`} label={`${marhala.marhala_name_bn} (${getCategoryLabel(marhala.marhala_category)})`} checked={selectedMadrasasForBulkAssignment[madrasa.madrasa_id]?.marhalaIds.includes(marhala.marhala_id)} onChange={e => handleMarhalaCheckboxChange(madrasa.madrasa_id, marhala.marhala_id, e.target.checked)} disabled={!selectedMadrasasForBulkAssignment[madrasa.madrasa_id]} wrapperClassName="text-xs" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {hasMoreAssignableMadrasas && (
            <div className="text-center mt-4">
              <Button onClick={() => setAssignableMadrasasPage(p => p + 1)} disabled={isFetchingAssignableMadrasas} > {isFetchingAssignableMadrasas ? 'লোড হচ্ছে...' : 'আরও লোড করুন'} </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8 text-black">কোনো মাদরাসা পাওয়া যায়নি।</div>
      )}
      <div className="mt-6 text-right">
        <Button onClick={handleBulkAssign} disabled={assignMutation.isPending || Object.keys(selectedMadrasasForBulkAssignment).length === 0} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>
          {assignMutation.isPending ? 'এসাইন করা হচ্ছে...' : 'নির্বাচিত মাদরাসা ও মারহালা এসাইন করুন'}
        </Button>
      </div>
    </Card>
  );
};