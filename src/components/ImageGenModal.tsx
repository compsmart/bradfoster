import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Upload, Loader2, Download } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GEMINI_API_KEY) {
      setError("API Key not found (VITE_GEMINI_API_KEY)");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const contents: any[] = [{ text: prompt }];

      if (referenceImage) {
        // Extract base64 data (remove "data:image/png;base64," prefix)
        const base64Data = referenceImage.split(',')[1];
        // Guess mime type
        const mimeType = referenceImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
        
        contents.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation", // or "imagen-3.0-generate-001" if available to key, but example used gemini-2.0-flash-preview-image-generation
        contents: contents,
        config: {
          responseModalities: ["IMAGE"],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && (part as any).inlineData) {
        const base64Image = (part as any).inlineData.data;
        setGeneratedImage(`data:image/png;base64,${base64Image}`);
      } else {
        throw new Error("No image generated in response");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full border border-gray-700 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
        >
          <X size={24} />
        </button>
        
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-900/50 rounded-lg">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">AI Image Generator</h3>
                <p className="text-gray-400 text-sm">Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="space-y-6">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea 
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reference Image (Optional)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition h-32 bg-gray-900/50"
                        >
                            {referenceImage ? (
                                <img src={referenceImage} alt="Reference" className="h-full object-contain" />
                            ) : (
                                <>
                                    <Upload className="text-gray-500 mb-2" />
                                    <span className="text-gray-500 text-sm">Click to upload</span>
                                </>
                            )}
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {referenceImage && (
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                                className="text-xs text-red-400 mt-2 hover:underline"
                            >
                                Remove Reference
                            </button>
                        )}
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isGenerating || !prompt}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} /> Generate Image
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm">
                            {error}
                        </div>
                    )}
                </form>
            </div>

            {/* Output Column */}
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-300 mb-2">Result</label>
                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center min-h-[300px] relative overflow-hidden group">
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                            <a 
                                href={generatedImage} 
                                download={`generated-${Date.now()}.png`}
                                className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur transition opacity-0 group-hover:opacity-100"
                            >
                                <Download size={20} />
                            </a>
                        </>
                    ) : (
                        <div className="text-gray-600 flex flex-col items-center">
                            <ImageIcon size={48} className="mb-2 opacity-20" />
                            <span>Image will appear here</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

