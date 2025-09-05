
import React from 'react';
import { Input } from '../../../components/ui/Input';

interface ExamineeSearchProps {
  examineeSearchTerm: string;
  setExamineeSearchTerm: (term: string) => void;
  isExamineeDropdownOpen: boolean;
  setIsExamineeDropdownOpen: (isOpen: boolean) => void;
  isSearchingExaminees: boolean;
  examineeSearchResults: any[];
  handleSelectExaminee: (examinee: any) => void;
  debouncedExamineeSearchTerm: string;
}

export const ExamineeSearch: React.FC<ExamineeSearchProps> = ({ 
    examineeSearchTerm, setExamineeSearchTerm, isExamineeDropdownOpen, setIsExamineeDropdownOpen, 
    isSearchingExaminees, examineeSearchResults, handleSelectExaminee, debouncedExamineeSearchTerm 
}) => {
  return (
    <div className="p-4 border-b relative">
      <h3 className="text-md font-semibold">বিদ্যমান পরীক্ষার্থী খুঁজুন</h3>
      <Input
        label="নাম বা রেজিস্ট্রেশন নম্বর"
        placeholder="নাম বা রেজিস্ট্রেশন নম্বর দিয়ে খুঁজুন..."
        value={examineeSearchTerm}
        onChange={(e) => setExamineeSearchTerm(e.target.value)}
        onFocus={() => setIsExamineeDropdownOpen(true)}
        onBlur={() => setTimeout(() => setIsExamineeDropdownOpen(false), 150)}
        wrapperClassName="mt-2"
      />
      {isExamineeDropdownOpen && (
        <div className="absolute w-full border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto bg-white shadow-lg z-20">
          {isSearchingExaminees && <p className="p-2 text-gray-500">অনুসন্ধান করা হচ্ছে...</p>}
          {!isSearchingExaminees && examineeSearchResults && examineeSearchResults.length === 0 && debouncedExamineeSearchTerm.length >= 3 && (
            <p className="p-2 text-gray-500">কোনো ফলাফল পাওয়া যায়নি।</p>
          )}
          {examineeSearchResults && examineeSearchResults.map((examinee: any) => (
            <div
              key={examinee.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectExaminee(examinee)}
            >
              <p className="font-semibold">{examinee.name_bn} - {examinee.registration_number}</p>
              <p className="text-sm text-gray-600">{examinee.father_name_bn} (পিতা)</p>
              <p className="text-xs text-gray-500">সর্বশেষ পরীক্ষা: {examinee.exam_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
