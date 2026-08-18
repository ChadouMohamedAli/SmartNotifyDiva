import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n, t } = useTranslation();
  const language = useMemo(() => {
    const rawLanguage = i18n.resolvedLanguage || i18n.language || 'fr';
    return rawLanguage.split('-')[0];
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('i18nextLng', language);
  }, [language]);

  const setLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ toggleLanguage, setLanguage, language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
