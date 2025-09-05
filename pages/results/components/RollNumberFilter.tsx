import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface RollNumberFilterProps {
    onFetchExaminees: (startRoll: number, endRoll: number) => void;
    isFetching: boolean;
}

export const RollNumberFilter: React.FC<RollNumberFilterProps> = ({ onFetchExaminees, isFetching }) => {
    const [startRoll, setStartRoll] = useState('');
    const [endRoll, setEndRoll] = useState('');

    const handleFetch = () => {
        const start = parseInt(startRoll, 10);
        const end = parseInt(endRoll, 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
            onFetchExaminees(start, end);
        } else {
            // Handle error, maybe show a toast
            console.error("Invalid roll number range");
        }
    };

    return (
        <Card title="রোল নম্বর দ্বারা খুঁজুন">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input
                    label="শুরুর রোল"
                    type="number"
                    value={startRoll}
                    onChange={(e) => setStartRoll(e.target.value)}
                    placeholder="e.g., 1001"
                />
                <Input
                    label="শেষের রোল"
                    type="number"
                    value={endRoll}
                    onChange={(e) => setEndRoll(e.target.value)}
                    placeholder="e.g., 1050"
                />
                <Button onClick={handleFetch} disabled={isFetching || !startRoll || !endRoll}>
                    {isFetching ? 'খুঁজছে...' : 'শিক্ষার্থী খুঁজুন'}
                </Button>
            </div>
        </Card>
    );
};
