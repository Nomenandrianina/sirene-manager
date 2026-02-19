import { useEffect, useState } from 'react';
import i18n from './index';

export const useTranslation = () => {
  const [language, setLang] = useState(i18n.getLanguage());

  useEffect(() => {
    const unsubscribe = i18n.addListener((newLang) => setLang(newLang));
    return unsubscribe;
  }, []);

  return {
    t: i18n.t,
    tf: i18n.tf,
    language,
    setLanguage: i18n.setLanguage,
  };
};

export default useTranslation;