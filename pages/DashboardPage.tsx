import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import DashboardCard from '../components/DashboardCard';
import SkeletonDashboardCard from '../components/SkeletonDashboardCard';
import { DashboardStat, DashboardStat as DashboardStatsData } from '../types';
import { BuildingOffice2Icon, UsersIcon, MapPinIcon, BookOpenIcon, UserGroupIcon, UserCircleIcon } from '../components/ui/Icon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const examData = [
  { name: 'ইবতেদায়ী', 'পরীক্ষার্থী': 400, 'পাশ': 320 },
  { name: 'মুতাওয়াসসিতা', 'পরীক্ষার্থী': 300, 'পাশ': 250 },
  { name: 'সানুবিয়্যা আম্মাহ', 'পরীক্ষার্থী': 200, 'পাশ': 180 },
  { name: 'সানুবিয়্যা খাসসাহ', 'পরীক্ষার্থী': 150, 'পাশ': 130 },
  { name: 'ফযীলত', 'পরীক্ষার্থী': 100, 'পাশ': 90 },
  { name: 'তাকমীল', 'পরীক্ষার্থী': 50, 'পাশ': 45 },
];


const DashboardPage: React.FC = () => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStatsData | null> => {
      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats');
      if (rpcError) {
        throw new Error(`ড্যাশবোর্ডের তথ্য আনতে সমস্যা হয়েছে: ${rpcError.message}`);
      }
       if (!data) {
        return null; 
      }
      return data as unknown as DashboardStatsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const dashboardStats: DashboardStat[] = useMemo(() => {
    if (!statsData) return [];
    
    // Map fetched data to the DashboardStat structure
    return [
      { id: '1', title: 'মোট মাদরাসা', value: (statsData as any).total_madrasas?.toLocaleString('bn-BD') || '০', icon: <BuildingOffice2Icon /> },
      { id: '2', title: 'বালক মাদরাসা', value: (statsData as any).boys_madrasas?.toLocaleString('bn-BD') || '০', icon: <UsersIcon /> },
      { id: '3', title: 'বালিকা মাদরাসা', value: (statsData as any).girls_madrasas?.toLocaleString('bn-BD') || '০', icon: <UsersIcon /> },
      { id: '4', title: 'মোট কেন্দ্র', value: (statsData as any).total_markazes?.toLocaleString('bn-BD') || '০', icon: <MapPinIcon /> },
      { id: '5', title: 'চলতি বছরের পরীক্ষার্থী', value: (statsData as any).total_examinees_current_year?.toLocaleString('bn-BD') || '০', icon: <UserGroupIcon /> },
      { id: '6', title: 'মুমতাহিন-নেগরান', value: (statsData as any).total_teachers?.toLocaleString('bn-BD') || '০', icon: <UserCircleIcon /> },
    ];
  }, [statsData]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">ড্যাশবোর্ড</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <SkeletonDashboardCard key={index} />)
        ) : error ? (
            <div className="col-span-full p-4 text-center text-red-500 bg-red-50 rounded-lg">
                <p>ত্রুটি: {error.message}</p>
            </div>
        ) : (
            dashboardStats.map(stat => (
                <DashboardCard key={stat.id} stat={stat} />
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">পরীক্ষার্থী পরিসংখ্যান (বার্ষিক)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examData} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}> {/* Adjusted margins */}
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
              <XAxis 
                dataKey="name" 
                angle={-30} // Angle for better readability
                textAnchor="end" 
                height={70} // Increased height for angled labels
                interval={0} // Show all labels
                tick={{fontSize: 10, fill: '#666'}}
              />
              <YAxis tick={{fontSize: 10, fill: '#666'}}/>
              <Tooltip 
                wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#333', fontWeight: 'bold' }}
                itemStyle={{ color: '#52b788' }}
              />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
              <Bar dataKey="পরীক্ষার্থী" fill="#52b788" barSize={20} radius={[4, 4, 0, 0]}/>
              <Bar dataKey="পাশ" fill="#82ca9d" barSize={20} radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
           <h3 className="text-xl font-semibold text-gray-700 mb-4">সাম্প্রতিক কার্যক্রম</h3>
           <ul className="space-y-3">
            <li className="flex items-center p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full mr-3">নতুন</span>
                <p className="text-gray-700 text-sm">নতুন মাদরাসা (কোড: M1024) অনুমোদিত হয়েছে।</p>
                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">২ ঘন্টা আগে</span>
            </li>
            <li className="flex items-center p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors">
                <span className="bg-sky-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full mr-3">আপডেট</span>
                <p className="text-gray-700 text-sm">ফযীলত বর্ষের পরীক্ষার ফলাফল প্রকাশিত হয়েছে।</p>
                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">গতকাল</span>
            </li>
             <li className="flex items-center p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full mr-3">পেন্ডিং</span>
                <p className="text-gray-700 text-sm">৩টি সনদের আবেদন পর্যালোচনার অপেক্ষায়।</p>
                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">৩ দিন আগে</span>
            </li>
             <li className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full mr-3">নিয়োগ</span>
                <p className="text-gray-700 text-sm">নতুন ৫ জন পরীক্ষক নিয়োগ সম্পন্ন হয়েছে।</p>
                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">৪ দিন আগে</span>
            </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;