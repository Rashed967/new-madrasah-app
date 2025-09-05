
// import React, { useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card } from '../../components/ui/Card';
// import { Button } from '../../components/ui/Button';
// import { Input } from '../../components/ui/Input';
// import { Select } from '../../components/ui/Select';
// import { Textarea } from '../../components/ui/Textarea';
// import { Modal } from '../../components/ui/Modal';
// import { AlertDialog } from '../../components/ui/AlertDialog';
// import { mockExaminerHallGuardApplications } from '../../data/mockExaminerHallGuardApplications';
// import { mockMadrasas } from '../../data/mockMadrasas';
// import { ExaminerHallGuardApplication, ApplicantType, ApplicationRole, SelectOption } from '../../types';
// import { APPLICANT_TYPES, APPLICATION_ROLES } from '../../constants';
// import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '../../components/ui/Icon';
// import { useToast } from '../../contexts/ToastContext';

// // Helper functions for labels and formatting
// const getApplicantTypeLabel = (type: ApplicantType): string => {
//   const option = APPLICANT_TYPES.find(opt => opt.value === type);
//   return option ? option.label : 'অজানা';
// };

// const getApplicationRoleLabel = (role: ApplicationRole): string => {
//   const option = APPLICATION_ROLES.find(opt => opt.value === role);
//   return option ? option.label : 'অজানা';
// };

// const getMadrasaNameById = (id: string): string => {
//   const madrasa = mockMadrasas.find(m => m.id === id);
//   return madrasa ? madrasa.nameBn : 'অজানা মাদরাসা';
// };

// const formatDate = (dateString?: string): string => {
//   if (!dateString) return 'N/A';
//   return new Date(dateString).toLocaleDateString('bn-BD', {
//     day: 'numeric', month: 'long', year: 'numeric'
//   });
// };

// const ExaminerListPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { addToast } = useToast();
  
//   // State for applications, search, and pagination
//   const [applications, setApplications] = useState<ExaminerHallGuardApplication[]>(mockExaminerHallGuardApplications);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // State for Modals and Alerts
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [selectedApplicationForView, setSelectedApplicationForView] = useState<ExaminerHallGuardApplication | null>(null);

//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingApplication, setEditingApplication] = useState<ExaminerHallGuardApplication | null>(null);
//   const [editForm, setEditForm] = useState<Partial<ExaminerHallGuardApplication>>({});
//   const [editErrors, setEditErrors] = useState<any>({});

//   const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
//   const [applicationToDelete, setApplicationToDelete] = useState<ExaminerHallGuardApplication | null>(null);

//   const madrasaOptions: SelectOption[] = useMemo(() => 
//     mockMadrasas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.address.district})` })), 
//   []);

//   // Filtering and Pagination Logic
//   const filteredApplications = useMemo(() => {
//     return applications.filter(app =>
//       app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       app.mobile.includes(searchTerm) ||
//       getMadrasaNameById(app.madrasaId).toLowerCase().includes(searchTerm.toLowerCase())
//     ).sort((a,b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()); // Sort by most recent
//   }, [applications, searchTerm]);

//   const paginatedApplications = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
//   }, [filteredApplications, currentPage, itemsPerPage]);

//   const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

//   // Event Handlers for CRUD operations
//   const handleViewClick = (app: ExaminerHallGuardApplication) => {
//     setSelectedApplicationForView(app);
//     setIsViewModalOpen(true);
//   };

//   const handleEditClick = (app: ExaminerHallGuardApplication) => {
//     setEditingApplication(app);
//     setEditForm({ ...app });
//     setEditErrors({});
//     setIsEditModalOpen(true);
//   };

//   const validateEditForm = (): boolean => {
//     const newErrors: any = {};
//     if (!editForm.applicantType) newErrors.applicantType = 'আবেদনকারীর ধরণ আবশ্যক';
//     if (!editForm.name?.trim()) newErrors.name = 'নাম আবশ্যক';
//     if (!editForm.mobile?.trim()) newErrors.mobile = 'মোবাইল নম্বর আবশ্যক';
//     else if (!/^(01[3-9]\d{8})$/.test(editForm.mobile.trim())) newErrors.mobile = 'সঠিক মোবাইল নম্বর দিন';
//     if (!editForm.madrasaId) newErrors.madrasaId = 'মাদরাসা নির্বাচন করুন';
//     if (!editForm.applicationRole) newErrors.applicationRole = 'আবেদনের ধরন আবশ্যক';
//     if (!editForm.educationalQualification?.trim()) newErrors.educationalQualification = 'শিক্ষাগত যোগ্যতা আবশ্যক';
//     if (!editForm.kitabiQualification || editForm.kitabiQualification.length === 0) newErrors.kitabiQualification = 'অন্তত একটি কিতাবী যোগ্যতা নির্বাচন করুন';
//     setEditErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSaveChanges = () => {
//     if (editingApplication && validateEditForm()) {
//       const updatedApplicationData = { ...editingApplication, ...editForm } as ExaminerHallGuardApplication;
      
