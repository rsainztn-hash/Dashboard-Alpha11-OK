/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Reports from './components/Reports';
import Ads from './components/Ads';
import { parseExcelFile, processSheetsData } from './services/dataService';
import { getGoogleAuthUrl, syncGoogleSheetsData, checkGoogleAuthStatus } from './services/googleSheetsService';
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
    const loadDefaultData = async () => {
      setIsLoading(true);
      try {
        // Add cache buster to ensure we get the latest uploaded file
        const response = await fetch(`/data.xlsx?t=${Date.now()}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const { processExcelBuffer } = await import('./services/dataService');
          const data = processExcelBuffer(arrayBuffer);
          console.log('Parsed data:', data);
          
          if (data && data.timeSeries && data.timeSeries.length > 0) {
            setCustomData(data);
            // Try to set the year to the latest year in the data
            const years = data.timeSeries.map((item: any) => dayjs(item.date).year());
            const maxYear = Math.max(...years);
            if (!isNaN(maxYear)) {
              setSelectedYear(maxYear);
            }
            console.log('Default data loaded successfully, set year to:', maxYear);
          } else {
            console.warn('Data loaded but seems empty or invalid structure');
          }
        } else {
          console.warn('Default data.xlsx not found or could not be loaded:', response.status);
        }
      } catch (error) {
        console.error('Error loading default data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDefaultData();
  }, []);

  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      const authenticated = await checkGoogleAuthStatus();
      setIsGoogleConnected(authenticated);
      if (authenticated) {
        handleGoogleSync(true);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
        // Pass true to skip the connection check since we just authenticated
        handleGoogleSync(false, true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleSync = async (silent = false, force = false) => {
    if (!isGoogleConnected && !silent && !force) {
      // Direct user action to open popup without await to avoid blockers
      window.open('/api/auth/google/login', 'google_auth', 'width=600,height=700');
      return;
    }

    setIsLoading(true);
    try {
      const sheetsData = await syncGoogleSheetsData();
      const processedData = processSheetsData(sheetsData as any);
      
      if (processedData && processedData.timeSeries && processedData.timeSeries.length > 0) {
        setCustomData(processedData);
        const years = processedData.timeSeries.map((item: any) => dayjs(item.date).year());
        const maxYear = Math.max(...years);
        if (!isNaN(maxYear)) {
          setSelectedYear(maxYear);
        }
        if (!silent) alert('¡Sincronización con Google Sheets exitosa!');
      } else {
        if (!silent) alert('Se obtuvieron los datos pero no parecen tener el formato correcto.');
      }
    } catch (error: any) {
      if (error.message.includes('No autenticado')) {
        setIsGoogleConnected(false);
        if (!silent) {
          window.open('/api/auth/google/login', 'google_auth', 'width=600,height=700');
        }
      } else {
        console.error('Error syncing Google Sheets:', error);
        if (!silent) alert('Error al sincronizar: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const data = await parseExcelFile(file);
      if (data && data.timeSeries && data.timeSeries.length > 0) {
        setCustomData(data);
        const years = data.timeSeries.map((item: any) => dayjs(item.date).year());
        const maxYear = Math.max(...years);
        if (!isNaN(maxYear)) {
          setSelectedYear(maxYear);
        }
        alert('¡Datos cargados con éxito! El dashboard se ha actualizado.');
      } else {
        alert('El archivo se leyó pero no se encontraron datos válidos en las hojas esperadas.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Hubo un error al leer el archivo. Asegúrate de que sea un Excel válido.');
    } finally {
      setIsLoading(false);
    }
  };

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
        onFileUpload={handleFileUpload}
        onGoogleSync={handleGoogleSync}
        isGoogleConnected={isGoogleConnected}
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
      </main>
    </div>
  );
}
