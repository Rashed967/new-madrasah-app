import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { APP_TITLE_BN } from '../../constants';
import { BuildingOffice2Icon, UsersIcon, AcademicCapIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, PaperAirplaneIcon, UserPlusIcon } from '../../components/ui/Icon';
import SkeletonStatCard from '../../components/ui/SkeletonStatCard'; 
import { useToast } from '../../contexts/ToastContext';

interface PublicStats {
  totalMadrasas: number;
  totalExaminees: number;
  totalTeachers: number;
}

interface FaqItemType {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="text-center transition-all duration-300 hover:shadow-xl hover:scale-105">
    <div className="p-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-emerald-600">{value.toLocaleString('bn-BD')}</p>
    </div>
  </Card>
);

const FaqItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-emerald-600"/> : <ChevronDownIcon className="w-5 h-5 text-gray-400"/>}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 text-gray-600 bg-white">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};


const HomePage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '', email: '', subject: '', message: ''
  });
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats, isLoading } = useQuery<PublicStats, Error>({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stats');
      if (error) throw new Error(error.message);
      
      const rawData = data as any;
      return {
        totalMadrasas: rawData.total_madrasas || rawData.totalMadrasas || 0,
        totalExaminees: rawData.total_examinees || rawData.totalExaminees || 0,
        totalTeachers: rawData.total_teachers || rawData.totalTeachers || 0,
      };
    },
    staleTime: 5 * 60 * 1000, 
  });

  const { data: faqs, isLoading: isLoadingFaqs, error: faqsError } = useQuery<FaqItemType[], Error>({
    queryKey: ['activeFaqs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_faqs');
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const fetchNotices = async () => {
      const { data, error } = await supabase.rpc('get_active_notices');
      if (error) {
        console.error('Error fetching notices:', error);
      } else {
        setNotices(data);
      }
    };

    fetchNotices();
  }, []);

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      addToast('অনুগ্রহ করে সকল ঘর পূরণ করুন।', 'warning');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('contact_submissions').insert([
      {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
      }
    ]);

    if (error) {
      addToast(`বার্তা পাঠাতে সমস্যা হয়েছে: ${error.message}`, 'error');
    } else {
      addToast('ধন্যবাদ! আপনার বার্তাটি আমরা পেয়েছি।', 'success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }
    setIsSubmitting(false);
  };

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };


  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative text-center py-20 bg-gradient-to-b from-emerald-50 via-teal-50 to-white rounded-xl shadow-lg overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-40 z-0"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full filter blur-3xl opacity-40 z-0"></div>
        
        <div className="relative z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-800 tracking-tight">
            {APP_TITLE_BN}
          </h1>
          <p className="mt-4 text-lg text-gray-700 max-w-3xl mx-auto">
            দ্বীনি শিক্ষার মানোন্নয়নে একটি সমন্বিত প্ল্যাটফর্ম। স্বচ্ছতা ও দক্ষতার সাথে মাদরাসা শিক্ষা ব্যবস্থাপনায় আমরা আপনার পাশে।
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button as={NavLink} to="/results" size="lg">ফলাফল দেখুন</Button>
            <Button as={NavLink} to="/about" size="lg" variant="outline">আমাদের সম্পর্কে জানুন</Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="নিবন্ধিত মাদরাসা" value={stats?.totalMadrasas || 0} icon={<BuildingOffice2Icon className="h-8 w-8" />} />
            <StatCard title="চলতি বছরের পরীক্ষার্থী" value={stats?.totalExaminees || 0} icon={<AcademicCapIcon className="h-8 w-8" />} />
            <StatCard title="নিবন্ধিত শিক্ষক" value={stats?.totalTeachers || 0} icon={<UsersIcon className="h-8 w-8" />} />
          </div>
        )}
      </section>

      {/* About & Notice Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <Card className="flex flex-col h-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
          <div className="flex-grow">
            <p className="text-gray-600 leading-relaxed">
              জাতীয় দ্বীনি মাদরাসা শিক্ষাবোর্ড বাংলাদেশ-এর প্রধান লক্ষ্য হলো কওমি মাদরাসাসমূহের পাঠ্যক্রম এবং শিক্ষাক্রমের মানোন্নয়ন করা, শিক্ষার্থীদের মেধার মূল্যায়ন এবং একটি সুশৃঙ্খল ব্যবস্থাপনার মাধ্যমে দ্বীনি শিক্ষার ঐতিহ্যকে সমুন্নত রাখা। আমরা স্বচ্ছতা, আধুনিক প্রযুক্তি এবং ঐক্যের মাধ্যমে এই লক্ষ্য বাস্তবায়নে কাজ করে যাচ্ছি।
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              কওমি মাদরাসা শিক্ষাব্যবস্থাকে আরও গতিশীল ও যুগোপযোগী করতে আমরা প্রতিজ্ঞাবদ্ধ। আমাদের সকল কার্যক্রম সহজ ও ব্যবহারবান্ধব করার জন্য আমরা কাজ করে চলেছি, যেন দেশের প্রতিটি প্রান্ত থেকে শিক্ষক, শিক্ষার্থী ও অভিভাবকগণ সহজেই আমাদের সাথে যুক্ত হতে পারেন।
            </p>
          </div>
          <Button as={NavLink} to="/about" variant="primary" className="mt-6 self-start">বিস্তারিত জানুন</Button>
        </Card>
        
        <Card title="নোটিশ বোর্ড" className="flex flex-col h-full" bodyClassName="flex-grow p-0">
          <div className="scroller h-40">
            <ul className="space-y-3 p-6 scrolling-list">
              {notices.map((notice, index) => (
                <li key={index} className="p-3 bg-emerald-50 rounded-md cursor-pointer hover:bg-emerald-100" onClick={() => handleNoticeClick(notice)}>
                  <p className="font-medium text-emerald-800">{notice.title}</p>
                  <p className="text-xs text-gray-500">প্রকাশিত: {new Date(notice.created_at).toLocaleDateString('bn-BD')}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

      </section>

      {/* FAQ Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">সাধারণ জিজ্ঞাসা</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoadingFaqs ? (
            <div>Loading FAQs...</div> 
          ) : faqsError ? (
            <div>Error loading FAQs: {faqsError.message}</div>
          ) : (faqs?.length || 0) > 0 ? (
            faqs?.map((faq) => (
              <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))
          ) : (
            <div className="text-center text-gray-500">কোনো সাধারণ জিজ্ঞাসা খুঁজে পাওয়া যায়নি।</div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Madrasa Registration CTA */}
            <div className="bg-emerald-500 p-8 rounded-lg shadow-xl flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                <BuildingOffice2Icon className="w-12 h-12 mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-2 text-white ">আপনার মাদরাসা নিবন্ধন করুন</h3>
                <p className="mb-6 text-emerald-100 text-white">
                    জাতীয় দ্বীনি মাদরাসা শিক্ষাবোর্ডের সাথে আপনার মাদরাসাকে যুক্ত করে ডিজিটাল ব্যবস্থাপনার অংশ হোন।
                </p>
                <Button as={NavLink} to="#" size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100">
                    এখনই আবেদন করুন
                </Button>
            </div>

            {/* Teacher/Personnel Registration CTA */}
            <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center text-center transition-transform hover:scale-105 duration-300 border">
                <UserPlusIcon className="w-12 h-12 mb-4 text-emerald-600" />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">পরীক্ষক/নেগরান হিসেবে নিবন্ধন করুন</h3>
                <p className="mb-6 text-gray-600">
                    বোর্ডের কেন্দ্রীয় পরীক্ষায় পরীক্ষক বা নেগরান হিসেবে দায়িত্ব পালনের জন্য আপনার তথ্য জমা দিন।
                </p>
                <Button as={NavLink} to="#" size="lg" variant="primary">
                    নিবন্ধন করুন
                </Button>
            </div>
        </div>
      </section>

       {/* Contact Section */}
      <section>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-3">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">আমাদের সাথে যোগাযোগ করুন</h2>
                <p className="text-gray-600 mb-6">আপনার যেকোনো প্রশ্ন বা মতামতের জন্য নিচের ফর্মটি পূরণ করুন। আমরা যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করবো।</p>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="আপনার নাম" name="name" placeholder="আপনার পুরো নাম" value={contactForm.name} onChange={handleContactFormChange} required />
                        <Input label="আপনার ইমেইল" name="email" type="email" placeholder="you@example.com" value={contactForm.email} onChange={handleContactFormChange} required />
                   </div>
                    <Input label="বিষয়" name="subject" placeholder="আপনার বার্তার বিষয়" value={contactForm.subject} onChange={handleContactFormChange} required />
                    <Textarea label="বার্তা" name="message" placeholder="আপনার বার্তা এখানে লিখুন..." value={contactForm.message} onChange={handleContactFormChange} required rows={4} />
                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5"/>}>
                           {isSubmitting ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                        </Button>
                    </div>
                </form>
            </Card>
            <div className="lg:col-span-2">
                 <div className="h-full bg-no-repeat bg-cover bg-center rounded-lg shadow-lg p-8 text-white flex flex-col justify-end" style={{backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://res.cloudinary.com/dpes1dyqb/image/upload/v1755801567/islamic_sky_view_cuk7fu.jpg)'}}>
                    <h3 className="text-2xl font-bold mb-4">যোগাযোগের তথ্য</h3>
                    <div className="space-y-3">
                        <p><strong>ঠিকানা:</strong> ৩৪১/৫ টিভি রোড, পূর্ব রামপুরা, ঢাকা-১২১৯</p>
                        <p><strong>ফোন (অফিস):</strong> ০১৮৪১৪১৯০০৫</p>
                        <p><strong>ফোন (পরীক্ষা):</strong> ০১৮৪১৪১৯০০৩</p>
                        <p><strong>ইমেইল:</strong> befaqulmadarisiddinia.bd@gmail.com</p>
                    </div>
                 </div>
            </div>
         </div>
      </section>

      {isModalOpen && selectedNotice && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedNotice.title}
          size="2xl"
        >
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedNotice.content }}></div>
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            প্রকাশিত: {new Date(selectedNotice.created_at).toLocaleString('bn-BD')}
          </div>
        </Modal>
      )}

    </div>
  );
};

export default HomePage;