//       const updatedApplicationsList = applications.map(app =>
//         app.id === editingApplication.id ? updatedApplicationData : app
//       );
//       setApplications(updatedApplicationsList);
      
//       const mockIndex = mockExaminerHallGuardApplications.findIndex(app => app.id === editingApplication.id);
//       if (mockIndex !== -1) {
//         mockExaminerHallGuardApplications[mockIndex] = updatedApplicationData;
//       }

//       setIsEditModalOpen(false);
//       addToast('আবেদন সফলভাবে আপডেট করা হয়েছে!', 'success');
//     } else {
//       addToast('ফর্মটিতে কিছু ত্রুটি রয়েছে। অনুগ্রহ করে சரி করুন।', 'error');
//     }
//   };

//   const handleDeleteClick = (app: ExaminerHallGuardApplication) => {
//     setApplicationToDelete(app);
//     setIsDeleteAlertOpen(true);
//   };

//   const confirmDelete = () => {
//     if (applicationToDelete) {
//       const updatedApplicationsList = applications.filter(app => app.id !== applicationToDelete.id);
//       setApplications(updatedApplicationsList);

//       const mockIndex = mockExaminerHallGuardApplications.findIndex(app => app.id === applicationToDelete.id);
//       if (mockIndex !== -1) {
//         mockExaminerHallGuardApplications.splice(mockIndex, 1);
//       }
      
//       setIsDeleteAlertOpen(false);
//       addToast(`"${applicationToDelete.name}" এর আবেদন সফলভাবে মুছে ফেলা হয়েছে।`, 'success');
//     }
//   };
  
//   const handleEditFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEditForm(prev => ({ ...prev, [name]: value }));
//   };

//   const ViewDetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
//     <div className="py-1">
//       <p className="text-sm text-gray-500">{label}</p>
//       <p className="text-md font-medium text-gray-800 break-words">{value || 'N/A'}</p>
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-3xl font-semibold text-gray-800">পরীক্ষক ও হলগার্ডদের আবেদন তালিকা</h2>
//         <Button onClick={() => navigate('/examiner/registration')} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
//           নতুন আবেদন করুন
//         </Button>
//       </div>

