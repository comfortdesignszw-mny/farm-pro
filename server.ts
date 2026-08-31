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

      const systemInstruction = `You are FarmChat Advisor, an expert, friendly agricultural and veterinary specialist inside Farm Pro.
You support smallholder farmers across crops (maize, tobacco, wheat, soya, groundnuts, sorghum, vegetables, tomatoes, cabbages, onions, potatoes, butternut, etc.) and livestock (broilers, roadrunners/indigenous chickens, layers, cattle, goats, pigs, sheep, ducks, rabbits).

## MANDATORY INTERNET SEARCH FIRST PROTOCOL:
- For EVERY request (photo submission, text query, or voice input), you MUST actively consult and synthesize live internet agricultural and veterinary knowledge.
- Ground your analysis in verified scientific agronomy, regional disease patterns, and approved remedies.

## MULTIMODAL PHOTO DIAGNOSIS PROTOCOL:
When a farmer provides or attaches a photo:
1. Category & Species Identification:
   - Explicitly state whether the image shows a PLANT / CROP or an ANIMAL / LIVESTOCK.
   - Name the specific crop or livestock species (e.g. "Crop: Tomato (Solanum lycopersicum)" or "Livestock: Broiler Chicken (Gallus domesticus)"), including breed or variety if discernible.

2. Physical Health & Symptom Examination:
   - Directly assess and state if the subject is HEALTHY and vigorous, or exhibits PHYSICAL SYMPTOMS OF AN UNHEALTHY PLANT OR ANIMAL.
   - Describe all observable physical symptoms in detail:
     * For Plants: Leaf discoloration/chlorosis, necrotic spots, concentric rings, wilting, curling, powdery mildew, blight lesions, pest chew holes, stem cankers, fruit rot.
     * For Animals: Ruffled feathers, droopiness, abnormal posture, discharge from eyes/beak/nostrils, skin nodules, lesions, diarrhea/droppings color, panting, swollen joints, parasites.

3. Live Internet Search for Common Diseases:
   - If physical symptoms of an unhealthy plant or animal are detected, search the internet for the most common diseases or pests causing those symptoms.
   - Identify the most probable disease, pest infestation, or nutrient deficiency with a clear explanation of why the symptoms match.

4. Quick Actionable Steps & Suggested Remedies:
   - If Healthy: Provide key preventative maintenance, proper spacing/watering, balanced nutrition, and biosecurity to keep it healthy.
   - If Unhealthy / Disease Detected:
     * Immediate quarantine, isolation, or sanitation steps to stop spread.
     * Low-cost cultural & organic solutions (wood ash, neem extract, pruning infected leaves, crop rotation, soap wash, oral rehydration).
     * Recommended chemical sprays or veterinary medications with GENERIC active ingredient names (e.g. Mancozeb, Copper Oxychloride, Lambda-cyhalothrin, Emamectin Benzoate, Imidacloprid, Oxytetracycline, Albendazole, Amprolium, Tylosin, Penicillin-Streptomycin) with EXACT mixing ratios and dosages.

5. Agronomist / Vet Consultation & Referral:
   - For Plant/Crop issues: Clearly advise contacting the local AGRITEX Agricultural Extension Officer / Agronomist for on-site crop inspection.
   - For Animal/Livestock issues: Clearly advise contacting the local Veterinary Doctor / Department of Veterinary Services (Vet) for official confirmation and prescription.

## TEXT & VOICE REQUEST PROTOCOL:
- Analyze the farmer's question, search the internet for the most accurate current data, and provide clear physical signs to inspect, quick practical remedy steps, chemical/veterinary dosages, and professional contact advice.

## VOICE READABILITY & SPEECH OPTIMIZATION:
- Farmers often listen to advice read aloud in the field via text-to-speech.
- Keep sentences clear, crisp, and conversational.
- Express measurements and dosages in full words (e.g. "twenty milliliters in ten liters of water" or "fifty kilograms per hectare") rather than obscure abbreviations.
- NEVER include raw URLs, markdown hyperlinks (e.g. [text](url)), citation brackets like [1] or [2], or search engine names.
- DO NOT use markdown asterisks (**), hashtags (#), or backticks (\`\`\`). Use clean line breaks, section titles ending with a colon on their own line, and clean bullet points (•) or numbered steps (1., 2., 3.).

## LANGUAGE RULES:
${langRule}
If the farmer asks in Shona or Ndebele (via voice, text, or photo submission), answer naturally in that language using clear, standard farming terms.

Farm Context:
${JSON.stringify(farmContext || {})}`;

      let contents: any;
      const isMultimodal = !!imageBase64;

      if (imageBase64) {
        // Dynamically detect mimeType (image/jpeg, image/png, image/webp)
        let mimeType = 'image/jpeg';
        const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }

        // Clean out any data url prefix and whitespace
        const cleanBase64 = imageBase64
          .replace(/^data:[^;]+;base64,/, '')
          .replace(/\s+/g, '')
          .trim();

        const promptText = message && message.trim().length > 0
          ? `Farmer's instructions/notes: "${message}"

Please analyze this farm photo following the Photo Diagnosis Protocol:
1. Category & Species: Identify whether this is a Plant/Crop or Animal/Livestock, naming the specific species and variety/breed.
2. Physical Health Assessment: Determine if it shows a healthy plant/animal or exhibits physical symptoms of disease/unhealthiness. Describe all visible physical symptoms in detail.
3. Common Diseases & Diagnosis: Search for and identify common diseases or pests causing these physical symptoms and provide a clear diagnosis with confidence level.
4. Quick Actionable Steps & Remedies: Provide immediate containment steps, low-cost organic options, and chemical sprays or veterinary medications with generic active names and exact dosages.
5. Agronomist / Vet Contact: Advise on contacting local AGRITEX Agronomists (for crops) or Veterinary Officers (for livestock).`
          : `Please perform an in-depth agricultural and veterinary physical diagnosis of this photo:
1. Category & Species: State whether this is a Plant/Crop or Animal/Livestock, and identify the specific species (and variety/breed if visible).
2. Physical Health Assessment: Check if it is a healthy plant/animal or exhibits physical symptoms of an unhealthy plant/animal. Describe all visible physical signs in detail (leaf spots, wilting, lesions, ruffled feathers, droopiness, discoloration, chew marks, etc.).
3. Common Diseases & Diagnosis: Identify common diseases or pests causing these exact physical symptoms, and state the most probable diagnosis based on agricultural and veterinary data.
4. Quick Actionable Steps & Remedies:
   - If healthy: Tips to keep it thriving and prevent disease.
   - If unhealthy: Immediate containment, low-cost cultural/organic treatments, and safe chemical sprays or veterinary medicines with GENERIC active ingredients and exact application rates/dosages.
5. Agronomist / Vet Contact: Provide clear instructions to contact the local AGRITEX Agricultural Extension Officer (for crops) or Veterinary Services Doctor (for livestock).`;

        contents = [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ];
      } else {
        contents = message;
      }

      // Resilient Multi-tier Gemini AI model fallback chain (including all free and production models)
      // Multimodal vision prioritization for photos, search-grounded prioritization for text & voice
      const modelsToTry = isMultimodal
        ? [
            { model: 'gemini-3.7-flash', useSearch: false, label: 'Gemini 3.7 Flash Vision' },
            { model: 'gemini-flash-latest', useSearch: false, label: 'Gemini Flash Latest Vision' },
            { model: 'gemini-3.1-flash-lite', useSearch: false, label: 'Gemini 3.1 Flash-Lite Vision' },
            { model: 'gemini-flash-lite-latest', useSearch: false, label: 'Gemini Flash-Lite Latest Vision' },
            { model: 'gemini-2.5-flash', useSearch: false, label: 'Gemini 2.5 Flash Vision' },
            { model: 'gemini-2.5-flash-lite', useSearch: false, label: 'Gemini 2.5 Flash-Lite Vision' },
            { model: 'gemini-2.0-flash', useSearch: false, label: 'Gemini 2.0 Flash Vision' },
            { model: 'gemini-2.0-flash-lite', useSearch: false, label: 'Gemini 2.0 Flash-Lite Vision' },
            { model: 'gemini-3.7-flash', useSearch: true, label: 'Gemini 3.7 Flash + Search Grounding' },
            { model: 'gemini-2.5-flash', useSearch: true, label: 'Gemini 2.5 Flash + Search Grounding' },
          ]
        : [
            { model: 'gemini-3.7-flash', useSearch: true, label: 'Gemini 3.7 Flash + Search Grounding' },
            { model: 'gemini-3.1-flash-lite', useSearch: true, label: 'Gemini 3.1 Flash-Lite + Search Grounding' },
            { model: 'gemini-flash-latest', useSearch: true, label: 'Gemini Flash Latest + Search Grounding' },
            { model: 'gemini-2.5-flash', useSearch: true, label: 'Gemini 2.5 Flash + Search Grounding' },
            { model: 'gemini-2.0-flash', useSearch: true, label: 'Gemini 2.0 Flash + Search Grounding' },
            { model: 'gemini-3.7-flash', useSearch: false, label: 'Gemini 3.7 Flash Direct' },
            { model: 'gemini-flash-latest', useSearch: false, label: 'Gemini Flash Latest Direct' },
            { model: 'gemini-3.1-flash-lite', useSearch: false, label: 'Gemini 3.1 Flash-Lite Direct' },
            { model: 'gemini-flash-lite-latest', useSearch: false, label: 'Gemini Flash-Lite Latest Direct' },
            { model: 'gemini-2.5-flash', useSearch: false, label: 'Gemini 2.5 Flash Direct' },
            { model: 'gemini-2.5-flash-lite', useSearch: false, label: 'Gemini 2.5 Flash-Lite Direct' },
            { model: 'gemini-2.0-flash', useSearch: false, label: 'Gemini 2.0 Flash Direct' },
            { model: 'gemini-2.0-flash-lite', useSearch: false, label: 'Gemini 2.0 Flash-Lite Direct' },
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

          // Timeout per tier to quickly transition if an individual endpoint is slow or throttled
          const callPromise = ai.models.generateContent({
            model: attempt.model,
            contents,
            config,
          });

          const tierTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Model ${attempt.model} call timed out`)), 12000)
          );

          const response: any = await Promise.race([callPromise, tierTimeout]);

          if (response?.text && response.text.trim().length > 0) {
            rawResponseText = response.text.trim();
            successfulModel = attempt.label || attempt.model;
            console.log(`FarmChat AI query successfully answered by [${successfulModel}]`);
            break;
          }
        } catch (callError: any) {
          console.warn(`Fallback tier failed: ${attempt.label || attempt.model} (search=${attempt.useSearch}) ->`, callError?.message || callError);
          // Seamlessly proceed to the next fallback tier in the chain
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
        model: successfulModel,
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

