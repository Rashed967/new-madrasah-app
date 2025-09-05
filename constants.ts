
import { NavItemType, DistrictOption, SelectOption, Division, Upazila, NegranType } from './types';
import { 
  HomeIcon, BuildingOffice2Icon, UsersIcon, UserCircleIcon, MapPinIcon, 
  ClipboardDocumentListIcon, DocumentChartBarIcon, BookOpenIcon, 
  ReceiptPercentIcon, ScaleIcon, TrophyIcon, IdentificationIcon, Cog6ToothIcon, PlusCircleIcon, UserPlusIcon, CurrencyBangladeshiIcon, AcademicCapIcon, PaperClipIcon, ListBulletIcon, DocumentDuplicateIcon, GlobeAltIcon, CheckBadgeIcon, ChartBarIcon, PrinterIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, EnvelopeIcon
} from './components/ui/Icon'; 

export const PRIMARY_COLOR = '#52b788';
export const APP_TITLE_BN = 'জাতীয় দ্বীনি মাদরাসা শিক্ষাবোর্ড বাংলাদেশ';
export const APP_TITLE_EN = 'National Dini Madrasa Education Board Bangladesh';
export const EXPRESS_API_URL = 'http://localhost:3001/api'; 

export const CLOUDINARY_CLOUD_NAME = "dpes1dyqb"; 
export const CLOUDINARY_UPLOAD_PRESET = "ilhak_pdf"; 


export const PUBLIC_NAV_ITEMS: NavItemType[] = [
  { path: '/', label: 'হোম', icon: HomeIcon },
  { path: '/about', label: 'আমাদের সম্পর্কে', icon: BuildingOffice2Icon },
  { path: '/results', label: 'ফলাফল', icon: TrophyIcon },
  { path: 'https://result.jdmboard.com/', label: 'পুরানো ফলাফল সাইট', icon: TrophyIcon },
  // { path: '/apply-affiliation', label: 'মাদরাসা অন্তর্ভুক্তি', icon: PlusCircleIcon },
  { path: '/apply-certificate', label: 'সনদের আবেদন', icon: DocumentDuplicateIcon },
  { path: '/certificate-status', label: 'সনদের স্ট্যাটাস', icon: MagnifyingGlassIcon },
  
];

