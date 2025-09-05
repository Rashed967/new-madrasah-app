import React, { useMemo } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Input } from '../../../../components/ui/Input';
import { ListBulletIcon, ChevronDownIcon } from '../../../../components/ui/Icon';
import { SearchableSelect, SearchableSelectOption } from '../../../../components/ui/SearchableSelect';
import { GroupedScripts, SelectedMadrasaInfo, Action } from '../types';

interface ScriptPoolPanelProps {
  groupedScripts: GroupedScripts;
  selectedMadrasas: Record<string, SelectedMadrasaInfo>;
  expandedMarkaz: Record<string, boolean>;
  dispatch: React.Dispatch<Action>;
  selectedMadrasahFilterId: string;
  madrasahOptions: SearchableSelectOption[];
  isLoadingMadrasahs: boolean;
}

export const ScriptPoolPanel: React.FC<ScriptPoolPanelProps> = React.memo(({ groupedScripts, selectedMadrasas, expandedMarkaz, dispatch, selectedMadrasahFilterId, madrasahOptions, isLoadingMadrasahs }) => {
  const allScriptIdsInPool = useMemo(() => Object.values(groupedScripts).flatMap(markaz => Object.values(markaz.madrasas).flatMap(madrasa => madrasa.scripts.map(s => s.examinee_id))), [groupedScripts]);
  const isAllSelected = allScriptIdsInPool.length > 0 && Object.values(selectedMadrasas).reduce((acc, curr) => acc + curr.scriptCount, 0) === allScriptIdsInPool.length;

  const filteredGroupedScripts = useMemo(() => {
    if (!selectedMadrasahFilterId) {
      return groupedScripts;
    }
    const filtered: GroupedScripts = {};
    Object.entries(groupedScripts).forEach(([markazId, markazData]) => {
      const filteredMadrasas: typeof markazData.madrasas = {};
      Object.entries(markazData.madrasas).forEach(([madrasaId, madrasaData]) => {
        if (madrasaId === selectedMadrasahFilterId) {
          filteredMadrasas[madrasaId] = madrasaData;
        }
      });
      if (Object.keys(filteredMadrasas).length > 0) {
        filtered[markazId] = { ...markazData, madrasas: filteredMadrasas };
      }
    });
    return filtered;
  }, [groupedScripts, selectedMadrasahFilterId]);

  return (
    <div className="col-span-12 lg:col-span-7"><Card>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center"><ListBulletIcon className="w-5 h-5 mr-2 text-emerald-600"/>বন্টনযোগ্য উত্তরপত্রের পুল</h3>
        <div className="flex items-center space-x-4">
          <SearchableSelect
            id="madrasah-filter"
            label="মাদ্রাসা ফিল্টার"
            options={madrasahOptions}
            value={selectedMadrasahFilterId}
            onChange={(value) => dispatch({ type: 'SET_MADRASA_FILTER', payload: value || '' })}
            placeholder="মাদ্রাসা খুঁজুন..."
            disabled={isLoadingMadrasahs}
            wrapperClassName="mb-0 w-60"
          />
          <Checkbox id="select-all-pool" label="সব নির্বাচন" checked={isAllSelected} onChange={(e) => { const allMadrasas = Object.values(filteredGroupedScripts).flatMap(m => Object.values(m.madrasas)); allMadrasas.forEach(mad => dispatch({type: 'TOGGLE_MADRASA_SELECTION', payload: { madrasaId: mad.scripts[0].madrasa_id, scripts: mad.scripts, checked: e.target.checked }})); }} />
        </div>
      </div>
      <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
        {Object.entries(filteredGroupedScripts).map(([markazId, markazData]) => {
          const allMadrasasInMarkaz = markazData.madrasas;
          const allScriptsInMarkaz = Object.values(allMadrasasInMarkaz).flatMap(m => m.scripts);
          const isAllInMarkazSelected = Object.keys(allMadrasasInMarkaz).every(madrasaId => selectedMadrasas[madrasaId]?.scriptCount === allMadrasasInMarkaz[madrasaId].scripts.length);
          return (
            <Card key={markazId} bodyClassName="p-0">
              <div className="p-3 bg-gray-100 flex justify-between items-center cursor-pointer" onClick={() => dispatch({type: 'TOGGLE_MARKAZ_EXPAND', payload: markazId})}>
                <Checkbox id={`markaz-${markazId}`} label={`${markazData.markazName} (${allScriptsInMarkaz.length.toLocaleString('bn-BD')} জন)`} checked={isAllInMarkazSelected} onChange={e => dispatch({type: 'TOGGLE_MARKAZ_SELECTION', payload: { allMadrasasInMarkaz, checked: e.target.checked}})} onClick={(e) => e.stopPropagation()} labelClassName="font-semibold"/>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedMarkaz[markazId] ? 'rotate-180' : ''}`} />
              </div>
              {expandedMarkaz[markazId] && (
                <div className="p-3 space-y-2">
                  {Object.entries(markazData.madrasas).map(([madrasaId, madrasaData]) => {
                    const isMadrasaSelected = !!selectedMadrasas[madrasaId];
                    const selectionInfo = selectedMadrasas[madrasaId];
                    return (
                      <div key={madrasaId} className="pl-2 border-l-2 py-1">
                        <div className="flex items-center justify-between">
                            <Checkbox id={`madrasa-${madrasaId}`} label={`${madrasaData.madrasaName} (${madrasaData.madrasaCode}) (${madrasaData.scripts.length.toLocaleString('bn-BD')} জন)`} checked={isMadrasaSelected} onChange={(e) => dispatch({ type: 'TOGGLE_MADRASA_SELECTION', payload: { madrasaId, scripts: madrasaData.scripts, checked: e.target.checked } })} />
                            {isMadrasaSelected && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">খাতা:</span>
                                    <Input type="number" value={selectionInfo.scriptCount} onChange={(e) => dispatch({ type: 'UPDATE_MADRASA_SELECTION_COUNT', payload: { madrasaId, count: parseInt(e.target.value) || 0 }})} max={selectionInfo.totalScripts} min={0} className="w-20 h-8 text-sm text-center" wrapperClassName="mb-0" />
                                </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card></div>
  );
});

ScriptPoolPanel.displayName = 'ScriptPoolPanel';
