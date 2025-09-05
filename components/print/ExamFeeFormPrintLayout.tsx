import React from 'react';
import { BoardProfile, MadrasaDbRow, MarhalaGroup } from '../../types';
import Logo from '../../assets/Logo';

interface ExamFeeFormPrintLayoutProps {
  marhalaGroup: MarhalaGroup;
  boardProfile: BoardProfile;
  examName: string;
  madrasaInfo: MadrasaDbRow;
}

export const ExamFeeFormPrintLayout: React.FC<ExamFeeFormPrintLayoutProps> = ({ marhalaGroup, boardProfile, examName, madrasaInfo }) => {
  return (
     <div className="min-h-screen bg-white p-8 print:p-4 text-black" style={{ fontFamily: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" }}>
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="flex justify-start items-start gap-4 mb-4">
          {/* Logo */}
          <div className="w-24 h-24 flex-shrink-0 mt-2">
            <div className="w-full h-full border-2 border-black rounded-lg flex items-center justify-center bg-white p-1">
              <img src={boardProfile.logoUrl || "https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg"} alt="লোগো" className="object-contain w-full h-full" />
            </div>
          </div>
          
          {/* Header Text */}
          <div className="flex-1 text-center">
            <div className="text-xl font-bold mb-2">{boardProfile.boardNameBn}</div>
            <div className="text-sm mb-1">{boardProfile.address.villageArea}, {boardProfile.address.upazila}, {boardProfile.address.district}</div>
            <div className="text-lg font-semibold mb-2">পরীক্ষা ফি জমা ফরম</div>
            <div className="text-lg font-bold border-b-2 border-black inline-block px-4 py-1">
              {examName}
            </div>
          </div>
        </div>
      </div>

      {/* Madrasa Details */}
      <div className="mb-6 text-sm">
        <div className="mb-1">
          <span className="font-bold">কোড নং:</span> {madrasaInfo.madrasa_code.toLocaleString('bn-BD')}
        </div>
        <div className="mb-1">
          <span className="font-bold">মাদরাসা:</span> {madrasaInfo.name_bn}
        </div>
         <div className="mb-1 arabic-text">
          <span className="font-bold text-base">:المدرسة</span> {madrasaInfo.name_ar}
        </div>
        <div className="mb-2">
          <span className="font-bold">মারকায কোড:</span> {marhalaGroup.markaz_code.toLocaleString('bn-BD')}
        </div>
         <div className="mb-4">
          <span className="font-bold">মারহালা:</span> {marhalaGroup.marhala_name_bn}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr>
              <th className="border-2 border-black p-1 text-center font-bold">ক্র.</th>
              <th className="border-2 border-black p-1 text-center font-bold">নিবন্ধন নং</th>
              <th className="border-2 border-black p-1 text-center font-bold">রোল নং</th>
              <th className="border-2 border-black p-1 text-center font-bold">পরীক্ষার্থীর নাম</th>
              <th className="border-2 border-black p-1 text-center font-bold arabic-text">اسم পরীক্ষार्थी</th>
              <th className="border-2 border-black p-1 text-center font-bold">পিতার নাম</th>
              <th className="border-2 border-black p-1 text-center font-bold arabic-text">اسم الأب</th>
              <th className="border-2 border-black p-1 text-center font-bold">জন্ম তারিখ</th>
              <th className="border-2 border-black p-1 text-center font-bold">পরীক্ষা ফি</th>
            </tr>
          </thead>
          <tbody>
            {marhalaGroup.examinees.map((examinee, index) => (
                <tr key={examinee.registration_number}>
                    <td className="border-2 border-black p-1 text-center h-6">{(index + 1).toLocaleString('bn-BD')}</td>
                    <td className="border-2 border-black p-1 text-center">{examinee.registration_number.toLocaleString('bn-BD')}</td>
                    <td className="border-2 border-black p-1 text-center"></td>
                    <td className="border-2 border-black p-1">{examinee.name_bn}</td>
                    <td className="border-2 border-black p-1 arabic-text">{examinee.name_ar}</td>
                    <td className="border-2 border-black p-1">{examinee.father_name_bn}</td>
                    <td className="border-2 border-black p-1 arabic-text">{examinee.father_name_ar}</td>
                    <td className="border-2 border-black p-1 text-center">{new Date(examinee.date_of_birth).toLocaleDateString('bn-BD')}</td>
                    <td className="border-2 border-black p-1 text-center"></td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="text-sm mt-8">
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
