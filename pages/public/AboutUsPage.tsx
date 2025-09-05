

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { UserCircleIcon, PhoneIcon, ArrowPathIcon, EnvelopeIcon, MapPinIcon } from '../../components/ui/Icon';

interface Official {
  id: string;
  name: string;
  designation: string;
  image_url: string;
}

const AboutUsPage: React.FC = () => {
  const { data: officials = [], isLoading, error } = useQuery<Official[], Error>({
    queryKey: ['activeOfficials'],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_active_officials');
      if (rpcError) {
        console.error("Error fetching officials:", rpcError);
        throw new Error(rpcError.message);
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-emerald-700">আমাদের সম্পর্কে</h1>
        <p className="mt-2 text-lg text-gray-600">দ্বীনি শিক্ষার প্রসারে আমাদের পথচলা</p>
      </section>

      <section>
        <Card>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">লক্ষ্য ও উদ্দেশ্য</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              জাতীয় দ্বীনি মাদরাসা শিক্ষাবোর্ড বাংলাদেশ একটি অরাজনৈতিক ও সেবামূলক প্রতিষ্ঠান। বাংলাদেশের কওমি মাদরাসাসমূহের মাঝে একটি সুশৃঙ্খল পাঠ্যক্রম তৈরি, মাদরাসাসমূহের সার্বিক তত্ত্বাবধান, প্রয়োজনীয় পরামর্শ প্রদান, এবং কেন্দ্রীয়ভাবে পরীক্ষার ব্যবস্থা গ্রহণের মাধ্যমে কওমি মাদরাসা শিক্ষার মানোন্নয়নই আমাদের প্রধান লক্ষ্য।
            </p>
            <p>
              আমরা বিশ্বাস করি, সঠিক শিক্ষা ও নৈতিকতার সমন্বয়ে একটি আদর্শ সমাজ গঠন সম্ভব। তাই, কুরআন ও সুন্নাহর আলোকে একটি যুগোপযোগী ও কার্যকর শিক্ষাব্যবস্থা নিশ্চিত করতে আমরা প্রতিজ্ঞাবদ্ধ।
            </p>
          </div>
        </Card>
      </section>
      
      <section>
        <Card>
           <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">পরিচালনা পর্ষদ</h2>
           {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="ml-3 text-gray-600">তথ্য লোড হচ্ছে...</p>
            </div>
           ) : error ? (
            <div className="text-center text-red-500 py-10">
              পরিচালনা পর্ষদের তালিকা আনতে সমস্যা হয়েছে।
            </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {officials.map((official) => (
                      <div key={official.id} className="flex flex-col items-center text-center p-4 border rounded-lg hover:shadow-lg transition-shadow bg-gray-50">
                          <img 
                              src={official.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(official.name)}&background=random`} 
                              alt={official.name}
                              className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-emerald-200"
                          />
                          <h3 className="text-md font-bold text-emerald-800">{official.name}</h3>
                          <p className="text-sm text-gray-600">{official.designation}</p>
                      </div>
                  ))}
             </div>
           )}
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">যোগাযোগ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone */}
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 rounded-lg transition-all duration-300 hover:bg-emerald-100 hover:shadow-md">
              <PhoneIcon className="w-10 h-10 mb-3 text-emerald-600"/>
              <h4 className="text-lg font-semibold text-gray-800">ফোন</h4>
              <p className="text-gray-700 mt-1">01841419005</p>
              <p className="text-gray-700 mt-1">01841419003</p>
            </div>
            {/* Email */}
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 rounded-lg transition-all duration-300 hover:bg-emerald-100 hover:shadow-md">
              <EnvelopeIcon className="w-10 h-10 mb-3 text-emerald-600"/>
              <h4 className="text-lg font-semibold text-gray-800">ইমেইল</h4>
              <p className="text-gray-700 mt-1">befaqulmadarisiddinia.bd@gmail.com</p>
            </div>
            {/* Address */}
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 rounded-lg transition-all duration-300 hover:bg-emerald-100 hover:shadow-md">
              <MapPinIcon className="w-10 h-10 mb-3 text-emerald-600"/>
              <h4 className="text-lg font-semibold text-gray-800">অফিস</h4>
              <p className="text-gray-700 mt-1">৩৪১/৫ টিভি রোড, বনশ্রী, পূর্ব রামপুরা, ঢাকা-১২১৯</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default AboutUsPage;