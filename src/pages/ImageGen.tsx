import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Wand2, 
  Download, 
  Key, 
  ImageIcon, 
  Loader2, 
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export function ImageGen() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string>('image/png');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setSourceImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setSourceImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const extractBase64 = (dataUrl: string): string => {
    return dataUrl.split(',')[1];
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }
    if (!sourceImage) {
      setError('Please upload a source image');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);

    try {
      const ai = new GoogleGenAI({ apiKey });

      const base64Image = extractBase64(sourceImage);

      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: sourceImageMime,
            data: base64Image,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error('No response received from the model');
      }

      for (const part of candidate.content.parts) {
        if (part.text) {
          setGeneratedText(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          setGeneratedImage(`data:${mimeType};base64,${imageData}`);
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `gemini-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSourceImage = () => {
    setSourceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearGeneratedImage = () => {
    setGeneratedImage(null);
    setGeneratedText(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-fuchsia-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-900/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-6">
            <Sparkles size={16} />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Image to Image
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform your images with AI. Upload a source image, describe your vision, and watch the magic happen.
          </p>
        </motion.div>

        {/* API Key Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Key size={16} className="text-violet-400" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition pr-24"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-200 transition"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Get your API key from{' '}
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Source Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Upload size={20} className="text-cyan-400" />
                Source Image
              </h2>

              <div 
                onClick={() => !sourceImage && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`relative aspect-square rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                  sourceImage 
                    ? 'border-gray-700' 
                    : 'border-gray-700 hover:border-violet-500/50 cursor-pointer'
                }`}
              >
                {sourceImage ? (
                  <>
                    <img 
                      src={sourceImage} 
                      alt="Source" 
                      className="w-full h-full object-contain bg-gray-800/50"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearSourceImage(); }}
                      className="absolute top-3 right-3 p-2 bg-gray-900/80 hover:bg-red-500/80 rounded-full transition"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-sm">Drop an image here or click to upload</p>
                    <p className="text-xs mt-1 text-gray-600">PNG, JPG, WEBP supported</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </motion.div>

          {/* Generated Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Wand2 size={20} className="text-fuchsia-400" />
                Generated Image
              </h2>

              <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-700 overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50"
                    >
                      <Loader2 size={48} className="animate-spin text-violet-400 mb-4" />
                      <p className="text-sm text-gray-400">Generating your image...</p>
                      <p className="text-xs text-gray-600 mt-1">This may take a moment</p>
                    </motion.div>
                  ) : generatedImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="w-full h-full object-contain bg-gray-800/50"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={handleDownload}
                          className="p-2 bg-gray-900/80 hover:bg-violet-500/80 rounded-full transition"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={clearGeneratedImage}
                          className="p-2 bg-gray-900/80 hover:bg-red-500/80 rounded-full transition"
                          title="Clear"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"
                    >
                      <Sparkles size={48} className="mb-4 opacity-50" />
                      <p className="text-sm">Your generated image will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Generated Text */}
        <AnimatePresence>
          {generatedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">AI Response</h3>
                <p className="text-gray-200">{generatedText}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Input & Generate Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Describe your transformation
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Transform this photo into a watercolor painting with a sunset sky background..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition resize-none"
            />

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Generate Image
                  </>
                )}
              </button>
              
              {generatedImage && (
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2"
                  title="Regenerate"
                >
                  <RefreshCw size={20} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-600 text-sm"
        >
          <p>Your API key is stored locally and never sent to any server except Google's API.</p>
        </motion.div>
      </div>
    </div>
  );
}

