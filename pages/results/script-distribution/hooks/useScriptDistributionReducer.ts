import { State, Action } from '../types';

export const initialState: State = {
  selectedExamId: '',
  selectedMarhalaId: '',
  selectedKitabId: '',
  selectedMadrasahFilterId: '', // New filter for madrasah
  scriptPool: [],
  groupedScripts: {},
  selectedMadrasas: {},
  examinerBuckets: [],
  isPanelVisible: false,
  expandedMarkaz: {},
};

export function scriptDistributionReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FILTER': {
      const newState: State = { ...state, [action.payload.filter]: action.payload.value };
      if (action.payload.filter !== 'selectedKitabId') {
        newState.isPanelVisible = false;
        newState.scriptPool = [];
        newState.groupedScripts = {};
        newState.selectedMadrasas = {};
        newState.examinerBuckets = [];
        newState.expandedMarkaz = {};
        newState.selectedMadrasahFilterId = ''; // Reset madrasah filter on other filter changes
      }
      if (action.payload.filter === 'selectedExamId') {
        newState.selectedMarhalaId = '';
        newState.selectedKitabId = '';
        newState.selectedMadrasahFilterId = ''; // Reset madrasah filter on exam change
      }
      if (action.payload.filter === 'selectedMarhalaId') {
        newState.selectedKitabId = '';
        newState.selectedMadrasahFilterId = ''; // Reset madrasah filter on marhala change
      }
      return newState;
    }
    case 'SET_MADRASA_FILTER':
      return { ...state, selectedMadrasahFilterId: action.payload };

    case 'FETCH_SUCCESS': {
      const newScripts = action.payload;
      const newGroupedScripts: GroupedScripts = {};
      newScripts.forEach(script => {
        if (!newGroupedScripts[script.markaz_id]) { newGroupedScripts[script.markaz_id] = { markazName: script.markaz_name_bn, madrasas: {} }; }
        if (!newGroupedScripts[script.markaz_id].madrasas[script.madrasa_id]) { newGroupedScripts[script.markaz_id].madrasas[script.madrasa_id] = { madrasaName: script.madrasa_name_bn, madrasaCode: script.madrasa_code, scripts: [] }; }
        newGroupedScripts[script.markaz_id].madrasas[script.madrasa_id].scripts.push(script);
      });
      const newExpandedMarkaz: Record<string, boolean> = {};
      Object.keys(newGroupedScripts).forEach(markazId => {
        newExpandedMarkaz[markazId] = true;
      });
      return { ...state, scriptPool: newScripts, groupedScripts: newGroupedScripts, isPanelVisible: newScripts.length > 0, selectedMadrasas: {}, examinerBuckets: [], expandedMarkaz: newExpandedMarkaz };
    }
      
    case 'FETCH_SCRIPTS_ERROR':
      return { ...state, scriptPool: [], groupedScripts: {}, isPanelVisible: false, selectedMadrasas: {}, examinerBuckets: [] };

    case 'TOGGLE_MADRASA_SELECTION': {
      const { madrasaId, scripts, checked } = action.payload;
      const newSelectedMadrasas = { ...state.selectedMadrasas };
      if (checked) {
        newSelectedMadrasas[madrasaId] = { scriptCount: scripts.length, totalScripts: scripts.length, scripts: scripts.sort((a, b) => a.roll_number - b.roll_number) };
      } else {
        delete newSelectedMadrasas[madrasaId];
      }
      return { ...state, selectedMadrasas: newSelectedMadrasas };
    }

    case 'UPDATE_MADRASA_SELECTION_COUNT': {
      const { madrasaId, count } = action.payload;
      const newSelectedMadrasas = { ...state.selectedMadrasas };
      if (newSelectedMadrasas[madrasaId]) {
        const total = newSelectedMadrasas[madrasaId].totalScripts;
        newSelectedMadrasas[madrasaId].scriptCount = Math.max(0, Math.min(count, total));
      }
      return { ...state, selectedMadrasas: newSelectedMadrasas };
    }

    case 'TOGGLE_MARKAZ_SELECTION': {
        const { allMadrasasInMarkaz, checked } = action.payload;
        const newSelectedMadrasas = { ...state.selectedMadrasas };
        Object.entries(allMadrasasInMarkaz).forEach(([madrasaId, madrasaData]) => {
            if (checked) {
                newSelectedMadrasas[madrasaId] = { scriptCount: madrasaData.scripts.length, totalScripts: madrasaData.scripts.length, scripts: madrasaData.scripts.sort((a,b) => a.roll_number - b.roll_number) };
            } else {
                delete newSelectedMadrasas[madrasaId];
            }
        });
        return { ...state, selectedMadrasas: newSelectedMadrasas };
    }
      
    case 'ADD_EXAMINER_BUCKET':
      if (state.examinerBuckets.some(b => b.examinerId === action.payload.examinerId)) return state;
      return { ...state, examinerBuckets: [...state.examinerBuckets, action.payload] };

    case 'REMOVE_EXAMINER_BUCKET':
      return { ...state, examinerBuckets: state.examinerBuckets.filter(b => b.examinerId !== action.payload) };

    case 'UPDATE_BUCKET_COUNT': {
      const newBuckets = state.examinerBuckets.map(b => b.examinerId === action.payload.examinerId ? { ...b, scriptCount: action.payload.count } : b);
      return { ...state, examinerBuckets: newBuckets };
    }
      
    case 'DISTRIBUTE_EVENLY': {
      if (state.examinerBuckets.length === 0) return state;
      const totalSelected = Object.values(state.selectedMadrasas).reduce((sum, info) => sum + info.scriptCount, 0);
      const numBuckets = state.examinerBuckets.length;
      const scriptsPerBucket = Math.floor(totalSelected / numBuckets);
      let remainder = totalSelected % numBuckets;
      const newBuckets = state.examinerBuckets.map((bucket) => {
        let count = scriptsPerBucket;
        if (remainder > 0) { count++; remainder--; }
        return { ...bucket, scriptCount: count };
      });
      return { ...state, examinerBuckets: newBuckets };
    }
      
    case 'RESET_ASSIGNMENT':
      return { ...state, scriptPool: [], groupedScripts: {}, selectedMadrasas: {}, examinerBuckets: [] };

    case 'TOGGLE_MARKAZ_EXPAND':
      return { ...state, expandedMarkaz: { ...state.expandedMarkaz, [action.payload]: !state.expandedMarkaz[action.payload] } };

    case 'RESET_ALL':
      return initialState;

    default:
      return state;
  }
}
