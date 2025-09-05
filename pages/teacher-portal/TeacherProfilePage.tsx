
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input'; // For potential edit mode
import { User } from '../../types'; // Assuming User type exists
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarDaysIcon, IdentificationIcon, AcademicCapIcon, HomeIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';

const TeacherProfilePage: React.FC = () => {
  const { addToast } = useToast();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [isEditMode, setIsEditMode] = useState(false); // For future edit functionality

  useEffect(() => {
    const storedUser = localStorage.getItem('teacher_user');
    if (storedUser) {
      setTeacher(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock additional teacher details (these would normally come from a specific teacher profile API call)
  const mockTeacherDetails = {
    nid: '1234567890123',
    dateOfBirth: '১৯৮৫-০৫-১৫',
    gender: 'পুরুষ',
    department: 'আরবি সাহিত্য',
    qualification: 'কামিল (ফিকহ)',
    joiningDate: '২০১০-০১-১০',
    address: 'গ্রাম: উদাহরণপুর, উপজেলা: নমুনা, জেলা: ঢাকা',
  };

  if (isLoading) {
    return <div className="text-center p-10">প্রোফাইল লোড হচ্ছে...</div>;
  }

  if (!teacher) {
    return <div className="text-center p-10 text-red-500">শিক্ষকের তথ্য পাওয়া যায়নি।</div>;
  }
  
  const ProfileDetailItem: React.FC<{ label: string; value?: string | null; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-emerald-600 mr-3">{icon}</span>
      <span className="text-sm text-gray-600 w-40">{label}:</span>
      <span className="text-sm font-medium text-gray-800">{value || <span className="italic text-gray-400">নেই</span>}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-gray-800">আমার প্রোফাইল</h2>
        {/* <Button onClick={() => setIsEditMode(!isEditMode)} variant={isEditMode ? "secondary" : "primary"}>
          {isEditMode ? "বাতিল করুন" : "তথ্য সম্পাদনা করুন"}
        </Button> */}
      </div>

      <Card className="shadow-xl">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
              {teacher.avatarUrl ? (
                <img src={teacher.avatarUrl} alt={teacher.name} className="w-32 h-32 rounded-full object-cover border-4 border-emerald-200 shadow-md" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-emerald-200 shadow-md">
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-emerald-700">{teacher.name}</h3>
              <p className="text-md text-gray-600">{mockTeacherDetails.department} বিভাগ</p>
              <p className="text-sm text-gray-500">শিক্ষক আইডি: {teacher.id}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">ব্যক্তিগত তথ্য</h4>
                    <ProfileDetailItem label="পুরো নাম" value={teacher.name} icon={<UserCircleIcon className="w-5 h-5"/>} />
                    <ProfileDetailItem label="ইমেইল" value={teacher.email} icon={<EnvelopeIcon className="w-5 h-5"/>}/>
                    <ProfileDetailItem label="NID নম্বর" value={mockTeacherDetails.nid} icon={<IdentificationIcon className="w-5 h-5"/>}/>
                    <ProfileDetailItem label="জন্ম তারিখ" value={mockTeacherDetails.dateOfBirth} icon={<CalendarDaysIcon className="w-5 h-5"/>}/>
                    <ProfileDetailItem label="লিঙ্গ" value={mockTeacherDetails.gender} icon={<UserCircleIcon className="w-5 h-5"/>}/> {/* Better icon needed */}
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">একাডেমিক ও প্রাতিষ্ঠানিক তথ্য</h4>
                    <ProfileDetailItem label="শিক্ষাগত যোগ্যতা" value={mockTeacherDetails.qualification} icon={<AcademicCapIcon className="w-5 h-5"/>}/>
                    <ProfileDetailItem label="যোগদানের তারিখ" value={mockTeacherDetails.joiningDate} icon={<CalendarDaysIcon className="w-5 h-5"/>}/>
                    <ProfileDetailItem label="মোবাইল নম্বর" value={"01700000000"} icon={<PhoneIcon className="w-5 h-5"/>}/> 
                    <ProfileDetailItem label="ঠিকানা" value={mockTeacherDetails.address} icon={<HomeIcon className="w-5 h-5"/>}/>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default TeacherProfilePage;