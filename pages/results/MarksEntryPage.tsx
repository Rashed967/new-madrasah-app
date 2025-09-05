import React, { useState } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { UserCircleIcon, MapPinIcon, ClipboardDocumentListIcon } from '../../components/ui/Icon';
import { ExaminerBasedEntry } from './components/ExaminerBasedEntry';
import { MarkazBasedEntry } from './components/MarkazBasedEntry';
import { RollNumberBasedEntry } from './components/RollNumberBasedEntry';

const MarksEntryPage: React.FC = () => {
    const tabs = [
        { id: 'examiner', label: 'পরীক্ষক ভিত্তিক', icon: <UserCircleIcon className="w-4 h-4"/>, content: <ExaminerBasedEntry /> },
        { id: 'markaz', label: 'মারকায ভিত্তিক', icon: <MapPinIcon className="w-4 h-4"/>, content: <MarkazBasedEntry /> },
        { id: 'roll_number', label: 'রোল নম্বর ভিত্তিক', icon: <ClipboardDocumentListIcon className="w-4 h-4"/>, content: <RollNumberBasedEntry /> }
    ];
    const [activeTab, setActiveTab] = useState('examiner');

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800">নম্বর এন্ট্রি</h2>
            <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default MarksEntryPage;