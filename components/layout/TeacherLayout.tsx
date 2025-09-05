
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';
import { User, TeacherDbRow } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const mapTeacherProfileToUser = (profile: TeacherDbRow, authUserId: string, authUserEmail?: string): User => {
  return {
    id: profile.id || authUserId,
    name: profile.name_bn,
    email: profile.email || authUserEmail || 'ইমেইল নেই',
    avatarUrl: profile.photo_url || undefined,
  };
};

// Define paths that do not require an authenticated teacher user
const NON_PROTECTED_TEACHER_PATHS = ['/teacher/login', '/teacher/signup'];

const TeacherLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { addToast } = useToast();
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Effect for fetching session and user profile, and setting up auth listener
  useEffect(() => {
    const processSession = async (session: any, context: string) => {
      console.log(`TeacherLayout: [${context}] Processing session:`, session?.user?.id || 'No session');
      if (session?.user) {
        try {
          const { data: teacherProfileData, error: rpcError } = await supabase.rpc(
            'get_teacher_profile_by_user_id', { p_user_id: session.user.id }
          );

          if (rpcError) {
            console.error(`TeacherLayout: [${context}] RPC error:`, rpcError);
            addToast(`প্রোফাইল আনতে সমস্যা: ${rpcError.message}`, 'error');
            await supabase.auth.signOut();
            setTeacherUser(null);
            localStorage.removeItem('teacher_user');
            return;
          }

          if (teacherProfileData) {
            const mappedUser = mapTeacherProfileToUser(teacherProfileData as TeacherDbRow, session.user.id, session.user.email);
            setTeacherUser(mappedUser);
            localStorage.setItem('teacher_user', JSON.stringify(mappedUser));
          } else {
            console.warn(`TeacherLayout: [${context}] No teacher profile found for user:`, session.user.id);
            addToast('আপনার শিক্ষক প্রোফাইল পাওয়া যায়নি।', 'warning');
            await supabase.auth.signOut();
            setTeacherUser(null);
            localStorage.removeItem('teacher_user');
          }
        } catch (error: any) {
          console.error(`TeacherLayout: [${context}] Error processing profile:`, error);
          addToast(`প্রোফাইল প্রক্রিয়াকরণে ত্রুটি: ${error.message}`, 'error');
          await supabase.auth.signOut();
          setTeacherUser(null);
          localStorage.removeItem('teacher_user');
        }
      } else { // No session.user
        setTeacherUser(null);
        localStorage.removeItem('teacher_user');
      }
    };
    
    const checkInitialSession = async () => {
        setIsLoadingSession(true);
        const { data: { session } } = await supabase.auth.getSession();
        await processSession(session, "Initial getSession() call");
        setIsLoadingSession(false);
    };

    checkInitialSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoadingSession(true);
        await processSession(session, `Auth Listener - ${_event}`);
        setIsLoadingSession(false);
      }
    );

    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, [addToast, navigate]);

  // Effect for handling navigation based on auth state
  useEffect(() => {
    if (!isLoadingSession) {
      if (!teacherUser && !NON_PROTECTED_TEACHER_PATHS.includes(location.pathname)) {
        navigate('/teacher/login', { replace: true });
      } else if (teacherUser && NON_PROTECTED_TEACHER_PATHS.includes(location.pathname) && location.pathname !== '/teacher/signup') { 
        navigate('/teacher/dashboard', { replace: true });
      }
    }
  }, [teacherUser, isLoadingSession, location.pathname, navigate]);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoadingSession && !teacherUser && !NON_PROTECTED_TEACHER_PATHS.includes(location.pathname)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-700">শিক্ষক পোর্টাল লোড হচ্ছে...</p>
      </div>
    );
  }
  
  if (!isLoadingSession && !teacherUser && !NON_PROTECTED_TEACHER_PATHS.includes(location.pathname)) {
    return null; 
  }


  return (
    <div className="flex h-screen bg-gray-100">
      <TeacherSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TeacherHeader user={teacherUser} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#EDEDE9] p-6 pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
