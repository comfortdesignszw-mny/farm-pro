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
  VolumeX,
  Radio,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, getAppSettings } from '../../db';
import { ChatMessage, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { blobToBase64 } from '../../utils/imageCompressor';
import { speakText, stopSpeech, isSpeechSynthesisSupported } from '../../utils/speechSynthesis';

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
      const starter: ChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content:
          i18n.language === 'sn'
            ? 'Mhoro! Ndiri FarmChat. Ndibvunzei nezve zvirwere zvezvirimwa, nhomba dzezvipfuyo, fetereza, kana mushonga wemakonye.'
            : i18n.language === 'nd'
            ? 'Salibonani! Ngingu-FarmChat. Ngibuze ngemithi yezitshalo, izifo zezifuyo, umanyolo, kumbe izikelemu.'
            : 'Hello! I am your FarmChat Advisor. Ask me anything about crop diseases, fertilizers, animal vaccines, or farm management.',
        timestamp: Date.now(),
        synced: true,
        isOfflineGenerated: true,
      };
      await db.chatMessages.add(starter);
      setMessages([starter]);
    } else {
      setMessages(saved);
    }
  };

  const searchOfflineKnowledgeBase = async (query: string): Promise<string> => {
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
      return `📌 **${bestMatch.title}**\n\n${bestMatch.summary}\n\n` +
        bestMatch.bulletPoints.map((b: string) => `• ${b}`).join('\n');
    }

    // Default offline fallback
    if (i18n.language === 'sn') {
      return `📌 **Zano rePurazi**: Ndatenda nemubvunzo. Tarisai zvikamu zvezvirimwa nezvipfuyo zviri paFarm Pro kuti muwane magwaro akazara. Kana maverenga pamusoro pezvirwere, tapota tsvagai mudhumeni wekurima kana chiremba wemhuka ari pedyo.`;
    }
    if (i18n.language === 'nd') {
      return `📌 **Iseluleko**: Ngiyabonga ngombuzo wakho. Qala ukhangele iziqondiso zezitshalo lezifuyo ezibhalwe ku-Farm Pro. Nxa kuyisifo esikhulu, thintana lomeluleki wezolimo weduze lawe.`;
    }
    return `📌 **Farm Advisory**: Check the built-in Crops & Animals species guides in Farm Pro for complete agronomy and livestock protocols. For acute disease symptoms, isolate the affected animal/plant promptly.`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text && !attachedPhoto) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text || 'Please inspect attached farm photo.',
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
          isAiGenerated = data.isAiGenerated;
        } else {
          // Fallback to offline knowledge base if API returned error
          replyContent = await searchOfflineKnowledgeBase(text);
        }
      } else {
        // Pure Offline Search
        replyContent = await searchOfflineKnowledgeBase(text);
      }

      const botMessageId = 'msg_' + (Date.now() + 1);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: replyContent,
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
      const fallbackMsg = await searchOfflineKnowledgeBase(text);
      const botMessageId = 'msg_' + (Date.now() + 1);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: fallbackMsg,
        timestamp: Date.now(),
        synced: false,
        isOfflineGenerated: true,
      };
      await db.chatMessages.add(botMessage);
      setMessages((prev) => [...prev, botMessage]);

      if (autoSpeakBack) {
        playSpeechForMessage(botMessageId, fallbackMsg);
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

  const sampleQuestions = [
    t('farmchat.sample_q1'),
    t('farmchat.sample_q2'),
    t('farmchat.sample_q3'),
    t('farmchat.sample_q4'),
  ];

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
                  {t('farmchat.title')}
                </h2>
                {voiceMode === 'voice_search' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>Voice Consultation</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {t('farmchat.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
                <span>{t('farmchat.online_notice')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>{t('farmchat.offline_notice')}</span>
              </>
            )}
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            {autoSpeakBack ? '🔊 Voice Speak-Back On' : '🔇 Silent Mode'}
          </div>
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
        {/* Sample Question Chips if short history */}
        {messages.length <= 2 && (
          <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-farm-cyan/30 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-black text-farm-navy uppercase">
              <HelpCircle className="w-4 h-4 text-farm-cyan" />
              <span>{t('farmchat.sample_questions_title')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-farm-navy hover:text-white border border-slate-200 text-slate-800 text-xs font-bold transition-all text-left cursor-pointer shadow-xs"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCurrentlySpeaking = speakingMsgId === msg.id;

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
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs relative group ${
                  isUser
                    ? 'bg-farm-navy text-white rounded-br-xs'
                    : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200'
                }`}
              >
                {/* User Photo Attachment Preview */}
                {msg.mediaAttachment && (
                  <div className="mb-2.5 rounded-xl overflow-hidden max-h-48 border border-white/20">
                    <img
                      src={URL.createObjectURL(msg.mediaAttachment)}
                      alt="Attached photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Message Body */}
                <div className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.content}
                </div>

                {/* Bottom Card Controls: Timestamp & Speak Out Loud Button */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100/30">
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => playSpeechForMessage(msg.id, msg.content)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isCurrentlySpeaking
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isCurrentlySpeaking ? 'Stop speech' : 'Read advice aloud'}
                    >
                      {isCurrentlySpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-rose-600" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-farm-cyan" />
                          <span>Speak</span>
                        </>
                      )}
                    </button>
                  )}

                  <div
                    className={`text-[11px] font-semibold ${
                      isUser ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <Loader2 className="w-4 h-4 animate-spin text-farm-cyan" />
              <span className="text-sm font-bold text-slate-600">
                Farm Advisor analyzing...
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
          <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={URL.createObjectURL(attachedPhoto)}
                alt="Selected"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="text-xs font-bold text-slate-700">
                Photo ready for diagnosis
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600"
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
              title="Attach Photo"
            >
              <Camera className="w-6 h-6 stroke-[2.2] text-farm-cyan" />
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
                ? 'Type or tap mic to speak consultation...'
                : t('farmchat.input_placeholder')
            }
            className="flex-1 min-h-[48px] px-3.5 py-2 text-base font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50"
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
    </div>
  );
};

