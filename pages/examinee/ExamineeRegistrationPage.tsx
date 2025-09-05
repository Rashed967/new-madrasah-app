
import React from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowPathIcon, ListBulletIcon } from '../../components/ui/Icon';
import { useExamineeRegistration } from './hooks/useExamineeRegistration';
import { SelectionPanel } from './components/SelectionPanel';
import { StatisticsPanel } from './components/StatisticsPanel';
import { ExamineeSearch } from './components/ExamineeSearch';
import { RegistrationForm } from './components/RegistrationForm';

const ExamineeRegistrationPage: React.FC = () => {
  const {
    examineeSearchTerm, setExamineeSearchTerm, isExamineeDropdownOpen, setIsExamineeDropdownOpen, examineeSearchResults, isSearchingExaminees, handleSelectExaminee,
    selectedExamId, setSelectedExamId, selectedMadrasa, setSelectedMadrasa, madrasaSearchTerm, setMadrasaSearchTerm, isMadrasaDropdownOpen, setIsMadrasaDropdownOpen,
    filteredMadrasasForSearch, isSearchingMadrasas, handleSelectMadrasa, handleClearSelectedMadrasa,
    allFeeCollectionsForMadrasaExam, selectedFeeCollectionId, setSelectedFeeCollectionId, selectedFeeCollection,
    marhalaSummaries, selectedMarhalaForEntry, 
    currentStep, setCurrentStep, completedSteps, setCompletedSteps, singleExamineeFormData, setSingleExamineeFormData,
    errors, setErrors,
    allExams, isLoadingExams,
    allMarhalas, isLoadingMarhalas,
    feeCollectionOptions,
    examOptionsSelect,
    isLoadingFeeCollections,
    isLoadingExistingExaminees,
    isLoadingAllExamineesForFilter,
    handleExamineeInputChange,
    handleNextStep,
    handlePreviousStep,
    handleRegisterSingleExaminee,
    createExamineeMutation,
    steps,
    currentMarhalaSummary,
    studentTypeOptionsForSelectedMarhala,
    isRegNumCompletelyUnavailable,
    isLoadingInitialData,
    isOverallFormDisabled,
    canSubmitForm,
    shouldShowPhotoUpload,
    validateStep,
    debouncedExamineeSearchTerm,
    setAllFeeCollectionsForMadrasaExam,
    setMarhalaSummaries,
    handleSelectMarhalaForEntry
  } = useExamineeRegistration();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">পরীক্ষার্থী নিবন্ধন</h2>
      {(isLoadingInitialData || isLoadingAllExamineesForFilter) && <div className="flex items-center justify-center p-4"><ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500 mr-2"/> প্রাথমিক তথ্য লোড হচ্ছে...</div>}
      
      <div className="flex flex-col lg:flex-row gap-4">
        <SelectionPanel 
          selectedExamId={selectedExamId}
          setSelectedExamId={setSelectedExamId}
          setSelectedMadrasa={setSelectedMadrasa}
          setSelectedFeeCollectionId={setSelectedFeeCollectionId}
          setAllFeeCollectionsForMadrasaExam={setAllFeeCollectionsForMadrasaExam}
          setMarhalaSummaries={setMarhalaSummaries}
          handleSelectMarhalaForEntry={handleSelectMarhalaForEntry}
          examOptionsSelect={examOptionsSelect}
          errors={errors}
          isLoadingExams={isLoadingExams}
          selectedMadrasa={selectedMadrasa}
          handleClearSelectedMadrasa={handleClearSelectedMadrasa}
          madrasaSearchTerm={madrasaSearchTerm}
          setMadrasaSearchTerm={setMadrasaSearchTerm}
          isMadrasaDropdownOpen={isMadrasaDropdownOpen}
          setIsMadrasaDropdownOpen={setIsMadrasaDropdownOpen}
          isSearchingMadrasas={isSearchingMadrasas}
          filteredMadrasasForSearch={filteredMadrasasForSearch}
          handleSelectMadrasa={handleSelectMadrasa}
          allFeeCollectionsForMadrasaExam={allFeeCollectionsForMadrasaExam}
          feeCollectionOptions={feeCollectionOptions}
          selectedFeeCollectionId={selectedFeeCollectionId}
          selectedFeeCollection={selectedFeeCollection}
          isOverallFormDisabled={isOverallFormDisabled}
          isLoadingFeeCollections={isLoadingFeeCollections}
          isLoadingExistingExaminees={isLoadingExistingExaminees}
          isLoadingAllExamineesForFilter={isLoadingAllExamineesForFilter}
          marhalaSummaries={marhalaSummaries}
          selectedMarhalaForEntry={selectedMarhalaForEntry}
        />

        <div className="w-full lg:w-7/12 space-y-4">
          {selectedFeeCollection && !isOverallFormDisabled ? (
            <Card>
              {selectedMarhalaForEntry && (
                <ExamineeSearch 
                  examineeSearchTerm={examineeSearchTerm} 
                  setExamineeSearchTerm={setExamineeSearchTerm} 
                  isExamineeDropdownOpen={isExamineeDropdownOpen} 
                  setIsExamineeDropdownOpen={setIsExamineeDropdownOpen} 
                  isSearchingExaminees={isSearchingExaminees} 
                  examineeSearchResults={examineeSearchResults} 
                  handleSelectExaminee={handleSelectExaminee} 
                  debouncedExamineeSearchTerm={debouncedExamineeSearchTerm}                
                />
              )}
              <RegistrationForm 
                steps={steps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                setCurrentStep={setCurrentStep}
                validateStep={validateStep}
                setCompletedSteps={setCompletedSteps}
                singleExamineeFormData={singleExamineeFormData}
                handleExamineeInputChange={handleExamineeInputChange}
                studentTypeOptionsForSelectedMarhala={studentTypeOptionsForSelectedMarhala}
                errors={errors}
                shouldShowPhotoUpload={shouldShowPhotoUpload}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleRegisterSingleExaminee={handleRegisterSingleExaminee}
                createExamineeMutation={createExamineeMutation}
                canSubmitForm={canSubmitForm}
                selectedMarhalaForEntry={selectedMarhalaForEntry}
              />
            </Card>
          ) : (
            <Card><div className="p-8 text-center text-gray-500"><ListBulletIcon className="w-10 h-10 mx-auto text-gray-400 mb-2"/><p>পরীক্ষার্থী নিবন্ধনের জন্য অনুগ্রহ করে প্রথমে বাম পাশ থেকে পরীক্ষা, মাদরাসা এবং ফি সংগ্রহের রশিদ নির্বাচন করুন।</p></div></Card>
          )}
        </div>

        <StatisticsPanel 
          isLoadingFeeCollections={isLoadingFeeCollections}
          isLoadingExistingExaminees={isLoadingExistingExaminees}
          selectedExamId={selectedExamId}
          selectedMadrasa={selectedMadrasa}
          currentMarhalaSummary={currentMarhalaSummary}
          selectedFeeCollection={selectedFeeCollection}
        />
      </div>
    </div>
  );
};

export default ExamineeRegistrationPage;
