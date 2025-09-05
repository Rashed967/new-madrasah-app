
import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ArrowPathIcon } from '../../../components/ui/Icon';
import { MarhalaSummary } from '../hooks/useExamineeRegistration';

interface StatisticsPanelProps {
  isLoadingFeeCollections: boolean;
  isLoadingExistingExaminees: boolean;
  selectedExamId: string;
  selectedMadrasa: any;
  currentMarhalaSummary: MarhalaSummary | undefined;
  selectedFeeCollection: any;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ 
    isLoadingFeeCollections, isLoadingExistingExaminees, selectedExamId, 
    selectedMadrasa, currentMarhalaSummary, selectedFeeCollection 
}) => {
  return (
    <div className="w-full lg:w-2/12 space-y-4">
      <Card title="পরিসংখ্যান" bodyClassName="p-3" titleClassName="p-2 pt-3 text-md text-black">
        {(isLoadingFeeCollections || isLoadingExistingExaminees) && selectedExamId && selectedMadrasa ? 
          <div className="flex items-center justify-center p-2"><ArrowPathIcon className="w-5 h-5 animate-spin text-emerald-500 mr-1"/> পরিসংখ্যান লোড হচ্ছে...</div> : 
        currentMarhalaSummary ? (
          <>
            <div className="text-xs">
              <p className="font-semibold text-emerald-700">{currentMarhalaSummary.marhalaName}</p>
              <div className="mt-1">
                <div className="flex justify-between"><span className="text-gray-600">নিয়মিত:</span> <span className="font-medium">{currentMarhalaSummary.registeredRegular.toLocaleString('bn-BD')} / {currentMarhalaSummary.totalRegularSlots.toLocaleString('bn-BD')}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(currentMarhalaSummary.totalRegularSlots > 0 ? (currentMarhalaSummary.registeredRegular / currentMarhalaSummary.totalRegularSlots) * 100 : 0)}%` }}></div></div>
              </div>
              <div className="mt-1">
                <div className="flex justify-between"><span className="text-gray-600">অনিয়মিত:</span> <span className="font-medium">{currentMarhalaSummary.registeredIrregular.toLocaleString('bn-BD')} / {currentMarhalaSummary.totalIrregularSlots.toLocaleString('bn-BD')}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(currentMarhalaSummary.totalIrregularSlots > 0 ? (currentMarhalaSummary.registeredIrregular / currentMarhalaSummary.totalIrregularSlots) * 100 : 0)}%` }}></div></div>
              </div>
              <p className="mt-1 text-gray-600">পরবর্তী রেজি. নং: <span className="font-bold text-indigo-600">{currentMarhalaSummary.nextAvailableRegNoDisplay}</span></p>
            </div>
            <hr className="my-2"/>
            <p className="text-xs text-gray-500">এই রশিদ ও মারহালায় ছবি আবশ্যক: <span className={`font-medium ${currentMarhalaSummary.requiresPhoto && currentMarhalaSummary.marhalaType === 'boys' ? 'text-green-600' : 'text-red-600'}`}>{currentMarhalaSummary.requiresPhoto && currentMarhalaSummary.marhalaType === 'boys' ? 'হ্যাঁ (বালক)' : 'না'}</span></p>
          </>
        ) : selectedFeeCollection ? (<p className="text-xs text-gray-500">পরিসংখ্যান দেখাতে একটি মারহালা নির্বাচন করুন।</p>) : (<p className="text-xs text-gray-500">কোনো ফি রশিদ নির্বাচন করা হয়নি।</p>)
        }
      </Card>
    </div>
  );
};
