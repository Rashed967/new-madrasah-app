import React from 'react';

// Basic UI types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface NavItemType {
  path: string;
  label: string;
  icon: (props: React.ComponentProps<'svg'>) => React.ReactNode;
  children?: NavItemType[];
  soon?: boolean;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface DistrictOption extends SelectOption {}

export interface Upazila {
    value: string;
    label: string;
}
export interface District extends SelectOption {
    upazilas: Upazila[];
}
export interface Division extends SelectOption {
    districts: District[];
}

// User and Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Dashboard
export interface DashboardStat {
  id:string;
  title: string;
  value: string | number;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}


// --- Main Data Models ---

// Madrasa
export type MadrasaType = 'boys' | 'girls' | 'both' | '';
export type DispatchMethod = 'courier' | 'post' | 'both' | null;

export interface MadrasaAddress {
  holding?: string;
  village: string;
  postOffice?: string;
  upazila: string;
  district: string;
  division: string;
  contactPersonName: string;
}

export interface MadrasaPerson {
  name: string;
  mobile: string;
  nidNumber?: string;
  qualification?: string;
}

export interface Madrasa {
  id: string;
  madrasaCode: number;
  nameBn: string;
  nameAr: string;
  nameEn?: string;
  address: MadrasaAddress;
  zoneId: string;
  mobile1: string;
  mobile2?: string;
  type: MadrasaType;
  dispatchMethod: DispatchMethod | null;
  highestMarhalaBoysId?: string;
  highestMarhalaGirlsId?: string;
  muhtamim: MadrasaPerson;
  educationSecretary?: MadrasaPerson;
  mutawalli?: MadrasaPerson;
  registrationDate: string;
  ilhakFormUrl?: string;
  userId?: string;
}

