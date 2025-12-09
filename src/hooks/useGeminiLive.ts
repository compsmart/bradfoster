import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { resumeData } from '../data/resume';

// Backend endpoint for ephemeral tokens (keeps API key secure on server)
const TOKEN_ENDPOINT = import.meta.env.VITE_TOKEN_ENDPOINT || 'http://127.0.0.1:8889/get-ephemeral-token';
const MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

// ===========================================
// Expression Types for Avatar
// ===========================================
export type Expression = 
  | 'neutral' 
  | 'surprised' 
  | 'thinking' 
  | 'happy' 
  | 'concerned'
  | 'angry'
  | 'sad'
  | 'skeptical'
  | 'excited'
  | 'confused';

const VALID_EXPRESSIONS: Expression[] = [
  'neutral', 'surprised', 'thinking', 'happy', 'concerned',
  'angry', 'sad', 'skeptical', 'excited', 'confused'
];

// ===========================================
// RAG Tool Definitions for CV/Interview Q&A
// ===========================================
const ragTools: any[] = [
  {
    functionDeclarations: [
      {
        name: "get_job_history",
        description: "Returns a list of your previous job roles, companies, dates, and key achievements. Use this when asked about work experience, career history, or previous positions."
      },
      {
        name: "get_current_role",
        description: "Returns details about your current job position, responsibilities, and achievements. Use this when asked about current work or what you do do now."
      },
      {
        name: "get_skills",
        description: "Returns your technical skills organized by category (languages, frameworks, databases, DevOps, AI). Use this when asked about technical abilities or expertise. Optionally filter by category: 'languages', 'database', 'devops', 'architecture', or 'ai'."
      },
      {
        name: "get_education",
        description: "Returns your educational background and qualifications. Use this when asked about education, degrees, or schooling."
      },
      {
        name: "get_projects",
        description: "Returns your portfolio of personal and professional projects. Use this when asked about projects, portfolio work, or things you have built."
      },
      {
        name: "get_contact_info",
        description: "Returns your contact information including email, phone, LinkedIn, and website. Use this when asked how to contact or reach the real Brad."
      },
      {
        name: "get_professional_summary",
        description: "Returns your professional summary and career overview. Use this for introductions or when asked 'tell me about yourself'."
      },
      {
        name: "get_years_experience",
        description: "Calculates and returns how many years of experience you have in various areas. Use this when asked about experience duration."
      },
      {
        name: "set_expression",
        description: "Changes your facial expression to convey emotion. Use this to make conversations more engaging and expressive. Available expressions: 'surprised' (when hearing something unexpected), 'thinking' (when pondering a question), 'happy' (when pleased or discussing positive topics), 'concerned' (when discussing problems), 'angry' (when frustrated), 'sad' (when discussing negative outcomes), 'skeptical' (when doubtful), 'excited' (when enthusiastic), 'confused' (when uncertain), 'neutral' (default calm expression).",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              enum: ["neutral", "surprised", "thinking", "happy", "concerned", "angry", "sad", "skeptical", "excited", "confused"],
              description: "The facial expression to display"
            }
          },
          required: ["expression"]
        }
      },
      {
        name: "get_job_preferences",
        description: "Returns your job search preferences including salary expectations, location preferences, and work arrangement preferences. Use this when asked about salary, where you want to work, remote/hybrid preferences, or relocation."
      },
      {
        name: "get_personal_info",
        description: "Returns personal information about your life outside of work - family, hobbies, interests, and favorite things. Use this when asked personal questions like hobbies, family, interests, favorite team, or what you do for fun."
      }
    ]
  }
];

