/**
 * Text to Speech (TTS) utilities for Farm Pro & FarmChat Advisor
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // remove citation brackets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
    .replace(/\*([^*]+)\*/g, '$1') // remove italics
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1') // remove code blocks
    .replace(/^#+\s*(.+)$/gm, '$1.') // replace headings with a sentence
    .replace(/[•\-\*\+]\s*/g, ', ') // convert bullets to natural pauses
    .replace(/https?:\/\/\S+/g, '') // remove urls
    .replace(/[\n\r]+/g, '. ') // replace newlines with pauses
    .replace(/[*#~`_]/g, '') // strip any stray formatting characters
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakText(
  text: string,
  lang: string = 'en',
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Cancel any existing speech
  window.speechSynthesis.cancel();

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) {
    if (onEnd) onEnd();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);

  // Set language
  if (lang === 'sn') {
    utterance.lang = 'sn-ZW';
  } else if (lang === 'nd') {
    utterance.lang = 'nr-ZA';
  } else {
    utterance.lang = 'en-US';
  }

  // Try to find natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.rate = 0.95; // slightly deliberate for clarity
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    if (onEnd) onEnd();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to trigger speech synthesis', err);
    if (onEnd) onEnd();
  }

  return () => {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  };
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
