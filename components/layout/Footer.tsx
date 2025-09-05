import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_TITLE_BN, PUBLIC_NAV_ITEMS } from '../../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#52b788] border-t border-emerald-600 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
               <img src="https://res.cloudinary.com/dpes1dyqb/raw/upload/v1752595633/fmcn6df5et03zd9tpjvm.jpg" alt="লোগো" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
              <span className="ml-3 text-lg font-semibold text-white">{APP_TITLE_BN}</span>
            </div>
            <p className="text-sm text-emerald-100">
              দ্বীনি শিক্ষার প্রচার ও প্রসারে এবং কওমি মাদরাসাসমূহের সার্বিক তত্ত্বাবধানে আমরা প্রতিশ্রুতিবদ্ধ। আমাদের লক্ষ্য হলো একটি সুশিক্ষিত ও নৈতিক প্রজন্ম তৈরি করা।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">গুরুত্বপূর্ণ লিংক</h3>
            <ul className="mt-4 space-y-2">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className="text-base text-emerald-100 hover:text-white transition-colors">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">যোগাযোগ</h3>
            <ul className="mt-4 space-y-2 text-sm text-emerald-100">
              <li>৩৪১/৫ টিভি রোড, পূর্ব রামপুরা, ঢাকা-১২১৯</li>
              <li>ইমেইল: befaqulmadarisiddinia.bd@gmail.com</li>
              <li>ফোন: 01841419005 - 01841419003</li>
            </ul>
          </div>
        </div>

        <div className="py-4 border-t border-emerald-600 text-center text-sm text-emerald-200">
          <p>&copy; {new Date().getFullYear()} {APP_TITLE_BN}. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;