// ---- Internationalization System ----
let translations = {};
let currentLanguage = 'czech';

// Language code mapping
const languageMap = {
  'czech': 'cs',
  'english': 'en',
  'cs': 'cs',
  'en': 'en'
};

export async function loadLanguage(lang) {
  try {
    const fileName = languageMap[lang] || lang;
    const response = await fetch(`../../locales/${fileName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    return true;
  } catch (error) {
    console.error('Error loading language file:', error);
    // Fallback to default language
    if (lang !== 'cs' && lang !== 'czech') {
      return loadLanguage('cs');
    }
    return false;
  }
}

export function t(key) {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function setCurrentLanguage(lang) {
  currentLanguage = lang;
}