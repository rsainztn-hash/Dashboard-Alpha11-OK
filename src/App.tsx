/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Reports from './components/Reports';
import Ads from './components/Ads';
import Funnel from './components/Funnel';
import { processSheetsData } from './services/dataService';
import { syncGoogleSheetsData, checkGoogleAuthStatus } from './services/googleSheetsService';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import 'dayjs/locale/es';

dayjs.extend(weekOfYear);
dayjs.locale('es');

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [customData, setCustomData] = useState<any>(null);
  
  // Global Filters
  const [selectedChannel, setSelectedChannel] = useState('Total');
  const [selectedPeriod, setSelectedPeriod] = useState('Year to Date');
  const [selectedWeek, setSelectedWeek] = useState(dayjs().week());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const setDashboardData = (data: any) => {
      if (data && data.timeSeries && data.timeSeries.length > 0) {
        setCustomData(data);
        const years = data.timeSeries.map((item: any) => dayjs(item.date).year());
        const maxYear = Math.max(...years);
        if (!isNaN(maxYear)) {
          setSelectedYear(maxYear);
        }
      }
    };

    const loadBundledData = async () => {
      const response = await fetch(`/data.xlsx?t=${Date.now()}`);
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      const { processExcelBuffer } = await import('./services/dataService');
      setDashboardData(processExcelBuffer(arrayBuffer));
    };

    const loadGoogleSheetsData = async () => {
      setIsLoading(true);
      try {
        const authenticated = await checkGoogleAuthStatus();

        if (authenticated) {
          const sheetsData = await syncGoogleSheetsData();
          setDashboardData(processSheetsData(sheetsData as any));
          return;
        }

        await loadBundledData();
      } catch (error) {
        console.error('Error loading Google Sheets data:', error);
        await loadBundledData();
      } finally {
        setIsLoading(false);
      }
    };

    loadGoogleSheetsData();
  }, []);

  const filterProps = {
    selectedChannel, setSelectedChannel,
    selectedPeriod, setSelectedPeriod,
    selectedWeek, setSelectedWeek,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <main className="pt-20">
        {isLoading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-bold text-on-surface">Cargando datos reales...</p>
              <p className="text-sm text-on-surface-variant">Esto puede tardar unos segundos</p>
            </div>
          </div>
        )}
        {activeTab === 'home' && <Home data={customData} isLoading={isLoading} {...filterProps} />}
        {activeTab === 'reports' && <Reports data={customData} {...filterProps} />}
        {activeTab === 'ads' && <Ads data={customData} {...filterProps} />}
        {activeTab === 'funnel' && <Funnel data={customData} {...filterProps} />}
      </main>
    </div>
  );
}
