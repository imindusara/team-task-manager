import React, { useState } from 'react';
import { X, Sparkles, Printer, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import ReactMarkdown from 'react-markdown';

export default function AIReportModal({ isOpen, onClose }) {
  const { generateAIReport } = useTasks();
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const result = await generateAIReport();
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:block">
      
      {/* Hide close button and non-report elements when printing */}
      <div 
        className={`w-full ${report ? 'max-w-4xl h-[90vh]' : 'max-w-lg'} bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl flex flex-col overflow-hidden transition-all duration-500 print:border-none print:shadow-none print:w-full print:h-auto print:bg-white print:text-black`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 print:hidden">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-400" />
            AI HR Executive Report
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar print:overflow-visible print:p-8">
          
          {/* Input State */}
          {!loading && !report && (
            <div className="space-y-6 print:hidden">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                <p className="font-semibold mb-1">How this works:</p>
                <p>This tool securely packages your team's live task metrics, leaves, and events from Supabase, then sends them to the Google Gemini 1.5 Flash API to generate a professional HR summary.</p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles size={16} />
                  Generate AI Summary & Meeting Report
                </button>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-6 print:hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Loader2 size={48} className="text-emerald-400 animate-spin relative z-10" />
              </div>
              <p className="text-emerald-300 font-semibold animate-pulse text-sm">
                AI is analyzing team productivity and generating executive report...
              </p>
            </div>
          )}

          {/* Report State */}
          {report && !loading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center print:hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  <CheckSquare size={14} /> Report Generated Successfully
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-slate-700"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
              </div>

              {/* Printable Area */}
              <div className="prose prose-invert prose-emerald max-w-none 
                  prose-headings:font-black prose-h1:text-3xl prose-h2:text-xl
                  prose-p:text-slate-300 prose-li:text-slate-300
                  print:prose-p:text-black print:prose-headings:text-black print:prose-li:text-black
                  print:prose-strong:text-black
              ">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
