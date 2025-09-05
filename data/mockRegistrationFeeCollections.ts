import { RegistrationFeeCollection } from '../types';

export const mockRegistrationFeeCollections: RegistrationFeeCollection[] = [
  {
    id: 'RFC20240001',
    examId: 'EXM001', // বার্ষিক পরীক্ষা ১৪৪৫ হিজরী
    madrasaId: 'M001', // দারুল উলুম হাটহাজারী
    applyLateFee: false,
    marhalaStudentCounts: [
      {
        marhalaId: 'MR001', // ইবতেদائية (বালক)
        regularStudents: 20,
        irregularStudents: 5,
        // registrationNumberRange: '1001-1025', // Removed: This property does not exist on MarhalaRegistrationStudentCount
        calculatedFee: (20 * 200) + (5 * 300), // Based on EXM001 reg fees
      },
      {
        marhalaId: 'MR004', // সানুবিয়্যা উলইয়া (বালক)
        regularStudents: 15,
        irregularStudents: 2,
        // registrationNumberRange: '3001-3017', // Removed: This property does not exist on MarhalaRegistrationStudentCount
        calculatedFee: (15 * 200) + (2 * 300), // Based on EXM001 reg fees
      }
    ],
    payments: [
      {
        id: 'PAY001',
        method: 'cash',
        amount: 5000,
        paymentDate: '2024-07-10T00:00:00.000Z',
      },
      {
        id: 'PAY002',
        method: 'mobile_banking',
        amount: 2100, // (20*200)+(5*300) = 4000+1500 = 5500. (15*200)+(2*300) = 3000+600 = 3600. Total = 9100.
        paymentDate: '2024-07-11T00:00:00.000Z',
        mobileBankingProvider: 'বিকাশ',
        transactionId: 'TRX12345ABC',
        senderNumber: '01700000000'
      }
    ],
    totalCalculatedFee: (20 * 200) + (5 * 300) + (15 * 200) + (2 * 300), // 5500 + 3600 = 9100
    totalPaidAmount: 5000 + 2100, // 7100
    balanceAmount: ((20 * 200) + (5 * 300) + (15 * 200) + (2 * 300)) - (5000+2100), // 9100 - 7100 = 2000
    collectionDate: '2024-07-12T00:00:00.000Z',
  },
];
