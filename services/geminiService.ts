import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RawPaper, ExtractedData } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// Defined strict schema for extraction to ensure type safety from LLM
const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    Year: { type: Type.INTEGER },
    Authors: { type: Type.STRING },
    Title: { type: Type.STRING },
    Journal: { type: Type.STRING },
    Open_Access: { type: Type.STRING, enum: ["Yes", "No"] },
    Scale: { type: Type.STRING, enum: ["Field", "Regional", "National", "Continental", "Global"] },
    Continent: { type: Type.STRING },
    Country: { type: Type.STRING },
    Longitude: { type: Type.STRING, description: "Raw longitude string, can be a range or list" },
    Latitude: { type: Type.STRING, description: "Raw latitude string, can be a range or list" },
    Sampling_Year: { type: Type.STRING },
    Sampling_Design: { type: Type.STRING },
    Sampling_Depth: { type: Type.STRING },
    Soil_Status: { type: Type.STRING, enum: ["Dry-ground", "In-situ", "On-the-go"] },
    LULC: { type: Type.STRING },
    Spectrometer: { type: Type.STRING },
    Spectral_Region: { type: Type.STRING, enum: ["VNIR", "MIR", "VNIR-MIR"] },
    Spectral_Range_Val: { type: Type.STRING },
    Spectral_Library: { type: Type.STRING, enum: ["Y", "N"] },
    Spectral_Preprocessing: { type: Type.STRING },
    Transfer_Learning: { type: Type.STRING },
    Target_Property: { type: Type.STRING },
    No_Samples_Cal: { type: Type.INTEGER },
    No_Samples_Val: { type: Type.INTEGER },
    Split_Method: { type: Type.STRING },
    Variable_Selection: { type: Type.STRING },
    Calibration_Model: { type: Type.STRING },
    Auxiliary_Predictors: { type: Type.STRING },
    Validation_Type: { type: Type.STRING },
    R2: { type: Type.NUMBER },
    RMSE: { type: Type.NUMBER },
    RPIQ: { type: Type.NUMBER },
    r: { type: Type.NUMBER },
  },
  required: ["Title", "Year"], // Minimal requirement
};

/**
 * Simulates the "Search" phase by asking Gemini to generate realistic abstracts
 * matching the user's WoS query.
 */
export const simulateSearch = async (query: string): Promise<RawPaper[]> => {
  const ai = getClient();
  const prompt = `
    You are a simulator for the Web of Science database.
    Generate 3 distinct, highly realistic academic paper abstracts published in 2025 that match this query:
    "${query}"
    
    Focus on Soil Carbon and Spectroscopy (VNIR/MIR).
    Vary the geography (one from China, one from Europe, one from USA/Brazil).
    Include details about sampling design, spectral range, and modeling results in the text so extraction is possible.
    
    Return the result as a JSON array of strings, where each string is the full text of the abstract including title and authors.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const texts = JSON.parse(response.text || "[]");
    
    return texts.map((text: string, index: number) => ({
      id: `sim-${Date.now()}-${index}`,
      text: text,
      status: 'pending'
    }));

  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};

/**
 * Extracts structured data from a single paper's text.
 */
export const extractMetadataFromText = async (text: string): Promise<ExtractedData> => {
  const ai = getClient();
  const prompt = `
    Extract bibliographic, geographic, and chemometric metadata from the following text.
    Strictly follow the JSON schema provided.
    If a field is not mentioned, omit it or return null.
    For Coordinates (Longitude/Latitude), keep the raw string if it's a range or list.
    For Sampling Design, normalize to: Random sampling, Stratified random sampling, Grid, cLHS, etc.
    
    Text to analyze:
    "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Extraction failed:", error);
    return {};
  }
};
