
import { ExaminerHallGuardApplication } from '../types';

export const mockExaminerHallGuardApplications: ExaminerHallGuardApplication[] = [
  {
    id: 'EH001',
    applicantType: 'old',
    name: 'মাওলানা আব্দুল্লাহ আল মামুন',
    mobile: '01712345678',
    madrasaId: 'M001', // দারুল উলুম হাটহাজারী
    applicationRole: 'mumtahin', // Changed from 'examiner'
    educationalQualification: 'দাওরায়ে হাদীস, ইফতা',
    kitabiQualification: 'শরহে বেকায়া, জালালাইন',
    registrationDate: '2023-10-15T00:00:00.000Z',
  },
  {
    id: 'EH002',
    applicantType: 'new',
    name: 'হাফেজ মোঃ ইকবাল হোসাইন',
    mobile: '01987654321',
    madrasaId: 'M003', // জামিয়া রাহমানিয়া আরাবিয়া ঢাকা
    applicationRole: 'negran', // Changed from 'hall_guard'
    educationalQualification: 'হিফজুল কুরআন, মেশকাত জামাত',
    kitabiQualification: 'মেশকাত শরীফ (অধ্যয়নরত)',
    registrationDate: '2024-01-20T00:00:00.000Z',
  },
  {
    id: 'EH003',
    applicantType: 'new',
    name: 'মুফতি উসমান গণী',
    mobile: '01811223344',
    madrasaId: 'M002', // আল জামিয়াতুল আহলিয়া পটিয়া
    applicationRole: 'both', // This is a valid PrimaryRole
    educationalQualification: 'দাওরায়ে হাদীস, ইফতা, উলুমুল হাদীস',
    kitabiQualification: 'বুখারী শরীফ, মুসলিম শরীফ',
    registrationDate: '2024-03-05T00:00:00.000Z',
  },
];