export interface MadrasaDbRow {
  id: string;
  madrasa_code: number;
  name_bn: string;
  name_ar: string;
  name_en?: string | null;
  address: {
    holding?: string | null;
    village: string;
    post_office?: string | null;
    upazila: string;
    district: string;
    division: string;
    contact_person_name: string;
  };
  zone_id: string;
  mobile1: string;
  mobile2?: string | null;
  type: MadrasaType;
  dispatch_method: DispatchMethod | null;
  highest_marhala_boys_id?: string | null;
  highest_marhala_girls_id?: string | null;
  muhtamim: {
    name: string;
    mobile: string;
    nid_number?: string | null;
    qualification?: string | null;
  };
  education_secretary?: {
    name: string;
    mobile: string;
    nid_number?: string | null;
    qualification?: string | null;
  } | null;
  mutawalli?: {
    name: string;
    mobile: string;
    nid_number?: string | null;
  } | null;
  registration_date: string;
  ilhak_form_url?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Marhala
export type MarhalaSpecificType = 'boys' | 'girls';
export type MarhalaCategory = 'darsiyat' | 'hifz';
export interface Marhala {
  id: string;
  marhala_code?: number;
  nameBn: string;
  nameAr?: string;
  type: MarhalaSpecificType;
  category: MarhalaCategory;
  kitabIds: string[];
  marhala_order?: number | null;
  requiresPhoto?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface MarhalaApiResponse {
    id: string;
    marhala_code: number;
    name_bn: string;
    name_ar?: string | null;
    type: MarhalaSpecificType;
    category: MarhalaCategory;
    kitab_ids: string[];
    marhala_order: number | null;
    requires_photo?: boolean;
    created_at: string;
    updated_at?: string;
}


// Kitab
export interface Kitab {
  id: string;
  kitabCode: string;
  nameBn: string;
  nameAr?: string;
  fullMarks: number;
  createdAt?: string;
  updatedAt?: string;
}
export interface KitabApiResponse {
    id: string;
    kitab_code: string;
    name_bn: string;
    name_ar?: string | null;
    full_marks: number;
    created_at: string;
    updated_at?: string;
}


// Zone
export interface Zone {
  id: string;
  zoneCode: string;
  nameBn: string;
  districts: string[];
  createdAt?: string;
  updatedAt?: string;
}
export interface ZoneApiResponse {
    id: string;
    zone_code: string;
    name_bn: string;
    districts: string[];
    created_at?: string;
    updated_at?: string;
}


// Exam
export type ExamStatus =
  | 'pending'
  | 'preparatory'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface ExamFeeDetail {
  marhalaId: string;
  startingRollNumber: number;
  regularFee: number;
  irregularFee: number;
  lateRegularFee: number;
  lateIrregularFee: number;
}
export interface Exam {
  id: string;
  name: string;
  registrationDeadline: string;
  startingRegistrationNumber: number;
  lastUsedRegistrationNumber?: number;
  registrationFeeRegular: number;
  registrationFeeIrregular: number;
  lateRegistrationFeeRegular: number;
  lateRegistrationFeeIrregular: number;
  examFees: ExamFeeDetail[];
  isActive: boolean;
  status: ExamStatus;
  createdAt?: string;
  updatedAt?: string;
}


// Examinee
export type StudentType = 'regular' | 'irregular';
export interface Examinee {
    id: string;
    registrationFeeCollectionId: string;
    examId: string;
    madrasaId: string;
    marhalaId: string;
    registrationNumber: number;
    studentType: StudentType;
    nameBn: string;
    nameAr?: string;
    nameEn?: string;
    fatherNameBn: string;
    fatherNameAr?: string;
    fatherNameEn?: string;
    motherNameBn: string;
    motherNameAr?: string;
    motherNameEn?: string;
    dateOfBirth: string;
    nidOrBirthCert: string;
    photoUrl?: string;
    status: 'fee_pending' | 'fee_paid' | 'roll_assigned' | 'script_distributed' | 'correction_requested';
    rollNumber?: number;
    registrationInputDate: string;
    examName?: string;
    madrasaNameBn?: string;
    madrasaCode?: number;
    marhalaNameBn?: string;
    marhalaType?: MarhalaSpecificType;
    pastYearRoll?: number;
    pastYearMarhala?: string;
    pastYearTotalNumber?: number;
    pastYearDivision?: string;
    pastYearComment?: string;
}
export interface ExamineeDbRow extends Omit<Examinee, 'examName' | 'madrasaNameBn' | 'marhalaNameBn' | 'marhalaType'> {}

// Teacher
export type GenderType = 'male' | 'female' | 'other';
export interface TeacherAddress {
  division: string; district: string; upazila: string; postOffice: string; village: string; holding?: string;
}
export interface PaymentInfo {
  type: 'mobile' | 'bank';
  provider?: string;
  account_name?: string;
  account_number: string;
  bank_name?: string;
  branch_name?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  nameBn: string;
  nameEn?: string;
  mobile: string;
  nidNumber: string;
  email?: string;
  dateOfBirth: string;
  gender: GenderType;
  photoUrl?: string;
  paymentInfo?: PaymentInfo;
  addressDetails?: TeacherAddress;
  educationalQualification: string;
  kitabiQualification: string[];
  expertiseAreas?: string[];
  notes?: string;
  isActive: boolean;
  isMumtahinEligible?: boolean;
  registeredBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface TeacherDbRow extends Omit<Teacher, 'teacherCode' | 'nameBn' | 'nameEn' | 'nidNumber' | 'dateOfBirth' | 'photoUrl' | 'paymentInfo' | 'addressDetails' | 'educationalQualification' | 'kitabiQualification' | 'expertiseAreas' | 'registeredBy' | 'createdAt' | 'updatedAt' | 'isMumtahinEligible' | 'isActive'> {
  teacher_code: string;
  name_bn: string;
  name_en?: string | null;
  nid_number: string;
  date_of_birth: string;
  photo_url?: string | null;
  payment_info?: PaymentInfo | null;
  address_details?: TeacherAddress | null;
  educational_qualification: string;
  kitabi_qualification: string[] | null;
  expertise_areas?: string[] | null;
  is_active: boolean;
  registered_by?: string | null;
  created_at: string;
  updated_at?: string;
}

// Assignments
export type AssignedPersonnelRole = 'mumtahin' | 'negran' | 'both';
export type NegranType = 'head' | 'assistant';

export interface ExamPersonnelAssignment {
  id: string;
  examId: string;
  markazId?: string;
  personnelId: string; // Teacher ID
  assignedRole: AssignedPersonnelRole;
  negranType?: NegranType;
  personnelNameBn: string;
  personnelCode: string;
  personnelMobile: string;
  educationalQualification: string;
  kitabiQualification: string[];
  createdAt: string;
}

export interface Markaz {
    id: string;
    nameBn: string;
    markazCode: number;
    hostMadrasaId: string;
    zoneId: string;
    examineeCapacity: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface MarkazDbRow {
    id: string;
    name_bn: string;
    markaz_code: number;
    host_madrasa_id: string;
    zone_id: string;
    examinee_capacity: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface MarkazAssignmentDetailDbRow {
    assignment_id: string;
    markaz_id: string;
    exam_id: string;
    madrasa_id: string;
    marhala_id: string;
    assignment_created_at: string;
    madrasa_name_bn: string;
    madrasa_code: number;
    marhala_name_bn: string;
    marhala_type: string;
}

export interface GroupedAssignmentDisplay {
  madrasaId: string;
  madrasaNameBn: string;
  madrasaCode: number;
  marhalas: {
    assignmentId: string;
    marhalaId: string;
    marhalaNameBn: string;
    marhalaType: MarhalaSpecificType;
  }[];
}


// =======================================================================
// UNIFIED FEE COLLECTION AND TRANSACTION TYPES (V2)
// =======================================================================

export type CollectionType = 'registration_fee' | 'exam_fee';

/**
 * Represents a single payment transaction in the master ledger.
 * The `receipt_no` is the global, sequential receipt number.
 */
export interface TransactionV2 {
  receipt_no: number;
  collection_id: string;
  amount: number;
  method: PaymentMethod | '';
  payment_date: string;
  transaction_id?: string;
  bank_name?: string;
  branch_name?: string;
  check_number?: string;
  mobile_banking_provider?: string;
  sender_number?: string;
  receiver_number?: string;
  notes?: string;
  created_at: string;
}

/**
 * Represents a master collection record. Holds data common to all fee types.
 */
export interface Collection {
  id: string;
  collection_type: CollectionType;
  exam_id: string;
  madrasa_id: string;
  apply_late_fee: boolean;
  total_calculated_fee: number;
  collection_date: string;
  created_at: string;
}

/**
 * Represents the specific details for a registration fee collection (V2).
 */
export interface RegistrationFeeDetailV2 {
  id: string;
  collection_id: string;
  marhala_id: string;
  regular_students: number;
  irregular_students: number;
  calculated_fee_for_marhala: number;
  registration_number_range_start?: number;
  registration_number_range_end?: number;
}

/**
 * Represents the specific details for an exam fee collection (V2).
 */
export interface ExamFeeDetailV2 {
  id: string;
  collection_id: string;
  examinee_id: string;
  paid_fee: number;
  student_type: StudentType;
  marhala_id: string;
}

/**
 * Type for the new unified collections list page.
 */
export interface UnifiedCollectionListEntry {
    id: string;
    collectionType: CollectionType;
    examName: string;
    madrasaNameBn: string;
    madrasaCode: number;
    totalCalculatedFee: number;
    totalPaidAmount: number;
    balanceAmount: number;
    collectionDate: string;
    // Aggregated receipts for display
    receipts: { receiptNo: number; amount: number }[];
}


// =======================================================================
// OLD FEE COLLECTION TYPES (To be deprecated)
// =======================================================================

// Fee Collections
export type PaymentMethod = 'cash' | 'check' | 'mobile_banking' | 'bank_transfer';
export interface RegistrationFeePaymentDetail {
    id: string;
    method: PaymentMethod | '';
    amount: number | string;
    paymentDate: string;
    mobileBankingProvider?: string;
    transactionId?: string;
    senderNumber?: string;
    receiverNumber?: string;
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    checkNumber?: string;
    notes?: string;
}
export interface MarhalaRegistrationStudentCount {
    marhalaId: string;
    regularStudents: number | string;
    irregularStudents: number | string;
    calculatedFee?: number;
}
export interface RegistrationFeeCollection {
    id: string;
    receipt_no?: number;
    examId: string;
    examName?: string;
    madrasaId: string;
    madrasaNameBn?: string;
    madrasaCode?: number;
    applyLateFee: boolean;
    marhalaStudentCounts: (MarhalaRegistrationStudentCount & { marhalaNameBn?: string, displayedRegNoStart?: number, displayedRegNoEnd?: number, calculatedFee: number })[];
    payments: RegistrationFeePaymentDetail[];
    totalCalculatedFee: number;
    totalPaidAmount: number;
    balanceAmount: number;
    collectionDate: string;
    createdAt?: string;
}

export interface RegistrationFeeMarhalaStudentCountDb {
  marhala_id: string;
  marhala_name_bn: string;
  regular_students: number;
  irregular_students: number;
  calculated_fee_for_marhala: number;
  registration_number_range_start?: number;
  registration_number_range_end?: number;
}

export interface RegistrationFeePaymentDbDetail {
    id: string;
    method: PaymentMethod;
    amount: number;
    payment_date: string;
    mobile_banking_provider?: string;
    transaction_id?: string;
    sender_number?: string;
    receiver_number?: string;
    bank_name?: string;
    branch_name?: string;
    account_number?: string;
    check_number?: string;
    notes?: string;
}
export interface ExamineeExamFeeItem {
    examineeId: string;
    paidFee: number;
    studentType: StudentType;
    marhalaId: string;
    examineeNameBn: string;
    examineeRegNo: number;
    marhalaNameBn?: string;
}
export interface ExamFeePaymentDetail extends RegistrationFeePaymentDetail {}
export interface ExamFeeCollection {
    id: string;
    examId: string;
    madrasaId: string;
    examineeFeeDetails: ExamineeExamFeeItem[];
    payments: ExamFeePaymentDetail[];
    totalCalculatedFee: number;
    totalPaidAmount: number;
    balanceAmount: number;
    collectionDate: string;
    applyLateFee: boolean;
    madrasaNameBn?: string;
    examName?: string;
    madrasaCode?: number;
    createdAt?: string;
}
export interface EligibleExaminee extends Examinee {
    applicableFee: number;
}


// Other types
export type MarkStatus = 'present' | 'absent' | 'expelled';
export interface Mark {
    id: string;
    examineeId: string;
    examId: string;
    marhalaId: string;
    kitabId: string;
    obtainedMarks: number | null;
    status: MarkStatus;
    fullMarks: number;
    entryTimestamp: string;
}
export interface MarkForEntry {
    examinee_id: string;
    roll_number: number;
    name_bn: string;
    registration_number: number;
    madrasa_name_bn: string;
    madrasa_code: number;
}
export interface AssignedScriptBatch {
    distribution_id: string;
    kitab_id: string;
    kitab_name: string;
    marhala_name: string;
    markaz_name: string;
    total_scripts: number;
    entered_marks_count: number;
    full_marks: number;
}
export interface MarkazEntryData {
    kitabs: { id: string; name_bn: string; full_marks: number }[];
    examinees: { examinee_id: string; roll_number: number; name_bn: string; registration_number: number; madrasa_name_bn: string; madrasa_code: number; marks: Record<string, {value: number | null, status: MarkStatus}> }[];
}


// --- Miscellaneous ---
export interface TeacherGeneralDesignation {
  id: string;
  teacher_id: string;
  designation: 'MUMTAHIN_ELIGIBLE' | string; // Example, extend as needed
  created_at: string;
}

export interface ExaminerHallGuardApplication {
  id: string;
  applicantType: 'new' | 'old';
  name: string;
  mobile: string;
  madrasaId: string;
  applicationRole: 'mumtahin' | 'negran' | 'both';
  educationalQualification: string;
  kitabiQualification: string;
  registrationDate: string;
}

export interface CertificateType {
  id: string;
  name_bn: string;
  name_en: string;
  fee: number;
  is_active: boolean;
  created_at: string;
}

export type ApplicationStatus = 'pending' | 'processing' | 'ready_for_delivery' | 'completed' | 'rejected';

export interface CertificateApplication {
  id: string;
  examinee_id: string;
  examinee_name: string;
  father_name: string;
  examinee_roll: number;
  examinee_reg: number;
  exam_id: string;
  exam_name: string;
  madrasa_name: string;
  applied_certificates: { type_id: string; name_bn: string; fee: number }[];
  total_fee: number;
  payment_status: 'paid' | 'unpaid';
  contact_mobile: string;
  application_status: ApplicationStatus;
  notes_by_admin?: string;
  created_at: string;
}


// Results & Reports
export interface IndividualResult {
  examinee_details: { name_bn: string; father_name_bn: string; roll_number: number; registration_number: number; };
  madrasa_details: { name_bn: string; madrasa_code: number; };
  marhala_details: { name_bn: string; };
  exam_details: { name: string; };
  result_summary: { total_marks: number; percentage: number; grade: string; status: 'কৃতকার্য' | 'অকৃতকার্য'; };
  subject_marks: { kitab_name: string; full_marks: number; obtained_marks: number; }[];
}
export interface MadrasaWiseResult {
    madrasa_details: { name_bn: string; madrasa_code: number; };
    exam_details: { name: string; };
    summary: { total_examinees: number; total_passed: number; total_failed: number; pass_rate: number; };
    results_by_marhala: { marhala_id: string; marhala_name: string; results: (Omit<IndividualResult['result_summary'], 'position_details'> & { examinee_id: string; name_bn: string; roll_number: number; subject_marks: IndividualResult['subject_marks'], position_details: string; })[] }[];
}
export interface MeritListRow {
    examinee_id: string;
    roll_number: number;
    registration_number: number;
    name_bn: string;
    madrasa_name_bn: string;
    total_marks: number;
    percentage: number;
    grade: string;
    position_details: string;
}

export interface FullExamStatistics {
  overall_stats: {
    total_examinees: number;
    total_passed: number;
    total_failed: number;
    pass_rate: number;
    grades: Record<string, number>;
  };
  marhala_stats: {
    marhala_id: string;
    marhala_name: string;
    total_examinees: number;
    total_passed: number;
    total_failed: number;
    pass_rate: number;
    grades: Record<string, number>;
  }[];
}

export interface ResultProcessingStatusItem {
  marhala_id: string;
  marhala_name: string;
  expected_marks_entries: number;
  actual_marks_entries: number;
  is_complete: boolean;
}

export interface MarkazMadrasaMarhalaAssignment {
  id: string;
  markazId: string;
  examId: string;
  madrasaId: string;
  marhalaId: string;
  createdAt: string;
  madrasaNameBn: string;
  marhalaNameBn: string;
  marhalaType: MarhalaSpecificType;
}

export interface MarhalaGroup {
  marhala_id: string;
  marhala_name_bn: string;
  markaz_code: number;
  examinees: {
    registration_number: number;
    name_bn: string;
    name_ar: string;
    father_name_bn: string;
    father_name_ar: string;
    date_of_birth: string;
  }[];
}
export interface ExamFeeFormData {
    madrasa_info: MadrasaDbRow;
    marhala_groups: MarhalaGroup[];
}

// Board Profile
export interface BoardProfileAddress {
  holding?: string;
  villageArea: string;
  postOffice: string;
  upazila: string;
  district: string;
  division: string;
}

export interface BoardOfficial {
  name: string;
  mobile: string;
  email?: string;
}
export interface BoardProfile {
  id: 'MAIN_PROFILE';
  boardNameBn: string;
  boardNameEn: string;
  address: BoardProfileAddress;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  website?: string;
  logoUrl?: string;
  establishmentDate: string;
  chairman: BoardOfficial;
  secretary: BoardOfficial;
  updatedAt: string;
}
export interface BoardProfileDbRow {
  id: 'MAIN_PROFILE';
  board_name_bn: string;
  board_name_en: string;
  address: {
    holding?: string | null;
    village_area: string;
    post_office: string;
    upazila: string;
    district: string;
    division: string;
  };
  primary_phone: string;
  secondary_phone?: string | null;
  email: string;
  website?: string | null;
  logo_url?: string | null;
  establishment_date: string;
  chairman: {
    name: string;
    mobile: string;
    email?: string | null;
  };
  secretary: {
    name: string;
    mobile: string;
    email?: string | null;
  };
  updated_at: string;
}

// Inspection
export interface InspectionFee {
    type: string;
    amount: number | string;
}
export interface MadrasaInspection {
    id: string;
    madrasaId: string;
    madrasaNameBn?: string;
    madrasaCode?: number;
    examId?: string;
    examName?: string;
    inspectionDate: string;
    inspectorName: string;
    comments?: string;
    fees: InspectionFee[];
    totalFee?: number;
    createdAt?: string;
}

// Accounts
export type BankAccountType = 'current' | 'savings';
export interface BankAccount {
    id: string;
    bankName: string;
    branchName: string;
    accountName: string;
    accountNumber: string;
    accountType: BankAccountType;
    openingDate: string;
    openingBalance: number;
    currentBalance: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface BankAccountDbRow {
  id: string;
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
  account_type: BankAccountType;
  opening_date: string;
  opening_balance: number | string;
  current_balance: number | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type TransactionType = 'income' | 'expense';
export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
}
export interface Transaction {
    id: string;
    transaction_date: string;
    category_id: string;
    amount: number;
    type: TransactionType;
    party_name?: string;
    voucher_no?: string;
    description?: string;
}

export type BankTransactionType = 'deposit' | 'withdrawal' | 'transfer';
export interface BankTransaction {
  id: string;
  accountId: string;
  type: BankTransactionType;
  amount: number;
  transactionDate: string;
  description?: string;
  balanceAfter: number;
  bankName?: string;
  accountName?: string;
}
export interface BankDashboardData {
  totalBalance: number;
  accounts: BankAccount[];
  recentTransactions: BankTransaction[];
}

export interface ComprehensiveReportData {
  summary: {
    total_transaction_income: number;
    total_inspection_income: number;
    total_expense: number;
    net_profit_loss: number;
  };
  monthly_summary: MonthlySummaryItem[];
  category_summary: { category_name: string; total_amount: number }[];
  details: {
    id: string;
    transaction_date: string;
    type: 'income' | 'expense';
    category_name: string;
    party_name?: string;
    amount: number;
    description?: string;
  }[];
}
export interface MonthlySummaryItem {
  month: string;
  total_income: number;
  total_expense: number;
}
export interface Book {
    id: string;
    title: string;
    author?: string | null;
    price: number;
    initial_stock: number;
    current_stock: number;
    created_at: string;
    updated_at: string;
}
export interface BookSale {
    id: string;
    book_id: string;
    book_title: string;
    quantity_sold: number;
    price_per_unit: number;
    total_amount: number;
    customer_name?: string | null;
    notes?: string | null;
    sale_date: string;
}