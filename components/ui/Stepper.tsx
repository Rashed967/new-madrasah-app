
import React from 'react';
import { CheckCircleIcon, PencilIcon } from './Icon';

interface Step {
  id: string;
  label: string;
  icon?: React.ReactElement<React.SVGProps<SVGSVGElement>>; 
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void; 
  className?: string;
  completedSteps?: Set<number>; // Added this prop
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, className = '', completedSteps }) => {
  return (
    <div className={`w-full px-4 sm:px-8 py-4 ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps ? completedSteps.has(index) : index < currentStep; // Use completedSteps prop if available
          const isLastStep = index === steps.length - 1;

          let iconElement: React.ReactNode;
          if (isCompleted) {
            iconElement = <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />;
          } else if (step.icon) {
            const iconBaseClassName = "w-4 h-4 sm:w-5 sm:h-5";
            const iconColorClassName = isActive ? "" : "text-gray-400"; 
            iconElement = React.cloneElement(step.icon, {
              className: `${step.icon.props.className || ''} ${iconBaseClassName} ${iconColorClassName}`.trim()
            });
          } else {
            iconElement = <span className="text-sm sm:text-base font-medium">{index + 1}</span>;
          }
          

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${onStepClick ? 'group' : ''}`}
                onClick={() => onStepClick && onStepClick(index)} // Allow click even if not completed for direct navigation
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive ? 'border-[#52b788] bg-[#52b788] text-white' : 
                    isCompleted ? 'border-[#52b788] bg-emerald-50 text-[#52b788]' : 
                    'border-gray-300 bg-gray-100 text-gray-500 group-hover:border-gray-400'}`}
                >
                  {iconElement}
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm text-center transition-all duration-300 w-20 sm:w-24 truncate
                    ${isActive ? 'font-semibold text-[#52b788]' : 
                    isCompleted ? 'text-emerald-600' : 
                    'text-gray-500 group-hover:text-gray-700'}`}
                >
                  {step.label}
                </p>
              </div>
              {!isLastStep && (
                <div
                  className={`flex-1 h-0.5 sm:h-1 transition-all duration-500 ease-in-out
                    ${isCompleted ? 'bg-[#52b788]' : 'bg-gray-300'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
