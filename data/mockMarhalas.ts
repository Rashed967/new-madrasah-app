
import { Marhala } from '../types';

export const mockMarhalas: Marhala[] = [
  {
    id: 'MR001',
    nameBn: 'ইবতেদائية',
    nameAr: 'الابتدائية',
    type: 'boys',
    category: 'darsiyat',
    kitabIds: ['K001', 'K002'], // নূরানী কায়দা, মিজানুস সরফ
  },
  {
    id: 'MR002',
    nameBn: 'মুতাওয়াসসিতা',
    nameAr: 'المتوسطة',
    type: 'girls',
    category: 'darsiyat',
    kitabIds: ['K003', 'K005'], // নাহবেমীর, উসূলে শাশী
  },
  {
    id: 'MR003',
    nameBn: 'হিফজুল কুরআন',
    nameAr: 'حفظ القرآن',
    type: 'boys',
    category: 'hifz',
    kitabIds: [], // Typically Hifz might not have specific "kitabs" from the main list, or could have a general one.
  },
  {
    id: 'MR004',
    nameBn: 'সানুবিয়্যা উলইয়া',
    nameAr: 'الثانوية العليا',
    type: 'boys',
    category: 'darsiyat',
    kitabIds: ['K004', 'K006', 'K007'], // শরহে বেকায়া, সহীহ বুখারী, মিশকাত
  },
];
