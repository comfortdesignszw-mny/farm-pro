/**
 * Text to Speech (TTS) utilities for Farm Pro & FarmChat Advisor
 * Optimizes agricultural text for crystal-clear auditory delivery
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text
    // Remove citation brackets e.g. [1], [2]
    .replace(/\[\d+\]/g, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown bold/italics/code
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Replace headings with clean pauses
    .replace(/^#+\s*(.+)$/gm, '$1.')
    // Convert bullets to conversational pauses
    .replace(/[•\-\*\+]\s*/g, ', ')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Spoken unit expansions for agricultural clarity
    .replace(/\b(\d+)\s*ml\b/gi, '$1 milliliters')
    .replace(/\b(\d+)\s*l\b/gi, '$1 liters')
    .replace(/\b(\d+)\s*kg\b/gi, '$1 kilograms')
    .replace(/\b(\d+)\s*g\b/gi, '$1 grams')
    .replace(/\b(\d+)\s*ha\b/gi, '$1 hectares')
    .replace(/\$(\d+(\.\d+)?)/g, '$1 dollars')
    .replace(/\b(\d+)\s*°C\b/gi, '$1 degrees Celsius')
    // Replace newlines with sentence pauses
    .replace(/[\n\r]+/g, '. ')
    // Strip any stray formatting characters
    .replace(/[*#~`_]/g, '')
    // Condense extra spaces
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
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

  // Cancel any currently playing speech to prevent overlap
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

  // Pick the most natural-sounding voice available in browser
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice =
    voices.find((v) => v.lang === utterance.lang) ||
    voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2))) ||
    voices.find((v) => v.default);

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.rate = 0.92; // Slightly measured, clear conversational speed
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis playback notice:', e);
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
