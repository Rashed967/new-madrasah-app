
import React from 'react';
import { IndividualResult } from '../../types';
import Logo from '../../assets/Logo';
import { APP_TITLE_BN } from '../../constants';

interface ResultSheetLayoutProps {
  result: IndividualResult;
}

const ResultSheetLayout: React.FC<ResultSheetLayoutProps> = ({ result }) => {
  const { examinee_details, madrasa_details, marhala_details, exam_details, result_summary, subject_marks } = result;

  return (
    <div className="result-sheet bg-white p-6 border rounded-lg max-w-4xl mx-auto">
       <style>{`
          .result-sheet .header-arabic { font-family: 'Times New Roman', serif; font-size: 20pt; font-weight: bold; }
          .result-sheet .header-bangla { font-size: 18pt; font-weight: bold; margin-top: -5px; }
       `}</style>
      {/* Header */}
      <div className="text-center mb-6">
        <p className="header-arabic">بسم الله الرحمن الرحيم</p>
        <div className="flex items-center justify-center mt-2">
            <Logo className="h-14 w-14 mr-4" />
            <div>
                 <h1 className="header-bangla">{APP_TITLE_BN}</h1>
                 <p className="text-lg">{exam_details.name}</p>
            </div>
        </div>
      </div>

      {/* Examinee Info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6 border-y py-4">
        <div><strong>নাম:</strong> {examinee_details.name_bn}</div>
        <div><strong>রোল নং:</strong> {examinee_details.roll_number.toLocaleString('bn-BD')}</div>
        <div><strong>পিতার নাম:</strong> {examinee_details.father_name_bn}</div>
        <div><strong>রেজি. নং:</strong> {examinee_details.registration_number.toLocaleString('bn-BD')}</div>
        <div><strong>মাদরাসা:</strong> {madrasa_details.name_bn} ({madrasa_details.madrasa_code.toLocaleString('bn-BD')})</div>
        <div><strong>মারহালা:</strong> {marhala_details.name_bn}</div>
      </div>

      {/* Marks Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-center">বিষয়ভিত্তিক নম্বর</h3>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">বিষয়</th>
              <th className="border p-2 w-28">পূর্ণ নম্বর</th>
              <th className="border p-2 w-28">প্রাপ্ত নম্বর</th>
            </tr>
          </thead>
          <tbody>
            {subject_marks.map((subject, index) => (
              <tr key={index}>
                <td className="border p-2">{subject.kitab_name}</td>
                <td className="border p-2 text-center">{subject.full_marks.toLocaleString('bn-BD')}</td>
                <td className="border p-2 text-center">{subject.obtained_marks.toLocaleString('bn-BD')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold">
            <tr className="bg-gray-100">
                <td className="border p-2 text-right">মোট নম্বর</td>
                <td colSpan={2} className="border p-2 text-center">{result_summary.total_marks.toLocaleString('bn-BD')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Result Summary */}
      <div className="flex justify-around items-center text-center p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">গড়</p>
          <p className="text-xl font-bold">{(result_summary.percentage || 0).toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">বিভাগ</p>
          <p className="text-xl font-bold">{result_summary.grade}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">ফলাফল</p>
          <p className={`text-xl font-bold ${result_summary.status === 'কৃতকার্য' ? 'text-green-600' : 'text-red-600'}`}>
            {result_summary.status}
          </p>
        </div>
      </div>
       <p className="text-xs text-center text-gray-500 mt-4">প্রকাশের তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
    </div>
  );
};

export default ResultSheetLayout;
