
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import TeacherLayout from './components/layout/TeacherLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutUsPage from './pages/public/AboutUsPage';
import PublicResultsPage from './pages/public/ResultsPage';
import CertificateApplicationPage from './pages/public/CertificateApplicationPage';
import CertificateStatusPage from './pages/public/CertificateStatusPage';
import MadrasaAffiliationPage from './pages/public/MadrasaAffiliationPage';

// Admin Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlaceholderPage from './pages/PlaceholderPage';
import MadrasaRegistrationPage from './pages/madrasa/MadrasaRegistrationPage';
import MadrasaListPage from './pages/madrasa/MadrasaListPage';
import MadrasaApplicationListPage from './pages/madrasa/MadrasaApplicationListPage';
import KitabRegistrationPage from './pages/kitab/KitabRegistrationPage';
import KitabListPage from './pages/kitab/KitabListPage';
import ZoneRegistrationPage from './pages/zone/ZoneRegistrationPage';
import ZoneListPage from './pages/zone/ZoneListPage';
import MarhalaRegistrationPage from './pages/marhala/MarhalaRegistrationPage';
import MarhalaListPage from './pages/marhala/MarhalaListPage';
import TeacherRegistrationPage from './pages/teachers/TeacherRegistrationPage'; 
import TeacherListPage from './pages/teachers/TeacherListPage'; 
import ExamTeacherAssignmentPage from './pages/assignment/ExamTeacherAssignmentPage'; 
import NegranListPage from './pages/assignment/NegranListPage';
import MumtahinListPage from './pages/assignment/MumtahinListPage';
import MarkazRegistrationPage from './pages/markaz/MarkazRegistrationPage';
import MarkazListPage from './pages/markaz/MarkazListPage';
// import MarkazAssignmentPage from './pages/markaz/MarkazAssignmentPage';
import ExamRegistrationPage from './pages/exam/ExamRegistrationPage';
import ExamListPage from './pages/exam/ExamListPage';
import RegistrationFeeCollectionPage from './pages/finance/registration-fee/RegistrationFeeCollectionPage';
import RegistrationFeeListPage from './pages/finance/registration-fee/RegistrationFeeListPage';
import ExamineeRegistrationPage from './pages/examinee/ExamineeRegistrationPage';
import ExamineeListPage from './pages/examinee/ExamineeListPage';
import ExamFeeCollectionPage from './pages/finance/exam-fee/ExamFeeCollectionPage';
import ExamFeeListPage from './pages/finance/exam-fee/ExamFeeListPage';
import RollNumberAssignmentPage from './pages/examinee/RollNumberAssignmentPage';
import MarksEntryPage from './pages/results/MarksEntryPage';
import ScriptDistributionPage from './pages/results/ScriptDistributionPage'; 
import DistributionListPage from './pages/results/DistributionListPage';
import ViewResultsPage from './pages/results/ViewResultsPage';
import ResultProcessingPage from './pages/results/ResultProcessingPage';
import ProfilePage from './pages/ProfilePage';
import PrintCenterPage from './pages/PrintCenterPage'; 
import CertificateApplicationListPage from './pages/certificates/ApplicationListPage';
import InspectionListPage from './pages/inspections/InspectionListPage';
import CreateInspectionPage from './pages/inspections/CreateInspectionPage';
import NoticeListPage from './pages/others/NoticeListPage';
import FaqListPage from './pages/others/FaqListPage';
import OfficialsListPage from './pages/others/OfficialsListPage';
import ContactSubmissionsPage from './pages/others/ContactSubmissionsPage';


// Teacher Portal Imports
import TeacherLoginPage from './pages/teacher-auth/TeacherLoginPage';
import TeacherSignupPage from './pages/teacher-auth/TeacherSignupPage';
import TeacherDashboardPage from './pages/teacher-portal/TeacherDashboardPage';
import TeacherProfilePage from './pages/teacher-portal/TeacherProfilePage';
import TeacherNewExamApplicationPage from './pages/teacher-portal/NewExamApplicationPage';
import TeacherMyExamApplicationsPage from './pages/teacher-portal/MyExamApplicationsPage';

// Accounting Imports
import IncomeExpenseEntryPage from './pages/accounts/income-expense/IncomeExpenseEntryPage';
import IncomeExpenseReportPage from './pages/accounts/income-expense/IncomeExpenseReportPage';
import BankDashboardPage from './pages/accounts/banks/BankDashboardPage';
import BookListPage from './pages/accounts/books/BookListPage';
import BookSalesHistoryPage from './pages/accounts/books/BookSalesHistoryPage';
import CategoryListPage from './pages/accounts/categories/CategoryListPage';

