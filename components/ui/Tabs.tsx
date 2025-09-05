import React from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode; // Optional icon for the tab
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabButtonClassName?: string;
  activeTabButtonClassName?: string;
  inactiveTabButtonClassName?: string;
  tabPanelClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  tabListClassName = 'flex border-b border-gray-200 -mb-px',
  tabButtonClassName = 'py-3 px-4 font-medium text-sm text-center border-b-2 transition-colors duration-150 flex items-center',
  activeTabButtonClassName = 'border-[#52b788] text-[#52b788]',
  inactiveTabButtonClassName = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
  tabPanelClassName = 'py-4',
}) => {
  return (
    <div className={className}>
      <div className={tabListClassName} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={activeTabId === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`${tabButtonClassName} ${
              activeTabId === tab.id ? activeTabButtonClassName : inactiveTabButtonClassName
            }`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`${tabPanelClassName} ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};
