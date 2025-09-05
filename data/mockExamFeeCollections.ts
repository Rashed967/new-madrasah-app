
import { ExamFeeCollection } from '../types';

export const mockExamFeeCollections: ExamFeeCollection[] = [
  // Example structure - will be populated when the collection form is used.
  /*
  {
    id: 'EFC20240001',
    examId: 'EXM001',
    madrasaId: 'M001',
    examineeFeeDetails: [
      {
        examineeId: 'EXMNE0001', // Link to an Examinee ID
        paidFee: 500, // e.g., Regular fee for MR001 from EXM001
        studentType: 'regular',
        marhalaId: 'MR001',
      },
      {
        examineeId: 'EXMNE0002', // Link to another Examinee ID
        paidFee: 600, // e.g., Irregular fee for MR001 from EXM001
        studentType: 'irregular',
        marhalaId: 'MR001',
      }
    ],
    payments: [
      {
        id: 'PAYEFC001',
        method: 'cash',
        amount: 1100,
        paymentDate: '2024-09-01T00:00:00.000Z',
        notes: 'Exam fees for 2 students.'
      }
    ],
    totalCalculatedFee: 1100, // 500 + 600
    totalPaidAmount: 1100,
    balanceAmount: 0,
    collectionDate: '2024-09-01T00:00:00.000Z',
  }
  */
];
