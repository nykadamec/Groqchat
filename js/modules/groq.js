// ---- Groq API Integration ----
import { API_CONFIG } from './config.js';
import { t } from './i18n.js';

let groq = null;

export async function initializeGroq(apiKey) {
  if (!apiKey) return false;

  try {
    // Dynamic import for Groq SDK
    const { Groq } = await import(API_CONFIG.groqSdkUrl);
    groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    return true;
  } catch (err) {
    console.error('Chyba při inicializaci Groq API:', err.message);
    return false;
  }
}

export function getGroqInstance() {
  return groq;
}

export function validateApiKey(key) {
  // Basic validation for Groq API key format
  return key && key.startsWith('gsk_') && key.length > 20;
}

export function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('active');
    setTimeout(() => errorElement.classList.remove('active'), 5000);
  }
}