// ===========================================
// Tool Response Handlers
// ===========================================
function handleToolCall(functionName: string, args?: any): any {
  switch (functionName) {
    case "get_job_history":
      return {
        jobs: resumeData.experience.map(exp => ({
          company: exp.company,
          role: exp.role,
          period: exp.period,
          location: exp.location,
          description: exp.description,
          achievements: exp.achievements
        }))
      };

    case "get_current_role":
      const currentJob = resumeData.experience[0];
      return {
        company: currentJob.company,
        role: currentJob.role,
        period: currentJob.period,
        location: currentJob.location,
        description: currentJob.description,
        achievements: currentJob.achievements,
        isCurrentRole: true
      };

    case "get_skills":
      if (args?.category) {
        const categoryMap: Record<string, string> = {
          'languages': 'Languages & Frameworks',
          'database': 'Database & Storage',
          'devops': 'DevOps & Cloud',
          'architecture': 'Architecture & Systems',
          'ai': 'AI & Emerging Tech'
        };
        const targetCategory = categoryMap[args.category.toLowerCase()];
        const filtered = resumeData.skills.find(s => s.category === targetCategory);
        return filtered || { category: args.category, items: [] };
      }
      return { skills: resumeData.skills };

    case "get_education":
      return { education: resumeData.education };

    case "get_projects":
      return {
        projects: resumeData.projects.map(p => ({
          title: p.title,
          url: p.url,
          description: p.description,
          technologies: p.tags
        }))
      };

    case "get_contact_info":
      return {
        name: resumeData.personalInfo.name,
        email: resumeData.personalInfo.email,
        phone: resumeData.personalInfo.phone,
        linkedin: resumeData.personalInfo.linkedin,
        portfolio: resumeData.personalInfo.portfolio,
        company: resumeData.personalInfo.company,
        location: resumeData.personalInfo.location
      };

    case "get_professional_summary":
      return {
        name: resumeData.personalInfo.name,
        title: resumeData.personalInfo.title,
        summary: resumeData.personalInfo.summary,
        location: resumeData.personalInfo.location
      };

    case "get_years_experience":
      // Calculate from earliest job (2008) to now
      const startYear = 2008; // From Zen Internet
      const currentYear = new Date().getFullYear();
      const totalYears = currentYear - startYear;
      return {
        totalYearsInIT: totalYears,
        yearsAsLeadDeveloper: currentYear - 2014, // Since 121 Customer Insight
        yearsAtCurrentCompany: currentYear - 2020, // Since Playtech
        summary: `Over ${totalYears} years in IT, with ${currentYear - 2014}+ years in lead developer roles`
      };

    case "get_job_preferences":
      return {
        salaryExpectations: {
          minimum: "£80,000",
          maximum: "£100,000",
          currency: "GBP",
          note: "Negotiable depending on the overall package and opportunity"
        },
        locationPreferences: {
          primaryAreas: ["North West England", "Manchester", "Greater Manchester area"],
          workArrangement: "Hybrid preferred, but flexible with remote",
          remoteOpenness: "Yes, fully open to remote work",
          relocationOpenness: "Potentially willing to relocate to Thailand or Dubai for the right opportunity"
        },
        idealRole: {
          type: "Technical Architect, Lead Developer, or Senior Engineering role",
          focus: "AI/ML integration, full-stack development, system architecture"
        }
      };

    case "get_personal_info":
      return {
        family: {
          maritalStatus: "Married",
          children: "2 sons"
        },
        hobbies: [
          "Watching movies",
          "Thai boxing (Muay Thai)",
          "Football",
          "Gaming"
        ],
        sports: {
          favoriteTeam: "Manchester City",
          supports: "Man City - a true blue!"
        },
        gaming: {
          favoriteGame: "Age of Empires 2",
          enjoys: "Strategy games, especially AoE2"
        },
        personality: "Friendly, passionate about technology and always eager to learn new things"
      };

    default:
      return { error: "Unknown function" };
  }
}

interface UseGeminiLiveReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  analyser: AnalyserNode | undefined;
  error: string | null;
  expression: Expression;
}

interface EphemeralTokenResponse {
  token: string;
  expiresAt: string;
  newSessionExpiresAt: string;
  error?: string;
}

