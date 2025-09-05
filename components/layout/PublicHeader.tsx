import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_TITLE_BN, PUBLIC_NAV_ITEMS } from '../../constants';
import { Bars3Icon, XMarkIcon } from '../ui/Icon';

const PublicHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#52b788] shadow-md sticky top-0 z-40 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <NavLink to="/" className="flex items-center">
            <img src="https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg" alt="লোগো" className="h-12 w-12 object-contain bg-white rounded-full p-1" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white leading-tight">
                {APP_TITLE_BN}
              </h1>
              <p className="text-xs text-emerald-100 hidden sm:block">
                বেফাকুল মাদারিসিদ্দিনিয়্যা বাংলাদেশ
              </p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isExternal = item.path.startsWith('http');
              const commonClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-emerald-100 hover:bg-emerald-600 hover:text-white";

              if (isExternal) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commonClasses}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `${commonClasses} ${isActive ? 'bg-emerald-600 text-white' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">মেনু খুলুন</span>
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isExternal = item.path.startsWith('http');
              const commonClasses = "block px-3 py-2 rounded-md text-base font-medium text-emerald-100 hover:bg-emerald-600 hover:text-white";

              if (isExternal) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={commonClasses}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `${commonClasses} ${isActive ? 'bg-emerald-700 text-white' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;