import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './translations/en';
import fr from './translations/fr';
import mg from './translations/mg';

const translations = { fr, en, mg };
let currentLanguage = 'fr';
let listeners = [];

export const i18n = {
  init: async () => {
    const saved = await AsyncStorage.getItem('app_language');
    currentLanguage = saved || 'fr';
  },

  setLanguage: async (lang) => {
    currentLanguage = lang;
    await AsyncStorage.setItem('app_language', lang);
    listeners.forEach(l => l(lang));
  },

  getLanguage: () => currentLanguage,

  t: (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  },

  tf: (key, ...args) => {
    let text = i18n.t(key);
    args.forEach(arg => { text = text.replace('%s', arg); });
    return text;
  },

  addListener: (listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
};

export default i18n;