import React from 'react';
import { cn } from '@/src/lib/utils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'ads', label: 'Ads' },
    { id: 'funnel', label: 'Funnel' },
  ];

  return (
    <header className="fixed top-0 z-50 w-full bg-white border-b border-outline-variant/15 shadow-sm">
      <div className="flex justify-between items-center w-full px-6 h-20 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-10">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">Alpha11 Dashboard</span>
          <nav className="hidden md:flex items-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm",
                  activeTab === tab.id
                    ? "bg-primary-container text-white hover:opacity-90"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden md:block" />
      </div>
    </header>
  );
}
