import React from 'react';
import { PencilIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../../../components/ui/Icon';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface SaveStatusIndicatorProps {
    status: SaveStatus;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
    const messages = {
        idle: { text: 'পরিবর্তনগুলি স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে', icon: <PencilIcon className="w-5 h-5 text-gray-500"/> },
        saving: { text: 'সংরক্ষণ করা হচ্ছে...', icon: <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500"/> },
        success: { text: 'সকল পরিবর্তন সংরক্ষিত হয়েছে', icon: <CheckCircleIcon className="w-5 h-5 text-green-500"/> },
        error: { text: 'সংরক্ষণে ত্রুটি হয়েছে', icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500"/> },
    };
    const { text, icon } = messages[status];
    return <div className="flex items-center gap-2 text-sm text-gray-600 p-4">{icon}{text}</div>;
};
