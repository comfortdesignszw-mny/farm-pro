import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  Send,
  Camera,
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
import { ChatMessage, Farm, DiagnosticData, AdvisorIntent } from '../../types';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { blobToBase64 } from '../../utils/imageCompressor';
import { speakText, stopSpeech } from '../../utils/speechSynthesis';

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
      await db.chatMessages.add(starter);
      setMessages([starter]);
    } else {
      setMessages(saved);
    }
  };

  const searchOfflineKnowledgeBase = async (
    query: string
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

      const fullReply = `📌 **${bestMatch.title}**\n\n${bestMatch.summary}\n\n${bestMatch.bulletPoints
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

    // Default offline fallback
    if (i18n.language === 'sn') {
      const msg = `📌 **Zano rePurazi**: Ndatenda nemubvunzo. Tarisai zvikamu zvezvirimwa nezvipfuyo zviri paFarm Pro kuti muwane magwaro akazara. Kana maverenga pamusoro pezvirwere zvakakomba, tapota tsvagai mudhumeni wekurima weAGRITEX kana chiremba wemhuka ari pedyo.`;
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
      const msg = `📌 **Iseluleko**: Ngiyabonga ngombuzo wakho. Qala ukhangele iziqondiso zezitshalo lezifuyo ezibhalwe ku-Farm Pro. Nxa kuyisifo esikhulu, thintana lomeluleki wezolimo weduze lawe.`;
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

    const defaultMsg = `📌 **Farm Advisory**: Consult the built-in Crop & Species Management Guides inside Farm Pro for complete offline agronomy and livestock protocols. For severe acute disease symptoms, immediately isolate affected animals or plants and contact local AGRITEX / Veterinary officers.`;
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text && !attachedPhoto) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text || (attachedPhoto ? 'Please inspect this farm photo and diagnose.' : ''),
      mediaAttachment: attachedPhoto || undefined,
      timestamp: Date.now(),
      synced: isOnline,
    };

    await db.chatMessages.add(userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    const photoToProcess = attachedPhoto;
    setAttachedPhoto(null);
    setIsTyping(true);

    try {
      let replyContent = '';
      let diagnosticData: DiagnosticData | undefined = undefined;
      let isAiGenerated = false;

      if (isOnline) {
        let imageBase64: string | undefined = undefined;
        if (photoToProcess) {
          try {
            imageBase64 = await blobToBase64(photoToProcess);
          } catch (e) {
            console.warn('Error reading photo base64', e);
          }
        }

        const res = await fetch('/api/farmchat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            imageBase64,
            language: i18n.language,
            farmContext: {
              name: farm.name,
              size: `${farm.size} ${farm.sizeUnit}`,
              location: farm.location,
              crops: farm.cropsSpecialized,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          replyContent = data.reply;
          diagnosticData = data.data;
          isAiGenerated = data.isAiGenerated;
        } else {
          // Fallback to offline knowledge base if API returned error
          const offlineRes = await searchOfflineKnowledgeBase(text);
          replyContent = offlineRes.text;
          diagnosticData = offlineRes.data;
        }
      } else {
        // Pure Offline Search
        const offlineRes = await searchOfflineKnowledgeBase(text);
        replyContent = offlineRes.text;
        diagnosticData = offlineRes.data;
      }

      const botMessageId = 'msg_' + (Date.now() + 1);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: replyContent,
        diagnosticData,
        timestamp: Date.now(),
        synced: isOnline,
        isOfflineGenerated: !isAiGenerated,
      };

      await db.chatMessages.add(botMessage);
      setMessages((prev) => [...prev, botMessage]);

      // Auto Speak-Back if enabled
      if (autoSpeakBack) {
        playSpeechForMessage(botMessageId, replyContent);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = await searchOfflineKnowledgeBase(text);
      const botMessageId = 'msg_' + (Date.now() + 1);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: fallback.text,
        diagnosticData: fallback.data,
        timestamp: Date.now(),
        synced: false,
        isOfflineGenerated: true,
      };
      await db.chatMessages.add(botMessage);
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
    <div className="pb-28 max-w-4xl mx-auto px-3 sm:px-4 py-3 flex flex-col h-[calc(100vh-140px)]">
      {/* 1. Header & Online/Offline Notice */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 mb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <MessageSquareQuote className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-farm-navy">
                  FarmChat Advisor
                </h2>
                {voiceMode === 'voice_search' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>Voice Consultation</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                AI Agricultural & Veterinary Advisor • Multi-language (EN / Shona / Ndebele)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAgritexModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Extension / Vet Directory"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">AGRITEX / Vet Contacts</span>
            </button>

            {speakingMsgId && (
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setSpeakingMsgId(null);
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Stop Speaking"
              >
                <Square className="w-3.5 h-3.5 fill-rose-600" />
                <span>Stop Voice</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Connectivity status banner */}
        <div
          className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
            isOnline
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>Online AI Vision & Diagnostics Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>Offline Mode Active • Built-in Farm Guides & Decision Tree</span>
              </>
            )}
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            {autoSpeakBack ? '🔊 Auto Speak-Back' : '🔇 Silent Mode'}
          </div>
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
        {/* Sample Question Chips if short history */}
        {messages.length <= 2 && (
          <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-farm-cyan/30 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-black text-farm-navy uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-farm-cyan" />
              <span>Common Smallholder Questions & Quick Diagnosis</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePromptCategories.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.query)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-farm-navy hover:text-white border border-slate-200 text-slate-800 text-xs font-bold transition-all text-left cursor-pointer shadow-xs"
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
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-9 h-9 rounded-xl bg-farm-navy text-farm-cyan flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-5 h-5 stroke-[2.4]" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs relative group ${
                  isUser
                    ? 'bg-farm-navy text-white rounded-br-xs'
                    : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200'
                }`}
              >
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
                  <div className="mb-2.5 rounded-xl overflow-hidden max-h-56 border border-white/20">
                    <img
                      src={URL.createObjectURL(msg.mediaAttachment)}
                      alt="Attached photo"
                      className="w-full h-full object-cover"
                    />
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
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
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
                    <div className="text-base font-black text-emerald-950 mb-1.5">
                      {diag.diagnosis.most_likely}
                    </div>

                    {diag.diagnosis.other_possibilities &&
                      diag.diagnosis.other_possibilities.length > 0 && (
                        <div className="text-[11px] text-emerald-800">
                          <span className="font-semibold">Other possibilities: </span>
                          {diag.diagnosis.other_possibilities.join(', ')}
                        </div>
                      )}
                  </div>
                )}

                {/* Full Message Body */}
                <div className="text-base leading-relaxed whitespace-pre-wrap font-medium text-slate-800">
                  {msg.content}
                </div>

                {/* Follow-up question quick action */}
                {!isUser && diag?.follow_up_question && (
                  <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-900 mb-0.5">
                        Follow-up question for precise diagnosis:
                      </div>
                      <div className="text-xs text-blue-800 mb-1.5 font-medium">
                        "{diag.follow_up_question}"
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputQuery(`Regarding: ${diag.follow_up_question} - `);
                          document.getElementById('farmchat-text-input')?.focus();
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                      >
                        Tap here to reply to this question
                      </button>
                    </div>
                  </div>
                )}

                {/* Professional Escalation Warning Banner */}
                {!isUser && diag?.escalate_to_professional && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
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
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => playSpeechForMessage(msg.id, msg.content)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCurrentlySpeaking
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isCurrentlySpeaking ? 'Stop speech' : 'Read advice aloud'}
                    >
                      {isCurrentlySpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-rose-600" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-farm-navy" />
                          <span>Listen (Read Aloud)</span>
                        </>
                      )}
                    </button>
                  )}

                  <div
                    className={`text-[11px] font-semibold ${
                      isUser ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-xl bg-farm-cyan text-farm-navy flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-5 h-5 stroke-[2.4]" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-9 h-9 rounded-xl bg-farm-navy text-farm-cyan flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-farm-navy" />
              <span className="text-sm font-bold text-slate-700">
                FarmChat Advisor analyzing symptoms & farm context...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Message Input Strip with Photo & Voice */}
      <div className="mt-2 bg-white rounded-2xl p-2.5 shadow-md border border-slate-200 shrink-0">
        {/* Attached Photo Chip */}
        {attachedPhoto && (
          <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <img
                src={URL.createObjectURL(attachedPhoto)}
                alt="Selected"
                className="w-11 h-11 rounded-lg object-cover border border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Photo Attached for AI Vision Diagnosis
                </span>
                <span className="text-[10px] text-slate-500">
                  Ready to diagnose crop leaves, lesions, pest, or animal symptoms
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Photo attach button */}
          <div className="shrink-0">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="farmchat-photo-input"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAttachedPhoto(f);
              }}
            />
            <button
              type="button"
              id="farmchat-camera-btn"
              onClick={() => document.getElementById('farmchat-photo-input')?.click()}
              className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-farm-navy flex items-center justify-center transition-colors cursor-pointer"
              title="Attach Photo for Diagnosis"
            >
              <Camera className="w-6 h-6 stroke-[2.2] text-farm-navy" />
            </button>
          </div>

          {/* Voice Input Button with Voice Consultation auto-send support */}
          <VoiceInputButton
            onTranscript={(text) => {
              if (voiceMode === 'transcribe') {
                setInputQuery((prev) => (prev ? `${prev} ${text}` : text));
              } else {
                setInputQuery(text);
              }
            }}
            onFinalTranscript={(finalText) => {
              if (voiceMode === 'voice_search' && finalText.trim()) {
                handleSendMessage(finalText.trim());
              }
            }}
            className="shrink-0"
          />

          {/* Text Input */}
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
              voiceMode === 'voice_search'
                ? 'Type or tap mic for voice consultation (EN / Shona / Ndebele)...'
                : 'Ask advice or attach photo for crop/animal diagnosis...'
            }
            className="flex-1 min-h-[48px] px-3.5 py-2 text-base font-medium rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50"
          />

          {/* Send Button */}
          <button
            type="button"
            id="farmchat-send-btn"
            disabled={!inputQuery.trim() && !attachedPhoto}
            onClick={() => handleSendMessage()}
            className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 bg-farm-navy hover:bg-farm-navy-light disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-1 font-bold transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5 text-farm-cyan" />
          </button>
        </div>
      </div>

      {/* 4. AGRITEX & Veterinary Directory Modal */}
      {showAgritexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAgritexModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  AGRITEX & Veterinary Directory
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Official extension and emergency agricultural escalation
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  <span>AGRITEX Ward Extension Officers</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  Located at every Rural District Council ward center and Growth Point. Contact your Ward Extension Officer for on-site soil sampling, armyworm trap reporting, and input distribution verification.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                <div className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-700" />
                  <span>Department of Veterinary Services (DVS)</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  Responsible for community dipping schedules, livestock brand inspections, movement permits, and compulsory vaccinations (Anthrax, Rabies, Foot and Mouth).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Emergency Quarantine Protocols</span>
                </div>
                <ul className="text-xs text-amber-900 space-y-1 font-medium list-disc list-inside">
                  <li>Isolate sick birds/animals in a secure, disinfected pen immediately.</li>
                  <li>Do not move carcasses or infected crop plants off the farm.</li>
                  <li>Disinfect boots with bleach or virucidal footbath at coop entrances.</li>
                  <li>Never consume meat from animals that died of unknown sudden sickness.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAgritexModal(false)}
              className="mt-5 w-full py-3 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Close Directory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


