import React, { useState } from 'react';
import { X, Download, Loader2, Sparkles } from 'lucide-react';
import type { ResumeData } from '../data/resume';
import { generatePdf, type TailoredCVData } from '../utils/generatePdf';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResumeData;
}

const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:8889' : '';

export const PdfModal: React.FC<PdfModalProps> = ({ isOpen, onClose, data }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call the AI API to generate tailored CV content
      const response = await fetch(`${API_URL}/generate-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: data,
          targetCompany: company,
          targetRole: role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate CV');
      }

      const result = await response.json();
      
      if (!result.success || !result.tailoredCV) {
        throw new Error('Invalid response from AI');
      }

      // Generate the PDF with AI-tailored content
      generatePdf(data, company, role, result.tailoredCV as TailoredCVData);
      onClose();
    } catch (err) {
      console.error('Error generating CV:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <X size={24} />
        </button>
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-900/50 rounded-lg">
              <Sparkles className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI-Powered CV</h3>
              <p className="text-xs text-cyan-400">Tailored for your role</p>
            </div>
          </div>
          
          <p className="text-gray-400 mb-6 text-sm">
            Enter the company and role to generate a custom CV tailored specifically for the position using AI.
          </p>
          
          <form onSubmit={handleDownload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
              <input 
                type="text" 
                placeholder="e.g. Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role / Position</label>
              <input 
                type="text" 
                placeholder="e.g. Lead Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating with AI...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Generate & Download PDF</span>
                </>
              )}
            </button>

            {isLoading && (
              <p className="text-center text-gray-500 text-xs">
                AI is tailoring my CV for this specific role...
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
