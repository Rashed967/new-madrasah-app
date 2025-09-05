
import React from 'react';
import { ApplicationStatus } from '../../types';
import { CheckCircleIcon, Cog6ToothIcon, PaperAirplaneIcon, CheckBadgeIcon, ExclamationTriangleIcon } from './Icon';

interface StatusTimelineProps {
  currentStatus: ApplicationStatus;
}

const steps: { status: ApplicationStatus; label: string; icon: React.ReactElement<React.SVGProps<SVGSVGElement>> }[] = [
  { status: 'pending', label: 'আবেদন গৃহীত', icon: <CheckCircleIcon /> },
  { status: 'processing', label: 'প্রস্তুত হচ্ছে', icon: <Cog6ToothIcon /> },
  { status: 'ready_for_delivery', label: 'প্রদানের জন্য প্রস্তুত', icon: <PaperAirplaneIcon /> },
  { status: 'completed', label: 'প্রদান সম্পন্ন', icon: <CheckBadgeIcon /> },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus }) => {
  const currentStepIndex = steps.findIndex(step => step.status === currentStatus);
  const isRejected = currentStatus === 'rejected';

  if (isRejected) {
    return (
        <div className="flex justify-center items-center p-4 bg-red-100 border border-red-300 rounded-lg">
             <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-4"/>
            <div>
                <p className="font-bold text-red-800">আবেদনটি বাতিল করা হয়েছে</p>
                <p className="text-sm text-red-700">অনুগ্রহ করে বিস্তারিত জানতে অফিসে যোগাযোগ করুন।</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 py-4">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isLastStep = index === steps.length - 1;

          return (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center transition-all duration-300">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive ? 'border-emerald-500 bg-emerald-500 text-white animate-pulse' :
                    isCompleted ? 'border-emerald-500 bg-emerald-100 text-emerald-600' :
                    'border-gray-300 bg-gray-100 text-gray-400'}`}
                >
                  {React.cloneElement(step.icon, { className: 'w-5 h-5' })}
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm text-center transition-all duration-300 w-24 truncate
                    ${isActive ? 'font-semibold text-emerald-600' :
                    isCompleted ? 'text-emerald-600' :
                    'text-gray-500'}`}
                >
                  {step.label}
                </p>
              </div>
              {!isLastStep && (
                <div
                  className={`flex-1 h-1 transition-all duration-500 ease-in-out
                    ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