export const SIDEBAR_NAV_ITEMS: NavItemType[] = [
  { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: HomeIcon },
  { 
    path: '/madrasa', 
    label: 'মাদরাসা', 
    icon: BuildingOffice2Icon,
    children: [
      { path: '/madrasa/registration', label: 'মাদরাসা নিবন্ধন', icon: BuildingOffice2Icon },
      { path: '/madrasa/list', label: 'নিবন্ধিত মাদরাসা', icon: ClipboardDocumentListIcon },
      // { path: '/madrasa/applications', label: 'নতুন আবেদন', icon: PaperClipIcon },
    ]
  },
  {
    path: '/marhala', 
    label: 'মারহালা',
    icon: BookOpenIcon, 
    children: [
      { path: '/marhala/registration', label: 'নতুন মারহালা', icon: PlusCircleIcon },
      { path: '/marhala/list', label: 'মারহালা তালিকা', icon: ClipboardDocumentListIcon },
    ]
  },
  {
    path: '/kitab',
    label: ' কিতাব', 
    icon: BookOpenIcon, 
    children: [
      { path: '/kitab/registration', label: 'নতুন কিতাব', icon: PlusCircleIcon },
      { path: '/kitab/list', label: 'কিতাব তালিকা', icon: ClipboardDocumentListIcon },
    ]
  },
  { 
    path: '/teachers', 
    label: 'শিক্ষক ও কর্মকর্তা', 
    icon: UserCircleIcon,
    children: [
      { path: '/teachers/registration', label: 'শিক্ষক নিবন্ধন', icon: UserPlusIcon }, 
      { path: '/teachers/list', label: 'শিক্ষক তালিকা', icon: ClipboardDocumentListIcon, soon: false }, 
      // { path: '/teachers/mumtahin-eligibility', label: 'পরীক্ষক যোগ্যতা', icon: CheckBadgeIcon, soon: false }, -- Removed
      { path: '/assignment/teachers', label: 'মুমতাহিন/নেগরান নিয়োগ', icon: IdentificationIcon, soon: false },
      { path: '/assignment/negrans', label: 'মারকায ভিত্তিক নেগরান', icon: ListBulletIcon, soon: false },
      { path: '/assignment/mumtahins', label: 'নিয়োগকৃত মুমতাহিন', icon: ListBulletIcon, soon: false },
    ]
  },
  { 
    path: '/markaz-management', 
    label: 'মারকায ও জোন', 
    icon: MapPinIcon, 
    children: [
      {
        path: '/markaz', 
        label: 'মারকায ব্যবস্থাপনা',
        icon: MapPinIcon,
        children: [
          { path: '/markaz/registration', label: 'নতুন মারকায', icon: PlusCircleIcon },
          { path: '/markaz/list', label: 'মারকায তালিকা', icon: ClipboardDocumentListIcon },
          { path: '/markaz/assignment', label: 'মারকায এসাইনমেন্ট', icon: ListBulletIcon },
        ]
      },
      {
        path: '/zone',
        label: 'জোন ব্যবস্থাপনা',
        icon: MapPinIcon,
        children: [
          { path: '/zone/registration', label: 'নতুন জোন', icon: PlusCircleIcon },
          { path: '/zone/list', label: 'জোন তালিকা', icon: ClipboardDocumentListIcon },
        ]
      }
    ]
  },
  { 
    path: '/results', 
    label: 'ফলাফল ও পরীক্ষা', 
    icon: ClipboardDocumentListIcon, 
    children: [
      { 
        path: '/exam', 
        label: 'পরীক্ষা ব্যবস্থাপনা', 
        icon: ClipboardDocumentListIcon, 
        children: [
          { path: '/exam/registration', label: 'নতুন পরীক্ষা', icon: PlusCircleIcon },
          { path: '/exam/list', label: 'পরীক্ষার তালিকা', icon: ClipboardDocumentListIcon },
        ]
      },
      { 
        path: '/examinee', 
        label: 'পরীক্ষার্থী', 
        icon: AcademicCapIcon,
        children: [
           { path: '/examinee/registration', label: 'পরীক্ষার্থী নিবন্ধন', icon: UserPlusIcon, soon: false },
           { path: '/examinee/list', label: 'পরীক্ষার্থী তালিকা', icon: ClipboardDocumentListIcon, soon: false },
           { path: '/examinee/assign-roll', label: 'রোল নম্বর নির্ধারণ', icon: IdentificationIcon, soon: false },
        ]
      },
      { 
        path: '/finance/registration-fee', 
        label: 'নিবন্ধন ফি গ্রহণ',
        icon: CurrencyBangladeshiIcon, 
        children: [
          { path: '/finance/registration-fee/collect', label: 'ফি গ্রহণ', icon: PlusCircleIcon },
          { path: '/finance/registration-fee/list', label: 'ফি তালিকা', icon: ClipboardDocumentListIcon },
        ]
      },
      { 
        path: '/finance/exam-fee', 
        label: 'পরীক্ষার ফি গ্রহণ', 
        icon: CurrencyBangladeshiIcon, 
        children: [
          { path: '/finance/exam-fee/collect', label: 'ফি গ্রহণ', icon: PlusCircleIcon, soon: false }, 
          { path: '/finance/exam-fee/list', label: 'ফি তালিকা', icon: ClipboardDocumentListIcon, soon: false }, 
        ]
      },
      { path: '/results/script-distribution', label: 'উত্তরপত্র বন্টন', icon: DocumentChartBarIcon, soon: false }, 
      { path: '/results/distribution-list', label: 'বন্টন তালিকা', icon: ClipboardDocumentListIcon, soon: false },
      { path: '/results/marks-entry', label: 'নম্বর এন্ট্রি', icon: ClipboardDocumentListIcon, soon: false },
      { path: '/results/process', label: 'ফলাফল প্রস্তুতকরণ', icon: Cog6ToothIcon, soon: false },
      { path: '/results/view', label: 'ফলাফল দেখুন', icon: TrophyIcon, soon: false }, 
    ]
  },
  { 
    path: '/reports', 
    label: 'রিপোর্ট ও তালিকা', 
    icon: DocumentChartBarIcon,
    children: [
      { path: '/reports/print-center', label: 'প্রিন্ট সেন্টার', icon: PrinterIcon, soon: false },
      { path: '/reports/gazette', label: 'বার্ষিক গেজেট', icon: DocumentChartBarIcon, soon: true },
    ]
  },
  { 
    path: '/accounts', 
    label: 'হিসাব ও অর্থ', 
    icon: ScaleIcon, 
    soon: false,
    children: [
      { 
        path: '/accounts/income-expense', 
        label: 'আয়-ব্যয়ের হিসাব', 
        icon: CurrencyBangladeshiIcon, 
        soon: false,
        children: [
          { path: '/accounts/income-expense/entry', label: 'আয়/ব্যয় এন্ট্রি', icon: PlusCircleIcon, soon: false },
          { path: '/accounts/income-expense/report', label: 'আয়/ব্যয় রিপোর্ট', icon: DocumentChartBarIcon, soon: false },
          { path: '/accounts/categories/list', label: 'আয়/ব্যয় ক্যাটাগরি', icon: ListBulletIcon, soon: false }
        ]
      },
       { 
        path: '/accounts/banks', 
        label: 'ব্যাংক হিসাব', 
        icon: BuildingOffice2Icon,
        soon: false,
        children: [
          { path: '/accounts/banks/dashboard', label: 'ব্যাংক ম্যানেজমেন্ট', icon: ChartBarIcon, soon: false },
        ]
      },
      {
        path: '/accounts/books',
        label: 'বই বিক্রয়',
        icon: BookOpenIcon,
        soon: false,
        children: [
          { path: '/accounts/books/list', label: 'বই ম্যানেজমেন্ট', icon: ListBulletIcon, soon: false },
          { path: '/accounts/books/sales-history', label: 'বিক্রয়ের তালিকা', icon: ClipboardDocumentListIcon, soon: false }
        ]
      }
    ]
  },
  {
    path: '/inspection',
    label: 'পরিদর্শন',
    icon: CheckBadgeIcon,
    children: [
      { path: '/inspection/list', label: 'রিপোর্ট তালিকা', icon: ClipboardDocumentListIcon },
      { path: '/inspection/create', label: 'নতুন রিপোর্ট', icon: PlusCircleIcon },
    ]
  },
  { 
    path: '/certificates', 
    label: 'সনদপত্র', 
    icon: TrophyIcon, 
    children: [
      { path: '/certificates/applications', label: 'আবেদনের তালিকা', icon: ClipboardDocumentListIcon, soon: false },
      { path: '/certificates/generate', label: 'সনদ তৈরি', icon: PlusCircleIcon, soon: true },
    ]
  },
  { 
    path: '/settings', 
    label: 'সেটিংস', 
    icon: Cog6ToothIcon, 
    children: [
      { path: '/profile', label: 'বোর্ড প্রোফাইল', icon: IdentificationIcon },
      { path: '/settings/user-management', label: 'ব্যবহারকারী ব্যবস্থাপনা', icon: UsersIcon, soon: true },
    ]
  },
  {
    path: '/others',
    label: 'অন্যান্য',
    icon: GlobeAltIcon,
    children: [
      { path: '/notice/list', label: 'নোটিশ ম্যানেজমেন্ট', icon: ClipboardDocumentListIcon },
      { path: '/faq/list', label: 'FAQ ম্যানেজমেন্ট', icon: QuestionMarkCircleIcon },
      { path: '/officials/list', label: 'পরিচালনা পর্ষদ', icon: UsersIcon },
      { path: '/others/contact-submissions', label: 'যোগাযোগের বার্তা', icon: EnvelopeIcon },
    ]
  }
];


