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
          ? 'Reply strictly in CHI SHONA (Shona). Use natural, warm, everyday agricultural vocabulary understandable to rural Zimbabwean farmers without unnecessary agronomic jargon.'
          : language === 'nd'
          ? 'Reply strictly in ISINDEBELE (Ndebele). Use natural, warm, everyday agricultural vocabulary understandable to rural Zimbabwean farmers without unnecessary agronomic jargon.'
          : 'Reply in clear, warm, encouraging, plain ENGLISH. Keep sentences direct and practical for busy smallholder farmers.';

      const systemInstruction = `You are FarmChat Advisor, an experienced, friendly agricultural and livestock specialist inside Farm Pro.
You speak directly with smallholder farmers managing crops (maize, tobacco, wheat, soya, groundnuts, sorghum, vegetables, tomatoes, cabbages, etc.) and livestock (broilers, roadrunner/indigenous chickens, layers, pigs, cattle, goats, sheep, ducks, rabbits).

## VOICE & AUDITORY ACCURACY OPTIMIZATION:
- Farmers often use Voice Request / Voice Search while working in the field or listening via audio playback.
- Make answers crystal-clear, concise, accurate, and easy to understand when read aloud.
- Express measurements and dosages clearly in full words (e.g. "10 milliliters in 10 liters of water" or "50 kilograms per hectare") rather than obscure abbreviations.
- NEVER include raw URLs, markdown hyperlinks (e.g. [text](url)), citation brackets like [1] or [2], search engine references, or browser navigation artifacts.
- DO NOT use formatting symbols like double asterisks (**), hashtags (#, ##), backticks (\`\`\`), or underscore marks (_). Use clean line breaks, standard bullet points (•), or numbered steps (1., 2., 3.).

## LIVE SEARCH & KNOWLEDGE SYNTHESIS:
- Actively search the internet in the background to retrieve the latest, up-to-date, scientifically accurate agronomic and veterinary data.
- Synthesize all retrieved search info into a warm, practical, highly human-readable advisory summary.

## LANGUAGE RULES:
${langRule}
If the farmer asks in Shona or Ndebele (via voice or text), answer naturally in that language using clear, standard farming terms.

## RESPONSE STRUCTURE:
1. Direct answer / diagnosis in plain, reassuring language.
2. Immediate action steps (isolation, spacing, sanitation, drainage, water supply).
3. Practical treatments:
   - Low-cost, cultural or organic methods first (wood ash, neem extract, crop rotation, pruning, molasses).
   - Safe chemical or veterinary remedies with GENERIC active ingredient names (e.g. Mancozeb, Copper Oxychloride, Imidacloprid, Oxytetracycline, Albendazole, Piperazine), exact application rates, and withholding periods before harvest/consumption.
4. Prevention tips for future cycles.
5. If severe, highly contagious, or zoonotic (e.g. Newcastle disease, Anthrax, Foot-and-Mouth, African Swine Fever, Fall Armyworm, Rabies), advise immediate on-site verification by an AGRITEX Extension Officer or Department of Veterinary Services.

Farm Context:
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
                'Please examine this crop/animal photo, diagnose visible symptoms, identify the pest/disease with confidence level, and recommend immediate practical remedies based on the latest agricultural knowledge.',
            },
          ],
        };
      } else {
        contents = message;
      }

      // Multi-tier model execution with automatic quota and network fallback
      const modelsToTry = [
        { model: 'gemini-3.7-flash', useSearch: true },
        { model: 'gemini-3.1-flash-lite', useSearch: true },
        { model: 'gemini-3.1-flash-lite', useSearch: false },
      ];

      let rawResponseText = '';
      let successfulModel = '';

      for (const attempt of modelsToTry) {
        try {
          const config: any = {
            systemInstruction,
            temperature: 0.3,
          };
          if (attempt.useSearch) {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await ai.models.generateContent({
            model: attempt.model,
            contents,
            config,
          });

          if (response.text && response.text.trim().length > 0) {
            rawResponseText = response.text.trim();
            successfulModel = attempt.model;
            break;
          }
        } catch (callError: any) {
          console.warn(`Attempt with ${attempt.model} (search=${attempt.useSearch}) encountered:`, callError?.message || callError);
          // If error is 429 or quota exceeded, proceed to next fallback tier immediately
        }
      }

      if (!rawResponseText) {
        // Safe server-side agronomic fallback if all live AI tiers hit rate limits or are unreachable
        const fallbackNotice =
          language === 'sn'
            ? 'Panyaya yezvirimwa kana zvipfuyo zvamabvunza: Rangarirai kutevedzera mitemo yekurima kwakanaka. Kana pane chirwere chiri kukanganisa zvirimwa kana mhuka, dzivirirai zvimwe nekukasika, mozoonana nemudhumeni weAGRITEX wepedyo nemi.'
            : language === 'nd'
            ? 'Mayelana lesicelo sakho sezolimo kumbe izifuyo: Khumbula ukulandela iziqondiso ezifanele zokulima lokufuya. Nxa kukhona ukugula okubonakalayo, hlukanisa izifuyo ezigulayo kumbe unqande izitshalo, ubusuthintana lomeluleki wezolimo (AGRITEX).'
            : 'For your agricultural enquiry: Ensure prompt isolation of affected plants or livestock to stop spread. Verify chemical withholding periods, maintain clean water/soil conditions, and consult your local AGRITEX agricultural extension officer for on-site assistance.';

        res.json({
          reply: fallbackNotice,
          data: {
            intent: 'general_question',
            language,
            reply_text: fallbackNotice,
            recommendations: [
              'Follow recommended dosage and chemical withholding intervals',
              'Isolate sick animals or infected crop patches immediately',
              'Consult local AGRITEX extension officers for on-site verification',
            ],
            escalate_to_professional: false,
          },
          isAiGenerated: false,
        });
        return;
      }

      const responseText = rawResponseText;
      // Clean raw markdown syntax, citation numbers, hashtags, and format into natural human conversation text
      const cleanReply = responseText
        .replace(/\[\d+\]/g, '') // remove citation numbers [1], [2]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown hyperlinks
        .replace(/^#{1,6}\s+/gm, '') // remove header hashtags
        .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold asterisks
        .replace(/\*([^*]+)\*/g, '$1') // remove italic asterisks
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^[\*\-]\s+/gm, '• ') // standardize bullet markers
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Extract high-level recommendation bullet points
      const recommendationLines = cleanReply
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))
        .map((line) => line.replace(/^[•\-\d\.]+\s*/, '').trim())
        .filter((line) => line.length > 5 && line.length < 200)
        .slice(0, 5);

      const isHighStakes = /anthrax|newcastle|swine fever|rabies|foot and mouth|agritex|veterinary officer|quarantine/i.test(cleanReply);

      // Determine likely intent
      let intent: any = 'general_question';
      if (/pest|disease|blight|caterpillar|worm|fungus|rot|symptom|sick|shiver|droop/i.test(cleanReply + ' ' + (message || ''))) {
        intent = 'disease_pest_diagnosis';
      } else if (/vaccin|deworm|schedule|dose|inject|antibiotic/i.test(cleanReply + ' ' + (message || ''))) {
        intent = 'vaccination_treatment_schedule';
      } else if (/chicken|cattle|goat|pig|broiler|layer|cow|calf|feed/i.test(cleanReply + ' ' + (message || ''))) {
        intent = 'animal_advisory';
      } else if (/maize|tomato|crop|plant|fertilizer|seed|yield|soil/i.test(cleanReply + ' ' + (message || ''))) {
        intent = 'crop_advisory';
      }

      res.json({
        reply: cleanReply,
        data: {
          intent,
          language,
          reply_text: cleanReply,
          recommendations: recommendationLines.length > 0 ? recommendationLines : [
            'Follow recommended dosage and withholding periods',
            'Isolate sick animals or infected plants to protect your farm',
            'Consult your local AGRITEX extension officer for on-farm assistance',
          ],
          escalate_to_professional: isHighStakes,
        },
        isAiGenerated: true,
      });
    } catch (error: any) {
      console.warn('FarmChat AI handler warning:', error?.message || error);
      res.json({
        reply: 'FarmChat is currently relying on offline agronomic advice. Please check the built-in reference guides or consult AGRITEX.',
        data: {
          intent: 'general_question',
          language: req.body?.language || 'en',
          reply_text: 'FarmChat is currently relying on offline agronomic advice.',
          recommendations: ['Consult local AGRITEX officer', 'Review offline crop and livestock guides'],
          escalate_to_professional: false,
        },
        isAiGenerated: false,
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

