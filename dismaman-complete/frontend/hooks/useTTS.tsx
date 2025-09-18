import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TTSHook {
  isPlaying: boolean;
  isSpeechEnabled: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  toggleSpeech: () => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
}

const TTS_SETTINGS_KEY = 'tts_settings';

interface TTSSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
}

const defaultSettings: TTSSettings = {
  enabled: true,
  rate: 0.8,  // Slightly slower for children
  pitch: 1.1, // Slightly higher pitch for warmth
};

export const useTTS = (): TTSHook => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [settings, setSettings] = useState<TTSSettings>(defaultSettings);
  const [currentUtterance, setCurrentUtterance] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    initializeVoice();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(TTS_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setIsSpeechEnabled(parsedSettings.enabled);
      }
    } catch (error) {
      console.error('Error loading TTS settings:', error);
    }
  };

  const saveSettings = async (newSettings: TTSSettings) => {
    try {
      await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  };

  const initializeVoice = async () => {
    try {
      // Get available voices
      const voices = await Speech.getAvailableVoicesAsync();
      
      // Find a female French voice if available
      const frenchVoices = voices.filter(voice => 
        voice.language.startsWith('fr') || voice.language.startsWith('fr-FR')
      );
      
      // Prefer female voices with names that suggest warmth
      const preferredVoice = frenchVoices.find(voice =>
        voice.name.toLowerCase().includes('marie') ||
        voice.name.toLowerCase().includes('aurelie') ||
        voice.name.toLowerCase().includes('female') ||
        voice.quality === 'Enhanced'
      );

      if (preferredVoice) {
        console.log('Selected TTS voice:', preferredVoice.name);
      }
    } catch (error) {
      console.error('Error initializing voice:', error);
    }
  };

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isSpeechEnabled || !text.trim()) {
      return;
    }

    try {
      // Stop any current speech
      await Speech.stop();
      
      setIsPlaying(true);
      setCurrentUtterance(text);

      const options: Speech.SpeechOptions = {
        language: 'fr-FR',
        pitch: settings.pitch,
        rate: settings.rate,
        quality: 'Enhanced',
        voice: undefined, // Use system default or preferred voice
        onStart: () => {
          setIsPlaying(true);
        },
        onDone: () => {
          setIsPlaying(false);
          setCurrentUtterance(null);
        },
        onStopped: () => {
          setIsPlaying(false);
          setCurrentUtterance(null);
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsPlaying(false);
          setCurrentUtterance(null);
        },
      };

      await Speech.speak(text, options);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
      setCurrentUtterance(null);
    }
  }, [isSpeechEnabled, settings]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsPlaying(false);
    setCurrentUtterance(null);
  }, []);

  const pause = useCallback(() => {
    // Note: expo-speech doesn't support pause/resume
    // We'll stop instead
    stop();
  }, [stop]);

  const resume = useCallback(() => {
    // Resume functionality would require re-speaking from current position
    // For now, we'll just restart if there's a current utterance
    if (currentUtterance) {
      speak(currentUtterance);
    }
  }, [currentUtterance, speak]);

  const toggleSpeech = useCallback(() => {
    const newEnabled = !isSpeechEnabled;
    setIsSpeechEnabled(newEnabled);
    
    const newSettings = { ...settings, enabled: newEnabled };
    saveSettings(newSettings);
    
    if (!newEnabled && isPlaying) {
      stop();
    }
  }, [isSpeechEnabled, settings, isPlaying, stop]);

  const setRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.1, Math.min(2.0, rate));
    const newSettings = { ...settings, rate: clampedRate };
    saveSettings(newSettings);
  }, [settings]);

  const setPitch = useCallback((pitch: number) => {
    const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));
    const newSettings = { ...settings, pitch: clampedPitch };
    saveSettings(newSettings);
  }, [settings]);

  return {
    isPlaying,
    isSpeechEnabled,
    speak,
    stop,
    pause,
    resume,
    toggleSpeech,
    setRate,
    setPitch,
  };
};

// TTS Test utility for development
export const testTTS = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('Available voices:', voices.map(v => `${v.name} (${v.language})`));
    
    await Speech.speak('Bonjour ! Je suis ton assistante vocale pour Dis Maman !', {
      language: 'fr-FR',
      pitch: 1.1,
      rate: 0.8,
      quality: 'Enhanced',
    });
  } catch (error) {
    console.error('TTS Test error:', error);
  }
};