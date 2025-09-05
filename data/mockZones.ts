
import { Zone } from '../types';

export const mockZones: Zone[] = [
  {
    id: 'Z001', // This was the old zoneCode, now it's just id from Supabase (UUID)
    zoneCode: 'ZN001', // New unique code
    nameBn: 'ঢাকা উত্তর জোন',
    districts: ['ঢাকা', 'গাজীপুর', 'টাঙ্গাইল', 'নরসিংদী', 'মানিকগঞ্জ'],
  },
  {
    id: 'Z002',
    zoneCode: 'ZN002',
    nameBn: 'চট্টগ্রাম দক্ষিণ জোন',
    districts: ['চট্টগ্রাম', 'কক্সবাজার', 'বান্দরবান'],
  },
  {
    id: 'Z003',
    zoneCode: 'ZN003',
    nameBn: 'খুলনা মেট্রো জোন',
    districts: ['খুলনা', 'বাগেরহাট', 'সাতক্ষীরা'],
  },
  {
    id: 'Z004',
    zoneCode: 'ZN004',
    nameBn: 'সিলেট জোন',
    districts: ['সিলেট', 'সুনামগঞ্জ', 'হবিগঞ্জ', 'মৌলভীবাজার'],
  }
];
