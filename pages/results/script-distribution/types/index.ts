interface UndistributedScript {
  examinee_id: string;
  roll_number: number;
  examinee_name_bn: string;
  madrasa_id: string;
  madrasa_name_bn: string;
  madrasa_code: string; // New property
  markaz_id: string;
  markaz_name_bn: string;
}

interface GroupedScripts {
  [markazId: string]: {
    markazName: string;
    madrasas: {
      [madrasaId: string]: {
        madrasaName: string;
        madrasaCode: string; // New property
        scripts: UndistributedScript[];
      };
    };
  };
}

interface ExaminerBucket {
  examinerId: string;
  examinerName: string;
  examinerCode: string;
  scriptCount: number;
}

interface SelectedMadrasaInfo {
  scriptCount: number;
  totalScripts: number;
  scripts: UndistributedScript[];
}

interface State {
  selectedExamId: string;
  selectedMarhalaId: string;
  selectedKitabId: string;
  selectedMadrasahFilterId: string; // New filter for madrasah
  scriptPool: UndistributedScript[];
  groupedScripts: GroupedScripts;
  selectedMadrasas: Record<string, SelectedMadrasaInfo>; // Key is madrasaId
  examinerBuckets: ExaminerBucket[];
  isPanelVisible: boolean;
  expandedMarkaz: Record<string, boolean>;
}

type Action =
  | { type: 'SET_FILTER'; payload: { filter: 'selectedExamId' | 'selectedMarhalaId' | 'selectedKitabId'; value: string } }
  | { type: 'SET_MADRASA_FILTER'; payload: string } // New action for madrasah filter
  | { type: 'FETCH_SUCCESS'; payload: UndistributedScript[] }
  | { type: 'FETCH_SCRIPTS_ERROR' }
  | { type: 'TOGGLE_MADRASA_SELECTION'; payload: { madrasaId: string, scripts: UndistributedScript[], checked: boolean } }
  | { type: 'UPDATE_MADRASA_SELECTION_COUNT'; payload: { madrasaId: string; count: number } }
  | { type: 'TOGGLE_MARKAZ_SELECTION'; payload: { allMadrasasInMarkaz: Record<string, { scripts: UndistributedScript[] }>; checked: boolean } }
  | { type: 'ADD_EXAMINER_BUCKET'; payload: ExaminerBucket }
  | { type: 'REMOVE_EXAMINER_BUCKET'; payload: string }
  | { type: 'UPDATE_BUCKET_COUNT'; payload: { examinerId: string; count: number } }
  | { type: 'DISTRIBUTE_EVENLY' }
  | { type: 'RESET_ASSIGNMENT'; }
  | { type: 'TOGGLE_MARKAZ_EXPAND'; payload: string }
  | { type: 'RESET_ALL' };

export type { UndistributedScript, GroupedScripts, ExaminerBucket, SelectedMadrasaInfo, State, Action };
