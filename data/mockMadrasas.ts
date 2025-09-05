
import { Madrasa } from '../types';

export const mockMadrasas: Madrasa[] = [
  {
    id: 'mockId1', 
    madrasaCode: 10001,
    nameBn: 'দারুল উলুম হাটহাজারী',
    nameAr: 'دار العلوم হাটহাজারী',
    nameEn: 'Darul Uloom Hathazari',
    address: {
      holding: 'প্রধান সড়ক',
      village: 'হাটহাজারী',
      upazila: 'হাটহাজারী',
      district: 'চট্টগ্রাম',
      division: 'চট্টগ্রাম',
      contactPersonName: 'মুফতি জসীম উদ্দীন',
    },
    zoneId: 'Z002', // Example: চট্টগ্রাম দক্ষিণ জোন
    mobile1: '01800000001',
    type: 'boys',
    dispatchMethod: 'courier',
    highestMarhalaBoysId: 'MR004', // Example: সানুবিয়্যা উলইয়া (বালক)
    muhtamim: { name: 'মাওলানা কাসেম সাহেব', mobile: '01700000001', nidNumber: '1234567890123', qualification: 'দাওরায়ে হাদীস' },
    educationSecretary: { name: 'মাওলানা ইরফান সাহেব', mobile: '01900000001', nidNumber: '0987654321098', qualification: 'কামিল' },
    mutawalli: { name: 'আলহাজ্ব শফী আহমেদ', mobile: '01600000001', nidNumber: '1122334455667' },
    registrationDate: '2001-05-10T00:00:00.000Z',
    ilhakFormUrl: 'hathazari_ilhak.pdf',
  },
  {
    id: 'mockId2',
    madrasaCode: 10002,
    nameBn: 'আল জামিয়াতুল আহলিয়া পটিয়া',
    nameAr: 'الجامعة الأهلية پটিয়া',
    nameEn: 'Al Jamiatul Ahlia Patiya',
    address: {
      village: 'পটিয়া',
      upazila: 'পটিয়া',
      district: 'চট্টগ্রাম',
      division: 'চট্টগ্রাম',
      contactPersonName: 'মাওলানা ইউনুস',
    },
    zoneId: 'Z002', // Example: চট্টগ্রাম দক্ষিণ জোন
    mobile1: '01800000002',
    type: 'boys',
    dispatchMethod: 'courier',
    highestMarhalaBoysId: 'MR004', // Example: সানুবিয়্যা উলইয়া (বালক)
    muhtamim: { name: 'মাওলানা আব্দুল হালিম বুখারী', mobile: '01700000002', nidNumber: '2345678901234', qualification: 'দাওরায়ে হাদীস' },
    mutawalli: { name: 'জনাব മുഹമ്മദ് ইদ্রিস', mobile: '01600000002', nidNumber: '2233445566778' },
    registrationDate: '2005-08-15T00:00:00.000Z',
  },
  {
    id: 'mockId3',
    madrasaCode: 10003,
    nameBn: 'জামিয়া রাহমানিয়া আরাবিয়া ঢাকা',
    nameAr: 'جامعة رحمانية العربية', // Added Arabic Name
    nameEn: 'Jamia Rahmania Arabia Dhaka',
    address: {
      holding: 'সাত মসজিদ রোড',
      village: 'মোহাম্মদপুর',
      upazila: 'মোহাম্মদপুর',
      district: 'ঢাকা',
      division: 'ঢাকা',
      contactPersonName: 'হাফেজ মুস্তফা',
    },
    zoneId: 'Z001', // Example: ঢাকা উত্তর জোন
    mobile1: '01800000003',
    type: 'boys',
    dispatchMethod: 'courier',
    highestMarhalaBoysId: 'MR004', // Example: সানুবিয়্যা উলইয়া (বালক)
    muhtamim: { name: 'মুফতি হিফজুর রহমান', mobile: '01700000003', nidNumber: '3456789012345', qualification: 'ইফতা' },
    educationSecretary: { name: 'মাওলানা মামুনুল হক', mobile: '01900000003', nidNumber: '4567890123456', qualification: 'দাওরায়ে হাদীস' },
    mutawalli: { name: 'জনাব আব্দুল্লাহ মাহমুদ', mobile: '01600000003', nidNumber: '3344556677889' },
    registrationDate: '2010-01-20T00:00:00.000Z',
    ilhakFormUrl: 'rahmania_dhaka_ilhak.pdf',
  },
  {
    id: 'mockId4',
    madrasaCode: 10004,
    nameBn: 'আয়েশা সিদ্দিকা মহিলা মাদরাসা',
    nameAr: 'مدرسة عائشة الصديقة للبنات', // Added Arabic Name
    nameEn: 'Ayesha Siddika Mohila Madrasa',
    address: {
      village: 'মিরপুর',
      upazila: 'মিরপুর-১', // Example different upazila for Dhaka
      district: 'ঢাকা',
      division: 'ঢাকা',
      contactPersonName: 'উম্মে হানী',
    },
    zoneId: 'Z001', // Example: ঢাকা উত্তর জোন
    mobile1: '01800000004',
    type: 'girls',
    dispatchMethod: 'courier',
    highestMarhalaGirlsId: 'MR002', // Example: মুতাওয়াসসিতা (বালিকা)
    muhtamim: { name: 'আলিমা ফাতেমা খাতুন', mobile: '01700000004', nidNumber: '5678901234567', qualification: 'ফযীলত' },
    mutawalli: { name: 'হাজী আব্দুল করিম', mobile: '01600000004', nidNumber: '4455667788990' },
    registrationDate: '2012-11-01T00:00:00.000Z',
  },
];