export const TEACHER_SIDEBAR_NAV_ITEMS: NavItemType[] = [
  { path: '/teacher/dashboard', label: 'ড্যাশবোর্ড', icon: HomeIcon },
  { path: '/teacher/profile', label: 'আমার প্রোফাইল', icon: UserCircleIcon },
  { 
    path: '/teacher/exam-application', 
    label: 'পরীক্ষার আবেদন', 
    icon: PaperClipIcon,
    children: [
      { path: '/teacher/exam-application/new', label: 'নতুন আবেদন', icon: PlusCircleIcon },
      { path: '/teacher/exam-application/list', label: 'আমার আবেদনসমূহ', icon: ListBulletIcon },
    ]
  },
  { 
    path: '/teacher/results', 
    label: 'ফলাফল সংক্রান্ত', 
    icon: DocumentChartBarIcon, 
    children: [
      { path: '/teacher/results/assigned-scripts', label: 'নির্ধারিত উত্তরপত্র', icon: DocumentDuplicateIcon, soon: true },
      { path: '/teacher/results/marks-submission', label: 'নম্বর জমা দিন', icon: ClipboardDocumentListIcon, soon: true },
    ]
  },
  { path: '/teacher/settings', label: 'সেটিংস', icon: Cog6ToothIcon, soon: true },
];


