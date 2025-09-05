
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavItemType } from '../../types';
import { SIDEBAR_NAV_ITEMS, PRIMARY_COLOR, APP_TITLE_BN } from '../../constants';
import { ChevronDownIcon, ChevronRightIcon } from '../ui/Icon';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarNavItem: React.FC<{ item: NavItemType; isSidebarOpen: boolean }> = ({ item, isSidebarOpen }) => {
  const location = useLocation();
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(
    item.children ? item.children.some(child => location.pathname.startsWith(child.path)) : false
  );

  const isActive = item.children 
    ? item.children.some(child => location.pathname.startsWith(child.path))
    : location.pathname.startsWith(item.path);

  const toggleSubMenu = () => {
    if (item.children) {
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };
  
  const linkBaseClasses = "flex items-center p-3 rounded-lg hover:bg-emerald-700 transition-colors duration-150";
  const activeClasses = "bg-emerald-700 font-semibold";
  const inactiveClasses = "hover:bg-opacity-75";

  if (item.children) {
    return (
      <li className="mb-1">
        <button
          onClick={toggleSubMenu}
          className={`${linkBaseClasses} w-full text-left ${isActive ? activeClasses : inactiveClasses}`}
        >
          <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
          {isSidebarOpen && <span className="flex-1">{item.label}</span>}
          {isSidebarOpen && (isSubMenuOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />)}
        </button>
        {isSubMenuOpen && isSidebarOpen && (
          <ul className="pl-6 mt-1 space-y-1">
            {item.children.map(child => (
              <SidebarNavItem key={child.path} item={child} isSidebarOpen={isSidebarOpen} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="mb-1">
      <NavLink
        to={item.soon ? '#' : item.path}
        className={({ isActive: navIsActive }) => 
          `${linkBaseClasses} ${navIsActive && !item.soon ? activeClasses : inactiveClasses} ${item.soon ? 'opacity-50 cursor-not-allowed' : ''}`
        }
        title={item.soon ? `${item.label} (শীঘ্রই আসছে)` : item.label}
      >
        <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
        {isSidebarOpen && <span className="flex-1">{item.label}</span>}
        {isSidebarOpen && item.soon && <span className="text-xs ml-auto bg-yellow-400 text-yellow-800 px-1.5 py-0.5 rounded">শীঘ্রই</span>}
      </NavLink>
    </li>
  );
};



const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 flex flex-col primary-bg text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'} shadow-xl`}
      
    >
      <div className="flex items-center justify-center h-20 border-b border-emerald-700 px-4">
    
          <img 
            src={'https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg'} 
            alt="Board Logo" 
            className={`transition-all duration-300 ${isOpen ? 'w-12 h-12' : 'w-8 h-8'} rounded-full`} 
          />

        
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul>
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.path} item={item} isSidebarOpen={isOpen} />
          ))}
        </ul>
      </nav>
      {isOpen && (
        <div className="p-4 border-t border-emerald-700 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
