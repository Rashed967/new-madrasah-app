import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { Exam, SelectOption, IndividualResult, MadrasaWiseResult, Marhala, MarhalaApiResponse } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ArrowPathIcon, MagnifyingGlassIcon, PrinterIcon, BuildingOffice2Icon, UserCircleIcon } from '../../components/ui/Icon';
import Logo from '../../assets/Logo';
import { APP_TITLE_BN } from '../../constants';

const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn, nameAr: apiMarhala.name_ar || undefined,
  type: apiMarhala.type, category: apiMarhala.category, kitabIds: apiMarhala.kitab_ids || [],
  marhala_order: apiMarhala.marhala_order, requiresPhoto: apiMarhala.requires_photo || false, createdAt: apiMarhala.created_at, updatedAt: apiMarhala.updated_at,
});

const PublicResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('individual');

  const tabs = [
    { id: 'individual', label: 'ব্যক্তিগত ফলাফল', icon: <UserCircleIcon className="w-5 h-5"/>, content: <IndividualResultView /> },
    { id: 'madrasa', label: 'মাদ্রাসাওয়ারি ফলাফল', icon: <BuildingOffice2Icon className="w-5 h-5"/>, content: <MadrasaResultView /> },
  ];

  return (
    <div className="space-y-6">
       <Card>
          <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
       </Card>
    </div>
  );
};

// --- Individual Result Component ---
const IndividualResultView: React.FC = () => {
  const { addToast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedMarhalaId, setSelectedMarhalaId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: exams = [] } = useQuery<Exam[], Error>({
    queryKey: ['publiclyAvailableExamsForIndividual'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*').in('status', ['completed']).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Exam[];
    },
  });

  const { data: marhalas = [] } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForResults'],
    queryFn: async () => {
      const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order');
      if (error) throw error;
      return (data || []).map(mapApiMarhalaToFrontend);
    }
  });

  const { data: result, isLoading, isError, error, refetch } = useQuery<IndividualResult | null, Error>({
    queryKey: ['publicIndividualResult', selectedExamId, selectedMarhalaId, rollNumber, registrationNumber, searchTrigger],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_individual_result_details', {
        p_exam_id: selectedExamId, p_marhala_id: selectedMarhalaId,
        p_roll_number: parseInt(rollNumber, 10), p_registration_number: parseInt(registrationNumber, 10),
      });
      if (rpcError) throw rpcError;
      if (!data || Object.keys(data).length === 0) { addToast('প্রদত্ত তথ্যের জন্য কোনো ফলাফল পাওয়া যায়নি।', 'info'); return null; }
      return data;
    },
    enabled: false,
  });

  useEffect(() => { if (searchTrigger > 0) refetch(); }, [searchTrigger, refetch]);

  const examOptions = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);
  const marhalaOptions = useMemo(() => marhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'})` })), [marhalas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) { addToast('পরীক্ষা নির্বাচন করুন।', 'warning'); return; }
    if (!selectedMarhalaId) { addToast('মারহালা নির্বাচন করুন।', 'warning'); return; }
    if (!rollNumber) { addToast('রোল নম্বর লিখুন।', 'warning'); return; }
    if (!registrationNumber) { addToast('রেজিস্ট্রেশন নম্বর লিখুন।', 'warning'); return; }
    setSearchTrigger(prev => prev + 1);
  };
  
  return (
    <div className="space-y-4 p-4">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা..." required wrapperClassName="mb-0" />
        <Select label="মারহালা" value={selectedMarhalaId} onChange={e => setSelectedMarhalaId(e.target.value)} options={marhalaOptions} placeholderOption="মারহালা..." required wrapperClassName="mb-0"/>
        <Input label="রোল নম্বর" type="number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="রোল..." required wrapperClassName="mb-0"/>
        <Input label="রেজিস্ট্রেশন নম্বর" type="number" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="রেজি. নং..." required wrapperClassName="mb-0"/>
        <Button type="submit" disabled={isLoading} className="w-full h-10"> {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <MagnifyingGlassIcon className="w-5 h-5"/>} <span className="ml-2">খুঁজুন</span> </Button>
      </form>
      {isLoading && <div className="p-8 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block mr-2 text-emerald-600"/>ফলাফল লোড হচ্ছে...</div>}
      {isError && <div className="p-8 text-center text-red-600">ত্রুটি: {error.message}</div>}
      {result && <IndividualResultDisplay result={result} />}
    </div>
  );
};

