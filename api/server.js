import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8889;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Initialize Google Gen AI client with your API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is not set!');
  console.error('   Create a .env file in the api folder with: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generate Ephemeral Token for Gemini Live API
 * @see https://ai.google.dev/gemini-api/docs/ephemeral-tokens
 */
app.post('/get-ephemeral-token', async (req, res) => {
  try {
    // Token expiration times
    const expireTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes to start session

    // Create ephemeral token
    const token = await client.authTokens.create({
      config: {
        uses: 1, // Single use token
        expireTime: expireTime.toISOString(),
        newSessionExpireTime: newSessionExpireTime.toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    console.log(`✅ Ephemeral token created:`);
    console.log(`   Token name: ${token.name}`);
    console.log(`   Expires at: ${expireTime.toISOString()}`);
    console.log(`   Full response:`, JSON.stringify(token, null, 2));

    res.json({
      token: token.name,
      expiresAt: expireTime.toISOString(),
      newSessionExpiresAt: newSessionExpireTime.toISOString(),
    });

  } catch (error) {
    console.error('❌ Error creating ephemeral token:', error);
    res.status(500).json({
      error: 'Failed to create ephemeral token',
      details: error.message,
    });
  }
});

/**
 * Generate AI-Tailored CV Content
 * Uses Gemini to tailor resume data for a specific company and role
 */
app.post('/generate-cv', async (req, res) => {
  try {
    const { resumeData, targetCompany, targetRole } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Define the schema for structured output
    const cvSchema = {
      type: 'object',
      properties: {
        tailoredTitle: {
          type: 'string',
          description: 'A professional title tailored to highlight relevance for the target role'
        },
        tailoredSummary: {
          type: 'string',
          description: 'A professional summary (2-3 sentences) tailored for the specific company and role, highlighting the most relevant experience and skills'
        },
        prioritizedSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            },
            required: ['category', 'items']
          },
          description: 'Skills reorganized and prioritized based on relevance to the target role. Most relevant categories first.'
        },
        tailoredExperience: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              role: { type: 'string' },
              period: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string', description: 'Brief description tailored to highlight relevance to target role' },
              achievements: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key achievements rephrased to emphasize skills relevant to the target role'
              }
            },
            required: ['company', 'role', 'period', 'location', 'description', 'achievements']
          },
          description: 'Work experience with descriptions and achievements tailored to highlight relevance to the target role'
        },
        coverNote: {
          type: 'string',
          description: 'A brief 1-2 sentence personalized note explaining why this candidate would be a great fit for this specific role at this company'
        }
      },
      required: ['tailoredTitle', 'tailoredSummary', 'prioritizedSkills', 'tailoredExperience', 'coverNote']
    };

    const prompt = `You are an expert CV writer and career consultant. Analyze the following resume data and tailor it specifically for a ${targetRole || 'developer'} position at ${targetCompany || 'a technology company'}.

IMPORTANT INSTRUCTIONS:
- Rewrite the professional summary to highlight the most relevant experience for this specific role
- Reorder and prioritize skills based on what would be most valuable for this position
- Rephrase job descriptions and achievements to emphasize transferable skills and relevant experience
- Keep all factual information (dates, company names, etc.) accurate - only rephrase descriptions
- Be professional but engaging - this should stand out to recruiters
- For the cover note, be specific about why this candidate's experience makes them ideal for ${targetCompany || 'this company'}

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Generate a tailored version of this CV optimized for ${targetRole || 'this role'} at ${targetCompany || 'this company'}.`;

    console.log(`📝 Generating tailored CV for ${targetRole} at ${targetCompany}...`);

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: cvSchema,
      },
    });

    const tailoredCV = JSON.parse(response.text);
    
    console.log(`✅ CV generated successfully`);

    res.json({
      success: true,
      tailoredCV,
    });

  } catch (error) {
    console.error('❌ Error generating CV:', error);
    res.status(500).json({
      error: 'Failed to generate tailored CV',
      details: error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 Ephemeral Token Server running at http://127.0.0.1:${PORT}`);
  console.log(`   POST /get-ephemeral-token - Generate a new token`);
  console.log(`   GET  /health - Health check\n`);
});