export const useGeminiLive = (): UseGeminiLiveReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expression, setExpression] = useState<Expression>('neutral');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const expressionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false); // Ref to track connection state for callbacks
  
  const nextStartTimeRef = useRef(0);
  
  // Set expression with auto-reset to neutral after 3 seconds
  const setExpressionWithReset = useCallback((newExpression: Expression) => {
    // Clear any existing timer
    if (expressionTimerRef.current) {
      clearTimeout(expressionTimerRef.current);
    }
    
    setExpression(newExpression);
    console.log(`😊 Expression changed to: ${newExpression}`);
    
    // Auto-reset to neutral after 3 seconds (unless already neutral)
    if (newExpression !== 'neutral') {
      expressionTimerRef.current = setTimeout(() => {
        setExpression('neutral');
        console.log('😊 Expression reset to neutral');
      }, 3000);
    }
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      analyserRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  const fetchEphemeralToken = async (): Promise<string> => {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Token fetch failed: ${response.status}`);
    }
    
    const data: EphemeralTokenResponse = await response.json();
    
    if (data.error) throw new Error(data.error);
    if (!data.token) throw new Error('No token received from server');
    
    console.log(`Ephemeral token received, expires at: ${data.expiresAt}`);
    return data.token;
  };

  const playAudio = useCallback((base64Audio: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }
      
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      } else {
        source.connect(ctx.destination);
      }
      
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      
      setIsSpeaking(true);
      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error("Error playing audio:", e);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsConnecting(true);
      
      const ephemeralToken = await fetchEphemeralToken();
      
      initAudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ai = new GoogleGenAI({ 
        apiKey: ephemeralToken,
        httpOptions: { apiVersion: 'v1alpha' }
      });
      
      console.log("Connecting to Gemini Live API...");
      const session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          // System prompt
          systemInstruction: `You are Brad from Rochdale, UK. Talk with a northen English accent. You're an intelligent and knowledgeable technical architect and AI specialist with over 15 years of experience. 

You have access to tools that retrieve your real CV/resume data. ALWAYS use these tools when asked about:
- Your work history, previous jobs, or career → use get_job_history or get_current_role
- Your skills or technical abilities → use get_skills  
- Your education → use get_education
- Your projects or portfolio → use get_projects
- Contact information → use get_contact_info
- Professional summary or "tell me about yourself" → use get_professional_summary
- How long you've been working → use get_years_experience
- Salary expectations, location preferences, remote/hybrid, relocation → use get_job_preferences
- Personal life, hobbies, family, interests, favorite team/games → use get_personal_info

EXPRESSIONS: You control a virtual avatar. Use set_expression to show emotions during conversation:
- Use 'happy' when greeting, discussing successes, or positive topics
- Use 'thinking' when pondering questions or recalling information
- Use 'excited' when talking about projects you're passionate about
- Use 'surprised' when hearing unexpected information
- Use 'concerned' when discussing challenges or problems
- Use 'skeptical' when unsure about something
- Use 'confused' when a question is unclear
Call set_expression naturally throughout the conversation to make it engaging and expressive.

Keep responses conversational and concise. Speak naturally as Brad would in an interview. When giving information from tools, summarize key points rather than reading everything verbatim.`,
          // Voice configuration
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Orus"
              }
            }
          },
          // RAG Tools
          tools: ragTools
        },
        callbacks: {
          onopen: () => {
            console.log("✅ Connected to Gemini Live API");
            isConnectedRef.current = true;
            setIsConnecting(false);
            setIsConnected(true);
          },
          onmessage: (message: any) => {
            // Handle tool calls
            if (message.toolCall) {
              console.log("🔧 Tool call received:", message.toolCall);
              const functionResponses = [];
              
              for (const fc of message.toolCall.functionCalls) {
                console.log(`   Calling: ${fc.name}`, fc.args);
                
                let result;
                
                // Handle expression tool specially (needs access to state setter)
                if (fc.name === 'set_expression') {
                  const expr = fc.args?.expression as Expression;
                  if (expr && VALID_EXPRESSIONS.includes(expr)) {
                    setExpressionWithReset(expr);
                    result = { success: true, expression: expr };
                  } else {
                    result = { error: 'Invalid expression', validExpressions: VALID_EXPRESSIONS };
                  }
                } else {
                  result = handleToolCall(fc.name, fc.args);
                }
                
                console.log(`   Result:`, result);
                
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result }
                });
              }
              
              // Send tool responses back to Gemini
              try {
                if (sessionRef.current && isConnectedRef.current) {
                  sessionRef.current.sendToolResponse({ functionResponses });
                }
              } catch (err) {
                console.debug("Tool response send skipped - connection closing");
              }
              return;
            }
            
            // Handle audio responses
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  playAudio(part.inlineData.data);
                }
              }
            }
            
            // Handle interruptions
            if (message.serverContent?.interrupted) {
              console.log("Response interrupted");
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e: any) => {
            console.error("Live API error:", e?.message || e);
            isConnectedRef.current = false;
            setError(e?.message || "Connection error");
          },
          onclose: (e: any) => {
            console.log(`Disconnected: ${e?.reason || 'Connection closed'}`);
            isConnectedRef.current = false;
            setIsConnected(false);
          },
        },
      });
      
      sessionRef.current = session;
      
      // Setup microphone input at 16kHz
      micContextRef.current = new AudioContext({ sampleRate: 16000 });
      const micSource = micContextRef.current.createMediaStreamSource(stream);
      
      const recorder = micContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = recorder;
      
      recorder.onaudioprocess = (e) => {
        // Check both session exists and connection is active
        if (!sessionRef.current || !isConnectedRef.current) return;
        
        try {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          const base64Audio = btoa(
            new Uint8Array(pcmData.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64Audio,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        } catch (err) {
          // Silently ignore send errors when connection is closing
          console.debug("Audio send skipped - connection closing");
        }
      };

      micSource.connect(recorder);
      const gainNode = micContextRef.current.createGain();
      gainNode.gain.value = 0;
      recorder.connect(gainNode);
      gainNode.connect(micContextRef.current.destination);
      
      console.log("🎤 Microphone active - speak now!");

    } catch (err: any) {
      console.error("Connection error:", err);
      setIsConnecting(false);
      setError(err.message || "Failed to connect");
      disconnect();
    }
  }, [initAudioContext, playAudio]);

  const disconnect = useCallback(() => {
    // Set connected to false first to stop any pending sends
    isConnectedRef.current = false;
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (err) {
        console.debug("Session close error (may already be closed)");
      }
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micContextRef.current) {
      micContextRef.current.close();
      micContextRef.current = null;
    }
    if (expressionTimerRef.current) {
      clearTimeout(expressionTimerRef.current);
      expressionTimerRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setExpression('neutral');
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    analyser: analyserRef.current || undefined,
    error,
    expression
  };
};
