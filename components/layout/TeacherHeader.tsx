
import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { BellIcon, ChevronDownIcon, Bars3Icon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '../ui/Icon'; 
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase'; // Import Supabase

interface TeacherHeaderProps {
  user: User | null;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ user, toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signout error (Teacher):', error);
        addToast(`লগআউট সমস্যা: ${error.message}`, 'error');
        // Even if Supabase signout fails, proceed to clear local state and navigate.
      }
      // localStorage removal and navigation will be handled by onAuthStateChange in TeacherLayout
      // but it's good practice to also clear it here for immediate effect.
      localStorage.removeItem('teacher_user'); 
      addToast('সফলভাবে লগআউট হয়েছেন।', 'success');
      navigate('/teacher/login');
    } catch (error: any) {
      console.error('Logout failed (Teacher catch block):', error);
      localStorage.removeItem('teacher_user');
      addToast(`লগআউট ব্যর্থ হয়েছে: ${error.message}`, 'error');
      navigate('/teacher/login');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as HTMLElement).closest('.teacher-user-menu-trigger')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className={`fixed top-0 right-0 z-20 h-20 bg-white shadow-md transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-64' : 'left-20'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 hover:text-[#52b788] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#52b788] lg:hidden"
              aria-label="সাইডবার খুলুন/বন্ধ করুন"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-700 ml-4 hidden md:block">শিক্ষক পোর্টাল</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-[#52b788] focus:outline-none" aria-label="নোটিফিকেশন">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {user && (
              <div className="relative teacher-user-menu-trigger">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#52b788]"
                  id="teacher-user-menu-button"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <Avatar 
                    src={user.avatarUrl} 
                    fallback={user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')} 
                    size="md" 
                  />
                  <span className="ml-2 hidden md:block text-gray-700">{user.name || user.email}</span>
                  <ChevronDownIcon className="ml-1 h-4 w-4 hidden md:block text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="teacher-user-menu-button"
                  >
                    <NavLink to="/teacher/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      <UserCircleIcon className="w-4 h-4 mr-2"/>আমার প্রোফাইল
                    </NavLink>
                    <NavLink to="/teacher/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      <Cog6ToothIcon className="w-4 h-4 mr-2"/>সেটিংস
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                     <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2"/> লগআউট
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;
