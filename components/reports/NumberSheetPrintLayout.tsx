
import React from 'react';
import { BoardProfile } from '../../types';
import Logo from '../../assets/Logo';

interface ExamineeInfo {
  roll_number: number;
  registration_number: number;
}

interface MadrasaInfo {
  madrasa_name_bn: string;
  markaz_name_bn: string;
  examinees: ExamineeInfo[];
}

interface NumberSheetData {
  marhala_id: string;
  marhala_name_bn: string;
  kitab_id: string;
  kitab_name_bn: string;
  full_marks: number;
  madrasas: MadrasaInfo[];
}

interface NumberSheetPrintLayoutProps {
  sheetData: NumberSheetData;
  boardProfile: BoardProfile;
  examinerName: string;
  examName: string;
}

const NumberSheetPrintLayout: React.FC<NumberSheetPrintLayoutProps> = ({ sheetData, boardProfile, examinerName, examName }) => {
  const { marhala_name_bn, kitab_name_bn, full_marks, madrasas } = sheetData;

  const examNameParts = examName.split(' ');
  const examYear = examNameParts.pop();
  const examTitle = examNameParts.join(' ');
  
  // Distribute examinees into 4 columns for display
  const distributeExaminees = (examinees: ExamineeInfo[]) => {
    const columns: ExamineeInfo[][] = [[], [], [], []];
    examinees.forEach((examinee, index) => {
        columns[index % 4].push(examinee);
    });
    const maxRows = Math.max(...columns.map(col => col.length));
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
        const row = [];
        for (let j = 0; j < 4; j++) {
            row.push(columns[j][i] || null);
        }
        rows.push(row);
    }
    return rows;
  };

  return (
    <>
      {madrasas.map((madrasa, madrasaIndex) => {
        const examineeTableRows = distributeExaminees(madrasa.examinees);
        return (
          <div key={`${sheetData.marhala_id}-${madrasa.madrasa_name_bn}-${madrasaIndex}`} className="print-layout-page" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
            <style>{`
              .print-layout-page {
                background: white;
                padding: 10mm;
                border: 1px solid #ccc;
                margin-bottom: 1rem;
                color: #000 !important;
              }
              .print-layout-page table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10pt;
              }
              .print-layout-page th, .print-layout-page td {
                border: 1px solid black;
                padding: 4px;
                text-align: center;
                vertical-align: middle;
                color: #000 !important;
              }
              .print-layout-page .header-arabic { font-family: 'Times New Roman', serif; font-size: 20pt; font-weight: bold; }
              .print-layout-page .header-bangla { font-size: 18pt; font-weight: bold; margin-top: -5px; }
              .print-layout-page .header-sub-bangla { font-size: 12pt; }
              .print-layout-page .header-address { font-size: 9pt; }
              .print-layout-page .report-title { border: 2px solid black; padding: 2px 10px; display: inline-block; font-size: 16pt; font-weight: bold; margin: 8px 0; }
              .print-layout-page .info-table-container { display: flex; justify-content: space-between; margin: 10px 0; font-size: 11pt; }
              .print-layout-page .info-table-container > div { flex: 1; }
              .print-layout-page .info-label { font-weight: normal; }
              .print-layout-page .info-value { font-weight: bold; }
              .print-layout-page .examinee-table th { background-color: #f0f0f0 !important; font-weight: normal; }
              .print-layout-page .examinee-table .roll-col { width: 15%; }
              .print-layout-page .examinee-table .marks-col { width: 8%; }
              .print-layout-page .examinee-table .check-col { width: 2%; }
              .print-layout-page .footer { display: flex; justify-content: space-between; margin-top: 30px; font-size: 10pt; }
              .print-layout-page .footer > div { text-align: center; }
              .print-layout-page .footer-line { border-top: 1px dotted black; padding-top: 4px; min-width: 150px; }
              .print-layout-page .notes { margin-top: 15px; font-size: 9pt; }

              @media print {
                @page { size: A4 portrait; margin: 8mm; }
                body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .print-layout-page { border: none !important; box-shadow: none !important; margin: 0; padding: 0; page-break-before: always; }
                .examinee-table th { background-color: #f0f0f0 !important; }
              }
            `}</style>
            
            <div className="text-center">
                <p className="header-arabic">وفاق المدارس الدينية بنغلاديش</p>
                <div className="flex items-center justify-center mt-1">
                    <div className="mx-4">
                        <Logo className="w-12 h-12" primaryColor="#000000"/>
                    </div>
                    <div>
                        <h1 className="header-bangla">{boardProfile.boardNameBn}</h1>
                        <h2 className="header-sub-bangla">[ বেফাকুল মাদারিসিদ্দিনিয়্যা বাংলাদেশ ]</h2>
                    </div>
                </div>
                <p className="header-address">{boardProfile.address.villageArea}, {boardProfile.address.upazila}, {boardProfile.address.district}</p>
                <p className="report-title">নম্বরপত্র</p>
                <p className="font-semibold text-lg">{examName}</p>
            </div>

            <div className="info-table-container">
                <div><span className="info-label">পরীক্ষক :</span> <span className="info-value">{examinerName}</span></div>
                <div><span className="info-label">মারহালা :</span> <span className="info-value">{marhala_name_bn}</span></div>
            </div>
             <div className="info-table-container">
                <div><span className="info-label">মারকায :</span> <span className="info-value">{madrasa.markaz_name_bn}</span></div>
                <div><span className="info-label">মাদরাসা :</span> <span className="info-value">{madrasa.madrasa_name_bn}</span></div>
            </div>
             <div className="info-table-container">
                <div><span className="info-label">বিষয় :</span> <span className="info-value">{kitab_name_bn}</span></div>
                <div><span className="info-label">পূর্ণ নম্বর :</span> <span className="info-value">{full_marks.toLocaleString('bn-BD')}</span></div>
            </div>

            <table className="examinee-table mt-4">
              <thead>
                <tr>
                  <th className="roll-col">রোল নং</th><th className="marks-col">প্রাপ্ত নম্বর</th><th className="check-col"></th>
                  <th className="roll-col">রোল নং</th><th className="marks-col">প্রাপ্ত নম্বর</th><th className="check-col"></th>
                  <th className="roll-col">রোল নং</th><th className="marks-col">প্রাপ্ত নম্বর</th><th className="check-col"></th>
                  <th className="roll-col">রোল নং</th><th className="marks-col">প্রাপ্ত নম্বর</th><th className="check-col"></th>
                </tr>
              </thead>
              <tbody>
                {examineeTableRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((examinee, colIndex) => (
                      examinee ? (
                        <React.Fragment key={`${rowIndex}-${colIndex}`}>
                          <td className="roll-col">{examinee.roll_number.toLocaleString('bn-BD')}</td>
                          <td className="marks-col"></td>
                          <td className="check-col"></td>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={`${rowIndex}-${colIndex}`}>
                          <td className="roll-col" style={{border: '1px solid white', visibility: 'hidden'}}></td>
                          <td className="marks-col" style={{border: '1px solid white', visibility: 'hidden'}}></td>
                          <td className="check-col" style={{border: '1px solid white', visibility: 'hidden'}}></td>
                        </React.Fragment>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="notes">
                <p>বি.দ্র. পাস নম্বর ৩৩%, দ্বিতীয় বিভাগ ৫০%, প্রথম বিভাগ ৬৫% এবং মুমতায ৮০%।</p>
                <p>মন্তব্য : ....................................................................................................................................................................................................................................</p>
            </div>
            
            <div className="footer">
                <div><p className="footer-line">পরীক্ষকের স্বাক্ষর ও তারিখ</p></div>
                <div><p className="footer-line">পরীক্ষা নিয়ন্ত্রক</p></div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default NumberSheetPrintLayout;