// --- Madrasa Result Component ---
const MadrasaResultView: React.FC = () => {
    const { addToast } = useToast();
    const [selectedExamId, setSelectedExamId] = useState('');
    const [madrasaCode, setMadrasaCode] = useState('');
    const [muhtamimMobile, setMuhtamimMobile] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);

    const { data: exams = [] } = useQuery<Exam[], Error>({
        queryKey: ['publiclyAvailableExamsForMadrasa'],
        queryFn: async () => { const { data, error } = await supabase.from('exams').select('*').in('status', ['completed']).order('created_at', { ascending: false }); if (error) throw error; return (data || []) as Exam[]; },
    });
    const examOptions = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);

    const { data: result, isLoading, isError, error, refetch } = useQuery<MadrasaWiseResult | null, Error>({
        queryKey: ['madrasaWiseResult', selectedExamId, madrasaCode, muhtamimMobile, searchTrigger],
        queryFn: async () => {
            const { data, error: rpcError } = await supabase.rpc('get_madrasa_results', { p_exam_id: selectedExamId, p_madrasa_code: parseInt(madrasaCode, 10), p_muhtamim_mobile: muhtamimMobile });
            if (rpcError) throw new Error(rpcError.message);
            if (!data || !data.madrasa_details) { addToast('প্রদত্ত তথ্যের জন্য কোনো ফলাফল পাওয়া যায়নি।', 'info'); return null; }
            return data;
        },
        enabled: false,
        retry: false,
    });
    
    useEffect(() => { if (searchTrigger > 0) refetch(); }, [searchTrigger, refetch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamId) { addToast('পরীক্ষা নির্বাচন করুন।', 'warning'); return; }
        if (!madrasaCode) { addToast('মাদ্রাসা কোড লিখুন।', 'warning'); return; }
        if (!muhtamimMobile) { addToast('মুহতামিমের মোবাইল নম্বর লিখুন।', 'warning'); return; }
        setSearchTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-4 p-4">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা নির্বাচন..." wrapperClassName="mb-0"/>
                <Input label="মাদ্রাসা কোড" type="number" value={madrasaCode} onChange={e => setMadrasaCode(e.target.value)} placeholder="মাদ্রাসা কোড..." required wrapperClassName="mb-0"/>
                <Input label="মুহতামিমের মোবাইল" type="tel" value={muhtamimMobile} onChange={e => setMuhtamimMobile(e.target.value)} placeholder="মোবাইল নম্বর..." required wrapperClassName="mb-0"/>
                <Button type="submit" disabled={isLoading} className="w-full h-10"> {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <MagnifyingGlassIcon className="w-5 h-5"/>} <span className="ml-2">খুঁজুন</span> </Button>
            </form>
            {isLoading && <div className="p-8 text-center"><ArrowPathIcon className="w-6 h-6 animate-spin inline-block mr-2 text-emerald-600"/>ফলাফল লোড হচ্ছে...</div>}
            {isError && <div className="p-8 text-center text-red-600">ত্রুটি: {error.message}</div>}
            {result && <MadrasaResultDisplay result={result} />}
        </div>
    );
};

