import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from './components/Avatar';
import { ProjectShowcase } from './components/ProjectShowcase';
import { PdfModal } from './components/PdfModal';
import { ImageGenModal } from './components/ImageGenModal';
import { useGeminiLive } from './hooks/useGeminiLive';
import { resumeData } from './data/resume';
import { 
  Github, 
  Linkedin, 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Briefcase, 
  Code, 
  Cpu, 
  Download
} from 'lucide-react';

function App() {
  const { isConnected, isConnecting, isSpeaking, connect, disconnect, analyser, error, expression } = useGeminiLive();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Brad Foster
              </span>
            </div>
            <div className="flex space-x-4 items-center">
               <a href="#experience" className="hover:text-cyan-400 transition hidden md:block">Experience</a>
               <a href="#skills" className="hover:text-cyan-400 transition hidden md:block">Skills</a>
               <a href="#projects" className="hover:text-cyan-400 transition hidden md:block">Projects</a>
               
          

               <button 
                 onClick={() => setShowPdfModal(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-full text-sm font-medium transition"
               >
                 <Download size={16} />
                 <span className="hidden sm:inline">Download CV</span>
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[90vh] flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Text Content */}
        <div className="flex-1 space-y-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-cyan-400 font-semibold tracking-wide uppercase">Technical Architect & Lead Developer</h2>
            <h1 className="text-5xl lg:text-7xl font-bold mt-2 leading-tight">
              Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Intelligent</span><br />
              Web Experiences
            </h1>
            <p className="mt-6 text-xl text-gray-400 max-w-2xl leading-relaxed">
              {resumeData.personalInfo.summary}
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <a 
                href={`tel:${resumeData.personalInfo.phone}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
              >
                <Phone size={20} className="text-cyan-400" />
                <span>Call Me</span>
              </a>
              <a 
                href={`sms:${resumeData.personalInfo.phone}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
              >
                <MessageSquare size={20} className="text-cyan-400" />
                <span>Message Me</span>
              </a>
              <a 
                href={resumeData.personalInfo.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#0077b5] hover:bg-[#006396] rounded-lg transition"
              >
                <Linkedin size={20} />
                <span>LinkedIn</span>
              </a>
              <a 
                href="https://github.com/compsmart"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#333] hover:bg-[#222] rounded-lg transition"
              >
                <Github size={20} />
                <span>GitHub</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* AI Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <Avatar 
            analyser={analyser} 
            isListening={isSpeaking} // Lip sync when AI is speaking
            expression={expression}
            className="w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]"
          />
          
          <div className="mt-8 flex flex-col items-center gap-4">
            {!isConnected ? (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className={`px-8 py-3 rounded-full font-bold shadow-lg transition transform flex items-center gap-2 ${
                  isConnecting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/20 hover:scale-105'
                }`}
              >
                {isConnecting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isConnecting ? 'Connecting...' : 'Chat with AI Brad'}
              </button>
            ) : (
              <button 
                onClick={disconnect}
                className="px-8 py-3 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 rounded-full font-bold transition"
              >
                End Chat
              </button>
            )}
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {isConnected && <p className="text-green-400 text-sm animate-pulse">● AI Active - Listening...</p>}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <Briefcase className="text-cyan-400" size={32} />
            <h2 className="text-3xl font-bold">Professional Experience</h2>
          </div>
          
          <div className="relative border-l-2 border-gray-700 ml-4 space-y-12">
            {resumeData.experience.map((exp, idx) => (
              <div key={idx} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{exp.role}</h3>
                      <p className="text-cyan-400">{exp.company}</p>
                    </div>
                    <div className="text-gray-400 text-sm mt-2 md:mt-0">
                      {exp.period} | {exp.location}
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{exp.description}</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    {exp.achievements.map((ach, i) => (
                      <li key={i}>{ach}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <Code className="text-purple-400" size={32} />
            <h2 className="text-3xl font-bold">Technical Expertise</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumeData.skills.map((skillGroup, idx) => (
              <div key={idx} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:bg-gray-800 transition">
                <h3 className="text-lg font-bold text-cyan-300 mb-4 border-b border-gray-700 pb-2">
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 bg-gray-700 text-gray-200 rounded-md text-sm hover:bg-cyan-900 hover:text-cyan-200 transition cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-gray-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Cpu className="text-green-400" size={32} />
            <h2 className="text-3xl font-bold">AI Project Showcase</h2>
          
          </div>
          <p className="text-gray-400 mt-0">
              Here are some of the AI projects I have worked on more recently.
            </p>
          <ProjectShowcase projects={resumeData.projects} />
          
        </div>
      </section>

      {/* Contact / Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Brad Foster</h3>
              <p className="text-gray-400">
                Building the future of web and AI interactions.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail size={16} /> {resumeData.personalInfo.email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={16} /> {resumeData.personalInfo.phone}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={16} /> {resumeData.personalInfo.location}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href={resumeData.personalInfo.linkedin} className="hover:text-cyan-400">LinkedIn</a></li>
                <li><a href={resumeData.personalInfo.portfolio} className="hover:text-cyan-400">Portfolio</a></li>
                <li><a href={resumeData.personalInfo.company} className="hover:text-cyan-400">Company</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Brad Foster. All rights reserved.
          </div>
        </div>
      </footer>

      {/* PDF Modal */}
      <PdfModal 
        isOpen={showPdfModal} 
        onClose={() => setShowPdfModal(false)} 
        data={resumeData} 
      />

      <ImageGenModal
        isOpen={showImageGen}
        onClose={() => setShowImageGen(false)}
      />

    </div>
  );
}

export default App;
