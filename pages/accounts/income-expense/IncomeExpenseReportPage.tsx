
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { Select } from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';
import { ComprehensiveReportData, TransactionCategory, SelectOption, MonthlySummaryItem } from '../../../types';
import { ArrowPathIcon, CurrencyBangladeshiIcon, DocumentChartBarIcon, PrinterIcon, ArrowsUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '../../../components/ui/Icon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { useToast } from '../../../contexts/ToastContext';

// Helper for Recharts Pie Chart Active Shape
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">{payload.category_name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">{`${value.toLocaleString('bn-BD')} ৳`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">{`(প্রায় ${(percent * 100).toFixed(2)}%)`}</text>
    </g>
  );
};

// Main Component
const IncomeExpenseReportPage: React.FC = () => {
    const { addToast } = useToast();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
    const [activePieIndex, setActivePieIndex] = useState(0);

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: 'transaction_date' | 'amount'; direction: 'ascending' | 'descending' } | null>({ key: 'transaction_date', direction: 'descending' });

    const { data: categories = [], isLoading: isLoadingCategories } = useQuery<TransactionCategory[], Error>({
        queryKey: ['transaction_categories_for_report_filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('transaction_categories').select('*').order('name');
            if (error) throw new Error(error.message);
            return data || [];
        },
    });

    const categoryOptions = useMemo(() => [
        { value: '', label: 'সকল খাত' },
        { value: 'all_income', label: 'সকল খাত (আয়)' },
        { value: 'all_expense', label: 'সকল খাত (ব্যয়)' },
        { value: 'registration_fee_income', label: 'রেজিস্ট্রেশন ফি আয় (আয়)' }, // New category
        { value: 'exam_fee_income', label: 'পরীক্ষা ফি আয় (আয়)' }, // New category
        ...categories.map(c => ({ value: c.id, label: `${c.name} (${c.type === 'income' ? 'আয়' : 'ব্যয়'})` }))
    ], [categories]);


    const { data: reportData, isLoading, error, refetch } = useQuery<ComprehensiveReportData, Error>({
        queryKey: ['transaction_report', startDate, endDate],
        queryFn: async () => {
            const { data, error: rpcError } = await supabase.rpc('get_comprehensive_financial_report', {
                p_start_date: startDate,
                p_end_date: endDate,
            });
            if (rpcError) throw rpcError;
            return data;
        },
        enabled: !!startDate && !!endDate,
    });
    
    if (error) { addToast(`রিপোর্ট আনতে সমস্যা: ${error.message}`, 'error'); }

    const onPieEnter = (_: any, index: number) => setActivePieIndex(index);

    const filteredReportData = useMemo<ComprehensiveReportData | null>(() => {
        if (!reportData) return null;
        if (!selectedCategoryId) return reportData;

        let filteredDetails = reportData.details;
        let newCategorySummary = reportData.category_summary;

        if (selectedCategoryId === 'all_income') {
            filteredDetails = reportData.details.filter(item => item.type === 'income');
            const incomeCategoryNames = categories.filter(c => c.type === 'income').map(c => c.name);
            newCategorySummary = reportData.category_summary.filter(item => incomeCategoryNames.includes(item.category_name) || item.category_name === 'Registration Fee Income' || item.category_name === 'Exam Fee Income');
        } else if (selectedCategoryId === 'all_expense') {
            filteredDetails = reportData.details.filter(item => item.type === 'expense');
            const expenseCategoryNames = categories.filter(c => c.type === 'expense').map(c => c.name);
            newCategorySummary = reportData.category_summary.filter(item => expenseCategoryNames.includes(item.category_name));
        } else if (selectedCategoryId === 'registration_fee_income') {
            filteredDetails = reportData.details.filter(item => item.category_name === 'Registration Fee Income');
            newCategorySummary = reportData.category_summary.filter(item => item.category_name === 'Registration Fee Income');
        } else if (selectedCategoryId === 'exam_fee_income') {
            filteredDetails = reportData.details.filter(item => item.category_name === 'Exam Fee Income');
            newCategorySummary = reportData.category_summary.filter(item => item.category_name === 'Exam Fee Income');
        } else {
            const selectedCategory = categories.find(c => c.id === selectedCategoryId);
            if (selectedCategory) {
                filteredDetails = reportData.details.filter(
                    item => item.category_name === selectedCategory.name
                );
                newCategorySummary = reportData.category_summary.filter(
                    item => item.category_name === selectedCategory.name
                );
            }
        }

        const newSummary = filteredDetails.reduce(
            (acc, item) => {
                if (item.type === 'income') {
                    acc.total_transaction_income += item.amount;
                } else {
                    acc.total_expense += item.amount;
                }
                return acc;
            },
            { total_transaction_income: 0, total_inspection_income: 0, total_expense: 0 }
        );

        const newMonthlySummary: MonthlySummaryItem[] = filteredDetails.reduce((acc, item) => {
            const month = item.transaction_date.substring(0, 7); // YYYY-MM
            let monthSummary = acc.find(ms => ms.month === month);
            if (!monthSummary) {
                monthSummary = { month, total_income: 0, total_expense: 0 };
                acc.push(monthSummary);
            }
            if (item.type === 'income') monthSummary.total_income += item.amount;
            else monthSummary.total_expense += item.amount;
            return acc;
        }, [] as MonthlySummaryItem[]).sort((a, b) => a.month.localeCompare(b.month));

        return {
            summary: {
                total_transaction_income: newSummary.total_transaction_income,
                total_inspection_income: newSummary.total_inspection_income,
                total_expense: newSummary.total_expense,
                net_profit_loss: newSummary.total_transaction_income + newSummary.total_inspection_income - newSummary.total_expense,
            },
            details: filteredDetails,
            category_summary: newCategorySummary,
            monthly_summary: newMonthlySummary,
        };
    }, [reportData, selectedCategoryId, categories]);


    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
      if (percent < 0.05) return null; // Don't render label for small slices
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSort = (key: 'transaction_date' | 'amount') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedDetails = useMemo(() => {
        if (!filteredReportData?.details) return [];
        const details = [...filteredReportData.details];

        if (sortConfig !== null) {
            details.sort((a, b) => {
                let valA, valB;
                if (sortConfig.key === 'transaction_date') {
                    valA = new Date(a.transaction_date).getTime();
                    valB = new Date(b.transaction_date).getTime();
                } else {
                    valA = a.amount;
                    valB = b.amount;
                }

                if (valA < valB) { return sortConfig.direction === 'ascending' ? -1 : 1; }
                if (valA > valB) { return sortConfig.direction === 'ascending' ? 1 : -1; }
                return 0;
            });
        }
        return details;
    }, [filteredReportData, sortConfig]);

    const resetFilters = () => {
        setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        setSelectedCategoryId('');
        setSortConfig({ key: 'transaction_date', direction: 'descending' });
    };

  const getBanglaCategoryName = (categoryName: string) => {
        switch (categoryName) {
            case 'Registration Fee Income':
                return 'রেজিস্ট্রেশন ফি আয়';
            case 'Exam Fee Income':
                return 'পরীক্ষা ফি আয়';
            default:
                return categoryName; // Return original if no translation is found
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center no-print">
        <h2 className="text-3xl font-semibold text-gray-800">আয়-ব্যয় রিপোর্ট</h2>
         <Button onClick={handlePrint} variant="outline" leftIcon={<PrinterIcon className="w-4 h-4" />}>প্রিন্ট করুন</Button>
      </div>

      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <CustomDatePicker id="start_date" label="শুরুর তারিখ" value={startDate} onChange={setStartDate} />
          <CustomDatePicker id="end_date" label="শেষ তারিখ" value={endDate} onChange={setEndDate} />
          <Select
            label="খাত অনুযায়ী ফিল্টার"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            options={categoryOptions}
            disabled={isLoadingCategories}
          />
          <div className="flex space-x-2">
            <Button onClick={() => refetch()} disabled={isLoading} className="h-10 w-full"> {isLoading ? 'লোড হচ্ছে...' : 'রিপোর্ট দেখুন'}</Button>
            <Button onClick={resetFilters} variant="secondary" className="h-10">রিসেট</Button>
          </div>
        </div>
      </Card>
      
      {isLoading ? ( <div className="flex justify-center items-center p-10"><ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mr-3" /><p>রিপোর্ট লোড হচ্ছে...</p></div>) : 
       error ? ( <div className="text-red-500 text-center p-6">রিপোর্ট আনতে ব্যর্থ হয়েছে।</div> ) : 
       filteredReportData ? (
        <div className="printable-content space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-100"><p className="text-lg text-green-800">মোট আয়</p><p className="text-2xl font-bold text-green-600">{((filteredReportData.summary.total_transaction_income + filteredReportData.summary.total_inspection_income) || 0).toLocaleString('bn-BD')} ৳</p></Card>
                <Card className="bg-red-100"><p className="text-lg text-red-800">মোট ব্যয়</p><p className="text-2xl font-bold text-red-600">{(filteredReportData.summary.total_expense || 0).toLocaleString('bn-BD')} ৳</p></Card>
                
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="মাসিক আয়-ব্যয়ের তুলনা">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={filteredReportData.monthly_summary} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{fontSize: 10}}/>
                        <YAxis tickFormatter={(value) => `${value.toLocaleString('bn-BD')}`} tick={{fontSize: 10}}/>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('bn-BD')} ৳`} />
                        <Legend />
                        <Bar dataKey="total_income" name="আয়" fill="#4ade80" />
                        <Bar dataKey="total_expense" name="ব্যয়" fill="#f87171" />
                        </BarChart>
                    </ResponsiveContainer>
                 </Card>
                 <Card title="ব্যয়ের খাতসমূহ">
                     <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                             {/* @ts-ignore */}
                             <Pie data={filteredReportData.category_summary} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={80} fill="#8884d8" dataKey="total_amount" nameKey="category_name" activeIndex={activePieIndex} activeShape={renderActiveShape} onMouseEnter={onPieEnter}>
                                {filteredReportData.category_summary.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                             </Pie>
                             <Tooltip formatter={(value: number) => `${value.toLocaleString('bn-BD')} ৳`} />
                         </PieChart>
                     </ResponsiveContainer>
                 </Card>
            </div>
            
             <Card title="বিস্তারিত লেনদেন তালিকা">
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">রসিদ নং</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                                <button onClick={() => handleSort('transaction_date')} className="flex items-center justify-end w-full">
                                    তারিখ
                                    {sortConfig?.key === 'transaction_date' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-4 h-4 ml-1"/> : <ChevronDownIcon className="w-4 h-4 ml-1"/>) : <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-400"/>}
                                </button>
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">খাত</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">প্রদানকারী/গ্রহীতা</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">বিবরণ</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                                <button onClick={() => handleSort('amount')} className="flex items-center justify-end w-full">
                                    পরিমাণ (৳)
                                    {sortConfig?.key === 'amount' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-4 h-4 ml-1"/> : <ChevronDownIcon className="w-4 h-4 ml-1"/>) : <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-400"/>}
                                </button>
                            </th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedDetails.map(item => (
                                <tr key={item.id}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-black">
                                        {(item.category_name === 'Registration Fee Income' || item.category_name === 'Exam Fee Income') ? item.id : '-'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-black">{new Date(item.transaction_date).toLocaleDateString('bn-BD')}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-black">{getBanglaCategoryName(item.category_name)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-black">{item.party_name || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-black">{item.description || '-'}</td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-sm font-semibold text-right ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                       {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString('bn-BD')}
                                    </td>
                                </tr>
                            ))}
                             {sortedDetails.length === 0 && (<tr><td colSpan={5} className="text-center py-6 text-gray-500">এই ফিল্টারে কোনো লেনদেন পাওয়া যায়নি।</td></tr>)}
                        </tbody>
                    </table>
                </div>
             </Card>
        </div>
        ) : null
      }
    </div>
  );
};

export default IncomeExpenseReportPage;
