import React from 'react';
import { RegistrationFeeCollection, BoardProfile, Exam } from '../../types';
import { numberToWordsBn } from '../../lib/utils';
import Logo from '../../assets/Logo'; // Make sure the path is correct

interface RegistrationFeeReceiptProps {
  collection: RegistrationFeeCollection;
  boardProfile: BoardProfile;
  allExams: Exam[];
}

const RegistrationFeeReceipt: React.FC<RegistrationFeeReceiptProps> = ({ collection, boardProfile, allExams }) => {
    
  return (
    <div className="receipt-container bg-white p-4" style={{ fontFamily: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif", width: '210mm', height: '148mm', border: '1px solid black', boxSizing: 'border-box' }}>
       <style>{`
        .receipt-container table { width: 100%; border-collapse: collapse; }
        .receipt-container th, .receipt-container td { border: 1px solid black !important; padding: 2px 4px; text-align: right; font-size: 10pt; line-height: 1.4; color: black !important; }
        .receipt-container th { font-weight: bold; background-color: #f0f0f0 !important; }
        .receipt-container .text-center { text-align: center; }
        .receipt-container .text-left { text-align: left; }
        .receipt-container .font-bold { font-weight: bold; }
        .receipt-container .text-lg { font-size: 14pt; }
        .receipt-container .text-sm { font-size: 9pt; }
        .receipt-container .arabic-text { font-family: 'Times New Roman', serif; direction: rtl; }
        @media print {
            body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            .receipt-container th { background-color: #f0f0f0 !important; }
        }
      `}</style>
      
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold">{boardProfile.boardNameBn}</h1>
        <p className="text-sm">{boardProfile.address.villageArea}, {boardProfile.address.district}</p>
        <p className="text-sm">ফোন: {boardProfile.primaryPhone}</p>
        <div className="inline-block border-2 border-black px-4 py-1 mt-2 text-lg font-bold">নিবন্ধন ফি</div>
      </div>

      {/* Info Box */}
      <div className="border border-black p-2 mb-2">
        <div className="grid grid-cols-2 gap-x-4 text-sm">
          <div className="flex justify-between"><span>রসিদ নং</span>: <span className="font-bold">{(collection.receipt_no || 0).toLocaleString('bn-BD')}</span></div>
          <div className="flex justify-between"><span>কোড নং</span>: <span className="font-bold">{(collection.madrasaCode || 0).toLocaleString('bn-BD')}</span></div>
          <div className="flex justify-between"><span>এন্ট্রি তারিখ</span>: <span className="font-bold">{new Date(collection.createdAt || collection.collectionDate).toLocaleDateString('bn-BD')}</span></div>
          <div className="flex justify-between"><span>প্রিন্টের তারিখ</span>: <span className="font-bold">{new Date().toLocaleDateString('bn-BD')}</span></div>
        </div>
      </div>
      
      {/* Madrasa Info */}
      <div className="text-sm mb-2">
        <p><span className="font-bold">মাদরাসা:</span> {collection.madrasaNameBn}</p>
        <p><span className="font-bold">ঠিকানা:</span> {/* Placeholder, needs full address from somewhere */}</p>
      </div>

      {/* Fees Table */}
      <table>
        <thead>
          <tr>
            <th className="text-center w-[10%]">ক্রঃ</th>
            <th className="w-[40%] text-left">মারহালা</th>
            <th className="w-[15%]">নির্ধারিত ফি</th>
            <th className="w-[15%]">পরীক্ষার্থী</th>
            <th className="w-[20%]">পরিমাণ</th>
          </tr>
        </thead>
        <tbody>
          {collection.marhalaStudentCounts.map((msc, index) => {
            const examDetails = allExams.find(e => e.id === collection.examId);
            const regularFee = collection.applyLateFee ? examDetails?.lateRegistrationFeeRegular || 0 : examDetails?.registrationFeeRegular || 0;
            const irregularFee = collection.applyLateFee ? examDetails?.lateRegistrationFeeIrregular || 0 : examDetails?.registrationFeeIrregular || 0;
            const totalStudents = (Number(msc.regularStudents) || 0) + (Number(msc.irregularStudents) || 0);
            return (
              <tr key={msc.marhalaId}>
                <td className="text-center">{(index + 1).toLocaleString('bn-BD')}</td>
                <td className="text-left">{msc.marhalaNameBn}</td>
                <td className="text-right">{`${regularFee.toLocaleString('bn-BD')}/-`}</td>
                <td className="text-center">{totalStudents.toLocaleString('bn-BD')}</td>
                <td className="text-right">{(msc.calculatedFee).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            )
          })}
          {/* Fill empty rows for consistent table height */}
          {Array.from({ length: Math.max(0, 5 - collection.marhalaStudentCounts.length) }).map((_, i) => (
            <tr key={`empty-${i}`}><td className="h-6">&nbsp;</td><td></td><td></td><td></td><td></td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={4} className="text-right">সর্বমোট:</th>
            <th className="text-right">{collection.totalCalculatedFee.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
          </tr>
        </tfoot>
      </table>

      {/* Amount in words */}
      <div className="text-sm mt-2">
        <p><span className="font-bold">কথায়:</span> {numberToWordsBn(collection.totalCalculatedFee)}</p>
      </div>
      
      {/* Signature */}
      <div className="mt-8 text-sm flex justify-between">
        <div className="text-center">
            <p className="border-t border-black px-6">গ্রহিতার স্বাক্ষর</p>
        </div>
        <div className="text-center">
             <p className="border-t border-black px-6">দাতার স্বাক্ষর</p>
        </div>
      </div>
    </div>
  );
};
export default RegistrationFeeReceipt;
