import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with 15mb limit for high-res farm photos
  app.use(express.json({ limit: '15mb' }));

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

  // FarmChat Online AI Advisor Endpoint
  app.post('/api/farmchat', async (req, res) => {
    try {
      const { message, imageBase64, language = 'en', farmContext } = req.body;

      if (!message && !imageBase64) {
        res.status(400).json({ error: 'Message or image is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback friendly message if key is not yet configured
        const fallbackReply =
          language === 'sn'
            ? 'Ndatenda nemubvunzo wenyu. Parizvino mudziyo weAI hauripo online. Tapota tarisai magwaro ezvirimwa nezvipfuyo zviri mukati meFarm Pro kana kutaura nemudhumeni weAGRITEX.'
            : language === 'nd'
            ? 'Ngiyabonga ngombuzo wakho. Khathesi i-AI kayikho online. Khangela iziqondiso zezitshalo lezifuyo ezikhethekileyo ku-Farm Pro kumbe umeluleki wezolimo.'
            : 'Thank you for your question. FarmChat offline mode is active. Please consult the built-in Crop and Species Management Guides or your local AGRITEX extension officer.';

        res.json({
          reply: fallbackReply,
          data: {
            intent: 'general_question',
            language,
            reply_text: fallbackReply,
            recommendations: [
              'Check built-in crop & animal offline reference guides',
              'Contact local AGRITEX extension officer for on-farm verification',
            ],
            escalate_to_professional: false,
          },
          isAiGenerated: false,
        });
        return;
      }

      const ai = getAiClient();

      const langRule =
        language === 'sn'
          ? 'Reply strictly in CHI SHONA (Shona). Use natural, everyday agricultural vocabulary understandable to rural Zimbabwean farmers without unnecessary agronomic jargon.'
          : language === 'nd'
          ? 'Reply strictly in ISINDEBELE (Ndebele). Use natural, everyday agricultural vocabulary understandable to rural Zimbabwean farmers without unnecessary agronomic jargon.'
          : 'Reply in clear, plain ENGLISH. Keep sentences direct and practical for busy smallholder farmers.';

      const systemInstruction = `You are FarmChat Advisor, the built-in agricultural and livestock advisor inside Farm Pro, an offline-first farm management app for smallholder farmers in Zimbabwe and the wider African region.
You talk directly to smallholder farmers (elderly, semi-literate, or busy) with low connectivity and limited data. Every answer must be immediately useful and safe to act on.

## TARGET FARMERS & CONTEXT:
- Smallholder farmers managing crops (per hectare or acre) and/or livestock (chickens/layers, broilers, ducks, pigs, horses, cattle, goats, sheep).
- User language rule: ${langRule} If the farmer's prompt is mixed or written in Shona/Ndebele, match the farmer's language.

## YOUR TASK EVERY TURN:
1. Classify intent into one of:
   - "crop_advisory" (planting, spacing, weeding, fertilizer top-dressing, harvesting)
   - "animal_advisory" (feeding, brooding, breeding, housing, livestock health)
   - "disease_pest_diagnosis" (identifying crop blight, armyworm, pest, livestock sickness, diarrhea, respiratory issues)
   - "vaccination_treatment_schedule" (staged vaccination/deworming protocol by age/stage)
   - "record_help" (how to log crops, animals, yields, or tools in Farm Pro)
   - "general_question" (weather, market timing, soil prep)
   - "unclear" (vague message needing follow-up)

2. Multi-Modal Photo Diagnosis (when photo is provided):
   - Step 1: Observation: Describe what is visually visible first in ONE short sentence (e.g. "The maize leaves show yellow streaking between the veins with brown edges").
   - Step 2: Diagnosis: State the most likely diagnosis (disease/pest/deficiency) + 1-2 other possibilities.
   - Step 3: Confidence level in plain words: "fairly confident", "possible, but hard to confirm from this photo alone", or "low confidence". Never claim 100% certainty from a single photo.
   - Step 4: Actionable Controls:
     a) Immediate action (isolate animal, prune/burn affected leaves, stop watering)
     b) Low-cost, organic, or cultural control options first (ash, neem, spacing, crop rotation)
     c) Chemical/veterinary treatment with GENERIC active ingredient names (not just brand names), dosage guide, and withholding period before harvest/milking/slaughter
     d) Prevention for future seasons
   - Step 5: If severe, highly contagious, zoonotic (e.g., Anthrax, Newcastle, African Swine Fever, Rabies, Foot and Mouth), or low confidence, set escalate_to_professional: true and advise contacting local AGRITEX extension officer or government veterinary department immediately.
   - Step 6: If photo is blurry or missing the key lesion/part, ask for a specific clear close-up photo.

3. Voice/Text Query Handling:
   - If a request is vague (e.g., "my chickens are dying"), provide a concise immediate caution (e.g. isolate flock, check water) and ask 1 focused follow-up question (how many birds, what age, droppings color, respiratory noise).
   - For vaccination schedules: give a concise staged list (Age/Stage → Vaccine / Treatment → Notes) suitable for African smallholders, noting what requires a qualified veterinary professional.

4. Style & Safety Rules:
   - Plain language, short bullet points.
   - Use farmer's preferred units (${farmContext?.sizeUnit || 'ha/acre'}, kg, litres).
   - Never invent false statistics or recommend banned/unsafe chemicals.
   - Always mention protective clothing (gloves/mask) and withholding periods for chemicals.

Farmer Farm Context:
${JSON.stringify(farmContext || {})}`;

      let contents: any;

      if (imageBase64) {
        // Strip data prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text:
                message ||
                'Please examine this crop/animal photo, diagnose visible symptoms, identify the pest/disease with confidence level, and recommend immediate practical remedies.',
            },
          ],
        };
      } else {
        contents = message;
      }

      // Generate structured diagnostic response using responseSchema
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description:
                  'One of: disease_pest_diagnosis, crop_advisory, animal_advisory, vaccination_treatment_schedule, record_help, general_question, unclear',
              },
              language: {
                type: Type.STRING,
                description: 'Language code: en, sn, or nd',
              },
              observation: {
                type: Type.STRING,
                description: 'Short description of what was visually observed or heard',
              },
              diagnosis: {
                type: Type.OBJECT,
                properties: {
                  most_likely: {
                    type: Type.STRING,
                    description: 'Most likely disease, pest, nutrient deficiency or condition',
                  },
                  other_possibilities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1 to 2 differential diagnoses or alternative causes',
                  },
                  confidence: {
                    type: Type.STRING,
                    description: 'high, medium, or low',
                  },
                },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Prioritized actionable steps (immediate, cultural/organic, chemical/vet, prevention)',
              },
              escalate_to_professional: {
                type: Type.BOOLEAN,
                description:
                  'True if severe, contagious, zoonotic, high stakes, or requiring AGRITEX/Vet verification',
              },
              follow_up_question: {
                type: Type.STRING,
                description: 'One specific follow-up question if information is incomplete, or null',
              },
              reply_text: {
                type: Type.STRING,
                description:
                  'The complete, natural-language formatted advisory response to show and speak out loud to the farmer',
              },
            },
            required: ['intent', 'language', 'reply_text', 'recommendations', 'escalate_to_professional'],
          },
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.warn('Could not parse JSON response, using raw text:', err);
        parsedData = {
          intent: 'general_question',
          language,
          reply_text: responseText,
          recommendations: [],
          escalate_to_professional: false,
        };
      }

      res.json({
        reply: parsedData.reply_text || responseText,
        data: parsedData,
        isAiGenerated: true,
      });
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

