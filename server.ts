import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with 10mb limit for base64 farm photos
  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client lazy initialization
  let aiClient: GoogleGenAI | null = null;
  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // FarmChat Online AI Endpoint
  app.post('/api/farmchat', async (req, res) => {
    try {
      const { message, imageBase64, language = 'en', farmContext } = req.body;

      if (!message && !imageBase64) {
        res.status(400).json({ error: 'Message or image is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback friendly message if key is not yet set
        res.json({
          reply:
            language === 'sn'
              ? 'Ndatenda nemubvunzo wenyu. Parizvino AI server iri kushanda nemaonero ekunze. Shandisai gwaro riri pafoni yenyu kana kutarisa zvirimwa nezvipfuyo.'
              : language === 'nd'
              ? 'Ngiyabonga ngombuzo wakho. Khathesi i-AI isebenza ngendlela yasepulazini. Sebenzisa incwadi ekhona efowunini yakho.'
              : 'Thank you for asking. For optimal farm advice, check the built-in species and crop management guides directly within Farm Pro.',
          isAiGenerated: false,
        });
        return;
      }

      const ai = getAiClient();

      const langInstruction =
        language === 'sn'
          ? 'Respond clearly in SHONA language (Chishona). Use everyday farming words, short bullets, no agronomic jargon.'
          : language === 'nd'
          ? 'Respond clearly in ISINDEBELE language. Use everyday farming words, short bullets, no agronomic jargon.'
          : 'Respond in plain, clear, everyday ENGLISH. Use short bullet points and practical steps without complex agronomic jargon.';

      const systemInstruction = `You are Farm Pro's expert agricultural and veterinary advisor for smallholder and semi-commercial African farmers (Zimbabwe & Southern Africa).
Farmers need immediate, actionable, practical steps.
Rules:
1. Always give answers in short, clear bullet points.
2. Lead with immediate first aid or action (e.g., isolate sick animal, dosage, spacing, water, vaccine timing).
3. Plain everyday words (e.g. "Spray/Chemical", "Top-dressing fertilizer", "Worm medicine"), not scientific jargon.
4. If diagnosing from a photo, clearly state what visible symptoms you see, what disease/pest/deficiency it resembles, and step-by-step remedy.
5. ${langInstruction}
Farm details context: ${JSON.stringify(farmContext || {})}`;

      let contents: any;

      if (imageBase64) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              text: message || 'Please examine this crop/animal photo, diagnose any problem or disease, and provide step-by-step remedy.',
            },
          ],
        };
      } else {
        contents = message;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply = response.text || 'No response received. Please check the built-in guide.';
      res.json({ reply, isAiGenerated: true });
    } catch (error: any) {
      console.error('FarmChat AI API error:', error);
      res.status(500).json({
        error: 'Failed to generate advisory response',
        details: error?.message,
      });
    }
  });

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Farm Pro Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
