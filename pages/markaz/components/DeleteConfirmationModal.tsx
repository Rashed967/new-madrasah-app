
import React from 'react';
import { AlertDialog } from '../../../components/ui/AlertDialog';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
  isConfirming: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = "Yes, delete",
  isConfirming,
}) => {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmButtonText={isConfirming ? "Deleting..." : confirmButtonText}
      confirmButtonVariant="danger"
      cancelButtonText="Cancel"
      disabled={isConfirming}
    />
  );
};
