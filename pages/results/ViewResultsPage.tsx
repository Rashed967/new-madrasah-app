import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { Exam, Marhala, SelectOption, MeritListRow, FullExamStatistics, IndividualResult, MarhalaApiResponse } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ArrowPathIcon, MagnifyingGlassIcon, TrophyIcon, ChartBarIcon, ListBulletIcon, PrinterIcon, UserCircleIcon } from '../../components/ui/Icon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';


const COLORS = ['#52b788', '#82ca9d', '#FFBB28', '#FF8042', '#0088FE', '#00C49F'];
const GRADE_FILTER_OPTIONS: SelectOption[] = [
    { value: '', label: 'সকল বিভাগ' },
    { value: 'মুমতায (স্টারমার্ক)', label: 'মুমতায (স্টারমার্ক)' },
    { value: 'জায়্যিদ জিদ্দান (১ম বিভাগ)', label: 'জায়্যিদ জিদ্দান (১ম বিভাগ)' },
    { value: 'জায়্যিদ (২য় বিভাগ)', label: 'জায়্যিদ (২য় বিভাগ)' },
    { value: 'মাকবুল (৩য় বিভাগ)', label: 'মাকবুল (৩য় বিভাগ)' },
];

const ViewResultsPage: React.FC = () => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('individual');

    // State for Individual Result Search
    const [selectedExamIdIndividual, setSelectedExamIdIndividual] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);

    // State for Merit List
    const [selectedExamIdMerit, setSelectedExamIdMerit] = useState('');
    const [selectedMarhalaIdMerit, setSelectedMarhalaIdMerit] = useState('');
    const [selectedGradeFilter, setSelectedGradeFilter] = useState('');

    // State for Statistics
    const [selectedExamIdStats, setSelectedExamIdStats] = useState('');

    // --- Data Fetching ---
    const { data: exams = [] } = useQuery<Exam[], Error>({
        queryKey: ['completedExams'],
        queryFn: async () => {
            const { data, error } = await supabase.from('exams').select('*').in('status', ['completed', 'result_processing']);
            if (error) throw error;
            return data || [];
        }
    });

    const { data: marhalas = [] } = useQuery<Marhala[], Error>({
        queryKey: ['allMarhalasForResults'],
        queryFn: async () => {
            const { data, error } = await supabase.from('marhalas').select('*');
            if (error) throw error;
            return (data || []).map((item: MarhalaApiResponse) => ({
                id: item.id,
                marhala_code: item.marhala_code,
                nameBn: item.name_bn,
                nameAr: item.name_ar || undefined,
                type: item.type,
                category: item.category,
                kitabIds: item.kitab_ids,
                marhala_order: item.marhala_order,
                requiresPhoto: item.requires_photo || false,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            }));
        }
    });
    
    const { data: individualResult, isLoading: isLoadingIndividual, refetch: refetchIndividual } = useQuery<IndividualResult | null, Error>({
        queryKey: ['individualResult', selectedExamIdIndividual, rollNumber, searchTrigger],
        queryFn: async () => {
            if (!selectedExamIdIndividual || !rollNumber) return null;
            const { data, error } = await supabase.rpc('get_individual_result_details', {
                p_exam_id: selectedExamIdIndividual,
                p_roll_number: parseInt(rollNumber, 10)
            });
            if (error) throw error;
            if (!data) {
                addToast('এই রোল নম্বরের কোনো ফলাফল পাওয়া যায়নি।', 'info');
                return null;
            }
            return data;
        },
        enabled: false,
    });
    
    const { data: meritList = [], isLoading: isLoadingMeritList } = useQuery<MeritListRow[], Error>({
        queryKey: ['meritList', selectedExamIdMerit, selectedMarhalaIdMerit, selectedGradeFilter],
        queryFn: async () => {
            if (!selectedExamIdMerit || !selectedMarhalaIdMerit) return [];
            const { data, error } = await supabase.rpc('get_merit_list', {
                p_exam_id: selectedExamIdMerit,
                p_marhala_id: selectedMarhalaIdMerit,
                p_grade_filter: selectedGradeFilter || null
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedExamIdMerit && !!selectedMarhalaIdMerit,
    });
    
    const { data: examStatistics, isLoading: isLoadingStats } = useQuery<FullExamStatistics | null, Error>({
        queryKey: ['examStatistics', selectedExamIdStats],
        queryFn: async () => {
            if (!selectedExamIdStats) return null;
            const { data, error } = await supabase.rpc('get_exam_statistics', { p_exam_id: selectedExamIdStats });
            if (error) throw error;
            return data;
        },
        enabled: !!selectedExamIdStats,
    });

    useEffect(() => {
        if(searchTrigger > 0) refetchIndividual();
    }, [searchTrigger, refetchIndividual]);

    const examOptions = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);
    const marhalaOptions = useMemo(() => [{value: '', label: 'মারহালা নির্বাচন করুন'}, ...marhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'})` }))], [marhalas]);

    const handleIndividualSearch = () => {
        if (!selectedExamIdIndividual || !rollNumber) {
            addToast('অনুগ্রহ করে পরীক্ষা এবং রোল নম্বর পূরণ করুন।', 'warning');
            return;
        }
        setSearchTrigger(prev => prev + 1);
    };
    
    const tabs = [
        { id: 'individual', label: 'ব্যক্তিগত ফলাফল', icon: <UserCircleIcon className="w-4 h-4"/>, content: <IndividualResultView examOptions={examOptions} selectedExamId={selectedExamIdIndividual} setSelectedExamId={setSelectedExamIdIndividual} rollNumber={rollNumber} setRollNumber={setRollNumber} onSearch={handleIndividualSearch} result={individualResult} isLoading={isLoadingIndividual}/> },
        { id: 'merit_list', label: 'মেধাতালিকা', icon: <TrophyIcon className="w-4 h-4"/>, content: <MeritListView examOptions={examOptions} marhalaOptions={marhalaOptions} selectedExamId={selectedExamIdMerit} setSelectedExamId={setSelectedExamIdMerit} selectedMarhalaId={selectedMarhalaIdMerit} setSelectedMarhalaId={setSelectedMarhalaIdMerit} selectedGradeFilter={selectedGradeFilter} setSelectedGradeFilter={setSelectedGradeFilter} meritList={meritList} isLoading={isLoadingMeritList} /> },
        { id: 'statistics', label: 'পরিসংখ্যান', icon: <ChartBarIcon className="w-4 h-4"/>, content: <StatisticsView examOptions={examOptions} selectedExamId={selectedExamIdStats} setSelectedExamId={setSelectedExamIdStats} stats={examStatistics} isLoading={isLoadingStats} /> },
    ];
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800">ফলাফল</h2>
            <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab}/>
        </div>
    );
};

// -- Sub Components --
const IndividualResultView: React.FC<any> = ({ examOptions, selectedExamId, setSelectedExamId, rollNumber, setRollNumber, onSearch, result, isLoading }) => {
  const handlePrint = () => window.print();
  return (
    <Card bodyClassName="p-0">
      <div className="no-print p-4 border-b">
        <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center"><MagnifyingGlassIcon className="w-5 h-5 mr-2"/>পরীক্ষার তথ্য খুঁজুন</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা নির্বাচন..."/>
            <Input label="রোল নম্বর" type="number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} wrapperClassName="md:col-span-2"/>
            <Button onClick={onSearch} disabled={isLoading} leftIcon={isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <MagnifyingGlassIcon className="w-5 h-5"/>}>ফলাফল খুঁজুন</Button>
        </div>
      </div>
      {isLoading && <div className="p-8 text-center text-gray-700"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block mr-2"/>ফলাফল লোড হচ্ছে...</div>}
      {result && (
        <>
        <div className="p-4 printable-content" id="result-card-print-area">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-lg shadow-md border">
            {/* Left Column */}
            <div className="md:col-span-5 bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-center text-emerald-800 mb-3">{result.exam_details.name}</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="font-medium text-gray-600">নাম:</span> <span className="text-black font-semibold">{result.examinee_details.name_bn}</span></p>
                <p><span className="font-medium text-gray-600">পিতার নাম:</span> <span className="text-black">{result.examinee_details.father_name_bn}</span></p>
                <p><span className="font-medium text-gray-600">মাদরাসা:</span> <span className="text-black">{result.madrasa_details.name_bn}</span></p>
                <p><span className="font-medium text-gray-600">রোল নং:</span> <span className="text-black font-semibold">{result.examinee_details.roll_number.toLocaleString('bn-BD')}</span></p>
                <p><span className="font-medium text-gray-600">রেজি. নং:</span> <span className="text-black">{result.examinee_details.registration_number.toLocaleString('bn-BD')}</span></p>
                <p><span className="font-medium text-gray-600">মারহালা:</span> <span className="text-black">{result.marhala_details.name_bn}</span></p>
              </div>
              <div className={`mt-4 pt-2 text-center font-bold text-xl`}>
                  <span className={`px-4 py-1.5 rounded-full ${result.result_summary.status === 'কৃতকার্য' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {result.result_summary.status}
                  </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-7">
              <h4 className="font-semibold mb-2 text-black text-lg">বিষয়ভিত্তিক নম্বর:</h4>
              <table className="w-full text-sm text-left border">
                  <thead className="bg-gray-100"><tr><th className="p-2 border text-black font-medium">বিষয়</th><th className="p-2 border text-center text-black font-medium">পূর্ণ নম্বর</th><th className="p-2 border text-center text-black font-medium">প্রাপ্ত নম্বর</th></tr></thead>
                  <tbody>
                      {result.subject_marks.map((mark: any, index: number) => (
                          <tr key={index} className="border-t text-black"><td className="p-2 border">{mark.kitab_name}</td><td className="p-2 border text-center">{mark.full_marks.toLocaleString('bn-BD')}</td><td className="p-2 border text-center font-semibold">{mark.obtained_marks.toLocaleString('bn-BD')}</td></tr>
                      ))}
                      <tr className="border-t bg-gray-100 font-bold text-black"><td className="p-2 border text-right">মোট নম্বর:</td><td colSpan={2} className="p-2 border text-center">{result.result_summary.total_marks.toLocaleString('bn-BD')}</td></tr>
                       <tr className="border-t bg-gray-100 font-bold text-black"><td className="p-2 border text-right">গড় নম্বর:</td><td colSpan={2} className="p-2 border text-center">{(result.result_summary.percentage || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2})}%</td></tr>
                       <tr className="border-t bg-gray-100 font-bold text-black"><td className="p-2 border text-right">বিভাগ:</td><td colSpan={2} className="p-2 border text-center">{result.result_summary.grade}</td></tr>
                  </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-4 text-center no-print"><Button variant="outline" onClick={handlePrint} leftIcon={<PrinterIcon className="w-4 h-4"/>}>প্রিন্ট করুন</Button></div>
        </>
      )}
    </Card>
  );
};

const MeritListView: React.FC<any> = ({ examOptions, marhalaOptions, selectedExamId, setSelectedExamId, selectedMarhalaId, setSelectedMarhalaId, selectedGradeFilter, setSelectedGradeFilter, meritList, isLoading }) => (
    <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end no-print">
             <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা নির্বাচন..."/>
             <Select label="মারহালা" value={selectedMarhalaId} onChange={e => setSelectedMarhalaId(e.target.value)} options={marhalaOptions} placeholderOption="মারহালা নির্বাচন..." disabled={!selectedExamId}/>
             <Select label="বিভাগ অনুযায়ী ফিল্টার" value={selectedGradeFilter} onChange={e => setSelectedGradeFilter(e.target.value)} options={GRADE_FILTER_OPTIONS} placeholderOption="সকল বিভাগ" disabled={!selectedMarhalaId}/>
        </div>
        {isLoading && <div className="p-8 text-center text-gray-700"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block mr-2"/>মেধাতালিকা লোড হচ্ছে...</div>}
        {meritList && meritList.length > 0 && (
             <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-100"><tr>{['মেধাক্রম', 'রোল নং', 'রেজি. নং', 'নাম', 'মাদরাসা', 'মোট নম্বর', 'গড় (%)', 'বিভাগ'].map(h=><th key={h} className="p-2 border text-black font-medium">{h}</th>)}</tr></thead>
                <tbody>
                    {meritList.map((row: MeritListRow) => (
                        <tr key={row.examinee_id} className="border-t text-black">
                            <td className="p-2 border text-center font-semibold">{row.position_details}</td>
                            <td className="p-2 border text-center">{row.roll_number.toLocaleString('bn-BD')}</td>
                            <td className="p-2 border text-center">{row.registration_number.toLocaleString('bn-BD')}</td>
                            <td className="p-2 border">{row.name_bn}</td><td className="p-2 border">{row.madrasa_name_bn}</td>
                            <td className="p-2 border text-center font-medium">{row.total_marks.toLocaleString('bn-BD')}</td>
                            <td className="p-2 border text-center font-medium">{(row.percentage || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2})}%</td>
                            <td className="p-2 border text-center">{row.grade}</td></tr>
                    ))}
                </tbody>
             </table></div>
        )}
         {!isLoading && selectedExamId && selectedMarhalaId && meritList?.length === 0 && <p className="text-center p-6 text-gray-500">এই মারহালার জন্য কোনো মেধাতালিকা পাওয়া যায়নি।</p>}
    </Card>
);

const StatisticsView: React.FC<any> = ({ examOptions, selectedExamId, setSelectedExamId, stats, isLoading }) => {
    const overallData = useMemo(() => stats ? Object.entries(stats.overall_stats.grades).map(([name, value]) => ({name, value})) : [], [stats]);
    return(
        <Card>
            <div className="p-4 no-print"><Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা নির্বাচন..." /></div>
            {isLoading && <div className="p-8 text-center text-gray-700"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block mr-2"/>পরিসংখ্যান লোড হচ্ছে...</div>}
            {stats && (
                <div className="p-4 space-y-6">
                    <Card title="সার্বিক পরিসংখ্যান" bodyClassName="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div><p className="text-sm text-gray-600">মোট পরীক্ষার্থী</p><p className="text-2xl font-bold text-black">{(Number(stats.overall_stats.total_examinees) || 0).toLocaleString()}</p></div>
                        <div><p className="text-sm text-gray-600">কৃতকার্য</p><p className="text-2xl font-bold text-green-600">{(Number(stats.overall_stats.total_passed) || 0).toLocaleString()}</p></div>
                        <div><p className="text-sm text-gray-600">অকৃতকার্য</p><p className="text-2xl font-bold text-red-600">{(Number(stats.overall_stats.total_failed) || 0).toLocaleString()}</p></div>
                        <div><p className="text-sm text-gray-600">পাশের হার</p><p className="text-2xl font-bold text-blue-600">{(Number(stats.overall_stats.pass_rate) || 0).toFixed(2)}%</p></div>
                    </Card>
                    <Card title="বিভাগ ভিত্তিক ফলাফল">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={overallData} layout="vertical"><YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12, fill: '#374151' }}/><XAxis type="number" tick={{fill: '#374151'}} /><Tooltip wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} labelStyle={{ color: '#333' }}/><Bar dataKey="value" name="ছাত্র সংখ্যা">{overallData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}</Bar></BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card title="মারহালা ভিত্তিক পরিসংখ্যান">
                        <div className="space-y-4">
                            {stats.marhala_stats.map((mStat: any) => (
                                <details key={mStat.marhala_id} className="border rounded-lg p-3"><summary className="font-semibold cursor-pointer text-black">{mStat.marhala_name}</summary>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
                                        <div><p className="text-xs text-gray-600">মোট</p><p className="font-bold text-black">{(Number(mStat.total_examinees) || 0).toLocaleString()}</p></div>
                                        <div><p className="text-xs text-gray-600">কৃতকার্য</p><p className="font-bold text-green-700">{(Number(mStat.total_passed) || 0).toLocaleString()}</p></div>
                                        <div><p className="text-xs text-gray-600">অকৃতকার্য</p><p className="font-bold text-red-700">{(Number(mStat.total_failed) || 0).toLocaleString()}</p></div>
                                        <div><p className="text-xs text-gray-600">পাশের হার</p><p className="font-bold text-blue-700">{(Number(mStat.pass_rate) || 0).toFixed(2)}%</p></div>
                                    </div>
                                    <div className="mt-2 text-xs text-black"><strong className="text-black">বিভাগসমূহ:</strong> {Object.entries(mStat.grades).map(([grade, count]) => `${grade}: ${(Number(count) || 0).toLocaleString()}`).join(' | ')}</div>
                                </details>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </Card>
    );
};

export default ViewResultsPage;