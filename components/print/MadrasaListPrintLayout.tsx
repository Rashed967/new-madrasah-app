
import React from 'react';
import { Madrasa, BoardProfile } from '../../types'; // Updated path
import GeneralPrintHeader from './GeneralPrintHeader';

interface MadrasaListPrintLayoutProps {
  madrasas: Madrasa[];
  boardProfile: BoardProfile;
  filterDescription: string;
}

const MadrasaListPrintLayout: React.FC<MadrasaListPrintLayoutProps> = ({ madrasas, boardProfile, filterDescription }) => {
  return (
    <div id="printable-content-area" className="printable-content print-layout p-2 bg-white" style={{ fontFamily: " 'SolaimanLipi', sans-serif" }}>
      <style>{`
        .print-layout table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .print-layout th, .print-layout td { border: 1px solid black; padding: 5px 5px; text-align: center; font-size: 10pt; vertical-align: top; }
        .print-layout th { font-weight: bold; }
        .print-layout .header-arabic { font-family: 'Times New Roman', serif; font-size: 18pt; font-weight: bold; }
        .print-layout .header-english { font-size: 10pt; }
        .print-layout .header-bangla-main { font-size: 16pt; font-weight: bold; margin-top: -5px; }
        .print-layout .header-bangla-sub { font-size: 11pt; font-weight: medium; }
        .print-layout .header-address, .print-layout .header-contact { font-size: 9pt; }
        .print-layout .report-title-box { border: 1px solid black; padding: 4px 8px; display: inline-block; margin: 8px 0; font-size: 14pt; font-weight: bold;}
        .print-layout .filter-subtitle { font-size: 11pt; font-weight: bold; margin-bottom: 8px; background-color: #ffffcc; padding: 2px 4px; display: inline-block;}
        .print-layout .logo-container { display: flex; flex-direction: column; align-items: center; margin-left: 15px; margin-right: 15px;}
        .print-layout .logo-year { font-size: 7pt; line-height: 1; }
      `}</style>
      
      <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Header Section */}
      <GeneralPrintHeader boardProfile={boardProfile} />

      {/* Title Section */}
      <div className="text-center mb-2">
        <div className="inline-block border-2 border-black px-4 py-2 mb-4">
          <div className="font-bold">মাদরাসা তালিকা</div>
        </div>
        <div className="text-sm">{filterDescription}</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border-2 border-black p-2 text-center font-bold">ক্রমিক</th>
              <th className="border-2 border-black p-2 text-center font-bold">কোড</th>
              <th className="border-2 border-black p-2 text-center font-bold">মাদরাসার নাম</th>
              <th className="border-2 border-black p-2 text-center font-bold">ঠিকানা</th>
              <th className="border-2 border-black p-2 text-center font-bold">মুহতামিম</th>
              <th className="border-2 border-black p-2 text-center font-bold">মোবাইল</th>
            </tr>
          </thead>
          <tbody>
          {madrasas.map((madrasa, index) => (

            <tr key={madrasa.id}>
              <td className="border-2 border-black p-2 text-center">{(index + 1).toLocaleString('bn-BD')}</td>
              <td className="border-2 border-black p-2 text-center">{madrasa.madrasaCode.toLocaleString('bn-BD')}</td>
              <td className="border-2 border-black p-2">{madrasa.nameBn}</td>
              <td className="border-2 border-black p-2">{`${madrasa.address.village}, ${madrasa.address.upazila}, ${madrasa.address.district}`}</td>
              <td className="border-2 border-black p-2">{madrasa.muhtamim.name}</td>
              <td className="border-2 border-black p-2">{madrasa.mobile1}</td>
            </tr>
            ))}
          {madrasas.length === 0 && (
            <tr>
              <td colSpan={6} style={{textAlign: 'center', padding: '10px'}}>কোনো মাদরাসা পাওয়া যায়নি।</td>
            </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>

    </div>
  );
};

export default MadrasaListPrintLayout;
