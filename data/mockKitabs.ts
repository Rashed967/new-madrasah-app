
import { Kitab } from '../types';

// This mock data will now be primarily managed by the backend and API calls.
// The frontend will fetch this data. This file might become obsolete or used for initial seeding/testing via backend.
// For now, we'll keep it, but the frontend should not directly import and use this for CRUD.
// If the backend starts with an empty DB, this list will be effectively empty on first load.
export const mockKitabs: Kitab[] = [
  // {
  //   id: 'K001', // Will be UUID from Supabase
  //   kitabCode: 'KB001', // Example kitab code
  //   nameBn: 'নূরানী কায়দা',
  //   nameAr: 'القاعدة النورانية',
  //   fullMarks: 50,
  // },
  // {
  //   id: 'K002',
  //   kitabCode: 'KB002',
  //   nameBn: 'মিজানুস সরফ',
  //   nameAr: 'ميزان الصرف',
  //   fullMarks: 100,
  // },
  // {
  //   id: 'K003',
  //   kitabCode: 'KB003',
  //   nameBn: 'নাহবেমীর',
  //   nameAr: 'نحو مير',
  //   fullMarks: 100,
  // },
  // {
  //   id: 'K004',
  //   kitabCode: 'KB004',
  //   nameBn: 'শরহে বেকায়া (প্রথম খণ্ড)',
  //   nameAr: 'شرح الوقاية (الجزء الأول)',
  //   fullMarks: 100,
  // },
  // {
  //   id: 'K005',
  //   kitabCode: 'KB005',
  //   nameBn: 'উসূলে শাশী',
  //   nameAr: 'أصول الشاشي',
  //   fullMarks: 100,
  // },
  // {
  //   id: 'K006',
  //   kitabCode: 'KB006',
  //   nameBn: 'সহীহ বুখারী শরীফ (১ম খণ্ড)',
  //   nameAr: 'صحيح البخاري (المجلد الأول)',
  //   fullMarks: 100,
  // },
  // {
  //   id: 'K007',
  //   kitabCode: 'KB007',
  //   nameBn: 'মিশকাতুল মাসাবীহ (১ম খণ্ড)',
  //   nameAr: 'مشكاة المصابيح (المجلد الأول)',
  //   fullMarks: 100,
  // },
];