import React, { useEffect } from 'react';
import printJS from 'print-js';
import { Modal } from '../ui/Modal'; 
import { Button } from '../ui/Button'; 
import { PrinterIcon, XMarkIcon } from '../ui/Icon'; 

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; 
  printTargetId?: string;
  pageStyle?: string;
  autoPrintOnOpen?: boolean;
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  printTargetId = 'printable-content-area',
  pageStyle = '@page { size: A4 landscape; margin: 10mm; }',
  autoPrintOnOpen = false,
}) => {
  
  const handlePrint = () => {
    const printElement = document.getElementById(printTargetId);
    if (!printElement) {
        alert('প্রিন্ট করার জন্য কোনো কন্টেন্ট পাওয়া যায়নি।');
        return;
    }

    const stylesheetLinks = Array.from(document.head.getElementsByTagName('link'))
        .filter(link => link.rel === 'stylesheet' && link.href)
        .map(link => link.href);

    const inlineStyles = Array.from(document.head.getElementsByTagName('style'))
        .map(style => style.innerHTML)
        .join('');

    printJS({
      printable: printTargetId,
      type: 'html',
      css: stylesheetLinks,
      style: `${pageStyle} ${inlineStyles}`,
      scanStyles: false,
      onError: (error) => {
        console.error("Printing failed:", error);
        alert(`প্রিন্ট করতে সমস্যা হয়েছে। অনুগ্রহ করে কনসোল দেখুন।`);
      }
    });
  };

  useEffect(() => {
    if (isOpen && autoPrintOnOpen) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [isOpen, autoPrintOnOpen]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="5xl">
      <div className="max-h-[80vh] overflow-y-auto mb-4">
        {children}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t no-print">
        <Button variant="secondary" onClick={onClose} leftIcon={<XMarkIcon className="w-4 h-4"/>}>
          বন্ধ করুন
        </Button>
        <Button onClick={handlePrint} leftIcon={<PrinterIcon className="w-4 h-4"/>}>
          প্রিন্ট করুন
        </Button>
      </div>
    </Modal>
  );
};

export default PrintPreviewModal;
