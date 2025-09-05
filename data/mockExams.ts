
import { Exam } from '../types';

export const mockExams: Exam[] = [
  {
    id: 'EXM001',
    name: 'বার্ষিক পরীক্ষা ১৪৪৫ হিজরী',
    registrationDeadline: '2024-08-15T00:00:00.000Z',
    startingRegistrationNumber: 1001,
    registrationFeeRegular: 200,
    registrationFeeIrregular: 300,
    lateRegistrationFeeRegular: 300, // Regular + 100 late fee
    lateRegistrationFeeIrregular: 450, // Irregular + 150 late fee
    examFees: [
      {
        marhalaId: 'MR001', // ইবতেদائية (বালক)
        startingRollNumber: 101,
        regularFee: 500,
        irregularFee: 600,
        lateRegularFee: 600,
        lateIrregularFee: 750,
      },
      {
        marhalaId: 'MR002', // মুতাওয়াসসিতা (বালিকা)
        startingRollNumber: 201,
        regularFee: 550,
        irregularFee: 650,
        lateRegularFee: 650,
        lateIrregularFee: 800,
      },
      {
        marhalaId: 'MR004', // সানুবিয়্যা উলইয়া (বালক)
        startingRollNumber: 301,
        regularFee: 700,
        irregularFee: 850,
        lateRegularFee: 800,
        lateIrregularFee: 1000,
      }
    ],
    isActive: true,
    status: 'pending', // Added default status
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'EXM002',
    name: 'মানোন্নয়ন পরীক্ষা ১৪৪৫ হিজরী',
    registrationDeadline: '2024-09-10T00:00:00.000Z',
    startingRegistrationNumber: 501,
    registrationFeeRegular: 150,
    registrationFeeIrregular: 250,
    lateRegistrationFeeRegular: 250,
    lateRegistrationFeeIrregular: 400,
    examFees: [
      {
        marhalaId: 'MR001', // ইবতেদائية (বালক)
        startingRollNumber: 101,
        regularFee: 400,
        irregularFee: 500,
        lateRegularFee: 500,
        lateIrregularFee: 650,
      },
    ],
    isActive: false,
    status: 'completed', // Added default status
    createdAt: '2024-07-01T00:00:00.000Z',
    updatedAt: '2024-07-01T00:00:00.000Z',
  },
];
