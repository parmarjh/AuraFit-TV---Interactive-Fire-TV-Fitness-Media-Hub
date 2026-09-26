import { VoiceLanguage } from '../types';

export interface VoiceLanguageConfig {
  id: VoiceLanguage;
  name: string;
  nativeName: string;
  badge: string;
  recognitionCode: string;
  speechCode: string;
  flag: string;
  listeningPrompt: string;
  alexaTitle: string;
  samplePrompts: string[];
}

export const VOICE_LANGUAGES: Record<VoiceLanguage, VoiceLanguageConfig> = {
  en: {
    id: 'en',
    name: 'English',
    nativeName: 'English (US/IN)',
    badge: 'EN',
    recognitionCode: 'en-US',
    speechCode: 'en-US',
    flag: '🌐',
    listeningPrompt: 'Listening for Alexa command...',
    alexaTitle: 'Alexa (English)',
    samplePrompts: [
      'Play Zee Cinema HD',
      'Start 25-minute HIIT workout',
      'Turn workout fan to level 3',
      'What is my current heart rate?',
      'Switch voice to Hindi',
    ],
  },
  hi: {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    badge: 'हिन्दी',
    recognitionCode: 'hi-IN',
    speechCode: 'hi-IN',
    flag: '🇮🇳',
    listeningPrompt: 'अलेक्सा सुन रही है... आदेश बोलिए',
    alexaTitle: 'अलेक्सा (हिन्दी)',
    samplePrompts: [
      'ज़ी सिनेमा एचडी चलाओ',
      'वर्कआउट शुरू करो',
      'हार्ट रेट कितना है?',
      'कूलिंग पंखा चालू करो',
      'गुजराती आवाज लगाओ',
    ],
  },
  gu: {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    badge: 'ગુજરાતી',
    recognitionCode: 'gu-IN',
    speechCode: 'gu-IN',
    flag: '🇮🇳',
    listeningPrompt: 'એલેક્સા સાંભળી રહી છે... કહો',
    alexaTitle: 'એલેક્સા (ગુજરાતી)',
    samplePrompts: [
      'ઝી સિનેમા એચડી ચલાવો',
      'વર્કઆઉટ શરૂ કરો',
      'મારા ધબકારા કેટલા છે?',
      'પંખો લેવલ 3 પર કરો',
      'અવાજ અંગ્રેજી કરો',
    ],
  },
};

const STORAGE_KEY = 'aurafit_voice_language';

// Keep voices cached
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getStoredVoiceLanguage(): VoiceLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as VoiceLanguage;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
      return saved;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return 'en';
}

export function setStoredVoiceLanguage(lang: VoiceLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Speaks text using Web Speech Synthesis in English, Hindi, or Gujarati
 */
export function speakVoiceResponse(text: string, lang: VoiceLanguage = 'en'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Cancel any previous pending utterances
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const config = VOICE_LANGUAGES[lang] || VOICE_LANGUAGES.en;
    utterance.lang = config.speechCode;
    utterance.rate = 0.95; // Slightly measured for clarity
    utterance.pitch = 1.0;

    // Refresh voices if empty
    if (!cachedVoices || cachedVoices.length === 0) {
      cachedVoices = window.speechSynthesis.getVoices();
    }

    if (cachedVoices && cachedVoices.length > 0) {
      let matchedVoice = cachedVoices.find(
        (v) =>
          v.lang.toLowerCase() === config.speechCode.toLowerCase() ||
          v.lang.toLowerCase().replace('_', '-').startsWith(config.id)
      );

      // Fallback for Indian accent/locale if Gujarati specific voice is not installed
      if (!matchedVoice && lang === 'gu') {
        matchedVoice = cachedVoices.find(
          (v) =>
            v.lang.toLowerCase().includes('gu') ||
            v.lang.toLowerCase().includes('hi') ||
            v.lang.toLowerCase().includes('in')
        );
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis not permitted or unavailable:', err);
  }
}

/**
 * High-fidelity voice sample for trying Gujarati, Hindi, or English
 */
export const VOICE_TRY_SAMPLES: Record<VoiceLanguage, { phrase: string; translation: string }> = {
  gu: {
    phrase: 'નમસ્તે! અવાજ હવે ગુજરાતીમાં સેટ થઈ ગયો છે. ઝી સિનેમા એચડી લાઈવ શરૂ કરીએ છીએ.',
    translation: 'Namaste! Voice set to Gujarati. Starting Zee Cinema HD live.',
  },
  hi: {
    phrase: 'नमस्ते! आवाज अब हिन्दी में सेट कर दी गई है। ज़ी सिनेमा एचडी लाइव शुरू कर रहे हैं।',
    translation: 'Namaste! Voice set to Hindi. Starting Zee Cinema HD live.',
  },
  en: {
    phrase: 'Hello! Voice assistant is set to English. Tuning to Zee Cinema HD live broadcast on ZEE5.',
    translation: 'English voice ready. Playing Zee Cinema HD.',
  },
};

export function tryVoiceSample(lang: VoiceLanguage): { phrase: string; translation: string } {
  const sample = VOICE_TRY_SAMPLES[lang];
  speakVoiceResponse(sample.phrase, lang);
  return sample;
}

