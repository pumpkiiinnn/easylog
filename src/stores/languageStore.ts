import { create } from 'zustand';
import i18n from '../i18n';

interface LanguageState {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: i18n.language,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ currentLanguage: lang });
  },
})); 