export enum ProcessingStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface RawPaper {
  id: string;
  text: string; // The abstract or full text snippet
  status: 'pending' | 'processing' | 'done' | 'failed';
}

export interface ExtractedData {
  // Basic Bibliometrics
  Year?: number;
  Authors?: string;
  Title?: string;
  Journal?: string;
  Open_Access?: 'Yes' | 'No';

  // Geographic & Sampling Info
  Scale?: 'Field' | 'Regional' | 'National' | 'Continental' | 'Global';
  Continent?: string;
  Country?: string;
  Longitude?: number | string; // Initially string from LLM, then parsed to number
  Latitude?: number | string;
  Sampling_Year?: string;
  Sampling_Design?: string;
  Sampling_Depth?: string;
  Soil_Status?: 'Dry-ground' | 'In-situ' | 'On-the-go';
  LULC?: string;

  // Spectral Analysis Details
  Spectrometer?: string;
  Spectral_Region?: 'VNIR' | 'MIR' | 'VNIR-MIR';
  Spectral_Range_Val?: string;
  Spectral_Library?: 'Y' | 'N';
  Spectral_Preprocessing?: string;
  Transfer_Learning?: string;

  // Modeling & Validation
  Target_Property?: string;
  No_Samples_Cal?: number;
  No_Samples_Val?: number;
  Split_Method?: string;
  Variable_Selection?: string;
  Calibration_Model?: string;
  Auxiliary_Predictors?: string;
  Validation_Type?: string;
  R2?: number;
  RMSE?: number;
  RPIQ?: number;
  r?: number;
}

export interface ProcessedPaper extends ExtractedData {
  id: string;
  rawText: string;
}
