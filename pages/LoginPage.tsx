import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import Logo from '../assets/Logo';
import { APP_TITLE_BN, PRIMARY_COLOR } from '../constants';
import { UserCircleIcon, EyeIcon, EyeSlashIcon } from '../components/ui/Icon';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types'; 
import { supabase } from '../lib/supabase'; // Import supabase client

const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardLogoUrl, setBoardLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoardLogo = async () => {
      const { data, error } = await supabase
        .from('board_profile')
        .select('logo_url')
        .eq('id', 'MAIN_PROFILE')
        .single();

      if (error) {
        console.error('Error fetching board logo:', error);
      } else if (data) {
        setBoardLogoUrl(data.logo_url);
      }
    };

    fetchBoardLogo();
  }, []);

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
      // Step 1: Authenticate credentials
      const { data: authData, error: authError } = await (supabase.auth as any).signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Supabase login error:", authError);
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
             setError('অবৈধ ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
        } else {
             setError(`লগইন ব্যর্থ হয়েছে: ${authError.message}`);
        }
        addToast('লগইন ব্যর্থ হয়েছে।', 'error');
        setIsLoading(false);
        return;
      }
      
      if (authData.session && authData.user) {
        // Step 2: Authorize role by calling the RPC function
        const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
        
        if (rpcError) {
            console.error("RPC error checking admin status:", rpcError);
            setError('ভূমিকা যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
            addToast('ভূমিকা যাচাই করতে সমস্যা হয়েছে।', 'error');
            await (supabase.auth as any).signOut(); // Sign out the authenticated but unauthorized user
            setIsLoading(false);
            return;
        }

        if (isAdmin === true) {
            // Step 3: Proceed if user is an admin
            localStorage.setItem('jwt', authData.session.access_token);
            const appUser: User = {
                id: authData.user.id,
                email: authData.user.email || '',
                name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'ব্যবহারকারী',
                avatarUrl: authData.user.user_metadata?.avatar_url,
            };
            localStorage.setItem('user', JSON.stringify(appUser));
            
            addToast('সফলভাবে লগইন হয়েছে!', 'success');
            navigate('/dashboard');
        } else {
            // Step 4: Sign out and show error if not an admin
            await (supabase.auth as any).signOut();
            setError('আপনার এই প্যানেলে প্রবেশের অনুমতি নেই।');
            addToast('প্রবেশের অনুমতি নেই।', 'error');
        }
      } else {
        throw new Error("লগইন সফল হলেও সেশন বা ব্যবহারকারীর তথ্য পাওয়া যায়নি।");
      }
    } catch (err: any) {
      console.error("Login failed (catch block):", err);
      if (!error) { 
        setError(`লগইন ব্যর্থ হয়েছে: ${err.message}`);
      }
      if (!error) addToast('লগইন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center p-6">
          {boardLogoUrl && (
            <img 
              src={boardLogoUrl} 
              alt="Board Logo" 
              className="mb-4 w-24 h-24 rounded-full" 
            />
          ) }
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">{APP_TITLE_BN}</h1>
        
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <Input
            id="email"
            label="ইমেইল"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল লিখুন"
            icon={<UserCircleIcon className="w-5 h-5" />}
            autoComplete="email"
            required
            disabled={isLoading}
            wrapperClassName="mb-0"
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
              wrapperClassName="mb-0"
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

          {error && <p className="text-red-500 text-sm text-center !mt-2">{error}</p>}

          <Button type="submit" className="w-full !mt-6" size="lg" disabled={isLoading}>
            {isLoading ? 'লগইন করা হচ্ছে...' : 'লগইন'}
          </Button>
        </form>
        {/* <div className="px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">আপনি কি শিক্ষক?</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                 <Button variant="outline" size="sm" onClick={() => navigate('/teacher/login')} disabled={isLoading}>
                    শিক্ষক লগইন
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/signup')} disabled={isLoading}>
                    শিক্ষক নিবন্ধন
                </Button>
            </div>
        </div> */}
      </Card>
      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {APP_TITLE_BN}. সর্বস্বত্ব সংরক্ষিত।
      </p>
    </div>
  );
};

export default LoginPage;