export const BANGLADESH_DISTRICTS: DistrictOption[] = [
  { value: 'কক্সবাজার', label: 'কক্সবাজার' }, { value: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ' }, { value: 'কুমিল্লা', label: 'কুমিল্লা' },
  { value: 'কুড়িগ্রাম', label: 'কুড়িগ্রাম' }, { value: 'কুষ্টিয়া', label: 'কুষ্টিয়া' }, { value: 'খাগড়াছড়ি', label: 'খাগড়াছড়ি' },
  { value: 'খুলনা', label: 'খুলনা' }, { value: 'গাইবান্ধা', label: 'গাইবান্ধা' }, { value: 'গাজীপুর', label: 'গাজীপুর' },
  { value: 'গোপালগঞ্জ', label: 'গোপালগঞ্জ' }, { value: 'চট্টগ্রাম', label: 'চট্টগ্রাম' }, { value: 'চাঁদপুর', label: 'চাঁদপুর' },
  { value: 'চাঁপাইনবাবগঞ্জ', label: 'চাঁপাইনবাবগঞ্জ' }, { value: 'চুয়াডাঙ্গা', label: 'চুয়াডাঙ্গা' }, { value: 'জয়পুরহাট', label: 'জয়পুরহাট' },
  { value: 'জামালপুর', label: 'জামালপুর' }, { value: 'ঝালকাঠি', label: 'ঝালকাঠি' }, { value: 'ঝিনাইদহ', label: 'ঝিনাইদহ' },
  { value: 'টাঙ্গাইল', label: 'টাঙ্গাইল' }, { value: 'ঠাকুরগাঁও', label: 'ঠাকুরগাঁও' }, { value: 'ঢাকা', label: 'ঢাকা' },
  { value: 'দিনাজপুর', label: 'দিনাজপুর' }, { value: 'নওগাঁ', label: 'নওগাঁ' }, { value: 'নড়াইল', label: 'নড়াইল' },
  { value: 'নরসিংদী', label: 'নরসিংদী' }, { value: 'নারায়ণগঞ্জ', label: 'নারায়ণগঞ্জ' }, { value: 'নাটোর', label: 'নাটোর' },
  { value: 'নেত্রকোণা', label: 'নেত্রকোণা' }, { value: 'নীলফামারী', label: 'নীলফামারী' }, { value: 'নোয়াখালী', label: 'নোয়াখালী' },
  { value: 'পটুয়াখালী', label: 'পটুয়াখালী' }, { value: 'পঞ্চগড়', label: 'পঞ্চগড়' }, { value: 'পাবনা', label: 'পাবনা' },
  { value: 'পিরোজপুর', label: 'পিরোজপুর' }, { value: 'ফরিদপুর', label: 'ফরিদপুর' }, { value: 'ফেনী', label: 'ফেনী' },
  { value: 'বগুড়া', label: 'বগুড়া' }, { value: 'বরগুনা', label: 'বরগুনা' }, { value: 'বরিশাল', label: 'বরিশাল' },
  { value: 'বাগেরহাট', label: 'বাগেরহাট' }, { value: 'বান্দরবান', label: 'বান্দরবান' }, { value: 'ব্রাহ্মণবাড়িয়া', label: 'ব্রাহ্মণবাড়িয়া' },
  { value: 'ভোলা', label: 'ভোলা' }, { value: 'ময়মনসিংহ', label: 'ময়মনসিংহ' }, { value: 'মাগুরা', label: 'মাগুরা' },
  { value: 'মাদারীপুর', label: 'মাদারীপুর' }, { value: 'মানিকগঞ্জ', label: 'মানিকগঞ্জ' }, { value: 'মুন্সিগঞ্জ', label: 'মুন্সিগঞ্জ' },
  { value: 'মেহেরপুর', label: 'মেহেরপুর' }, { value: 'মৌলভীবাজার', label: 'মৌলভীবাজার' }, { value: 'যশোর', label: 'যশোর' },
  { value: 'রংপুর', label: 'রংপুর' }, { value: 'রাজবাড়ী', label: 'রাজবাড়ী' }, { value: 'রাজশাহী', label: 'রাজশাহী' },
  { value: 'রাঙ্গামাটি', label: 'রাঙ্গামাটি' }, { value: 'লক্ষ্মীপুর', label: 'লক্ষ্মীপুর' }, { value: 'লালমনিরহাট', label: 'লালমনিরহাট' },
  { value: 'শরীয়তপুর', label: 'শরীয়তপুর' }, { value: 'শেরপুর', label: 'শেরপুর' }, { value: 'সাতক্ষীরা', label: 'সাতক্ষীরা' },
  { value: 'সিরাজগঞ্জ', label: 'সিরাজগঞ্জ' }, { value: 'সিলেট', label: 'সিলেট' }, { value: 'সুনামগঞ্জ', label: 'সুনামগঞ্জ' },
  { value: 'হবিগঞ্জ', label: 'হবিগঞ্জ' }
].sort((a, b) => a.label.localeCompare(b.label, 'bn'));

const UPAZILAS_BY_DISTRICT: Record<string, Upazila[]> = {
  "বরগুনা": ["আমতলী", "তালতলী", "পাথরঘাটা", "বরগুনা সদর", "বেতাগী", "বামনা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "বরিশাল": ["আগৈলঝাড়া", "উজিরপুর", " গৌরনদী", "বাবুগঞ্জ", "বাকেরগঞ্জ", "বানারীপাড়া", "বরিশাল সদর", "মেহেন্দিগঞ্জ", "মুলাদী", "হিজলা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ভোলা": ["তজুমদ্দিন", "চরফ্যাশন", "দৌলতখান", "বোরহানউদ্দিন", "ভোলা সদর", "মনপুরা", "লালমোহন"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ঝালকাঠি": ["কাঁঠালিয়া", "ঝালকাঠি সদর", "নলছিটি", "রাজাপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "পটুয়াখালী": ["কলাপাড়া", "গলাচিপা", "দশমিনা", "দুমকি", "পটুয়াখালী সদর", "বাউফল", "মির্জাগঞ্জ", "রাঙ্গাবালী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "পিরোজপুর": ["কাউখালী", "জিয়ানগর", "নাজিরপুর", "নেছারাবাদ", "পিরোজপুর সদর", "ভাণ্ডারিয়া", "মঠবাড়ীয়া"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "বান্দরবান": ["আলীকদম", "থানচি", "নাইক্ষ্যংছড়ি", "বান্দরবান সদর", "রুমা", "রোয়াংছড়ি", "লামা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ব্রাহ্মণবাড়িয়া": ["আখাউড়া", "আশুগঞ্জ", "কসবা", "নবীনগর", " নাসিরনগর", "বাঞ্ছারামপুর", "ব্রাহ্মণবাড়িয়া সদর", "সরাইল", "বিজয়নগর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "চাঁদপুর": ["চাঁদপুর সদর", "ফরিদগঞ্জ", " হাজীগঞ্জ", " হাইমচর", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "চট্টগ্রাম": ["আনোয়ারা", "কর্ণফুলী", "চন্দনাইশ", "পটিয়া", "ফটিকছড়ি", "বাঁশখালী", "বোয়ালখালী", "মিরসরাই", "রাউজান", "রাঙ্গুনিয়া", "লোহাগাড়া", "সন্দ্বীপ", "সাতকানিয়া", "সীতাকুণ্ড", "হাটহাজারী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "কুমিল্লা": ["দাউদকান্দি", "দেবিদ্বার", "নাঙ্গলকোট", "বরুড়া", "বুড়িচং", "ব্রাহ্মণপাড়া", " চান্দিনা", " চৌদ্দগ্রাম", "কুমিল্লা সদর", "কুমিল্লা সদর দক্ষিণ", " তিতাস", " হোমনা", " লাকসাম", " লালমাই", " মনোহরগঞ্জ", " মেঘনা", " মুরাদনগর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "কক্সবাজার": ["উখিয়া", "কক্সবাজার সদর", " কুতুবদিয়া", "চকরিয়া", " টেকনাফ", "পেকুয়া", "মহেশখালী", "রামু"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ফেনী": ["ছাগলনাইয়া", "দাগনভূঞা", "পরশুরাম", "ফুলগাজী", "ফেনী সদর", "সোনাগাজী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "খাগড়াছড়ি": ["খাগড়াছড়ি সদর", "গুইমারা", "দীঘিনালা", "পানছড়ি", "মহালছড়ি", "মানিকছড়ি", "মাটিরাঙ্গা", "রামগড়", "লক্ষ্মীছড়ি"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "লক্ষ্মীপুর": ["কমলনগর", "লক্ষ্মীপুর সদর", "রামগঞ্জ", "রামগতি", "রায়পুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নোয়াখালী": ["কবিরহাট", "কোম্পানীগঞ্জ", "চাটখিল", " বেগমগঞ্জ", "নোয়াখালী সদর", " সেনবাগ", "সোনাইমুড়ী", "সুবর্ণচর", "হাতিয়া"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "রাঙ্গামাটি": ["কাউখালী", "কাপ্তাই", " জুরাছড়ি", "নানিয়ারচর", " বাঘাইছড়ি", " বরকল", "বিলাইছড়ি", " রাঙ্গামাটি সদর", " রাজস্থলী", " লংগদু"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ঢাকা": ["কেরানীগঞ্জ", "খিলগাঁও", " গুলশান", " তেজগাঁও", " তেজগাঁও শিল্পাঞ্চল", " দক্ষিণখান", " দরুসসালাম", " ধামরাই", " ধানমন্ডি", " নবাবগঞ্জ", " নিউমার্কেট", " পল্লবী", " পল্টন", " বংশাল", " বাড্ডা", " বিমানবন্দর", " ভাষানটেক", " মতিঝিল", " মিরপুর", " মোহাম্মদপুর", " যাত্রাবাড়ী", " রমনা", " রামপুরা", " লালবাগ", " শাহআলী", " শাহবাগ", " সূত্রাপুর", " সবুজবাগ", " সাভার", " হাজারীবাগ", " উত্তরা পূর্ব", " উত্তরা পশ্চিম", " উত্তরখান", " কদমতলী", " কলাবাগান", " কামরাঙ্গীরচর", " ক্যান্টনমেন্ট", "কোতয়ালী", " চকবাজার", " ডেমরা", " তুরাগ", " দোহার", " আদাবর", " আশুলিয়া", "ভাটারা", "খিলক্ষেত"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ফরিদপুর": ["আলফাডাঙ্গা", "চরভদ্রাসন", "নগরকান্দা", "ফরিদপুর সদর", "বোয়ালমারী", "ভাঙ্গা", "মধুখালী", "সদরপুর", "সালথা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "গাজীপুর": ["কালিয়াকৈর", "কালীগঞ্জ", "কাপাসিয়া", "গাজীপুর সদর", "শ্রীপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "গোপালগঞ্জ": ["কাশিয়ানী", "কোটালীপাড়া", "গোপালগঞ্জ সদর", "টুঙ্গিপাড়া", "মুকসুদপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "জামালপুর": ["ইসলামপুর", "জামালপুর সদর", "দেওয়ানগঞ্জ", "বকশীগঞ্জ", "মাদারগঞ্জ", "মেলান্দহ", "সরিষাবাড়ী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "কিশোরগঞ্জ": ["অষ্টগ্রাম", "ইটনা", "করিমগঞ্জ", "কটিয়াদী", "কিশোরগঞ্জ সদর", "কুলিয়ারচর", " তাড়াইল", " নিকলী", "পাকুন্দিয়া", "বাজিতপুর", "ভৈরব", "মিঠামইন", "হোসেনপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মাদারীপুর": ["কালকিনি", "ডাসার", "মাদারীপুর সদর", "রাজৈর", "শিবচর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মানিকগঞ্জ": ["ঘিওর", " দৌলতপুর", "মানিকগঞ্জ সদর", " সাটুরিয়া", " সিংগাইর", " শিবালয়", " হরিরামপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মুন্সিগঞ্জ": ["গজারিয়া", "টংগিবাড়ী", " লৌহজং", "মুন্সিগঞ্জ সদর", " সিরাজদিখান", " শ্রীনগর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ময়মনসিংহ": ["ঈশ্বরগঞ্জ", "গফরগাঁও", " গৌরীপুর", "তারাকান্দা", " ত্রিশাল", " ধোবাউড়া", " নান্দাইল", " ফুলপুর", " ফুলবাড়ীয়া", " ভালুকা", "ময়মনসিংহ সদর", " মুক্তাগাছা", " হালুয়াঘাট"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নারায়ণগঞ্জ": ["আড়াইহাজার", "নারায়ণগঞ্জ সদর", " বন্দর", " রূপগঞ্জ", " সোনারগাঁও"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নরসিংদী": ["নরসিংদী সদর", "পলাশ", " বেলাবো", " মনোহরদী", " রায়পুরা", " শিবপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নেত্রকোণা": ["আটপাড়া", " কলমাকান্দা", " কেন্দুয়া", " খালিয়াজুরী", " দুর্গাপুর", " নেত্রকোণা সদর", " পূর্বধলা", " বারহাট্টা", " মদন", " মোহনগঞ্জ"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "রাজবাড়ী": ["কালুখালী", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি", "রাজবাড়ী সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "শরীয়তপুর": ["গোসাইরহাট", "জাজিরা", "ডামুড্যা", "নড়িয়া", "ভেদরগঞ্জ", "শরীয়তপুর সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "শেরপুর": ["ঝিনাইগাতী", "নকলা", "নালিতাবাড়ী", "শেরপুর সদর", "শ্রীবরদী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "টাঙ্গাইল": ["কালিহাতী", " ঘাটাইল", " গোপালপুর", " টাঙ্গাইল সদর", " দেলদুয়ার", " ধনবাড়ী", " নাগরপুর", " বাসাইল", " ভুঞাপুর", " মধুপুর", " মির্জাপুর", " সখিপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "বাগেরহাট": ["কচুয়া", " চিতলমারী", " ফকিরহাট", " বাগেরহাট সদর", " মংলা", " মোড়েলগঞ্জ", " মোল্লাহাট", " রামপাল", " শরণখোলা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "চুয়াডাঙ্গা": ["আলমডাঙ্গা", " জীবননগর", " চুয়াডাঙ্গা সদর", " দামুড়হুদা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "যশোর": ["অভয়নগর", " কেশবপুর", " চৌগাছা", " ঝিকরগাছা", " বাঘারপাড়া", " যশোর সদর", " মনিরামপুর", " শার্শা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ঝিনাইদহ": ["কোটচাঁদপুর", " কালীগঞ্জ", " ঝিনাইদহ সদর", " শৈলকুপা", " মহেশপুর", " হরিণাকুণ্ডু"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "খুলনা": ["কয়রা", " তেরখাদা", " দাকোপ", " দিঘলিয়া", " ডুমুরিয়া", " পাইকগাছা", " ফুলতলা", " বটিয়াঘাটা", " রূপসা", "কোতয়ালী", "খানজাহান আলী", "খালিশপুর", "দৌলতপুর", "সোনাডাঙ্গা", "লবণচরা", "হরিণটানা", "আড়ংঘাটা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "কুষ্টিয়া": ["কুমারখালী", " কুষ্টিয়া সদর", " খোকসা", " দৌলতপুর", " ভেড়ামারা", " মিরপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মাগুরা": ["মহম্মদপুর", " মাগুরা সদর", " শালিখা", " শ্রীপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মেহেরপুর": ["গাংনী", " মুজিবনগর", " মেহেরপুর সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নড়াইল": ["কালিয়া", " নড়াইল সদর", " লোহাগড়া"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "সাতক্ষীরা": ["কলারোয়া", " কালীগঞ্জ", " তালা", " দেবহাটা", " আশাশুনি", " শ্যামনগর", " সাতক্ষীরা সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "বগুড়া": ["আদমদীঘি", " কাহালু", " গাবতলী", " শাজাহานপুর", " ধুনট", " দুপচাঁচিয়া", " নন্দীগ্রাম", " বগুড়া সদর", " শিবগঞ্জ", " শেরপুর", " সারিয়াকান্দি", " সোনাতলা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "চাঁপাইনবাবগঞ্জ": ["গোমস্তাপুর", " চাঁপাইনবাবগঞ্জ সদর", " নাচোল", " ভোলাহাট", " শিবগঞ্জ"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "জয়পুরহাট": ["আক্কেলপুর", " কালাই", " ক্ষেতলাল", " জয়পুরহাট সদর", " পাঁচবিবি"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নওগাঁ": ["আত্রাই", " ধামইরহাট", " নওগাঁ সদর", " নিয়ামতপুর", " পত্নীতলা", " পোরশা", " বদলগাছী", " মান্দা", " মহাদেবপুর", " রাণীনগর", " সাপাহার"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নাটোর": ["গুরুদাসপুর", " নাটোর সদর", " নলডাঙ্গা", " বাগাতিপাড়া", " বড়াইগ্রাম", " লালপুর", " সিংড়া"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "পাবনা": ["ঈশ্বরদী", " আটঘরিয়া", " চাটমোহর", " পাবনা সদর", " ফরিদপুর", " বেড়া", " ভাঙ্গুড়া", " সাঁথিয়া", " সুজানগর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "রাজশাহী": ["তানোর", " চারঘাট", " দুর্গাপুর", " পবা", " পুঠিয়া", " বাগমারা", " বাঘা", " মোহনপুর", " গোদাগাড়ী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "সিরাজগঞ্জ": ["রায়গঞ্জ", " উল্লাপাড়া", " কাজীপুর", " কামারখন্দ", " চৌহালি", " তাড়াশ", " বেলকুচি", " শাহজাদপুর", " সিরাজগঞ্জ সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "দিনাজপুর": ["খানসামা", " কাহারোল", " চিরিরবন্দর", " দিনাজপুর সদর", " নবাবগঞ্জ", " পার্বতীপুর", " ফুলবাড়ী", " বিরামপুর", " বিরল", " বোচাগঞ্জ", " বীরগঞ্জ", " হাকিমপুর", " ঘোড়াঘাট"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "গাইবান্ধা": ["গাইবান্ধা সদর", " গোবিন্দগঞ্জ", " পলাশবাড়ী", " ফুলছড়ি", " সাদুল্লাপুর", " সাঘাটা", " সুন্দরগঞ্জ"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "কুড়িগ্রাম": ["উলিপুর", " কুড়িগ্রাম সদর", " চর রাজিবপুর", " চিলমারী", " নাগেশ্বরী", " ফুলবাড়ী", " ভুরুঙ্গামারী", " রাজারহাট", " রৌমারী"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "লালমনিরহাট": ["আদিতমারী", " কালীগঞ্জ", " পাটগ্রাম", " লালমনিরহাট সদর", " হাতীবান্ধা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "নীলফামারী": ["কিশোরগঞ্জ", " জলঢাকা", " ডিমলা", " ডোমার", " নীলফামারী সদর", " সৈয়দপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "পঞ্চগড়": ["আটোয়ারী", " তেঁতুলিয়া", " দেবীগঞ্জ", " পঞ্চগড় সদর", " বোদা"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "রংপুর": [" কাউনিয়া", " গংগাচড়া", " তারাগঞ্জ", " পীরগঞ্জ", " পীরগাছা", " বদরগঞ্জ", " মিঠাপুকুর", " রংপুর সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "ঠাকুরগাঁও": ["ঠাকুরগাঁও সদর", " পীরগঞ্জ", " বালিয়াডাঙ্গী", " রাণীশংকৈল", " হরিপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "হবিগঞ্জ": ["আজমিরীগঞ্জ", " চুনারুঘাট", " নবীগঞ্জ", " বানিয়াচং", " বাহুবল", " মাধবপুর", " লাখাই", " হবিগঞ্জ সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "মৌলভীবাজার": [" কমলগঞ্জ", " কুলাউড়া", " জুড়ী", " বড়লেখা", " মৌলভীবাজার সদর", " রাজনগর", " শ্রীমঙ্গল"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "সুনামগঞ্জ": [" তাহিরপুর", " ছাতক", " দিরাই", " দোয়ারাবাজার", " দক্ষিণ সুনামগঞ্জ", " ধর্মপাশা", " বিশ্বম্ভরপুর", " শাল্লা", " সুনামগঞ্জ সদর", " জামালগঞ্জ", " জগন্নাথপুর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
  "সিলেট": [" ওসমানী নগর", " কানাইঘাট", " কোম্পানীগঞ্জ", " গোলাপগঞ্জ", " গোয়াইনঘাট", " জকিগঞ্জ", " জৈন্তাপুর", " দক্ষিণ সুরমা", " ফেঞ্চুগঞ্জ", " বালাগঞ্জ", " বিয়ানীবাজার", " বিশ্বনাথ", " সিলেট সদর"].map(u => ({ value: u, label: u })).sort((a,b) => a.label.localeCompare(b.label, 'bn')),
};


// Division and District Structure
export const DIVISIONS_BD: Division[] = [
  { value: 'ঢাকা', label: 'ঢাকা', districts: [
    { value: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['কিশোরগঞ্জ'] || [] },
    { value: 'গাজীপুর', label: 'গাজীপুর', upazilas: UPAZILAS_BY_DISTRICT['গাজীপুর'] || [] },
    { value: 'গোপালগঞ্জ', label: 'গোপালগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['গোপালগঞ্জ'] || [] },
    { value: 'টাঙ্গাইল', label: 'টাঙ্গাইল', upazilas: UPAZILAS_BY_DISTRICT['টাঙ্গাইল'] || [] },
    { value: 'ঢাকা', label: 'ঢাকা', upazilas: UPAZILAS_BY_DISTRICT['ঢাকা'] || [] },
    { value: 'নরসিংদী', label: 'নরসিংদী', upazilas: UPAZILAS_BY_DISTRICT['নরসিংদী'] || [] },
    { value: 'নারায়ণগঞ্জ', label: 'নারায়ণগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['নারায়ণগঞ্জ'] || [] },
    { value: 'ফরিদপুর', label: 'ফরিদপুর', upazilas: UPAZILAS_BY_DISTRICT['ফরিদপুর'] || [] },
    { value: 'মাদারীপুর', label: 'মাদারীপুর', upazilas: UPAZILAS_BY_DISTRICT['মাদারীপুর'] || [] },
    { value: 'মানিকগঞ্জ', label: 'মানিকগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['মানিকগঞ্জ'] || [] },
    { value: 'মুন্সিগঞ্জ', label: 'মুন্সিগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['মুন্সিগঞ্জ'] || [] },
    { value: 'রাজবাড়ী', label: 'রাজবাড়ী', upazilas: UPAZILAS_BY_DISTRICT['রাজবাড়ী'] || [] },
    { value: 'শরীয়তপুর', label: 'শরীয়তপুর', upazilas: UPAZILAS_BY_DISTRICT['শরীয়তপুর'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'চট্টগ্রাম', label: 'চট্টগ্রাম', districts: [
    { value: 'কুমিল্লা', label: 'কুমিল্লা', upazilas: UPAZILAS_BY_DISTRICT['কুমিল্লা'] || [] },
    { value: 'কক্সবাজার', label: 'কক্সবাজার', upazilas: UPAZILAS_BY_DISTRICT['কক্সবাজার'] || [] },
    { value: 'খাগড়াছড়ি', label: 'খাগড়াছড়ি', upazilas: UPAZILAS_BY_DISTRICT['খাগড়াছড়ি'] || [] },
    { value: 'চাঁদপুর', label: 'চাঁদপুর', upazilas: UPAZILAS_BY_DISTRICT['চাঁদপুর'] || [] },
    { value: 'চট্টগ্রাম', label: 'চট্টগ্রাম', upazilas: UPAZILAS_BY_DISTRICT['চট্টগ্রাম'] || [] },
    { value: 'নোয়াখালী', label: 'নোয়াখালী', upazilas: UPAZILAS_BY_DISTRICT['নোয়াখালী'] || [] },
    { value: 'ফেনী', label: 'ফেনী', upazilas: UPAZILAS_BY_DISTRICT['ফেনী'] || [] },
    { value: 'বান্দরবান', label: 'বান্দরবান', upazilas: UPAZILAS_BY_DISTRICT['বান্দরবান'] || [] },
    { value: 'ব্রাহ্মণবাড়িয়া', label: 'ব্রাহ্মণবাড়িয়া', upazilas: UPAZILAS_BY_DISTRICT['ব্রাহ্মণবাড়িয়া'] || [] },
    { value: 'রাঙ্গামাটি', label: 'রাঙ্গামাটি', upazilas: UPAZILAS_BY_DISTRICT['রাঙ্গামাটি'] || [] },
    { value: 'লক্ষ্মীপুর', label: 'লক্ষ্মীপুর', upazilas: UPAZILAS_BY_DISTRICT['লক্ষ্মীপুর'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'রাজশাহী', label: 'রাজশাহী', districts: [
    { value: 'চাঁপাইনবাবগঞ্জ', label: 'চাঁপাইনবাবগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['চাঁপাইনবাবগঞ্জ'] || [] },
    { value: 'জয়পুরহাট', label: 'জয়পুরহাট', upazilas: UPAZILAS_BY_DISTRICT['জয়পুরহাট'] || [] },
    { value: 'নওগাঁ', label: 'নওগাঁ', upazilas: UPAZILAS_BY_DISTRICT['নওগাঁ'] || [] },
    { value: 'নাটোর', label: 'নাটোর', upazilas: UPAZILAS_BY_DISTRICT['নাটোর'] || [] },
    { value: 'পাবনা', label: 'পাবনা', upazilas: UPAZILAS_BY_DISTRICT['পাবনা'] || [] },
    { value: 'বগুড়া', label: 'বগুড়া', upazilas: UPAZILAS_BY_DISTRICT['বগুড়া'] || [] },
    { value: 'রাজশাহী', label: 'রাজশাহী', upazilas: UPAZILAS_BY_DISTRICT['রাজশাহী'] || [] },
    { value: 'সিরাজগঞ্জ', label: 'সিরাজগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['সিরাজগঞ্জ'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'খুলনা', label: 'খুলনা', districts: [
    { value: 'কুষ্টিয়া', label: 'কুষ্টিয়া', upazilas: UPAZILAS_BY_DISTRICT['কুষ্টিয়া'] || [] },
    { value: 'খুলনা', label: 'খুলনা', upazilas: UPAZILAS_BY_DISTRICT['খুলনা'] || [] },
    { value: 'চুয়াডাঙ্গা', label: 'চুয়াডাঙ্গা', upazilas: UPAZILAS_BY_DISTRICT['চুয়াডাঙ্গা'] || [] },
    { value: 'ঝিনাইদহ', label: 'ঝিনাইদহ', upazilas: UPAZILAS_BY_DISTRICT['ঝিনাইদহ'] || [] },
    { value: 'নড়াইল', label: 'নড়াইল', upazilas: UPAZILAS_BY_DISTRICT['নড়াইল'] || [] },
    { value: 'বাগেরহাট', label: 'বাগেরহাট', upazilas: UPAZILAS_BY_DISTRICT['বাগেরহাট'] || [] },
    { value: 'মাগুরা', label: 'মাগুরা', upazilas: UPAZILAS_BY_DISTRICT['মাগুরা'] || [] },
    { value: 'মেহেরপুর', label: 'মেহেরপুর', upazilas: UPAZILAS_BY_DISTRICT['মেহেরপুর'] || [] },
    { value: 'যশোর', label: 'যশোর', upazilas: UPAZILAS_BY_DISTRICT['যশোর'] || [] },
    { value: 'সাতক্ষীরা', label: 'সাতক্ষীরা', upazilas: UPAZILAS_BY_DISTRICT['সাতক্ষীরা'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'বরিশাল', label: 'বরিশাল', districts: [
    { value: 'ঝালকাঠি', label: 'ঝালকাঠি', upazilas: UPAZILAS_BY_DISTRICT['ঝালকাঠি'] || [] },
    { value: 'পটুয়াখালী', label: 'পটুয়াখালী', upazilas: UPAZILAS_BY_DISTRICT['পটুয়াখালী'] || [] },
    { value: 'পিরোজপুর', label: 'পিরোজপুর', upazilas: UPAZILAS_BY_DISTRICT['পিরোজপুর'] || [] },
    { value: 'বরিশাল', label: 'বরিশাল', upazilas: UPAZILAS_BY_DISTRICT['বরিশাল'] || [] },
    { value: 'বরগুনা', label: 'বরগুনা', upazilas: UPAZILAS_BY_DISTRICT['বরগুনা'] || [] },
    { value: 'ভোলা', label: 'ভোলা', upazilas: UPAZILAS_BY_DISTRICT['ভোলা'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'সিলেট', label: 'সিলেট', districts: [
    { value: 'মৌলভীবাজার', label: 'মৌলভীবাজার', upazilas: UPAZILAS_BY_DISTRICT['মৌলভীবাজার'] || [] },
    { value: 'সিলেট', label: 'সিলেট', upazilas: UPAZILAS_BY_DISTRICT['সিলেট'] || [] },
    { value: 'সুনামগঞ্জ', label: 'সুনামগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['সুনামগঞ্জ'] || [] },
    { value: 'হবিগঞ্জ', label: 'হবিগঞ্জ', upazilas: UPAZILAS_BY_DISTRICT['হবিগঞ্জ'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'রংপুর', label: 'রংপুর', districts: [
    { value: 'কুড়িগ্রাম', label: 'কুড়িগ্রাম', upazilas: UPAZILAS_BY_DISTRICT['কুড়িগ্রাম'] || [] },
    { value: 'গাইবান্ধা', label: 'গাইবান্ধা', upazilas: UPAZILAS_BY_DISTRICT['গাইবান্ধা'] || [] },
    { value: 'ঠাকুরগাঁও', label: 'ঠাকুরগাঁও', upazilas: UPAZILAS_BY_DISTRICT['ঠাকুরগাঁও'] || [] },
    { value: 'দিনাজপুর', label: 'দিনাজপুর', upazilas: UPAZILAS_BY_DISTRICT['দিনাজপুর'] || [] },
    { value: 'নীলফামারী', label: 'নীলফামারী', upazilas: UPAZILAS_BY_DISTRICT['নীলফামারী'] || [] },
    { value: 'পঞ্চগড়', label: 'পঞ্চগড়', upazilas: UPAZILAS_BY_DISTRICT['পঞ্চগড়'] || [] },
    { value: 'রংপুর', label: 'রংপুর', upazilas: UPAZILAS_BY_DISTRICT['রংপুর'] || [] },
    { value: 'লালমনিরহাট', label: 'লালমনিরহাট', upazilas: UPAZILAS_BY_DISTRICT['লালমনিরহাট'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
  { value: 'ময়মনসিংহ', label: 'ময়মনসিংহ', districts: [
    { value: 'জামালপুর', label: 'জামালপুর', upazilas: UPAZILAS_BY_DISTRICT['জামালপুর'] || [] },
    { value: 'নেত্রকোণা', label: 'নেত্রকোণা', upazilas: UPAZILAS_BY_DISTRICT['নেত্রকোণা'] || [] },
    { value: 'ময়মনসিংহ', label: 'ময়মনসিংহ', upazilas: UPAZILAS_BY_DISTRICT['ময়মনসিংহ'] || [] },
    { value: 'শেরপুর', label: 'শেরপুর', upazilas: UPAZILAS_BY_DISTRICT['শেরপুর'] || [] },
  ].sort((a,b) => a.label.localeCompare(b.label, 'bn'))},
].sort((a,b) => a.label.localeCompare(b.label, 'bn'));


export const MADRASA_TYPE_OPTIONS: SelectOption[] = [
  { value: 'boys', label: 'বালক' },
  { value: 'girls', label: 'বালিকা' },
];

export const DISPATCH_METHOD_OPTIONS: SelectOption[] = [
  { value: 'courier', label: 'কুরিয়ার' },
  { value: 'post', label: 'ডাক' },
  { value: 'both', label: 'উভয়' },
];

export const MARHALA_TYPES: SelectOption[] = [
  { value: 'boys', label: 'বালক' },
  { value: 'girls', label: 'বালিকা' },
];

export const MARHALA_CATEGORIES: SelectOption[] = [
  { value: 'darsiyat', label: 'দরসিয়াত' },
  { value: 'hifz', label: 'হিফজ' },
];

export const PAYMENT_METHODS: SelectOption[] = [
  { value: 'cash', label: 'নগদ' },
  { value: 'check', label: 'চেক' },
  { value: 'mobile_banking', label: 'মোবাইল ব্যাংকিং' },
  { value: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার' },
];

export const GENDER_OPTIONS: SelectOption[] = [
  { value: 'male', label: 'পুরুষ' },
  { value: 'female', label: 'মহিলা' },
  { value: 'other', label: 'অন্যান্য' },
];

export const PAYMENT_TYPE_OPTIONS: SelectOption[] = [
    { value: 'mobile', label: 'মোবাইল ব্যাংকিং' },
    { value: 'bank', label: 'ব্যাংক একাউন্ট' },
];

export const BANK_ACCOUNT_TYPES: SelectOption[] = [
    { value: 'current', label: 'চলতি হিসাব' },
    { value: 'savings', label: 'সঞ্চয়ী হিসাব' },
];

export const BANK_TRANSACTION_TYPES: SelectOption[] = [
    { value: 'deposit', label: 'জমা' },
    { value: 'withdrawal', label: 'উত্তোলন' },
    { value: 'transfer', label: 'ট্রান্সফার' },
];

export const TEACHER_STATUS_OPTIONS: SelectOption[] = [
    { value: '', label: 'সকল (সক্রিয়/নিষ্ক্রিয়)' },
    { value: 'true', label: 'শুধুমাত্র সক্রিয়' },
    { value: 'false', label: 'শুধুমাত্র নিষ্ক্রিয়' },
];

export const NEGRAN_TYPE_OPTIONS: SelectOption[] = [
    { value: '', label: 'নেগরানের ধরণ নির্বাচন করুন' }, // Placeholder
    { value: 'head', label: 'প্রধান নেগরান' },
    { value: 'assistant', label: 'সহকারী নেগরান' },
];
