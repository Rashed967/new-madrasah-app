
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Logo from '../../assets/Logo';
import { APP_TITLE_BN, PRIMARY_COLOR } from '../../constants';

const TeacherSignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center p-6">
          <Logo className="mb-4" primaryColor={PRIMARY_COLOR} />
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">শিক্ষক নিবন্ধন</h1>
          <p className="text-sm text-gray-600 mb-8">নতুন শিক্ষক একাউন্ট তৈরি করুন</p>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-gray-700 mb-6">
            এই মুহূর্তে শিক্ষক নিবন্ধন প্রক্রিয়াটি ম্যানুয়ালি সম্পন্ন করা হচ্ছে। 
            অনুগ্রহ করে বোর্ডের এডমিন অফিসে যোগাযোগ করুন।
          </p>
          <Button onClick={() => navigate('/teacher/login')} className="w-full" size="lg">
            লগইন পেইজে ফিরে যান
          </Button>
        </div>
      </Card>
       <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {APP_TITLE_BN}. সর্বস্বত্ব সংরক্ষিত।
      </p>
    </div>
  );
};

export default TeacherSignupPage;
