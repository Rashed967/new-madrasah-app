import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ArrowPathIcon, TrashIcon, Cog6ToothIcon } from '../../../components/ui/Icon';
import { toBengaliNumber } from '../../../lib/utils';
import { GroupedAssignmentDisplay } from '../../../types';

interface AssignedMadrasaListProps {
  isLoading: boolean;
  assignments: GroupedAssignmentDisplay[];
  onManage: (madrasaGroup: GroupedAssignmentDisplay) => void;
  onRemove: (madrasaGroup: GroupedAssignmentDisplay) => void;
  onBulkRemove: (selectedIds: string[]) => void;
}

export const AssignedMadrasaList: React.FC<AssignedMadrasaListProps> = ({
  isLoading,
  assignments,
  onManage,
  onRemove,
  onBulkRemove,
}) => {
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<string[]>([]);

  const handleToggleBulkDeleteMadrasa = (madrasaId: string) => {
    setSelectedForBulkDelete(prev =>
      prev.includes(madrasaId) ? prev.filter(id => id !== madrasaId) : [...prev, madrasaId]
    );
  };

  const handleSelectAllVisibleAssigned = (checked: boolean) => {
    setSelectedForBulkDelete(checked ? assignments.map(g => g.madrasaId) : []);
  };

  const isAllVisibleAssignedSelected = useMemo(() => {
    if (assignments.length === 0) return false;
    return assignments.every(g => selectedForBulkDelete.includes(g.madrasaId));
  }, [assignments, selectedForBulkDelete]);

  const handleBulkDeleteClick = () => {
    onBulkRemove(selectedForBulkDelete);
    setSelectedForBulkDelete([]);
  }

  return (
    <Card>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">নির্ধারিত মাদরাসা ও মারহালাসমূহ</h3>
        <Button
          onClick={handleBulkDeleteClick}
          variant="danger"
          size="sm"
          disabled={selectedForBulkDelete.length === 0}
          leftIcon={<TrashIcon className="w-4 h-4"/>}
        >
          নির্বাচিতগুলো মুছুন
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center p-8"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500"/> <span className="ml-2 text-black">এসাইনমেন্ট তালিকা লোড হচ্ছে...</span></div>
      ) : assignments.length > 0 ? (
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-center" style={{width: '20px'}}><Checkbox id="selectAllVisibleAssigned" labelClassName="sr-only" checked={isAllVisibleAssignedSelected} onChange={(e) => handleSelectAllVisibleAssigned(e.target.checked)} disabled={assignments.length === 0} aria-label="সব দৃশ্যমান এসাইনমেন্ট নির্বাচন করুন"/></th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500" style={{width: '180px'}}>মাদরাসার নাম</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500" style={{width: '40px'}}>মারহালা সংখ্যা</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500" style={{width: '70px'}}>কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map(group => (
                <tr key={group.madrasaId} className={selectedForBulkDelete.includes(group.madrasaId) ? 'bg-red-50' : ''}>
                  <td className="px-3 py-3 text-center"><Checkbox id={`assigned-madrasa-${group.madrasaId}`} checked={selectedForBulkDelete.includes(group.madrasaId)} onChange={() => handleToggleBulkDeleteMadrasa(group.madrasaId)} labelClassName="sr-only"/></td>
                  <td className="px-4 py-3 text-sm text-black text-right font-medium" style={{maxWidth: '180px', wordBreak: 'break-word', whiteSpace: 'normal'}}>{group.madrasaNameBn} - {toBengaliNumber(group.madrasaCode)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-black text-center">{toBengaliNumber(group.marhalas.length)}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    <Button variant="ghost" size="sm" onClick={() => onManage(group)} leftIcon={<Cog6ToothIcon className="w-4 h-4"/>}>পরিচালনা</Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(group)} leftIcon={<TrashIcon className="w-4 h-4"/>} className="text-red-500 hover:text-red-700">সব মুছুন</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 text-black">এই মারকাযে কোনো মাদরাসা এসাইন করা নেই।</div>
      )}
    </Card>
  );
};
