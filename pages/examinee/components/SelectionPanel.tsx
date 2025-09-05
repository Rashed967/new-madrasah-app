import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { XMarkIcon, ArrowPathIcon } from '../../../components/ui/Icon';
import { Madrasa, RegistrationFeeCollection, SelectOption } from '../../../types';
import { MarhalaSummary } from '../hooks/useExamineeRegistration';

interface SelectionPanelProps {
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  setSelectedMadrasa: (madrasa: Madrasa | null) => void;
  setSelectedFeeCollectionId: (id: string) => void;
  setAllFeeCollectionsForMadrasaExam: (collections: RegistrationFeeCollection[]) => void;
  setMarhalaSummaries: (summaries: MarhalaSummary[]) => void;
  handleSelectMarhalaForEntry: (id: string) => void;
  examOptionsSelect: SelectOption[];
  errors: any;
  isLoadingExams: boolean;
  selectedMadrasa: Madrasa | null;
  handleClearSelectedMadrasa: () => void;
  madrasaSearchTerm: string;
  setMadrasaSearchTerm: (term: string) => void;
  isMadrasaDropdownOpen: boolean;
  setIsMadrasaDropdownOpen: (isOpen: boolean) => void;
  isSearchingMadrasas: boolean;
  filteredMadrasasForSearch: Madrasa[];
  handleSelectMadrasa: (madrasa: Madrasa) => void;
  allFeeCollectionsForMadrasaExam: RegistrationFeeCollection[];
  feeCollectionOptions: SelectOption[];
  selectedFeeCollectionId: string;
  selectedFeeCollection: RegistrationFeeCollection | null;
  isOverallFormDisabled: boolean;
  isLoadingFeeCollections: boolean;
  isLoadingExistingExaminees: boolean;
  isLoadingAllExamineesForFilter: boolean;
  marhalaSummaries: MarhalaSummary[];
  selectedMarhalaForEntry: string;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ 
    selectedExamId, setSelectedExamId, setSelectedMadrasa, setSelectedFeeCollectionId, 
    setAllFeeCollectionsForMadrasaExam, setMarhalaSummaries, handleSelectMarhalaForEntry,
    examOptionsSelect, errors, isLoadingExams, selectedMadrasa, handleClearSelectedMadrasa,
    madrasaSearchTerm, setMadrasaSearchTerm, isMadrasaDropdownOpen, setIsMadrasaDropdownOpen,
    isSearchingMadrasas, filteredMadrasasForSearch, handleSelectMadrasa, allFeeCollectionsForMadrasaExam,
    feeCollectionOptions, selectedFeeCollectionId, selectedFeeCollection, isOverallFormDisabled,
    isLoadingFeeCollections, isLoadingExistingExaminees, isLoadingAllExamineesForFilter, marhalaSummaries,
    selectedMarhalaForEntry
}) => {
  return (
    <div className="w-full lg:w-3/12 space-y-4">
      <Card title="পরীক্ষা ও মাদরাসা" bodyClassName="p-3 " titleClassName="p-2 pt-3 text-md text-black">
        <Select 
          label="পরীক্ষা" 
          value={selectedExamId} 
          onChange={e => {
            setSelectedExamId(e.target.value); 
            setSelectedMadrasa(null); 
            setSelectedFeeCollectionId(''); 
            setAllFeeCollectionsForMadrasaExam([]); 
            setMarhalaSummaries([]); 
            handleSelectMarhalaForEntry('');
          }} 
          options={examOptionsSelect} 
          error={errors.selectedExamId} 
          placeholderOption="পরীক্ষা নির্বাচন..." 
          required 
          wrapperClassName="mb-1" 
          disabled={isLoadingExams}
        />
        <div className="relative">
          <label htmlFor="madrasaSearchExamineeRegLeft" className="block text-sm font-medium text-gray-700"> মাদরাসা {errors.selectedMadrasa && <span className="text-red-500">*</span>} </label>
          {selectedMadrasa ? (
            <div className="flex items-center justify-between p-2.5 mt-0.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 min-h-[38px]">
              <span>{selectedMadrasa.nameBn} ({selectedMadrasa.madrasaCode})</span>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearSelectedMadrasa} className="p-0.5 text-gray-500 hover:text-red-500" aria-label="রিসেট"><XMarkIcon className="w-3.5 h-3.5" /></Button>
            </div>
          ) : (
            <Input id="madrasaSearchExamineeRegLeft" type="text" placeholder="মাদ্রাসার নাম/কোড..." value={madrasaSearchTerm} onChange={(e) => {setMadrasaSearchTerm(e.target.value); if(!isMadrasaDropdownOpen) setIsMadrasaDropdownOpen(true);}} onBlur={() => setTimeout(() => setIsMadrasaDropdownOpen(false), 150)} onFocus={() => setIsMadrasaDropdownOpen(true)} error={errors.selectedMadrasaId && !selectedMadrasa ? errors.selectedMadrasaId : undefined} wrapperClassName="mb-0 mt-0.5" className="h-9 text-sm"/>
          )}
          {isSearchingMadrasas && isMadrasaDropdownOpen && <p className="text-xs text-gray-500">অনুসন্ধান করা হচ্ছে...</p>}
          {isMadrasaDropdownOpen && madrasaSearchTerm && filteredMadrasasForSearch.length > 0 && !isSearchingMadrasas && (
            <ul className="absolute w-full border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-20">
              {filteredMadrasasForSearch.map(m => <li key={m.id} onClick={() => handleSelectMadrasa(m)} className="p-1.5 hover:bg-emerald-50 cursor-pointer text-xs text-gray-800">{m.nameBn} ({m.madrasaCode})</li>)}
            </ul>
          )}
        </div>
        {allFeeCollectionsForMadrasaExam.length > 0 && feeCollectionOptions.length > 0 && (
          <Select label="নিবন্ধন ফি রশিদ" value={selectedFeeCollectionId} onChange={e => setSelectedFeeCollectionId(e.target.value)} options={feeCollectionOptions} error={errors.selectedFeeCollectionIdError} placeholderOption="ফি রশিদ নির্বাচন..." required wrapperClassName="mb-1"/>
        )}
        {errors.selectedFeeCollection && <p className="text-xs text-red-500">{errors.selectedFeeCollection}</p>}
        {feeCollectionOptions.length === 0 && selectedExamId !== '' && selectedMadrasa !== null && !isLoadingFeeCollections && !isLoadingAllExamineesForFilter &&
          <p className="text-xs text-orange-600">এই পরীক্ষা ও মাদ্রাসার জন্য সকল নিবন্ধন ফি সংগ্রহের রশিদ পূর্ণ হয়ে গেছে অথবা কোনো উপলব্ধ রশিদ নেই।</p>
        }
      </Card>

      {selectedFeeCollection && !isOverallFormDisabled && (
        <Card title="নিবন্ধনের জন্য মারহালা" bodyClassName="p-2 max-h-[calc(100vh-380px)] overflow-y-auto" titleClassName="p-2 pt-3 text-md text-black">
          {(isLoadingFeeCollections || isLoadingExistingExaminees || isLoadingAllExamineesForFilter) ? 
            <div className="flex items-center justify-center p-4"><ArrowPathIcon className="w-5 h-5 animate-spin text-emerald-500 mr-2"/> মারহালা তথ্য লোড হচ্ছে...</div> :
          marhalaSummaries.length > 0 ? (
            <Select 
              label="মারহালা নির্বাচন করুন"
              value={selectedMarhalaForEntry}
              onChange={(e) => handleSelectMarhalaForEntry(e.target.value)}
              options={marhalaSummaries.filter(s => s.availableRegular > 0 || s.availableIrregular > 0).map(s => ({value: s.marhalaId, label: `${s.marhalaName} (নিয়মিত খালি: ${s.availableRegular.toLocaleString('bn-BD')}, অনিয়মিত খালি: ${s.availableIrregular.toLocaleString('bn-BD')})`}))}
              placeholderOption="মারহালা নির্বাচন করুন..."
              error={errors.selectedMarhalaForEntry}
              wrapperClassName="mb-0"
              required
            />
          ) : <p className="text-center text-gray-500 py-3">ফি সংগ্রহের জন্য কোনো মারহালা পাওয়া যায়নি।</p>}
        </Card>
      )}
    </div>
  );
};