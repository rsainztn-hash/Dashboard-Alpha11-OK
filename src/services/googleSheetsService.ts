import { DashboardData } from './dataService';

export const checkGoogleAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/google/status');
    const { authenticated } = await response.json();
    return authenticated;
  } catch (error) {
    return false;
  }
};

export const getGoogleAuthUrl = async () => {
  const response = await fetch('/api/auth/google/url');
  const { url } = await response.json();
  return url;
};

export const syncGoogleSheetsData = async (): Promise<Partial<DashboardData>> => {
  const response = await fetch('/api/sheets/data');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al sincronizar con Google Sheets');
  }
  const { data } = await response.json();
  
  // The data from the API is an array of objects.
  // We need to transform this into the DashboardData structure.
  // Since the user said "same logic as Excel", we might need to fetch multiple sheets.
  // For now, let's assume the API returns the data in a way we can process.
  // If the server returns multiple sheets, we can handle it.
  
  // For now, let's just return the raw data if it's already processed on the server,
  // or process it here if it's raw rows.
  
  // Let's update the server to return multiple sheets if possible.
  return data;
};
