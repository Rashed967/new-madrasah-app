import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { RollNumberFilter } from './RollNumberFilter';
import { MarkStatus } from '../../../types';
import { MarhalaWiseMarksEntry } from './MarhalaWiseMarksEntry';

// Types for the new data structure
export interface ExamineeByRoll {
    id: string;
    name_bn: string;
    roll_number: number;
    exam_id: string;
    marhala_id: string;
    marhala_name: string;
    kitabs: { id: string; name_bn: string; full_marks: number }[];
    marks: Record<string, { value: number | string; status: MarkStatus }>;
}

export interface MarhalaGroup {
    marhala_id: string;
    marhala_name: string;
    examinees: ExamineeByRoll[];
    kitabs: { id: string; name_bn: string; full_marks: number }[];
}

export const RollNumberBasedEntry: React.FC = () => {
    const [rollRange, setRollRange] = useState<{ start: number; end: number } | null>(null);

    const { data: examinees = [], isLoading: isFetching } = useQuery<ExamineeByRoll[], Error>({
        queryKey: ['examineesByRoll', rollRange],
        queryFn: async () => {
            if (!rollRange) return [];
            // This RPC function needs to be created in the database
            const { data, error } = await supabase.rpc('get_examinees_by_roll_range', {
                p_start_roll: rollRange.start,
                p_end_roll: rollRange.end,
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!rollRange,
    });

    const marhalaGroups = useMemo(() => {
        if (!examinees.length) return [];

        const groups: Record<string, MarhalaGroup> = {};

        examinees.forEach(examinee => {
            if (!groups[examinee.marhala_id]) {
                groups[examinee.marhala_id] = {
                    marhala_id: examinee.marhala_id,
                    marhala_name: examinee.marhala_name,
                    examinees: [],
                    kitabs: examinee.kitabs, // Assuming all examinees in a marhala have the same kitabs
                };
            }
            groups[examinee.marhala_id].examinees.push(examinee);
        });

        return Object.values(groups);
    }, [examinees]);

    const handleFetchExaminees = (startRoll: number, endRoll: number) => {
        setRollRange({ start: startRoll, end: endRoll });
    };

    return (
        <div className="space-y-6">
            <RollNumberFilter onFetchExaminees={handleFetchExaminees} isFetching={isFetching} />

            {isFetching && <p>লোড হচ্ছে...</p>}

            {marhalaGroups.map(group => (
                <MarhalaWiseMarksEntry key={group.marhala_id} group={group} />
            ))}
        </div>
    );
};
