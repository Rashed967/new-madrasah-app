
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const processSession = (session: any, context: string) => {
        if (session?.user) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser: User = JSON.parse(storedUser);
                // Verify the user ID from localStorage matches the session user ID
                if (parsedUser.id === session.user.id) {
                    setUser(parsedUser);
                } else {
                    // Mismatch, so clear localStorage and use session data
                    localStorage.removeItem('user');
                    localStorage.removeItem('jwt');
                    const appUser: User = { id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'ব্যবহারকারী', avatarUrl: session.user.user_metadata?.avatar_url };
                    setUser(appUser);
                    localStorage.setItem('user', JSON.stringify(appUser));
                    localStorage.setItem('jwt', session.access_token);
                }
            } else {
                // No user in localStorage, construct from session
                const appUser: User = { id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'ব্যবহারকারী', avatarUrl: session.user.user_metadata?.avatar_url };
                setUser(appUser);
                localStorage.setItem('user', JSON.stringify(appUser));
                localStorage.setItem('jwt', session.access_token);
            }
        } else {
            // No session user, clear all state
            setUser(null);
            localStorage.removeItem('jwt');
            localStorage.removeItem('user');
            if (location.pathname !== '/login') {
                navigate('/login');
            }
        }
    };
    
    const checkInitialSession = async () => {
        setIsLoadingSession(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Layout: Error fetching initial session:", error);
            addToast(`সেশন আনতে সমস্যা: ${error.message}`, 'error');
        }
        processSession(session, "Initial getSession()");
        setIsLoadingSession(false);
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        processSession(session, `Auth Listener - ${_event}`);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };

  }, [navigate, addToast, location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-700">সেশন লোড হচ্ছে...</p>
      </div>
    );
  }
  
  // If not loading but no user, and we are not on the login page, the useEffect will have navigated.
  // We can return null to avoid a flicker of the layout.
  if (!user && location.pathname !== '/login') { 
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header user={user} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
        {/* Removed overflow-y-auto from main tag */}
        <main className="flex-1 overflow-x-hidden bg-[#EDEDE9] p-6 pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
