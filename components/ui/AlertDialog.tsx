import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger' | 'secondary';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = 'নিশ্চিত করুন',
  cancelButtonText = 'বাতিল করুন',
  confirmButtonVariant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          {cancelButtonText}
        </Button>
        <Button variant={confirmButtonVariant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  );
};