// Other
import { NavItemType } from './types';
import { SIDEBAR_NAV_ITEMS, TEACHER_SIDEBAR_NAV_ITEMS } from './constants'; 
import { AuthProvider } from './contexts/AuthContext';
import ToastContainer from './components/layout/ToastContainer';
import { ToastProvider } from './contexts/ToastContext';
import MarkazAssignmentPage from './pages/markaz/MarkazAssignmentPage';
import CollectionsListPage from './pages/finance/CollectionsListPage';


const App = (): JSX.Element => {
  const getUniqueNavItems = (items: NavItemType[]): NavItemType[] => {
    const allItems: NavItemType[] = [];
    const seenPaths = new Set<string>();
    function recurse(currentItems: NavItemType[]) {
      currentItems.forEach(item => {
        if (!seenPaths.has(item.path)) {
          allItems.push(item);
          seenPaths.add(item.path);
        }
        if (item.children) { recurse(item.children); }
      });
    }
    recurse(items);
    return allItems;
  };
  
  const uniqueAdminNavItems = getUniqueNavItems(SIDEBAR_NAV_ITEMS);
  const uniqueTeacherNavItems = getUniqueNavItems(TEACHER_SIDEBAR_NAV_ITEMS);


  const implementedAdminPaths = [
    '/dashboard', '/madrasa/registration', '/madrasa/list', '/madrasa/applications', '/marhala/registration', '/marhala/list',
    '/kitab/registration', '/kitab/list', '/zone/registration', '/zone/list',
    '/markaz/registration', '/markaz/list', 
    // '/markaz/assignment', // Temporarily commented out
    '/teachers/registration', 
    '/teachers/list', 
    '/assignment/teachers',
    '/assignment/negrans', '/assignment/mumtahins', 
    '/examinee/registration', '/examinee/list', 
    '/examinee/assign-roll', '/exam/registration', '/exam/list',
    '/finance/registration-fee/collect', '/finance/registration-fee/list',
    '/finance/exam-fee/collect', '/finance/exam-fee/list', 
    '/reports/print-center', 
    '/results/script-distribution', 
    '/results/distribution-list',
    '/results/marks-entry', '/results/process', '/results/view', '/profile',
    '/accounts/income-expense/entry',
    '/accounts/income-expense/report',
    '/accounts/banks/dashboard',
    '/accounts/books/list',
    '/accounts/books/sales-history',
    '/certificates/applications', 
    '/inspection/list', 
    '/inspection/create',
    '/notice/list',
    '/faq/list',
    '/officials/list',
    '/others/contact-submissions',
  ];

  const parentOnlyAdminPaths = [ 
    '/madrasa', '/marhala', '/kitab', '/zone', '/markaz', '/teachers', 
    '/examinee', '/results', '/reports', '/markaz-management', '/accounts', 
    '/certificates', '/exam', '/finance/registration-fee', '/finance/exam-fee', '/assignment',
    '/accounts/income-expense', '/accounts/banks', '/accounts/books', '/inspection', '/others'
  ];

  const implementedTeacherPaths = [
    '/teacher/dashboard', '/teacher/profile', 
    '/teacher/exam-application/new', '/teacher/exam-application/list',
  ];
  const parentOnlyTeacherPaths = [
    '/teacher/exam-application', '/teacher/results', '/teacher/settings',
  ];
  
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutUsPage />} />
              <Route path="results" element={<PublicResultsPage />} />
              <Route path="apply-affiliation" element={<MadrasaAffiliationPage />} />
              <Route path="apply-certificate" element={<CertificateApplicationPage />} />
              <Route path="certificate-status" element={<CertificateStatusPage />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="madrasa/registration" element={<MadrasaRegistrationPage />} />
              <Route path="madrasa/list" element={<MadrasaListPage />} />
              <Route path="madrasa/applications" element={<MadrasaApplicationListPage />} />
              <Route path="marhala/registration" element={<MarhalaRegistrationPage />} />
              <Route path="marhala/list" element={<MarhalaListPage />} />
              <Route path="kitab/registration" element={<KitabRegistrationPage />} />
              <Route path="kitab/list" element={<KitabListPage />} />
              <Route path="zone/registration" element={<ZoneRegistrationPage />} />
              <Route path="zone/list" element={<ZoneListPage />} />
              <Route path="markaz/registration" element={<MarkazRegistrationPage />} />
              <Route path="markaz/list" element={<MarkazListPage />} />
              <Route path="markaz/assignment" element={<MarkazAssignmentPage />} />
              <Route path="teachers/registration" element={<TeacherRegistrationPage />} />
              <Route path="teachers/list" element={<TeacherListPage />} />
              <Route path="assignment/teachers" element={<ExamTeacherAssignmentPage />} />
              <Route path="assignment/negrans" element={<NegranListPage />} /> 
              <Route path="assignment/mumtahins" element={<MumtahinListPage />} /> 
              <Route path="examinee/registration" element={<ExamineeRegistrationPage />} />
              <Route path="examinee/list" element={<ExamineeListPage />} />
              <Route path="examinee/assign-roll" element={<RollNumberAssignmentPage />} />
              <Route path="exam/registration" element={<ExamRegistrationPage />} />
              <Route path="exam/list" element={<ExamListPage />} />
              <Route path="finance/registration-fee/collect" element={<RegistrationFeeCollectionPage />} />
              <Route path="finance/registration-fee/list" element={<RegistrationFeeListPage />} />
              <Route path="finance/exam-fee/collect" element={<ExamFeeCollectionPage />} /> 
              <Route path="finance/exam-fee/list" element={<ExamFeeListPage />} /> 
              <Route path="results/script-distribution" element={<ScriptDistributionPage />} />
              <Route path="results/distribution-list" element={<DistributionListPage />} />
              <Route path="results/marks-entry" element={<MarksEntryPage />} />
              <Route path="results/process" element={<ResultProcessingPage />} />
              <Route path="results/view" element={<ViewResultsPage />} />
              <Route path="reports/print-center" element={<PrintCenterPage />} /> 
              <Route path="profile" element={<ProfilePage />} />
              <Route path="certificates/applications" element={<CertificateApplicationListPage />} />
              <Route path="inspection/list" element={<InspectionListPage />} />
              <Route path="inspection/create" element={<CreateInspectionPage />} />
              <Route path="inspection/edit/:id" element={<CreateInspectionPage />} />
              <Route path="notice/list" element={<NoticeListPage />} />
              <Route path="faq/list" element={<FaqListPage />} />
              <Route path="officials/list" element={<OfficialsListPage />} />
              <Route path="others/contact-submissions" element={<ContactSubmissionsPage />} />
              
              <Route path="accounts/income-expense/entry" element={<IncomeExpenseEntryPage />} />
              <Route path="accounts/income-expense/report" element={<IncomeExpenseReportPage />} />
              <Route path="accounts/banks/dashboard" element={<BankDashboardPage />} />
              <Route path="accounts/books/list" element={<BookListPage />} />
              <Route path="accounts/books/sales-history" element={<BookSalesHistoryPage />} />
              <Route path="accounts/categories/list" element={<CategoryListPage />} />
              
              {uniqueAdminNavItems.map(item => {
                const isImplemented = implementedAdminPaths.includes(item.path);
                const isParentOnly = parentOnlyAdminPaths.includes(item.path);
                if (!isImplemented && !isParentOnly) {
                  const routePath = item.path.startsWith('/') ? item.path.substring(1) : item.path;
                  return <Route key={`admin-${item.path}`} path={routePath} element={<PlaceholderPage />} />;
                }
                return null;
              })}
            </Route>

            {/* Teacher Portal Routes */}
            <Route path="/teacher/login" element={<TeacherLoginPage />} />
            <Route path="/teacher/signup" element={<TeacherSignupPage />} />
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="profile" element={<TeacherProfilePage />} />
              <Route path="exam-application/new" element={<TeacherNewExamApplicationPage />} />
              <Route path="exam-application/list" element={<TeacherMyExamApplicationsPage />} />
              {uniqueTeacherNavItems.map(item => {
                const isImplemented = implementedTeacherPaths.includes(item.path);
                const isParentOnly = parentOnlyTeacherPaths.includes(item.path);
                 if (!isImplemented && !isParentOnly && item.path !== '/teacher/dashboard' && item.path !== '/teacher/profile' && item.path !== '/teacher/exam-application/new' && item.path !== '/teacher/exam-application/list') { 
                  let routePath = item.path;
                  if (routePath.startsWith('/teacher/')) {
                    routePath = routePath.substring('/teacher/'.length);
                    if (routePath.startsWith('/')) {
                      routePath = routePath.substring(1);
                    }
                  }
                  if (routePath === '') return null;

                  return <Route key={`teacher-${item.path}`} path={routePath} element={<PlaceholderPage />} />;
                }
                return null;
              })}
            </Route>
            
          </Routes>
        </HashRouter>
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
