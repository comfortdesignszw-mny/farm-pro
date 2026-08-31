/**
 * Web Speech API hook & helper for voice input & agro-voice search
 */
export interface SpeechRecognitionResultState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error?: string;
  startListening: (lang?: string) => void;
  stopListening: () => void;
}

// Declare webkitSpeechRecognition for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Common phonetic and agricultural term normalizer to ensure accurate search queries
export function normalizeAgroVoiceTranscript(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // Common phonetic misrecognitions in agricultural queries
  const replacements: Array<[RegExp, string]> = [
    [/\b(army\s+worm|army\s+worms)\b/gi, 'fall armyworm'],
    [/\b(new\s+castle|new\s+casel)\b/gi, 'Newcastle disease'],
    [/\b(gumboro|gomboro)\b/gi, 'Gumboro disease'],
    [/\b(coccidioses|coxi|coxy)\b/gi, 'coccidiosis'],
    [/\b(man\s+cozeb|manco\s+zeb)\b/gi, 'Mancozeb'],
    [/\b(top\s+dress|top\s+dressing)\b/gi, 'top dressing fertilizer'],
    [/\b(compound\s+d|comp\s+d)\b/gi, 'Compound D fertilizer'],
    [/\b(an\s+fertilizer|ammonium\s+nitrate)\b/gi, 'Ammonium Nitrate (AN)'],
    [/\b(stalk\s+borer|stalkborer)\b/gi, 'maize stalk borer'],
    [/\b(dip\s+tank|diptank)\b/gi, 'cattle dip tank'],
    [/\b(red\s+spider\s+mite|red\s+mite)\b/gi, 'red spider mite'],
    [/\b(late\s+blight|early\s+blight)\b/gi, 'blight fungus'],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  // Remove repeated spaces
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
) {
  if (!isSpeechSupported()) {
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece;
      } else {
        interimTranscript += transcriptPiece;
      }
    }

    if (finalTranscript) {
      const normalized = normalizeAgroVoiceTranscript(finalTranscript);
      onResult(normalized, true);
    } else if (interimTranscript) {
      onResult(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition event error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
