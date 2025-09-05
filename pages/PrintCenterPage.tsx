
import React, { useState } from 'react';
import { Card } from '../components/ui/Card'; 
import { Button } from '../components/ui/Button'; 
import { PrinterIcon, MapPinIcon, DocumentChartBarIcon, UserGroupIcon, IdentificationIcon } from '../components/ui/Icon'; 
import MadrasaListPrintModal from '../components/print/MadrasaListPrintModal'; 
import MadrasaAddressPrintModal from '../components/print/MadrasaAddressPrintModal';
import NumberSheetPrintModal from '../components/print/NumberSheetPrintModal';
import MarkazWiseMadrasaPrintModal from '../components/print/MarkazWiseMadrasaPrintModal';
import MarkazWiseExamineePrintModal from '../components/print/MarkazWiseExamineePrintModal';
import { ExamFeeFormPrintModal } from '../components/print/ExamFeeFormPrintModal';
import MarkazAttendancePrintModal from '../components/print/MarkazAttendancePrintModal'; // Corrected Import Path

const PrintCenterPage: React.FC = () => {
  const [isMadrasaListModalOpen, setIsMadrasaListModalOpen] = useState(false);
  const [isMadrasaAddressModalOpen, setIsMadrasaAddressModalOpen] = useState(false);
  const [isNumberSheetModalOpen, setIsNumberSheetModalOpen] = useState(false);
  const [isMarkazWiseModalOpen, setIsMarkazWiseModalOpen] = useState(false);
  const [isMarkazWiseExamineeModalOpen, setIsMarkazWiseExamineeModalOpen] = useState(false);
  const [isExamFeeFormModalOpen, setIsExamFeeFormModalOpen] = useState(false);
  const [isMarkazAttendanceModalOpen, setIsMarkazAttendanceModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">প্রিন্ট সেন্টার</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Existing Cards... */}
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              মাদ্রাসার তালিকা প্রিন্ট
            </h3>
            <PrinterIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsMadrasaListModalOpen(true)}
              size="sm"
            >
              তালিকা প্রিন্ট করুন
            </Button>
          </div>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              মাদ্রাসার ঠিকানা প্রিন্ট
            </h3>
            <MapPinIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsMadrasaAddressModalOpen(true)}
              size="sm"
            >
              ঠিকানা প্রিন্ট করুন
            </Button>
          </div>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              নম্বরপত্র প্রিন্ট
            </h3>
            <DocumentChartBarIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsNumberSheetModalOpen(true)}
              size="sm"
            >
              নম্বরপত্র প্রিন্ট
            </Button>
          </div>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              মারকায ভিত্তিক মাদরাসা
            </h3>
            <UserGroupIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsMarkazWiseModalOpen(true)}
              size="sm"
            >
              প্রিন্ট করুন
            </Button>
          </div>
        </Card>
        
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              পরীক্ষা ফি জমা ফরম
            </h3>
            <IdentificationIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsExamFeeFormModalOpen(true)}
              size="sm"
            >
              প্রিন্ট করুন
            </Button>
          </div>
        </Card>
        
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              মারকায ভিত্তিক পরীক্ষার্থী
            </h3>
            <UserGroupIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsMarkazWiseExamineeModalOpen(true)}
              size="sm"
            >
              তালিকা প্রিন্ট করুন
            </Button>
          </div>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105"
          bodyClassName="p-2"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              মারকায রিপোর্ট
            </h3>
            <UserGroupIcon className="w-10 h-10 text-emerald-500 mb-1" />
            <Button 
              onClick={() => setIsMarkazAttendanceModalOpen(true)}
              size="sm"
            >
              রিপোর্ট প্রিন্ট করুন
            </Button>
          </div>
        </Card>
      </div>

      {isMadrasaListModalOpen && (
        <MadrasaListPrintModal
          isOpen={isMadrasaListModalOpen}
          onClose={() => setIsMadrasaListModalOpen(false)}
        />
      )}

      {isMadrasaAddressModalOpen && (
        <MadrasaAddressPrintModal
          isOpen={isMadrasaAddressModalOpen}
          onClose={() => setIsMadrasaAddressModalOpen(false)}
        />
      )}
      
      {isNumberSheetModalOpen && (
        <NumberSheetPrintModal
          isOpen={isNumberSheetModalOpen}
          onClose={() => setIsNumberSheetModalOpen(false)}
        />
      )}

      {isMarkazWiseModalOpen && (
        <MarkazWiseMadrasaPrintModal
          isOpen={isMarkazWiseModalOpen}
          onClose={() => setIsMarkazWiseModalOpen(false)}
        />
      )}
      
      {isMarkazWiseExamineeModalOpen && (
        <MarkazWiseExamineePrintModal
          isOpen={isMarkazWiseExamineeModalOpen}
          onClose={() => setIsMarkazWiseExamineeModalOpen(false)}
        />
      )}

      {isExamFeeFormModalOpen && (
          <ExamFeeFormPrintModal
            isOpen={isExamFeeFormModalOpen}
            onClose={() => setIsExamFeeFormModalOpen(false)}
          />
      )}
      
      {isMarkazAttendanceModalOpen && (
        <MarkazAttendancePrintModal
          isOpen={isMarkazAttendanceModalOpen}
          onClose={() => setIsMarkazAttendanceModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PrintCenterPage;