// --- Display Components ---
const IndividualResultDisplay: React.FC<{ result: IndividualResult }> = ({ result }) => {
  const handlePrint = () => {
    const printableContent = document.getElementById("individual-result-print-area")?.innerHTML;
    if (printableContent) {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>ফলাফল - ${result.examinee_details.name_bn}</title><style>body{font-family: SolaimanLipi, sans-serif;}.result-sheet{margin: 1rem auto; padding: 1rem; border: 1px solid #ddd; max-width: 100%;} table{width: 100%; border-collapse: collapse;} th, td{border: 1px solid #ddd; padding: 8px; text-align: left;} thead{background-color: #f2f2f2;} h1,h2,h3{text-align:center;} .no-print{display:none;}</style></head><body>${printableContent}</body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    }
  };
  return (
    <Card className="mt-6">
        <div id="individual-result-print-area">
            <ResultSheetLayout result={result} />
        </div>
        <div className="p-4 text-center border-t no-print"><Button variant="outline" onClick={handlePrint} leftIcon={<PrinterIcon className="w-4 h-4" />}>রিসিপ্ট প্রিন্ট করুন</Button></div>
    </Card>
  );
};

const MadrasaResultDisplay: React.FC<{ result: MadrasaWiseResult }> = ({ result }) => {
  const handlePrint = () => window.print();

  const marhalaDataWithKitabs = useMemo(() => {
    return (result.results_by_marhala || []).map(marhalaGroup => {
      const kitabsForMarhala = marhalaGroup.results[0]?.subject_marks?.map(sm => sm.kitab_name) || [];
      return { ...marhalaGroup, kitabs: kitabsForMarhala };
    });
  }, [result.results_by_marhala]);

  return (
    <Card className="mt-6">
      <div id="madrasa-result-print-area" className="printable-content p-4">
         <style>{`@media print { body * { visibility: hidden; } #madrasa-result-print-area, #madrasa-result-print-area * { visibility: visible; } #madrasa-result-print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none; } }`}</style>
         <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-black">{result.exam_details.name}</h2>
            <h3 className="text-xl text-black">{result.madrasa_details.name_bn} (কোড: {result.madrasa_details.madrasa_code.toLocaleString('bn-BD')})</h3>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-4 bg-gray-50 rounded-lg mb-6">
            <div><p className="text-sm text-gray-600">মোট পরীক্ষার্থী</p><p className="text-xl font-bold text-black">{(result.summary.total_examinees || 0).toLocaleString('bn-BD')}</p></div>
            <div><p className="text-sm text-gray-600">কৃতকার্য</p><p className="text-xl font-bold text-green-600">{(result.summary.total_passed || 0).toLocaleString('bn-BD')}</p></div>
            <div><p className="text-sm text-gray-600">অকৃতকার্য</p><p className="text-xl font-bold text-red-600">{(result.summary.total_failed || 0).toLocaleString('bn-BD')}</p></div>
            <div><p className="text-sm text-gray-600">পাশের হার</p><p className="text-xl font-bold text-blue-600">{(result.summary.pass_rate || 0).toFixed(2)}%</p></div>
         </div>
         <div className="space-y-8">
           {marhalaDataWithKitabs.map((marhalaGroup, marhalaIndex) => (
             <div key={marhalaGroup.marhala_id || marhalaIndex}>
               <h4 className="text-xl font-semibold mb-2 bg-emerald-100 p-2 rounded text-emerald-800 text-center">{marhalaGroup.marhala_name}</h4>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        {['ক্রমিক', 'রোল', 'নাম', 'মেধাস্থান', ...marhalaGroup.kitabs, 'মোট', 'গড় (%)', 'বিভাগ', 'ফলাফল'].map(h => <th key={h} className="p-2 border text-black text-xs">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {marhalaGroup.results.map((res, index) => {
                        const marksMap = new Map(res.subject_marks?.map(sm => [sm.kitab_name, sm.obtained_marks]));
                        return (
                            <tr key={res.examinee_id} className="border-t">
                              <td className="p-2 border text-center text-black">{(index + 1).toLocaleString('bn-BD')}</td>
                              <td className="p-2 border text-center font-medium text-black">{res.roll_number.toLocaleString('bn-BD')}</td>
                              <td className="p-2 border text-black whitespace-nowrap">{res.name_bn}</td>
                              <td className="p-2 border text-center text-black">{res.position_details || '-'}</td>
                              {marhalaGroup.kitabs.map(kitabName => (
                                <td key={kitabName} className="p-2 border text-center text-black">{marksMap.get(kitabName)?.toLocaleString('bn-BD') ?? 'N/A'}</td>
                              ))}
                              <td className="p-2 border text-center font-medium text-black">{res.total_marks.toLocaleString('bn-BD')}</td>
                              <td className="p-2 border text-center text-black">{(res.percentage || 0).toFixed(2)}%</td>
                              <td className="p-2 border text-center text-black">{res.grade}</td>
                              <td className={`p-2 border text-center font-semibold ${res.status === 'কৃতকার্য' ? 'text-green-700' : 'text-red-700'}`}>{res.status}</td>
                            </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
             </div>
           ))}
         </div>
      </div>
      <div className="p-4 text-center border-t no-print"><Button variant="outline" onClick={handlePrint} leftIcon={<PrinterIcon className="w-4 h-4"/>}>ফলাফল প্রিন্ট করুন</Button></div>
    </Card>
  );
};


const ResultSheetLayout: React.FC<{ result: IndividualResult }> = ({ result }) => {
  if (!result) {
    return <div className="text-center p-4 text-red-500">ফলাফলের তথ্য পাওয়া যায়নি।</div>;
  }
  const { examinee_details, madrasa_details, marhala_details, exam_details, result_summary, subject_marks } = result;

  return (
    <div className="result-sheet bg-white p-6 border rounded-lg max-w-4xl mx-auto">
       <style>{`
          .result-sheet .header-arabic { font-family: 'Times New Roman', serif; font-size: 20pt; font-weight: bold; }
          .result-sheet .header-bangla { font-size: 18pt; font-weight: bold; margin-top: -5px; }
       `}</style>
      <div className="text-center mb-6">
        <p className="header-arabic">بسم الله الرحمن الرحيم</p>
        <div className="flex items-center justify-center mt-2">
            <Logo className="h-14 w-14 mr-4" />
            <div>
                 <h1 className="header-bangla">{APP_TITLE_BN}</h1>
                 <p className="text-lg">{exam_details?.name}</p>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6 border-y py-4">
        <div><strong>নাম:</strong> {examinee_details?.name_bn}</div>
        <div><strong>রোল নং:</strong> {examinee_details?.roll_number?.toLocaleString('bn-BD')}</div>
        <div><strong>পিতার নাম:</strong> {examinee_details?.father_name_bn}</div>
        <div><strong>রেজি. নং:</strong> {examinee_details?.registration_number?.toLocaleString('bn-BD')}</div>
        <div><strong>মাদরাসা:</strong> {madrasa_details?.name_bn} ({madrasa_details?.madrasa_code?.toLocaleString('bn-BD')})</div>
        <div><strong>মারহালা:</strong> {marhala_details?.name_bn}</div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-center">বিষয়ভিত্তিক নম্বর</h3>
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100"><tr><th className="border p-2">বিষয়</th><th className="border p-2 w-28">পূর্ণ নম্বর</th><th className="border p-2 w-28">প্রাপ্ত নম্বর</th></tr></thead>
          <tbody>{(subject_marks || []).map((subject, index) => (<tr key={index}><td className="border p-2">{subject.kitab_name}</td><td className="border p-2 text-center">{subject.full_marks?.toLocaleString('bn-BD')}</td><td className="border p-2 text-center">{subject.obtained_marks?.toLocaleString('bn-BD')}</td></tr>))}</tbody>
          <tfoot className="font-bold"><tr className="bg-gray-100"><td className="border p-2 text-right">মোট নম্বর</td><td colSpan={2} className="border p-2 text-center">{result_summary?.total_marks?.toLocaleString('bn-BD')}</td></tr></tfoot>
        </table>
      </div>
      <div className="flex justify-around items-center text-center p-4 bg-gray-50 rounded-lg">
        <div><p className="text-sm text-gray-600">গড়</p><p className="text-xl font-bold">{(result_summary?.percentage || 0).toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</p></div>
        <div><p className="text-sm text-gray-600">বিভাগ</p><p className="text-xl font-bold">{result_summary?.grade}</p></div>
        <div><p className="text-sm text-gray-600">ফলাফল</p><p className={`text-xl font-bold ${result_summary?.status === 'কৃতকার্য' ? 'text-green-600' : 'text-red-600'}`}>{result_summary?.status}</p></div>
      </div>
       <p className="text-xs text-center text-gray-500 mt-4">প্রকাশের তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
    </div>
  );
};


export default PublicResultsPage;