
import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import ToastNotificationItem from '../ui/ToastNotificationItem';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end z-[100]"
    >
      {/* Global notification live region, render this permanently at the end of the document */}
      <div className="w-full max-w-sm space-y-3">
         {/* Notifications */}
        {toasts.map(toast => (
          <ToastNotificationItem
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
