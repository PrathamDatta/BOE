import React, { useState, useRef } from 'react';
import { useCompany } from '../context/CompanyContext';
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const STAGES = [
  { id: '1', title: 'Stage 1: BOE Master', desc: 'Create Master records (1 per BOE)' },
  { id: '2', title: 'Stage 2: DO & Duty Payments', desc: 'Recorded values (Multiple per BOE)' },
  { id: '3', title: 'Stage 3: Storage Charges', desc: 'Recorded values (Single per BOE)' },
  { id: '4', title: 'Stage 4: Customer Invoices', desc: 'Invoiced values for all components' },
];

export const UploadModule = () => {
  const { selectedCompanyId } = useCompany();
  const [selectedStage, setSelectedStage] = useState('1');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCompanyId) return;

    setStatus('uploading');
    setSkipped([]);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', selectedCompanyId.toString());
    formData.append('stage', selectedStage);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/api/upload/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      setResultMsg(`Successfully imported ${res.data.imported} records.`);
      if (res.data.skippedBOEs?.length > 0) {
        setSkipped(res.data.skippedBOEs);
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setStatus('error');
      setResultMsg(err.response?.data?.error || err.message || 'Upload failed');
    }
  };

  if (!selectedCompanyId) {
    return <div className="text-center mt-20 text-slate-400">Please select a company from the sidebar first.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Data Ingestion</h2>
        <p className="text-slate-400">Upload CSV files to update financial records and trigger reconciliation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Stage Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">1. Select Target Stage</h3>
          <div className="space-y-3">
            {STAGES.map((s) => (
              <div 
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                  selectedStage === s.id 
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
                    : 'bg-surface border-white/5 hover:border-white/10 hover:bg-surface-hover'
                }`}
              >
                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedStage === s.id ? 'border-brand-500' : 'border-slate-600'
                }`}>
                  {selectedStage === s.id && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                </div>
                <div>
                  <h4 className={`font-medium ${selectedStage === s.id ? 'text-brand-400' : 'text-slate-200'}`}>
                    {s.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Upload Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">2. Upload CSV File</h3>
          
          <div 
            className="glass-panel p-8 border-dashed border-2 border-slate-700 flex flex-col items-center justify-center text-center min-h-[300px] relative transition-colors hover:border-brand-500/50"
          >
            <input 
              type="file" 
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="bg-surface p-4 rounded-full mb-4">
              <FileType className="w-8 h-8 text-brand-400" />
            </div>
            
            <h4 className="text-lg font-medium text-slate-200 mb-2">
              {file ? file.name : 'Drag & Drop CSV here'}
            </h4>
            <p className="text-sm text-slate-400 mb-6 max-w-[200px]">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from your computer'}
            </p>
            
            <button 
              disabled={!file || status === 'uploading'}
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              className="relative z-20 w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              {status === 'uploading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  Upload File
                </>
              )}
            </button>
          </div>

          {/* Feedback */}
          {status === 'success' && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-300 font-medium">{resultMsg}</p>
                {skipped.length > 0 && (
                  <div className="mt-2 text-sm text-emerald-400/80">
                    Skipped unknown BOEs: {skipped.slice(0, 5).join(', ')}
                    {skipped.length > 5 && ` +${skipped.length - 5} more`}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{resultMsg}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
