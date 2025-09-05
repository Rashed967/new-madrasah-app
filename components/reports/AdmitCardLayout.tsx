
import React from 'react';
import { Examinee, Exam, Madrasa, Markaz, Kitab, Marhala as MarhalaType } from '../../types';
import Logo from '../../assets/Logo'; // Assuming Logo.tsx is in assets folder
import { APP_TITLE_BN } from '../../constants';
// import { Button } from '../ui/Button'; // Commented out as per new design
import { mockMadrasas } from '../../data/mockMadrasas';
import { mockMarhalas } from '../../data/mockMarhalas'; // Added import

// Helper function (ensure mockMadrasas is imported or passed if needed elsewhere)
const getLocalMadrasaDetails = (id: string): Madrasa | undefined => {
  return mockMadrasas.find(m => m.id === id);
};


interface AdmitCardLayoutProps {
  examinee: Examinee;
  exam: Exam;
  madrasa: Madrasa;
  markaz?: Markaz;
  subjects: Kitab[]; // Kept for prop consistency, but not displayed as per image
  marhalaDisplayName?: string;
}

const AdmitCardLayout: React.FC<AdmitCardLayoutProps> = ({
  examinee,
  exam,
  madrasa,
  markaz,
  subjects, // Kept for prop consistency
  marhalaDisplayName,
}) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMarhalaName = (marhalaId: string) => {
    if (marhalaDisplayName) return marhalaDisplayName;
    // Fallback to a local mock if absolutely necessary, but marhalaDisplayName should be preferred
    const marhalaData = mockMarhalas.find(m => m.id === marhalaId); 
    return marhalaData ? `${marhalaData.nameBn} (${marhalaData.type === 'boys' ? 'বালক' : 'বালিকা'})` : marhalaId;
  }
  
  const examNameParts = exam.name.split(' ');
  const examYear = examNameParts.pop(); // Assuming year is the last part
  const examTitle = examNameParts.join(' ');


  return (
    <div className="admit-card-container bg-white p-4 border border-black rounded shadow-lg mx-auto print:shadow-none print:border-gray-700 print:p-2" style={{ width: '210mm', minHeight: '130mm', boxSizing: 'border-box'}}>
       <style>
        {`
          .admit-card-container {
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            color: #000000; /* Ensure all text is black by default */
          }
          .admit-card-container p, 
          .admit-card-container h1, 
          .admit-card-container h2,
          .admit-card-container span,
          .admit-card-container div,
          .admit-card-container td,
          .admit-card-container th {
            color: #000000 !important; /* Force black for all text elements */
          }
          .arabic-text {
            font-family: 'Times New Roman', serif; /* Or a specific Arabic font */
            font-size: 1.2em; /* Adjust as needed */
            direction: rtl;
          }
          .header-logo-year {
            font-size: 0.5rem; /* Tiny text for year near logo */
            color: #000000 !important;
            text-align: center;
            line-height: 1;
          }
          .info-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 0.8rem; /* Smaller font for tables */
          }
          .info-table td, .info-table th {
            border: 1px solid black;
            padding: 3px 5px; /* Increased padding */
            text-align: right; /* Right align for Bengali */
            color: #000000 !important;
          }
          .info-table th {
            font-weight: normal;
            background-color: #f0f0f0; /* Light gray for header cells if desired */
          }
          .details-grid {
            margin-top: 0.5rem;
            font-size: 0.85rem; /* Base font for details */
          }
          .details-grid > div {
            display: flex;
          }
          .details-grid > div > span:first-child {
            width: 90px; /* Label width */
            font-weight: 500;
          }
           .central-badge-bg {
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150px; 
            height: 150px; 
            z-index: 0;
          }
          .probashpotro-text {
            font-size: 1.1rem; 
            font-weight: bold;
            color: #006A4E !important; 
            border: 2px solid #006A4E;
            padding: 2px 8px;
            border-radius: 5px;
            background-color: #E0F2F1; 
            display: inline-block;
            position: relative;
            z-index: 1;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .admit-card-container {
              page-break-inside: avoid !important;
              border: 1px solid #333 !important; 
              box-shadow: none !important;
              width: 100% !important; 
              height: auto;
              padding: 10px !important;
              font-size: 10pt !important;
              line-height: 1.3 !important;
            }
             .probashpotro-text {
                background-color: #E0F2F1 !important; 
             }
             .header-logo-year { font-size: 6pt !important; }
             .info-table { font-size: 9pt !important; }
             .info-table td, .info-table th { padding: 1.5px 3px !important; border: 1px solid black !important; color: #000000 !important;}
             .details-grid { font-size: 9.5pt !important; margin-top: 0.3rem !important; }
             .details-grid > div > span:first-child { width: 100px !important; }
             .details-grid > div, .details-grid span { color: #000000 !important; }

          }
        `}
      </style>

      {/* Header Section */}
      <div className="text-center mb-3 print:mb-1">
        <p className="arabic-text text-2xl print:text-xl font-semibold">وفاق المدارس الدينية بنغلاديش</p>
        <div className="flex items-center justify-center mt-1 print:mt-0.5">
          <div className="flex flex-col items-center">
            <Logo className="w-12 h-12 print:w-10 print:h-10" primaryColor="#000000"/>
            <p className="header-logo-year">১৪৩৮ হি.</p>
            <p className="header-logo-year">২০১৬ ঈ.</p>
          </div>
          <div className="ml-3">
            <h1 className="text-xl print:text-lg font-bold text-black">{APP_TITLE_BN}</h1>
            <h2 className="text-lg print:text-base font-medium text-black">বেফাকুল মাদারিসিদ্দিনিয়্যা বাংলাদেশ</h2>
          </div>
        </div>
        <p className="text-sm print:text-xs font-medium mt-1 print:mt-0.5">পরীক্ষা নিয়ন্ত্রণ বিভাগ</p>
        <p className="text-md print:text-sm font-semibold">{exam.name}</p>
      </div>

      {/* Central Badge and Info Tables */}
      <div className="relative mb-3 print:mb-1">
        <div className="central-badge-bg"></div>
        <div className="text-center my-2 print:my-1">
          <span className="probashpotro-text">প্রবেশপত্র</span>
        </div>
        
        <div className="flex justify-between items-start text-sm print:text-xs">
          <table className="info-table w-[48%]"> {/* Adjusted width slightly */}
            <tbody>
              <tr>
                <th className="w-[40%] text-black">নিবন্ধন নং</th>
                <td className="text-black">{examinee.registrationNumber.toLocaleString('bn-BD')}</td>
              </tr>
              <tr>
                <th className="text-black">রোল নং</th>
                <td className="font-bold text-black">{examinee.rollNumber != null ? examinee.rollNumber.toLocaleString('bn-BD') : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
          <table className="info-table w-[48%]"> {/* Adjusted width slightly */}
            <tbody>
              <tr>
                <th className="w-[40%] text-black">মারহালা</th>
                <td className="text-black">{getMarhalaName(examinee.marhalaId).split(' (')[0]}</td> 
              </tr>
              <tr>
                <th className="text-black">জন্ম তারিখ</th>
                <td className="text-black">{formatDate(examinee.dateOfBirth)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Examinee Details */}
      <div className="details-grid text-sm print:text-xs mt-2 print:mt-1">
        <div><span>পরীক্ষার্থীর নাম</span>: <span className="font-semibold">{examinee.nameBn}</span></div>
        <div><span>পিতার নাম</span>: <span>{examinee.fatherNameBn}</span></div>
        <div><span>মাদরাসা</span>: <span>{madrasa.nameBn} - {madrasa.id}</span></div>
        <div><span>মারকায</span>: <span>{markaz ? `${markaz.nameBn} - ${getLocalMadrasaDetails(markaz.hostMadrasaId)?.id || ''}` : 'মারকাযের তথ্য নেই'}</span></div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-6 print:mt-4 text-xs print:text-[8pt]">
        <div className="text-center">
          <p className="border-t border-black pt-0.5 px-4">মুহতামিমের স্বাক্ষর ও তারিখ</p>
          <p className="mt-0.5">তারিখ: ১০/০৩/২০২৫ ইং</p>
        </div>
        <div className="text-center">
          <p className="border-t border-black pt-0.5 px-4">পরীক্ষা নিয়ন্ত্রক</p>
          <p className="mt-0.5">মাওলানা ফখরুল উমর ফারুক</p>
        </div>
      </div>
    </div>
  );
};

export default AdmitCardLayout;
