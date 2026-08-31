import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  Send,
  Camera,
  Image as ImageIcon,
  X,
  Wifi,
  WifiOff,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  Loader2,
  Trash2,
  Volume2,
  Square,
  Radio,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Info,
  ShieldAlert,
  Sprout,
  Syringe,
  Bug,
  Eye,
  FileQuestion,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, getAppSettings } from '../../db';
import { ChatMessage, Farm, DiagnosticData, AdvisorIntent, OfficerContact } from '../../types';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { blobToBase64, compressImage } from '../../utils/imageCompressor';
import { speakText, stopSpeech } from '../../utils/speechSynthesis';
import { HumanFormattedMessage } from './HumanFormattedMessage';
import { AgritexDirectoryModal } from '../common/AgritexDirectoryModal';
import { AddEditOfficerModal } from '../common/AddEditOfficerModal';

interface FarmChatModuleProps {
  farm: Farm;
}

export const FarmChatModule: React.FC<FarmChatModuleProps> = ({ farm }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<Blob | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showAgritexModal, setShowAgritexModal] = useState(false);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerContact | null>(null);

  // Voice & TTS state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<'transcribe' | 'voice_search'>('voice_search');
  const [autoSpeakBack, setAutoSpeakBack] = useState<boolean>(true);
  const stopCurrentSpeechRef = useRef<(() => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadMessages();
    loadVoiceSettings();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadVoiceSettings = async () => {
    try {
      const settings = await getAppSettings();
      if (settings) {
        if (settings.voiceMode) setVoiceMode(settings.voiceMode);
        if (settings.autoSpeakBack !== undefined) setAutoSpeakBack(settings.autoSpeakBack);
      }
    } catch (e) {
      console.warn('Could not load voice settings in FarmChat', e);
    }
  };

  const playSpeechForMessage = (messageId: string, text: string) => {
    if (speakingMsgId === messageId) {
      stopSpeech();
      setSpeakingMsgId(null);
      return;
    }

    stopSpeech();
    setSpeakingMsgId(messageId);

    const cancel = speakText(
      text,
      i18n.language,
      () => setSpeakingMsgId(messageId),
      () => setSpeakingMsgId(null)
    );
    stopCurrentSpeechRef.current = cancel;
  };

  const loadMessages = async () => {
    const saved = await db.chatMessages.orderBy('timestamp').toArray();
    if (saved.length === 0) {
      // Seed starter greeting
      const starterContent =
        i18n.language === 'sn'
          ? 'Mhoro! Ndiri FarmChat Advisor wenyu wepaFarm Pro. Ndibvunzei nezve zvirwere zvezvirimwa, nhomba dzezvipfuyo, fotereza, kana mushonga wemakonye. Munokwanisawo kuisa mufananidzo wezvirimwa kana mhuka dzinorwara.'
          : i18n.language === 'nd'
          ? 'Salibonani! Ngingu-FarmChat Advisor we-Farm Pro. Ngibuze ngemithi yezitshalo, izifo zezifuyo, umanyolo, kumbe izikelemu. Ungafaka lesithombe sezitshalo kumbe izifuyo ezigulayo.'
          : 'Hello! I am your FarmChat Advisor inside Farm Pro. Ask me about crop pests, disease diagnosis, livestock vaccines, or farm management. You can also attach photos of affected crops or animals for rapid diagnosis.';

      const starter: ChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content: starterContent,
        timestamp: Date.now(),
        synced: true,
        isOfflineGenerated: true,
        diagnosticData: {
          intent: 'general_question',
          language: (i18n.language as any) || 'en',
          reply_text: starterContent,
          recommendations: [
            i18n.language === 'sn'
              ? 'Tora mufananidzo wechirwere chechirimwa kana chemhuka'
              : i18n.language === 'nd'
              ? 'Thatha isithombe sesifo sezitshalo kumbe izifuyo'
              : 'Take or attach a photo of any crop symptom or sick animal',
            i18n.language === 'sn'
              ? 'Bvunza urongwa hwenhomba dzehuku, nguruve, kana mombe'
              : i18n.language === 'nd'
              ? 'Buza ngohlelo lokugoma izinkukhu lezinye izifuyo'
              : 'Request staged vaccination and deworming schedules',
          ],
          escalate_to_professional: false,
        },
      };
      await db.chatMessages.put(starter);
      setMessages([starter]);
    } else {
      setMessages(saved);
    }
  };

  const searchOfflineKnowledgeBase = async (
    query: string,
    hasPhoto: boolean = false
  ): Promise<{ text: string; data?: DiagnosticData }> => {
    const cleanTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const allGuides = await db.advisoryCache.toArray();

    // Match guides by language first, then tokens
    let bestMatch: any = null;
    let maxScore = 0;

    for (const guide of allGuides) {
      let score = 0;
      const keywords = guide.keywords || [];
      const topic = guide.topic.toLowerCase();
      const title = guide.title.toLowerCase();

      for (const token of cleanTokens) {
        if (keywords.some((k) => k.toLowerCase().includes(token))) score += 3;
        if (topic.includes(token)) score += 4;
        if (title.includes(token)) score += 2;
        if (guide.bulletPoints.some((b) => b.toLowerCase().includes(token))) score += 1;
      }

      // Boost for language match
      if (guide.language === i18n.language) score += 2;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = guide;
      }
    }

    if (bestMatch && maxScore >= 3) {
      const isDiagnosis =
        bestMatch.topic.toLowerCase().includes('diagnosis') ||
        bestMatch.topic.toLowerCase().includes('disease') ||
        bestMatch.topic.toLowerCase().includes('blight') ||
        bestMatch.topic.toLowerCase().includes('armyworm');

      const isVaccine =
        bestMatch.topic.toLowerCase().includes('vaccine') ||
        bestMatch.topic.toLowerCase().includes('protocol');

      const intent: AdvisorIntent = isDiagnosis
        ? 'disease_pest_diagnosis'
        : isVaccine
        ? 'vaccination_treatment_schedule'
        : bestMatch.category === 'crop'
        ? 'crop_advisory'
        : 'animal_advisory';

      const fullReply = `${bestMatch.title}:\n\n${bestMatch.summary}\n\n${bestMatch.bulletPoints
        .map((b: string) => `• ${b}`)
        .join('\n')}`;

      const data: DiagnosticData = {
        intent,
        language: bestMatch.language,
        observation: `Offline reference guide for ${bestMatch.topic}`,
        diagnosis: isDiagnosis
          ? {
              most_likely: bestMatch.title,
              other_possibilities: ['Environmental stress', 'Secondary infection'],
              confidence: 'medium',
            }
          : undefined,
        recommendations: bestMatch.bulletPoints,
        escalate_to_professional: isDiagnosis && bestMatch.topic.toLowerCase().includes('newcastle'),
        reply_text: fullReply,
      };

      return { text: fullReply, data };
    }

    // Photo-specific offline inspection guide if a photo was attached during zero network
    if (hasPhoto) {
      if (i18n.language === 'sn') {
        const photoMsg = `Ongororo yeMufananidzo (Offline Mode):\n\nMufananidzo wenyu wachengetwa. Pamusana pekuti muchina uri offline pasina internet, hezvino zviratidzo zvinowanzoonekwa:\n\n• Zvirimwa: Tarisai mashizha kana aine makwapa matsvuku/brown (Blight), makomba akadyiwa (Fall Armyworm/Mhashu), kana kuti kusanduka ruvara kuva yero. Bvisai mashizha anorwara, shandisai dota remugodhi kana mushonga weMancozeb / Copper Oxychloride.\n• Zvipfuyo/Huku: Tarisai minhenga yakamira, kukotsira, kana manyoka ane ropa (Coccidiosis) kana kuchena/girini (Newcastle). Paridzirai vanorwara pakarepo, vapei mvura ine mavhitamini uye taurai nachiremba wezvipfuyo (Vet) kana mudhumeni weAGRITEX.`;
        return {
          text: photoMsg,
          data: {
            intent: 'disease_pest_diagnosis',
            language: 'sn',
            reply_text: photoMsg,
            recommendations: [
              'Paridzai zvirimwa kana mhuka dzinoratidza kurwara',
              'Tarisai zviri mukati meMagwaro eFarm Pro (Offline Guides)',
              'Batai mudhumeni weAGRITEX kana chiremba wezvipfuyo wepedyo',
            ],
            escalate_to_professional: true,
          },
        };
      }
      if (i18n.language === 'nd') {
        const photoMsg = `Ukuhlolwa kweSitombe (Offline Mode):\n\nIsitombe sakho sigciniwe. Ngenxa yokuthi akukho internet khathesi, nanku okuqakathekileyo ongakuhlola:\n\n• Izitshalo: Khangela amagqabi nxa elemabala ansundu (Blight), imbobo ezidliweyo (Armyworm), kumbe ukutshintsha kombala kube phuzi. Susa amagqabi agulayo, usebenzise umlotha kumbe umuthi weMancozeb.\n• Izifuyo/Izinkukhu: Khangela izimpaphe ezimileyo, ukunqekuzisa ikhanda kumbe uhudo olubomvu (Coccidiosis). Hlukanisa izifuyo ezigulayo masinyane, uziphe amanzi lamavithamini, ubusubiza umeluleki we-AGRITEX kumbe udokotela wezifuyo.`;
        return {
          text: photoMsg,
          data: {
            intent: 'disease_pest_diagnosis',
            language: 'nd',
            reply_text: photoMsg,
            recommendations: [
              'Hlukanisa izitshalo kumbe izifuyo ezigulayo ngokuphazima kweso',
              'Sebenzisa iziqondiso ezibhaliweyo ku-Farm Pro',
              'Biza umeluleki wezolimo we-AGRITEX eduzane lawe',
            ],
            escalate_to_professional: true,
          },
        };
      }

      const photoMsg = `Visual Photo Analysis (Offline Mode):\n\nYour photo has been captured. While offline without live internet search, here is a visual symptom checklist:\n\n• Crop Physical Inspection: Look for brown concentric rings or water-soaked lesions (Early/Late Blight), windowed leaf holes (Fall Armyworm or Stalk Borer), or yellowing veins (Viral/Nutrient deficiency). Immediately prune infected foliage and prepare low-cost organic ash/neem solution or Mancozeb/Copper spray.\n• Livestock Physical Inspection: Check for ruffled feathers, respiratory wheezing, droopiness, or bloody/green diarrhea (Coccidiosis / Newcastle). Immediately quarantine affected animals, provide electrolyte water, and notify your local Veterinary / AGRITEX Extension Officer.`;
      return {
        text: photoMsg,
        data: {
          intent: 'disease_pest_diagnosis',
          language: 'en',
          reply_text: photoMsg,
          recommendations: [
            'Isolate visibly infected crops or sick animals immediately',
            'Consult the built-in Crop & Livestock guides inside Farm Pro',
            'Contact local AGRITEX Agricultural Extension Officer or Veterinary Services',
          ],
          escalate_to_professional: true,
        },
      };
    }

    // Default offline fallback
    if (i18n.language === 'sn') {
      const msg = `Zano rePurazi:\n\nNdatenda nemubvunzo wenyu. Tarisai zvikamu zvezvirimwa nezvipfuyo zviri mukati meFarm Pro kuti muwane magwaro akazara ekurima. Kana maverenga pamusoro pezvirwere zvakakomba, tapota tsvagai mudhumeni wekurima weAGRITEX kana chiremba wemhuka ari pedyo.`;
      return {
        text: msg,
        data: {
          intent: 'general_question',
          language: 'sn',
          reply_text: msg,
          recommendations: [
            'Tarisai magwaro ezvirimwa nezvipfuyo zviri mukati meFarm Pro',
            'Taura nemudhumeni weAGRITEX wenzvimbo yako kana wakaoma musoro',
          ],
          escalate_to_professional: false,
        },
      };
    }
    if (i18n.language === 'nd') {
      const msg = `Iseluleko seZolimo:\n\nNgiyabonga ngombuzo wakho. Qala ukhangele iziqondiso zezitshalo lezifuyo ezibhalwe ku-Farm Pro. Nxa kuyisifo esikhulu, thintana lomeluleki wezolimo weduze lawe.`;
      return {
        text: msg,
        data: {
          intent: 'general_question',
          language: 'nd',
          reply_text: msg,
          recommendations: [
            'Khangela iziqondiso zezitshalo lezifuyo ku-Farm Pro',
            'Thintana lomeluleki we-AGRITEX endaweni yakini',
          ],
          escalate_to_professional: false,
        },
      };
    }

    const defaultMsg = `Farm Advisory:\n\nConsult the built-in Crop & Species Management Guides inside Farm Pro for complete offline agronomy and livestock protocols. For severe acute disease symptoms, immediately isolate affected animals or plants and contact local AGRITEX / Veterinary officers.`;
    return {
      text: defaultMsg,
      data: {
        intent: 'general_question',
        language: 'en',
        reply_text: defaultMsg,
        recommendations: [
          'Consult built-in offline species and crop guides in Farm Pro',
          'Isolate diseased plants or livestock immediately to stop spread',
          'Contact local AGRITEX agricultural extension officer or veterinarian',
        ],
        escalate_to_professional: false,
      },
    };
  };

  const handlePhotoSelected = async (file: File | Blob) => {
    try {
      // Compress to optimal dimensions and lightweight JPEG quality for fast upload on low connection
      const compressed = await compressImage(file, 900, 0.75);
      setAttachedPhoto(compressed);
    } catch (err) {
      console.warn('Image compression fallback to raw file', err);
      setAttachedPhoto(file);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text && !attachedPhoto) return;

    // Initially assume connection might be available to attempt live search
    const initialOnlineEstimate = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      role: 'user',
      content:
        text ||
        (attachedPhoto
          ? 'Please analyze this photo: identify if plant or animal, examine physical symptoms, search for common diseases if unhealthy, and suggest remedies and professional contacts.'
          : ''),
      mediaAttachment: attachedPhoto || undefined,
      timestamp: Date.now(),
      synced: initialOnlineEstimate,
    };

    await db.chatMessages.put(userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    const photoToProcess = attachedPhoto;
    setAttachedPhoto(null);
    setIsTyping(true);

    try {
      let replyContent = '';
      let diagnosticData: DiagnosticData | undefined = undefined;
      let isAiGenerated = false;
      let usedLiveConnection = false;

      // STAGE 1: Force live internet search & multimodal analysis via Gemini Google Search grounding first
      let imageBase64: string | undefined = undefined;
      if (photoToProcess) {
        try {
          imageBase64 = await blobToBase64(photoToProcess);
        } catch (e) {
          console.warn('Error reading photo base64', e);
        }
      }

      // Retrieve live active crops and livestock batches to ground the AI diagnosis with precision
      const activeCrops = await db.cropCycles.filter((c) => c.status === 'active').toArray();
      const activeAnimals = await db.animals.filter((a) => a.status === 'active').toArray();

      const cropsSummary =
        activeCrops.length > 0
          ? activeCrops
              .map(
                (c) =>
                  `${c.cropType} (${c.variety || 'Standard variety'}, planted: ${c.plantingDate}${c.fieldSize ? `, size: ${c.fieldSize}ha` : ''})`
              )
              .join(', ')
          : farm.cropsSpecialized.join(', ');

      const animalsSummary =
        activeAnimals.length > 0
          ? activeAnimals
              .map((a) => `${a.species} (${a.breed || 'Standard'}, batch size: ${a.batchSize || 1}${a.tagOrName ? `, tag: ${a.tagOrName}` : ''})`)
              .join(', ')
          : undefined;

      const requestPayload = {
        message: text,
        imageBase64,
        language: i18n.language,
        farmContext: {
          name: farm.name,
          size: `${farm.size} ${farm.sizeUnit}`,
          location: farm.location,
          crops: cropsSummary,
          livestock: animalsSummary,
        },
      };

      // Force internet calls and analysis first with low-connection tolerance (28s timeout + 1 immediate retry)
      let networkSuccess = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 28000);

          const res = await fetch('/api/farmchat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(requestPayload),
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.reply && data.reply.trim().length > 0) {
              replyContent = data.reply;
              diagnosticData = data.data;
              isAiGenerated = data.isAiGenerated;
              usedLiveConnection = true;
              setIsOnline(true);
              networkSuccess = true;
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`Online search attempt ${attempt} failed on current connection:`, fetchErr);
          // If first attempt failed on low connection, proceed to second attempt immediately before offline fallback
        }
      }

      // STAGE 2: If there is ZERO internet connection (all online attempts fail), fallback to offline knowledge base
      if (!networkSuccess) {
        console.warn('Zero internet connection detected. Falling back to offline agronomy/veterinary knowledge base.');
        setIsOnline(false);
        const offlineRes = await searchOfflineKnowledgeBase(text, !!photoToProcess);
        replyContent = offlineRes.text;
        diagnosticData = offlineRes.data;
        isAiGenerated = false;
        usedLiveConnection = false;
      }

      const botMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: replyContent,
        diagnosticData,
        timestamp: Date.now(),
        synced: usedLiveConnection,
        isOfflineGenerated: !isAiGenerated,
      };

      await db.chatMessages.put(botMessage);
      setMessages((prev) => [...prev, botMessage]);

      // Auto Speak-Back if enabled
      if (autoSpeakBack) {
        playSpeechForMessage(botMessageId, replyContent);
      }
    } catch (err) {
      console.error('Critical Chat error, executing emergency offline fallback:', err);
      setIsOnline(false);
      const fallback = await searchOfflineKnowledgeBase(text, !!photoToProcess);
      const botMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: fallback.text,
        diagnosticData: fallback.data,
        timestamp: Date.now(),
        synced: false,
        isOfflineGenerated: true,
      };
      await db.chatMessages.put(botMessage);
      setMessages((prev) => [...prev, botMessage]);

      if (autoSpeakBack) {
        playSpeechForMessage(botMessageId, fallback.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear chat conversation history?')) {
      stopSpeech();
      await db.chatMessages.clear();
      loadMessages();
    }
  };

  const samplePromptCategories = [
    {
      label: '🌽 Fall Armyworm in Maize',
      query: 'My maize has ragged holes in the leaves and caterpillars in the funnel. How do I treat it?',
    },
    {
      label: '🍅 Tomato Blight / Rot',
      query: 'Tomato leaves are turning dark brown and dying. What spray or treatment should I use?',
    },
    {
      label: '🐔 Sick Chickens / Droppings',
      query: 'My chickens are coughing, shivering, and have green droppings. What should I do immediately?',
    },
    {
      label: '💉 Broiler 6-Week Vaccines',
      query: 'What is the full vaccination and medication schedule for 6-week meat broilers?',
    },
    {
      label: '🐄 Cattle Ticks & Fever',
      query: 'Cattle have heavy tick infestation and high body temperature. What is the recommended treatment and dipping interval?',
    },
  ];

  const getIntentBadge = (intent?: AdvisorIntent) => {
    switch (intent) {
      case 'disease_pest_diagnosis':
        return {
          icon: <Bug className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Disease & Pest Diagnosis',
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
        };
      case 'vaccination_treatment_schedule':
        return {
          icon: <Syringe className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Vaccination & Treatment Protocol',
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        };
      case 'crop_advisory':
        return {
          icon: <Sprout className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Crop Advisory',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      case 'animal_advisory':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Livestock Advisory',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      case 'record_help':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Farm Pro Guide',
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
        };
      case 'unclear':
        return {
          icon: <FileQuestion className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Clarification Needed',
          bg: 'bg-slate-100 border-slate-200 text-slate-800',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-farm-navy" />,
          label: 'Farm Pro Advisor',
          bg: 'bg-cyan-50 border-cyan-200 text-farm-navy',
        };
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    if (confidence === 'high') {
      return {
        label: 'High Confidence',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      };
    }
    if (confidence === 'low') {
      return {
        label: 'Low Confidence (Photo verification recommended)',
        badge: 'bg-rose-100 text-rose-900 border-rose-300',
      };
    }
    return {
      label: 'Moderate Confidence (Field check advised)',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-1.5 flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-136px)]">
      {/* 1. Ultra-Compact Top Header Bar */}
      <div className="bg-white rounded-2xl px-3 py-2 shadow-xs border border-slate-200 mb-1.5 shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-farm-navy tracking-tight truncate">
                FarmChat Advisor
              </h2>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online AI</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <WifiOff className="w-2.5 h-2.5 text-amber-600" />
                  <span>Offline</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setAutoSpeakBack((prev) => !prev)}
            className={`px-2 py-1 rounded-xl border font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              autoSpeakBack
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title={autoSpeakBack ? 'Voice answers enabled (Auto-read responses)' : 'Voice answers muted'}
          >
            <Volume2 className={`w-3.5 h-3.5 ${autoSpeakBack ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{autoSpeakBack ? 'Voice Readout ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAgritexModal(true)}
            className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="AGRITEX & Veterinary Directory"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">AGRITEX</span>
          </button>

          {speakingMsgId && (
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setSpeakingMsgId(null);
              }}
              className="px-2 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Stop Speaking"
            >
              <Square className="w-3 h-3 fill-rose-600" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
        {/* Sample Question Chips if short history */}
        {messages.length <= 2 && (
          <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-farm-cyan/20 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1 text-[11px] font-black text-farm-navy uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-farm-cyan" />
              <span>Common Smallholder Questions</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {samplePromptCategories.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.query)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-farm-navy hover:text-white border border-slate-200 text-slate-800 text-xs font-bold transition-all text-left cursor-pointer shadow-2xs"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCurrentlySpeaking = speakingMsgId === msg.id;
          const diag = msg.diagnosticData;
          const badge = getIntentBadge(diag?.intent);

          return (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-farm-navy text-farm-cyan flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ring-1 ring-farm-cyan/20">
                  <Bot className="w-4 h-4 stroke-[2.4]" />
                </div>
              )}

              <div
                className={`max-w-[95%] sm:max-w-[86%] rounded-2xl p-3 sm:p-4 shadow-xs relative group transition-all ${
                  isUser
                    ? 'bg-farm-navy text-white rounded-tr-xs border border-slate-700/60 ring-1 ring-white/10'
                    : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200 shadow-xs'
                }`}
              >
                {/* Sender Header Pill */}
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/15 dark:border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {isUser ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-farm-cyan">
                        <User className="w-3 h-3 text-farm-cyan" />
                        <span>You (Farmer)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-farm-navy">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>FarmChat AI Advisor</span>
                      </span>
                    )}
                  </div>

                  <div
                    className={`text-[10px] font-semibold ${
                      isUser ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Intent & Mode Badge for Assistant */}
                {!isUser && diag && (
                  <div className="flex flex-wrap items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    {msg.isOfflineGenerated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Offline Knowledge Base
                      </span>
                    )}
                  </div>
                )}

                {/* User Photo Attachment Preview */}
                {msg.mediaAttachment && (
                  <div className="mb-3 rounded-2xl overflow-hidden max-h-60 border-2 border-white/30 shadow-md">
                    <img
                      src={URL.createObjectURL(msg.mediaAttachment)}
                      alt="Farmer crop or livestock photo"
                      className="w-full h-full object-cover max-h-60"
                    />
                    <div className="p-1.5 bg-black/40 text-[11px] text-white font-medium flex items-center gap-1 px-2.5">
                      <Camera className="w-3.5 h-3.5 text-farm-cyan" />
                      <span>Farm diagnosis photo attached by farmer</span>
                    </div>
                  </div>
                )}

                {/* Observation Callout */}
                {!isUser && diag?.observation && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <Eye className="w-4 h-4 text-farm-navy shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Visual Observation:</strong>
                      <span>{diag.observation}</span>
                    </div>
                  </div>
                )}

                {/* Structured Diagnosis Box if present */}
                {!isUser && diag?.diagnosis?.most_likely && (
                  <div className="mb-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/90">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Most Likely Diagnosis:</span>
                      </div>
                      {diag.diagnosis.confidence && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            getConfidenceBadge(diag.diagnosis.confidence).badge
                          }`}
                        >
                          {getConfidenceBadge(diag.diagnosis.confidence).label}
                        </span>
                      )}
                    </div>
                    <div className="text-base sm:text-lg font-black text-emerald-950 mb-1">
                      {diag.diagnosis.most_likely}
                    </div>

                    {diag.diagnosis.other_possibilities &&
                      diag.diagnosis.other_possibilities.length > 0 && (
                        <div className="text-[11px] text-emerald-800 font-medium">
                          <span className="font-bold">Other possibilities: </span>
                          {diag.diagnosis.other_possibilities.join(', ')}
                        </div>
                      )}
                  </div>
                )}

                {/* Full Message Body - High Contrast & Clearly Legible */}
                <div
                  className={`text-base leading-relaxed ${
                    isUser
                      ? 'text-white font-medium drop-shadow-xs'
                      : 'text-slate-900 font-medium'
                  }`}
                >
                  <HumanFormattedMessage content={msg.content} isUser={isUser} />
                </div>

                {/* Follow-up question quick action */}
                {!isUser && diag?.follow_up_question && (
                  <div className="mt-3 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-950 mb-0.5">
                        Follow-up question for precise diagnosis:
                      </div>
                      <div className="text-xs text-blue-900 mb-1.5 font-medium italic">
                        "{diag.follow_up_question}"
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputQuery(`Regarding: ${diag.follow_up_question} - `);
                          document.getElementById('farmchat-text-input')?.focus();
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-950 underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Tap here to answer this question</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Professional Escalation Warning Banner */}
                {!isUser && diag?.escalate_to_professional && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-amber-950">
                        High Stakes / Contagious Alert: Extension or Vet Verification Recommended
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 font-medium leading-normal">
                        This condition has high crop loss or herd contagion stakes. Please verify with your local AGRITEX Extension Officer or Department of Veterinary Services before purchasing costly chemicals.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAgritexModal(true)}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>View AGRITEX & Vet Contacts</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Card Controls: Timestamp & Speak Out Loud Button */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => playSpeechForMessage(msg.id, msg.content)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCurrentlySpeaking
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                      title={isCurrentlySpeaking ? 'Stop speech' : 'Read advice aloud'}
                    >
                      {isCurrentlySpeaking ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-rose-600" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-farm-navy" />
                          <span>Listen (Read Aloud)</span>
                        </>
                      )}
                    </button>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      Farm Pro Diagnostic Engine
                    </span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-10 h-10 rounded-2xl bg-farm-cyan text-farm-navy flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-2 ring-farm-cyan/40">
                  <User className="w-5 h-5 stroke-[2.4]" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-10 h-10 rounded-2xl bg-farm-navy text-farm-cyan flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
              <div>
                <span className="text-sm font-black text-farm-navy block">
                  FarmChat is analyzing your request...
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {isOnline
                    ? 'Searching internet & analyzing physical symptoms for accurate recommendations'
                    : 'Searching built-in offline crop & livestock knowledge base'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Ultra-Slim Message Input Strip */}
      <div className="mt-1 bg-white rounded-2xl p-1.5 sm:p-2 shadow-sm border border-slate-200 shrink-0">
        {/* Attached Photo Chip */}
        {attachedPhoto && (
          <div className="mb-1.5 px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={URL.createObjectURL(attachedPhoto)}
                alt="Selected"
                className="w-8 h-8 rounded-lg object-cover border border-slate-300 shadow-2xs shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  📷 Photo Attached for AI Diagnosis
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Photo attach buttons: Camera & Device Gallery */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Camera Capture */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="farmchat-camera-input"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoSelected(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              id="farmchat-camera-btn"
              onClick={() => document.getElementById('farmchat-camera-input')?.click()}
              className="h-10 w-10 min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-farm-navy flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Take Photo with Camera for Diagnosis"
            >
              <Camera className="w-5 h-5 stroke-[2.2] text-farm-navy" />
            </button>

            {/* Device Gallery / File Upload */}
            <input
              type="file"
              accept="image/*"
              id="farmchat-gallery-input"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoSelected(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              id="farmchat-gallery-btn"
              onClick={() => document.getElementById('farmchat-gallery-input')?.click()}
              className="h-10 w-10 min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-farm-navy flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Upload Image from Device"
            >
              <ImageIcon className="w-5 h-5 stroke-[2.2] text-farm-navy" />
            </button>
          </div>

          {/* Voice Input Button: Transcribes directly into the input box and supports rapid voice search */}
          <VoiceInputButton
            buttonSize="compact"
            onTranscript={(text) => {
              setInputQuery((prev) => {
                if (!prev) return text;
                if (prev.endsWith(text) || text.startsWith(prev)) return text;
                return `${prev} ${text}`;
              });
            }}
            onFinalTranscript={(finalText) => {
              if (finalText && finalText.trim()) {
                handleSendMessage(finalText.trim());
              }
            }}
            className="shrink-0"
          />

          {/* Text Input - Clearly editable before sending */}
          <div className="flex-1 relative">
            <input
              type="text"
              id="farmchat-text-input"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                attachedPhoto
                  ? 'Add notes about photo or tap Send...'
                  : 'Ask any farming question or tap mic...'
              }
              className="w-full h-10 min-h-[40px] px-3 text-sm sm:text-[15px] font-semibold rounded-xl border border-slate-300 focus:border-farm-navy focus:bg-white outline-none bg-slate-50 text-slate-900 transition-colors"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            id="farmchat-send-btn"
            disabled={!inputQuery.trim() && !attachedPhoto}
            onClick={() => handleSendMessage()}
            className="h-10 min-h-[40px] px-3 sm:px-4 bg-farm-navy hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs sm:text-sm transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Send query to FarmChat Advisor"
          >
            <Send className="w-4 h-4 text-farm-cyan stroke-[2.5]" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* 4. AGRITEX & Veterinary Directory Modal */}
      {showAgritexModal && (
        <AgritexDirectoryModal
          isOpen={showAgritexModal}
          onClose={() => setShowAgritexModal(false)}
          onAddCustomOfficer={() => {
            setEditingOfficer(null);
            setShowAddOfficerModal(true);
          }}
          onEditCustomOfficer={(officer) => {
            setEditingOfficer(officer);
            setShowAddOfficerModal(true);
          }}
        />
      )}

      {/* Add / Edit Custom Officer Modal */}
      {showAddOfficerModal && (
        <AddEditOfficerModal
          isOpen={showAddOfficerModal}
          officerToEdit={editingOfficer}
          onClose={() => setShowAddOfficerModal(false)}
          onSaved={() => {
            // Refreshes when directory is open
          }}
        />
      )}
    </div>
  );
};


