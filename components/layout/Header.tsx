import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { BellIcon, ChevronDownIcon, Bars3Icon } from '../ui/Icon'; 
import { APP_TITLE_BN } from '../../constants';
import { supabase } from '../../lib/supabase'; // Import supabase client
import { useToast } from '../../contexts/ToastContext';

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signout error:', error);
        addToast(`লগআউট সমস্যা: ${error.message}`, 'error');
        // Proceed to clear localStorage and navigate even if Supabase signout fails
      }
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      addToast('সফলভাবে লগআউট হয়েছে।', 'success');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout failed (catch block):', error);
      // Ensure localStorage is cleared and navigation happens
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      addToast(`লগআউট ব্যর্থ হয়েছে: ${error.message}`, 'error');
      navigate('/login');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as HTMLElement).closest('.user-menu-dropdown-trigger')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);


  return (
    <header className={`fixed top-0 right-0 z-20 h-20 bg-white shadow-md transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-64' : 'left-20'}`}>
      <div className=" mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 hover:text-[#52b788] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#52b788]"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-700 ml-4 hidden md:block">{APP_TITLE_BN}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-[#52b788] focus:outline-none">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {user && (
              <div className="relative user-menu-dropdown-trigger">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#52b788]"
                  id="user-menu-button"
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
                    aria-labelledby="user-menu-button"
                  >
                    <a
                      href="#" // TODO: Link to actual profile page
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      প্রোফাইল
                    </a>
                    <a
                      href="#" // TODO: Link to actual settings page
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      সেটিংস
                    </a>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      লগআউট
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

export default Header;