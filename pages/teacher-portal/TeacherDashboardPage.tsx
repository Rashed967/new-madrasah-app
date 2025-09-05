
import React from 'react';
import { Card } from '../../components/ui/Card';
import { HomeIcon, ClipboardDocumentListIcon, UserCircleIcon, Cog6ToothIcon } from '../../components/ui/Icon';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  bgColorClass?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ title, value, icon, bgColorClass = "bg-emerald-500" }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center p-4">
        <div className={`p-3 rounded-full ${bgColorClass} text-white mr-4`}>
          {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </Card>
  );
};

const TeacherDashboardPage: React.FC = () => {
  // Mock data for teacher dashboard
  const teacherStats = [
    { title: "মোট ক্লাস", value: 5, icon: <HomeIcon />, bgColorClass: "bg-blue-500" },
    { title: "আসন্ন পরীক্ষা", value: 2, icon: <ClipboardDocumentListIcon />, bgColorClass: "bg-yellow-500" },
    { title: "ছাত্র সংখ্যা", value: 120, icon: <UserCircleIcon />, bgColorClass: "bg-green-500" },
    { title: "পঠিতব্য কিতাব", value: 8, icon: <Cog6ToothIcon />, bgColorClass: "bg-purple-500" },
  ];

  const recentActivities = [
    { id: 1, text: "মিজানুস সরফ কিতাবের নতুন এসাইনমেন্ট যোগ করা হয়েছে।", time: "২ ঘন্টা আগে" },
    { id: 2, text: "আপনার প্রোফাইল তথ্য আপডেট করা হয়েছে।", time: "গতকাল" },
    { id: 3, text: "বার্ষিক পরীক্ষার রুটিন প্রকাশিত হয়েছে।", time: "৩ দিন আগে" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800">শিক্ষক ড্যাশবোর্ড</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teacherStats.map(stat => (
          <DashboardStatCard 
            key={stat.title}
            title={stat.title}
            value={stat.value.toLocaleString('bn-BD')}
            icon={stat.icon}
            bgColorClass={stat.bgColorClass}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="সাম্প্রতিক কার্যক্রম" className="shadow-lg">
          <ul className="space-y-3">
            {recentActivities.map(activity => (
              <li key={activity.id} className="flex items-start p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex-shrink-0 h-3 w-3 bg-emerald-500 rounded-full mt-1.5"></div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="নোটিশ বোর্ড" className="shadow-lg">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              জরুরী নোটিশ: আগামীকালের ক্লাস অনলাইনে অনুষ্ঠিত হবে।
            </p>
            <p className="text-sm text-gray-700 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              সকল শিক্ষকদের আগামী সপ্তাহের মধ্যে পরীক্ষার প্রশ্নপত্র জমা দেওয়ার জন্য অনুরোধ করা হচ্ছে।
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;