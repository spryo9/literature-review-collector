import { ProcessedPaper } from '../types';

/**
 * Parses coordinate strings to a single numerical value.
 * Handles ranges ("10-20") by averaging.
 * Handles lists ("10, 20") by averaging.
 */
export const parseCoordinates = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;

  const cleanVal = value.toString().replace(/[^\d.\-,]/g, '').trim();

  try {
    // Check for comma separated values
    if (cleanVal.includes(',')) {
      const parts = cleanVal.split(',').map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (parts.length === 0) return undefined;
      const sum = parts.reduce((a, b) => a + b, 0);
      return parseFloat((sum / parts.length).toFixed(6));
    }

    // Check for range (hyphen) - strictly simple ranges like "10.5-12.5"
    // Note: This is a simplified regex for positive/negative floats
    if (cleanVal.includes('-') && !cleanVal.startsWith('-')) {
       // It's likely a range like 10-20, not -10.
       const parts = cleanVal.split('-').map(v => parseFloat(v)).filter(n => !isNaN(n));
       if (parts.length === 2) {
         return parseFloat(((parts[0] + parts[1]) / 2).toFixed(6));
       }
    }
    
    // Fallback: try parsing direct float
    const num = parseFloat(cleanVal);
    return isNaN(num) ? undefined : num;
  } catch (e) {
    return undefined;
  }
};

/**
 * Converts the dataset to a CSV string and triggers download.
 */
export const exportToCSV = (data: ProcessedPaper[], filename: string) => {
  if (!data || data.length === 0) return;

  // Define headers based on the schema
  const headers = [
    'Year', 'Authors', 'Title', 'Journal', 'Open_Access',
    'Scale', 'Continent', 'Country', 'Longitude', 'Latitude',
    'Sampling_Year', 'Sampling_Design', 'Sampling_Depth', 'Soil_Status', 'LULC',
    'Spectrometer', 'Spectral_Region', 'Spectral_Range_Val', 'Spectral_Library',
    'Spectral_Preprocessing', 'Transfer_Learning',
    'Target_Property', 'No_Samples_Cal', 'No_Samples_Val', 'Split_Method',
    'Variable_Selection', 'Calibration_Model', 'Auxiliary_Predictors',
    'Validation_Type', 'R2', 'RMSE', 'RPIQ', 'r'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      // @ts-ignore - Dynamic access
      const val = row[fieldName];
      if (val === undefined || val === null) return '';
      const stringVal = String(val);
      // Escape quotes and wrap in quotes if contains comma
      if (stringVal.includes(',') || stringVal.includes('"')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
