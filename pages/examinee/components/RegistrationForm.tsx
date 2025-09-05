import React from 'react';
import { Stepper } from '../../../components/ui/Stepper';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { FileUpload } from '../../../components/ui/FileUpload';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon as SubmitIcon, UserCircleIcon, CalendarDaysIcon, PaperClipIcon } from '../../../components/ui/Icon';
import { SingleExamineeFormData } from '../hooks/useExamineeRegistration';
import { SelectOption } from '../../../types';

interface RegistrationFormProps {
  steps: { id: string; label: string; }[];
  currentStep: number;
  completedSteps: Set<number>;
  setCurrentStep: (step: number) => void;
  validateStep: (step: number) => boolean;
  setCompletedSteps: (steps: Set<number>) => void;
  singleExamineeFormData: SingleExamineeFormData;
  handleExamineeInputChange: (field: keyof SingleExamineeFormData, value: string | File | null) => void;
  studentTypeOptionsForSelectedMarhala: SelectOption[];
  errors: any;
  shouldShowPhotoUpload: boolean;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  handleRegisterSingleExaminee: () => void;
  createExamineeMutation: any;
  canSubmitForm: boolean;
  selectedMarhalaForEntry: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
    steps, currentStep, completedSteps, setCurrentStep, validateStep, setCompletedSteps,
    singleExamineeFormData, handleExamineeInputChange, studentTypeOptionsForSelectedMarhala,
    errors, shouldShowPhotoUpload, handlePreviousStep, handleNextStep, 
    handleRegisterSingleExaminee, createExamineeMutation, canSubmitForm, selectedMarhalaForEntry
}) => {

  const renderStepContent = () => {
    const stepId = steps[currentStep].id; 
    const currentEntryErrors = errors.stepperEntry || {};

    switch (stepId) {
      case 'examineeInfo':
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 items-end mb-2">
                    <Input label="নিবন্ধন নম্বর রেঞ্জ" name="registrationNumberDisplay" value={singleExamineeFormData.registrationNumberDisplay} disabled wrapperClassName="mb-1 text-xs md:col-span-2" className="h-9 text-xs bg-gray-100" error={currentEntryErrors.registrationNumberDisplayError}/>
                    <Select label="শিক্ষার্থীর ধরণ" value={singleExamineeFormData.studentType} onChange={e => handleExamineeInputChange('studentType', e.target.value)} options={studentTypeOptionsForSelectedMarhala} error={currentEntryErrors.studentType || currentEntryErrors.slotError} placeholderOption={studentTypeOptionsForSelectedMarhala.length > 0 ? "ধরণ..." : "কোনো স্লট খালি নেই"} required wrapperClassName="mb-1 text-xs" className="h-9 text-xs" disabled={studentTypeOptionsForSelectedMarhala.length === 0}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                    <Input label="নাম (বাংলা)" value={singleExamineeFormData.nameBn} onChange={e => handleExamineeInputChange('nameBn', e.target.value)} error={currentEntryErrors.nameBn} required wrapperClassName="text-xs" className="h-9 text-xs"/>
                    <Input label="নাম (ইংরেজি)" value={singleExamineeFormData.nameEn} onChange={e => handleExamineeInputChange('nameEn', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                    <Input label="নাম (আরবি)" value={singleExamineeFormData.nameAr} onChange={e => handleExamineeInputChange('nameAr', e.target.value)} wrapperClassName="text-xs " className="h-9 text-xs" style={{ direction: 'rtl', textAlign: 'right' }}/>
                    <CustomDatePicker id="dateOfBirthExamineeReg" label="জন্ম তারিখ" value={singleExamineeFormData.dateOfBirth} onChange={(dateStr) => handleExamineeInputChange('dateOfBirth', dateStr)} error={currentEntryErrors.dateOfBirth} required placeholder="YYYY-MM-DD"/>
                    <Input label="NID/জন্ম নিবন্ধন নম্বর" value={singleExamineeFormData.nidOrBirthCert} onChange={e => handleExamineeInputChange('nidOrBirthCert', e.target.value)} error={currentEntryErrors.nidOrBirthCert} required wrapperClassName="text-xs" className="h-9 text-xs"/>
                </div>
            </div>
        );
      case 'fatherInfo':
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                <Input label="পিতার নাম (বাংলা)" value={singleExamineeFormData.fatherNameBn} onChange={e => handleExamineeInputChange('fatherNameBn', e.target.value)} error={currentEntryErrors.fatherNameBn} required wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পিতার নাম (ইংরেজি)" value={singleExamineeFormData.fatherNameEn} onChange={e => handleExamineeInputChange('fatherNameEn', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পিতার নাম (আরবি)" value={singleExamineeFormData.fatherNameAr} onChange={e => handleExamineeInputChange('fatherNameAr', e.target.value)} wrapperClassName="text-xs " className="h-9 text-xs" style={{ direction: 'rtl', textAlign: 'right' }}/>
            </div>
        );
      case 'motherInfo':
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                <Input label="মাতার নাম (বাংলা)" value={singleExamineeFormData.motherNameBn} onChange={e => handleExamineeInputChange('motherNameBn', e.target.value)} error={currentEntryErrors.motherNameBn} required wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="মাতার নাম (ইংরেজি)" value={singleExamineeFormData.motherNameEn} onChange={e => handleExamineeInputChange('motherNameEn', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="মাতার নাম (আরবি)" value={singleExamineeFormData.motherNameAr} onChange={e => handleExamineeInputChange('motherNameAr', e.target.value)} wrapperClassName="text-xs " className="h-9 text-xs" style={{ direction: 'rtl', textAlign: 'right' }}/>
            </div>
        );
      case 'pastExamInfo':
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                <Input label="পূর্ববর্তী পরীক্ষার রোল" value={singleExamineeFormData.pastYearRoll} onChange={e => handleExamineeInputChange('pastYearRoll', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পূর্ববর্তী মারহালা" value={singleExamineeFormData.pastYearMarhala} onChange={e => handleExamineeInputChange('pastYearMarhala', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পূর্ববর্তী পরীক্ষার সন" value={singleExamineeFormData.pastExamYear} onChange={e => handleExamineeInputChange('pastExamYear', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পূর্ববর্তী পরীক্ষার মোট নম্বর" value={singleExamineeFormData.pastYearTotalNumber} onChange={e => handleExamineeInputChange('pastYearTotalNumber', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Input label="পূর্ববর্তী পরীক্ষার বিভাগ" value={singleExamineeFormData.pastYearDivision} onChange={e => handleExamineeInputChange('pastYearDivision', e.target.value)} wrapperClassName="text-xs" className="h-9 text-xs"/>
                <Textarea label="মন্তব্য" value={singleExamineeFormData.pastYearComment} onChange={e => handleExamineeInputChange('pastYearComment', e.target.value)} wrapperClassName="md:col-span-2 text-xs" className="h-20 text-xs"/>
            </div>
        );
      case 'photoUpload': 
        return (
            <FileUpload id="examineePhoto" label="পরীক্ষার্থীর ছবি" onFileChange={(file) => handleExamineeInputChange('photoFile', file)} acceptedFileTypes="image/jpeg, image/png" fileNameDisplay={singleExamineeFormData.photoFile?.name} buttonText="ছবি নির্বাচন করুন" error={currentEntryErrors.photoFile} wrapperClassName="md:col-span-2 text-xs" required={shouldShowPhotoUpload}/>
        );
      default: return null;
    }
  };

  const stepperSteps = steps.map(step => ({
    ...step,
    icon: step.id === 'examineeInfo' ? <UserCircleIcon className="w-5 h-5" /> :
          step.id === 'fatherInfo' ? <UserCircleIcon className="w-5 h-5" /> :
          step.id === 'motherInfo' ? <UserCircleIcon className="w-5 h-5" /> :
          step.id === 'pastExamInfo' ? <CalendarDaysIcon className="w-5 h-5" /> :
          step.id === 'photoUpload' ? <PaperClipIcon className="w-5 h-5" /> : null
  }));

  return (
    <>
      <Stepper 
        steps={stepperSteps} 
        currentStep={currentStep} 
        completedSteps={completedSteps} 
        onStepClick={(idx) => { 
          if(idx < currentStep || completedSteps.has(idx)) setCurrentStep(idx); 
          else if(idx === currentStep + 1 && validateStep(currentStep)){ 
            setCompletedSteps(new Set(prev => new Set(prev).add(currentStep))); 
            setCurrentStep(idx); 
          }
        }}
      />
      <div className="p-3 min-h-[200px]">
        {selectedMarhalaForEntry ? renderStepContent() : <p className="text-center text-gray-500 py-4">তথ্য ইনপুট করার জন্য অনুগ্রহ করে বাম পাশ থেকে একটি মারহালা নির্বাচন করুন।</p>}
      </div>
      {selectedMarhalaForEntry && (
        <div className="flex justify-between items-center mt-4 px-3 pb-3">
          <Button type="button" variant="secondary" onClick={handlePreviousStep} disabled={currentStep === 0 || createExamineeMutation.isPending} leftIcon={<ChevronLeftIcon className="w-5 h-5"/>} size="sm">পূর্ববর্তী ধাপ</Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNextStep} rightIcon={<ChevronRightIcon className="w-5 h-5"/>} size="sm" disabled={createExamineeMutation.isPending}>পরবর্তী ধাপ</Button>
          ) : (
            <Button type="button" onClick={handleRegisterSingleExaminee} leftIcon={<SubmitIcon className="w-5 h-5"/>} size="sm" disabled={createExamineeMutation.isPending || !canSubmitForm}>
              {createExamineeMutation.isPending ? 'নিবন্ধন করা হচ্ছে...' : 'এই পরীক্ষার্থীকে নিবন্ধন করুন'}
            </Button>
          )}
        </div>
      )}
      {errors.stepperEntry?.apiError && <p className="text-red-500 text-sm p-3">{errors.stepperEntry.apiError}</p>}
    </>
  );
};