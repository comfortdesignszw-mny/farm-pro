import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sn from './locales/sn.json';
import nd from './locales/nd.json';

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('farmpro_language') || 'en' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sn: { translation: sn },
    nd: { translation: nd },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const changeAppLanguage = (lang: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('farmpro_language', lang);
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
