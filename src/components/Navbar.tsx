import React, { useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { Upload, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onFileUpload: (file: File) => void;
  onGoogleSync: () => void;
  isGoogleConnected: boolean;
}

export default function Navbar({ activeTab, setActiveTab, onFileUpload, onGoogleSync, isGoogleConnected }: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'ads', label: 'Ads' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name, file.type);
      onFileUpload(file);
    }
  };

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

        <div className="flex items-center gap-4">
          {isGoogleConnected ? (
            <button
              onClick={onGoogleSync}
              className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow-md transition-all bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span className="text-sm">Sincronizado</span>
            </button>
          ) : (
            <a
              href="/api/auth/google/login"
              target="google_auth"
              className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow-md transition-all bg-primary text-white hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Conectar Google</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
