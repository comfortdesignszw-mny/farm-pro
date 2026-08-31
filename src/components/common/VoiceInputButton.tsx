import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { createSpeechRecognizer, isSpeechSupported, normalizeAgroVoiceTranscript } from '../../utils/speechRecognition';
import { useTranslation } from 'react-i18next';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  lang?: string;
  className?: string;
  buttonSize?: 'compact' | 'normal' | 'large';
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onFinalTranscript,
  onListeningChange,
  lang,
  className = '',
  buttonSize = 'normal',
  label,
}) => {
  const { i18n, t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  const updateListening = (val: boolean) => {
    setIsListening(val);
    if (onListeningChange) onListeningChange(val);
  };

  const stopRecognition = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    updateListening(false);
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supported) {
      alert('Voice speech recognition is not supported in this browser. You can type your question directly.');
      return;
    }

    if (isListening) {
      stopRecognition();
      if (accumulatedTranscriptRef.current && onFinalTranscript) {
        const cleaned = normalizeAgroVoiceTranscript(accumulatedTranscriptRef.current);
        onFinalTranscript(cleaned);
      }
    } else {
      accumulatedTranscriptRef.current = '';
      const recognition = createSpeechRecognizer(
        (text, isFinal) => {
          accumulatedTranscriptRef.current = text;
          onTranscript(text);

          if (isFinal) {
            // Set auto-send silence timer if onFinalTranscript is provided
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              if (onFinalTranscript && text.trim()) {
                stopRecognition();
                const cleaned = normalizeAgroVoiceTranscript(text);
                onFinalTranscript(cleaned);
              }
            }, 1200);
          }
        },
        (error) => {
          console.warn('Voice recognition note:', error);
          updateListening(false);
        },
        () => {
          updateListening(false);
        }
      );

      if (recognition) {
        // Map current language accurately
        const appLang = lang || i18n.language;
        if (appLang === 'sn') {
          recognition.lang = 'sn-ZW';
        } else if (appLang === 'nd') {
          recognition.lang = 'nr-ZA';
        } else {
          recognition.lang = 'en-ZW';
        }

        try {
          recognition.start();
          recognitionRef.current = recognition;
          updateListening(true);
        } catch (err) {
          console.error('Failed to start speech recognition', err);
          updateListening(false);
        }
      }
    }
  };

  const sizeClasses =
    buttonSize === 'compact'
      ? 'h-10 w-10 min-h-[40px] min-w-[40px] p-2 rounded-xl text-xs'
      : buttonSize === 'large'
      ? 'min-h-[52px] min-w-[52px] px-4 py-3 rounded-2xl text-base'
      : 'min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-xl text-sm';

  return (
    <button
      type="button"
      id="voice-input-btn"
      onClick={toggleListening}
      title={isListening ? t('common.listening') : t('common.tap_mic_to_speak')}
      className={`${sizeClasses} flex items-center justify-center gap-2 font-bold transition-all cursor-pointer select-none ${
        isListening
          ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-200 animate-pulse'
          : 'bg-slate-100 hover:bg-slate-200 text-farm-navy active:bg-slate-300'
      } ${className}`}
    >
      {isListening ? (
        <>
          <MicOff className={buttonSize === 'compact' ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white animate-bounce'} />
          {buttonSize !== 'compact' && (
            <span className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-1">
              <span>Listening...</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
              </span>
            </span>
          )}
        </>
      ) : (
        <>
          <Mic className={buttonSize === 'compact' ? 'w-4 h-4 text-farm-navy' : 'w-5 h-5 text-farm-navy'} />
          {label ? <span className="text-sm font-extrabold">{label}</span> : null}
        </>
      )}
    </button>
  );
};
