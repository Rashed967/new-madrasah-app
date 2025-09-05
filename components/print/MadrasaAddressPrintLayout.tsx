
import React from 'react';
import { Madrasa } from '../../types';

interface MadrasaAddressPrintLayoutProps {
  madrasas: Madrasa[];
}

const MadrasaAddressPrintLayout: React.FC<MadrasaAddressPrintLayoutProps> = ({ madrasas }) => {
  return (
    <div id="printable-madrasa-address-slips" className="printable-content print-layout p-1 bg-white" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
      <style>{`
        .address-grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* Two columns */
          gap: 5mm; /* Gap between columns and rows */
          width: 100%;
          page-break-before: auto;
          page-break-after: auto;
        }
        .address-block-container {
          border: 1px solid #000;
          padding: 0;
          box-sizing: border-box;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: #FFFFFF !important;
          }
          .address-grid-container {
             grid-template-columns: repeat(2, 1fr) !important;
             gap: 5mm !important;
          }
          .address-block-container {
             border: 1px solid #000 !important;
             background-color: #fff !important;
             color: #000 !important;
          }
           .address-block-container * {
             font-size: 10pt !important;
             line-height: 1.3 !important;
             color: inherit !important;
           }
           .dispatch-box {
              background-color: #808080 !important; /* Grey background */
              color: #FFFFFF !important; /* White text */
              border-color: #000 !important;
           }
        }
      `}</style>
      
      <div className="address-grid-container">
        {madrasas.map((madrasa) => {
          const fullAddress = [madrasa.address.holding, madrasa.address.village].filter(Boolean).join(', ');
          const mobileNumbers = [madrasa.mobile1, madrasa.mobile2].filter(Boolean).join(', ');

          return (
           <div className="address-block-container w-[400px] bg-white border-2 border-black p-0">
              <div className="px-3 pt-2 pb-[3px] flex justify-between items-center">
                <span className="text-[14px] font-normal">মুহতামিম,</span>
                <span className="text-[14px] font-normal">কোড নং- {madrasa.madrasaCode.toLocaleString('bn-BD')}</span>
              </div>


              <div className="px-3">
                <div className="text-[14px] mb-2">
                  {madrasa.muhtamim.name}
                </div>
                
                <div className="text-[14px] mb-[6px] font-bold mt-[2px]">
                     {madrasa.nameBn}
                </div>

                <div className="flex justify-between mb-[6px] text-[14px]">
                   <span>গ্রাম/মহল্লা: {fullAddress}</span>
                  <span className="ml-[120px]">থানা: {madrasa.address.upazila}</span>
                </div>

                <div className="flex justify-between mb-[6px] text-[14px]">
                  <span>জেলা: {madrasa.address.district}</span>
                  <span className="ml-[120px]">বিভাগ: {madrasa.address.division}</span>
                </div>

                <div className="text-[14px] mb-3">
                  মোবাইল: {mobileNumbers}
                </div>


                <div className="text-center mb-1">
                  <div className="dispatch-box w-20 h-5  mx-auto flex items-center justify-center text-[12px] bg-gray-500 text-white">
                    ({madrasa.dispatchMethod === 'post' ? 'ডাক' : 'কুরিয়ার'})
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {madrasas.length === 0 && (
        <p className="text-center py-10">কোনো মাদ্রাসার ঠিকানা পাওয়া যায়নি।</p>
      )}
    </div>
  );
};

export default MadrasaAddressPrintLayout;
