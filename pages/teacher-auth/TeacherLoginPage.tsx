
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Logo from '../../assets/Logo';
import { APP_TITLE_BN, PRIMARY_COLOR } from '../../constants';
import { UserCircleIcon, EyeIcon, EyeSlashIcon } from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase'; // Import Supabase

const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const TeacherLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('teacher1@example.com'); // Default or empty
  const [password, setPassword] = useState('password123'); // Default or empty
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem('teacher_user')) { // Check for teacher_user specifically
        navigate('/teacher/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('ইমেইল এবং পাসওয়ার্ড উভয়ই আবশ্যক।');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (supabaseError) {
        console.error("Supabase login error (Teacher):", supabaseError);
        if (supabaseError.message.toLowerCase().includes('invalid login credentials')) {
             setError('অবৈধ ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
        } else {
             setError(`লগইন ব্যর্থ হয়েছে: ${supabaseError.message}`);
        }
        addToast('লগইন ব্যর্থ হয়েছে।', 'error');
        return;
      }
      
      if (data.session && data.user) {
        addToast('সফলভাবে লগইন হয়েছে! প্রোফাইল লোড হচ্ছে...', 'success');
        navigate('/teacher/dashboard'); 
      } else {
        setError("লগইন সফল হলেও সেশন বা ব্যবহারকারীর তথ্য পাওয়া যায়নি।");
        addToast('লগইন ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      console.error("Login failed (Teacher catch block):", err);
      if (!error) { 
        setError(`লগইন ব্যর্থ হয়েছে: ${err.message || 'অজানা ত্রুটি'}`);
        addToast('লগইন ব্যর্থ হয়েছে।', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center p-6">
          <Logo className="mb-4" primaryColor={PRIMARY_COLOR} />
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">শিক্ষক পোর্টাল</h1>
          <p className="text-sm text-gray-600 mb-8">আপনার একাউন্টে লগইন করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <Input
            id="email"
            label="ইমেইল"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@example.com"
            icon={<UserCircleIcon className="w-5 h-5" />}
            autoComplete="email"
            required
            disabled={isLoading}
          />
          <div className="relative">
            <Input
              id="password"
              label="পাসওয়ার্ড"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<LockClosedIcon className="w-5 h-5" />}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
              disabled={isLoading}
            >
              {showPassword ? <EyeSlashIcon className="h-5 h-5" /> : <EyeIcon className="h-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-6 mt-2">
            <a href="#" className="text-sm text-[#52b788] hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'লগইন করা হচ্ছে...' : 'লগইন'}
          </Button>
        </form>
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">একাউন্ট নেই?</p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/signup')} disabled={isLoading}>
            নতুন একাউন্ট তৈরি করুন
          </Button>
           <p className="text-xs text-gray-500 mt-4">অথবা <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="p-0 text-[#52b788] hover:underline">এডমিন পোর্টালে যান</Button></p>
        </div>
      </Card>
      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {APP_TITLE_BN}. সর্বস্বত্ব সংরক্ষিত।
      </p>
    </div>
  );
};

export default TeacherLoginPage;
