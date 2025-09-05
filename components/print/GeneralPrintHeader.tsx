
import React from 'react';
import { BoardProfile } from '../../types';
import logoImage from '../../assets/images/logo.jpg';

interface GeneralPrintHeaderProps {
  boardProfile: BoardProfile;
}

const GeneralPrintHeader: React.FC<GeneralPrintHeaderProps> = ({ boardProfile }) => {
  return (
    <div className="text-center mb-4">
      <div className="flex justify-center items-center gap-4 mb-4">
        <div className="w-20 h-20 flex items-center justify-center">
          <img src='https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg' alt="Board Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <div className="text-base">Befaqul Madarisuddinia Bangladesh / وفاق المدارس الدينية بنغلادش</div>
          <div className="text-xl font-bold">{boardProfile.boardNameBn}</div>
          <div className="text-base">[বেফাকুল মাদারিসিদ্দিনিয়্যাহ বাংলাদেশ]</div>
          <div className="text-sm">
            {`অস্থায়ী কার্যালয় : ${boardProfile.address.holding || ''}, ${boardProfile.address.villageArea}`}
          </div>
          <div className="text-xs">
            {`${boardProfile.primaryPhone} (অফিস) ${boardProfile.secondaryPhone || ''} (পরীক্ষা বিভাগ)`}
          </div>
        </div>
      </div>
      <hr className="border-t-2 border-black mb-4" />
    </div>
  );
};

export default GeneralPrintHeader;
