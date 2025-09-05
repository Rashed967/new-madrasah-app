import React from 'react';
import { BoardProfile } from '../../types';
import Logo from '../../assets/Logo';

interface ExamineePrintData {
  roll_number: number;
  registration_number: number;
  name_bn: string;
  madrasa_name_bn: string;
}

interface MarkazWiseExamineePrintLayoutProps {
  examinees: ExamineePrintData[];
  boardProfile: BoardProfile;
  examName: string;
  markazName: string;
}

const MarkazWiseExamineePrintLayout: React.FC<MarkazWiseExamineePrintLayoutProps> = ({ examinees, boardProfile, examName, markazName }) => {
  return (
    <div id="printable-content-area" className="printable-content print-layout p-2 bg-white" style={{ fontFamily: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" }}>
      <style>{`
        .print-layout table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .print-layout th, .print-layout td { border: 1px solid black; padding: 3px 5px; text-align: right; font-size: 10pt; vertical-align: middle; }
        .print-layout th { background-color: #f0f0f0; font-weight: bold; }
        .print-layout .header-arabic { font-family: 'Times New Roman', serif; font-size: 18pt; font-weight: bold; }
        .print-layout .header-bangla-main { font-size: 16pt; font-weight: bold; margin-top: -5px; }
        .print-layout .report-title-box { border: 1px solid black; padding: 4px 8px; display: inline-block; margin: 8px 0; font-size: 14pt; font-weight: bold;}
        .print-layout .filter-subtitle { font-size: 11pt; font-weight: bold; margin-bottom: 8px; background-color: #ffffcc; padding: 2px 4px; display: inline-block;}
        .print-layout .logo-container { display: flex; flex-direction: column; align-items: center; margin: 0 15px;}
      `}</style>
      
      <div className="text-center">
        <p className="header-arabic">وفاق المدارس الدينية بنغلاديش</p>
        <div className="flex items-center justify-center mt-1">
          <div className="logo-container">
            <Logo className="w-12 h-12" primaryColor="#000000"/>
          </div>
          <div>
            <h1 className="header-bangla-main">{boardProfile.boardNameBn}</h1>
          </div>
        </div>
      </div>

      <hr style={{ borderTop: '1px solid black', margin: '8px 0' }} />

      <div className="text-center my-2">
        <span className="report-title-box">মারকায ভিত্তিক পরীক্ষার্থী তালিকা</span>
      </div>
      <div className="text-center">
         <span className="filter-subtitle">পরীক্ষা: {examName} | মারকায: {markazName}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{width: '5%', textAlign: 'center'}}>ক্রমিক</th>
            <th style={{width: '10%', textAlign: 'center'}}>রোল নং</th>
            <th style={{width: '15%', textAlign: 'center'}}>রেজি. নং</th>
            <th style={{width: '35%'}}>পরীক্ষার্থীর নাম</th>
            <th style={{width: '35%'}}>মাদ্রাসার নাম</th>
          </tr>
        </thead>
        <tbody>
          {examinees.map((examinee, index) => (
            <tr key={index}>
              <td style={{textAlign: 'center'}}>{(index + 1).toLocaleString('bn-BD')}</td>
              <td style={{textAlign: 'center'}}>{examinee.roll_number.toLocaleString('bn-BD')}</td>
              <td style={{textAlign: 'center'}}>{examinee.registration_number.toLocaleString('bn-BD')}</td>
              <td>{examinee.name_bn}</td>
              <td>{examinee.madrasa_name_bn}</td>
            </tr>
          ))}
          {examinees.length === 0 && (
            <tr>
              <td colSpan={5} style={{textAlign: 'center', padding: '10px'}}>কোনো পরীক্ষার্থী পাওয়া যায়নি।</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MarkazWiseExamineePrintLayout;