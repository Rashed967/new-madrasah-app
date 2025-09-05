import React from 'react';
import { BoardProfile, MadrasaDbRow, MarhalaGroup } from '../../types';

interface ExamFeeFormPrintLayoutProps {
  marhalaGroup: MarhalaGroup;
  boardProfile: BoardProfile;
  examName: string;
  madrasaInfo: MadrasaDbRow;
}

export const ExamFeeFormPrintLayout: React.FC<ExamFeeFormPrintLayoutProps> = ({ marhalaGroup, boardProfile, examName, madrasaInfo }) => {
  return (
    <div className="print-layout p-4 bg-white" style={{ fontFamily: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" }}>
       <style>{`
        .print-layout { color: black; }
        .print-layout table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        .print-layout th, .print-layout td { border: 1px solid black !important; padding: 2px 4px; vertical-align: middle; }
        .print-layout th { font-weight: bold; text-align: center; }
        .print-layout .arabic-text { font-family: 'Times New Roman', serif; direction: rtl; }
        @media print {
          body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; background-color: #fff !important; }
          .print-layout { color: black !important; }
          .print-layout th, .print-layout td { border: 1px solid black !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="text-center mb-4">
        <div className="flex justify-start items-start gap-4 mb-4">
          <div className="w-24 h-24 flex-shrink-0 mt-2">
            <div className="w-full h-full border-2 border-black rounded-lg flex items-center justify-center bg-white">
                <img src={boardProfile.logoUrl || 'https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg'} alt="লোগো" className="w-full h-full object-contain p-1" />
            </div>
          </div>
          
          <div className="flex-1 text-center">
            <div className="text-xl font-bold mb-2">{boardProfile.boardNameBn}</div>
            <div className="text-sm mb-1">{boardProfile.address.villageArea}, {boardProfile.address.upazila}, {boardProfile.address.district}</div>
            <div className="text-xs mb-2">পরীক্ষার্থীদের ফি জমা ফরম</div>
            <div className="text-lg font-bold border-b-2 border-black inline-block px-4 py-1">
              {examName}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <div className="mb-1"><span className="font-bold">কোড নং:</span> {madrasaInfo.madrasa_code.toLocaleString('bn-BD')}</div>
        <div className="mb-1"><span className="font-bold">মাদরাসা:</span> {madrasaInfo.name_bn}</div>
        <div className="mb-1 arabic-text"><span className="font-bold">:المدرسة</span> {madrasaInfo.name_ar}</div>
        <div className="mb-2"><span className="font-bold">মারকায কোড:</span> {marhalaGroup.markaz_code.toLocaleString('bn-BD')}</div>
        <div className="mb-2"><span className="font-bold">মারহালা:</span> {marhalaGroup.marhala_name_bn}</div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr>
              <th className="p-1 text-center">ক্র.</th>
              <th className="p-1 text-center">নিবন্ধন নং</th>
              <th className="p-1 text-center">রোল নং</th>
              <th className="p-1 text-center">পরীক্ষার্থীর নাম</th>
              <th className="p-1 text-center arabic-text">اسم পরীক্ষार्थी</th>
              <th className="p-1 text-center">পিতার নাম</th>
              <th className="p-1 text-center arabic-text">اسم الأب</th>
              <th className="p-1 text-center">জন্ম তারিখ</th>
              <th className="p-1 text-center">পরীক্ষা ফি</th>
            </tr>
          </thead>
          <tbody>
            {marhalaGroup.examinees.map((examinee, index) => (
              <tr key={examinee.registration_number}>
                <td className="p-1 text-center">{(index + 1).toLocaleString('bn-BD')}</td>
                <td className="p-1 text-center">{examinee.registration_number.toLocaleString('bn-BD')}</td>
                <td className="p-1 text-center"></td>
                <td className="p-1">{examinee.name_bn}</td>
                <td className="p-1 arabic-text">{examinee.name_ar}</td>
                <td className="p-1">{examinee.father_name_bn}</td>
                <td className="p-1 arabic-text">{examinee.father_name_ar}</td>
                <td className="p-1 text-center">{new Date(examinee.date_of_birth).toLocaleDateString('bn-BD')}</td>
                <td className="p-1 text-center"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm">
        <div className="mb-4">
          <span className="font-bold">মোট পরীক্ষার্থীর সংখ্যা:</span> ..................... 
          <span className="font-bold ml-8">মোট টাকা (অঙ্কে)</span> ........................ 
          <span className="font-bold ml-8">(কথায়)</span>....................................................
        </div>
        <div className="mb-2">
          <span className="font-bold">বিঃ দ্রঃ</span>
        </div>
        <div className="text-xs space-y-1">
          <div>১। ফরমে পরীক্ষার্থীর কোনো তথ্য অসম্পূর্ণ অথবা ত্রুটি পরিলক্ষিত হলে তা সংশোধন করুন।</div>
          <div>২। এ ফরমের ফটোকপি মাদরাসার নথিতে সংরক্ষণ করুন।</div>
        </div>
      </div>
    </div>
  );
};
