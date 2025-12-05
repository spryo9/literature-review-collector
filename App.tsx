import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Database, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Microscope,
  Globe
} from 'lucide-react';
import { RawPaper, ProcessedPaper, ProcessingStatus } from './types';
import { simulateSearch, extractMetadataFromText } from './services/geminiService';
import { parseCoordinates, exportToCSV } from './utils/cleaners';

// Default query from the prompt
const DEFAULT_QUERY = `TS=(soil) AND TS=(carbon) AND TS=("Visible near infrared" OR "Visible-near infrared" OR VNIR OR "Near-infrared" OR "Mid-infrared" OR vis-NIR OR MIR)`;

const App: React.FC = () => {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [papers, setPapers] = useState<ProcessedPaper[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'table'>('console');

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleSearchAndProcess = useCallback(async () => {
    if (!process.env.API_KEY) {
      alert("API Key is missing via process.env.API_KEY");
      return;
    }

    try {
      setStatus(ProcessingStatus.SEARCHING);
      setPapers([]);
      setLogs([]);
      addLog(`Initiating Search Simulation (Year: 2025)...`);
      addLog(`Query: ${query}`);

      // 1. Search (Simulation)
      const rawPapers: RawPaper[] = await simulateSearch(query);
      addLog(`Found ${rawPapers.length} relevant documents.`);
      
      setStatus(ProcessingStatus.EXTRACTING);
      setActiveTab('table');

      const processedResults: ProcessedPaper[] = [];

      // 2. Extract & Clean (Sequential for demonstration, parallel in prod)
      for (const paper of rawPapers) {
        addLog(`Processing ID ${paper.id}... Extracting metadata.`);
        
        const extractedData = await extractMetadataFromText(paper.text);
        
        // 3. Clean
        const cleanData = {
          ...extractedData,
          Longitude: parseCoordinates(extractedData.Longitude),
          Latitude: parseCoordinates(extractedData.Latitude),
        };

        const finalPaper: ProcessedPaper = {
          id: paper.id,
          rawText: paper.text,
          ...cleanData
        };

        processedResults.push(finalPaper);
        setPapers(prev => [...prev, finalPaper]); // Real-time update
        addLog(`✓ Parsed: ${finalPaper.Title?.substring(0, 40)}...`);
      }

      setStatus(ProcessingStatus.COMPLETED);
      addLog("Workflow completed successfully.");

    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [query]);

  const handleExport = () => {
    exportToCSV(papers, 'soil_carbon_spectroscopy_2025.csv');
    addLog("Exported data to CSV.");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg shadow-lg shadow-cyan-500/20">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SoilCarbon Intel</h1>
              <p className="text-xs text-slate-400">Bibliometric & Chemometric Automated Extraction</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono">
                v1.0.0
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Controls & Console */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Query Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-cyan-400">
              <Search className="w-5 h-5" />
              <h2 className="font-semibold text-white">WoS Search Query</h2>
            </div>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none resize-none"
            />
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={handleSearchAndProcess}
                disabled={status === ProcessingStatus.SEARCHING || status === ProcessingStatus.EXTRACTING}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === ProcessingStatus.SEARCHING ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                ) : status === ProcessingStatus.EXTRACTING ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                ) : (
                  <><Database className="w-4 h-4" /> Run Automation</>
                )}
              </button>
            </div>
          </div>

          {/* Console Log */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 shadow-sm h-[400px] flex flex-col">
            <h2 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              System Logs
            </h2>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
              {logs.length === 0 && <span className="text-slate-500 italic">Ready to start...</span>}
              {logs.map((log, i) => (
                <div key={i} className="text-slate-400 break-words border-l-2 border-slate-700 pl-2">
                  {log}
                </div>
              ))}
              <div id="log-end"></div>
            </div>
          </div>
        </div>

        {/* Right Column: Data Display */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)]">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl flex-1 flex flex-col overflow-hidden shadow-xl">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
              <div className="flex items-center gap-4">
                 <h2 className="font-semibold text-white">Extraction Results</h2>
                 <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-md">{papers.length} Records</span>
              </div>
              <button 
                onClick={handleExport}
                disabled={papers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </button>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto relative bg-[#0f172a]">
              {papers.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
                  {status === ProcessingStatus.SEARCHING ? (
                     <div className="flex flex-col items-center">
                        <Globe className="w-16 h-16 animate-pulse mb-4 text-cyan-700" />
                        <p>Scanning Web of Science...</p>
                     </div>
                  ) : status === ProcessingStatus.EXTRACTING ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 animate-spin mb-4 text-cyan-700" />
                        <p>Parsing Literature...</p>
                     </div>
                  ) : (
                    <>
                      <Database className="w-16 h-16 mb-4" />
                      <p>No data extracted yet.</p>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-900 sticky top-0 z-10 shadow-md">
                    <tr>
                      {["Year", "Title", "Country", "Coordinates", "LULC", "Model", "R2", "RMSE"].map((h) => (
                        <th key={h} className="px-6 py-3 font-medium text-slate-400 border-b border-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {papers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-slate-300">{paper.Year}</td>
                        <td className="px-6 py-4 text-white font-medium max-w-xs truncate" title={paper.Title}>
                          {paper.Title}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{paper.Country || '-'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-cyan-400">
                          {paper.Latitude && paper.Longitude ? 
                            `${paper.Latitude}, ${paper.Longitude}` : 
                            <span className="text-slate-600">N/A</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-xs text-slate-300">
                             {paper.LULC || 'Unknown'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{paper.Calibration_Model || 'N/A'}</td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">{paper.R2?.toFixed(2) || '-'}</td>
                        <td className="px-6 py-4 text-rose-400">{paper.RMSE?.toFixed(2) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t border-slate-700 bg-slate-800 text-xs text-slate-500 flex justify-between px-4">
               <span>Simulated Data Environment</span>
               {status === ProcessingStatus.COMPLETED && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3"/> Done</span>}
               {status === ProcessingStatus.ERROR && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3"/> Failed</span>}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
