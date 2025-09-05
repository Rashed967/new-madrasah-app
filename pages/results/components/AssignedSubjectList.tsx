import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentListIcon } from '../../../components/ui/Icon';

export interface AssignedSubject {
    kitab_id: string;
    kitab_name: string;
    marhala_name: string;
    total_scripts: number;
    entered_marks_count: number;
    full_marks: number;
}

interface AssignedSubjectListProps {
    subjects: AssignedSubject[];
    isLoading: boolean;
    selectedKitab: AssignedSubject | null;
    onSelectSubject: (subject: AssignedSubject) => void;
}

export const AssignedSubjectList: React.FC<AssignedSubjectListProps> = ({ subjects, isLoading, selectedKitab, onSelectSubject }) => {
    if (isLoading) {
        return (
            <Card>
                <div className="p-4 text-center">
                    <ArrowPathIcon className="w-6 h-6 animate-spin inline mr-2" /> বিষয় লোড হচ্ছে...
                </div>
            </Card>
        );
    }

    return (
        <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">বন্টনকৃত বিষয় ({subjects.length.toLocaleString('bn-BD')} টি)</h3>
            {subjects.length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                    {subjects.map(subject => {
                        const isSelected = selectedKitab?.kitab_id === subject.kitab_id;
                        const isCompleted = subject.entered_marks_count === subject.total_scripts;
                        const progressPercentage = subject.total_scripts > 0 ? (subject.entered_marks_count || 0) / subject.total_scripts * 100 : 0;
                        return (
                            <Card 
                                key={subject.kitab_id} 
                                className={`transition-all duration-200 ${isCompleted ? 'bg-green-50' : 'bg-white hover:shadow-lg'} ${isSelected ? 'border-2 border-emerald-500 shadow-lg' : 'border'} cursor-pointer`} 
                                onClick={() => onSelectSubject(subject)} 
                                bodyClassName="p-3"
                            >
                                <div className="flex items-start">
                                    {isCompleted ? <CheckCircleIcon className="w-6 h-6 mr-3 text-green-500 flex-shrink-0 mt-1"/> : <ClipboardDocumentListIcon className="w-6 h-6 mr-3 text-gray-400 flex-shrink-0 mt-1"/>}
                                    <div>
                                        <p className="font-bold text-md text-emerald-800">{subject.kitab_name}</p>
                                        <p className="text-xs text-gray-500">মারহালা: {subject.marhala_name}</p>
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold">এন্ট্রি: {(subject.entered_marks_count || 0).toLocaleString('bn-BD')} / {subject.total_scripts.toLocaleString('bn-BD')}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${progressPercentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <p className="p-4 text-center text-gray-500">এই পরীক্ষকের জন্য কোনো বন্টনকৃত বিষয় পাওয়া যায়নি।</p>
                </Card>
            )}
        </div>
    );
};