//       <Card>
//         <div className="p-4">
//           <Input 
//             placeholder="অনুসন্ধান করুন (নাম, আইডি, মোবাইল, মাদরাসা)..."
//             value={searchTerm}
//             onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
//             wrapperClassName="mb-0"
//           />
//         </div>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">আইডি</th>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">আবেদনকারীর নাম</th>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">মোবাইল</th>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">মাদরাসা</th>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">আবেদনের ধরন</th>
//                 <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">আবেদনের তারিখ</th>
//                 <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">কার্যক্রম</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {paginatedApplications.map((app) => (
//                 <tr key={app.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{app.id}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{app.name}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{app.mobile}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{getMadrasaNameById(app.madrasaId)}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{getApplicationRoleLabel(app.applicationRole)}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(app.registrationDate)}</td>
//                   <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
//                     <button onClick={() => handleViewClick(app)} className="text-emerald-600 hover:text-emerald-800 p-1" title="বিস্তারিত দেখুন">
//                       <EyeIcon className="w-5 h-5"/>
//                     </button>
//                     <button onClick={() => handleEditClick(app)} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা করুন">
//                       <PencilSquareIcon className="w-5 h-5"/>
//                     </button>
//                     <button onClick={() => handleDeleteClick(app)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="মুছে ফেলুন">
//                       <TrashIcon className="w-5 h-5"/>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {paginatedApplications.length === 0 && (
//                 <tr>
//                   <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
//                     কোনো আবেদন খুঁজে পাওয়া যায়নি।
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         {totalPages > 1 && (
//           <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
//             <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} size="sm" variant="secondary">পূর্ববর্তী</Button>
//             <span className="text-sm text-gray-700">পৃষ্ঠা {currentPage} এর {totalPages}</span>
//             <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} size="sm" variant="secondary">পরবর্তী</Button>
//           </div>
//         )}
//       </Card>

//       {/* View Modal */}
//       {isViewModalOpen && selectedApplicationForView && (
//         <Modal 
//             isOpen={isViewModalOpen} 
//             onClose={() => setIsViewModalOpen(false)} 
//             title={`আবেদনকারীর বিবরণ: ${selectedApplicationForView.name}`}
//             size="xl"
//         >
//           <div className="space-y-3">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
//               <ViewDetailItem label="আইডি" value={selectedApplicationForView.id} />
//               <ViewDetailItem label="আবেদনকারীর ধরণ" value={getApplicantTypeLabel(selectedApplicationForView.applicantType)} />
//               <ViewDetailItem label="আবেদনকারীর নাম" value={selectedApplicationForView.name} />
//               <ViewDetailItem label="মোবাইল নম্বর" value={selectedApplicationForView.mobile} />
//               <ViewDetailItem label="সংশ্লিষ্ট মাদরাসা" value={getMadrasaNameById(selectedApplicationForView.madrasaId)} />
//               <ViewDetailItem label="আবেদনের ধরন" value={getApplicationRoleLabel(selectedApplicationForView.applicationRole)} />
//               <ViewDetailItem label="আবেদনের তারিখ" value={formatDate(selectedApplicationForView.registrationDate)} />
//             </div>
//             <ViewDetailItem label="শিক্ষাগত যোগ্যতা" value={<pre className="whitespace-pre-wrap font-sans">{selectedApplicationForView.educationalQualification}</pre>} />
//             <ViewDetailItem label="কিতাবী যোগ্যতা" value={<pre className="whitespace-pre-wrap font-sans">{selectedApplicationForView.kitabiQualification}</pre>} />
//           </div>
//         </Modal>
//       )}

//       {/* Edit Modal */}
//       {isEditModalOpen && editingApplication && (
//         <Modal
//           isOpen={isEditModalOpen}
//           onClose={() => setIsEditModalOpen(false)}
//           title={`আবেদন সম্পাদনা: ${editingApplication.name}`}
//           size="xl"
//           footer={
//             <>
//               <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>বাতিল</Button>
//               <Button variant="primary" onClick={handleSaveChanges}>পরিবর্তন সংরক্ষণ করুন</Button>
//             </>
//           }
//         >
//           <form className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
//                  <Select
//                     label="আবেদনকারীর ধরণ"
//                     name="applicantType"
//                     value={editForm.applicantType || ''}
//                     onChange={handleEditFormInputChange}
//                     options={APPLICANT_TYPES}
//                     error={editErrors.applicantType}
//                     required
//                 />
//                 <Select
//                     label="আবেদনের ধরন"
//                     name="applicationRole"
//                     value={editForm.applicationRole || ''}
//                     onChange={handleEditFormInputChange}
//                     options={APPLICATION_ROLES}
//                     error={editErrors.applicationRole}
//                     required
//                 />
//             </div>
//             <Input
//                 label="আবেদনকারীর নাম"
//                 name="name"
//                 value={editForm.name || ''}
//                 onChange={handleEditFormInputChange}
//                 error={editErrors.name}
//                 required
//             />
//             <Input
//                 label="মোবাইল নম্বর"
//                 name="mobile"
//                 type="tel"
//                 value={editForm.mobile || ''}
//                 onChange={handleEditFormInputChange}
//                 error={editErrors.mobile}
//                 required
//             />
//             <Select
//                 label="সংশ্লিষ্ট মাদরাসা"
//                 name="madrasaId"
//                 value={editForm.madrasaId || ''}
//                 onChange={handleEditFormInputChange}
//                 options={madrasaOptions}
//                 error={editErrors.madrasaId}
//                 required
//                 placeholderOption="মাদরাসা নির্বাচন করুন"
//             />
//             <Textarea
//                 label="শিক্ষাগত যোগ্যতা"
//                 name="educationalQualification"
//                 value={editForm.educationalQualification || ''}
//                 onChange={handleEditFormInputChange}
//                 error={editErrors.educationalQualification}
//                 required
//                 rows={3}
//             />
//             <Textarea
//                 label="কিতাবী যোগ্যতা"
//                 name="kitabiQualification"
//                 value={editForm.kitabiQualification || ''}
//                 onChange={handleEditFormInputChange}
//                 error={editErrors.kitabiQualification}
//                 required
//                 rows={3}
//             />
//           </form>
//         </Modal>
//       )}

//       {/* Delete Alert */}
//       {isDeleteAlertOpen && applicationToDelete && (
//         <AlertDialog
//           isOpen={isDeleteAlertOpen}
//           onClose={() => setIsDeleteAlertOpen(false)}
//           onConfirm={confirmDelete}
//           title="নিশ্চিতকরণ"
//           description={`আপনি কি "${applicationToDelete.name}" এর আবেদনটি মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।`}
//           confirmButtonText="হ্যাঁ, মুছুন"
//           cancelButtonText="না, থাক"
//         />
//       )}
//     </div>
//   );
// };

// export default ExaminerListPage;

// This page will be replaced by PersonnelListPage.tsx (or similar)
import PlaceholderPage from '../PlaceholderPage';
export default PlaceholderPage;
