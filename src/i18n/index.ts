import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './locales/en-US';
import zhCN from './locales/zh-CN';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enUS,
      },
      zh: {
        translation: zhCN,
      },
    },
    lng: 'en', // 修改默认语言为英文
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 